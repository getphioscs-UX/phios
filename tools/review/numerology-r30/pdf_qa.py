"""Verify final PDF bytes, native/frozen text and actual raster evidence."""
import json,re,sys,hashlib,unicodedata,subprocess,time
from pathlib import Path
sys.path.insert(0,str(Path('scripts/lib').resolve()))
from disk_space_guard import require_disk_space,reserve_render_slot
from pypdf import PdfReader,PdfWriter
from pdf_appearance import page_appearance_fingerprints
from PIL import Image,ImageChops,ImageStat,ImageDraw
acceptance='--acceptance'in sys.argv
root=Path('tools/review/numerology-r30/production-acceptance'if acceptance else'tools/review/numerology-r30');read=lambda p:json.loads(Path(p).read_text(encoding='utf-8'))
results=read(root/'GENERATION.json')['results'];results=[x for x in results if x['id']=='A'] if '--base-only' in sys.argv else results;assert len(results)==(3 if '--base-only' in sys.argv else 12) and all(x['pdf']!='BLOCKED_PREFLIGHT'for x in results)
aliases=read('tools/review/numerology-r20/CURRENT-FONT-ALIASES.json')['aliases']
def norm(v):return re.sub(r'\s+','',unicodedata.normalize('NFKC',''.join(aliases.get(c,c)for c in v))).replace('\u2015','\u2014')
exe='C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe'
require_disk_space('R30 actual PDF evidence',700000000)
if '--wait-for-slot'not in sys.argv:release=reserve_render_slot('R30 actual PDF evidence')
else:
 for attempt in range(720):
  try:
   release=reserve_render_slot('R30 actual PDF evidence');break
  except RuntimeError as error:
   if not str(error).startswith('REPORT_RENDER_ALREADY_RESERVED'):raise
   if attempt==0:print('Waiting for the existing shared raster owner; no lock removed.',flush=True)
   time.sleep(5)
 else:raise RuntimeError('R30_SHARED_RASTER_WAIT_TIMEOUT')
