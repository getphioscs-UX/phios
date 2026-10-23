"""Actual PDF/source closure receipts, separate free/core and proof acceptance boundaries."""
from pathlib import Path
import json,hashlib,re,subprocess
from pypdf import PdfReader
from PIL import Image,ImageOps,ImageDraw
root=Path('tools/review/financial-publication-merged');out=root/'closeout-r32';J=lambda p:json.loads(Path(p).read_text(encoding='utf-8-sig'))
baseline=J(out/'baseline.json');build=J(root/'browser-verification.json');nav=J(root/'correction-r3/pdf-navigation.json')
for old in baseline['pdfs']:assert hashlib.sha256(Path(old['path']).read_bytes()).hexdigest()==old['sha256']
rows=[];bounds=[]
for o in build['outputs']:
 p=PdfReader(o['pdfPath'],strict=True);assert len(p.pages)==o['totalPages'];assert len(p.outline)==len(p.pages)
 state=o['state'];f=J(root/'correction-r3/long-appendix.fixture.json') if state=='long-appendix' else None;e=f['envelope'] if f else J(f'tools/review/financial-publication-r3-2/{state}.snapshot.json')
 if o['stem']!='core-only':
  for m in e['result']['models'][:4]:
   pages=[a for a in o['appendixManifest'] if a['kind']=='YEARLY' and a['modelId']==m['modelId']];indices=[]
   for a in pages:
    count=5 if m['modelId']=='EDUCATION_COST' else 10
    subset=m['rows'][a['offset']:a['offset']+count];indices.extend(range(a['offset'],a['offset']+len(subset)))
    text=''.join((p.pages[a['page']-1].extract_text() or '').split())
    for row in subset:assert str(row['year']) in text,(state,m['modelId'],row['year'])
   assert indices==list(range(len(m['rows']) if m['eligible'] else 0))
   rows.append({'state':state,'model':m['modelId'],'sourceRows':len(m['rows']),'printedRows':len(indices),'pages':[a['page'] for a in pages],'exactIndexEquality':True})
 bounds.append({'stem':o['stem'],'pages':len(p.pages),'bookmarkCount':len(p.outline),'actualBrowserAllPagesFit':all(not c['overflow'] and not c['svgTextOverflow'] for c in o['checks'])})
 # Main fixed paragraphs remain raster-only; tags are not proof of paragraph accessibility.
 fixed=[{'page':n,'selectableChars':len(p.pages[n-1].extract_text() or ''),'paragraphAccessibility':'BLOCKED_EXACT_APPROVED_COPY_LAYER_NOT_ADMITTED'} for n in [2,3,4,5,21,22]]
 (out/(o['stem']+'-fixed-copy-audit.json')).write_text(json.dumps(fixed,indent=2),encoding='utf-8')
free=[]
for path in sorted(Path('output/pdf/financial-r3-1').glob('free-*.pdf')):
 p=PdfReader(path);assert len(p.pages)==8
 for page in p.pages:assert abs(float(page.mediabox.width)-595.28)<1 and abs(float(page.mediabox.height)-841.89)<1
 free.append({'path':str(path).replace('\\','/'),'pages':8,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'status':'PASS_EXISTING_FREE_A4_PRESERVED_NOT_REGENERATED'})
assert len(free)==6
(out/'free-report-verification.json').write_text(json.dumps({'results':free,'providerCalls':0},indent=2),encoding='utf-8')
(out/'core-only-verification.json').write_text(json.dumps(next(x for x in bounds if x['stem']=='core-only'),indent=2),encoding='utf-8')
proof=Path('output/pdf/financial-merged/fixed-copy-native-print-proof.pdf');p=PdfReader(proof);assert len(p.pages)==6
for page in p.pages:
 t=page.extract_text() or '';assert re.search('[\u4e00-\u9fff]',t) and re.search('[A-Za-z]{6}',t)
pop='C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe'
folder=out/'proof-visual';folder.mkdir(exist_ok=True);subprocess.run([pop,'-scale-to','1123','-png',str(proof),str(folder/'page')],check=True,capture_output=True)
images=sorted(folder.glob('page-*.png'));canvas=Image.new('RGB',(3*398,2*582),'#e4e7df')
for i,path in enumerate(images):canvas.paste(ImageOps.contain(Image.open(path),(392,555)),(i%3*398,i//3*582+22));ImageDraw.Draw(canvas).text((i%3*398+8,i//3*582+4),str(i+1),fill='black')
canvas.save(folder/'contact.png')
receipt={'status':'PASS_SCOPED_LOCAL_WITH_EXPLICIT_BLOCKS','rows':rows,'bounds':bounds,'precedingFivePdfHashesPreserved':True,'mainFixedCopySelectable':'BLOCKED_APPROVED_TRANSCRIPT_OR_SOURCE_REQUIRED','nativeProofSelectableBilingual':True,'nativeProofNotApprovedArtwork':True,'physicalPrint':'PENDING_PHYSICAL_PRINT','secondHumanAudit':'UNAVAILABLE_LOCAL','providerCalls':0,'humanAccept':False,'productionPass':False}
(out/'verification.json').write_text(json.dumps(receipt,indent=2),encoding='utf-8');print('PASS row equality, actual PDF year presence, six preserved Free8 PDFs, separate core-only, bilingual native proof; C1/C2 remain blocked.')
