"""Read-only PDF/source forensics. All generated evidence stays beside this file."""
import csv,hashlib,json,time,subprocess,sys,io,collections,logging
from pathlib import Path
from pypdf import PdfReader
from pypdf.generic import IndirectObject,DictionaryObject,ArrayObject,ContentStream
from PIL import Image,JpegImagePlugin
logging.getLogger('pypdf').setLevel(logging.ERROR)
ROOT=Path(__file__).resolve().parent;REPO=ROOT.parents[2]
def sha(data):return hashlib.sha256(data).hexdigest()
def save(name,v): (ROOT/name).write_text(json.dumps(v,ensure_ascii=False,indent=2),encoding='utf-8')
def read(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
SPECS=[
 ('AST','AST-current-r21','output/pdf/report-visual-asset-convergence-r2/r21/ast-native-fixed-and-body.pdf','Current inspected R2 native/fixed local composition'),
 ('AST','AST-historical-r1r5','output/pdf/AST-VFR-R1R5-TL-BILINGUAL-PRINT-REVIEW.pdf','Historical bilingual publication; distinct from R2 composition'),
 ('BZR','BZR-controlled-p7','content/production-closure/live-customer-commercial-convergence/bazi-r2-p7/p7r3j-terminal-r1/BAZI-R2-P7-CUSTOMER.pdf','Controlled delivery evidence; no real-customer acceptance inferred'),
 ('BZR','BZR-fit-bilingual','docs/acceptance/bazi-paid-report/deep-manuscript-r2/fit-closure/BAZI-FULL-REPORT-BILINGUAL.pdf','Full bilingual fit-closure evidence'),
 ('BZR','BZR-r2-body-diagnostic','output/pdf/report-visual-asset-convergence-r2/r22/bazi-body-diagnostic-bilingual.pdf','Four-page transport diagnostic, NOT full BaZi report'),
 ('ZWR','ZWR-current-r22','output/pdf/report-visual-asset-convergence-r2/r22/ziwei-native-fixed-and-body.pdf','Current inspected R2 native/fixed local composition'),
 ('NUM','NUM-current-bilingual','output/pdf/numerology-r30-acceptance/bilingual/PHI-OS-NUMEROLOGY-R30-bilingual.pdf','R3.0 full19 local acceptance; SYNTHETIC'),
 ('NUM','NUM-current-en','output/pdf/numerology-r30-acceptance/en/PHI-OS-NUMEROLOGY-R30-en.pdf','Same frozen subject, English'),
 ('NUM','NUM-current-zh','output/pdf/numerology-r30-acceptance/zh-Hans/PHI-OS-NUMEROLOGY-R30-zh-Hans.pdf','Same frozen subject, Chinese'),
 ('HD','HD-current-bilingual','output/pdf/hd-r611-owner-review/HD-R611-PREMIUM-OWNER-bilingual-FINAL.pdf','R6.11 owner candidate; no automatic Human ACCEPT'),
 ('HD','HD-current-en','output/pdf/hd-r611-owner-review/HD-R611-PREMIUM-OWNER-en-FINAL.pdf','R6.11 English owner candidate'),
 ('HD','HD-current-zh','output/pdf/hd-r611-owner-review/HD-R611-PREMIUM-OWNER-zh-Hans-FINAL.pdf','R6.11 Chinese owner candidate'),
 ('ECR','ECR-current-author','output/pdf/ecr-r31-author-led/SYNTHETIC-BILINGUAL-RENDERER-QA.pdf','PHI Configuration author publication QA; not whole historical body'),
 ('ECR','ECR-historical-full','tools/review/phi-configuration-deep-reading-r2-integrated/review-bilingual.pdf','Full integrated bilingual historical review'),
 ('ECR','ECR-r2-fixed','output/pdf/report-visual-asset-convergence-r2/r21/ecr-fixed-only.pdf','R2 fixed art only; NOT a full personalized report')]
PRIMARY=['AST-current-r21','BZR-controlled-p7','ZWR-current-r22','NUM-current-bilingual','HD-current-bilingual','ECR-current-author']
def objkey(ref):return f'{ref.idnum}:{ref.generation}'if isinstance(ref,IndirectObject)else 'direct:'+str(id(ref))
def all_objects(reader):
 ids={(i,g)for g,rows in reader.xref.items()for i in rows if i>0};ids.update((i,0)for i in reader.xref_objStm)
 for i,g in sorted(ids):
  try:
   obj=reader.get_object(IndirectObject(i,g,reader))
   if obj is not None:yield f'{i}:{g}',obj
  except Exception:pass
def reachable(reader):
 found=set();seen=set()
 def walk(x):
  if isinstance(x,IndirectObject):
   k=objkey(x)
   if k in found:return
   found.add(k)
   try:walk(x.get_object())
   except Exception:pass
  elif isinstance(x,(dict,list,tuple)):
   if id(x)in seen:return
   seen.add(id(x))
   for v in(x.values()if isinstance(x,dict)else x):walk(v)
 walk(reader.trailer.get('/Root'));walk(reader.trailer.get('/Info'));return found
def mul(a,b):return(a[0]*b[0]+a[1]*b[2],a[0]*b[1]+a[1]*b[3],a[2]*b[0]+a[3]*b[2],a[2]*b[1]+a[3]*b[3],a[4]*b[0]+a[5]*b[2]+b[4],a[4]*b[1]+a[5]*b[3]+b[5])
def draws(reader,page):
 out=[];vectors=0
 def walk(contents,res,ctm=(1,0,0,1,0,0),stackpath=()):
  nonlocal vectors
  if contents is None:return
  try:ops=ContentStream(contents,reader).operations
  except Exception:return
  stack=[]
  for args,op in ops:
   if op==b'q':stack.append(ctm)
   elif op==b'Q':ctm=stack.pop()if stack else ctm
   elif op==b'cm':ctm=mul(tuple(float(n)for n in args),ctm)
   elif op in[b'm',b'l',b'c',b're',b'v',b'y']:vectors+=1
   elif op==b'Do':
    try:
     ref=res['/XObject'].raw_get(args[0]);o=ref.get_object();k=objkey(ref)
     if o.get('/Subtype')=='/Image':
      area=abs(ctm[0]*ctm[3]-ctm[1]*ctm[2]);out.append({'object':k,'coverage':round(area/(float(page.mediabox.width)*float(page.mediabox.height)),5)})
     elif o.get('/Subtype')=='/Form'and k not in stackpath:
      walk(o,o.get('/Resources',res),mul(tuple(float(v)for v in o.get('/Matrix',[1,0,0,1,0,0])),ctm),stackpath+(k,))
    except Exception:pass
 walk(page.get('/Contents'),page.get('/Resources',{}));return out,vectors
def content_hash(page):
 c=page.get_contents();return sha(c.get_data()if c else b'')
def inspect_pdf(path,label,method,scope):
 started=time.perf_counter();path=Path(path);raw=path.read_bytes();r=PdfReader(io.BytesIO(raw));images=[];fonts=[];fontnames=set();live=reachable(r)
 for k,o in all_objects(r):
  if not isinstance(o,dict):continue
  if o.get('/Subtype')=='/Image':
   b=getattr(o,'_data',b'');row={'object':k,'encodedBytes':len(b),'sha256':sha(b),'width':int(o.get('/Width',0)),'height':int(o.get('/Height',0)),'bits':int(o.get('/BitsPerComponent',0)),'filter':str(o.get('/Filter','NONE')),'colorSpace':str(o.get('/ColorSpace','')),'softMask':bool(o.get('/SMask')),'imageMask':bool(o.get('/ImageMask')),'reachable':k in live}
   if '/DCTDecode'in row['filter']:
    try:
     im=Image.open(io.BytesIO(o.get_data()));row.update(jpegSampling=JpegImagePlugin.get_sampling(im),jpegQuantizationSHA256=sha(json.dumps(im.quantization,sort_keys=True).encode()))
    except Exception:pass
   images.append(row)
  if o.get('/Type')=='/Font':fontnames.add(str(o.get('/BaseFont','')))
  if o.get('/Type')=='/FontDescriptor':
   for n in['/FontFile','/FontFile2','/FontFile3']:
    if n in o:
     ref=o.raw_get(n);s=ref.get_object();data=getattr(s,'_data',b'');fonts.append({'object':objkey(ref),'bytes':len(data),'sha256':sha(data),'kind':n})
 unique_fonts=list({x['object']:x for x in fonts}.values());pages=[];use=collections.Counter();page_use=collections.defaultdict(set);maxcov=collections.defaultdict(float)
 for n,p in enumerate(r.pages,1):
  ds,vec=draws(r,p)
  for d in ds:use[d['object']]+=1;page_use[d['object']].add(n);maxcov[d['object']]=max(maxcov[d['object']],d['coverage'])
  try:text=p.extract_text()or'';text_error=None
  except Exception as e:text='';text_error=type(e).__name__
  pages.append({'page':n,'mediaBox':[float(v)for v in p.mediabox],'cropBox':[float(v)for v in p.cropbox],'rotate':int(p.get('/Rotate',0)),'textChars':len(text),'textSHA256':sha(text.encode()),'contentSHA256':content_hash(p),'vectorPathOperators':vec,'imageDraws':len(ds),'imageObjects':sorted(set(x['object']for x in ds)),'textError':text_error})
 for row in images:row.update(drawReferences=use[row['object']],pages=sorted(page_use[row['object']]),maxPageCoverage=maxcov[row['object']]);row['backgroundCandidate']=row['maxPageCoverage']>=.65 and row['width']>=800 and row['height']>=800 and not row['softMask']and not row['imageMask']
 groups=collections.defaultdict(list)
 for x in images:groups[(x['sha256'],x['width'],x['height'],x['filter'],x['colorSpace'],x['bits'])].append(x)
 duplicate=[{'objects':[x['object']for x in v],'encodedBytesEach':v[0]['encodedBytes'],'redundantEncodedBytes':sum(x['encodedBytes']for x in v[1:]),'pages':sorted(set(n for x in v for n in x['pages'])),'sha256':v[0]['sha256']}for v in groups.values()if len(v)>1]
 md={str(k):str(v)for k,v in(r.metadata or{}).items()};fontset=sorted({x['sha256']for x in unique_fonts});full={'id':label,'method':method,'path':str(path).replace('\\','/'),'scope':scope,'fileBytes':len(raw),'sha256':sha(raw),'mtimeNs':path.stat().st_mtime_ns,'pageCount':len(pages),'producer':md.get('/Producer'),'metadata':md,'imageObjectCount':len(images),'uniqueEncodedImagePayloads':len(groups),'totalEncodedImageBytes':sum(x['encodedBytes']for x in images),'imageShareOfFile':round(sum(x['encodedBytes']for x in images)/len(raw),6),'imageDrawReferences':sum(use.values()),'reusedImageObjects':sum(x['drawReferences']>1 for x in images),'reusedImageReferenceCount':sum(max(0,x['drawReferences']-1)for x in images),'duplicateImageGroups':duplicate,'duplicateImageEncodedBytes':sum(x['redundantEncodedBytes']for x in duplicate),'unreachableImageBytes':sum(x['encodedBytes']for x in images if not x['reachable']),'fontStreamBytes':sum(x['bytes']for x in unique_fonts),'fontStreamCount':len(unique_fonts),'uniqueFontPayloadSHA256':fontset,'fontNames':sorted(fontnames),'pagesWithExtractableText':sum(p['textChars']>0 for p in pages),'textChars':sum(p['textChars']for p in pages),'fontStreams':unique_fonts,'images':images,'pages':pages,'inspectionWallSeconds':round(time.perf_counter()-started,3),'primary':label in PRIMARY}
 return full
def main():
 ROOT.mkdir(parents=True,exist_ok=True);registry=Path('content/reports/shared/report-visual-assets-r2.json');baseline={'workId':'PHIOS-REPORT-STORAGE-OPTIMIZATION-R1','at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'head':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'worktreeStatus':subprocess.check_output(['git','status','--short'],text=True),'worktrees':subprocess.check_output(['git','worktree','list','--porcelain'],text=True),'registryPath':str(registry),'registrySHA256':sha(registry.read_bytes()),'attachmentIsContextNotScope':True,'writeBoundary':str(ROOT),'sourceWrites':0};save('BASELINE.json',baseline)
 reports=[]
 for method,label,path,scope in SPECS:
  if not Path(path).exists():reports.append({'id':label,'method':method,'path':path,'status':'FILE_NOT_FOUND'});continue
  row=inspect_pdf(path,label,method,scope);reports.append(row);save('forensics/'+label+'.json',row);print(json.dumps({ 'id':label,'bytes':row['fileBytes'],'pages':row['pageCount'],'images':row['imageObjectCount'],'imageBytes':row['totalEncodedImageBytes'],'duplicates':row['duplicateImageEncodedBytes'],'textPages':row['pagesWithExtractableText']}),flush=True)
  save('SIZE-AUDIT.json',{'workId':baseline['workId'],'coverage':'15 explicitly identified actual PDFs across six report families; not an inventory of every historical PDF or production bucket','reports':reports,'registrySHA256':baseline['registrySHA256'],'providerCalls':0})
 with(ROOT/'IMAGE-OBJECT-ANALYSIS.csv').open('w',encoding='utf-8-sig',newline='')as f:
  fields=['reportId','method','object','encodedBytes','sha256','width','height','bits','filter','colorSpace','softMask','reachable','drawReferences','pages','maxPageCoverage','backgroundCandidate','jpegSampling'];w=csv.DictWriter(f,fields,extrasaction='ignore');w.writeheader()
  for r in reports:
   for im in r.get('images',[]):w.writerow({'reportId':r['id'],'method':r['method'],**im})
if __name__=='__main__':
 (ROOT/'forensics').mkdir(parents=True,exist_ok=True);main()
