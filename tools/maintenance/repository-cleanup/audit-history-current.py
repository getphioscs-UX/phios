from pathlib import Path
import subprocess,json,re
B=Path('C:/phios/tools/maintenance/repository-cleanup')
def git(*args,**kw):return subprocess.check_output(['git',*args],**kw)
raw=git('rev-list','--objects','--all').decode('utf8',errors='replace').splitlines()
paths={x.split(' ',1)[0]:x.split(' ',1)[1] if ' ' in x else '' for x in raw}
p=subprocess.run(['git','cat-file','--batch-check=%(objectname) %(objecttype) %(objectsize) %(objectsize:disk)'],input=('\n'.join(paths)+'\n').encode(),capture_output=True,check=True)
blobs=[];candidates=[]
for line in p.stdout.decode().splitlines():
 oid,kind,size,disk=line.split()
 if kind!='blob':continue
 path=paths[oid];row=dict(oid=oid,path=path,logicalBytes=int(size),storedBytes=int(disk));blobs.append(row)
 eligible=(path.startswith('tmp/') or '/build-snapshot-' in path or path=='tools/review/PHI-OS-PRODUCTION-CLOSURE-REVIEW.html' or bool(re.match(r'output/pdf/(numerology-r20|hd-r51-partial-review)/.*\.(png|pdf|html)$',path)) or bool(re.match(r'tools/review/visual-binding-r[56]/browser-[^/]+/.*\.png$',path)))
 if eligible:candidates.append(row)
refs=git('for-each-ref','--format=%(refname) %(objectname)').decode().splitlines()
result={'measurement':'Read-only reachable blob metadata, no gc/repack; shared blobs have one representative historical path','reachableBlobs':len(blobs),'reachableLogicalBytes':sum(x['logicalBytes']for x in blobs),'largest':sorted(blobs,key=lambda x:-x['logicalBytes'])[:30],'proposedPaths':sorted(set(x['path']for x in candidates)),'candidateLogicalUpperBound':sum(x['logicalBytes']for x in candidates),'candidateStoredUpperBound':sum(x['storedBytes']for x in candidates),'estimateCaveat':'Upper bounds, not promised reclaim: other paths may retain identical blobs; packs may share deltas. Precise rewrite simulation belongs to a separately authorized external clone.','allRefsInPotentialRewriteScope':refs,'historyRewriteExecuted':False,'objectsDeleted':False}
(B/'CURRENT-HISTORY-AUDIT.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
print('Reachable blobs',len(blobs),'logical bytes',result['reachableLogicalBytes'],'candidate paths',len(result['proposedPaths']),'stored upper bound',result['candidateStoredUpperBound'],flush=True)
