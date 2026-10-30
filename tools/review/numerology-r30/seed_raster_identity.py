"""Bind already completed actual raster evidence to full page appearance."""
import json,hashlib
from pathlib import Path
from pypdf import PdfReader
from pdf_appearance import page_appearance_fingerprints
root=Path('tools/review/numerology-r30');gen=json.loads((root/'GENERATION.json').read_text(encoding='utf-8'));qa=json.loads((root/'PDF-QA.json').read_text(encoding='utf-8'))
for r in gen['results']:
 p=Path(r['pdf']);identity=p.parent/'RASTER-IDENTITY.json';j=json.loads(identity.read_text());assert j['sha256']==r['pdfSHA256']==hashlib.sha256(p.read_bytes()).hexdigest();assert any(x['sha256']==r['pdfSHA256']for x in qa['audits'])
 images=sorted((p.parent/'pages').glob('page-*.png'));assert len(images)==r['pages'];j['appearanceFingerprints']=page_appearance_fingerprints(PdfReader(p));j['pngSHA256']=[hashlib.sha256(x.read_bytes()).hexdigest()for x in images];identity.write_text(json.dumps(j),encoding='utf-8')
 print(r['id'],r['locale'],'appearance-bound actual raster identity',flush=True)
