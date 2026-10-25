"""One router for everything M2 owns → main.py needs just: app.include_router(m2_router)"""
from fastapi import APIRouter

from . import draft, edit, route, skills, style

router = APIRouter()
for _m in (skills, route, draft, edit, style):
    router.include_router(_m.router)
