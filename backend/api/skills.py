from fastapi import APIRouter

from core import llm_gateway as gw
from core import skill_engine as engine

router = APIRouter(prefix="/api")


@router.get("/skills")
def list_skills():
    """→ Skill[]   (YAML files are hot-reloaded on every call)"""
    return engine.list_public()


@router.post("/skills/reload")
def reload_skills():
    return {"count": len(engine.load_skills(force=True))}


@router.get("/models")
def models():
    """Which LLM providers have keys configured (handy during setup)."""
    return {"available": gw.available_models(), "names": {m: gw.model_name(m) for m in gw.MODEL_IDS}, "offline_mode": not gw.llm_available()}
