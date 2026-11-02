from pathlib import Path
import subprocess,hashlib,json
r=Path(r'C:/Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios');master='content/production-closure/live-customer-commercial-convergence/MASTER-HUMAN-REVIEW.html';own=subprocess.check_output(['git','-C',str(r),'show','a203e460485ddf982cf3a2c1cfa26907d460d890:'+master]).decode('utf-8');incoming=subprocess.check_output(['git','-C',str(r),'show',':3:'+master]).decode('utf-8');start='<!-- SPW-FIN-R1:BEGIN -->';end='<!-- SPW-FIN-R1:END -->';a=own.index(start);z=own.index(end,a)+len(end);block=own[a:z]
if start in incoming:
 i=incoming.index(start);j=incoming.index(end,i)+len(end);updated=incoming[:i]+block+incoming[j:];outside=incoming[:i]+incoming[j:];assert updated.replace(block,'',1)==outside
else:
 i=incoming.lower().rfind('</body>');assert i>=0;updated=incoming[:i]+block+'\n'+incoming[i:];outside=incoming;assert updated.replace(block+'\n','',1)==incoming
assert '9005a876' in updated and 'REVISE_PENDING_RECHECK' in updated
(r/master).write_bytes(updated.encode());proof={'incomingMain':'38eaebcf6d8d0628372eaa59a85da08a6a523fd5','ownFeatureCommit':'a203e460485ddf982cf3a2c1cfa26907d460d890','resolution':'LATEST_MAIN_ENTIRE_MASTER_WITH_ONLY_OWN_SPW_BLOCK_REPLACED','outsideOwnerSha256':hashlib.sha256(outside.encode()).hexdigest(),'outsideOwnerPreserved':True,'pr14HumanStatePreserved':True};Path('C:/phios/tools/review/subject-country-spw-fin-r1/MAIN38-MASTER-RESOLUTION.json').write_bytes((json.dumps(proof,indent=2)+'\n').encode());print(json.dumps(proof))
