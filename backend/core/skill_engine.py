"""Skill Engine — YAML loader (hot-reload), router (heuristic + LLM), chaining, prompt builder.

* Drop a new YAML into /skills → it appears in GET /api/skills on the next request (no restart).
* Chaining: pass skill_id="legal_research+legal_notice" → steps run in order; earlier
  steps' output is fed to the next as research notes, only the LAST step streams to the UI.
"""
from __future__ import annotations

import asyncio
import logging
import os
import re
from dataclasses import dataclass, field
from pathlib import Path

import yaml

from . import llm_gateway as gw

log = logging.getLogger("draftmate.skills")

ROOT = Path(__file__).resolve().parents[2]
SKILLS_DIR = Path(os.getenv("SKILLS_DIR") or ROOT / "skills")
DEFAULT_SKILL_ID = os.getenv("DEFAULT_SKILL_ID", "legal_notice")

GLOBAL_RULES = """You are DraftMate, an AI drafting assistant for Indian advocates, law students and legal researchers.
Default to Indian law and Indian drafting conventions unless the instruction says otherwise.

HARD RULES (never break these):
1. NEVER invent case law, citations, section numbers, dates, amounts or facts. If you are not certain an authority exists and says what you claim, do not cite it; write "[No authority available — advocate to supply]" instead.
2. Wrap EVERY authority (case, statute section, article, rule, order) exactly as [CITE: <authority>] — one authority per marker, no square brackets inside, e.g.
   [CITE: Section 138, Negotiable Instruments Act, 1881]
   [CITE: Meters and Instruments Pvt. Ltd. v. Kanchan Mehta, (2018) 1 SCC 560]
   Never mention an authority outside a marker.
3. Output Markdown only. Title as '# TITLE'. Section headings as '## Heading'. Number body paragraphs as plain lines '1. text', each separated by a blank line (no nested lists, no tables). Use **bold** sparingly.
4. For missing facts use clear placeholders such as [PARTY NAME], [DATE], ___ — do not make facts up.
5. Output ONLY the document. No preface, no explanations, no code fences."""


@dataclass
class Skill:
    id: str
    name: str
    system_prompt: str
    category: str = "General"
    description: str = ""
    triggers: list = field(default_factory=list)
    example: str = ""
    requires_verification: bool = False
    icon: str = ""
    order: int = 100
    inputs: list = field(default_factory=list)
    uses_reference_style: bool = True
    output_format: str = "markdown"
    temperature: float = 0.3
    max_tokens: int = 3000
    checklist: list = field(default_factory=list)

    def public(self) -> dict:
        """Exactly the `Skill` shape in frontend/lib/types.ts."""
        return {
            "id": self.id, "name": self.name, "category": self.category, "description": self.description,
            "triggers": self.triggers, "example": self.example,
            "requires_verification": self.requires_verification, "icon": self.icon,
        }


# ───────────────────────────── loader (hot reload) ─────────────────────────────
_cache: dict = {"sig": None, "skills": {}}


def _signature():
    if not SKILLS_DIR.exists():
        return ()
    return tuple(sorted((p.name, p.stat().st_mtime_ns) for p in SKILLS_DIR.glob("*.y*ml")))


def _from_dict(raw: dict, path: Path) -> Skill:
    for k in ("id", "name", "system_prompt"):
        if not raw.get(k):
            raise ValueError(f"missing required field '{k}'")
    return Skill(
        id=str(raw["id"]).strip(), name=str(raw["name"]).strip(), system_prompt=str(raw["system_prompt"]),
        category=str(raw.get("category", "General")), description=str(raw.get("description", "")),
        triggers=[str(t).lower() for t in (raw.get("triggers") or [])], example=str(raw.get("example", "")),
        requires_verification=bool(raw.get("requires_verification", False)), icon=str(raw.get("icon", "")),
        order=int(raw.get("order", 100)), inputs=list(raw.get("inputs") or []),
        uses_reference_style=bool(raw.get("uses_reference_style", True)), output_format=str(raw.get("output_format", "markdown")),
        temperature=float(raw.get("temperature", 0.3)), max_tokens=int(raw.get("max_tokens", 3000)),
        checklist=list(raw.get("checklist") or []),
    )


def load_skills(force: bool = False) -> dict[str, Skill]:
    sig = _signature()
    if not force and sig == _cache["sig"]:
        return _cache["skills"]
    found: dict[str, Skill] = {}
    if SKILLS_DIR.exists():
        for p in sorted(SKILLS_DIR.glob("*.y*ml")):
            try:
                sk = _from_dict(yaml.safe_load(p.read_text(encoding="utf-8")) or {}, p)
                found[sk.id] = sk
            except Exception as e:
                log.warning("Skipping invalid skill file %s: %s", p.name, e)
    ordered = dict(sorted(found.items(), key=lambda kv: (kv[1].order, kv[0])))
    _cache.update(sig=sig, skills=ordered)
    log.info("Loaded %d skills from %s", len(ordered), SKILLS_DIR)
    return ordered


def get_skill(skill_id: str | None) -> Skill | None:
    return load_skills().get(skill_id or "")


def list_public() -> list[dict]:
    return [s.public() for s in load_skills().values()]


def resolve_chain(skill_id: str | None) -> list[Skill]:
    """'a+b+c' → [Skill a, Skill b, Skill c] (unknown ids dropped)."""
    if not skill_id:
        return []
    return [s for s in (get_skill(x.strip()) for x in skill_id.split("+")) if s]


# ───────────────────────────── router ─────────────────────────────
_NUM = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10}
_ORD = {"first": 1, "second": 2, "third": 3, "fourth": 4, "fifth": 5, "sixth": 6, "seventh": 7, "eighth": 8, "ninth": 9, "tenth": 10}
_NUMRX = r"\d+|" + "|".join(_NUM)