audits=[];fixed=[];pixels=[];fonts=[];pilots=[]
try:
 background=Image.open('.tmp/numerology-r20/assets/shared-VIS-REPORT-NUMEROLOGY-BODY.webp').convert('RGB')
 for r in results:
  file=Path(r['pdf']);folder=file.parent;reader=PdfReader(file);maps=read(folder/'PAGE-MAP.json');pub=read(('.tmp/numerology-r30-acceptance/'if acceptance else'.tmp/numerology-r30/')+r['id']+'-PUBLICATION.json');count=33 if r['fullReport']else 4
  assert len(reader.pages)==count==len(maps);assert hashlib.sha256(file.read_bytes()).hexdigest()==r['pdfSHA256']
  images=folder/'pages';images.mkdir(exist_ok=True)
  identity=folder/'RASTER-IDENTITY.json';fingerprints=page_appearance_fingerprints(reader);old=read(identity)if identity.exists()else{};files=sorted(images.glob('page-*.png'));reused=[];fresh=[]
  bulk=not old.get('appearanceFingerprints')
  if bulk:subprocess.run([exe,'-scale-to','1200','-png',str(file),str(images/'page')],capture_output=True,check=True)
  for i,fp in enumerate(fingerprints):
   target=images/('page-'+str(i+1).zfill(len(str(count)))+'.png')
   valid=i<len(old.get('appearanceFingerprints',[]))and old['appearanceFingerprints'][i]==fp and target.exists()and i<len(old.get('pngSHA256',[]))and hashlib.sha256(target.read_bytes()).hexdigest()==old['pngSHA256'][i]
   if valid:reused.append(i+1)
   else:
    if not bulk:
     temp=images/('refresh-'+str(i+1));subprocess.run([exe,'-f',str(i+1),'-l',str(i+1),'-singlefile','-scale-to','1200','-png',str(file),str(temp)],capture_output=True,check=True);temp.with_suffix('.png').replace(target)
    fresh.append(i+1)
  files=sorted(images.glob('page-*.png'))
  identity.write_text(json.dumps({'sha256':r['pdfSHA256'],'pages':count,'appearanceFingerprints':fingerprints,'pngSHA256':[hashlib.sha256(x.read_bytes()).hexdigest()for x in files],'freshRasterPages':fresh,'reusedPagesWithIdenticalFullAppearance':reused}),encoding='utf-8')
  files=sorted(images.glob('page-*.png'));assert len(files)==count
  texts=[];missing=[];synthetic=[]
  for i,(pg,m)in enumerate(zip(reader.pages,maps)):
   assert abs(float(pg.mediabox.width)-210/25.4*72)<.03 and abs(float(pg.mediabox.height)-297/25.4*72)<.03
   text=pg.extract_text()or'';texts.append(text);image=Image.open(files[i]).convert('RGB');w,h=image.size
   if m['pageRole']!='BODY_CONTENT':
    old=Image.open(Path('output/pdf/numerology-r29')/r['locale']/'pages'/files[i].name).convert('RGB');actual=image.copy()
    cover_mask=acceptance and r['id']!='A'and i==0
    if cover_mask:
     box=(int(w*17/210),int(h*252/297),int(w*204/210),int(h*260/297));ImageDraw.Draw(old).rectangle(box,fill='white');ImageDraw.Draw(actual).rectangle(box,fill='white')
    fixed.append({'id':r['id'],'locale':r['locale'],'page':i+1,'coverPersonalFieldsMasked':cover_mask,'comparison':'R29 approved art; personalized cover fields excluded only for other subjects'if cover_mask else'R29 full pixel identity','pixelIdenticalToR29':ImageChops.difference(old,actual).getbbox()is None});continue
   if acceptance and m['logicalPageId']in['P10','P12','P19','P20']:
    oldroot=Path('output/pdf/numerology-r30')/(r['id']if r['id']!='A'else'')/r['locale'];index=i+1 if r['id']=='A'else['P10','P12','P19','P20'].index(m['logicalPageId'])+1;oldpng=oldroot/'pages'/('page-'+str(index).zfill(2 if r['id']=='A'else 1)+'.png');original=Image.open(oldpng).convert('RGB');pilots.append({'id':r['id'],'locale':r['locale'],'pageId':m['logicalPageId'],'pixelIdenticalToHumanAcceptedR30':ImageChops.difference(original,image).getbbox()is None})
   p=next(x for x in pub['pages']if x['logicalPageId']==m['logicalPageId']);paragraphs=[]
   for l in(['zh-Hans','en']if r['locale']=='bilingual'else[r['locale']]):
    for u in p['languages'][l]['units']:
     paragraphs.append(norm(u['text']))
     if norm(u['text'])not in norm(text):missing.append({'pageId':m['logicalPageId'],'locale':l,'unit':u['unitId']})
   synthetic.append('SYNTHETIC'in text)
   strips=[(0,0,int(w*.04),h),(int(w*.96),0,w,h),(0,0,w,int(h*.025)),(0,int(h*.975),w,h)];expected=background.resize((w,h),Image.Resampling.BICUBIC)
   err=sum(sum(ImageStat.Stat(ImageChops.difference(image.crop(b),expected.crop(b))).mean)/3 for b in strips)/4
   pixels.append({'id':r['id'],'locale':r['locale'],'pageId':m['logicalPageId'],'edgeMAE':err,'visible':err<12})
   sizes=[];footer=[]
   def visit(t,cm,tm,f,size):
    n=norm(t)
    if n.startswith('SYNTHETIC'):footer.append(round(size*abs(cm[3]),3))
    if abs(abs(cm[0])-.75)<.001 and len(n)>=18 and any(x.startswith(n) for x in paragraphs):sizes.append(round(size*abs(cm[3]),3))
   pg.extract_text(visitor_text=visit);target=10.5 if r['locale']=='bilingual'else 12
   fonts.append({'id':r['id'],'locale':r['locale'],'pageId':m['logicalPageId'],'actualParagraphPt':sorted(set(sizes)),'sampling':'Actual paragraph-prefix glyph spans; excludes shared diagram phrases','footerPt':sorted(set(footer)),'pass':bool(sizes)and min(sizes)>=target-.05 and bool(footer)and min(footer)>=7.45})
  (folder/'PDF-TEXT.json').write_text(json.dumps(texts,ensure_ascii=False),encoding='utf-8')
  pre=read(folder/'PRINT-PREFLIGHT.json');dia=read(folder/'DIAGRAM-PREFLIGHT.json')
  audits.append({'id':r['id'],'locale':r['locale'],'sha256':r['pdfSHA256'],'pages':count,'a4All':True,'missingParagraphs':missing,'allBodySyntheticMarked':all(synthetic),'preflightFailures':len(pre['failures']),'pilotDiagramClipping':pre['clipped'],'nativeDiagramCount':len(dia),'freshRasterPages':fresh,'identicalAppearanceRasterReuse':reused,'baselineOtherDiagramWarnings':[x for x in dia if x['pageId']not in['P10','P12','P19','P20']and x['clipped']],'humanSemanticApproval':False,'liveCustomer':False})
  thumb=Image.new('RGB',(1200,1800),'#eee9dd');draw=ImageDraw.Draw(thumb)
  for j,f in enumerate(files):
   im=Image.open(f);im.thumbnail((140,210));x=j%8*150;y=j//8*350;thumb.paste(im,(x,y+20));draw.text((x,y),str(j+1),fill='#152f4c')
  thumb.save(folder/'ACTUAL-PDF-CONTACT.jpg',quality=92)
  print(json.dumps({'id':r['id'],'locale':r['locale'],'pages':count,'missing':len(missing)}),flush=True)
 for name,obj in [('PDF-QA',{'audits':audits}),('FIXED-ARTWORK-QA',{'checks':fixed,'pass':all(x['pixelIdenticalToR29']for x in fixed)}),('BACKGROUND-PIXEL-QA',{'checks':pixels,'pass':all(x['visible']for x in pixels)}),('ACTUAL-FONT-QA',{'checks':fonts,'pass':all(x['pass']for x in fonts)})]:
  (root/(name+'.json')).write_text(json.dumps(obj,indent=2),encoding='utf-8')
 if acceptance:(root/'ACCEPTED-PILOT-PIXEL-QA.json').write_text(json.dumps({'checks':pilots,'pass':all(x['pixelIdenticalToHumanAcceptedR30']for x in pilots)},indent=2),encoding='utf-8')
 for edition in([]if acceptance else['r29','r30']):
  src=PdfReader('output/pdf/numerology-'+edition+'/bilingual/PHI-OS-NUMEROLOGY-'+edition.upper()+'-bilingual.pdf');writer=PdfWriter()
  for n in[13,15,26,27]:writer.add_page(src.pages[n-1])
  writer.write('output/pdf/numerology-r30/bilingual/'+edition.upper()+'-FOUR-PAGE-PROOF.pdf')
 assert all(not a['missingParagraphs']and a['allBodySyntheticMarked']and not a['preflightFailures']and not a['pilotDiagramClipping']for a in audits)
 assert all(x['pixelIdenticalToHumanAcceptedR30']for x in pilots)
 assert all(x['pixelIdenticalToR29']for x in fixed)and all(x['visible']for x in pixels)and all(x['pass']for x in fonts)
finally:release()
