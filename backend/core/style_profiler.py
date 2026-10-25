"""Style Profiler — learns HOW a reference draft is written (not WHAT it says).

    style = await profile(markdown)      # → StyleProfile dict (camelCase keys, matches frontend/lib/types.ts)
    card  = style_card(style)            # → ~150-300 token block injected into drafting prompts

LLM-based when a key is configured, heuristic otherwise (so upload never fails).
"""
from __future__ import annotations

import asyncio
import hashlib
import logging
import re

from . import llm_gateway as gw

log = logging.getLogger("draftmate.style")
_CACHE: dict[str, dict] = {}

_TERMS = [
    "hereinbefore", "hereinafter", "hereby", "aforesaid", "without prejudice", "notwithstanding", "the noticee",
    "the lessor", "the lessee", "the said", "whereas", "thereof", "therein", "at your risk as to costs", "kindly",
    "vide", "inter alia", "per se", "forthwith", "the deponent", "the petitioner", "the respondent",
]
_CLAUSES = [
    (r"within\s+(?:\w+\s*)?\(?\d+\)?\s+days", "Time-bound demand / compliance period"),
    (r"without prejudice", "Reservation of rights"),
    (r"registered post|speed post|a\.d\.", "Registered / Speed Post dispatch"),
    (r"arbitrat", "Arbitration clause"),
    (r"jurisdiction", "Jurisdiction clause"),
    (r"indemnif", "Indemnity clause"),
    (r"terminat", "Termination clause"),
    (r"confidential", "Confidentiality clause"),
    (r"force majeure", "Force majeure clause"),
    (r"verif", "Verification clause"),
]
_KEYS = ("tone", "structure", "terminology", "clausePatterns", "formatting")


def _heuristic(md: str) -> dict:
    low = md.lower()
    sentences = [s for s in re.split(r"[.!?]\s", md) if len(s.split()) > 3]
    avg = sum(len(s.split()) for s in sentences) / max(1, len(sentences))
    terms = [t for t in _TERMS if t in low][:6]
    assertive = len(re.findall(r"\b(shall|failing which|liable|constrained|demand)\b", low)) >= 2
    tone = ("Formal, " if (avg > 16 or terms) else "Plain, ") + ("assertive, " if assertive else "measured, ") + "third-person"
    heads = [h.strip() for h in re.findall(r"^#{1,3}\s+(.+)$", md, re.M)][:6]
    numbered = len(re.findall(r"^\s*\d+[.)]\s", md, re.M))
    if heads:
        structure = " → ".join(h.title() for h in heads)
    elif numbered >= 3:
        structure = "Opening → numbered paragraphs → demand / relief → closing"
    else:
        structure = "Continuous prose paragraphs"
    bits = []
    if numbered >= 3:
        bits.append("Numbered paragraphs")
    if "**" in md:
        bits.append("Bold headings")
    if heads:
        bits.append("Markdown-style headings")
    clauses = [label for rx, label in _CLAUSES if re.search(rx, low)][:5]
    return {
        "tone": tone,
        "structure": structure,
        "terminology": terms or ["(no distinctive terms detected)"],
        "clausePatterns": clauses or ["(no distinctive clause patterns detected)"],
        "formatting": " · ".join(bits) or "Plain paragraphs",
    }


def _sanitize(d: dict, fallback: dict) -> dict:
    out = {}
    for k in _KEYS:
        v = d.get(k)
        if k in ("terminology", "clausePatterns"):
            out[k] = [str(x)[:80] for x in v][:8] if isinstance(v, list) and v else fallback[k]
        else:
            out[k] = str(v)[:240] if isinstance(v, str) and v.strip() else fallback[k]
    return out


_SYSTEM = """You are a legal drafting-style analyst. Study the document and describe HOW it is written, never WHAT it is about.
Return ONLY a JSON object with exactly these keys:
  "tone": short phrase (register, voice, assertiveness),
  "structure": the document's skeleton as 'A → B → C',
  "terminology": array of up to 6 distinctive phrases/terms the author habitually uses,
  "clausePatterns": array of up to 5 recurring clause/drafting patterns (e.g. 'Time-bound demand (15 days)'),
  "formatting": short phrase (numbering, headings, bold, alignment).
Do NOT include party names, amounts, dates, addresses or any facts of the matter."""


def _clip(md: str, n: int = 14000) -> str:
    return md if len(md) <= n else md[:9000] + "\n...\n" + md[-4000:]


async def profile(markdown: str, model: str | None = None) -> dict:
    key = hashlib.sha1((markdown[:20000] + str(model)).encode("utf-8", "ignore")).hexdigest()
    if key in _CACHE:
        return _CACHE[key]
    base = _heuristic(markdown)
    result = base
    if gw.llm_available() and markdown.strip():
        try:
            d = await asyncio.wait_for(gw.complete_json(_SYSTEM, _clip(markdown), model), 30)
            result = _sanitize(d, base)
        except Exception as e:
            log.warning("LLM style profiling failed → heuristic: %s", e)
    _CACHE[key] = result
    return result


def style_card(style: dict | None) -> str:
    if not style:
        return ""
    return (
        "STYLE CARD — mirror this author's drafting style (tone, structure, phrasing, formatting). "
        "Never copy facts from the reference; the substantive law and meaning must stay correct.\n"
        f"- Tone: {style.get('tone', '')}\n"
        f"- Structure: {style.get('structure', '')}\n"
        f"- Preferred terms: {', '.join(style.get('terminology', []))}\n"
        f"- Clause patterns: {'; '.join(style.get('clausePatterns', []))}\n"
        f"- Formatting: {style.get('formatting', '')}"
    )
