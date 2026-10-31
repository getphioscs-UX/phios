from pathlib import Path
import json,hashlib,io,re,unicodedata
from pypdf import PdfReader,PdfWriter
from reportlab.pdfgen import canvas
import pypdfium2 as pdfium
from PIL import ImageChops,ImageStat
base=Path('C:/phios');r=base/'tools/review/r12-acceptance-ziwei-next'
e=json.loads((r/'ZIWEI-EXISTING-PDF-SOURCE-CHECK.json').read_text(encoding='utf8'));assert e['acceptedIRBytesMatch']and not e['missing']
src=Path(e['Q87']);assert hashlib.sha256(src.read_bytes()).hexdigest()==e['Q87SHA']
ir=json.loads((base/'docs/reports/ziwei/vfr-r1/DEEP-PUBLICATION-IR.json').read_text(encoding='utf8'));plan=json.loads((base/'docs/reports/ziwei/vfr-r1/PAGE-PLAN.json').read_text(encoding='utf8'));manifest=json.loads((base/'content/reports/shared/report-visual-assets-r2.json').read_text(encoding='utf8'));binding=manifest['reports']['ZWR']['nativeBindings']
# Mirror the existing R2 renderer's emitted-page map, not a new paginator.
physical=[]
for p in plan:
 if p['pageFamily']=='SECTION_MASTER'and p['sectionId']in binding['bodyOnlySections']:continue
 if p['pageFamily']=='OVERVIEW':physical.append({'pageFamily':'R2_OVERVIEW_MASTER','pageKey':binding['overviewMaster']})
 physical.append(p)
reader=PdfReader(src);assert len(physical)==len(reader.pages)==68
writer=PdfWriter(clone_from=reader);bookmarks=[]
for s in ir['sections']:
 target=next(i for i,p in enumerate(physical)if p.get('sectionId')==s['sectionId'])
 title=s['zhHans']['headline']+' / '+s['en']['headline'];writer.add_outline_item(title,target);bookmarks.append({'section':s['sectionId'],'title':title,'physicalPageNumber1':target+1})
writer.add_outline_item('命盘总览 / Chart overview',next(i for i,p in enumerate(physical)if p['pageFamily']=='OVERVIEW'))
writer.add_outline_item('结束与整合 / Closing',next(i for i,p in enumerate(physical)if p['pageFamily']=='CLOSING'))
for page in writer.pages:
 b=io.BytesIO();c=canvas.Canvas(b,pagesize=(float(page.mediabox.width),float(page.mediabox.height)));c.setFont('Helvetica',7);c.setFillColorRGB(.46,.30,.22);c.drawCentredString(float(page.mediabox.width)/2,float(page.mediabox.height)-8,'SYNTHETIC REVIEW ONLY - ACCEPTED REFERENCE - NOT CUSTOMER ISSUED');c.save();page.merge_page(PdfReader(b).pages[0]);page.compress_content_streams()
writer.add_metadata({'/Title':'PHI OS Zi Wei - SYNTHETIC accepted reference navigation proof','/PHIOSScope':'LOCAL_ACCEPTED_REFERENCE_ONLY_NOT_CUSTOMER_ISSUED','/PHIOSSourcePDFSHA256':e['Q87SHA'],'/PHIOSAcceptedIRSHA256':e['IRByteSHA'],'/PHIOSPublicationIRDigest':ir['publicationIrDigest'],'/PHIOSHumanAcceptance':'EXISTING_MANUSCRIPT_ACCEPT_NEW_NAVIGATION_REVIEW_PENDING','/PHIOSOptimization':'Q87_ORIGINAL_IMAGE_PAYLOADS_PRESERVED_NO_SECOND_JPEG_PASS'})
dest=r/'SYNTHETIC-ZWR-ACCEPTED-REFERENCE-NAV-Q87.pdf'
with dest.open('wb')as f:writer.write(f)
after=PdfReader(dest);norm=lambda s:re.sub(r'\s+','',unicodedata.normalize('NFKC',s));assert len(after.pages)==68
def image_payloads(pdf):
 seen=set();items=[]
 for p in pdf.pages:
  for ref in p['/Resources'].get('/XObject',{}).values():
   obj=ref.get_object()
   if obj.get('/Subtype')=='/Image'and (ref.idnum,ref.generation)not in seen:
    seen.add((ref.idnum,ref.generation));items.append((obj.get('/Width'),obj.get('/Height'),str(obj.get('/Filter')),hashlib.sha256(obj._data).hexdigest()))
 return sorted(items)
assert image_payloads(reader)==image_payloads(after)
text_checks=[]
for i,(a,b)in enumerate(zip(reader.pages,after.pages)):
 t=norm(b.extract_text());assert norm(a.extract_text())in t or all(norm(line)in t for line in a.extract_text().splitlines()if line.strip());assert 'SYNTHETICREVIEWONLY'in t;text_checks.append({'page':i+1,'originalSelectableTextRetained':True,'syntheticMark':True})
doc=pdfium.PdfDocument(src);new=pdfium.PdfDocument(dest);visual=[];screens=r/'ziwei-final-pages';screens.mkdir(exist_ok=True)
for i in range(68):
 a=doc[i];b=new[i];ab=a.render(scale=1);bb=b.render(scale=1);ai=ab.to_pil().convert('RGB');bi=bb.to_pil().convert('RGB');crop=(0,20,ai.width,ai.height);delta=ImageChops.difference(ai.crop(crop),bi.crop(crop));assert delta.getbbox()is None,('BODY_VISUAL_CHANGED',i+1);bi.save(screens/f'page-{i+1:03d}.png');visual.append({'page':i+1,'pixelsOutsideReviewMarkBandExact':True});ab.close();bb.close();a.close();b.close()
doc.close();new.close()
result={'scope':'LOCAL_REFERENCE_PUBLICATION_FINISH_ONLY','source':str(src),'sourceSHA256':e['Q87SHA'],'output':str(dest),'outputBytes':dest.stat().st_size,'outputSHA256':hashlib.sha256(dest.read_bytes()).hexdigest(),'pages':68,'bookmarks':bookmarks,'bookmarkCount':len(after.outline),'physicalPageMap':physical,'acceptedParagraphsPreserved':True,'originalQ87ImagePayloadsExact':True,'JPEGRecompressionRuns':0,'allTextChecks':text_checks,'visual':visual,'screenshotsDirectory':str(screens),'newCustomerReport':False,'humanAccept':False,'productionArtifactStoreWrites':0}
(r/'ZIWEI-NAV-Q87-PROOF.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8');print('Zi Wei accepted reference: 68 pages, all source text and Q87 images preserved; native-map bookmarks and review mark added',flush=True)
