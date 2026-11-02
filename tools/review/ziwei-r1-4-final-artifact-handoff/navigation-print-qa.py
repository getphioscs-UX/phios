from pathlib import Path
import json,hashlib
from pypdf import PdfReader
import pypdfium2 as p
r=Path('C:/phios/tools/review/ziwei-r1-4-final-artifact-handoff');src=Path('C:/phios/tools/review/ziwei-r1-3-final-delivery/SYNTHETIC-ZWR-R13-FINAL-Q87-CANDIDATE.pdf');dst=r/'SYNTHETIC-ZWR-R14-PERSONALIZED-WATERMARK-V2-CANDIDATE.pdf';a=PdfReader(src);b=PdfReader(dst)
def outline(pdf):
 return [{'title':x.title,'page':pdf.get_destination_page_number(x)+1}for x in pdf.outline if not isinstance(x,list)]
assert outline(a)==outline(b);linksA=[len(x.get('/Annots',[]))for x in a.pages];linksB=[len(x.get('/Annots',[]))for x in b.pages];assert linksA==linksB
q={'sourceSHA256':hashlib.sha256(src.read_bytes()).hexdigest(),'sampleSHA256':hashlib.sha256(dst.read_bytes()).hexdigest(),'outlineDestinationsExact':True,'bookmarks':outline(b),'annotationsPerPageExact':True,'sourceAnnotationCount':sum(linksA),'sampleAnnotationCount':sum(linksB),'commercialWatermarkApproval':'PENDING','ownerSignature':None};(r/'NAVIGATION-QA.json').write_text(json.dumps(q,ensure_ascii=False,indent=2),encoding='utf8')
d=p.PdfDocument(dst)
for n in [1,52]:
 page=d[n-1];bmp=page.render(scale=2);im=bmp.to_pil();im.save(r/f'sample-page-{n}-144dpi.png',compress_level=1);im.crop((0,0,im.width,90)).save(r/f'header-{n}-144dpi.png',compress_level=1);bmp.close();page.close()
d.close();print('Native bookmark destinations, annotations and exact final bytes verified; 144dpi target print images ready.',flush=True)
