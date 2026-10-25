from fastapi import APIRouter
from pydantic import BaseModel

from core import skill_engine as engine

router = APIRouter(prefix="/api")


class RouteBody(BaseModel):
    instruction: str
    has_draft: bool = False


@router.post("/route")
async def route(body: RouteBody):
    """→ {intent, skill_id?, paragraph?, text?}   intent ∈ draft|edit|verify|export|delete|dictate

    NOTE: skill_id is only returned when we are CONFIDENT — otherwise the frontend keeps the
    skill the user picked in the Skill Library."""
    return await engine.route(body.instruction, body.has_draft)
