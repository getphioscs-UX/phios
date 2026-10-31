import json,hashlib
from pathlib import Path
r=Path(r'C:/Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios');p=r/'content/civilization-atlas/maintenance/book-v-world-question-outcome-successor-v22.json';d=json.loads(p.read_text(encoding='utf-8'))
for c in d['changes']:c['successorSha256']=hashlib.sha256((r/c['path']).read_bytes()).hexdigest()
for c in d['dependencies']:c['sha256']=hashlib.sha256((r/c['path']).read_bytes()).hexdigest()
p.write_bytes((json.dumps(d,ensure_ascii=False,indent=2)+'\n').encode())
