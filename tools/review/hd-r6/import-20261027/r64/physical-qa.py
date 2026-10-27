import json,re,hashlib,subprocess
from pathlib import Path
import pdfplumber
from PIL import Image,ImageDraw
d=Path('tools/review/hd-r6/import-20261027/r64');temp=Path('.tmp/hd-r64/pages');temp.mkdir(parents=True,exist_ok=True);final_images=d/'owner-final';final_images.mkdir(exist_ok=True)
manifest=json.loads((d/'PDF-MANIFEST.json').read_text());poppler=Path('C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe');norm=lambda s:re.sub(r'\s+','',s)
results=[]
for f in manifest['files']:
 fmt=f['format'];p=Path(f['path']);proj=json.loads((d/f'PROJECTION-{fmt}.json').read_text());texts=[];lineMap=[];cursor=0;bounds=[];stats=[];numbers=[];fonts=[]
 with pdfplumber.open(p) as pdf:
  assert len(pdf.pages)==f['pages'];assert hashlib.sha256(p.read_bytes()).hexdigest()==f['sha256']
  for i,page in enumerate(pdf.pages):
   full=page.extract_text() or '';assert 'OWNER REVIEW / NOT FOR COMMERCIAL DISTRIBUTION' in full
   footer=page.within_bbox((450,790,595,830)).extract_text() or '';assert f'{i+1} / {len(pdf.pages)}' in footer,(fmt,i+1,footer);numbers.append(footer)
   body=page.within_bbox((35,45,page.width-35,page.height-50));text=body.extract_text(x_tolerance=2,y_tolerance=3) or '';texts.append(text)
   for line in text.splitlines():k=len(norm(line));lineMap.append({'page':i+1,'start':cursor,'end':cursor+k});cursor+=k
   words=page.extract_words();bad=[w['text'] for w in words if w['x0']<34 or w['x1']>page.width-34 or w['top']<12 or w['bottom']>page.height-20]
   if bad:bounds.append({'page':i+1,'words':bad})
   chars=body.chars;used=max((c['bottom'] for c in chars),default=45)-min((c['top'] for c in chars),default=45);stats.append({'page':i+1,'characters':len(norm(text)),'height':round(used,2),'lowDensity':i>2 and used<150})
   fonts.extend(set(c['fontname'] for c in page.chars))
 # Universal English chart notation is intentional in all editions; SEC01
 # provides a Chinese/English label key. These checks catch missing chart glyphs
 # independently from the17 narrative chapters.
 chartText=norm(texts[1]);tableText=norm(texts[2]);snapshot=json.loads((d/'CONFIRMED-SYNTHETIC-SNAPSHOT.json').read_text())
 for name in ['Head','Ajna','Throat','G','Ego','Solar Plexus','Sacral','Spleen','Root']:assert norm(name) in chartText,(fmt,'chartLabel',name)
 for ch in snapshot['preview']['chart']['channels']:
  pair='-'.join(str(g) for g in ch['gates']);assert pair in chartText,(fmt,'chartChannel',pair)
 for a in snapshot['preview']['chart']['activations']:assert f"{a['gate']}.{a['line']}" in tableText,(fmt,'activation',a['activationId'])
 joined=norm(''.join(texts));positions=[];missing=[];splits=[]
 for pid in proj['renderOrder']:
  para=next(p for p in proj['paragraphs'] if p['id']==pid);text=norm(para['text']);start=joined.find(text);positions.append(start)
  if start<0:missing.append(pid);continue
  touched={}
  for line in lineMap:
   if line['end']>start and line['start']<start+len(text):touched[line['page']]=touched.get(line['page'],0)+1
  if len(touched)>1:splits.append({'id':pid,'lines':touched,'orphan':any(c<3 for c in touched.values())})
 sectionPages=[]
 for sec in range(1,18):
  title=next(s['title'] for s in proj['projection']['sections'] if s['title'].startswith(f'{sec:02} · '));needle=norm(title);hit=next((i+1 for i,t in enumerate(texts) if needle in norm(t)),None);assert hit,(fmt,title);sectionPages.append({'section':f'SEC{sec:02}','page':hit,'title':title})
 assert [s['page'] for s in sectionPages]==sorted(s['page'] for s in sectionPages)
 leaks=[x for x in ['Inner Vision','内在视觉','Book of Destinies','OWNER_EDITORIAL_ACCEPTED','NEW_OWNER_REVIEW_DRAFT','SHA256','JSON','test configuration','测试配置','测试图表','Owner editorial context','部分审阅稿','Partial review - not for delivery'] if x in '\n'.join(texts)]
 isolation=fmt!='en' or not re.search(r'[\u4e00-\u9fff]',joined)
 subprocess.run([str(poppler),'-scale-to','1050','-png',str(p),str(temp/fmt)],capture_output=True,check=True)
 images=sorted([p for p in temp.glob(fmt+'-*.png') if int(p.stem.rsplit('-',1)[1])<=f['pages']],key=lambda p:int(p.stem.rsplit('-',1)[1]));assert len(images)==f['pages'];sheets=[]
 for start in range(0,len(images),9):
  sheet=Image.new('RGB',(1650,2350),'#edf0ee');draw=ImageDraw.Draw(sheet)
  for k,imgpath in enumerate(images[start:start+9]):
   im=Image.open(imgpath).convert('RGB');im.thumbnail((530,735));x=k%3*550+(550-im.width)//2;y=k//3*780+25;sheet.paste(im,(x,y));draw.text((k%3*550+10,k//3*780+4),f'{fmt} page {start+k+1}',fill='black')
  dest=final_images/f'pdf-contact-{fmt}-{start//9+1}.png';sheet.save(dest);sheets.append(str(dest))
 for n in [1,2,3,sectionPages[4]['page'],sectionPages[10]['page'],f['pages']]:Image.open(images[n-1]).save(final_images/f'representative-{fmt}-{n}.png')
 result={'format':fmt,'pages':f['pages'],'paragraphs':len(proj['paragraphs']),'missingParagraphs':missing,'orderCorrect':positions==sorted(positions),'languageIsolation':isolation,'boundsFailures':bounds,'forbiddenLeaks':leaks,'splits':splits,'orphanFailures':[x for x in splits if x['orphan']],'lowDensityPages':[x for x in stats if x['lowDensity']],'sectionPages':sectionPages,'pageStats':stats,'fonts':sorted(set(fonts)),'contactSheets':sheets}
 result['status']='PASS_MACHINE_VISUAL_PENDING' if not missing and result['orderCorrect'] and isolation and not bounds and not leaks and not result['orphanFailures'] else 'FAIL';results.append(result)
