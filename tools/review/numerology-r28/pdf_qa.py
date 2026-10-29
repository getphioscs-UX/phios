"""Reopen actual generated PDFs, check A4/text, rasterize current review only."""
import sys, json, re, unicodedata, subprocess, hashlib
from pathlib import Path
sys.path.insert(0,str(Path('scripts/lib').resolve()))
from disk_space_guard import require_disk_space,reserve_render_slot
from pypdf import PdfReader
from PIL import Image,ImageDraw
require_disk_space('R28 actual PDF raster QA',600000000)
release=reserve_render_slot('R28 actual PDF raster QA')
try:
 root=Path('tools/review/numerology-r28');results=json.loads((root/'GENERATION.json').read_text(encoding='utf-8'))['results']
 pub=json.loads(Path('.tmp/numerology-r28/PUBLICATION.json').read_text(encoding='utf-8'))
 aliases=json.loads(Path('tools/review/numerology-r20/CURRENT-FONT-ALIASES.json').read_text(encoding='utf-8'))['aliases']
 def norm(value):return re.sub(r'\s+','',unicodedata.normalize('NFKC',''.join(aliases.get(c,c)for c in value)))
 exe='C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe'
 audits=[]
 for item in results:
  path=Path(item['pdf']);reader=PdfReader(path);assert len(reader.pages)==33
  folder=path.parent;maps=json.loads((folder/'PAGE-MAP.json').read_text(encoding='utf-8'));pages=[];missing=[]
  for i,pg in enumerate(reader.pages):
   assert abs(float(pg.mediabox.width)-210/25.4*72)<.03 and abs(float(pg.mediabox.height)-297/25.4*72)<.03
   text=pg.extract_text()or'';pages.append(text)
   if maps[i]['pageRole']=='BODY_CONTENT':
    p=next(p for p in pub['pages']if p['logicalPageId']==maps[i]['logicalPageId'])
    for locale in (['zh-Hans','en']if item['locale']=='bilingual'else[item['locale']]):
     for u in p['languages'][locale]['units']:
      if norm(u['text'])not in norm(text):missing.append({'page':i+1,'pageId':p['logicalPageId'],'unitId':u['unitId'],'locale':locale})
  (folder/'PDF-TEXT.json').write_text(json.dumps(pages,ensure_ascii=False),encoding='utf-8')
  images=folder/'pages';images.mkdir(exist_ok=True)
  subprocess.run([exe,'-scale-to','1200','-png',str(path),str(images/'page')],check=True,capture_output=True)
  files=sorted(images.glob('page-*.png'));assert len(files)==33
  contact=Image.new('RGB',(1650,1800),'#e9e4d8');draw=ImageDraw.Draw(contact)
  for j,p in enumerate(files):
   image=Image.open(p).convert('RGB');image.thumbnail((145,215));x=(j%11)*150;y=(j//11)*600;contact.paste(image,(x,y+25));draw.text((x+3,y+5),str(j+1),fill='#152f4c')
  contact.crop((0,0,1650,1500)).save(folder/'ACTUAL-PDF-CONTACT.jpg',quality=94)
  preflight=json.loads((folder/'PRINT-PREFLIGHT.json').read_text(encoding='utf-8'))
  audits.append({'locale':item['locale'],'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'pages':33,'a4All':True,'rasterized':33,'paragraphMissing':missing,'paragraphPreservation':not missing,'preflightFailures':len(preflight['failures']),'semanticApproval':False,'humanVisualApproval':False})
  print(json.dumps({'locale':item['locale'],'pages':33,'missingParagraphs':len(missing)}),flush=True)
 (root/'PDF-QA.json').write_text(json.dumps({'audits':audits,'scope':'Actual generated PDFs, not HTML screenshots; visual sign-off remains separate'},indent=2),encoding='utf-8')
finally:release()
