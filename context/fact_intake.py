def select_drafting_context(uploaded_facts="",user_facts="",allow_fictional=False):
 existing="\n\n".join(x.strip() for x in (uploaded_facts,user_facts) if x and x.strip())
 if existing:return {"mode":"EXISTING_FACTS","context":existing,"fictional_facts_allowed":False,"instruction":"Use only supplied facts. Ask about gaps or use labelled placeholders; do not invent dates, events, amounts, parties, or evidence."}
 if allow_fictional:return {"mode":"FICTIONAL_DEMO","context":"","fictional_facts_allowed":True,"instruction":"Invented details must be clearly labelled as fictional demo facts, never client facts."}
 return {"mode":"INTAKE_REQUIRED","context":"","fictional_facts_allowed":False,"instruction":"No factual basis supplied. Ask intake questions before drafting a fact-specific document."}