(d/'PHYSICAL-QA.json').write_text(json.dumps({'results':results,'scope':'Every physical page rendered, every selected paragraph checked, all17 chapters located, footer/margins/language/leaks checked. Contacts and representatives require actual visual inspection separately.'},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps([{k:r[k] for k in ['format','pages','missingParagraphs','orderCorrect','languageIsolation','boundsFailures','forbiddenLeaks','orphanFailures','lowDensityPages','status']} for r in results],ensure_ascii=False))
reg=json.loads((d/'RENDERER-REGRESSION.json').read_text());controls=[]
def geometry(file):
 with pdfplumber.open(file) as pdf:return [[(c['text'],round(c['x0'],5),round(c['top'],5),round(c['x1'],5),round(c['bottom'],5)) for c in page.chars] for page in pdf.pages]
for mode in ['review-default','released-ignore-reserve']:
 a=next(x['file'] for x in reg['files'] if x['mode']==mode and x['version']=='before');b=next(x['file'] for x in reg['files'] if x['mode']==mode and x['version']=='after');same=geometry(a)==geometry(b);assert same;controls.append({'mode':mode,'exactTextAndGeometryUnchanged':same})
reg['geometry']='PASS_EXACT_DEFAULT_AND_RELEASED';reg['controls']=controls;(d/'RENDERER-REGRESSION.json').write_text(json.dumps(reg,indent=2)+'\n',encoding='utf8')
if any(r['status']=='FAIL' for r in results):raise SystemExit(1)
