from pathlib import Path
import json,subprocess,hashlib,re
from PIL import Image,ImageOps,ImageDraw,ImageChops,ImageStat
from pypdf import PdfReader
ROOT=Path('tools/review/financial-publication-r3-2'); TMP=Path('tmp/pdfs/financial-r3-2');TMP.mkdir(parents=True,exist_ok=True)
POP=Path('C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe')
read=lambda p:json.loads(Path(p).read_text(encoding='utf-8-sig'))
records=read(ROOT/'browser-verification.json')['results']; reps=read(ROOT/'representative-verification.json')['results'];build={r['state']:r for r in read(ROOT/'build-state.json')['results']}
def verify(rec):
 state=rec['state'];pdf=Path(rec['pdfPath']);reader=PdfReader(pdf);expected=10 if state=='representatives' else build[state]['physicalPages'];assert len(reader.pages)==expected,(state,len(reader.pages),expected)
 print('VERIFY',state,expected,'actual PDF pages',flush=True)
 folder=ROOT/'visual'/state;folder.mkdir(parents=True,exist_ok=True)
 existing=sorted(folder.glob('page-*.png'))
 signatures=[hashlib.sha256(page.get_contents().get_data()+(page.extract_text() or '').encode()).hexdigest() for page in reader.pages]
 previous=ROOT/f'pdf-state-{state}.json';changed=set()
 if previous.exists():
  old=read(previous)
  prior=old.get('pageSignatures')
  if not prior and Path(old['path']).exists():
   oldreader=PdfReader(old['path']);prior=[hashlib.sha256(page.get_contents().get_data()+(page.extract_text() or '').encode()).hexdigest() for page in oldreader.pages]
  if prior:changed={i+1 for i,h in enumerate(signatures) if i>=len(prior) or prior[i]!=h}
 for cached in existing:
  if int(cached.stem.split('-')[-1]) in changed or not cached.read_bytes().endswith(b'\x00\x00\x00\x00IEND\xaeB`\x82'):
   n=int(cached.stem.split('-')[-1]);dpi='96' if state=='representatives' or state=='complete' and n<=54 else '36'
   subprocess.run([str(POP),'-f',str(n),'-l',str(n),'-r',dpi,'-png',str(pdf),str(folder/'page')],check=True,capture_output=True)
 first=len(existing)+1
 if first<=expected:
  # Full-resolution complete core/deep dives; small raster appendix/state contacts supplement selectable A4 PDFs.
  if state=='complete' and first<=54:
   subprocess.run([str(POP),'-f',str(first),'-l','54','-r','96','-png',str(pdf),str(folder/'page')],check=True,capture_output=True);first=55
  if first<=expected:subprocess.run([str(POP),'-f',str(first),'-l',str(expected),'-r','36' if state!='representatives' else '96','-png',str(pdf),str(folder/'page')],check=True,capture_output=True)
 images=sorted(folder.glob('page-*.png'));assert len(images)==expected
 for i,page in enumerate(reader.pages):
  assert abs(float(page.mediabox.width)-595.28)<1 and abs(float(page.mediabox.height)-841.89)<1
  text=page.extract_text();assert len(text)>100,(state,i,'selectable text')
  if (i+1)%10==0:print('TEXT/BACKGROUND',state,i+1,flush=True)
  assert not re.search(r'\bNaN\b|\bInfinity\b|undefined',text),(state,i,'invalid rendered value')
  if i%2==0:assert re.search('[\u4e00-\u9fff]',text),(state,i,'Chinese selectable')
  else:assert re.search('[A-Za-z]{4}',text),(state,i,'English selectable')
  source='RPT-FINANCIAL-P01-COVER-v1.webp' if state!='representatives' and i<2 else 'VIS-REPORT-FINANCIAL-BODY.webp'
  img=Image.open(images[i]).convert('RGB');ref=Image.open(Path('assets/reports/financial/r3')/source).convert('RGB').resize(img.size)
  patch=(10,35,130,100);delta=sum(ImageStat.Stat(ImageChops.difference(img.crop(patch),ref.crop(patch))).mean)/3
  assert delta<22,(state,i,'formal background mismatch',delta)
 # Contacts split every 24 pages so review remains legible.
 contacts=[]
 for offset in range(0,len(images),24):
  chunk=images[offset:offset+24];sheet=Image.new('RGB',(6*205,4*310),'#e4e7e2');draw=ImageDraw.Draw(sheet)
  for j,f in enumerate(chunk):
   x=(j%6)*205;y=(j//6)*310;sheet.paste(ImageOps.contain(Image.open(f),(198,280)),(x,y+20));draw.text((x+4,y+4),str(offset+j+1),fill='black')
  target=ROOT/'visual'/f'{state}-contact-{offset//24+1}.png';sheet.save(target);contacts.append(str(target).replace('\\','/'))
 entry={'state':state,'path':str(pdf).replace('\\','/'),'pages':expected,'sha256':hashlib.sha256(pdf.read_bytes()).hexdigest(),'a4':True,'selectableText':True,'formalBackgroundPixelCheck':True,'contacts':contacts,'allPagePNGs':str(folder).replace('\\','/'),'pageSignatures':signatures,'changedPagesRerendered':sorted(changed),'rasterCachePolicy':'Only exact actual PDF content-stream plus selectable-text signature matches may reuse a verified page PNG.'}
 (ROOT/f'pdf-state-{state}.json').write_text(json.dumps(entry,indent=2),encoding='utf-8')
 return entry
from concurrent.futures import ThreadPoolExecutor
with ThreadPoolExecutor(max_workers=3) as pool:result=list(pool.map(verify,records+reps))
# Original R3.1 language files are rendered separately, no historical recomputation.
compare=[]
for lang,li in [('zh-Hans',0),('en',1)]:
 # Reuse high-resolution actual PDF crops already verified and preserved by R3.1.
 for n in range(1,21):
  source=Image.open(Path('tools/review/financial-publication-r3-1')/f'compare-{lang}-p{n:02}.png');source.crop((810,40,1604,1163)).save(TMP/f'old-{lang}-{n:02}.png')
 for n in range(1,21):
  oldpng=sorted(TMP.glob(f'old-{lang}-*.png'))[n-1];newpng=sorted((ROOT/'visual/complete').glob('page-*.png'))[(n-1)*2+li]
  a=Image.open(oldpng);b=Image.open(newpng);out=Image.new('RGB',(a.width+b.width+24,max(a.height,b.height)+40),'#e5e8e5');out.paste(a,(0,40));out.paste(b,(a.width+24,40));ImageDraw.Draw(out).text((12,10),f'R3.1 P{n:02} {lang} | R3.2 paired bilingual P{n:02} (same frozen base)',fill='black');target=ROOT/'visual'/f'compare-{lang}-p{n:02}.png';out.save(target);compare.append({'page':f'P{n:02}','language':lang,'comparison':str(target).replace('\\','/'),'baseKind':'R31_CURRENT_LOCAL_CANDIDATE_NOT_A_NEW_HISTORICAL_DATE'})
# Additional modules have no prior dedicated page. Pair old source theme with new deep-dive page explicitly.
related={21:10,22:9,23:10,24:10,25:13,26:19,27:16}
for module,oldpage in related.items():
 for lang,li in [('zh-Hans',0),('en',1)]:
  a=Image.open(sorted(TMP.glob(f'old-{lang}-*.png'))[oldpage-1]);b=Image.open(sorted((ROOT/'visual/complete').glob('page-*.png'))[40+(module-21)*2+li]);out=Image.new('RGB',(a.width+b.width+24,max(a.height,b.height)+40),'#e5e8e5');out.paste(a,(0,40));out.paste(b,(a.width+24,40));ImageDraw.Draw(out).text((12,10),f'R3.1 related P{oldpage:02} | NEW R3.2 D{module-20:02} (no equivalent old dedicated page)',fill='black');target=ROOT/'visual'/f'compare-{lang}-d{module-20:02}.png';out.save(target);compare.append({'page':f'D{module-20:02}','language':lang,'comparison':str(target).replace('\\','/'),'baseKind':'RELATED_THEME_NOT_OLD_EQUIVALENT'})
(ROOT/'pdf-verification.json').write_text(json.dumps({'status':'PASS','results':result,'comparisons':compare,'totalPages':sum(r['pages'] for r in result),'providerCalls':0,'rasterPolicy':'Complete core/deep dives 96 dpi; appendix and alternate-state contacts 36 dpi; all actual PDFs selectable A4 full size. Old R31 comparison crop reused from its verified actual PDF render.'},indent=2),encoding='utf-8')
print('PASS actual A4 PDFs, selectable bilingual text, all-page background pixels, 54 comparisons:',sum(r['pages'] for r in result),'pages')
