import re
def chunk_document(text,document_id="document",max_chars=1800,overlap=180):
 if max_chars<300: raise ValueError("max_chars must be >=300")
 blocks=[b.strip() for b in re.split(r"\n(?=\s*(?:\d+(?:\.\d+)*[.)]?\s+|[A-Z][A-Z \-/]{3,}$|CLAUSE\s+\d+|SECTION\s+\d+))",(text or "").replace("\r\n","\n"),flags=re.I) if b.strip()]
 chunks=[]; buf=""; section="document"
 for b in blocks:
  first=b.splitlines()[0].strip()
  if len(first)<120 and (first.isupper() or re.match(r"^(?:\d+(?:\.\d+)*[.)]?|clause\s+\d+|section\s+\d+)",first,re.I)): section=first
  if len(buf)+len(b)+2<=max_chars: buf=(buf+"\n\n"+b).strip()
  else:
   if buf: chunks.append((buf,section))
   buf=((buf[-overlap:]+"\n") if buf and overlap else "")+b
   while len(buf)>max_chars: chunks.append((buf[:max_chars],section)); buf=buf[max_chars-overlap:] if overlap else buf[max_chars:]
 if buf: chunks.append((buf,section))
 return [{"chunk_id":f"{document_id}-chunk-{i:03d}","document_id":document_id,"section":sec,"text":t,"char_count":len(t),"trusted_for":"context_only_not_legal_truth"} for i,(t,sec) in enumerate(chunks,1)]
