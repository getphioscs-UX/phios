from pathlib import Path
import json, hashlib
import pypdfium2 as pdfium
from pypdf import PdfReader

root=Path('C:/phios'); out=root/'tools/review/five-method-paid-report-r1'; (out/'screenshots').mkdir(exist_ok=True)
prior=json.loads((root/'tools/review/report-storage-optimization-r1/SIZE-AUDIT.json').read_text(encoding='utf-8'))
ids=['AST-current-r21','BZR-controlled-p7','ZWR-current-r22','NUM-current-bilingual','HD-current-bilingual']
rows=[]
for id in ids:
 old=next(r for r in prior['reports'] if r['id']==id); p=root/old['path']; digest=hashlib.sha256(p.read_bytes()).hexdigest(); doc=pdfium.PdfDocument(str(p)); reader=PdfReader(p)
 text=[]
 for page in doc:
  textpage=page.get_textpage();text.append(textpage.get_text_range());textpage.close();page.close()
 count=len(doc); shots=[]
 for n in sorted(set([min(6,count-1),count//2])):
  dest=out/'screenshots'/f'{old["method"]}-page-{n+1}.png';page=doc[n];bitmap=page.render(scale=1);bitmap.to_pil().save(dest);bitmap.close();page.close();shots.append({'page':n+1,'path':str(dest)})
 rows.append({'id':id,'method':old['method'],'path':str(p),'bytes':p.stat().st_size,'sha256':digest,'priorIdentityMatches':digest==old['sha256'],'pageCount':count,'priorPageCountMatches':count==old['pageCount'],'producer':str((reader.metadata or {}).get('/Producer','')),'extractableTextCharacters':sum(map(len,text)),'pagesWithExtractableText':sum(bool(t.strip()) for t in text),'bookmarks':len(reader.outline),'syntheticMarked':any('SYNTHETIC' in t.upper() for t in text),'screenshots':shots,'scope':old['scope'],'customerReleaseProven':False,'newGeneration':False,'manuscriptApprovalInferred':False})
 doc.close()
(out/'EXISTING-PDF-AUDIT.json').write_text(json.dumps({'reports':rows,'note':'Existing actual complete local PDFs; no provider generation or new authoring. Text extraction does not establish absence of overlap or formal production admission.'},indent=2),encoding='utf-8')
print([(r['method'],r['pageCount'],r['priorIdentityMatches']) for r in rows])
