from pathlib import Path
import subprocess,json,hashlib,os
base=Path('C:/phios/tools/maintenance/repository-cleanup')
roots={'pr6':'C:/phios/.worktrees/pr6-ebook-closure','tarot':'C:/phios/.worktrees/tarot-pr8-safe','pages':'C:/Users/Guest Account/.codex/worktrees/pages-final-candidate/phios','narrative':'C:/Users/Guest Account/.codex/worktrees/report-narrative-validation/phios'}
def git(root,*args):return subprocess.check_output(['git','-C',root,*args])
rows=[]
for name,root in roots.items():
 changed=git(root,'diff','--name-only','HEAD','-z').decode('utf8').split('\0');untracked=git(root,'ls-files','--others','--exclude-standard','-z').decode('utf8').split('\0');files=[]
 for f in sorted(set(changed+untracked)-{''}):
  p=Path(root)/f
  files.append({'path':f,'kind':'untracked'if f in untracked else'tracked-change','exists':p.exists(),'bytes':p.stat().st_size if p.is_file()else 0,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()if p.is_file()else None})
 row={'name':name,'path':root,'head':git(root,'rev-parse','HEAD').decode().strip(),'branch':git(root,'symbolic-ref','--quiet','--short','HEAD').decode().strip()if git(root,'branch','--show-current').strip()else None,'uniqueCommits':git(root,'log','--format=%H %s','main..HEAD').decode().splitlines(),'status':git(root,'status','--porcelain=v1','--untracked-files=normal').decode(),'files':files,'recoverySourceBytes':sum(f['bytes']for f in files),'secretsPresent':[x.name for x in Path(root).iterdir()if x.name in ['.dev.vars','.env','.moomoo-auth','.aws']],'taskState':'Owner-requested development pause; recoverable checkout, not a claim of feature completion'}
 rows.append(row);(base/'CURRENT-WORKTREE-AUDIT.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf8');print(name,len(files),row['recoverySourceBytes'],len(row['uniqueCommits']),flush=True)
