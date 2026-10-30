from pathlib import Path
import json,hashlib,subprocess
r=Path(r'C:/Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios')
for f in ['assets/js/pages/client-intent-router.js','assets/js/pages/world.js']:
 p=r/f;b=p.read_bytes();old=subprocess.check_output(['git','show','8e77898f5ae86788789ae3ab45a4c51fc0f18a0b:'+f],cwd=r);print(f,'base CRLF',old.count(b'\r\n'),'current CRLF',b.count(b'\r\n'));p.write_bytes(b.replace(b'\r\n',b'\n'))
p=r/'content/civilization-atlas/maintenance/book-v-world-customer-journey-successor-v20.json';d=json.loads(p.read_text(encoding='utf-8'))
for c in d['changes']:c['successorSha256']=hashlib.sha256((r/c['path']).read_bytes()).hexdigest()
p.write_bytes((json.dumps(d,indent=2,ensure_ascii=False)+'\n').encode())
