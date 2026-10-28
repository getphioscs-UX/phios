"""Small, verified recovery archives; no full checkout, credentials or dependencies."""
from pathlib import Path
import json, hashlib, subprocess, zipfile, os
BASE=Path('C:/phios/tools/maintenance/repository-cleanup')
DEST=Path('C:/phios-recovery/20261028')
audit=json.loads((BASE/'CURRENT-WORKTREE-AUDIT.json').read_text(encoding='utf8'))
def git(root,*args,env=None):
 return subprocess.check_output(['git','-C',str(root),*args],env=env)
def sha(data):return hashlib.sha256(data).hexdigest()
DEST.mkdir(parents=True,exist_ok=True)
results=[]
for row in audit:
 root=Path(row['path']).resolve(); name=row['name']
 assert git(root,'rev-parse','HEAD').decode().strip()==row['head'], 'HEAD changed'
 files={f['path']:dict(f) for f in row['files']}
 # Ignored handwritten helpers are not disposable simply because Git ignores them.
 scratch=root/'.tmp'
 if scratch.exists():
  for parent,dirs,names in os.walk(scratch):
   dirs[:]=[d for d in dirs if d not in ['node_modules','.wrangler','local-pages','.git','.pages-output'] and not d.startswith('build-snapshot')]
   for leaf in names:
    p=Path(parent)/leaf
    if p.suffix.lower() not in ['.mjs','.cjs','.py','.ts','.sql','.patch','.js']:continue
    if p.stat().st_size>2_000_000 or leaf in ['_worker.js','index.js']:continue
    rel=p.relative_to(root).as_posix()
    if rel in files:continue
    data=p.read_bytes()
    files[rel]={'path':rel,'kind':'ignored-source-helper','exists':True,'bytes':len(data),'sha256':sha(data)}
 patch=git(root,'diff','HEAD','--binary','--full-index')
 staged=git(root,'diff','--cached','--binary','--full-index')
 unstaged=git(root,'diff','--binary','--full-index')
 manifest={**{k:v for k,v in row.items() if k!='files'},'files':list(files.values()),'patchSHA256':sha(patch),'purpose':'Exact local recovery only; no feature acceptance or merge','excluded':'Dependencies, build output, credentials and regenerated scratch'}
 target=DEST/(name+'-source-recovery.zip')
 if target.exists():raise RuntimeError('Refusing archive overwrite: '+str(target))
 with zipfile.ZipFile(target,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
  z.writestr('MANIFEST.json',json.dumps(manifest,ensure_ascii=False,indent=2))
  z.writestr('tracked.patch',patch);z.writestr('staged.patch',staged);z.writestr('unstaged.patch',unstaged)
  for f in files.values():
   if not f['exists']:continue
   p=root/f['path'];assert p.is_file() and not p.is_symlink()
   data=p.read_bytes();assert len(data)==f['bytes'] and sha(data)==f['sha256'], 'Concurrent file change: '+str(p)
   z.writestr('files/'+f['path'],data)
 with zipfile.ZipFile(target) as z:
  assert z.testzip() is None
  for f in files.values():
   if f['exists']:assert sha(z.read('files/'+f['path']))==f['sha256']
  assert z.read('tracked.patch')==patch
 # Check tracked recovery against an isolated index, without another checkout.
 idx=DEST/(name+'-verification.index');env=dict(os.environ,GIT_INDEX_FILE=str(idx))
 git(root,'read-tree','HEAD',env=env)
 pf=DEST/(name+'-tracked.patch');pf.write_bytes(patch)
 if patch:git(root,'apply','--cached','--check','--binary',str(pf),env=env)
 idx.unlink();pf.unlink()
 record={'name':name,'path':str(root),'archive':str(target),'archiveBytes':target.stat().st_size,'archiveSHA256':sha(target.read_bytes()),'files':len(files),'rawRecoveryBytes':sum(f['bytes'] for f in files.values()),'binaryPatchCheck':'PASS','rawFileHashCheck':'PASS','HEAD':row['head'],'branch':row['branch'],'uniqueCommitCount':len(row['uniqueCommits'])}
 results.append(record);(BASE/'CURRENT-RECOVERY-VERIFIED.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf8')
 print(name,record['files'],record['archiveBytes'],'VERIFIED',flush=True)
