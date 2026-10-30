from pathlib import Path
import json,hashlib,sys,shutil
sys.path.insert(0,str(Path('scripts/lib').resolve()))
from disk_space_guard import require_disk_space
D=Path('tools/review/hd-r6/import-20261027/r611b');p=D/'ACTUAL-P06-BINDING-PDFS.json';doc=json.loads(p.read_text());require_disk_space('R611B six current local TOC review deliverables',sum(x['bytes'] for x in doc['PDFs'])+1_000_000);O=Path('output/pdf/report-p06-r611b');O.mkdir(parents=True,exist_ok=True)
for a in doc['PDFs']:
 src=Path(a['file']);dest=O/('PHIOS-R611B-'+a['methodId']+'-P06-BINDING-REVIEW.pdf');data=src.read_bytes();assert hashlib.sha256(data).hexdigest()==a['sha256']
 if dest.exists():assert dest.read_bytes()==data
 else:dest.write_bytes(data)
 a['temporaryFile']=a['file'];a['file']=str(dest).replace('\\','/');a['isolatedCopyReopenedAndHashVerified']=hashlib.sha256(dest.read_bytes()).hexdigest()==a['sha256']
p.write_text(json.dumps(doc,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Six current review-only TOC PDFs copied, independently reopened with exact SHA; no historical overwrite')
