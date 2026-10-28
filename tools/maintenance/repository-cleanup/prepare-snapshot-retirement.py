"""Prove old snapshot source recoverability; preserve only unique handwritten data."""
from pathlib import Path
import subprocess,sqlite3,json,hashlib,zipfile,gzip,os,datetime
B=Path('C:/phios/tools/maintenance/repository-cleanup');R=Path('C:/phios')
D=Path('C:/phios-recovery/20261028');D.mkdir(parents=True,exist_ok=True)
roots=['tmp/p9-d1i1/r1','tmp/p9-d1i1/source','tmp/p9-g3-r6-e1/source','tmp/p9-g3-r6-e1/runtime-source','tmp/p9-t8-r4a/source-blob','.tmp/founder-r2-pages-1791640701568','.tmp/world-ux-r1-local-artifact-20261019','tools/review/external-reality-cross-domain-r1/build-snapshot-1791628618204']
objects=subprocess.check_output(['git','-C',str(R),'rev-list','--objects','--all'])
reachable={line.split(b' ',1)[0].decode() for line in objects.splitlines()}
c=sqlite3.connect('file:C:/phios/.tmp/repository-cleanup-current/inventory.sqlite?mode=ro',uri=True)
history_parts={'node_modules','.pages-output','.wrangler','output'}
secret_names={'.dev.vars','.env','.moomoo-auth','.aws'}
binary={'.png','.jpg','.jpeg','.gif','.pdf','.zip','.tar','.gz','.webp','.exe','.woff','.woff2','.mp4'}
prior=B/'CURRENT-SNAPSHOT-RETIREMENT-PLAN.json'
out=json.loads(prior.read_text(encoding='utf8')) if prior.exists() else []
for num,prefix in enumerate(roots):
 if any(x['snapshot']==prefix for x in out):continue
 root=(R/prefix).resolve();assert R in root.parents
 rows=list(c.execute('select path,bytes,mtime_ns from files where root=? and path like ?',('main',prefix+'/%')))
 if not rows:continue
 protected=set()
 for p,size,mt in rows:
  rel=Path(p[len(prefix)+1:]);parts=rel.parts
  if '.git' in parts:protected.add(parts[0])
  if any(x in secret_names for x in parts) and 'node_modules' not in parts:protected.add(parts[0])
 zpath=D/('old-snapshot-'+str(num)+'-unique-source-resume.zip')
 manifest=B/('SNAPSHOT-'+str(num)+'-RETIREMENT.jsonl.gz')
 count=total=unique=kept=0; reasons={};checks=[];inventoryChanges=[]
 junctions={p.name for p in root.iterdir() if os.path.isjunction(p)}
 # The complete deletion manifest and recovery archive precede all deletion.
 with zipfile.ZipFile(zpath,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z,gzip.open(manifest,'wt',encoding='utf8') as m:
  for p,size,mt in rows:
   rel=Path(p[len(prefix)+1:]);f=R/p
   if rel.parts[0] in protected:kept+=size;continue
   if rel.parts[0] in junctions:continue
   s=f.stat()
   if s.st_size!=size or s.st_mtime_ns!=mt:inventoryChanges.append(p)
   size=s.st_size;mt=s.st_mtime_ns
   if f.is_symlink() or os.path.isjunction(f):raise RuntimeError('Unexpected reparse file '+p)
   if any(x in history_parts for x in rel.parts) or f.name in ['_worker.js','source.tar']:
    reason='REBUILDABLE_OLD_SNAPSHOT_OUTPUT';oid=None
   elif f.suffix.lower() in binary and any(x in ['tools','docs','artifacts','.tmp','tmp','.phios-repair-backups'] for x in rel.parts):
    reason='RETIRED_HISTORICAL_EVIDENCE_COPY';oid=None
   else:
    h=hashlib.sha1();h.update(('blob '+str(size)+'\0').encode());sha=hashlib.sha256()
    with f.open('rb') as src:
     while True:
      block=src.read(1024*1024)
      if not block:break
      h.update(block);sha.update(block)
    oid=h.hexdigest()
    if oid in reachable:reason='EXACT_BLOB_REACHABLE_FROM_RETAINED_GIT_REFS'
    else:
     if unique+size>150_000_000:raise RuntimeError('Unique-source recovery would exceed small-package cap: '+p)
     reason='UNIQUE_SOURCE_PRESERVED_VERIFIED';unique+=size
     key=rel.as_posix();z.write(f,'files/'+key);checks.append((key,sha.hexdigest(),size))
   after=f.stat();assert after.st_size==size and after.st_mtime_ns==mt,'Changed during recovery: '+p
   reasons[reason]=reasons.get(reason,0)+size;total+=size;count+=1
   m.write(json.dumps({'path':p,'bytes':size,'mtime_ns':mt,'reason':reason,'gitBlob':oid})+'\n')
  z.writestr('RECOVERY.json',json.dumps({'snapshot':prefix,'preserved':checks,'retainedGitRefsAtHead':subprocess.check_output(['git','rev-parse','HEAD']).decode().strip(),'protectedTopEntries':sorted(protected)}))
 with zipfile.ZipFile(zpath) as z:
  assert z.testzip() is None
  for key,sha,size in checks:
   data=z.read('files/'+key);assert len(data)==size and hashlib.sha256(data).hexdigest()==sha
 # Keep the link entry path. Resolving a junction here could target main's dependencies.
 targets=[str(p.absolute()) for p in root.iterdir() if p.name not in protected]
 result={'snapshot':prefix,'root':str(root),'targets':targets,'files':count,'logicalBytes':total,'protectedBytes':kept,'protectedTopEntries':sorted(protected),'inventoryChangesRemeasuredAndVerified':inventoryChanges,'reasons':reasons,'uniqueSourceBytes':unique,'archive':str(zpath),'archiveSHA256':hashlib.sha256(zpath.read_bytes()).hexdigest(),'manifest':str(manifest),'recoveryVerification':'PASS','utc':datetime.datetime.now(datetime.timezone.utc).isoformat()}
 out.append(result);(B/'CURRENT-SNAPSHOT-RETIREMENT-PLAN.json').write_text(json.dumps(out,indent=2),encoding='utf8')
 print(prefix,count,total,'unique preserved',unique,'protected',kept,flush=True)
