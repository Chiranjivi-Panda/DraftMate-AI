"""POST /api/edit {instruction, html, model, paragraph?} → {html, summary}

Safety net: the editor's HTML contains <span data-cite-id="cN"> citation spans. An edit is
REJECTED (original kept) if the model touched, added or removed any citation span.
"""
import html as htmllib
import logging
import re

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from core import llm_gateway as gw

log = logging.getLogger("draftmate.edit")
router = APIRouter(prefix="/api")

_P = re.compile(r"<p\b[^>]*>.*?</p>", re.S | re.I)
_CITE = re.compile(r'<span\b[^>]*data-cite-id="([^"]+)"[^>]*>(.*?)</span>', re.S | re.I)


class EditBody(BaseModel):
    instruction: str
    html: str
    model: str = "claude"
    paragraph: int | None = None


def _plain(s: str) -> str:
    return htmllib.unescape(re.sub(r"<[^>]+>", "", s))


def find_paragraph(html: str, n: int):
    ms = list(_P.finditer(html))
    for m in ms:
        if re.match(rf"\s*{n}[.)]\s", _plain(m.group(0))):
            return m.start(), m.end()
    if 1 <= n <= len(ms):
        return ms[n - 1].span()
    return None


def _cites(s: str):
    return [(i, t) for i, t in _CITE.findall(s)]


def _map_text(html: str, fn):
    out, protect = [], 0
    for seg in re.split(r"(<[^>]+>)", html):
        if seg.startswith("<"):
            if re.match(r"<span\b[^>]*data-cite-id", seg, re.I):
                protect += 1
            elif seg.lower().startswith("</span") and protect:
                protect -= 1
            out.append(seg)
        else:
            out.append(seg if protect else fn(seg))
    return "".join(out)


_FORMAL = [
    (r"\bplease note\b", "kindly take note"), (r"\bpay\b", "remit"), (r"\bwithin\b", "not later than"),
    (r"\bask\b", "request"), (r"\bget\b", "obtain"), (r"\babout\b", "regarding"), (r"\bmust\b", "shall"),
]
_SIMPLE = [(r"\bhereinbefore\b", "above"), (r"\bshall\b", "must"), (r"\bremit\b", "pay"), (r"\bconstrained to\b", "forced to"), (r"\bin terms of\b", "under")]


def _offline_edit(fragment: str, instruction: str):
    rules = _SIMPLE if re.search(r"simplif|plain|shorten", instruction, re.I) else _FORMAL
    count = 0

    def fn(text: str) -> str:
        nonlocal count
        new = text
        for rx, rep in rules:
            new = re.sub(rx, rep, new, flags=re.I)
        if new != text:
            count += 1
        return new

    return _map_text(fragment, fn), count


_SYSTEM = """You are an editing assistant for Indian legal documents.
Apply ONLY the user's instruction to the HTML fragment. Preserve meaning, facts, numbering and every HTML tag and attribute.
NEVER modify, add or remove <span data-cite-id="..."> citation spans or their text.
Return ONLY the edited HTML fragment — no explanation, no code fences."""


async def _llm_edit(instruction: str, fragment: str, model: str) -> str:
    out = await gw.complete(_SYSTEM, f"INSTRUCTION: {instruction}\n\nHTML FRAGMENT:\n{fragment}", model, 4000, 0.2)
    return re.sub(r"^```(?:html)?\s*|\s*```$", "", out.strip())


@router.post("/edit")
async def edit(body: EditBody):
    html = body.html
    if not html.strip():
        raise HTTPException(400, "Nothing to edit")
    where = "the draft"
    start, end = 0, len(html)
    if body.paragraph:
        span = find_paragraph(html, body.paragraph)
        if not span:
            return {"html": html, "summary": f"Couldn’t find paragraph {body.paragraph}."}
        start, end = span
        where = f"paragraph {body.paragraph}"
    fragment = html[start:end]

    if gw.llm_available():
        try:
            new = await _llm_edit(body.instruction, fragment, body.model)
        except Exception as e:
            log.warning("LLM edit failed: %s", e)
            return {"html": html, "summary": f"Edit failed: {str(e)[:120]}"}
        if body.paragraph and not new.lstrip().lower().startswith("<p"):
            new = f"<p>{new}</p>"
        if body.paragraph and new.lower().count("</p>") != 1:
            return {"html": html, "summary": "Edit rejected: expected a single paragraph back. Original kept."}
        mode = "AI"
    else:
        new, changed = _offline_edit(fragment, body.instruction)
        if not changed:
            return {"html": html, "summary": f"No changes needed in {where}."}
        mode = "offline rules"

    if _cites(new) != _cites(fragment):
        return {"html": html, "summary": "Edit rejected: it would alter a citation. Original kept."}
    if new.strip() == fragment.strip():
        return {"html": html, "summary": f"No changes needed in {where}."}
    return {"html": html[:start] + new + html[end:], "summary": f"Edited {where} ({mode}). Citations untouched."}
