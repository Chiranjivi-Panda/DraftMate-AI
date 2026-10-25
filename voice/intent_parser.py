"""
Intent parser for DraftMate Voice Agent.
Maps natural-language utterances (from Web Speech API) to structured actions.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class IntentType(str, Enum):
    WRITE = "write"
    EDIT = "edit"
    VERIFY = "verify"
    EXPORT = "export"
    INSERT_CITATION = "insert_citation"
    UNDO = "undo"
    REDO = "redo"
    SELECT_MODEL = "select_model"
    RUN_SKILL = "run_skill"
    OPEN_PANEL = "open_panel"
    CONFIRM = "confirm"
    CANCEL = "cancel"
    HELP = "help"
    UNKNOWN = "unknown"


@dataclass
class Intent:
    type: IntentType
    confidence: float
    slots: Dict[str, Any] = field(default_factory=dict)
    raw: str = ""
    requires_confirmation: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type.value,
            "confidence": self.confidence,
            "slots": self.slots,
            "raw": self.raw,
            "requires_confirmation": self.requires_confirmation,
        }


# Pattern table: (compiled_regex, IntentType, slot_extractors, requires_confirm, base_confidence)
_PATTERNS: List[tuple] = []


def _add(pattern: str, intent: IntentType, slots: Optional[Dict] = None, confirm: bool = False, conf: float = 0.85):
    _PATTERNS.append((re.compile(pattern, re.I), intent, slots or {}, confirm, conf))


# --- patterns ---
_add(r"^(?:please\s+)?(?:write|draft|compose|create)\s+(?:a\s+|an\s+)?(.+)$", IntentType.WRITE, {"text": 1}, False, 0.9)
_add(r"^(?:please\s+)?(?:edit|change|modify|update|rewrite)\s+(?:the\s+)?(?:text\s+)?(?:to\s+)?(.+)$", IntentType.EDIT, {"text": 1}, True, 0.88)
_add(r"^(?:please\s+)?(?:verify|check|validate|fact[\s-]?check)\s*(?:citations?|this|document)?$", IntentType.VERIFY, {}, False, 0.92)
_add(r"^(?:please\s+)?(?:export|download|save)\s+(?:as\s+|to\s+)?(docx|pdf|word|document)?$", IntentType.EXPORT, {"format": 1}, False, 0.9)
_add(r"^(?:please\s+)?(?:export|download)\s+(?:as\s+)?(docx|pdf)$", IntentType.EXPORT, {"format": 1}, False, 0.92)
_add(r"^(?:please\s+)?(?:insert|add)\s+(?:a\s+)?(?:citation|reference|source)\s*(?:for\s+)?(.+)?$", IntentType.INSERT_CITATION, {"query": 1}, False, 0.85)
_add(r"^(?:please\s+)?(?:undo|go\s+back)$", IntentType.UNDO, {}, False, 0.95)
_add(r"^(?:please\s+)?(?:redo)$", IntentType.REDO, {}, False, 0.95)
_add(r"^(?:please\s+)?(?:use|switch\s+to|select)\s+(?:model\s+)?([\w\.\-]+)$", IntentType.SELECT_MODEL, {"model": 1}, False, 0.88)
_add(r"^(?:please\s+)?(?:run|execute|apply)\s+(?:skill\s+)?([\w\-]+)$", IntentType.RUN_SKILL, {"skill": 1}, True, 0.87)
_add(r"^(?:please\s+)?(?:open|show)\s+(?:the\s+)?(verification|skills?|context|history|settings)\s*(?:panel)?$", IntentType.OPEN_PANEL, {"panel": 1}, False, 0.9)
_add(r"^(?:yes|confirm|proceed|do\s+it|go\s+ahead|ok|okay)$", IntentType.CONFIRM, {}, False, 0.97)
_add(r"^(?:no|cancel|stop|abort|never\s*?mind)$", IntentType.CANCEL, {}, False, 0.97)
_add(r"^(?:help|what\s+can\s+you\s+do|commands?)$", IntentType.HELP, {}, False, 0.95)


def parse_intent(utterance: str) -> Intent:
    """
    Parse a spoken/text utterance into a structured Intent.
    Conservative: prefers UNKNOWN over wrong high-confidence matches.
    """
    text = (utterance or "").strip()
    if not text:
        return Intent(IntentType.UNKNOWN, 0.0, raw=text)

    # normalize whitespace
    normalized = re.sub(r"\s+", " ", text)

    for regex, intent_type, slot_map, requires_confirm, base_conf in _PATTERNS:
        m = regex.match(normalized)
        if not m:
            continue
        slots: Dict[str, Any] = {}
        for key, group_idx in slot_map.items():
            try:
                val = m.group(group_idx)
                if val is not None:
                    slots[key] = val.strip()
            except IndexError:
                pass
        # slight confidence boost for exact short commands
        conf = min(0.99, base_conf + (0.05 if len(normalized.split()) <= 3 else 0))
        return Intent(
            type=intent_type,
            confidence=conf,
            slots=slots,
            raw=text,
            requires_confirmation=requires_confirm,
        )

    # fallback keyword heuristics
    lower = normalized.lower()
    if any(w in lower for w in ("verify", "check citations", "fact check")):
        return Intent(IntentType.VERIFY, 0.7, raw=text)
    if any(w in lower for w in ("export", "download pdf", "save as")):
        fmt = "pdf" if "pdf" in lower else "docx" if "docx" in lower or "word" in lower else None
        return Intent(IntentType.EXPORT, 0.65, {"format": fmt} if fmt else {}, raw=text)

    return Intent(IntentType.UNKNOWN, 0.3, raw=text, slots={"text": text})


# Convenience for API
def parse_intent_dict(utterance: str) -> Dict[str, Any]:
    return parse_intent(utterance).to_dict()
