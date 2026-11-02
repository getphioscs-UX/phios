import json,io,hashlib,sys
from pathlib import Path
from pypdf import PdfReader,PdfWriter
from pypdf.generic import NameObject
from reportlab.pdfgen import canvas
import pypdfium2 as pdfium
from PIL import ImageChops
r=Path('C:/phios/tools/review/ziwei-r1-3-final-delivery'); old=Path('C:/phios/tools/review/r12-acceptance-ziwei-next/SYNTHETIC-ZWR-ACCEPTED-REFERENCE-NAV-Q87-COMPACT.pdf'); original=old.read_bytes();a=PdfReader(old);new=PdfReader(r/'THREE-CORRECTED-PAGES.pdf');w=PdfWriter(clone_from=a)
# Replace whole physical pages from corrected renderer. No masking or page overlay hides old graph elements.
marks=[]
for j,n in enumerate([47,52,58]):
 p=new.pages[j];cloned=p.clone(w,force_duplicate=True);target=w.pages[n-1];target.replace_contents(cloned.get_contents());target[NameObject('/Resources')]=cloned['/Resources']
 b=io.BytesIO();c=canvas.Canvas(b,pagesize=(float(p.mediabox.width),float(p.mediabox.height)));c.setFont('Helvetica',7);c.setFillColorRGB(.46,.30,.22);c.drawCentredString(float(p.mediabox.width)/2,float(p.mediabox.height)-8,'SYNTHETIC REVIEW ONLY - ACCEPTED REFERENCE - NOT CUSTOMER ISSUED');c.save();mark=PdfReader(b);marks.append(mark);target.merge_page(mark.pages[0]);target.compress_content_streams()
w.add_metadata({'/PHIOSR13SourceSHA256':hashlib.sha256(original).hexdigest(),'/PHIOSR13Scope':'THREE_SOURCE_RENDERED_WHOLE_PAGE_CORRECTIONS_REVIEW_ONLY'})
raw=r/'SYNTHETIC-ZWR-R13-PRINT-CANDIDATE.pdf';w.write(raw)
sys.path.insert(0,'C:/phios/tools/review/report-storage-optimization-r1');from audit import inspect_pdf;from optimize import optimize
report=inspect_pdf(raw,'ZWR-R13-PRINT','ZWR','Local corrected accepted reference')
original_images=inspect_pdf(old,'ZWR-R12-ORIGINAL','ZWR','Protected Q87 reference')['images'];protected_hashes={x['sha256']for x in original_images}
for image in report['images']:
 if image['sha256']in protected_hashes:image['backgroundCandidate']=False
result=optimize(report,87,output_path=r/'SYNTHETIC-ZWR-R13-FINAL-Q87-CANDIDATE.pdf');assert result['passStructural'];out=Path('C:/phios')/result['output'];b=PdfReader(out);assert len(b.pages)==68 and len(b.outline)==12
# Original text tokens retained despite corrected DOM extraction order.
import re
norm=lambda t:re.sub(r'\s+','',t)
for i in range(68):
 oldtext=a.pages[i].extract_text();newtext=b.pages[i].extract_text()
 from collections import Counter
 assert Counter(norm(oldtext))==Counter(norm(newtext)),('TEXT_LOST',i+1)
d1=pdfium.PdfDocument(old);d2=pdfium.PdfDocument(out);rows=[];(r/'pages').mkdir(exist_ok=True)
for i in range(68):
 p1=d1[i];p2=d2[i];x=p1.render(scale=1);y=p2.render(scale=1);im1=x.to_pil().convert('RGB');im2=y.to_pil().convert('RGB');diff=ImageChops.difference(im1,im2);bbox=diff.getbbox();rows.append({'page':i+1,'pixelExact':bbox is None,'differenceBoundingBox':bbox});im2.save(r/'pages'/f'page-{i+1:03d}.png',compress_level=1);x.close();y.close();p1.close();p2.close()
changed=[x['page']for x in rows if not x['pixelExact']];assert changed==[47,52,58],changed;assert old.read_bytes()==original
result.update({'originalQ87ImagesProtectedFromSecondJPEGPass':True,'originalReference':str(old),'originalReferenceSHA256':hashlib.sha256(original).hexdigest(),'changedPages':changed,'all68Pages':rows,'fullPagePixelComparisonDPI':72,'acceptedTextTokensPreserved':True,'bookmarkCount':len(b.outline),'humanAcceptance':'PENDING','physicalPrint':'NOT_RUN'})
(r/'FINAL-Q87-PRINT-PROOF.json').write_text(json.dumps(result,indent=2),encoding='utf8');print('Final Q87',out.stat().st_size,'bytes; changed pages',changed,flush=True)


