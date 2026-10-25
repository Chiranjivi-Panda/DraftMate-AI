"""POST /api/draft — Server-Sent Events.

Frames (each `data: {json}\\n\\n`):  skill → usage → token… → done   (or error)
"""
import json
import logging
from typing import AsyncIterator

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from core import llm_gateway as gw
from core import skill_engine as engine
from core.context_bridge import est_tokens, get_context
from core.style_profiler import style_card

log = logging.getLogger("draftmate.draft")
router = APIRouter(prefix="/api")


class DraftBody(BaseModel):
    instruction: str
    skill_id: str | None = None
    model: str = "claude"
    doc_ids: list[str] = []


def _sse(ev: dict) -> str:
    return f"data: {json.dumps(ev, ensure_ascii=False)}\n\n"


async def _events(body: DraftBody) -> AsyncIterator[str]:
    try:
        steps = engine.resolve_chain(body.skill_id)
        if not steps:
            sid, _ = engine.match_skill(body.instruction)
            fallback = engine.get_skill(sid) or engine.get_skill(engine.DEFAULT_SKILL_ID) or next(iter(engine.load_skills().values()), None)
            if fallback is None:
                raise RuntimeError("No skills loaded — check the /skills folder")
            steps = [fallback]
        final = steps[-1]
        yield _sse({"type": "skill", "skill_id": final.id})

        ctx = await get_context(body.instruction, body.doc_ids)
        card = style_card(ctx.style)

        notes = ""
        for pre in steps[:-1]:  # chained earlier steps run silently
            s, u = engine.build_prompts(pre, body.instruction, card, ctx.text, notes)
            notes = await gw.complete(s, u, body.model, pre.max_tokens, pre.temperature)

        system, user = engine.build_prompts(final, body.instruction, card, ctx.text, notes)
        base = est_tokens(system) + est_tokens(body.instruction)
        raw, sent = ctx.raw + base, ctx.sent + base
        yield _sse({"type": "usage", "raw": max(raw, sent, 1), "sent": max(sent, 1)})

        async for tok in gw.stream(system, user, body.model, final.max_tokens, final.temperature):
            yield _sse({"type": "token", "text": tok})
        yield _sse({"type": "done"})
    except Exception as e:  # surface to the UI instead of a dead stream
        log.exception("draft failed")
        yield _sse({"type": "error", "message": str(e)[:300]})


@router.post("/draft")
async def draft(body: DraftBody):
    return StreamingResponse(
        _events(body),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"},
    )
