from pathlib import Path
import subprocess,json,hashlib
d=Path('tools/review/world-answer-quality-r1');d.mkdir(exist_ok=True)
status=subprocess.check_output(['git','status','--porcelain'],text=True)
owned=['functions/_lib/world-published-explanation.js','functions/customer-projection/ric-world-session.js','assets/js/pages/civilization-atlas/world-customer-answer.js','assets/customer-ui/js/surfaces/ric-world-session-panel.js','assets/customer-ui/js/surfaces/ric-reality-workbench.js','tools/review/reality-information-contract-r1/L1/server.mjs','tools/review/reality-information-contract-r1/RIC-HUMAN-REVIEW.html']
files=[]
for name in owned:
 b=Path(name).read_bytes();p=d/'before'/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b);files.append({'path':name,'sha256':hashlib.sha256(b).hexdigest()})
protected=[]
for line in status.splitlines():
 p=Path(line[3:])
 if p.is_file():protected.append({'path':p.as_posix(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(d/'BASELINE.json').write_bytes(json.dumps({'head':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'status':status,'files':files,'protected':protected,'ownerConflict':'Pending v10 maintenance digest references prior source. Do not edit its manifest/test or accepted hashes; record successor drift separately.'},ensure_ascii=False,indent=2).encode())
(d/'INITIAL-DIFF.patch').write_bytes(subprocess.check_output(['git','diff','--binary']))
