from datetime import datetime,timezone
from urllib.parse import urlparse
import requests
from bs4 import BeautifulSoup
def source_type(url):
 h=(urlparse(url).hostname or "").lower()
 if h.endswith("indiacode.nic.in"): return "official_legislation"
 if h.endswith(("sci.gov.in","ecourts.gov.in")): return "official_court"
 if h.endswith(("legislative.gov.in","egazette.nic.in")): return "official_government"
 return "user_supplied_web_source"
def fetch_source(url,timeout=10):
 if not url.startswith(("http://","https://")): raise ValueError("Only http(s) URLs accepted")
 result={"url":url,"source_type":source_type(url),"title":"","text":"","retrieved_at":datetime.now(timezone.utc).isoformat(),"fetch_status":"FETCH_FAILED","error":None}
 try:
  r=requests.get(url,timeout=timeout,headers={"User-Agent":"DraftMateDemo/0.1"}); r.raise_for_status()
  s=BeautifulSoup(r.text,"html.parser")
  for t in s(["script","style","noscript","nav","footer","header"]): t.decompose()
  result.update(title=s.title.get_text(" ",strip=True) if s.title else url,text=" ".join(s.get_text(" ",strip=True).split())[:500000],fetch_status="FETCHED")
 except Exception as e: result["error"]=str(e)
 return result
