"""
Confirm Gate — ensures destructive or high-impact actions require explicit confirmation
before the ActionQueue will execute them.
"""
from __future__ import annotations

from typing import Optional, Set

from .action_queue import Action, ActionQueue, ActionStatus
from .intent_parser import Intent, IntentType, parse_intent


# Intents that always require confirmation
DEFAULT_CONFIRM_REQUIRED: Set[str] = {
    IntentType.EDIT.value,
    IntentType.RUN_SKILL.value,
}


class ConfirmGate:
    """
    Wraps ActionQueue and enforces confirmation for sensitive intents.
    Voice flow:
      1. User speaks → parse_intent
      2. Gate decides if confirmation needed → enqueue with flag
      3. If needed, speak prompt and wait for CONFIRM / CANCEL
      4. On CONFIRM → execute; on CANCEL → drop
    """

    def __init__(
        self,
        queue: Optional[ActionQueue] = None,
        confirm_required: Optional[Set[str]] = None,
    ):
        self.queue = queue or ActionQueue()
        self.confirm_required = confirm_required or set(DEFAULT_CONFIRM_REQUIRED)
        self._awaiting_id: Optional[str] = None

    def process_utterance(self, utterance: str) -> dict:
        """
        Main entry: take raw speech text, return structured response for the UI / TTS.
        """
        intent = parse_intent(utterance)

        # Handle meta-intents first
        if intent.type == IntentType.CONFIRM:
            action = self.queue.confirm(self._awaiting_id)
            self._awaiting_id = None
            if action:
                executed = self.queue.execute_next()
                return {
                    "ok": True,
                    "intent": intent.to_dict(),
                    "action": (executed or action).to_dict(),
                    "speech": (executed or action).speech_feedback or "Done.",
                    "state": "executed",
                }
            return {
                "ok": False,
                "intent": intent.to_dict(),
                "speech": "Nothing is waiting for confirmation.",
                "state": "idle",
            }

        if intent.type == IntentType.CANCEL:
            action = self.queue.cancel(self._awaiting_id)
            self._awaiting_id = None
            return {
                "ok": True,
                "intent": intent.to_dict(),
                "action": action.to_dict() if action else None,
                "speech": action.speech_feedback if action else "Nothing to cancel.",
                "state": "cancelled",
            }

        if intent.type == IntentType.UNKNOWN:
            return {
                "ok": False,
                "intent": intent.to_dict(),
                "speech": "Sorry, I didn't catch that. Try saying help for available commands.",
                "state": "unknown",
            }

        if intent.type == IntentType.HELP:
            return {
                "ok": True,
                "intent": intent.to_dict(),
                "speech": (
                    "You can say: write a paragraph, edit the text, verify citations, "
                    "export as PDF or DOCX, run a skill, open verification panel, undo, or redo. "
                    "Some actions will ask you to confirm."
                ),
                "state": "help",
            }

        # Decide confirmation
        needs_confirm = (
            intent.requires_confirmation
            or intent.type.value in self.confirm_required
            or intent.confidence < 0.75
        )

        action = self.queue.enqueue(
            intent_type=intent.type.value,
            slots=intent.slots,
            requires_confirmation=needs_confirm,
        )

        if needs_confirm:
            self._awaiting_id = action.id
            return {
                "ok": True,
                "intent": intent.to_dict(),
                "action": action.to_dict(),
                "speech": action.speech_feedback,
                "state": "awaiting_confirm",
            }

        # Execute immediately
        executed = self.queue.execute_next()
        return {
            "ok": True,
            "intent": intent.to_dict(),
            "action": (executed or action).to_dict(),
            "speech": (executed or action).speech_feedback or "Done.",
            "state": "executed",
        }

    def status(self) -> dict:
        return {
            "pending": self.queue.pending(),
            "awaiting_id": self._awaiting_id,
            "history": self.queue.history(5),
        }
