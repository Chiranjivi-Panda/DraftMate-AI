"""
Action queue for Voice Agent.
Holds pending actions that may require confirmation before execution.
"""
from __future__ import annotations

import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Optional


class ActionStatus(str, Enum):
    PENDING = "pending"
    AWAITING_CONFIRM = "awaiting_confirm"
    CONFIRMED = "confirmed"
    EXECUTING = "executing"
    DONE = "done"
    CANCELLED = "cancelled"
    FAILED = "failed"


@dataclass
class Action:
    id: str
    intent_type: str
    slots: Dict[str, Any]
    status: ActionStatus = ActionStatus.PENDING
    requires_confirmation: bool = False
    created_at: float = field(default_factory=time.time)
    result: Optional[Any] = None
    error: Optional[str] = None
    speech_feedback: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "intent_type": self.intent_type,
            "slots": self.slots,
            "status": self.status.value,
            "requires_confirmation": self.requires_confirmation,
            "created_at": self.created_at,
            "result": self.result,
            "error": self.error,
            "speech_feedback": self.speech_feedback,
        }


class ActionQueue:
    """
    FIFO queue with confirmation gate support.
    Only one action can be awaiting confirmation at a time.
    """

    def __init__(self, max_size: int = 20):
        self._queue: List[Action] = []
        self._history: List[Action] = []
        self.max_size = max_size
        self._handlers: Dict[str, Callable[[Action], Any]] = {}

    def register_handler(self, intent_type: str, handler: Callable[[Action], Any]) -> None:
        self._handlers[intent_type] = handler

    def enqueue(self, intent_type: str, slots: Optional[Dict] = None, requires_confirmation: bool = False) -> Action:
        if len(self._queue) >= self.max_size:
            # drop oldest pending that is not awaiting confirm
            for i, a in enumerate(self._queue):
                if a.status == ActionStatus.PENDING:
                    self._queue.pop(i)
                    break
        action = Action(
            id=str(uuid.uuid4())[:8],
            intent_type=intent_type,
            slots=slots or {},
            requires_confirmation=requires_confirmation,
            status=ActionStatus.AWAITING_CONFIRM if requires_confirmation else ActionStatus.PENDING,
        )
        # generate default speech feedback
        action.speech_feedback = self._default_feedback(action)
        self._queue.append(action)
        return action

    def _default_feedback(self, action: Action) -> str:
        t = action.intent_type
        if action.requires_confirmation and action.status == ActionStatus.AWAITING_CONFIRM:
            return f"I heard a request to {t.replace('_', ' ')}. Please say confirm or cancel."
        mapping = {
            "verify": "Running verification on the document.",
            "export": f"Exporting as {action.slots.get('format', 'document')}.",
            "write": "Writing the requested content.",
            "edit": "Applying the edit.",
            "undo": "Undoing the last change.",
            "redo": "Redoing the last change.",
            "help": "Here are the available voice commands.",
            "open_panel": f"Opening the {action.slots.get('panel', '')} panel.",
            "run_skill": f"Running skill {action.slots.get('skill', '')}.",
            "select_model": f"Switching to model {action.slots.get('model', '')}.",
            "insert_citation": "Inserting a citation.",
            "confirm": "Confirmed.",
            "cancel": "Cancelled.",
        }
        return mapping.get(t, f"Executing {t.replace('_', ' ')}.")

    def confirm(self, action_id: Optional[str] = None) -> Optional[Action]:
        """Confirm the action awaiting confirmation (or specific id)."""
        target = None
        if action_id:
            for a in self._queue:
                if a.id == action_id and a.status == ActionStatus.AWAITING_CONFIRM:
                    target = a
                    break
        else:
            for a in self._queue:
                if a.status == ActionStatus.AWAITING_CONFIRM:
                    target = a
                    break
        if not target:
            return None
        target.status = ActionStatus.CONFIRMED
        target.speech_feedback = "Confirmed. Executing now."
        return target

    def cancel(self, action_id: Optional[str] = None) -> Optional[Action]:
        target = None
        if action_id:
            for a in self._queue:
                if a.id == action_id:
                    target = a
                    break
        else:
            for a in self._queue:
                if a.status in (ActionStatus.AWAITING_CONFIRM, ActionStatus.PENDING, ActionStatus.CONFIRMED):
                    target = a
                    break
        if not target:
            return None
        target.status = ActionStatus.CANCELLED
        target.speech_feedback = "Action cancelled."
        self._history.append(target)
        self._queue = [a for a in self._queue if a.id != target.id]
        return target

    def next_ready(self) -> Optional[Action]:
        """Return the next action that is ready to execute (PENDING or CONFIRMED)."""
        for a in self._queue:
            if a.status in (ActionStatus.PENDING, ActionStatus.CONFIRMED):
                return a
        return None

    def execute_next(self) -> Optional[Action]:
        action = self.next_ready()
        if not action:
            return None
        action.status = ActionStatus.EXECUTING
        handler = self._handlers.get(action.intent_type)
        try:
            if handler:
                action.result = handler(action)
            action.status = ActionStatus.DONE
            if not action.speech_feedback:
                action.speech_feedback = self._default_feedback(action)
        except Exception as e:
            action.status = ActionStatus.FAILED
            action.error = str(e)
            action.speech_feedback = f"Sorry, that action failed: {str(e)[:80]}"
        self._history.append(action)
        self._queue = [a for a in self._queue if a.id != action.id]
        return action

    def pending(self) -> List[Dict]:
        return [a.to_dict() for a in self._queue]

    def history(self, limit: int = 10) -> List[Dict]:
        return [a.to_dict() for a in self._history[-limit:]]

    def clear(self) -> None:
        self._queue.clear()
