from pathlib import Path
import json,hashlib,io,sys,re
from pypdf import PdfReader,PdfWriter
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import pypdfium2 as pdfium
from PIL import ImageChops
r=Path('C:/phios/tools/review/ziwei-r1-4-final-artifact-handoff');base=json.loads((r/'BASELINE.json').read_text(encoding='utf8'));src=Path(base['pinnedFinal']['path']);p=json.loads((r/'PERSONALIZATION-SOURCE.json').read_text(encoding='utf8'));raw=src.read_bytes();assert len(raw)==9807509 and hashlib.sha256(raw).hexdigest()==base['pinnedFinal']['SHA256'];reader=PdfReader(src);w=PdfWriter(clone_from=reader);marks=[]
pdfmetrics.registerFont(TTFont('ExistingCoverGeorgia','C:/Windows/Fonts/georgia.ttf'))
for i,page in enumerate(w.pages):
 width=float(page.mediabox.width);height=float(page.mediabox.height);b=io.BytesIO();c=canvas.Canvas(b,pagesize=(width,height));c.setFont('Helvetica',p['watermark']['points']);c.setFillColorRGB(117/255,77/255,56/255);c.drawRightString(width-p['watermark']['rightInsetMillimetres']*72/25.4,height-p['watermark']['baselineMillimetresFromTop']*72/25.4,p['watermark']['text'])
 if i==0:
  c.setFont('ExistingCoverGeorgia',p['font']['points']);c.setFillColorRGB(23/255,48/255,71/255)
  for key,value in p['fields'].items():
   slot=p['slots'][key];x=width*(slot['left']+slot['width']/2)/100;y=height*(1-(slot['top']+slot['height']/2)/100)-p['font']['points']*.33
   assert pdfmetrics.stringWidth(value,'ExistingCoverGeorgia',p['font']['points'])<width*slot['width']/100,('COVER_CLIPPED',key)
   c.drawCentredString(x,y,value)
 c.save();mark=PdfReader(b);marks.append(mark);page.merge_page(mark.pages[0]);page.compress_content_streams()
w.add_metadata({'/PHIOSR14Version':'ZWR-R14-PERSONALIZED-WM-QA-2','/PHIOSR14SourceQ87SHA256':base['pinnedFinal']['SHA256'],'/PHIOSR14Scope':'SYNTHETIC_SAME_NATIVE_SUBJECT_WATERMARK_CANDIDATE_NOT_CUSTOMER_ISSUED','/PHIOSR14WatermarkPolicy':p['watermark']['policyId'],'/PHIOSR14HumanApproval':'PENDING_OWNER_SIGNATURE','/PHIOSReportReference':p['watermark']['opaqueReportRef']});draft=r/'SYNTHETIC-ZWR-R14-PERSONALIZED-WATERMARK-V2-DRAFT.pdf';w.write(draft)
# Existing optimizer, lossless deduplication only. No JPEG pass, no image resizing.
sys.path.insert(0,'C:/phios/tools/review/report-storage-optimization-r1');from audit import inspect_pdf;from optimize import optimize
report=inspect_pdf(draft,'ZWR-R14-WM','ZWR','Local same-native-subject watermark candidate');result=optimize(report,None,output_path=r/'SYNTHETIC-ZWR-R14-PERSONALIZED-WATERMARK-V2-CANDIDATE.pdf');assert result['passStructural'];dest=Path('C:/phios')/result['output'];after=PdfReader(dest);assert len(after.pages)==len(reader.pages)==68 and len(after.outline)==len(reader.outline)==12

def payloads(pdf):
 out=set()
 for page in pdf.pages:
  for ref in page['/Resources'].get('/XObject',{}).values():
   o=ref.get_object()
   if o.get('/Subtype')=='/Image':out.add((o.get('/Width'),o.get('/Height'),str(o.get('/Filter')),hashlib.sha256(o._data).hexdigest()))
 return out
assert payloads(reader)==payloads(after);text=[]
for i,(a,b)in enumerate(zip(reader.pages,after.pages)):
 old=re.sub(r'\s+','',a.extract_text());new=re.sub(r'\s+','',b.extract_text());assert old in new or all(re.sub(r'\s+','',x)in new for x in a.extract_text().splitlines()if x.strip()),('SOURCE_TEXT_LOST',i+1);assert 'SYNTHETIC'in new and re.sub(r'\s+','',p['watermark']['text'])in new;assert tuple(a.mediabox)==tuple(b.mediabox)and tuple(a.cropbox)==tuple(b.cropbox);text.append({'page':i+1,'sourceSelectableTextPreserved':True,'watermarkPresent':True,'syntheticMarkRetained':True})
for value in p['fields'].values():assert value in after.pages[0].extract_text()
# Compare every page outside the new header band and the three existing cover slots.
d1=pdfium.PdfDocument(src);d2=pdfium.PdfDocument(dest);screens=r/'sample-pages';screens.mkdir(exist_ok=True);visual=[]
for i in range(68):
 a=d1[i];b=d2[i];ra=a.render(scale=1);rb=b.render(scale=1);ia=ra.to_pil().convert('RGB');ib=rb.to_pil().convert('RGB');diff=ImageChops.difference(ia,ib);from PIL import ImageDraw
 mask=ImageDraw.Draw(diff);mask.rectangle((0,9,ia.width,22),fill=(0,0,0))
 if i==0:
  for slot in p['slots'].values():mask.rectangle((int(ia.width*slot['left']/100)-2,int(ia.height*slot['top']/100)-2,int(ia.width*(slot['left']+slot['width'])/100)+2,int(ia.height*(slot['top']+slot['height'])/100)+2),fill=(0,0,0))
 assert diff.getbbox()is None,('OUTSIDE_AUTHORIZED_FIELDS_CHANGED',i+1,diff.getbbox());visual.append({'page':i+1,'outsideWatermarkBandAndExistingCoverSlotsPixelExact':True})
 if i+1 in [1,7,47,52,58]:ib.save(screens/f'page-{i+1:03d}.png',compress_level=1)
 ra.close();rb.close();a.close();b.close()
d1.close();d2.close();assert src.read_bytes()==raw
result.update({'sourceQ87':str(src),'sourceQ87SHA256':base['pinnedFinal']['SHA256'],'sourceQ87Bytes':len(raw),'newVersion':'ZWR-R14-PERSONALIZED-WM-QA-2','watermarkPolicyId':p['watermark']['policyId'],'watermarkAlignment':'RIGHT','sameNativeSubjectOnly':True,'identitySource':str(r/'PERSONALIZATION-SOURCE.json'),'pages':68,'bookmarks':12,'imagePayloadsUnchanged':True,'nativeDiagramsUnchanged':True,'sourceTextPreserved':True,'pageBoundariesUnchanged':True,'allPageTextChecks':text,'allPageVisualChecks':visual,'pixelComparisonDPI':72,'JPEGRecompressionRuns':0,'watermarkHumanApproval':'PENDING','commercialRelease':False,'humanDecision':'LOCAL_VISUAL_ACCEPT_CANDIDATE','ownerSigned':False,'physicalPrint':'NOT_RUN'})
(r/'PERSONALIZED-WATERMARK-PROOF.json').write_text(json.dumps(result,indent=2,ensure_ascii=False),encoding='utf8');print('Personalized synthetic watermark candidate',dest.stat().st_size,'bytes',hashlib.sha256(dest.read_bytes()).hexdigest(),flush=True)
