"""Reopen actual generated PDFs, check A4/text, rasterize current review only."""
import sys, json, re, unicodedata, subprocess, hashlib
from pathlib import Path
sys.path.insert(0,str(Path('scripts/lib').resolve()))
from disk_space_guard import require_disk_space,reserve_render_slot
from pypdf import PdfReader
from PIL import Image,ImageDraw,ImageChops,ImageStat
require_disk_space('R29 actual PDF raster QA',600000000)
release=reserve_render_slot('R29 actual PDF raster QA')
try:
 root=Path('tools/review/numerology-r29');results=json.loads((root/'GENERATION.json').read_text(encoding='utf-8'))['results']
 pub=json.loads(Path('.tmp/numerology-r29/PUBLICATION.json').read_text(encoding='utf-8'))
 aliases=json.loads(Path('tools/review/numerology-r20/CURRENT-FONT-ALIASES.json').read_text(encoding='utf-8'))['aliases']
 def norm(value):return re.sub(r'\s+','',unicodedata.normalize('NFKC',''.join(aliases.get(c,c)for c in value))).replace('\u2015','\u2014')
 exe='C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe'
 audits=[]
 background=Image.open('.tmp/numerology-r20/assets/shared-VIS-REPORT-NUMEROLOGY-BODY.webp').convert('RGB')
 pixel_checks=[];fixed_checks=[];font_checks=[]
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
  if '--reuse-rasters' in sys.argv:
   prior=json.loads((root/'PDF-QA.json').read_text(encoding='utf-8'));identity=next(x for x in prior['audits']if x['locale']==item['locale']);assert identity['sha256']==hashlib.sha256(path.read_bytes()).hexdigest()
  else:subprocess.run([exe,'-scale-to','1200','-png',str(path),str(images/'page')],check=True,capture_output=True)
  files=sorted(images.glob('page-*.png'));assert len(files)==33
  contact=Image.new('RGB',(1650,1800),'#e9e4d8');draw=ImageDraw.Draw(contact)
  for j,p in enumerate(files):
   image=Image.open(p).convert('RGB');image.thumbnail((145,215));x=(j%11)*150;y=(j//11)*600;contact.paste(image,(x,y+25));draw.text((x+3,y+5),str(j+1),fill='#152f4c')
  contact.crop((0,0,1650,1500)).save(folder/'ACTUAL-PDF-CONTACT.jpg',quality=94)
  for i,m in enumerate(maps):
   image=Image.open(files[i]).convert('RGB');w,h=image.size
   oldfile=Path('output/pdf/numerology-r28')/item['locale']/'pages'/files[i].name
   if m['pageRole']!='BODY_CONTENT':
    old=Image.open(oldfile).convert('RGB');delta=ImageChops.difference(old,image);fixed_checks.append({'locale':item['locale'],'page':i+1,'pixelIdenticalToR28':delta.getbbox() is None})
   else:
    expected=background.resize((w,h),Image.Resampling.BICUBIC);old=Image.open(oldfile).convert('RGB')
    strips=[(0,0,int(w*.04),h),(int(w*.96),0,w,h),(0,0,w,int(h*.025)),(0,int(h*.975),w,h)]
    def error(a,b):return sum(sum(ImageStat.Stat(ImageChops.difference(a.crop(box),b.crop(box))).mean)/3 for box in strips)/len(strips)
    after=error(image,expected);before=error(old,expected)
    pixel_checks.append({'locale':item['locale'],'pageId':m['logicalPageId'],'page':i+1,'edgeMaeToOriginalBody':after,'r28EdgeMae':before,'bodyVisible':after<12 and after<before*.4})
    relevant=next(p for p in pub['pages']if p['logicalPageId']==m['logicalPageId']);paragraphs=[norm(u['text'])for l in (['zh-Hans','en']if item['locale']=='bilingual'else[item['locale']])for u in relevant['languages'][l]['units']]
    font_sizes=[];footer_sizes=[];paragraph_baselines=[];footer_baselines=[]
    def visitor(text,cm,tm,font,size):
     if not text.strip()or tm[5]==0:return
     n=norm(text)
     if n.startswith('本地合成')or n.startswith('Syntheticlocalcandidate'):
      footer_sizes.append(size*abs(cm[3]));footer_baselines.append(cm[1]*tm[4]+cm[3]*tm[5]+cm[5])
     if abs(abs(cm[0])-.75)<.001 and len(n)>=4 and any(n in p for p in paragraphs):
      paragraph_baselines.append(cm[1]*tm[4]+cm[3]*tm[5]+cm[5])
      if len(n)>=24:font_sizes.append(size*abs(cm[3]))
    reader.pages[i].extract_text(visitor_text=visitor)
    target=10.5 if item['locale']=='bilingual'else 12
    font_checks.append({'locale':item['locale'],'pageId':m['logicalPageId'],'targetPt':target,'observedParagraphPt':sorted(set(round(x,3)for x in font_sizes)),'footerPt':footer_sizes,'bodyToFooterBaselineGapPt':min(paragraph_baselines)-footer_baselines[-1]if paragraph_baselines and footer_baselines else None,'pass':bool(font_sizes)and min(font_sizes)>=target-.05 and bool(footer_sizes)and min(footer_sizes)>=7.45})
  preflight=json.loads((folder/'PRINT-PREFLIGHT.json').read_text(encoding='utf-8'))
  audits.append({'locale':item['locale'],'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'pages':33,'a4All':True,'rasterized':33,'paragraphMissing':missing,'paragraphPreservation':not missing,'preflightFailures':len(preflight['failures']),'semanticApproval':False,'humanVisualApproval':False})
  print(json.dumps({'locale':item['locale'],'pages':33,'missingParagraphs':len(missing)}),flush=True)
 (root/'BACKGROUND-PIXEL-QA.json').write_text(json.dumps({'checks':pixel_checks,'pass':all(x['bodyVisible']for x in pixel_checks)},indent=2),encoding='utf-8')
 (root/'FIXED-ARTWORK-QA.json').write_text(json.dumps({'checks':fixed_checks,'pass':all(x['pixelIdenticalToR28']for x in fixed_checks)},indent=2),encoding='utf-8')
 (root/'ACTUAL-FONT-QA.json').write_text(json.dumps({'checks':font_checks,'pass':all(x['pass']for x in font_checks)},indent=2),encoding='utf-8')
 (root/'PDF-QA.json').write_text(json.dumps({'audits':audits,'scope':'Actual generated PDFs, not HTML screenshots; visual sign-off remains separate'},indent=2),encoding='utf-8')
finally:release()
