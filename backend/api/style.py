from fastapi import APIRouter
from pydantic import BaseModel

from core import style_profiler

router = APIRouter(prefix="/api")


class StyleBody(BaseModel):
    markdown: str
    model: str | None = None


@router.post("/style/profile")
async def profile(body: StyleBody):
    """Dev/test helper (M4's /api/upload calls style_profiler.profile() directly)."""
    style = await style_profiler.profile(body.markdown, body.model)
    return {"style": style, "card": style_profiler.style_card(style)}
