from pathlib import Path
from pypdf import PdfReader
from PIL import Image,ImageDraw,ImageChops,ImageStat
import json,subprocess,hashlib,math
root=Path('output/pdf/report-visual-asset-convergence-r2/r21');out=Path('tools/review/report-visual-asset-convergence-r2/owner-inventory-followup');read=json.loads((out/'PUBLIC-READS.json').read_text(encoding='utf-8'));look={r['methodId']:r for r in read['rows'] if r['pageId']=='BODY'and r.get('decoded')};rows=[]
previous=json.loads((out/'PDF-INSPECTION-R21.json').read_text(encoding='utf-8'))['files'] if (out/'PDF-INSPECTION-R21.json').exists() else []
poppler='C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe'
for pdf in root.glob('*.pdf'):
 digest=hashlib.sha256(pdf.read_bytes()).hexdigest()
 prior=next((r for r in previous if r['path']==str(pdf).replace('\\','/') and r['sha256']==digest),None)
 if prior:
  rows.append(prior);print(pdf.name,'REUSED_SHA_BOUND_PAGE_INSPECTION',flush=True);continue
 reader=PdfReader(pdf);tiles=[];pages=[];method='AST'if pdf.name.startswith('ast-')else'ECR'if pdf.name.startswith('ecr-')else'ZWR'if pdf.name.startswith('ziwei-')else None;hasbody=('body' in pdf.name);expected=None
 if hasbody:
  with Image.open(look[method]['localPath'])as im:expected=im.convert('RGB');expected=expected.resize((184,260))
  if method=='ZWR':expected=Image.blend(Image.new('RGB',expected.size,'#f8f3ea'),expected,.42)
 for n,p in enumerate(reader.pages,1):
  w,h=float(p.mediabox.width),float(p.mediabox.height);assert abs(w-595.28)<2 and abs(h-841.89)<2,(pdf.name,n,w,h)
  prefix=Path('.tmp/report-visual-convergence-r2')/('r21-'+pdf.stem+'-'+str(n));subprocess.run([poppler,'-f',str(n),'-singlefile','-scale-to','260','-png',str(pdf),str(prefix)],check=True,capture_output=True)
  text=p.extract_text()or''
  with Image.open(str(prefix)+'.png')as im:
   rgb=im.convert('RGB').resize((184,260));tile=Image.new('RGB',(204,286),'#e5e5e5');tile.paste(rgb,(10,4));ImageDraw.Draw(tile).text((8,268),str(n),fill='black');tiles.append(tile)
   fixed=(not hasbody)or(method=='AST'and not text.strip())
   if not fixed:
    regions=[(3,52,8,104),(3,156,8,208),(176,78,181,182)]
    errors=[]
    for r in regions:errors.append(sum(ImageStat.Stat(ImageChops.difference(rgb.crop(r),expected.crop(r))).mean)/3)
    background_error=sum(errors)/len(errors)
    # Exact original body art at safe outer margin. Native Ziwei preserves its approved opacity.
    assert background_error<32,(pdf.name,n,'BODY_BACKGROUND_NOT_PROVEN',background_error)
   else:background_error=None
  pages.append({'page':n,'textLength':len(text),'role':'FIXED_IMAGE'if fixed else'BODY_CONTENT','bodyMarginMeanError':background_error,'width':w,'height':h})
  Path(str(prefix)+'.png').unlink()
 sheet=Image.new('RGB',(816,286*math.ceil(len(tiles)/4)),'#eee')
 for i,t in enumerate(tiles):sheet.paste(t,((i%4)*204,(i//4)*286))
 sheet.save(out/(pdf.stem+'-pages.png'));rows.append({'path':str(pdf).replace('\\','/'),'sha256':hashlib.sha256(pdf.read_bytes()).hexdigest(),'bytes':pdf.stat().st_size,'pages':pages});print(pdf.name,len(pages),'pages / BODY verified',sum(x['role']=='BODY_CONTENT'for x in pages),flush=True)
replay=Path('tools/review/report-visual-asset-convergence-r2/owner-inventory-followup/r12-replay');old=[{'name':p.name,'pages':len(PdfReader(p).pages),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}for p in replay.glob('*.pdf')]
(out/'PDF-INSPECTION-R21.json').write_text(json.dumps({'status':'PASS_A4_FIXED_AND_BODY_PHYSICAL_PAGE_CHECKS','files':rows,'r12RerunPDFs':old,'physicalBodyProof':'Raster comparison of three outer-margin regions on every BODY physical page against actual approved BODY bytes; native Ziwei approved .42 opacity retained. Threshold32 set before check. Fixed pages excluded from BODY assertions.','humanReadabilityAcceptance':'PENDING'},indent=2),encoding='utf-8');print('PASS R2.1',len(rows),'PDFs',sum(len(x['pages'])for x in rows),'pages; R1.2 replay',len(old),'PDFs',sum(x['pages']for x in old),flush=True)
