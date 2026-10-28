from pathlib import Path
import sqlite3,json
B=Path('C:/phios/tools/maintenance/repository-cleanup')
c=sqlite3.connect('file:C:/phios/.tmp/repository-cleanup-current/inventory.sqlite?mode=ro',uri=True)
# All roots are on the same recorded C: volume. NTFS file IDs also detect
# directory-junction aliases whose target files have nlink=1.
assert c.execute("select count(*) from files where inode='0'").fetchone()[0]==0
sql="""with ranked as (select *,row_number() over(partition by inode order by case root when 'main' then 0 when 'git' then 1 else 2 end,length(path),rowid) rn from files)
select root,sum(bytes),count(*),sum(case when rn=1 then bytes else 0 end),sum(case when rn=1 then 1 else 0 end) from ranked where nlink>1 or rn=1 group by root"""
out={'volumeSerial':'3472030B','method':'NTFS inode on single C: volume; junction aliases excluded even when target nlink=1; hardlink names count logically, shared file bytes once globally','scope':'Correction of raw inventory traversal totals, not a claim of physical allocation','roots':{}}
for root,logical,count,unique,uniqueCount in c.execute(sql):out['roots'][root]={'logicalBytesExcludingJunctionAliases':logical,'filesExcludingJunctionAliases':count,'uniqueFileLogicalBytes':unique,'uniqueFileCount':uniqueCount}
out['allRootsUniqueFileLogicalBytes']=sum(x['uniqueFileLogicalBytes']for x in out['roots'].values())
(B/'CURRENT-BASELINE-CORRECTED.json').write_text(json.dumps(out,indent=2),encoding='utf8')
print('Corrected baseline unique-file logical bytes',out['allRootsUniqueFileLogicalBytes'],flush=True)
