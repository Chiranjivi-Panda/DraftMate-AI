"""In-memory store for uploaded reference docs. SHARED SEAM between M4 (upload) and M2 (draft).

M4's POST /api/upload should call, after MarkItDown conversion:

    style = await style_profiler.profile(markdown)
    doc_store.save(doc_id, name, markdown, style)

/api/draft then receives `doc_ids` and pulls context + style from here.
(Swap for SQLite later — keep these function signatures and nobody else changes.)
"""
from __future__ import annotations

DOCS: dict[str, dict] = {}


def save(doc_id: str, name: str, markdown: str, style: dict | None = None, tokens: int | None = None) -> dict:
    DOCS[doc_id] = {"id": doc_id, "name": name, "markdown": markdown, "style": style, "tokens": tokens}
    return DOCS[doc_id]


def get(doc_id: str) -> dict | None:
    return DOCS.get(doc_id)


def many(ids: list[str]) -> list[dict]:
    return [DOCS[i] for i in ids if i in DOCS]
