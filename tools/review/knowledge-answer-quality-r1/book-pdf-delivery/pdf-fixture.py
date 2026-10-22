"""Local test adapter for the EXISTING watermark contract; not a deployed service."""
import sys,io,json,hashlib
from pypdf import PdfReader,PdfWriter
from reportlab.pdfgen import canvas
if sys.argv[1]=='make':
 b=io.BytesIO();c=canvas.Canvas(b,invariant=1)
 for i in range(2):c.drawString(50,750,f'Synthetic {sys.argv[2]} full PDF page {i+1}');c.showPage()
 c.save();sys.stdout.buffer.write(b.getvalue())
elif sys.argv[1]=='stamp':
 raw=sys.stdin.buffer.read();reader=PdfReader(io.BytesIO(raw));writer=PdfWriter();label='Licensed to SYNTHETIC ACCOUNT - '+sys.argv[2]
 for page in reader.pages:
  b=io.BytesIO();c=canvas.Canvas(b,pagesize=(float(page.mediabox.width),float(page.mediabox.height)),invariant=1);c.setFillAlpha(.22);c.setFont('Helvetica',8);c.drawString(12,12,label);c.save();page.merge_page(PdfReader(io.BytesIO(b.getvalue())).pages[0]);writer.add_page(page)
 writer.add_metadata({'/PHIOSLicense':label,'/PHIOSSourceSHA256':hashlib.sha256(raw).hexdigest()});out=io.BytesIO();writer.write(out);sys.stdout.buffer.write(out.getvalue())
elif sys.argv[1]=='inspect':
 r=PdfReader(io.BytesIO(sys.stdin.buffer.read()));print(json.dumps({'pages':len(r.pages),'watermarkedPages':sum('Licensed to SYNTHETIC ACCOUNT' in (p.extract_text() or '') for p in r.pages),'sourceSha256':r.metadata.get('/PHIOSSourceSHA256')}))
