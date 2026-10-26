from pathlib import Path
from pypdf import PdfReader
from PIL import Image, ImageDraw, ImageChops, ImageStat
import json, subprocess, hashlib, math
d=Path('tools/review/report-visual-asset-convergence-r2/recovery-r22'); root=Path('output/pdf/report-visual-asset-convergence-r2/r22')
poppler='C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe'
diag=json.loads((d/'PUBLIC-DIAGNOSTICS.json').read_text()); public=json.loads((d/'PUBLIC-READS.json').read_text())['rows']; results=[]
for path in root.glob('*.pdf'):
    ziwei=path.name.startswith('ziwei'); body=next(r for r in public if r['methodId']=='ZWR' and r['pageId']=='BODY') if ziwei else next(p for r in diag['rows'] if r['report']=='BZR' for p in r['probes'] if p.get('decoded'))
    bp=Path(body['localPath']) if ziwei else d/(body['sha256']+'.webp')
    expected=Image.open(bp).convert('RGB').resize((184,260))
    if ziwei: expected=Image.blend(Image.new('RGB',expected.size,'#f8f3ea'),expected,.42)
    reader=PdfReader(path); pages=[]; tiles=[]
    for i,p in enumerate(reader.pages,1):
        w,h=float(p.mediabox.width),float(p.mediabox.height); assert abs(w-595.28)<2 and abs(h-841.89)<2
        prefix=Path('.tmp/report-visual-convergence-r2')/('r22-'+path.stem+'-'+str(i))
        subprocess.run([poppler,'-f',str(i),'-singlefile','-scale-to','260','-png',str(path),str(prefix)],check=True,capture_output=True)
        im=Image.open(str(prefix)+'.png').convert('RGB').resize((184,260)); text=p.extract_text() or ''; fixed=ziwei and not text.strip()
        error=None
        if not fixed:
            rs=[(3,52,8,104),(3,156,8,208),(176,78,181,182)]
            error=sum(sum(ImageStat.Stat(ImageChops.difference(im.crop(r),expected.crop(r))).mean)/3 for r in rs)/len(rs)
        tile=Image.new('RGB',(204,286),'#eee');tile.paste(im,(10,4));ImageDraw.Draw(tile).text((8,268),str(i),fill='black');tiles.append(tile)
        pages.append({'page':i,'role':'FIXED_IMAGE' if fixed else 'BODY_CONTENT','textLength':len(text),'bodyMarginMeanError':error,'bodyProof':None if fixed else error<32})
        if ziwei and (i==1 or i==len(reader.pages) or 'S08' in text or 'S09' in text): im.save(d/(path.stem+'-page-'+str(i)+'.png'))
        Path(str(prefix)+'.png').unlink()
    sheet=Image.new('RGB',(816,286*math.ceil(len(tiles)/4)),'#eee')
    for i,t in enumerate(tiles):sheet.paste(t,((i%4)*204,(i//4)*286))
    sheet.save(d/(path.stem+'-pages.png'))
    results.append({'path':str(path).replace('\\','/'),'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'pageCount':len(pages),'fixedPages':sum(p['role']=='FIXED_IMAGE' for p in pages),'bodyPages':sum(p['role']=='BODY_CONTENT' for p in pages),'pages':pages,'bodyProofFailures':[p for p in pages if p['bodyProof'] is False]})
    print(path.name,len(pages),'pages',flush=True)
(d/'PDF-INSPECTION-R22.json').write_text(json.dumps({'files':results,'humanAcceptance':'PENDING','method':'Actual PDF page count/A4 plus every-page Poppler raster, BODY outer margins threshold32 inherited unchanged from R2.1'},indent=2))
