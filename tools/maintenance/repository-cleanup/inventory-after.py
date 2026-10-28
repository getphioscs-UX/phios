from pathlib import Path
import os,stat,json,time,heapq,shutil,datetime,collections
R=Path('C:/phios');B=R/'tools/maintenance/repository-cleanup';seen=set();roots={};topfiles=[];dirs=collections.defaultdict(int);pngCount=pngBytes=0;errors=[];junctions=[]
for name,root in [('main',R),('git',R/'.git')]:
 logical=unique=count=0
 for parent,ds,fs in os.walk(root,followlinks=False):
  keep=[]
  for d in ds:
   p=Path(parent)/d
   if name=='main' and Path(parent)==root and d in ['.git','.worktrees']:continue
   if p.is_symlink() or os.path.isjunction(p):junctions.append(str(p));continue
   keep.append(d)
  ds[:]=keep
  for leaf in fs:
   p=Path(parent)/leaf
   if p.name=='inventory.sqlite' and p.parent==R/'.tmp/repository-cleanup-current':continue
   try:
    s=p.stat(follow_symlinks=False)
    if not stat.S_ISREG(s.st_mode):continue
    key=(s.st_dev,s.st_ino);u=0 if key in seen else s.st_size;seen.add(key)
    count+=1;logical+=s.st_size;unique+=u
    rel=p.relative_to(root);group=str(root/rel.parts[0]) if len(rel.parts)>1 else str(root/'(root files)');dirs[group]+=s.st_size
    heapq.heappush(topfiles,(s.st_size,str(p)))
    if len(topfiles)>20:heapq.heappop(topfiles)
    if name=='main' and p.suffix.lower()=='.png':pngCount+=1;pngBytes+=s.st_size
   except OSError as e:errors.append({'path':str(p),'error':str(e)})
 roots[name]={'path':str(root),'logicalBytes':logical,'files':count,'uniqueFileLogicalBytes':unique}
 print(name,count,logical,flush=True)
result={'utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'volumeSerial':'3472030B','unit':'bytes; decimal GB=1e9','roots':roots,'allRootsUniqueFileLogicalBytes':sum(r['uniqueFileLogicalBytes']for r in roots.values()),'retainedLinkedWorktrees':0,'png':{'files':pngCount,'logicalBytes':pngBytes},'largest20Files':[{'path':p,'bytes':b}for b,p in sorted(topfiles,reverse=True)],'largest20NonoverlappingDirectories':[{'path':p,'bytes':b}for p,b in sorted(dirs.items(),key=lambda x:-x[1])[:20]],'junctionsNotFollowed':junctions,'errors':errors,'driveFreeBytes':shutil.disk_usage('C:/').free,'caveat':'Unique file logical bytes are not NTFS allocated clusters; actual volume free measured separately'}
(B/'CURRENT-AFTER-INVENTORY.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
