from pathlib import Path
import os,stat,sqlite3,json,time,shutil
base=Path('C:/phios/tools/maintenance/repository-cleanup');dbpath=Path('C:/phios/.tmp/repository-cleanup-current/inventory.sqlite');dbpath.parent.mkdir(exist_ok=True,parents=True)
if dbpath.exists():raise RuntimeError('Current inventory already exists; review before replacing')
db=sqlite3.connect(dbpath);db.execute('PRAGMA journal_mode=OFF');db.execute('CREATE TABLE files(root TEXT,path TEXT,bytes INTEGER,mtime_ns INTEGER,nlink INTEGER,inode TEXT,unique_bytes INTEGER)')
roots=[('main','C:/phios'),('pr6','C:/phios/.worktrees/pr6-ebook-closure'),('tarot','C:/phios/.worktrees/tarot-pr8-safe'),('pages','C:/Users/Guest Account/.codex/worktrees/pages-final-candidate/phios'),('narrative','C:/Users/Guest Account/.codex/worktrees/report-narrative-validation/phios'),('git','C:/phios/.git')]
seen=set();summary={};errors=[];batch=[];start=time.time()
for name,root in roots:
 total=count=unique=0;groups={};largest=[];links=0
 for current,dirs,files in os.walk(root,followlinks=False):
  dirs[:]=[d for d in dirs if not (name=='main'and Path(current)==Path(root)and d in ['.git','.worktrees'])and not os.path.islink(os.path.join(current,d))]
  for f in files:
   p=Path(current)/f
   if p==dbpath:continue
   try:
    s=p.stat(follow_symlinks=False)
    if not stat.S_ISREG(s.st_mode):continue
    rel=p.relative_to(root).as_posix();key=(s.st_dev,s.st_ino);u=s.st_size
    if s.st_nlink>1:
     links+=1
     if key in seen:u=0
     else:seen.add(key)
    total+=s.st_size;unique+=u;count+=1
    parts=rel.split('/');depth=3 if parts[0]in ['tools','output','docs','content']else 2 if parts[0]in ['.tmp','tmp','artifacts','.wrangler']else 1;g='/'.join(parts[:depth]);groups[g]=groups.get(g,0)+s.st_size
    batch.append((name,rel,s.st_size,s.st_mtime_ns,s.st_nlink,str(s.st_ino),u))
    if len(batch)>=1000:db.executemany('INSERT INTO files VALUES(?,?,?,?,?,?,?)',batch);batch=[]
   except OSError as e:errors.append({'path':str(p),'error':str(e)})
 if batch:db.executemany('INSERT INTO files VALUES(?,?,?,?,?,?,?)',batch);batch=[]
 db.commit();summary[name]={'path':root,'logicalBytes':total,'deduplicatedHardlinkBytes':unique,'files':count,'multiplyLinkedFiles':links,'topGroups':sorted(groups.items(),key=lambda x:-x[1])[:60]};print(name,count,total,flush=True)
db.execute('CREATE INDEX file_path ON files(root,path)');db.commit()
result={'utc':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'elapsedSeconds':time.time()-start,'unit':'bytes; decimalGB=1e9','roots':summary,'errors':errors,'hardlinks':'deduplicated by NTFS device/inode only where nlink>1; logical bytes and measured free-space delta reported independently','nestedWorktreesExcludedFromMain':True,'sharedGitCountedOnce':True,'database':str(dbpath),'freeAtEnd':shutil.disk_usage('C:/').free}
(base/'CURRENT-BASELINE-INVENTORY.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8');db.close()
