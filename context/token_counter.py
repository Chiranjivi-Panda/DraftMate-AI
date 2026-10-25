import re
def estimate_tokens(text):
 return max(1,round(len(re.findall(r"\w+|[^\w\s]",text or ""))*1.25)) if text else 0
def context_budget(system_prompt,user_facts,retrieved,history="",model_limit=32768,output_reserve=4000):
 parts=[system_prompt or "",user_facts or "",history or ""]+[(x.get("excerpt") or x.get("text") or "") for x in retrieved]
 n=sum(estimate_tokens(x) for x in parts); avail=max(0,model_limit-output_reserve)
 return {"estimated_input_tokens":n,"model_limit":model_limit,"output_reserve":output_reserve,"available_input_budget":avail,"within_budget":n<=avail,"note":"Heuristic only; use chosen model tokenizer/count_tokens API in production."}
