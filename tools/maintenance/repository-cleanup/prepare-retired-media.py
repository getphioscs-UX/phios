from pathlib import Path
import sqlite3,json,hashlib
R=Path('C:/phios');B=R/'tools/maintenance/repository-cleanup'
c=sqlite3.connect('file:C:/phios/.tmp/repository-cleanup-current/inventory.sqlite?mode=ro',uri=True)
rows=[]
for p,size,mt in c.execute("select path,bytes,mtime_ns from files where root='main'"):
 reason=None
 if p.startswith('.tmp/ecr-r33-binding-closure-20261027/') and p.endswith('-INITIAL-RESOURCE-DUPLICATION.pdf'):reason='Resolved initial resource-duplication PDF; current optimized PDFs retained'
 if p.startswith('output/pdf/numerology-r20/') and Path(p).suffix.lower() in ['.pdf','.png','.html']:reason='Superseded Numerology R20 rendered media; R21 current media and R20 source JSON retained'
 if p.startswith('output/pdf/hd-r51-partial-review/') and Path(p).suffix.lower()=='.pdf':reason='Superseded partial synthetic HD R51 review; complete current R65 review retained'
 if p=='tmp/p9-d1i1/source.tar':reason='Expired sparse source export; source identities and unique overlays preserved in verified recovery'
 if reason:
  f=R/p;s=f.stat();assert s.st_size==size and s.st_mtime_ns==mt
  rows.append(dict(path=str(f),bytes=size,mtimeNs=mt,sha256=hashlib.sha256(f.read_bytes()).hexdigest(),reason=reason))
(B/'CURRENT-RETIRED-MEDIA-MANIFEST.json').write_text(json.dumps(rows,indent=2),encoding='utf8')
protected=[]
for prefix in ['output/pdf/numerology-r21','.tmp/ecr-r33-binding-closure-20261027','output/pdf/hd-r65-owner-review']:
 for f in (R/prefix).rglob('*.pdf'):
  if 'INITIAL-RESOURCE-DUPLICATION' not in f.name:protected.append(dict(path=str(f),bytes=f.stat().st_size,sha256=hashlib.sha256(f.read_bytes()).hexdigest()))
f=R/'output/pdf/numerology-r20/CONTENT-19-BILINGUAL.json';protected.append(dict(path=str(f),bytes=f.stat().st_size,sha256=hashlib.sha256(f.read_bytes()).hexdigest()))
(B/'CURRENT-PROTECTED-REVIEW-HASHES.json').write_text(json.dumps(protected,indent=2),encoding='utf8')
print('Retired media',len(rows),sum(x['bytes']for x in rows),'bytes; protected current PDFs/source records',len(protected))
