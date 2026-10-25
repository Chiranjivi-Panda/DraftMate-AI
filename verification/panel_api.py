from fastapi import FastAPI
from pydantic import BaseModel,Field
from verification.extractor import extract_citations
from verification.sources import fetch_source
from verification.matcher import match_citation
from verification.scorer import score_result
app=FastAPI(title="DraftMate Verification Panel API",version="0.1.0")
class Req(BaseModel):
 document_id:str="demo-document"
 text:str=Field(min_length=1,max_length=200000)
 source_urls:list[str]=Field(default_factory=list,max_length=12)
@app.get("/health")
def health(): return {"status":"ok","service":"draftmate-verification-panel"}
@app.post("/extract")
def extract(req:Req): return {"document_id":req.document_id,"citations":extract_citations(req.text)}
@app.post("/verify")
def verify(req:Req):
 citations=extract_citations(req.text)
 if not citations: return {"document_id":req.document_id,"overall_status":"NO_CITATIONS_FOUND","citations":[]}
 sources=[fetch_source(u) for u in req.source_urls]
 rows=[]
 for c in citations:
  m=match_citation(c["original_text"],sources); rows.append({**c,**m,**score_result(m)})
 return {"document_id":req.document_id,"overall_status":"REVIEW_REQUIRED","sources":[{k:s.get(k) for k in ("url","source_type","title","retrieved_at","fetch_status","error")} for s in sources],"citations":rows,"notice":"Prototype triage only; proposition support/current legal status are not assessed."}
