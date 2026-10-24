from pathlib import Path
from pypdf import PdfReader
from PIL import Image, ImageOps, ImageDraw
import subprocess,json,hashlib
out=Path('tools/review/financial-publication-merged/number-layout-r1-closeout');poppler=Path(r'C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe')
records=[]
for stem,expected in [('before-after',4),('stress-proof',7)]:
 p=Path('output/pdf/financial-merged/number-layout-r1-closeout-'+stem+'.pdf');r=PdfReader(p);assert len(r.pages)==expected,(stem,len(r.pages))
 pages=[]
 for i,page in enumerate(r.pages):
  w,h=float(page.mediabox.width),float(page.mediabox.height);assert abs(w-595.276)<1 and abs(h-841.89)<1
  text=page.extract_text();links=[]
  for item in page.get('/Annots',[]):
   a=item.get_object().get('/A',{});uri=a.get('/URI');
   if uri:links.append(str(uri))
  pages.append({'page':i+1,'widthPt':w,'heightPt':h,'text':text,'links':links})
 subprocess.run([str(poppler),'-r','96','-png',str(p),str(out/('pdf-'+stem))],check=True,capture_output=True)
 imgs=[Image.open(n).convert('RGB') for n in sorted(out.glob('pdf-'+stem+'-*.png'))];thumbs=[]
 for i,im in enumerate(imgs):
  im.thumbnail((397,562));canvas=Image.new('RGB',(417,592),'white');canvas.paste(im,((417-im.width)//2,20));ImageDraw.Draw(canvas).text((12,575),f'{stem} / {i+1}',fill='black');thumbs.append(canvas)
 sheet=Image.new('RGB',(417*min(4,len(thumbs)),592*((len(thumbs)+3)//4)),'#e5e5e0')
 for i,im in enumerate(thumbs):sheet.paste(im,((i%4)*417,(i//4)*592))
 sheet.save(out/('contact-'+stem+'.png'));records.append({'file':str(p),'pages':len(r.pages),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'pageDetails':pages})
assert all('P22' in p['text'] and 'PXX' not in p['text'] for p in records[1]['pageDetails'][5:])
assert all('SYNTHETIC' in p['text'] for p in records[1]['pageDetails'])
assert all(len(p['links'])>=1 for p in records[1]['pageDetails'][5:])
for item in records[1]['pageDetails'][5:]:
 for u in item['links']:
  assert 'complete-merged-165d1571fe.pdf#page=' in u
  assert 1 <= int(u.rsplit('=',1)[1]) <= 37
old=json.loads((out/'preservation-baseline.json').read_text())['pdfs'];assert all(hashlib.sha256(Path(p).read_bytes()).hexdigest()==h for p,h in old.items())
(out/'pdf-verification.json').write_text(json.dumps({'status':'PASS','outputs':records,'historicalPDFsUnchanged':len(old),'providerCalls':0},ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'pages':[r['pages'] for r in records],'historicalPDFsUnchanged':len(old)}))
