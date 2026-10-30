from pathlib import Path
from io import BytesIO
import json,hashlib
from pypdf import PdfReader,PdfWriter
from reportlab.pdfgen import canvas
import pypdfium2 as pdfium
r=Path('C:/phios/tools/review/five-method-paid-report-r1');source=r/'SYNTHETIC-BZR-INITIAL-PDF.pdf';reader=PdfReader(source);writer=PdfWriter()
for page in reader.pages:
 w,h=float(page.mediabox.width),float(page.mediabox.height);b=BytesIO();c=canvas.Canvas(b,pagesize=(w,h));c.setFillColorRGB(.6,.1,.1);c.setFont('Helvetica-Bold',8);c.drawCentredString(w/2,h-9,'SYNTHETIC QA - NOT A CUSTOMER REPORT');c.save();b.seek(0);page.merge_page(PdfReader(b).pages[0]);writer.add_page(page)
writer.add_metadata({'/Title':'SYNTHETIC QA - BaZi Delivery Review','/Subject':'Review-only visible watermark copy. Native issued bytes preserved separately; not a commercial report.'})
out=r/'SYNTHETIC-BZR-REVIEW-WATERMARKED.pdf'
with out.open('wb') as f:writer.write(f)
doc=pdfium.PdfDocument(out)
for n in [0,9,24,47]:
 p=doc[n];b=p.render(scale=1);b.to_pil().save(r/'screenshots'/f'BZR-REVIEW-page-{n+1}.png');b.close();p.close()
doc.close();(r/'REVIEW-WATERMARK-PROVENANCE.json').write_text(json.dumps({'sourceSHA256':hashlib.sha256(source.read_bytes()).hexdigest(),'reviewSHA256':hashlib.sha256(out.read_bytes()).hexdigest(),'sourceBytes':source.stat().st_size,'reviewBytes':out.stat().st_size,'pages':48,'reviewOnly':True,'originalUnchanged':True,'visibleSyntheticMarkAll48Pages':True,'notCommercialWatermarkAcceptance':True},indent=2));print('Review-only SYNTHETIC copy created; native issued original preserved')
