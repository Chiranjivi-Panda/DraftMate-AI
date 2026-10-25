import unittest
from verification.extractor import extract_citations
from verification.matcher import match_citation
from context.chunker import chunk_document
from context.retriever import retrieve
from context.fact_intake import select_drafting_context
class T(unittest.TestCase):
 def test_extract(self): self.assertTrue(extract_citations("Vishaka v. State of Rajasthan, (1997) 6 SCC 241"))
 def test_fact_first(self):
  self.assertEqual(select_drafting_context()["mode"],"INTAKE_REQUIRED")
  self.assertEqual(select_drafting_context(user_facts="Rent unpaid")["mode"],"EXISTING_FACTS")
 def test_retrieve(self):
  c=chunk_document("PAYMENT TERMS\nTenant must pay rent monthly. Late payment attracts interest.","lease",300,30)
  self.assertTrue(retrieve("tenant rent",c))
 def test_empty_sources(self): self.assertEqual(match_citation("Made Up v Nobody",[])["identity_status"],"UNVERIFIED")
if __name__=="__main__": unittest.main()
