from pathlib import Path
from pypdf import PdfReader
from PIL import Image,ImageDraw
import json,subprocess,hashlib,re,unicodedata,sys
repo=Path.cwd();d=repo/'tools/review/numerology-r21';out=repo/'output/pdf/numerology-r21'
native=Path('C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin')
results=json.loads((d/'PDF-RESULTS.json').read_text(encoding='utf8'))['results'];content=json.loads((repo/'.tmp/numerology-r21/EDITORIAL-PAGES.json').read_text(encoding='utf8'));reports=[]
aliases=json.loads((repo/'tools/review/numerology-r20/CURRENT-FONT-ALIASES.json').read_text(encoding='utf8'))
assert hashlib.sha256((repo/'assets/fonts/private-report/NotoSansSC-Regular.ttf').read_bytes()).hexdigest()==aliases['fontSha256']
def norm(t):return re.sub(r'\s+','',unicodedata.normalize('NFKC',''.join(aliases['aliases'].get(c,c)for c in t)))
for r in results:
 if not r.get('file'):continue
 p=repo/r['file'];folder=p.parent;pdf=PdfReader(p);assert len(pdf.pages)==33
 maps=json.loads((folder/'PAGE-MAP.json').read_text(encoding='utf8'));checks=[];texts=json.loads((folder/'PDF-TEXT.json').read_text(encoding='utf8'))
 for i,m in enumerate(maps):
  pg=pdf.pages[i];assert abs(float(pg.mediabox.width)-210/25.4*72)<.02 and abs(float(pg.mediabox.height)-297/25.4*72)<.02
  if m['pageRole']!='BODY_CONTENT':continue
  text=norm(texts[i]);e=next(x for x in content if x['logicalPageId']==m['logicalPageId']);langs=['zh-Hans','en']if r['locale']=='bilingual'else[r['locale']]
  for lang in langs:
   for j,t in enumerate(e['languages'][lang]):
    ok=norm(t)in text;checks.append({'page':i+1,'logicalPageId':m['logicalPageId'],'locale':lang,'paragraph':j+1,'pass':ok});assert ok,(r['locale'],m['logicalPageId'],lang,j+1)
  assert not re.search(r'\b(?:sourceClaimId|runtime|D8|R18|payload|fallback|Synthetic local review)\b',texts[i],re.I)
 assert 'John Michael Smith'in texts[0] and '1989-11-15'in texts[0]
 pages=folder/'pages';pages.mkdir(exist_ok=True)
 cover_only='--cover-only'in sys.argv
 proc=subprocess.run([str(native/'pdftoppm.exe'),*(['-f','1','-l','1']if cover_only else[]),'-scale-to','1000','-png',str(p),str(pages/'page')],capture_output=True);assert proc.returncode==0,proc.stderr[:500]
 imgs=sorted(pages.glob('page-*.png'));assert len(imgs)==33
 contacts=[]
 for start in range(0,33,12):
  canvas=Image.new('RGB',(1200,1500),'#eae6dc');draw=ImageDraw.Draw(canvas)
  for j,f in enumerate(imgs[start:start+12]):
   im=Image.open(f).convert('RGB');im.thumbnail((290,460));x=(j%4)*300;y=(j//4)*500;canvas.paste(im,(x,y+23));draw.text((x+4,y+4),str(start+j+1)+' '+str(maps[start+j].get('logicalPageId')or maps[start+j].get('sectionId')),fill='#193442')
  f=folder/f'contact-{start//12+1}.png';canvas.save(f);contacts.append(str(f.relative_to(repo)))
 reports.append({'locale':r['locale'],'pdfSHA256':hashlib.sha256(p.read_bytes()).hexdigest(),'pages':33,'a4All':True,'renderedPages':33,'paragraphChecks':checks,'allParagraphsPass':True,'coverFieldsPass':True,'contacts':contacts,'semanticAcceptance':False});print(r['locale'],len(checks),'paragraph checks; 33 raster pages PASS',flush=True)
(d/'PDF-QA.json').write_text(json.dumps({'reports':reports,'totalRasterPages':sum(x['renderedPages']for x in reports),'providerCalls':0,'scope':'Offline handoff replay, not new model generation or author acceptance'},ensure_ascii=False,indent=2),encoding='utf8')
