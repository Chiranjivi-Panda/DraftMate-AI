def score_result(m):
 s=m["identity_status"]
 overall={"TEXT_MATCH_FOUND":"TEXT_MATCH_REVIEW_REQUIRED","PARTIAL_MATCH":"PARTIAL_EVIDENCE_REVIEW_REQUIRED","UNVERIFIED":"UNVERIFIED_REVIEW_REQUIRED"}.get(s,"REVIEW_REQUIRED")
 if s=="TEXT_MATCH_FOUND" and (m.get("evidence_quality_score") or 0)>=.8: overall="OFFICIAL_SOURCE_TEXT_MATCH_REVIEW_REQUIRED"
 return {"overall_status":overall,"proposition_support_score":None,"warning":"A text match does not prove authenticity, current legal status, binding effect, or proposition support."}
