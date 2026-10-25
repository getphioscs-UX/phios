import json, pathlib, hashlib, subprocess
from pypdf import PdfReader
import pdfplumber
from PIL import Image,ImageOps,ImageDraw
root=pathlib.Path('tools/review/personal-evidence-r1/commerce-r1-2')
rows=[]
for p in root.glob('*.pdf'):
 r=PdfReader(p); pages=[]
 with pdfplumber.open(p) as doc:
  for n,(page,geometry) in enumerate(zip(r.pages,doc.pages),1):
   text=page.extract_text() or ''
   outside=[c for c in geometry.chars if c['x0'] < 25 or c['x1'] > geometry.width-25 or c['top'] < 15 or c['bottom'] > geometry.height-15]
   row={'page':n,'width':float(page.mediabox.width),'height':float(page.mediabox.height),'textCharacters':len(text),'a4':abs(float(page.mediabox.width)-595.28)<2 and abs(float(page.mediabox.height)-841.89)<2,'blank':len(text.strip())<10,'charactersOutsideSafePageBounds':len(outside)}
   assert row['a4'] and not row['blank'] and not outside,(p.name,row)
   pages.append(row)
 rows.append({'file':p.name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'pages':pages})
assert len(next(r for r in rows if r['file']=='dossier-bilingual.pdf')['pages'])>len(next(r for r in rows if r['file']=='dossier-en.pdf')['pages']),'long source must add physical pages'
(root/'PDF-INSPECTION.json').write_text(json.dumps({'status':'PASS_LOCAL_GEOMETRY_AND_TEXT','files':rows,'publication':'PENDING_ARTWORK_NOT_FINAL','notVerified':'No claim that text extraction alone proves semantic/visual acceptance.'},indent=2),encoding='utf-8')
poppler=pathlib.Path('C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe')
for language in ['zh','en','bilingual']:
 p=root/f'dossier-{language}.pdf';count=len(PdfReader(p).pages);tiles=[]
 for n in range(1,count+1):
  prefix=root/f'.page-{language}-{n}'
  subprocess.run([str(poppler),'-f',str(n),'-singlefile','-scale-to','250','-png',str(p),str(prefix)],check=True,capture_output=True)
  with Image.open(str(prefix)+'.png') as im:tile=Image.new('RGB',(210,290),'#e8e5dd');im.thumbnail((190,258));tile.paste(im,((210-im.width)//2,6));ImageDraw.Draw(tile).text((8,270),str(n),fill='black');tiles.append(tile)
  pathlib.Path(str(prefix)+'.png').unlink() # only this script's transient per-page render; final evidence retained
 cols=4;sheet=Image.new('RGB',(cols*210,((count+cols-1)//cols)*290),'#e8e5dd')
 for i,tile in enumerate(tiles):sheet.paste(tile,((i%cols)*210,(i//cols)*290))
 sheet.save(root/f'pagination-{language}.png')
print('PASS PDF',len(rows),'files',sum(len(x['pages']) for x in rows),'pages')
