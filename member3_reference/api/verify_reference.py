"""Frontend-compatible Verification Panel endpoint."""
from typing import Literal
from fastapi import APIRouter
from pydantic import BaseModel, Field
from core.verification_engine import verify_citation

router = APIRouter(prefix="/api", tags=["verification"])

class CitationIn(BaseModel):
    id: str = Field(min_length=1, max_length=100)
    text: str = Field(min_length=1, max_length=1000)
    kind: Literal["case", "statute", "rule", "other"] = "other"

class VerifyBody(BaseModel):
    citations: list[CitationIn] = Field(min_length=1, max_length=100)
    source_urls: list[str] = Field(default_factory=list, max_length=12)

@router.post("/verify")
def verify(body: VerifyBody):
    results = []
    for c in body.citations:
        r = verify_citation(c.text, body.source_urls)
        results.append({"id": c.id, "text": c.text, "kind": c.kind,
            "status": r["status"], "confidence": r["confidence"],
            "source_name": r.get("source_name"), "source_url": r.get("source_url"),
            "snippet": r.get("snippet"), "note": r["note"], "suggestion": r.get("suggestion")})
    return {"citations": results}
