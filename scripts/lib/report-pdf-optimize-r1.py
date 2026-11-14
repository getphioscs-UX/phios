"""Reuse frozen Report Storage Optimization R1, no new PDF compression engine."""
import sys,pathlib,json,hashlib,io,importlib.util
from PIL import Image
from pypdf import PdfReader
sha=lambda b:hashlib.sha256(b).hexdigest()
def j(p):return json.loads(pathlib.Path(p).read_text(encoding='utf-8-sig'))
def outlines(r):
 def walk(rows):
  out=[]
  for x in rows:
   if isinstance(x,list):out.append(walk(x))
   else:out.append({'title':x.title,'page':r.get_destination_page_number(x),'type':str(x.typ)})
  return out
 return walk(r.outline)
def links(r):
 out=[]
 for i,p in enumerate(r.pages):
  for a in p.get('/Annots',[]):
   a=a.get_object()
   if a.get('/Subtype')!='/Link':continue
   dest=a.get('/Dest');target=None
   if isinstance(dest,list):
    for n,page in enumerate(r.pages):
     if page.indirect_reference==dest[0]:target=n;break
    target=[target]+[str(x) for x in dest[1:]]
   else:target=str(dest)
   out.append({'page':i,'rect':[str(x) for x in a.get('/Rect',[])],'dest':target,'action':str(a.get('/A',{}))})
 return out
def choose_final_payload(original, candidate):
 # Never make an already compact JPEG PDF larger merely to add metadata.
 return (candidate, 'SMALLER_VERIFIED_RENDITION') if len(candidate)<len(original) else (original, 'UNCHANGED_SOURCE_ALREADY_COMPACT_OR_NO_ELIGIBLE_IMAGE')
def main():
 cfg=j(sys.argv[1]);legacy=pathlib.Path(cfg['legacyRoot'])
 expected={'optimize.py':'de675bb6de69a1a917e9db6f798ad6b85598f253ace5ff1fb04981ce40fb2367','audit.py':'d666f70d059c3788cd2517285349ef139dd3cf62a4b28fa07da5d03946c1e15c'}
 for f,h in expected.items():assert sha((legacy/f).read_bytes())==h,'LEGACY_OPTIMIZER_SOURCE_DRIFT'
 sys.path.insert(0,str(legacy));import audit,optimize
 source=pathlib.Path(cfg['source']);target=pathlib.Path(cfg['target']);assert source.resolve()!=target.resolve() and not target.exists(),'NEW_TARGET_REQUIRED'
 policy=cfg['policy'];method=cfg['binding']['methodCode'];q=policy['quality'];assert q==87 or (q==83 and method=='ECR'),'PROFILE_NOT_VERIFIED'
 report=audit.inspect_pdf(source,'CURRENT-AUTHORIZED-QA',method,'New derivative only; frozen original retained')
 assert report['sha256']==cfg['inputSHA256'],'SOURCE_IDENTITY_CHANGED'
 reader=PdfReader(source);assert not reader.is_encrypted,'ENCRYPTED_PDF_REQUIRES_SEPARATE_AUTHORITY'
 allowed={}
 for a in policy['assets']:
  file=pathlib.Path(a['path']);assert sha(file.read_bytes())==a['sha256'],'ASSET_IDENTITY_CHANGED'
  assert a['role'] in ['EDITORIAL_FULL_PAGE','BODY_BACKGROUND','CALCULATION_DIAGRAM','TRANSPARENT_OR_LINE_ART']
  if a['role'] not in ['EDITORIAL_FULL_PAGE','BODY_BACKGROUND']:continue
  im=Image.open(file)
  if 'A' in im.getbands() and im.getchannel('A').getextrema()!=(255,255):continue
  rgb=im.convert('RGB');allowed[(rgb.size,sha(rgb.tobytes()))]=a
 protected=[];selected=[]
 for row in report['images']:
  obj=reader.get_object(audit.IndirectObject(*map(int,row['object'].split(':')),reader));eligible=False
  if row['backgroundCandidate'] and row['reachable'] and '/DCTDecode' not in row['filter'] and not obj.get('/Mask'):
   try:
    im=optimize.decode_image(obj).convert('RGB');eligible=(im.size,sha(im.tobytes())) in allowed
   except Exception:pass
  row['backgroundCandidate']=eligible
  (selected if eligible else protected).append(row)
 result=optimize.optimize(report,q,output_path=target)
 new=PdfReader(target);result['checks']['bookmarksExact']=outlines(reader)==outlines(new);result['checks']['linksExact']=links(reader)==links(new)
 # Protect opaque calculation diagrams, alpha/masks, unknown imagery, existing JPEG.
 new_report=j(target.with_suffix('.DETAIL.json'));after={(x['sha256'],x['width'],x['height'],x['filter']) for x in new_report['images']}
 result['checks']['protectedImagesUnchanged']=all((x['sha256'],x['width'],x['height'],x['filter']) in after for x in protected if x['reachable'])
 assert all(result['checks'].values()),'OPTIMIZATION_PARITY_FAILED'
 final_payload,outcome=choose_final_payload(source.read_bytes(),target.read_bytes())
 if outcome.startswith('UNCHANGED'):
  target.write_bytes(final_payload);result['outputSHA256']=sha(final_payload);result['optimizedBytes']=len(final_payload);result['imageChanges']=[]
  original_detail={**report,'path':str(target),'sha256':sha(final_payload),'fileBytes':len(final_payload),'optimizationOutcome':outcome};target.with_suffix('.DETAIL.json').write_text(json.dumps(original_detail,ensure_ascii=False,indent=2),encoding='utf-8')
 receipt={'version':'REPORT-PDF-FINALIZATION-R1','methodCode':method,'bindingDigest':cfg['bindingDigest'],'inputSHA256':result['sourceSHA256'],'outputSHA256':result['outputSHA256'],'profile':result['policy'],'originalBytes':result['originalBytes'],'optimizedBytes':result['optimizedBytes'],'checks':result['checks'],'providerCalls':0,'commercialAdmissionGranted':False,'downsampled':False,'transparencyPreserved':True,'criticalCalculationImagesPreserved':True,'eligibleImageCount':len(selected),'protectedImageCount':len(protected),'imageChanges':result['imageChanges'],'legacySourceSHA256':expected,'assetPolicySHA256':sha(json.dumps(policy,sort_keys=True,separators=(',',':')).encode()),'visualApproval':'PENDING_OWNER_REVIEW_NOT_AUTOMATIC_ACCEPT','scope':'LOCAL_QA_NEW_DERIVATIVE_ONLY','outcome':outcome}
 pathlib.Path(cfg['receipt']).write_text(json.dumps(receipt,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'bytes':receipt['optimizedBytes'],'imageChanges':len(result['imageChanges'])}),flush=True)
if __name__=='__main__':main()
