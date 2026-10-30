from pathlib import Path
import re,json,hashlib
r=Path(r'C:/Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios');q=Path('C:/phios/tools/review/world-customer-journey-r4');a=[]
for f,old,new in [('check-customer-entry-r1.mjs','tools/review/customer-entry-r1/API-RESULTS.json',str(q/'ENTRY-API.json')),('check-ask-architecture-r1.mjs','content/production-closure/live-customer-commercial-convergence/ask-architecture-r1',str(q/'ask-regression')),('check-world-preview-worker-isolation.mjs','tools/review/world-market-integration-r1/wmda-r2/worker-isolation',str(q/'worker-isolation'))]:
 b=(r/'scripts'/f).read_bytes();s=b.decode();assert old in s;s=s.replace(old,new.replace(chr(92),chr(47)));s=re.sub(r"from '(\.\.?/[^']+)'",lambda m:'from '+json.dumps((r/'scripts'/m[1]).resolve().as_uri()),s);(q/f).write_bytes(s.encode());a.append(dict(source='scripts/'+f,sha256=hashlib.sha256(b).hexdigest(),changes='Only absolute import resolution and separate current execution receipt path; original assertions unchanged'))
(q/'OWNER-REGRESSION-SOURCES.json').write_text(json.dumps(a,indent=2),encoding='utf-8')
