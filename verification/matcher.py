import re
def norm(s): return re.sub(r"\s+"," ",re.sub(r"[^\w\s]"," ",(s or "").lower())).strip()
def match_citation(citation,sources):
 q=norm(citation); best=None; score=0; excerpt=None
 for s in sources:
  body=s.get("text",""); nb=norm(body)
  if q and q in nb:
   sc=1.0; pos=nb.find(q); ex=body[max(0,pos-150):pos+len(citation)+150]
  else:
   qt=set(q.split()); bt=set(nb.split()); sc=len(qt&bt)/max(1,len(qt)); ex=None
  if sc>score: best,score,excerpt=s,sc,ex
 if not best or score<.45: status="UNVERIFIED"; reasons=["No sufficiently strong text evidence found in supplied sources."]
 elif score>=.999: status="TEXT_MATCH_FOUND"; reasons=["Citation text matched fetched source; legal validity and proposition support remain unassessed."]
 else: status="PARTIAL_MATCH"; reasons=["Some terms overlap; exact citation identity was not established."]
 st=best.get("source_type","unknown") if best else None
 return {"identity_status":status,"identity_score":round(score,3),"evidence_quality_score":.9 if st and st.startswith("official_") else (.6 if best else 0),"source_url":best.get("url") if best else None,"source_type":st,"supporting_excerpt":excerpt,"reasons":reasons,"proposition_status":"NOT_ASSESSED","recommended_action":"Human reviewer should confirm identity, current status, jurisdiction, and proposition support."}
