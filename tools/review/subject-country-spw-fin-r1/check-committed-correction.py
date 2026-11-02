from pathlib import Path
import subprocess,json,hashlib
r=Path(r'C:/Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios');q=Path('C:/phios/tools/review/subject-country-spw-fin-r1');head='8cdc4875df3bfc74c92efba3e0f619536443b45b';get=lambda p:subprocess.check_output(['git','show',head+':'+p],cwd=r);d=json.loads(get('content/civilization-atlas/maintenance/book-v-subject-country-successor-v23.json'));checks=[]
for x in d['dependencies']+d['changes']:
 expected=x.get('sha256',x.get('successorSha256'));actual=hashlib.sha256(get(x['path'])).hexdigest();assert actual==expected,x['path'];checks.append({'path':x['path'],'sha256':actual,'status':'PASS'})
assert get('scripts/refresh-world-country-evidence.py').count(b"'status':'UPDATING'")==1
(q/'CORRECTION-FINAL-COMMIT-HASHES.json').write_bytes((json.dumps({'sha':head,'status':'PASS','scope':'ACTUAL_COMMITTED_GIT_OBJECTS','checked':len(checks),'checks':checks},indent=2)+'\n').encode());print('COMMITTED_BYTES32_PASS')
