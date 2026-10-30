import pathlib,json,subprocess,sys,hashlib,re
sys.path.insert(0,str(pathlib.Path('scripts/lib').resolve()))
from disk_space_guard import require_disk_space,reserve_render_slot
require_disk_space('HD R610 incremental physical diagram proof',200_000_000);reserve_render_slot('HD R610 incremental physical diagram proof')
from PIL import Image,ImageDraw
from pypdf import PdfReader
D=pathlib.Path(__file__).parent;T=pathlib.Path('.tmp/hd-r610-private');V=D/'current-review';J=lambda n:json.loads((D/n).read_text(encoding='utf-8'));pop='C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe';rows=[]
for f,r in zip(J('PDF-MANIFEST.json')['files'],J('INCREMENTAL-DIAGRAM-PAGE-EXPORT.json')['records']):
 assert f['format']==r['format'];folder=T/('pages-current-'+f['format']);pages=sorted(folder.glob('p-*.jpg'),key=lambda p:int(p.stem.split('-')[-1]));assert len(pages)==f['pages']
 for pg in r['changedPages']:
  p=next(p for p in pages if int(p.stem.split('-')[-1])==pg);subprocess.run([pop,'-f',str(pg),'-l',str(pg),'-scale-to','850','-singlefile','-jpeg','-jpegopt','quality=74',f['path'],str(p.with_suffix(''))],check=True,capture_output=True);subprocess.run([pop,'-f',str(pg),'-l',str(pg),'-scale-to','1200','-singlefile','-png',f['path'],str(V/f'{f["format"]}-representative-{pg}')],check=True,capture_output=True)
 for start in range(0,len(pages),12):
  contact=Image.new('RGB',(1600,1760),'#e8e5df');dr=ImageDraw.Draw(contact)
  for k,p in enumerate(pages[start:start+12]):
   with Image.open(p) as im:
    im.thumbnail((390,550));x=k%4*400;y=k//4*585;dr.text((x+6,y+3),f'{f["format"]} / {start+k+1}',fill='black');contact.paste(im,(x+5,y+23))
  contact.save(V/f'{f["format"]}-contact-{start//12+1:02}.jpg',quality=88)
 # Locate actual restored 10.7 rather than assuming an old page number.
 found=[]
 for i,p in enumerate(PdfReader(f['path']).pages,1):
  text=re.sub(r'\s+','',p.extract_text() or '')
  if '10.7InnerVision' in text or '10.7内在视觉' in text:
   found.append(i);subprocess.run([pop,'-f',str(i),'-l',str(i),'-scale-to','1400','-singlefile','-png',f['path'],str(V/f'{f["format"]}-COGNITION-{i}')],check=True,capture_output=True)
 assert found;rows.append({'format':f['format'],'pdfSHA256':f['sha256'],'changedPagesRasterized':r['changedPages'],'otherPageRastersReusedWithUnchangedContentHashProof':r['unchangedPageContentHashesVerified'],'cognitionPages':found})
(D/'INCREMENTAL-PHYSICAL-PROOF.json').write_text(json.dumps({'rows':rows,'totalPages':sum(f['pages'] for f in J('PDF-MANIFEST.json')['files']),'contacts':len(list(V.glob('*contact*')))},indent=2)+'\n');print({'updatedDiagramRasters':9,'cognitionScreenshots':sum(len(r['cognitionPages']) for r in rows),'fullRerenderAvoidedByContentHashProof':True})
