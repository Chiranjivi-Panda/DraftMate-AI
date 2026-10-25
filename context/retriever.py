import re
try: from rank_bm25 import BM25Okapi
except Exception: BM25Okapi=None
def tok(s): return re.findall(r"[a-z0-9]+",(s or "").lower())
def retrieve(query,chunks,top_k=5,filters=None):
 cs=chunks
 for k,v in (filters or {}).items():
  if v is not None: cs=[c for c in cs if c.get(k)==v]
 if not cs:return []
 q=tok(query); corpus=[tok(c.get("text","")) for c in cs]
 scores=BM25Okapi(corpus).get_scores(q) if BM25Okapi and any(corpus) else [sum(t in set(d) for t in q)/max(1,len(set(q))) for d in corpus]
 return [{**c,"retrieval_score":round(float(sc),4)} for c,sc in sorted(zip(cs,scores),key=lambda x:x[1],reverse=True)[:max(1,top_k)] if sc>0]
