import re
def compress_chunks(chunks,query,max_chars=3500):
 terms=set(re.findall(r"[a-z0-9]+",(query or "").lower())); out=[]; used=0
 for c in chunks:
  ss=re.split(r"(?<=[.!?])\s+",c.get("text",""))
  ranked=sorted(enumerate(ss),key=lambda x:sum(t in set(re.findall(r"[a-z0-9]+",x[1].lower())) for t in terms),reverse=True)
  chosen=[]; n=0
  for i,s in sorted(ranked):
   if s and (not terms or any(t in s.lower() for t in terms)) and n+len(s)+1<=max_chars: chosen.append(s); n+=len(s)+1
  ex=" ".join(chosen) or c.get("text","")[:500]
  ex=ex[:max(0,max_chars-used)]
  if not ex: break
  out.append({k:c.get(k) for k in ("chunk_id","document_id","section","trusted_for")}|{"excerpt":ex,"compression_method":"extractive_verbatim_sentences"})
  used+=len(ex)
  if used>=max_chars: break
 return out