def parse_paragraph(t: str) -> int | None:
    m = re.search(rf"(?:paragraph|para|clause)\s+({_NUMRX})\b", t, re.I)
    if m:
        v = m.group(1).lower()
        return _NUM.get(v) or int(v)
    m = re.search(rf"\b({'|'.join(_ORD)})\s+(?:paragraph|para|clause)\b", t, re.I)
    return _ORD[m.group(1).lower()] if m else None


def match_skill(text: str) -> tuple[str | None, float]:
    """Best skill by trigger phrases. A trigger scores 10 per word when all its words appear (word-start match)."""
    t = text.lower()
    first = re.match(r"\W*(\w+)", t)
    first_w = first.group(1) if first else ""
    best_id, best = None, 0.0
    for s in load_skills().values():
        for trig in s.triggers:
            words = trig.split()
            if words and all(re.search(rf"\b{re.escape(w)}", t) for w in words):
                score = 10 * len(words) + min(len(trig), 20) / 20
                if len(words) == 1 and first_w.startswith(trig):
                    score += 3  # verb-first instruction ("Review ...", "Summarise ...")
                if score > best:
                    best_id, best = s.id, score
    return best_id, best


def heuristic_route(text: str, has_draft: bool) -> tuple[dict, str]:
    """→ (RouteResult dict, confidence 'high'|'low')."""
    raw = text.strip()
    t = raw.lower()
    m = re.match(r"^(?:dictate|add paragraph|insert)\s*[:,\-]?\s*(.+)$", raw, re.I | re.S)
    if m and (has_draft or re.match(r"^(dictate|add paragraph)", t)):
        return {"intent": "dictate", "text": m.group(1).strip()}, "high"
    if (re.search(r"\b(verify|check|validate)\b.*\b(citation|authorit|reference)", t)) or re.match(r"^verify\b", t):
        return {"intent": "verify"}, "high"
    if re.search(r"\b(export|download)\b|save as", t):
        return {"intent": "export"}, "high"
    if has_draft and re.search(r"\b(delete|remove)\b", t):
        r = {"intent": "delete"}
        n = parse_paragraph(t)
        if n:
            r["paragraph"] = n
        return r, "high"
    if (
        has_draft
        and re.search(r"\b(make|rewrite|rephrase|reword|shorten|simplify|formal|polish|tone|improve|fix|tighten|expand)\b", t)
        and not re.search(r"\b(draft|prepare|generate|write)\b", t)
    ):
        r = {"intent": "edit"}
        n = parse_paragraph(t)
        if n:
            r["paragraph"] = n
        return r, "high"
    sid, score = match_skill(t)
    r = {"intent": "draft"}
    if sid and score >= 10:
        r["skill_id"] = sid
        return r, "high"
    return r, "low"


_ROUTE_SYS = """You route user instructions inside a legal drafting app.
Reply with ONLY JSON: {{"intent": <one of draft, edit, verify, export, delete, dictate>, "skill_id": <id or null>, "paragraph": <int or null>, "text": <string or null>}}
- 'draft' = create a NEW document/analysis (set skill_id from the list). 'edit' = change the existing draft. 'delete' = remove paragraph(s). 'dictate' = text the user wants inserted verbatim (put it in "text").
- edit/delete are only valid when has_draft is true.
Skills:
{skills}"""


async def _llm_route(text: str, has_draft: bool) -> dict | None:
    skills = "\n".join(f"- {s.id}: {s.description}" for s in load_skills().values())
    d = await gw.complete_json(_ROUTE_SYS.format(skills=skills), f"has_draft: {has_draft}\nInstruction: {text}", os.getenv("ROUTER_MODEL"), 200)
    intent = d.get("intent")
    if intent not in {"draft", "edit", "verify", "export", "delete", "dictate"}:
        return None
    if intent in {"edit", "delete"} and not has_draft:
        intent = "draft"
    r: dict = {"intent": intent}
    if intent == "draft" and get_skill(d.get("skill_id")):
        r["skill_id"] = d["skill_id"]
    if isinstance(d.get("paragraph"), int):
        r["paragraph"] = d["paragraph"]
    if intent == "dictate" and d.get("text"):
        r["text"] = str(d["text"])
    return r


async def route(text: str, has_draft: bool) -> dict:
    r, conf = heuristic_route(text, has_draft)
    if conf == "low" and gw.llm_available():
        try:
            r = (await asyncio.wait_for(_llm_route(text, has_draft), 8)) or r
        except Exception as e:
            log.warning("LLM route failed → heuristic: %s", e)
    return r


# ───────────────────────────── prompt builder ─────────────────────────────
def build_prompts(skill: Skill, instruction: str, style_card_text: str = "", context_text: str = "", prior_notes: str = "") -> tuple[str, str]:
    system = f"{GLOBAL_RULES}\n\nSKILL: {skill.name}\n{skill.system_prompt.strip()}"
    if skill.uses_reference_style and style_card_text:
        system += f"\n\n{style_card_text}"
    parts = [f"INSTRUCTION:\n{instruction.strip()}"]
    if skill.inputs:
        names = ", ".join(i.get("name", "") + ("*" if i.get("required") else "") for i in skill.inputs if isinstance(i, dict))
        parts.append(f"Details this document normally needs (* = required): {names}. Use what the instruction provides; leave a [PLACEHOLDER] for the rest.")
    if context_text:
        parts.append("REFERENCE MATERIAL (from the user's uploaded documents; use for facts/clauses only if relevant to the instruction):\n" + context_text)
    if prior_notes:
        parts.append("NOTES FROM THE PREVIOUS STEP (use only authorities that appear here; still wrap them in [CITE: ...]):\n" + prior_notes)
    return system, "\n\n".join(parts)
