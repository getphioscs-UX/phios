"""Retire only exactly preserved checkouts, using normal Git worktree removal."""
from pathlib import Path
import json,subprocess,hashlib,zipfile,gzip,sqlite3,datetime,os
B=Path('C:/phios/tools/maintenance/repository-cleanup')
recovery=json.loads((B/'CURRENT-RECOVERY-VERIFIED.json').read_text(encoding='utf8'))
audit={r['name']:r for r in json.loads((B/'CURRENT-WORKTREE-AUDIT.json').read_text(encoding='utf8'))}
c=sqlite3.connect('file:C:/phios/.tmp/repository-cleanup-current/inventory.sqlite?mode=ro',uri=True)
def git(root,*args):return subprocess.check_output(['git','-C',str(root),*args],stderr=subprocess.STDOUT)
receipt=B/'CURRENT-WORKTREE-RETIREMENT.json'
results=json.loads(receipt.read_text(encoding='utf8')) if receipt.exists() else []
for r in recovery:
 if any(x['name']==r['name'] for x in results):continue
 root=Path(r['path']).resolve();a=audit[r['name']]
 assert str(root).casefold()==str(Path(a['path']).resolve()).casefold()
 assert root.name in ['pr6-ebook-closure','tarot-pr8-safe','phios'] and root!=Path('C:/phios')
 if not root.exists():
  # Git completed Tarot removal but left a dependency junction. The entry was
  # removed non-recursively, with its main-target dependency hash unchanged.
  assert r['name']=='tarot' and (B/'RETIRED-tarot-FILES.jsonl.gz').exists()
  assert str(root).replace('\\','/') not in git('C:/phios','worktree','list','--porcelain').decode()
  logical,count=c.execute('select sum(bytes),count(*) from files where root=?',(r['name'],)).fetchone()
  results.append({**r,'status':'REMOVED_NORMALLY','logicalBytesBefore':logical,'filesBefore':count,'logicalBytesAfter':0,'manifest':str(B/'RETIRED-tarot-FILES.jsonl.gz'),'note':'Normal Git removal left only a junction; link entry removed non-recursively; main node_modules preserved'})
  receipt.write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf8');continue
 assert git(root,'rev-parse','HEAD').decode().strip()==r['HEAD']
 archive=Path(r['archive']);assert hashlib.sha256(archive.read_bytes()).hexdigest()==r['archiveSHA256']
 with zipfile.ZipFile(archive) as z:
  m=json.loads(z.read('MANIFEST.json'))
  assert git(root,'diff','HEAD','--binary','--full-index')==z.read('tracked.patch')
  now=set(git(root,'ls-files','--others','--exclude-standard','-z').decode().split('\0'))-{''}
  assert now=={f['path'] for f in a['files'] if f['kind']=='untracked'},'New untracked source; stop'
  for f in m['files']:
   p=root/f['path'];assert p.exists()==f['exists']
   if f['exists']:assert hashlib.sha256(p.read_bytes()).hexdigest()==f['sha256'],'Source changed; stop'
  if not r['branch']:
   branch='codex/recovery-'+r['name']+'-20261028'
   git('C:/phios','branch',branch,r['HEAD']);r['recoveryBranch']=branch
  # Manifest is durable before any working-file deletion/restoration.
  mf=B/('RETIRED-'+r['name']+'-FILES.jsonl.gz')
  with gzip.open(mf,'wt',encoding='utf8') as out:
   for path,size,mtime in c.execute('select path,bytes,mtime_ns from files where root=?',(r['name'],)):
    out.write(json.dumps({'path':path,'bytes':size,'mtime_ns':mtime,'reason':'Retired checkout; commits retained; modified source verified in recovery ZIP'})+'\n')
  assert mf.stat().st_size>0
  tracked=[f['path'] for f in a['files'] if f['kind']=='tracked-change']
  if tracked:git(root,'restore','--source=HEAD','--staged','--worktree','--',*tracked)
  for f in a['files']:
   if f['kind']=='untracked' and f['exists']:
    p=root/f['path'];assert p.is_file() and root in p.resolve().parents;p.unlink()
  status=git(root,'status','--porcelain=v1','--untracked-files=all').decode()
  assert not status.strip(),'Not clean after exact source preservation; retain checkout'
  logical,count=c.execute('select sum(bytes),count(*) from files where root=?',(r['name'],)).fetchone()
  git('C:/phios','worktree','remove',str(root))
  if root.exists():
   marker=Path('C:/phios/node_modules/esbuild/package.json')
   original=hashlib.sha256(marker.read_bytes()).hexdigest()
   for entry in root.iterdir():
    assert os.path.isjunction(entry) and entry.name=='node_modules'
    assert entry.resolve()==Path('C:/phios/node_modules')
    os.rmdir(entry) # RemoveDirectory on junction entry only; never recurse into target.
   os.rmdir(root)
   assert hashlib.sha256(marker.read_bytes()).hexdigest()==original
  assert not root.exists()
  results.append({**r,'status':'REMOVED_NORMALLY','logicalBytesBefore':logical,'filesBefore':count,'logicalBytesAfter':0,'manifest':str(mf),'utc':datetime.datetime.now(datetime.timezone.utc).isoformat()})
  (B/'CURRENT-WORKTREE-RETIREMENT.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf8')
  print(r['name'],'REMOVED_NORMALLY',logical,flush=True)
