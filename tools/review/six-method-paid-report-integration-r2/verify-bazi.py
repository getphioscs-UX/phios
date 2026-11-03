from pathlib import Path
import json,hashlib,re,unicodedata
import pypdfium2 as pdfium
from pypdf import PdfReader
from PIL import ImageChops
r=Path(__file__).parent;b=r/'bazi';old=r.parent/'six-method-automatic-paid-report-closure-r1'/'compatibility'/'SYNTHETIC-BZR-HISTORICAL-CURRENT-REPLAY.pdf';new=b/'SYNTHETIC-BZR-R2-SPACING-REPLAY.pdf'
a=PdfReader(old);z=PdfReader(new);ad=pdfium.PdfDocument(old);zd=pdfium.PdfDocument(new);checks=json.loads((b/'CURRENT-REPLAY-CHECKS.json').read_text(encoding='utf8'));norm=lambda s:re.sub(r'\s+','',unicodedata.normalize('NFKC',s));changes=[];parity=[]
assert len(a.pages)==len(z.pages)==48
for i in range(48):
 aa=ad[i].render(scale=.7).to_pil().convert('RGB');zz=zd[i].render(scale=.7).to_pil().convert('RGB');box=ImageChops.difference(aa,zz).getbbox();parity.append(norm(a.pages[i].extract_text())==norm(z.pages[i].extract_text()))
 if box:changes.append({'page':i+1,'differenceBox':box});zz.save(b/f'PDF-P{i+1:02}.png')
def toc(reader):
 out=[]
 def walk(xs):
  for x in xs:
   if isinstance(x,list):walk(x)
   else:out.append((x.title,reader.get_destination_page_number(x)+1))
 walk(reader.outline);return out
expected=[17,22,29,33];passed=[x['page']for x in changes]==expected and all(parity) and toc(a)==toc(z) and not checks['geometry']['overflowPages'] and checks['originalsUnchanged']
result={'status':'CURRENT_DETERMINISTIC_REPLAY_PASS'if passed else'PUBLICATION_REPAIR_REQUIRED','scope':'Historical same-subject synthetic replay only; not commercial publication acceptance','historicalProvider':'HISTORICAL_PROVIDER_PASS','versionGap':'PROVIDER_EVIDENCE_VERSION_GAP','pages':48,'allPagesRasterCompared':48,'changedPages':changes,'nonTargetPagesPixelExact':all(x['page']in expected for x in changes),'allPageTextParity':all(parity),'bookmarkStructureParity':toc(a)==toc(z),'bookmarkCount':len(toc(z)),'spacingReflow':checks['spacingReflow'],'geometry':checks['geometry'],'pdf':str(new),'bytes':new.stat().st_size,'sha256':hashlib.sha256(new.read_bytes()).hexdigest(),'providerCalls':0,'providerCostUsd':0,'formalArtifactStoreWrites':0}
(r/'BZR-FINAL-PRINT-QA.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8');print(json.dumps(result,ensure_ascii=False));assert passed
