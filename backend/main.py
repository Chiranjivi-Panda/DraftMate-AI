"""
DraftMate Backend — aggregates Verification (Member 3), Voice Agent, and Doc Pipeline (Member 4).
"""
from __future__ import annotations

import sys
from pathlib import Path

# ensure project root is on path
ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
BACKEND_DIR = ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional

from verification.extractor import extract_citations
from verification.sources import fetch_source
from verification.matcher import match_citation
from verification.scorer import score_result
from voice.confirm_gate import ConfirmGate
from voice.action_queue import ActionQueue
from docs_pipeline.exporter import export_docx, export_pdf, export_with_verification
from docs_pipeline.converter import convert_to_markdown

app = FastAPI(
    title="DraftMate API",
    description="Voice Agent • Document Pipeline • Verification Panel",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve the demo UI and voice client from the same origin (deployment-friendly).
PUBLIC_DIR = ROOT / "frontend" / "public"
SRC_DIR = ROOT / "frontend" / "src"
app.mount("/src", StaticFiles(directory=str(SRC_DIR)), name="frontend-src")

@app.get("/", include_in_schema=False)
def frontend_home():
    return FileResponse(str(PUBLIC_DIR / "index.html"))

# Member 2: skill library, model gateway, drafting/editing and style endpoints.
from api.m2_router import router as m2_router
app.include_router(m2_router)
from api.compat import router as compat_router
app.include_router(compat_router)

# Shared voice state (single-user demo)
_queue = ActionQueue()
_gate = ConfirmGate(queue=_queue)


# ---------- Health ----------
@app.get("/health")
def health():
    return {"status": "ok", "service": "draftmate", "modules": ["verification", "voice", "docs"]}


# ---------- Verification (Member 3 surface) ----------
class VerifyReq(BaseModel):
    document_id: str = "demo-document"
    text: str = Field(min_length=1, max_length=200000)
    source_urls: List[str] = Field(default_factory=list, max_length=12)


@app.post("/verify")
def verify(req: VerifyReq):
    citations = extract_citations(req.text)
    if not citations:
        return {
            "document_id": req.document_id,
            "overall_status": "NO_CITATIONS_FOUND",
            "citations": [],
        }
    sources = [fetch_source(u) for u in req.source_urls]
    rows = []
    for c in citations:
        m = match_citation(c["original_text"], sources)
        rows.append({**c, **m, **score_result(m)})
    return {
        "document_id": req.document_id,
        "overall_status": "REVIEW_REQUIRED",
        "sources": [
            {k: s.get(k) for k in ("url", "source_type", "title", "retrieved_at", "fetch_status", "error")}
            for s in sources
        ],
        "citations": rows,
        "notice": "Prototype triage only; proposition support/current legal status are not assessed.",
    }


@app.post("/extract")
def extract(req: VerifyReq):
    return {"document_id": req.document_id, "citations": extract_citations(req.text)}


# ---------- Voice Agent ----------
class VoiceReq(BaseModel):
    utterance: str = Field(min_length=1, max_length=2000)


@app.post("/voice/process")
def voice_process(req: VoiceReq):
    """Process a spoken utterance through intent parser + confirm gate + action queue."""
    result = _gate.process_utterance(req.utterance)
    return result


@app.get("/voice/status")
def voice_status():
    return _gate.status()


@app.post("/voice/confirm")
def voice_confirm():
    return _gate.process_utterance("confirm")


@app.post("/voice/cancel")
def voice_cancel():
    return _gate.process_utterance("cancel")


# ---------- Document Pipeline ----------
class ExportReq(BaseModel):
    content: str = Field(min_length=1, max_length=500000)
    title: str = "DraftMate Document"
    format: str = Field(default="docx", pattern="^(docx|pdf)$")
    verification: Optional[Dict[str, Any]] = None


@app.post("/docs/export")
def docs_export(req: ExportReq):
    """Export Markdown content (+ optional verification summary) to DOCX or PDF."""
    if req.format == "docx":
        data = export_docx(req.content, title=req.title, verification=req.verification)
        media = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        filename = f"{req.title.replace(' ', '_')}.docx"
    else:
        data = export_pdf(req.content, title=req.title, verification=req.verification)
        media = "application/pdf"
        filename = f"{req.title.replace(' ', '_')}.pdf"
    return Response(
        content=data,
        media_type=media,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.post("/api/upload")
async def upload_reference(file: UploadFile = File(...)):
    """Upload and index a reference document for the AI drafting context."""
    from core import doc_store
    from core import style_profiler
    allowed = {".pdf", ".docx", ".pptx", ".xlsx", ".html", ".txt", ".md"}
    suffix = Path(file.filename or "document.txt").suffix.lower()
    if suffix not in allowed:
        raise HTTPException(status_code=415, detail="Supported files: PDF, DOCX, PPTX, XLSX, HTML, TXT, MD")
    raw = await file.read()
    if len(raw) > 15 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File is larger than 15 MB")
    try:
        markdown = convert_to_markdown(raw, filename=file.filename)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not convert file: {exc}")
    doc_id = __import__("uuid").uuid4().hex[:12]
    try:
        style = await style_profiler.profile(markdown)
    except Exception:
        style = None
    saved = doc_store.save(doc_id, file.filename or "reference", markdown, style=style)
    return {"id": doc_id, "name": saved.get("name", file.filename), "size": len(raw), "tokens": max(1, len(markdown) // 4), "style": style, "characters": len(markdown), "message": "Reference document indexed in this server session."}


class ConvertReq(BaseModel):
    # For demo we accept plain text; real upload would use UploadFile
    text: str = Field(min_length=1)
    filename: str = "document.txt"


@app.post("/docs/convert")
def docs_convert(req: ConvertReq):
    """Placeholder convert endpoint — returns the text as markdown for demo."""
    # In production: accept file upload and call convert_to_markdown
    return {"markdown": req.text, "filename": req.filename}


# Wire simple handlers so execute_next does something useful for demo
def _handle_verify(action):
    return {"message": "Verification triggered (connect frontend SSE for live results)."}


def _handle_export(action):
    fmt = (action.slots or {}).get("format") or "pdf"
    return {"message": f"Export as {fmt} ready.", "format": fmt}


def _handle_help(action):
    return {"commands": ["write", "edit", "verify", "export", "undo", "redo", "run skill", "open panel"]}


_queue.register_handler("verify", _handle_verify)
_queue.register_handler("export", _handle_export)
_queue.register_handler("help", _handle_help)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
