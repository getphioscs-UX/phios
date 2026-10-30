import pathlib,json,hashlib,subprocess,datetime,sys,io
from PIL import Image
from pypdf import PdfReader
from pypdf.generic import ContentStream
sys.path.insert(0,str(pathlib.Path('scripts/lib').resolve()));from disk_space_guard import require_disk_space
require_disk_space('Targeted background image forensics',100_000_000)
D=pathlib.Path(__file__).parent;R=D.parent
sys.path.insert(0,str(R.resolve()));from audit import mul
j=lambda p:json.loads(pathlib.Path(p).read_text(encoding='utf-8-sig'));sha=lambda b:hashlib.sha256(b).hexdigest();save=lambda n,x:(D/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
if not (D/'BASELINE.json').exists():
 dirty=subprocess.check_output(['git','diff','--name-only','-z']).split(b'\0');save('BASELINE.json',{'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'HEAD':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'branch':subprocess.check_output(['git','branch','--show-current'],text=True).strip(),'status':subprocess.check_output(['git','status','--short'],text=True),'worktrees':subprocess.check_output(['git','worktree','list','--porcelain'],text=True),'branches':subprocess.check_output(['git','branch','-a','-vv'],text=True),'dirtyFiles':[{'path':p.decode(),'sha256':sha(pathlib.Path(p.decode()).read_bytes()) if pathlib.Path(p.decode()).is_file() else None} for p in dirty if p],'index':subprocess.check_output(['git','diff','--cached','--name-only'],text=True)})
methods={'AST':('AST-current-r21',[6,14,26,31,36,41,46,51,56,60]),'ZWR':('ZWR-current-r22',[19,33,39,46,51,57]),'HD':('HD-current-bilingual',[1])};records=[];reports=[]
manifest=j('content/reports/shared/report-visual-assets-r2.json');hd=j('tools/review/hd-r6/import-20261027/r611/FRONT-MATTER-BINDINGS.json')['rows']
def draws(reader,page):
 out=[]
 def walk(content,res,ctm=(1,0,0,1,0,0),seen=()):
  if content is None:return
  stack=[]
  for args,op in ContentStream(content,reader).operations:
   if op==b'q':stack.append(ctm)
   elif op==b'Q':ctm=stack.pop() if stack else ctm
   elif op==b'cm':ctm=mul(tuple(map(float,args)),ctm)
   elif op==b'Do':
    ref=res['/XObject'].raw_get(args[0]);obj=ref.get_object()
    if obj.get('/Subtype')=='/Image':
     pts=[(ctm[0]*x+ctm[2]*y+ctm[4],ctm[1]*x+ctm[3]*y+ctm[5]) for x,y in [(0,0),(1,0),(0,1),(1,1)]];box=[min(x for x,y in pts),min(y for x,y in pts),max(x for x,y in pts),max(y for x,y in pts)]
     out.append({'ref':ref,'object':f'{ref.idnum}:{ref.generation}','box':box,'matrix':ctm,'source_dimensions':[int(obj['/Width']),int(obj['/Height'])],'streamSHA256':sha(obj._data)})
    elif obj.get('/Subtype')=='/Form' and ref.idnum not in seen:walk(obj,obj.get('/Resources',res),mul(tuple(map(float,obj.get('/Matrix',[1,0,0,1,0,0]))),ctm),seen+(ref.idnum,))
 walk(page.get('/Contents'),page['/Resources']);return out
for method,(id,nums) in methods.items():
 source=R/'proofs'/method/(id+'-q87.pdf');pdf=PdfReader(source);original=j(R/'forensics'/f'{id}.json');report={'method':method,'id':id,'path':str(source).replace('\\','/'),'sha256':sha(source.read_bytes()),'bytes':source.stat().st_size,'pages':len(pdf.pages),'originalUnoptimizedPath':original['path'],'targetPages':nums};reports.append(report)
 orig=PdfReader(original['path'])
 for number in nums:
  page=pdf.pages[number-1];ds=draws(pdf,page);image=max(ds,key=lambda x:(x['box'][2]-x['box'][0])*(x['box'][3]-x['box'][1]));W,H=map(float,[page.mediabox.width,page.mediabox.height]);box=image['box'];dw,dh=image['source_dimensions'];obj=image['ref'].get_object();b=obj.get_data();im=Image.open(io.BytesIO(b)).convert('RGB');imageFile=D/f'{method}-{number:03}-original-placed-image.png';im.save(imageFile)
  # Bind original pre-Q87 image to authoritative registered WebP via actual decoded pixels.
  ods=draws(orig,orig.pages[number-1]);oi=max(ods,key=lambda x:(x['box'][2]-x['box'][0])*(x['box'][3]-x['box'][1]));o=oi['ref'].get_object();rgb=o.get_data();candidates=[a for a in manifest['assets'] if a.get('methodId')==method and a.get('width')==dw and a.get('height')==dh]
  match=[]
  cache=[]
  if method=='HD':cache=[(a,a.get('file')) for a in hd if a['language']=='bilingual' and a['pageId']=='P01']
  else:
   for f in ['tools/review/report-visual-asset-convergence-r2/owner-inventory-followup/PUBLIC-READS.json','tools/review/report-visual-asset-convergence-r2/recovery-r22/PUBLIC-READS.json']:
    if pathlib.Path(f).exists():
     rows=j(f).get('rows',[])
     for a in candidates:
      for rr in rows:
       if rr.get('key')==a['objectKey'] and rr.get('localPath'):cache.append((a,rr['localPath']))
  for a,f in cache:
   if not f or not pathlib.Path(f).exists():continue
   with Image.open(f) as raw:
    decoded=raw.convert('RGB');same=decoded.size==(dw,dh) and decoded.tobytes()==rgb
   if same:match.append((a,f))
  # JPEG source objects (if any) compare their actual decoded RGB instead.
  if not match and '/DCTDecode' in str(o.get('/Filter')):
   rgb=Image.open(io.BytesIO(rgb)).convert('RGB').tobytes()
   for a,f in cache:
    if f and pathlib.Path(f).exists():
     with Image.open(f) as rr:
      if rr.convert('RGB').tobytes()==rgb:match.append((a,f))
  unique={a.get('objectKey',a.get('object_key')):(a,f) for a,f in match};binding=next(iter(unique.values())) if len(unique)==1 else None
  a,f=binding if binding else ({},None)
  records.append({'method':method,'pdf_page':number,'section_id':a.get('pageId'),'actual_asset_id':a.get('assetId',a.get('registryAssetId',a.get('pageId'))),'r2_object_key_or_registered_path':a.get('objectKey',a.get('object_key')),'source_dimensions':[dw,dh],'page_dimensions':[W,H],'mediaBox':list(map(float,page.mediabox)),'cropBox':list(map(float,page.cropbox)),'image_rectangle':box,'top_gap_pt':max(0,H-box[3]),'bottom_gap_pt':max(0,box[1]),'left_gap_pt':max(0,box[0]),'right_gap_pt':max(0,W-box[2]),'sourceAspectRatio':dw/dh,'pageAspectRatio':W/H,'sourceFile':f,'sourceSHA256':sha(pathlib.Path(f).read_bytes()) if f else None,'sourcePixelMatchedExactlyBeforeQ87':bool(binding),'imageObject':image['object'],'imageQ87PayloadSHA256':image['streamSHA256'],'imagePreview':str(imageFile).replace('\\','/'),'textChars':len(page.extract_text() or ''),'root_cause':'PENDING_VISUAL_AND_OPERATOR_REVIEW','owning_renderer':{'AST':'functions/ast-full-production/ast-fixed-asset-r21-candidate.js (.r21-fixed-art object-fit:contain)','ZWR':'functions/canonical-presentation-runtime/report-editorial-resolver.js (FIXED_REPORT_PAGE_CSS contain through ZiWei native composer)','HD':'tools/review/hd-r6/import-20261027/r611/render.py (FrontMatter min-scale contain)'}[method],'proposed_fix':'FULL_BLEED_SAFE_EXTEND candidate; preserve existing main image rectangle and all content; extend only currently empty canvas from immutable source edges','candidateBindings':len(unique),'referenceObject':oi['object']})
save('BASELINE-REPORTS.json',{'reports':reports});save('FULL-BLEED-ROOT-CAUSE.json',{'records':records,'count':len(records),'requiresVisualConfirmation':True});print(json.dumps([{'m':r['method'],'p':r['pdf_page'],'gap':[round(r['top_gap_pt'],2),round(r['bottom_gap_pt'],2)],'size':r['source_dimensions'],'binding':r['section_id'],'matches':r['candidateBindings'],'text':r['textChars']} for r in records]))
