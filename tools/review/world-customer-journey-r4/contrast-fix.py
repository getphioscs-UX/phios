from pathlib import Path
import json,hashlib
r=Path(r'C:/Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios');p=r/'assets/css/world-experience-r2.css';s=p.read_text(encoding='utf-8');s+='\n.world-r1.world-ux-r3 .world-ux-connection-intro h2,.world-r1.world-ux-r3 .world-ux-connection-intro p,.world-r1.world-ux-r3 [data-world-company-gap]{color:#143447}.world-r1.world-ux-r3 .world-ux-connection-intro a{color:#6d5526;text-underline-offset:3px}\n';p.write_bytes(s.encode());p=r/'content/civilization-atlas/maintenance/book-v-world-customer-journey-successor-v20.json';d=json.loads(p.read_text(encoding='utf-8'))
for c in d['changes']:c['successorSha256']=hashlib.sha256((r/c['path']).read_bytes()).hexdigest()
p.write_bytes((json.dumps(d,ensure_ascii=False,indent=2)+'\n').encode())
print('Fixed actual screenshot contrast in the scoped Connections intro and missing-company explanation, without changing native R2 assets.')
