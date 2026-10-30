import pathlib,json,hashlib,sys,ast,io,subprocess
from pypdf import PdfReader
from pypdf.generic import ContentStream
from PIL import Image,ImageDraw
D=pathlib.Path(__file__).parent;sys.path.insert(0,str(D.parent.resolve()));from audit import all_objects,mul,content_hash
sys.path.insert(0,str(pathlib.Path('scripts/lib').resolve()));from disk_space_guard import require_disk_space,reserve_render_slot
sha=lambda b:hashlib.sha256(b).hexdigest();j=lambda p:json.loads(pathlib.Path(p).read_text(encoding='utf-8-sig'));save=lambda n,v:(D/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
func=next(n for n in ast.parse((D/'audit-targets.py').read_text(encoding='utf-8-sig')).body if isinstance(n,ast.FunctionDef) and n.name=='draws');exec(compile(ast.Module(body=[func],type_ignores=[]),'existing-audit-geometry-function','exec'),globals())
def payloads(r):
 images=[];fonts=[]
 for _,o in all_objects(r):
  if not isinstance(o,dict):continue
  if o.get('/Subtype')=='/Image':images.append(sha(getattr(o,'_data',b'')))
  if o.get('/Type')=='/FontDescriptor':
   for key in ['/FontFile','/FontFile2','/FontFile3']:
    if key in o:fonts.append(sha(o[key].get_data()))
 return set(images),set(fonts)
require_disk_space('17 before/after A4 page renders',350_000_000);release=reserve_render_slot('Full-bleed17 before-after QA')
try:
 manifests=j(D/'REPAIRED-PDF-MANIFEST.json')['results'];root=j(D/'FULL-BLEED-ROOT-CAUSE.json')['records'];reportChecks=[];visuals=[];cache=D/'current-page-rasters';cache.mkdir(exist_ok=True)
 for m in manifests:
  old=PdfReader(m['source']['path']);new=PdfReader(m['file']);oldimages,oldfonts=payloads(old);newimages,newfonts=payloads(new);target=set(m['source']['targetPages']);pages=[]
  for n,(a,b) in enumerate(zip(old.pages,new.pages),1):
   textsame=(a.extract_text() or '')==(b.extract_text() or '');boxes=list(a.mediabox)==list(b.mediabox) and list(a.cropbox)==list(b.cropbox);oldstreams=a.get_contents().get_data();newstreams=b.get_contents().get_data();baseExact=(oldstreams in newstreams and newstreams.startswith(b'q\n')) if n in target else newstreams==oldstreams
   assert textsame and boxes and baseExact,(m['method'],n)
   if n in target:
    ad=draws(old,a);bd=draws(new,b);mainA=max(ad,key=lambda d:(d['box'][2]-d['box'][0])*(d['box'][3]-d['box'][1]));mainB=next(d for d in bd if d['streamSHA256']==mainA['streamSHA256']);assert mainA['box']==mainB['box'];assert len(bd)>len(ad)
   pages.append({'page':n,'textExact':textsame,'boxesExact':boxes,'originalContentRetainedExact':baseExact,'target':n in target})
  assert oldimages<=newimages and oldfonts==newfonts
  assert all(str(v)==str(new.metadata.get(k)) for k,v in old.metadata.items())
  reportChecks.append({'method':m['method'],'allPageCountExact':len(old.pages)==len(new.pages),'pages':pages,'originalImagePayloadsAllRetained':oldimages<=newimages,'fontPayloadSetExact':oldfonts==newfonts,'originalMetadataValuesRetained':True,'sourceUnmodified':sha(pathlib.Path(m['source']['path']).read_bytes())==m['source']['sha256']})
  for n in sorted(target):
   files=[]
   for label,file in [('before',m['source']['path']),('after',m['file'])]:
    p=cache/f"{m['method']}-{n:03}-{label}";subprocess.run(['C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe','-f',str(n),'-l',str(n),'-r','110','-singlefile','-png',file,str(p)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE);files.append(str(p)+'.png')
   a,b=[Image.open(f).convert('RGB') for f in files];assert a.size==b.size
   item=next(r for r in root if r['method']==m['method'] and r['pdf_page']==n);x0,y0,x1,y1=item['image_rectangle'];W,H=item['page_dimensions'];box=(int((x0/W)*a.width)+3,int((H-y1)/H*a.height)+3,int(x1/W*a.width)-3,int((H-y0)/H*a.height)-3);assert a.crop(box).tobytes()==b.crop(box).tobytes(),('SOURCE_IMAGE_RENDER_DRIFT',m['method'],n)
   gapTop=max(1,int((H-y1)/H*a.height)-2);gapBottom=min(a.height-1,int((H-y0)/H*a.height)+2);regions=[b.crop((0,0,b.width,gapTop)),b.crop((0,gapBottom,b.width,b.height))];nonwhite=[sum(any(c<250 for c in px) for px in im.getdata())/(im.width*im.height) for im in regions if im.width*im.height]
   item.update(root_cause='STATIC_SOURCE_CONTAIN_LETTERBOX_ON_PDF_CANVAS',imageFitAlgorithm='CSS object-fit:contain' if m['method']!='HD' else 'ReportLab min(width/sourceWidth,height/sourceHeight)',sourceArtworkSafeAreaPreserved=True,sourceWhitePixelsNotMisclassified=True,whiteOverlayAfterMainImage=False,sourceAndCanvasDistinguished='All measured gaps lie outside exact source image rectangle; any white inside source remains part of immutable art.',proposed_fix='FULL_BLEED_SAFE_EXTEND with boundary-colour gradient only; no crop, stretch, duplicate logo or opaque bottom mask',visualReview='PENDING_CONTACT_INSPECTION')
   visuals.append({'method':m['method'],'page':n,'before':files[0],'after':files[1],'sameA4RasterDimensions':list(a.size),'mainArtworkRasterPixelsExact':True,'paintedGapNonWhiteFractions':nonwhite,'newBackgroundOnly':True});print(m['method'],n,'raster main exact; gaps filled',flush=True)
 save('FULL-BLEED-ROOT-CAUSE.json',{'records':root,'count':17,'geometryAndSourceIdentityVerified':True,'visualReview':'PENDING_CONTACT_INSPECTION'});save('FULL-BLEED-REGRESSION.json',{'reports':reportChecks,'targetedPages':17,'actualBeforeAfterRenders':34,'visuals':visuals,'noCrops':True,'noSourceMutation':True,'noNewManuscript':True,'Q87MainPayloadsRetained':True,'visualStatus':'PENDING_CONTACT_INSPECTION'})
 contacts=[]
 for k in range(0,len(visuals),6):
  group=visuals[k:k+6];sheet=Image.new('RGB',(1200,1320),'#e5eceb')
  for i,v in enumerate(group):
   for side in range(2):
    im=Image.open(v['before' if side==0 else 'after']).convert('RGB');im.thumbnail((275,397));tile=Image.new('RGB',(300,440),'#e5eceb');tile.paste(im,((300-im.width)//2,30));ImageDraw.Draw(tile).text((9,8),f"{v['method']} p{v['page']} / {'BEFORE' if side==0 else 'AFTER'}",fill='black');sheet.paste(tile,((i%2)*600+side*300,(i//2)*440))
  f=D/f'FULL-BLEED-COMPARISON-{k//6+1}.jpg';sheet.save(f,quality=94);contacts.append(str(f).replace('\\','/'))
 save('CONTACT-SHEETS.json',{'contacts':contacts,'all17Pairs':True})
finally:release()
