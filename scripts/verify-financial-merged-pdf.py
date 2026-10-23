from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import json,subprocess,hashlib,re
from PIL import Image,ImageDraw,ImageOps,ImageChops,ImageStat
from pypdf import PdfReader
root=Path('tools/review/financial-publication-merged');read=lambda p:json.loads(Path(p).read_text(encoding='utf-8-sig'));build=read(root/'browser-verification.json');contract=read('content/financial/reports/publication-bilingual-merged-22.json');pop='C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe'
old=Path('output/pdf/financial-r3-2/complete-bilingual-ea831cc138.pdf');assert len(PdfReader(old).pages)==76
base=read(root/'baseline.json');assert hashlib.sha256(old.read_bytes()).hexdigest()==next(f['sha256'] for f in base['protected'] if f['path']==str(old).replace('\\','/'))
previous=read(root/'pdf-verification.json') if (root/'pdf-verification.json').exists() else {'results':[]}
def verify(o):
 pdf=Path(o['pdfPath']);current_hash=hashlib.sha256(pdf.read_bytes()).hexdigest();cached=next((x for x in previous['results'] if x['path']==str(pdf).replace('\\','/') and x['sha256']==current_hash and x['pages']==o['totalPages']),None)
 if cached and all(Path(p).exists() for p in cached['contacts']):
  print('PASS unchanged verified PDF hash reused',o['stem'],cached['pages'],flush=True);return {**cached,'reusedExactPdfHash':True}
 r=PdfReader(pdf);assert len(r.pages)==o['totalPages'];folder=root/'correction-r3/visual'/(o['stem']+'-'+o['htmlSha256'][:10]);folder.mkdir(parents=True,exist_ok=True)
 subprocess.run([pop,'-scale-to','1123' if o['stem']=='complete' else '560','-png',str(pdf),str(folder/'page')],check=True,capture_output=True)
 images=sorted(folder.glob('page-*.png'));assert len(images)==len(r.pages)
 for i,p in enumerate(r.pages):
  assert abs(float(p.mediabox.width)-595.28)<1 and abs(float(p.mediabox.height)-841.89)<1
  text=p.extract_text() or '';assert '\ufffd' not in text and not re.search(r'\bNaN\b|\bInfinity\b|undefined',text),(o['stem'],i)
  if 5<=i<20:assert re.search('[\u4e00-\u9fff]',text) and re.search('[A-Za-z]{4}',text),(o['stem'],i,'same page selectable languages')
  asset=contract['pages'][i]['asset'] if i<22 else contract['pages'][5]['asset'];im=Image.open(images[i]).convert('RGB');ref=Image.open(asset).convert('RGB').resize(im.size);patch=(4,5,min(100,im.width),min(70,im.height));delta=sum(ImageStat.Stat(ImageChops.difference(im.crop(patch),ref.crop(patch))).mean)/3;assert delta<25,(o['stem'],i,'asset pixels',delta)
 contacts=[]
 for offset in range(0,len(images),24):
  canvas=Image.new('RGB',(6*205,4*310),'#e5e7e2');d=ImageDraw.Draw(canvas)
  for j,f in enumerate(images[offset:offset+24]):
   x=j%6*205;y=j//6*310;canvas.paste(ImageOps.contain(Image.open(f),(198,280)),(x,y+20));d.text((x+4,y+4),str(offset+j+1),fill='black')
  target=root/'correction-r3/visual'/f'{o["stem"]}-contact-{offset//24+1}.png';canvas.save(target);contacts.append(str(target).replace('\\','/'))
 print('PASS',o['stem'],len(r.pages),'actual A4 pages',flush=True)
 return {'stem':o['stem'],'path':str(pdf).replace('\\','/'),'sha256':hashlib.sha256(pdf.read_bytes()).hexdigest(),'pages':len(r.pages),'a4':True,'fixedRasterAssetsApplied':True,'dynamicTextSelectableBothLanguages':True,'fixedPosterText':'Approved raster; accessible HTML transcription equivalent is available for P02-P05, pending human transcription acceptance','contacts':contacts}
with ThreadPoolExecutor(max_workers=3) as pool:results=list(pool.map(verify,build['outputs']))
# Q6 actual frozen 38-page predecessor and corrected A4 pages, at identical 1123px scale.
old=Path('output/pdf/financial-merged/complete-merged-0d60324e38.pdf');assert len(PdfReader(old).pages)==38
old_receipt=previous
previous=root/'correction-r3/baseline/actual-pdf';previous.mkdir(parents=True,exist_ok=True)
if old_receipt.get('oldPdfSha256')!=hashlib.sha256(old.read_bytes()).hexdigest() or len(list(previous.glob('page-*.png')))!=38:
 subprocess.run([pop,'-scale-to','1123','-png',str(old),str(previous/'page')],check=True,capture_output=True)
