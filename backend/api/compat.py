"""Adapter: exposes the endpoints the Next.js frontend expects (frontend/lib/types.ts)
on top of the M3 verifier and M4 exporter. Mounted from backend/main.py."""
from __future__ import annotations

import html as htmllib
import re
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Dict, List, Optional
from urllib.parse import quote

from fastapi import APIRouter
from fastapi.responses import Response
from pydantic import BaseModel

from docs_pipeline.exporter import export_docx, export_pdf
from verification.matcher import match_citation
from verification.sources import fetch_source

router = APIRouter(prefix="/api")


@router.get("/health")
def api_health():
    return {"ok": True}


class CiteIn(BaseModel):
    id: str
    text: str
    kind: str = "other"


class VerifyBody(BaseModel):
    citations: List[CiteIn]


def _check(c: CiteIn) -> Dict[str, Any]:
    search = f"https://indiankanoon.org/search/?formInput={quote(c.text)}"
    base = {"id": c.id, "text": c.text, "kind": c.kind, "source_name": "Indian Kanoon (search)", "source_url": search}
    try:
        src = fetch_source(search, timeout=8)
        if src.get("fetch_status") != "FETCHED":
            raise RuntimeError(src.get("error") or "source unreachable")
        m = match_citation(c.text, [src])
    except Exception as e:  # source down: never claim verified
        return {**base, "status": "unverified", "confidence": 0.0,
                "note": f"Could not reach legal sources ({str(e)[:80]}). Not verified — check manually.",
                "suggestion": "Open the source link and confirm by hand."}
    st = m["identity_status"]
    score = float(m.get("identity_score") or 0)
    if st == "TEXT_MATCH_FOUND":
        return {**base, "status": "verified", "confidence": round(score, 2), "snippet": (m.get("supporting_excerpt") or "")[:300],
                "note": "Citation text found in the source. Proposition and current status still need advocate review."}
    if st == "PARTIAL_MATCH":
        return {**base, "status": "partial", "confidence": round(score, 2),
                "note": "Some terms matched but exact identity was not established.", "suggestion": "Confirm year, court and reporter at the source."}
    return {**base, "status": "unverified", "confidence": round(score, 2),
            "note": "Not found in accessible sources. This does not prove it is fake, but do not file it unverified.",
            "suggestion": "Remove it or replace it with an authority confirmed from an official reporter."}


@router.post("/verify")
def api_verify(body: VerifyBody):
    with ThreadPoolExecutor(max_workers=6) as ex:
        rows = list(ex.map(_check, body.citations))
    return {"citations": rows}


class ExportBody(BaseModel):
    title: str = "DraftMate Document"
    html: str
    citations: Optional[List[Dict[str, Any]]] = None


def html_to_md(h: str) -> str:
    h = re.sub(r"<h([1-3])[^>]*>(.*?)</h\1>", lambda m: "\n\n" + "#" * int(m.group(1)) + " " + m.group(2) + "\n\n", h, flags=re.S | re.I)
    h = re.sub(r"<li[^>]*>", "\n- ", h, flags=re.I)
    h = re.sub(r"</p>|<br\s*/?>|<hr\s*/?>", "\n\n", h, flags=re.I)
    h = re.sub(r"<(strong|b)>(.*?)</\1>", r"**\2**", h, flags=re.S | re.I)
    h = re.sub(r"<[^>]+>", "", h)
    return re.sub(r"\n{3,}", "\n\n", htmllib.unescape(h)).strip()


@router.post("/export")
def api_export(body: ExportBody, fmt: str = "docx"):
    cites = body.citations or []
    label = {"verified": "TEXT_MATCH_FOUND", "partial": "PARTIAL_MATCH", "unverified": "UNVERIFIED", "pending": "UNVERIFIED"}
    verification = {
        "document_id": "draftmate", "overall_status": "REVIEW_REQUIRED",
        "notice": "Prototype triage only. Every citation must be reviewed by a qualified advocate.",
        "citations": [{"citation_id": c.get("id"), "original_text": c.get("text"), "identity_status": label.get(c.get("status"), "UNVERIFIED"),
                       "identity_score": c.get("confidence") or 0, "source_url": c.get("source_url"),
                       "reasons": [c.get("note") or ""], "recommended_action": c.get("suggestion") or "Human review required."} for c in cites],
        "sources": [],
    }
    md = html_to_md(body.html) or "(empty)"
    slug = re.sub(r"[^a-z0-9]+", "-", body.title.lower()).strip("-") or "draft"
    if fmt == "pdf":
        data, media = export_pdf(md, title=body.title, verification=verification), "application/pdf"
    else:
        fmt = "docx"
        data, media = export_docx(md, title=body.title, verification=verification), "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    return Response(content=data, media_type=media, headers={"Content-Disposition": f'attachment; filename="{slug}.{fmt}"'})
