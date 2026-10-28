from pathlib import Path
import json,gzip,os,hashlib,datetime
B=Path('C:/phios/tools/maintenance/repository-cleanup');R=Path('C:/phios')
plan=json.loads((B/'CURRENT-SNAPSHOT-RETIREMENT-PLAN.json').read_text(encoding='utf8'))
ready=[];blocked=[]
doneFile=B/'CURRENT-SNAPSHOT-DELETION.json'
done=json.loads(doneFile.read_text(encoding='utf-8-sig')) if doneFile.exists() else []
for i,row in enumerate(plan):
 if any(x['snapshot']==row['snapshot'] and x['status']=='DELETED' for x in done):continue
 root=Path(row['root']).absolute()
 assert root==R/row['snapshot'] and root!=R and R in root.parents
 archive=Path(row['archive']);assert hashlib.sha256(archive.read_bytes()).hexdigest()==row['archiveSHA256']
 junctions={p.name for p in root.iterdir() if os.path.isjunction(p)}
 targets=[str(p.absolute()) for p in root.iterdir() if p.name not in row['protectedTopEntries']]
 total=count=0;changes=[];mf=B/('DELETE-SNAPSHOT-'+str(i)+'.jsonl.gz')
 with gzip.open(row['manifest'],'rt',encoding='utf8') as src,gzip.open(mf,'wt',encoding='utf8') as dst:
  for line in src:
   f=json.loads(line);rel=Path(f['path']).relative_to(row['snapshot'])
   if rel.parts[0] in junctions:continue # Delete the link entry, never its target files.
   p=R/f['path'];s=p.stat()
   if s.st_size!=f['bytes'] or s.st_mtime_ns!=f['mtime_ns']:changes.append(f['path']);continue
   dst.write(line);total+=f['bytes'];count+=1
 if changes:
  blocked.append({'snapshot':row['snapshot'],'reason':'CHANGED_SINCE_VERIFIED_RECOVERY','paths':changes});continue
 ready.append({**row,'targets':targets,'junctionEntriesOnly':sorted(junctions),'files':count,'logicalBytes':total,'deletionManifest':str(mf),'preflightUTC':datetime.datetime.now(datetime.timezone.utc).isoformat()})
(B/'CURRENT-SNAPSHOT-DELETE-READY.json').write_text(json.dumps({'ready':ready,'blocked':blocked},indent=2),encoding='utf8')
print('READY',len(ready),'logicalBytes',sum(x['logicalBytes'] for x in ready),'BLOCKED',len(blocked),flush=True)
