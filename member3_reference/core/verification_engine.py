"""Conservative citation evidence engine. Lexical matches are not legal validation."""
from __future__ import annotations
import re
from urllib.parse import urlparse
import requests
from bs4 import BeautifulSoup

ALLOWED_HOSTS = ("indiacode.nic.in", "sci.gov.in", "main.sci.gov.in",
                 "ecourts.gov.in", "services.ecourts.gov.in",
                 "legislative.gov.in", "egazette.nic.in", "doj.gov.in")
TIMEOUT = 6
HEADERS = {"User-Agent": "DraftMate-Verification-Demo/0.1"}

def extract_authorities(text: str) -> list[str]:
    out = []
    for m in re.finditer(r"\[CITE:\s*([^\]]{1,500})\s*\]", text or "", re.I):
        v = m.group(1).strip()
        if v and v not in out: out.append(v)
    return out

def allowed_url(url: str) -> bool:
    try:
        p = urlparse(url)
        host = (p.hostname or "").lower().rstrip(".")
        return p.scheme == "https" and any(host == d or host.endswith("." + d) for d in ALLOWED_HOSTS)
    except Exception:
        return False

def fetch_sources(urls: list[str]) -> list[dict]:
    sources = []
    for url in urls[:12]:
        if not allowed_url(url):
            sources.append({"url": url, "name": url, "text": "", "error": "URL is not on the HTTPS legal-source allowlist."})
            continue
        try:
            with requests.get(url, headers=HEADERS, timeout=TIMEOUT, stream=True, allow_redirects=False) as r:
                if r.status_code != 200:
                    sources.append({"url": url, "name": url, "text": "", "error": f"HTTP {r.status_code}"}); continue
                raw, size = [], 0
                for part in r.iter_content(16384):
                    size += len(part)
                    if size > 1_500_000: break
                    raw.append(part)
                if "pdf" in r.headers.get("content-type", "").lower() or url.lower().endswith(".pdf"):
                    sources.append({"url": url, "name": url, "text": "", "error": "PDF parsing is not enabled in this version."}); continue
                soup = BeautifulSoup(b"".join(raw), "html.parser")
                for node in soup(["script", "style", "nav", "footer", "header", "noscript"]): node.decompose()
                title = soup.title.get_text(" ", strip=True) if soup.title else url
                text = re.sub(r"\s+", " ", soup.get_text(" ", strip=True))
                sources.append({"url": url, "name": title, "text": text[:250000], "error": None})
        except requests.RequestException as e:
            sources.append({"url": url, "name": url, "text": "", "error": f"Fetch failed: {type(e).__name__}"})
    return sources

def normalise(s: str) -> str:
    s = (s or "").lower().replace("&", " and ")
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9₹]+", " ", s)).strip()

def match_citation(citation: str, sources: list[dict]) -> dict:
    target = normalise(citation)
    if not target: return {"match": False, "strength": 0.0, "source": None, "excerpt": None}
    best = None
    for source in sources:
        text = normalise(source.get("text", ""))
        if not text: continue
        if target in text: strength = 1.0
        else:
            terms = set(target.split())
            strength = len(terms & set(text.split())) / max(len(terms), 1)
        item = {"match": strength >= .72, "strength": strength, "source": source,
                "excerpt": source.get("text", "")[:500] if strength >= .72 else None}
        if best is None or strength > best["strength"]: best = item
    return best or {"match": False, "strength": 0.0, "source": None, "excerpt": None}

def score_evidence(match: dict) -> dict:
    src = match.get("source")
    return {"identity_evidence_score": round(float(match.get("strength", 0.0)), 3),
            "source_retrieval_success": bool(src and src.get("text")),
            "proposition_support": "NOT_ASSESSED"}

def verify_citation(citation: str, source_urls: list[str]) -> dict:
    sources = fetch_sources(source_urls)
    match = match_citation(citation, sources)
    source = match.get("source")
    if match.get("match") and source:
        status, confidence = "partial", round(min(.75, max(.4, match["strength"] * .75)), 2)
        note = "A lexical source match was found. This does not establish current validity, binding status, or support for the proposition."
        suggestion = "Manually confirm case identity, court, date, holding and subsequent treatment."
    elif source_urls and all(s.get("error") for s in sources):
        status, confidence = "unverified", .1
        note = "No supplied source could be retrieved. This is not proof that the citation is fictitious."
        suggestion = "Provide an accessible official source or check an authoritative reporter."
    else:
        status, confidence = "unverified", .15
        note = "No sufficiently strong text match was found in the supplied accessible sources."
        suggestion = "Check an official court or legislation source; do not treat this as proof of non-existence."
    return {"status": status, "confidence": confidence,
            "source_name": source.get("name") if source else None,
            "source_url": source.get("url") if source else (source_urls[0] if source_urls else None),
            "snippet": match.get("excerpt"), "note": note, "suggestion": suggestion,
            "evidence": score_evidence(match)}
