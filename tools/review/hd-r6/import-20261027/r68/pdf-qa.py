import json,pathlib,hashlib,re,subprocess,datetime,math
import sys
sys.path.insert(0,str(pathlib.Path('scripts/lib').resolve()))
from disk_space_guard import require_disk_space,reserve_render_slot
require_disk_space('HD R68 PDF raster QA',1_000_000_000)
reserve_render_slot('HD R68 PDF raster QA')
import pdfplumber
from pypdf import PdfReader
from PIL import Image,ImageDraw
D=pathlib.Path('tools/review/hd-r6/import-20261027/r68');T=pathlib.Path('.tmp/hd-r68-private');V=D/'current-review';V.mkdir(exist_ok=True);j=lambda p:json.loads(pathlib.Path(p).read_text(encoding='utf-8'));save=lambda n,x:(D/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');sha=lambda p:hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest();norm=lambda s:re.sub(r'\s+','',re.sub(r'\*\*(.*?)\*\*',r'\1',s,flags=re.S));pop='C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe';manifest=j(D/'PDF-MANIFEST.json');layouts=j(D/'LAYOUT-MAP.json')['formats'];assets=j(D/'R2-ASSET-MANIFEST.json')['rows'];rows=[]
only=next((x.split('=',1)[1].split(',') for x in sys.argv if x.startswith('--only=')),['zh-Hans','en','bilingual'])
if len(only)<3:
 rows=[x for x in j(D/'PDF-QA.json')['results'] if x['format'] not in only]
 for r in rows:assert next(f['sha256'] for f in manifest['files'] if f['format']==r['format'])==r['pdfSHA256'],'Cannot reuse changed PDF evidence'
for f,layout in zip(manifest['files'],layouts):
 if f['format'] not in only:continue
 assert sha(f['path'])==f['sha256'];fmt=f['format'];pro=j(D/('PROJECTION-'+fmt+'.json'));texts=[];bounds=[];stats=[]
 with pdfplumber.open(f['path']) as doc:
  assert len(doc.pages)==f['pages']
  for i,page in enumerate(doc.pages):
   text=page.extract_text() or '';assert 'OWNER REVIEW / NOT FOR COMMERCIAL DISTRIBUTION' in text;assert f'{i+1} / {f["pages"]}' in text,(fmt,i+1,'page footer');body=page.within_bbox((35,60,page.width-35,page.height-58));t=body.extract_text(x_tolerance=2,y_tolerance=3) or '';texts.append(t);words=page.extract_words();bad=[w for w in words if w['x0']<34 or w['x1']>page.width-34 or w['top']<17 or w['bottom']>page.height-20]
   if bad:bounds.append({'page':i+1,'words':bad})
   role=layout['roles'].get(str(i+1),'BODY' if i>=5 else 'FRONT');stats.append({'page':i+1,'role':role,'characters':len(norm(t)),'bodyFontMinimum':min([x['size'] for x in body.chars],default=0),'images':len(page.images),'textHeight':round(max([x['bottom'] for x in body.chars],default=60)-min([x['top'] for x in body.chars],default=60),2)})
  text=''.join(norm(x) for x in texts);cursor=0;missing=[];order=[]
  for p in [p for packet in j(D/'SECTION-PACKETS.json')['packets'] for p in packet['paragraphs'] if fmt=='bilingual' or p['language']==fmt]:
   x=norm(p['text']);pos=text.find(x,cursor)
   if pos<0:missing.append(p['id'])
   else:cursor=pos+len(x);order.append(pos)
  clean='\n'.join(texts);forbidden=re.findall(r'Inner Vision|内在视觉|DreamRave|Book of Destinies|JSON Pointer|SHA256|NEW_OWNER_REVIEW_DRAFT|historical test chart|test configuration|历史测试|测试配置|Cognition claims excluded|No Tone-to-Cognition inference',clean,re.I)
 graphCaptionSamePage='Black:Personality.' in norm(texts[3]) or '黑色：意识' in norm(texts[3])
 frontFailures=[s['page'] for s in stats if 5<=s['page']<int(layout['chapters']['1']) and not s['role'].startswith('DIAGRAM_')]
 assert graphCaptionSamePage and not frontFailures,(fmt,'orphaned front-matter caption',frontFailures)
 # Verify actual PDF image pixels, not just HTTP or registry presence.
 expected={a['section']:hashlib.sha256(Image.open(a['file']).convert('RGB').tobytes()).hexdigest() for a in assets};r=PdfReader(f['path']);assert len(r.outline)==17;assert sum(len(p.get('/Annots',[])) for p in r.pages)>=17;cache={};pixelmatches={};posterproof=[]
 for pageNum,page in enumerate(r.pages,1):
  images=[]
  for name,ref in page.get('/Resources',{}).get('/XObject',{}).items():
   obj=ref.get_object()
   if obj.get('/Subtype')!='/Image':continue
   key=(ref.idnum,ref.generation)
   if key not in cache:cache[key]=hashlib.sha256(obj.get_data()).hexdigest()
   images.append(cache[key])
  if pageNum in layout['chapters'].values():pass
  for sec,pg in layout['chapters'].items():
   if int(pg)==pageNum:
    wanted=expected.get(int(sec));matched=wanted in images;posterproof.append({'section':int(sec),'page':pageNum,'exactDecodedPixelMatch':matched,'expected':'EMBED_OWNER_CONFIRMED' if int(sec)==11 else 'EMBED'})
  pixelmatches[pageNum]=expected['BODY'] in images
 assert all(pixelmatches.values()),'BODY XObject not actually present';assert sum(x['exactDecodedPixelMatch'] for x in posterproof)==17;assert next(x for x in posterproof if x['section']==11)['exactDecodedPixelMatch']
 # Low density is diagnostic; a final/diagram/opener page is not silently called bad.
 low=[s for s in stats if s['role']=='BODY' and s['textHeight']<140 and s['characters']<220]
 result={'format':fmt,'pdfSHA256':f['sha256'],'pages':f['pages'],'missingParagraphs':missing,'paragraphOrderCorrect':not missing,'boundsFailures':bounds,'forbiddenLeaks':forbidden,'posterPixelProof':posterproof,'BODYActualEveryPage':all(pixelmatches.values()),'lowDensityBodyPages':low,'pageStats':stats,'status':'PASS_MACHINE_VISUAL_PENDING' if not missing and not bounds and not forbidden else 'FAIL'};rows.append(result);save('PDF-QA.json',{'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'results':rows,'scope':'Private physical PDF candidate;17/17 fixed visuals, commercial BLOCKED'})
 print(json.dumps({k:result[k] for k in ['format','pages','status','missingParagraphs','lowDensityBodyPages']},ensure_ascii=False),flush=True)
 raster=T/('pages-current-'+fmt);raster.mkdir(exist_ok=True);
 # Overwrite this task's mutable page rasters only; retain any superseded extra
 # page files without treating them as current evidence. No cleanup or deletion.
 q=subprocess.run([pop,'-scale-to','850','-jpeg','-jpegopt','quality=74',f['path'],str(raster/'p')],capture_output=True,text=True);assert q.returncode==0,q.stderr
 pages=sorted([p for p in raster.glob('p-*.jpg') if int(p.stem.split('-')[-1])<=f['pages']],key=lambda p:int(p.stem.split('-')[-1]));assert len(pages)==f['pages']
 for start in range(0,len(pages),12):
  contact=Image.new('RGB',(1600,1760),'#e8e5df');dr=ImageDraw.Draw(contact)
  for k,p in enumerate(pages[start:start+12]):
   im=Image.open(p);im.thumbnail((390,550));x=k%4*400;y=k//4*585;dr.text((x+6,y+3),f'{fmt} / {start+k+1}',fill='black');contact.paste(im,(x+5,y+23));im.close()
  contact.save(V/f'{fmt}-contact-{start//12+1:02}.jpg',quality=88)
 reps=[1,4,5,int(layout['chapters']['1']),int(layout['chapters']['1'])+1,int(layout['chapters']['5'])+1,int(layout['chapters']['6'])+1,int(layout['chapters']['10'])+1,int(layout['chapters']['10'])+2,int(layout['chapters']['15'])+1,int(layout['chapters']['13'])+1,f['pages']]
 for pg in reps:subprocess.run([pop,'-f',str(pg),'-l',str(pg),'-scale-to','1200','-singlefile','-png',f['path'],str(V/f'{fmt}-representative-{pg}')],capture_output=True,check=True)
 if False:
  for intermediate in pages:intermediate.unlink()
save('PDF-QA.json',{'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'results':rows,'physicalPages':sum(x['pages'] for x in rows),'contacts':len(list(V.glob('*contact*'))),'scope':'Actual exported bytes; private17/17 visual candidate, no commercial PASS'})
