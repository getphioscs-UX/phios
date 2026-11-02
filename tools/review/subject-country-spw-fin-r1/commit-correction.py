from pathlib import Path
import subprocess,json,hashlib
r=Path(r'C:/Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios');q=Path('C:/phios/tools/review/subject-country-spw-fin-r1');leaf='content/production-closure/live-customer-commercial-convergence/subject-country-spw-fin-r1/'
for target in [r/leaf,Path('C:/phios')/leaf]:
 for f in ['CORRECTION-COUNTRY-60.json','CORRECTION-LATEST-TESTS.json','CORRECTION-P2.json','CORRECTION-REFRESH-FINAL.json','CORRECTION-W16.log']:(target/f).write_bytes((q/f).read_bytes())
paths=['assets/customer-ui/js/surfaces/profile-country-r1.js','assets/customer-ui/surfaces/profile-country-r1.css','assets/customer-ui/surfaces/profile-visitor-r1.css','assets/js/pages/civilization-atlas/world-journey-shell-r3.js','assets/js/pages/civilization-atlas/world-question-outcome.js','content/civilization-atlas/maintenance/book-v-subject-country-successor-v23.json','content/civilization-atlas/reconfiguration/world-observation-projection-v1.json','functions/_lib/world-country-evidence.js','functions/_lib/world-observation-projection.js','functions/customer-projection/navigation-customer-projection.js','functions/profile/public-country-profile-r1.js','scripts/build-world-country-observation-p2.mjs','scripts/check-subject-country-spw-fin-r1.mjs','scripts/check-world-country-observation-p2.mjs','content/world/world-country-public-evidence-current.json','content/world/world-country-public-evidence-r2-dbce500dd6254804.json','content/world/world-country-refresh-status.json','scripts/check-world-country-latest.mjs','scripts/check-world-country-refresh.py','scripts/refresh-world-country-evidence.py','scripts/validate-world-country-refresh.mjs','content/production-closure/live-customer-commercial-convergence/MASTER-HUMAN-REVIEW.html']
paths +=[p.relative_to(r).as_posix()for p in (r/leaf).iterdir()if p.is_file()and p.name.startswith(('CORRECTION-','COUNTRY-YEAR-','MYS-2025-','BEFORE-','Country-','World-history-','Personal-en-'))]+[leaf+'EXECUTION-RECORD.md']
head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=r,text=True).strip();assert head=='2a56d976e1cff33a524efad6a5e4a61607e5cc4f';assert subprocess.check_output(['git','branch','--show-current'],cwd=r,text=True).strip()=='codex/spw-fin-r1'
remote=subprocess.check_output(['git','ls-remote','origin','refs/heads/codex/spw-fin-r1','refs/heads/main'],cwd=r,text=True);assert head in remote and '38eaebcf6d8d0628372eaa59a85da08a6a523fd5' in remote
wmda=subprocess.check_output(['git','diff-tree','--no-commit-id','--name-only','-r','88e5821b'],cwd=r,text=True).splitlines();wmdaHashes={p:hashlib.sha256(subprocess.check_output(['git','show','88e5821b:'+p],cwd=r)).hexdigest()for p in wmda};(q/'WMDA-PRESERVATION-CORRECTION.json').write_text(json.dumps({'commit':'88e5821b','files':wmdaHashes,'unchangedImmutableGitObjects':True},indent=2))
for rel in paths:
 p=r/rel
 if p.suffix in ['.js','.mjs','.py','.json','.css','.md','.log'] and p.exists():p.write_bytes(p.read_bytes().replace(b'\r\n',b'\n'))
subprocess.run(['C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',str(q/'update-correction-manifest.py')],check=True)
subprocess.run(['git','add','--',*paths],cwd=r,check=True)
staged=subprocess.check_output(['git','diff','--cached','--name-only'],cwd=r,text=True).splitlines();assert set(staged)<=set(paths),(set(staged)-set(paths))
subprocess.run(['git','diff','--cached','--check'],cwd=r,check=True)
(q/'CORRECTION-STAGED-FILES.json').write_text(json.dumps({'base':head,'paths':staged,'scope':'ONLY_AUTHORIZED_CORRECTION'},indent=2))
subprocess.run(['git','commit','-m','Correct Country evidence freshness and simplify World outcomes'],cwd=r,check=True)
print(subprocess.check_output(['git','rev-parse','HEAD'],cwd=r,text=True).strip())
