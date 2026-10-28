import sqlite3,json,sys
d=sqlite3.connect('file:C:/phios/.tmp/repository-cleanup-current/inventory.sqlite?mode=ro',uri=True)
root=sys.argv[1]if len(sys.argv)>1 else'main'
print(root,'largest files');print(*d.execute('SELECT path,bytes FROM files WHERE root=? ORDER BY bytes DESC LIMIT 20',(root,)),sep='\n')
print('top-level groups');print(*d.execute("SELECT substr(path,1,instr(path||'/', '/')-1),sum(bytes),count(*) FROM files WHERE root=? GROUP BY 1 ORDER BY 2 DESC LIMIT 22",(root,)),sep='\n')
print('scratch groups');print(*d.execute("SELECT substr(path,1,instr(substr(path,instr(path,'/')+1)||'/', '/')+instr(path,'/')-1),sum(bytes),count(*) FROM files WHERE root=? AND (path LIKE '.tmp/%' OR path LIKE 'tmp/%') GROUP BY 1 ORDER BY 2 DESC LIMIT 35",(root,)),sep='\n')
