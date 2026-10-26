from pathlib import Path
from pypdf import PdfReader
from PIL import Image,ImageDraw
import subprocess,json,hashlib
root=Path('output/pdf/report-visual-asset-convergence-r2');out=Path('tools/review/report-visual-asset-convergence-r2');rows=[]
poppler=Path('C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe')
for p in root.glob('*.pdf'):
 r=PdfReader(p);pages=[];tiles=[]
 for i,page in enumerate(r.pages,1):
  w,h=float(page.mediabox.width),float(page.mediabox.height)
  assert abs(w-595.28)<2 and abs(h-841.89)<2
  pref=Path('.tmp/report-visual-convergence-r2')/(p.stem+'-'+str(i));subprocess.run([str(poppler),'-f',str(i),'-singlefile','-scale-to','360','-png',str(p),str(pref)],check=True,capture_output=True)
  with Image.open(str(pref)+'.png') as im:
   im.thumbnail((200,280));tile=Image.new('RGB',(220,310),'#e5e5e5');tile.paste(im,((220-im.width)//2,4));ImageDraw.Draw(tile).text((10,291),str(i),fill='black');tiles.append(tile)
  pages.append({'page':i,'width':w,'height':h,'textLength':len(page.extract_text()or'')})
 sheet=Image.new('RGB',(880,310*((len(tiles)+3)//4)),'#eee')
 for i,t in enumerate(tiles):sheet.paste(t,((i%4)*220,(i//4)*310))
 sheet.save(out/(p.stem+'-pages.png'));rows.append({'path':str(p).replace('\\','/'),'pages':pages,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'completeReport':False})
(out/'PDF-INSPECTION.json').write_text(json.dumps({'at':'2026-10-26','status':'PASS_A4_RENDERED_PARTIAL_SAMPLES','files':rows,'note':'Image-only fixed pages intentionally have no selectable runtime body. Visual sheets require inspection; samples are not complete reports.'},indent=2),encoding='utf-8');print('PDF samples',len(rows),'pages',sum(len(r['pages'])for r in rows))
