from pathlib import Path
from pypdf import PdfReader
from PIL import Image,ImageDraw,ImageChops,ImageStat
import subprocess,json,hashlib,math
d=Path('tools/review/report-visual-asset-convergence-r2/recovery-r23'); root=Path('output/pdf/report-visual-asset-convergence-r2/r23')
poppler='C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe'
body=next(r for r in json.loads((d/'PUBLIC-READS.json').read_text())['rows'] if r['methodId']=='PROFILE'); expected=Image.open(body['localPath']).convert('RGB').resize((184,260)); results=[]
for pdf in root.glob('profile-*.pdf'):
 reader=PdfReader(pdf); pages=[]; tiles=[]
 for n,p in enumerate(reader.pages,1):
  w,h=float(p.mediabox.width),float(p.mediabox.height);assert abs(w-595.28)<2 and abs(h-841.89)<2
  prefix=Path('.tmp/report-visual-convergence-r2')/('r23-'+pdf.stem+'-'+str(n));subprocess.run([poppler,'-f',str(n),'-singlefile','-scale-to','260','-png',str(pdf),str(prefix)],check=True,capture_output=True)
  im=Image.open(str(prefix)+'.png').convert('RGB').resize((184,260));text=p.extract_text()or'';fixed=not text.strip();error=None
  if not fixed:
   rs=[(3,52,8,104),(3,156,8,208),(176,78,181,182)];error=sum(sum(ImageStat.Stat(ImageChops.difference(im.crop(r),expected.crop(r))).mean)/3 for r in rs)/len(rs)
  tile=Image.new('RGB',(204,286),'#eee');tile.paste(im,(10,4));ImageDraw.Draw(tile).text((8,268),str(n),fill='black');tiles.append(tile)
  pages.append({'page':n,'role':'FIXED_IMAGE'if fixed else'BODY_CONTENT','textLength':len(text),'bodyMarginError':error,'bodyProof':None if fixed else error<32})
  Path(str(prefix)+'.png').unlink()
 sheet=Image.new('RGB',(816,286*math.ceil(len(tiles)/4)),'#eee')
 for i,t in enumerate(tiles):sheet.paste(t,((i%4)*204,(i//4)*286))
 sheet.save(d/(pdf.stem+'-pages.png'));bodypages=[p for p in pages if p['role']=='BODY_CONTENT'];assert sum(p['role']=='FIXED_IMAGE'for p in pages)==15
 sample=list(dict.fromkeys([bodypages[0]['page'],bodypages[len(bodypages)//2]['page'],bodypages[-1]['page']]))
 for n in sample:subprocess.run([poppler,'-f',str(n),'-singlefile','-scale-to','1000','-png',str(pdf),str(d/(pdf.stem+'-final-'+str(n)))],check=True,capture_output=True)
 results.append({'path':str(pdf).replace('\\','/'),'bytes':pdf.stat().st_size,'sha256':hashlib.sha256(pdf.read_bytes()).hexdigest(),'pageCount':len(pages),'fixedPages':15,'bodyPages':len(bodypages),'representativeBodyPages':sample,'bodyProofFailures':[p for p in bodypages if not p['bodyProof']],'pages':pages});print(pdf.name,len(pages),'pages, BODY',len(bodypages),flush=True)
(d/'PDF-INSPECTION-R23.json').write_text(json.dumps({'files':results,'physicalProof':'Actual A4 count, every-page raster; BODY three outer-margin regions inherited threshold32; representative first/middle/final high-resolution inspection','humanAcceptance':'PENDING'},indent=2))
