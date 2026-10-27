from pathlib import Path
from pypdf import PdfReader
from PIL import Image,ImageDraw
import json,hashlib,re,unicodedata,subprocess
repo=Path.cwd();d=repo/'tools/review/numerology-r20';out=repo/'output/pdf/numerology-r20';pop=Path('C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe')
results=json.loads((d/'PDF-RESULTS.json').read_text(encoding='utf8'))['results'];content=json.loads((out/'CONTENT-19-BILINGUAL.json').read_text(encoding='utf8'));checks=[]
aliases=json.loads((d/'CURRENT-FONT-ALIASES.json').read_text(encoding='utf8'))
assert hashlib.sha256((repo/'assets/fonts/private-report/NotoSansSC-Regular.ttf').read_bytes()).hexdigest()==aliases['fontSha256']
norm=lambda t:re.sub(r'\s+','',unicodedata.normalize('NFKC',''.join(aliases['aliases'].get(c,c) for c in t)))
for r in results:
 folder=out/r['locale'];p=repo/r['file'];pdf=PdfReader(p);maps=json.loads((folder/'PAGE-MAP.json').read_text(encoding='utf8'));assert len(pdf.pages)==33
 sourcechecks=[]
 for i,m in enumerate(maps):
  page=pdf.pages[i];assert abs(float(page.mediabox.width)-210/25.4*72)<.02;assert abs(float(page.mediabox.height)-297/25.4*72)<.02
  if m['pageRole']!='BODY_CONTENT':continue
  expected=next(x for x in content if x['logicalPageId']==m['logicalPageId']);text=norm(page.extract_text());languages=['zh-Hans','en'] if r['locale']=='bilingual' else[r['locale']]
  for lang in languages:
   for u in expected['languages'][lang]['units']:
    ok=norm(u['text']) in text;sourcechecks.append({'page':i+1,'logicalPageId':m['logicalPageId'],'locale':lang,'unitId':u['unitId'],'sourceClaimId':u['sourceClaimId'],'pass':ok});assert ok,(r['locale'],m['logicalPageId'],u['unitId'])
   visual=expected['languages'][lang]['structuredVisual'];question=visual['observation']['text'];assert norm(question) in text,(r['locale'],m['logicalPageId'],'observation-question')
   sourcechecks.append({'page':i+1,'logicalPageId':m['logicalPageId'],'locale':lang,'unitId':'EDITORIAL-OBSERVATION','sourceClaimId':None,'pass':True})
   for row in visual['rows']:
    assert norm(str(row['value'])) in text,(r['locale'],m['logicalPageId'],'visual-value',row['value'])
 pages=folder/'pages';pages.mkdir(exist_ok=True);previous=json.loads((folder/'PDF-QA.json').read_text(encoding='utf8')) if (folder/'PDF-QA.json').exists() else {}
 if previous.get('pdfSHA256')==hashlib.sha256(p.read_bytes()).hexdigest() and len(list(pages.glob('page-*.png')))==33:
  proc=subprocess.CompletedProcess([],0,stderr=b'');print(r['locale'],'reuse unchanged raster receipt',flush=True)
 else:
  proc=subprocess.run([str(pop),'-scale-to','1000','-png',str(p),str(pages/'page')],capture_output=True);assert proc.returncode==0,proc.stderr[:800]
 images=sorted(pages.glob('page-*.png'));assert len(images)==33
 contacts=[]
 for start in range(0,33,12):
  canvas=Image.new('RGB',(1200,1800),'#eae6dc');draw=ImageDraw.Draw(canvas)
  for j,imgpath in enumerate(images[start:start+12]):
   im=Image.open(imgpath).convert('RGB');im.thumbnail((290,414));x=(j%4)*300;y=(j//4)*600;canvas.paste(im,(x,y+22));draw.text((x+5,y+3),str(start+j+1)+' '+(maps[start+j].get('logicalPageId') or maps[start+j].get('sectionId') or ''),fill='#17333e')
  f=folder/f'contact-{start//12+1}.png';canvas.save(f);contacts.append(str(f.relative_to(repo)))
 record={'locale':r['locale'],'pages':33,'a4All':True,'renderedPages':len(images),'bodyUnitChecks':sourcechecks,'allTextPass':all(x['pass'] for x in sourcechecks),'assetIdentityChecks':[{'page':m['physicalPageNumber'],'section':m.get('sectionId'),'sha256':m.get('sourceSHA256')} for m in maps if m['pageRole']!='BODY_CONTENT'],'pdfSHA256':hashlib.sha256(p.read_bytes()).hexdigest(),'privateDeliverySizePass':p.stat().st_size<=32*1024*1024,'contacts':contacts,'popplerWarnings':proc.stderr.decode(errors='replace')[:2000]};checks.append(record);(folder/'PDF-QA.json').write_text(json.dumps(record,ensure_ascii=False,indent=2),encoding='utf8');print(r['locale'],'33 raster pages;',len(sourcechecks),'unit checks PASS',flush=True)
(d/'PDF-PAGE-QA.json').write_text(json.dumps({'reports':checks,'totalRasterPages':99,'allSourceUnitChecksPass':True,'productionPass':False},ensure_ascii=False,indent=2),encoding='utf8')
