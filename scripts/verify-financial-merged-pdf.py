from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import json,subprocess,hashlib,re
from PIL import Image,ImageDraw,ImageOps,ImageChops,ImageStat
from pypdf import PdfReader
root=Path('tools/review/financial-publication-merged');read=lambda p:json.loads(Path(p).read_text(encoding='utf-8-sig'));build=read(root/'browser-verification.json');contract=read('content/financial/reports/publication-bilingual-merged-22.json');pop='C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe'
old=Path('output/pdf/financial-r3-2/complete-bilingual-ea831cc138.pdf');assert len(PdfReader(old).pages)==76
base=read(root/'baseline.json');assert hashlib.sha256(old.read_bytes()).hexdigest()==next(f['sha256'] for f in base['protected'] if f['path']==str(old).replace('\\','/'))
def verify(o):
 pdf=Path(o['pdfPath']);r=PdfReader(pdf);assert len(r.pages)==o['totalPages'];folder=root/'visual'/o['stem'];folder.mkdir(parents=True,exist_ok=True)
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
  target=root/'visual'/f'{o["stem"]}-contact-{offset//24+1}.png';canvas.save(target);contacts.append(str(target).replace('\\','/'))
 print('PASS',o['stem'],len(r.pages),'actual A4 pages',flush=True)
 return {'stem':o['stem'],'path':str(pdf).replace('\\','/'),'sha256':hashlib.sha256(pdf.read_bytes()).hexdigest(),'pages':len(r.pages),'a4':True,'fixedRasterAssetsApplied':True,'dynamicTextSelectableBothLanguages':True,'fixedPosterText':'Approved raster text; full OCR text layer not added','contacts':contacts}
with ThreadPoolExecutor(max_workers=3) as pool:results=list(pool.map(verify,build['outputs']))
comparisons=[]
for spec in contract['pages']:
 n=spec['page'];new=Image.open(sorted((root/'visual/complete').glob('page-*.png'))[n-1]);canvas=Image.new('RGB',(new.width*3+30,new.height+62),'#e5e8e3');d=ImageDraw.Draw(canvas);oldpage=spec['oldR31Page']
 if oldpage:
  for j,idx in enumerate([(oldpage-1)*2+1,(oldpage-1)*2+2]):
   oldpng=Path('tools/review/financial-publication-r3-2/visual/complete')/f'page-{idx:02}.png';image=Image.open(oldpng);canvas.paste(ImageOps.fit(image,new.size),(j*(new.width+10),62));d.text((j*(new.width+10)+10,10),f'ACTUAL OLD PDF page {idx} / '+('ZH' if j==0 else 'EN'),fill='black')
 else:
  d.text((30,120),'NEW APPROVED FIXED PAGE\nNo equivalent page in the prior 76-page PDF.\nOriginal PDF remains preserved.',fill='black')
 canvas.paste(new,(2*(new.width+10),62));d.text((2*(new.width+10)+10,10),f'NEW P{n:02} SAME-PAGE BILINGUAL',fill='black');target=root/'visual'/f'compare-p{n:02}.png';canvas.save(target);comparisons.append({'newPage':n,'oldR31LogicalPage':oldpage,'path':str(target).replace('\\','/'),'kind':'RELATED_SOURCES_TO_FIXED_METHOD' if n==21 else 'OLD_TWO_PAGES_TO_ONE' if oldpage else 'NEW_FIXED_INSERTION'})
(root/'pdf-verification.json').write_text(json.dumps({'status':'PASS','results':results,'totalPagesChecked':sum(r['pages'] for r in results),'oldPdfSha256':hashlib.sha256(old.read_bytes()).hexdigest(),'oldPages':76,'newFullPages':results[0]['pages'],'corePages':22,'comparisons':comparisons,'languageSplitExceptions':[],'providerCalls':0},indent=2),encoding='utf-8');print('PASS 22 actual old-vs-merged comparison images',flush=True)
