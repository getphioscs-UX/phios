import json,pathlib,hashlib,re,subprocess,datetime,sys
sys.path.insert(0,str(pathlib.Path('scripts/lib').resolve()));from disk_space_guard import require_disk_space,reserve_render_slot
import pdfplumber
from pypdf import PdfReader
from PIL import Image,ImageDraw
D=pathlib.Path(__file__).parent;T=pathlib.Path('.tmp/hd-r611-private');V=D/'current-review';V.mkdir(exist_ok=True);j=lambda p:json.loads(pathlib.Path(p).read_text(encoding='utf-8'));sha=lambda p:hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest();norm=lambda s:re.sub(r'\s+','',re.sub(r'\*\*(.*?)\*\*',r'\1',s,flags=re.S));save=lambda n,x:(D/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
if '--skip-rasters' not in sys.argv:require_disk_space('R611 full physical page raster QA',800_000_000);reserve_render_slot('R611 full PDF raster QA')
pop='C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe';rows=[];layouts=j(D/'LAYOUT-MAP.json')['formats'];assets=j(D/'R2-ASSET-MANIFEST.json')['rows'];front=j(D/'FRONT-MATTER-BINDINGS.json')['rows'];contract=j(next((D/'input').rglob('HD-TOC-CONTRACT.json')))
for f in j(D/'PDF-MANIFEST.json')['files']:
 fmt=f['format'];layout=next(x for x in layouts if x['format']==fmt);r=PdfReader(f['path']);assert sha(f['path'])==f['sha256'];assert len(r.pages)==f['pages'];assert len(r.outline)==17;toc=r.pages[5];annotations=[a.get_object() for a in toc.get('/Annots',[])];assert len(annotations)==17;links=[]
 for n,a in enumerate(annotations,1):
  dest=a['/Dest'];index=next(i for i,p in enumerate(r.pages) if p.indirect_reference==dest[0]);expected=layout['chapters'][str(n)];assert index+1==expected;assert r.get_destination_page_number(r.outline[n-1])+1==expected;links.append({'section':n,'printedPage':expected,'linkTargetPage':index+1,'bookmarkTargetPage':expected})
 expectedPixels={a['section']:hashlib.sha256(Image.open(a['file']).convert('RGB').tobytes()).hexdigest() for a in assets};pixelRows=[];cache={}
 for pno,page in enumerate(r.pages,1):
  actual=[]
  for name,ref in page.get('/Resources',{}).get('/XObject',{}).items():
   obj=ref.get_object()
   if obj.get('/Subtype')!='/Image':continue
   key=(ref.idnum,ref.generation)
   if key not in cache:cache[key]=hashlib.sha256(obj.get_data()).hexdigest()
   actual.append(cache[key])
  if pno<=5:
   a=next(a for a in front if a['language']==fmt and a['pageId']=='P0'+str(pno));wanted=hashlib.sha256(Image.open(a['file']).convert('RGB').tobytes()).hexdigest();assert wanted in actual;pixelRows.append({'page':pno,'kind':'FRONT','key':a['objectKey'],'exactDecodedPixels':True})
  else:assert expectedPixels['BODY'] in actual
  for sec,pg in layout['chapters'].items():
   if pg==pno:assert expectedPixels[int(sec)] in actual;pixelRows.append({'page':pno,'kind':'SECTION_OPENER','section':int(sec),'exactDecodedPixels':True})
 texts=[];stats=[];bounds=[]
 with pdfplumber.open(f['path']) as doc:
  assert len(doc.pages)==f['pages']
  for pno,page in enumerate(doc.pages,1):
   if pno<=5:
    im=page.images[0];a=next(a for a in front if a['language']==fmt and a['pageId']=='P0'+str(pno));assert len(page.images)==1;assert abs(im['width']/im['height']-a['width']/a['height'])<0.0001;assert im['x0']>=-0.01 and im['x1']<=page.width+0.01 and im['y0']>=-0.01 and im['y1']<=page.height+0.01
   body=page.within_bbox((35,60,page.width-35,page.height-58));t=body.extract_text(x_tolerance=2,y_tolerance=3) or '';texts.append(t);role=layout['roles'].get(str(pno),'BODY');height=max([c['bottom'] for c in body.chars],default=60)-min([c['top'] for c in body.chars],default=60);stats.append({'page':pno,'role':role,'characters':len(norm(t)),'textHeight':height})
   if pno>5:
    full=page.extract_text() or '';assert f'{pno} / {f["pages"]}' in full
    bad=[w for w in page.extract_words() if w['x0']<34 or w['x1']>page.width-34 or w['top']<17 or w['bottom']>page.height-20]
    if bad:bounds.append({'page':pno,'words':bad})
  cursor=0;missing=[];text=''.join(norm(x) for x in texts[8:])
  for packet in j(D/'SECTION-PACKETS.json')['packets']:
   for p in packet['paragraphs']:
    if fmt!='bilingual' and p['language']!=fmt:continue
    x=norm(p['text']);pos=text.find(x,cursor)
    if pos<0:missing.append(p['id'])
    else:cursor=pos+len(x)
  for i,row in enumerate(contract['section_titles']):
   yy=675-i*31;num=doc.pages[5].within_bbox((W:=500,841.8898-yy-15,550,841.8898-yy+10)).extract_text() or '';assert str(layout['chapters'][str(i+1)]) in num,(fmt,i+1,num)
 clean='\n'.join(texts);forbidden=re.findall(r'DreamRave|Book of Destinies|JSON Pointer|SHA256|NEW_OWNER_REVIEW_DRAFT|historical test chart|test configuration|历史测试|测试配置|Cognition claims excluded|No Tone-to-Cognition inference|Reading Identity and Priorities|阅读身份与重点',clean,re.I)
 assert not missing and not bounds and not forbidden,(fmt,missing,bounds,forbidden)
 assert layout['roles']['6']=='SEMIFIXED_TOC' and layout['roles']['7']=='DIAGRAM_bodygraph' and layout['roles']['8']=='DIAGRAM_activation';assert layout['chapters']['1']==9
 low=[s for s in stats if s['role']=='BODY' and s['textHeight']<140 and s['characters']<220]
 result={'format':fmt,'pages':f['pages'],'pdfSHA256':f['sha256'],'textIntegrity':'ALL_ACCEPTED_PARAGRAPHS_PRESENT_IN_ORDER','oldTwoNodesAbsent':True,'assetPixelProof':pixelRows,'frontContainFitNoStretchNoCrop':True,'frontActualPixelMatches':5,'postersActualPixelMatches':17,'BODYActualAfterFrontMatter':True,'tocRows':links,'boundsFailures':bounds,'forbiddenLeaks':forbidden,'lowDensityBodyPages':low,'pageStats':stats,'rasterPages':0,'status':'PASS_STRUCTURAL_VISUAL_REVIEW_PENDING'};rows.append(result);save('PDF-QA.json',{'results':rows});print(fmt,f['pages'],'structural PASS',flush=True)
 if '--skip-rasters' in sys.argv:continue
 raster=T/('pages-'+fmt);raster.mkdir(exist_ok=True);q=subprocess.run([pop,'-scale-to','850','-jpeg','-jpegopt','quality=74',f['path'],str(raster/'p')],capture_output=True,text=True);assert q.returncode==0,q.stderr;pages=sorted(raster.glob('p-*.jpg'),key=lambda p:int(p.stem.split('-')[-1]));assert len(pages)==f['pages'];result['rasterPages']=len(pages)
 for start in range(0,len(pages),12):
  contact=Image.new('RGB',(1600,1760),'#e8e5df');dr=ImageDraw.Draw(contact)
  for k,p in enumerate(pages[start:start+12]):
   with Image.open(p) as im:im.thumbnail((390,550));x=k%4*400;y=k//4*585;dr.text((x+6,y+3),f'{fmt} / {start+k+1}',fill='black');contact.paste(im,(x+5,y+23))
  contact.save(V/f'{fmt}-contact-{start//12+1:02}.jpg',quality=88)
 for pg in sorted(set(list(range(1,9))+[layout['chapters']['10']+1]+list(range(f['pages']-2,f['pages']+1)))):
  subprocess.run([pop,'-f',str(pg),'-l',str(pg),'-scale-to','1200','-singlefile','-png',f['path'],str(V/f'{fmt}-page-{pg:03}')],capture_output=True,check=True)
 save('PDF-QA.json',{'results':rows,'physicalPages':sum(r['pages'] for r in rows),'rasterPages':sum(r['rasterPages'] for r in rows),'humanAcceptance':'PENDING'})
