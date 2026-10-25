"""Structure-aware lexical retrieval for DraftMate's shared doc_store."""
from __future__ import annotations
import math, re
from collections import Counter
from . import doc_store

WORD = re.compile(r"[A-Za-z0-9][A-Za-z0-9._/-]*|₹\s?\d+(?:,\d+)*(?:\.\d+)?", re.I)

def terms(s: str) -> list[str]:
    return [x.lower() for x in WORD.findall(s or "")]

def estimate_tokens(text: str) -> int:
    """Approximate only; use the chosen LLM provider's tokenizer for exact counts."""
    return math.ceil(len(text) / 4) if text else 0

def split_chunks(markdown: str, name: str, doc_id: str) -> list[dict]:
    chunks, heading, buf = [], "Document body", []
    def flush():
        nonlocal buf
        raw = "\n".join(buf).strip()
        buf = []
        if not raw: return
        paras = [p.strip() for p in re.split(r"\n\s*\n", raw) if p.strip()]
        pack, size, number = [], 0, len(chunks) + 1
        for para in paras:
            pieces = [para[i:i+1800] for i in range(0, len(para), 1800)] if len(para) > 2200 else [para]
            for piece in pieces:
                if pack and size + len(piece) > 1800:
                    chunks.append({"chunk_id": f"{doc_id}:{number}", "document_id": doc_id,
                        "document_name": name, "section": heading, "text": "\n\n".join(pack)})
                    number += 1; pack, size = [], 0
                pack.append(piece); size += len(piece)
        if pack:
            chunks.append({"chunk_id": f"{doc_id}:{number}", "document_id": doc_id,
                "document_name": name, "section": heading, "text": "\n\n".join(pack)})
    for line in (markdown or "").replace("\r\n", "\n").split("\n"):
        m = re.match(r"^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$", line)
        if m:
            flush(); heading = m.group(1).strip()
        else: buf.append(line)
    flush()
    return chunks

def bm25(query: list[str], docs: list[list[str]]) -> list[float]:
    n = len(docs)
    if not n: return []
    df = Counter(t for d in docs for t in set(d))
    avg = sum(map(len, docs)) / n
    qf = Counter(query); scores = []
    for d in docs:
        tf = Counter(d); dl = len(d); score = 0.0
        for term, count in qf.items():
            if term not in tf: continue
            idf = math.log(1 + (n - df[term] + .5) / (df[term] + .5))
            score += idf * tf[term] * 2.5 / (tf[term] + 1.5 * (.25 + .75 * dl / max(avg, 1))) * min(count, 2)
        scores.append(score)
    return scores

def build_context(instruction: str, doc_ids: list[str], max_chars: int = 12000) -> dict:
    docs = doc_store.many(doc_ids)
    raw_text = "\n\n".join(f"# {d.get('name', 'Reference')}\n{d.get('markdown', '')}" for d in docs if d.get("markdown"))
    chunks = []
    for d in docs:
        chunks.extend(split_chunks(d.get("markdown", ""), d.get("name", "Reference"), d.get("id", "unknown")))
    raw = estimate_tokens(raw_text)
    if not chunks: return {"text": "", "raw": raw, "sent": 0, "chunks": []}
    q = terms(instruction)
    tokenized = [terms(c["section"] + " " + c["text"]) for c in chunks]
    scores = bm25(q, tokenized)
    ranked = sorted(range(len(chunks)), key=lambda i: scores[i], reverse=True)
    if not q or not any(scores): ranked = list(range(len(chunks)))
    picked, used = [], 0
    for i in ranked:
        c = chunks[i]
        block = f"[SOURCE: {c['document_name']} | SECTION: {c['section']} | CHUNK: {c['chunk_id']}]\n{c['text']}"
        if len(block) > max_chars and not picked: block = block[:max_chars]
        if used + len(block) > max_chars: continue
        picked.append((i, block)); used += len(block) + 2
        if used >= max_chars: break
    picked.sort(key=lambda x: x[0])
    text = "\n\n".join(block for _, block in picked)
    return {"text": text, "raw": raw, "sent": estimate_tokens(text),
            "chunks": [{"chunk_id": chunks[i]["chunk_id"], "document_id": chunks[i]["document_id"],
                        "document_name": chunks[i]["document_name"], "section": chunks[i]["section"],
                        "score": round(scores[i], 4)} for i, _ in picked]}
