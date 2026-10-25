"""Context bridge — gives /api/draft its reference context + style + token numbers.

Uses M3's `core.context_manager.build_context(instruction, doc_ids)` when it exists:
    returns {"text": str, "raw": int, "sent": int}     (sync or async)
Otherwise falls back to a tiny keyword retriever over core.doc_store, so M2 is never blocked.
"""
from __future__ import annotations

import inspect
import logging
import re
from dataclasses import dataclass

from . import doc_store, style_profiler

log = logging.getLogger("draftmate.context")


def est_tokens(s: str) -> int:
    return max(0, len(s) // 4)


@dataclass
class Ctx:
    text: str = ""
    raw: int = 0
    sent: int = 0
    style: dict | None = None


def _naive_retrieve(instruction: str, docs: list[dict], budget_chars: int = 6000) -> str:
    words = {w for w in re.findall(r"\w+", instruction.lower()) if len(w) > 3}
    chunks: list[tuple[int, int, str, str]] = []
    n = 0
    for d in docs:
        for part in re.split(r"\n\s*\n", d["markdown"]):
            part = part.strip()
            if part:
                score = sum(1 for w in words if w in part.lower())
                chunks.append((score, n, d["name"], part))
                n += 1
    picked, used = [], 0
    for score, idx, name, part in sorted(chunks, key=lambda c: (-c[0], c[1])):
        if used + len(part) > budget_chars:
            continue
        picked.append((idx, name, part))
        used += len(part)
    picked.sort()
    return "\n\n".join(f"[{name}] {part}" for _, name, part in picked)


async def get_context(instruction: str, doc_ids: list[str]) -> Ctx:
    docs = doc_store.many(doc_ids)
    ctx = Ctx()
    # style: first doc that has one; profile lazily if M4 didn't
    for d in docs:
        if d.get("style"):
            ctx.style = d["style"]
            break
    if ctx.style is None and docs and docs[0].get("markdown"):
        try:
            ctx.style = await style_profiler.profile(docs[0]["markdown"])
            docs[0]["style"] = ctx.style
        except Exception as e:
            log.warning("lazy style profile failed: %s", e)
    if not doc_ids:
        return ctx
    try:  # M3 context manager (preferred)
        from . import context_manager as cm  # type: ignore

        fn = getattr(cm, "build_context", None)
        if fn:
            r = fn(instruction, doc_ids)
            if inspect.isawaitable(r):
                r = await r
            ctx.text, ctx.raw, ctx.sent = r["text"], int(r["raw"]), int(r["sent"])
            return ctx
    except ImportError:
        pass
    except Exception as e:
        log.warning("context_manager failed → naive retrieval: %s", e)
    ctx.text = _naive_retrieve(instruction, docs)
    ctx.raw = sum(est_tokens(d["markdown"]) for d in docs)
    ctx.sent = est_tokens(ctx.text)
    return ctx
