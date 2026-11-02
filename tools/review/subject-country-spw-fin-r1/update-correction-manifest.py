from pathlib import Path
import json,hashlib,subprocess
r=Path(r'C:/Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios');p=r/'content/civilization-atlas/maintenance/book-v-subject-country-successor-v23.json';d=json.loads(p.read_text(encoding='utf-8'));prior=subprocess.check_output(['git','show','2a56d976e1cff33a524efad6a5e4a61607e5cc4f:'+p.relative_to(r).as_posix()],cwd=r);d['candidateCorrection']={'status':'UNACCEPTED_CANDIDATE_CORRECTION','priorCommit':'2a56d976e1cff33a524efad6a5e4a61607e5cc4f','priorManifestSha256':hashlib.sha256(prior).hexdigest(),'request':'PHIOS-COUNTRY-WORLD-UX-DATA-CORRECTION-R1','visualDecision':'REVISE_PENDING_RECHECK'}
existing={x['path']for x in d['dependencies']}
for path in ['assets/customer-ui/surfaces/profile-visitor-r1.css','content/world/world-country-public-evidence-current.json','content/world/world-country-public-evidence-r2-dbce500dd6254804.json','content/world/world-country-refresh-status.json','scripts/refresh-world-country-evidence.py','scripts/validate-world-country-refresh.mjs','scripts/check-world-country-refresh.py','scripts/check-world-country-latest.mjs']:
 if path not in existing:d['dependencies'].append({'path':path})
for x in d['dependencies']:x['sha256']=hashlib.sha256((r/x['path']).read_bytes()).hexdigest()
for x in d['changes']:x['successorSha256']=hashlib.sha256((r/x['path']).read_bytes()).hexdigest()
p.write_bytes((json.dumps(d,ensure_ascii=False,indent=2)+'\n').encode())
