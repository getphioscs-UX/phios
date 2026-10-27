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
 writer.append(reader,import_outline=True)
 for page in writer.pages:
  width,height=float(page.mediabox.width),float(page.mediabox.height)
  b=io.BytesIO();c=canvas.Canvas(b,pagesize=(width,height),invariant=1)
  # A light backing keeps the test watermark readable on full-bleed dark covers.
  # This changes only QA derivatives, never the accepted source PDF.
  c.setFillAlpha(.92);c.setFillColorRGB(1,1,1);c.rect(8,5,width-16,18,stroke=0,fill=1)
  c.setFillAlpha(1);c.setFillColorRGB(.12,.16,.18);c.setFont('Helvetica',8);c.drawString(12,12,label);c.save();page.merge_page(PdfReader(io.BytesIO(b.getvalue())).pages[0])
 writer.add_metadata({'/PHIOSLicense':label,'/PHIOSSourceSHA256':hashlib.sha256(raw).hexdigest()});out=io.BytesIO();writer.write(out);sys.stdout.buffer.write(out.getvalue())
elif sys.argv[1]=='inspect':
 r=PdfReader(io.BytesIO(sys.stdin.buffer.read()));print(json.dumps({'pages':len(r.pages),'watermarkedPages':sum('Licensed to SYNTHETIC ACCOUNT' in (p.extract_text() or '') for p in r.pages),'sourceSha256':r.metadata.get('/PHIOSSourceSHA256')}))
