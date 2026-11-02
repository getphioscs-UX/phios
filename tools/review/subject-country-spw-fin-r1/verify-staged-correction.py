from pathlib import Path
import subprocess,json,hashlib
r=Path(r'C:/Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios');q=Path('C:/phios/tools/review/subject-country-spw-fin-r1');get=lambda p:subprocess.check_output(['git','show',':'+p],cwd=r);m='content/civilization-atlas/maintenance/book-v-subject-country-successor-v23.json';d=json.loads(get(m));checks=[]
for x in d['dependencies']+d['changes']:
 expected=x.get('sha256',x.get('successorSha256'));actual=hashlib.sha256(get(x['path'])).hexdigest();assert actual==expected,x['path'];checks.append({'path':x['path'],'sha256':actual,'status':'PASS'})
script=get('scripts/refresh-world-country-evidence.py').decode();assert script.count("'status':'UPDATING'")==1
out={'status':'PASS','scope':'ACTUAL_GIT_INDEX_BYTES_NOT_WORKING_TREE','checks':checks,'singleUpdatingTransition':True};(q/'CORRECTION-GIT-INDEX-HASHES.json').write_bytes((json.dumps(out,indent=2)+'\n').encode());print(json.dumps({'status':'PASS','actualIndexHashes':len(checks)}))
subprocess.run(['git','commit','-m','Keep refresh transitions singular and bind staged successor bytes'],cwd=r,check=True);print(subprocess.check_output(['git','rev-parse','HEAD'],cwd=r,text=True).strip())
