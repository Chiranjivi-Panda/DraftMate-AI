import re
PATTERNS=[re.compile(r"\bAIR\s+\d{4}\s+SC\s+\d+\b",re.I),re.compile(r"\(\s*\d{4}\s*\)\s*\d+\s*SCC\s+\d+\b",re.I),re.compile(r"\b(?:Section|Sec\.?)\s+\d+[A-Za-z]?\b",re.I),re.compile(r"\b[A-Z][A-Za-z.&' -]{1,70}\s+v\.?\s+[A-Z][A-Za-z.&' -]{1,70}(?:,\s*\(\d{4}\)\s*\d+\s*SCC\s+\d+)?",re.I)]
def extract_citations(text):
    rows=[]; seen=set()
    for p in PATTERNS:
        for m in p.finditer(text or ""):
            raw=m.group().strip(" ,.;:")
            if len(raw)<5 or raw.casefold() in seen: continue
            seen.add(raw.casefold()); rows.append({"original_text":raw,"start":m.start(),"end":m.end(),"context":text[max(0,m.start()-200):min(len(text),m.end()+200)]})
    rows.sort(key=lambda x:x["start"])
    for i,r in enumerate(rows,1): r["citation_id"]=f"cite-{i:03d}"
    return rows
