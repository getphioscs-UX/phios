from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from PIL import Image,ImageDraw,ImageChops,ImageStat
from pypdf import PdfReader
import json,subprocess,hashlib,re
root=Path('tools/review/financial-publication-r3-1');temp=Path('tmp/pdfs/financial-r3-1');temp.mkdir(parents=True,exist_ok=True)
state=json.loads((root/'build-state.json').read_text(encoding='utf-8-sig'));contract=json.loads(Path('content/financial/reports/publication-r3-1-candidate.json').read_text(encoding='utf-8-sig'))
pop=Path.home()/'.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe'
body=Image.open('assets/reports/financial/r3/VIS-REPORT-FINANCIAL-BODY.webp').convert('RGB');norm=lambda x:re.sub(r'\s+','',x)
def render(pdf,prefix,scale=520):subprocess.run([str(pop),'-scale-to',str(scale),'-png',str(pdf),str(prefix)],check=True,capture_output=True)
def verify(r):
 stem=r['stem'];pdf=Path('output/pdf/financial-r3-1')/(stem+'.pdf');reader=PdfReader(pdf);assert len(reader.pages)>=r['corePages'];texts=[]
 if r['state']!='appendices':assert len(reader.pages)==r['corePages'],(stem,len(reader.pages))
 for i,p in enumerate(reader.pages):
  assert abs(float(p.mediabox.width)-595.28)<1 and abs(float(p.mediabox.height)-841.89)<1
  text=p.extract_text() or '';assert len(text)>30 and '\ufffd' not in text,(stem,i);texts.append(text)
  if r['tier']=='PAID' and 0<i<20:assert norm(contract['paidCorePages'][i]['topic'][r['language']]) in norm(text),(stem,i,'title')
  if i<r['corePages']:assert str(i+1)+'/'+str(r['corePages']) in norm(text),(stem,i,'page marker')
  if r['language']=='en':assert not re.search('[\u3400-\u9fff]',text),(stem,i,'language')
  assert not re.search(r'FINANCE_PUBLICATION|PRIVATE_REPORTS|SYNTHETIC_TEST|CUSTOMER_DECLARED|DOCUMENT_SUPPORTED',text),(stem,i,'internal enum')
 render(pdf,temp/stem);images=sorted(temp.glob(stem+'-*.png'));assert len(images)==len(reader.pages)
 cols=4;sheet=Image.new('RGB',(cols*380,((len(images)+3)//4)*550),'#f0eee5');draw=ImageDraw.Draw(sheet)
 for i,path in enumerate(images):
  im=Image.open(path).convert('RGB');thumb=im.copy();thumb.thumbnail((368,520));x=(i%4)*380;y=(i//4)*550;sheet.paste(thumb,(x,y+22));draw.text((x+10,y+5),stem+' / '+str(i+1),fill='#173d58')
  if i or r['tier']=='FREE':
   ref=body.resize(im.size);crop=(0,0,im.width,min(60,im.height));delta=ImageStat.Stat(ImageChops.difference(im.crop(crop),ref.crop(crop))).mean;assert sum(delta)/3<25,(stem,i,'background pixels',delta)
 sheet.save(root/(stem+'-contact.png'))
 return {**r,'pdfPages':len(reader.pages),'appendixPages':len(reader.pages)-r['corePages'],'a4':True,'selectableText':True,'localized':True,'backgroundPixelCheck':True,'sha256':hashlib.sha256(pdf.read_bytes()).hexdigest()}
with ThreadPoolExecutor(max_workers=3) as pool:results=list(pool.map(verify,state['results']))
for state_name in ['complete','shortfall','missing']:
 entries=[r for r in results if r['state']==state_name];assert len({r['sourceDigest'] for r in entries})==1;assert len({r['sourceDraftId'] for r in entries})==1
# Real PDF images for all 20 old/new comparisons, both languages; semantic mapping.
oldmap=[1,2,3,4,5,6,7,7,8,9,10,11,12,12,13,14,15,16,16,16]
for lang in ['en','zh-Hans']:
 oldpdf=Path('output/pdf/financial-r3')/('complete-'+lang+'.pdf')
 if len(list(temp.glob('old-'+lang+'-*.png')))!=16:render(oldpdf,temp/('old-'+lang),1123)
 newpdf=Path('output/pdf/financial-r3-1')/('complete-'+lang+'.pdf');render(newpdf,temp/('new-'+lang),1123)
 oldimages=sorted(temp.glob('old-'+lang+'-*.png'));newimages=sorted(temp.glob('new-'+lang+'-*.png'))
 for n,old in enumerate(oldmap,1):
  a=Image.open(oldimages[old-1]).convert('RGB');b=Image.open(newimages[n-1]).convert('RGB');canvas=Image.new('RGB',(1610,1180),'#f0eee5');d=ImageDraw.Draw(canvas);d.text((10,10),'R3 / page '+str(old)+' (earlier synthetic fixture)',fill='#173d58');d.text((815,10),'R3.1 / page '+str(n)+' (independent TEST_ONLY fixture)',fill='#173d58');canvas.paste(a,(5,40));canvas.paste(b,(810,40));canvas.save(root/('compare-'+lang+'-p'+str(n).zfill(2)+'.png'))
(root/'pdf-verification.json').write_text(json.dumps({'results':results,'mandatoryCorePages':168,'actualCorePages':sum(r['corePages'] for r in results),'actualAppendixPages':sum(r['appendixPages'] for r in results),'comparisons':40,'providerCalls':0},indent=2)+'\n',encoding='utf-8')
print('PASS actual A4 PDFs, text, title order, source parity, background pixels, 40 old/new comparisons',sum(r['pdfPages'] for r in results))