else:print('PASS unchanged frozen38 PDF raster provenance reused',flush=True)
oldBuild=read(root/'correction-r3/baseline/build-state.json')['outputs'][0]
newBuild=build['outputs'][0]
# Frozen old manifest predates explicit appendix IDs; recover exact then-known model positions.
oldDescriptors={23:('MODEL','PROTECTION_EVENT',0),24:('MODEL','RETIREMENT_NEEDS',0),25:('YEARLY','RETIREMENT_NEEDS',0),26:('YEARLY','RETIREMENT_NEEDS',10),27:('MODEL','RETIREMENT_FUNDING',0),28:('YEARLY','RETIREMENT_FUNDING',0),29:('YEARLY','RETIREMENT_FUNDING',10),30:('YEARLY','RETIREMENT_FUNDING',20),31:('MODEL','EDUCATION_COST',0),32:('YEARLY','EDUCATION_COST',0),33:('MODEL','EDUCATION_FUNDING',0),34:('YEARLY','EDUCATION_FUNDING',0),35:('TAX',None,0),36:('MODEL','ESTATE_CONTINUITY',0),37:('MODEL','LIFE_COURSE_EVENTS',0),38:('SOURCES',None,0)}
comparisons=[]
for n in range(1,39):
 if n<=22: targets=[n];reason='CORE_TOPIC_PRESERVED'
 else:
  kind,model,offset=oldDescriptors[n]
  matches=[a for a in newBuild['appendixManifest'] if a['kind']==kind and (not model or a['modelId']==model)]
  if kind=='YEARLY':matches=[a for a in matches if (a['offset']<offset+10 and a['offset']+(5 if model=='EDUCATION_COST' else 10)>offset)]
  if n in (35,36):matches=[a for a in newBuild['appendixManifest'] if a['kind']=='EVIDENCE'];reason='SPARSE_FACTS_RETAINED_IN_A00_EVIDENCE'
  else:reason='TYPED_SEMANTICS_AND_PAGINATION'
  targets=[17] if n==23 else [a['page'] for a in matches]
  if n==23:reason='REDUNDANT_APPENDIX_OMITTED_ALL_FACTS_IN_CORE_P17'
  if n in (27,33):targets += [a['page'] for a in newBuild['appendixManifest'] if a['kind']=='RECONCILE' and a['modelId']==model]
 if not targets:raise AssertionError(('No predecessor content mapping',n))
 for targetPage in targets:
  oldpng=sorted(previous.glob('page-*.png'))[n-1];newpng=sorted((root/'correction-r3/visual'/('complete-'+newBuild['htmlSha256'][:10])).glob('page-*.png'))[targetPage-1]
  left=Image.open(oldpng);right=Image.open(newpng);assert left.size==right.size
  canvas=Image.new('RGB',(left.width*2+20,left.height+50),'#e6e8df');canvas.paste(left,(0,50));canvas.paste(right,(left.width+20,50));d=ImageDraw.Draw(canvas);d.text((10,10),f'FROZEN OLD 38-PAGE PDF / P{n:02}',fill='black');d.text((left.width+30,10),f'CORRECTED PDF / P{targetPage:02} / SAME A4 SCALE',fill='black')
  path=root/'correction-r3'/f'compare-old{n:02}-new{targetPage:02}.png';canvas.save(path);comparisons.append({'oldPage':n,'newPage':targetPage,'path':str(path).replace('\\','/'),'reason':reason})
assert set(x['newPage'] for x in comparisons)==set(range(1,newBuild['totalPages']+1)), 'Every corrected page must have an old content comparison'
receipt={'status':'PASS_LOCAL_PDF_CHECKS','results':results,'totalPagesChecked':sum(r['pages'] for r in results),'oldPdfSha256':hashlib.sha256(old.read_bytes()).hexdigest(),'oldPages':38,'newFullPages':results[0]['pages'],'corePages':22,'comparisons':comparisons,'languageSplitExceptions':[],'providerCalls':0}
(root/'pdf-verification.json').write_text(json.dumps(receipt,indent=2),encoding='utf-8');print('PASS actual frozen38/corrected same-scale comparisons',len(comparisons),flush=True)
