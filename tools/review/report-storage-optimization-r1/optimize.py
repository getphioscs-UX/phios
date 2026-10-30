"""Isolated PDF image-rendition experiment, not a new renderer or source change."""
import io,json,time,hashlib,logging,sys
import pypdf.generic._base as pdf_numbers
pdf_numbers.FLOAT_WRITE_PRECISION=17
from pathlib import Path
from PIL import Image
from pypdf import PdfReader,PdfWriter
from pypdf.generic import NameObject,NumberObject,IndirectObject
from audit import ROOT,read,save,sha,inspect_pdf,all_objects,content_hash
logging.getLogger('pypdf').setLevel(logging.ERROR)
def decode_image(obj):
 data=obj.get_data();cs=obj.get('/ColorSpace');mode=None
 if '/DCTDecode'in str(obj.get('/Filter','')):return Image.open(io.BytesIO(data)).convert('RGB')
 if cs=='/DeviceRGB':mode='RGB'
 elif cs=='/DeviceGray':mode='L'
 elif isinstance(cs,list)and str(cs[0])=='/ICCBased':
  count=int(cs[1].get_object().get('/N',0));mode={1:'L',3:'RGB'}.get(count)
 if not mode:raise ValueError('Unsupported color space; leave original')
 if int(obj.get('/BitsPerComponent',0))!=8:raise ValueError('Non-eight-bit image; leave original')
 if obj.get('/Decode'):raise ValueError('Explicit sample decode; leave original')
 return Image.frombytes(mode,(int(obj['/Width']),int(obj['/Height'])),data)
def identity(reader):
 keys=['/PHIOSReportId','/PHIOSSourceReportReference','/PHIOSChartDigest','/PHIOSLanguage','/Title','/Author','/Creator','/Producer']
 return {k:str(reader.metadata[k])for k in keys if k in(reader.metadata or{})}
def optimize(report,quality):
 source=Path(report['path']);before=source.read_bytes();r=PdfReader(io.BytesIO(before));t=time.perf_counter();cpu=time.process_time();writer=PdfWriter(clone_from=r);changes=[];skips=[]
 if any('/ByteRange'in obj for _,obj in all_objects(r)if isinstance(obj,dict)):raise ValueError('Signed PDF requires separate review')
 if quality:
  for im in report['images']:
   if not im['backgroundCandidate']:continue
   ref=IndirectObject(*map(int,im['object'].split(':')),r);original=ref.get_object();translated=writer._id_translated.get(id(r),{}).get(ref.idnum)
   if translated is None:skips.append({'object':im['object'],'reason':'not in cloned reachable graph'});continue
   obj=writer.get_object(translated)
   try:
    pil=decode_image(original);out=io.BytesIO();pil.save(out,format='JPEG',quality=quality,subsampling=0,optimize=True);payload=out.getvalue()
    if len(payload)>=im['encodedBytes']:skips.append({'object':im['object'],'reason':'JPEG is not smaller'});continue
    obj._data=payload;obj[NameObject('/Filter')]=NameObject('/DCTDecode');obj[NameObject('/BitsPerComponent')]=NumberObject(8);obj.pop('/DecodeParms',None)
    if hasattr(obj,'decoded_self'):obj.decoded_self=None
    changes.append({'object':im['object'],'fromFilter':im['filter'],'toFilter':'/DCTDecode','beforeBytes':im['encodedBytes'],'afterBytes':len(payload),'width':im['width'],'height':im['height'],'ICCOrColorSpaceRetained':True,'quality':quality,'sampling':'4:4:4','downsampled':False})
   except Exception as e:skips.append({'object':im['object'],'reason':str(e)})
 writer.compress_identical_objects(remove_duplicates=True,remove_unreferenced=True)
 policy='LOSSLESS_DEDUP_ONLY'if not quality else f'BACKGROUND_JPEG_Q{quality}_444_NO_RESIZE'
 writer.add_metadata({'/PHIOSOptimizationSourceSHA256':report['sha256'],'/PHIOSOptimizationWorkId':'PHIOS-REPORT-STORAGE-OPTIMIZATION-R1','/PHIOSOptimizationPolicy':policy,'/PHIOSOptimizationAdmission':'LOCAL_PROOF_NOT_HUMAN_ACCEPTED'})
 target=ROOT/'proofs'/report['method']/(report['id']+('-lossless'if not quality else f'-q{quality}')+'.pdf');target.parent.mkdir(parents=True,exist_ok=True)
 with target.open('wb')as f:writer.write(f)
 wall=time.perf_counter()-t;cpu_used=time.process_time()-cpu;new=inspect_pdf(target,report['id']+'-'+str(quality),report['method'],'Isolated rendition proof; original report remains authoritative')
 old_pages=report['pages'];pages=new['pages'];checks={'pageCount':len(pages)==len(old_pages),'pageBoundaries':all([a['mediaBox'],a['cropBox'],a['rotate']]==[b['mediaBox'],b['cropBox'],b['rotate']]for a,b in zip(old_pages,pages)),'dynamicContentStreamsExact':all(a['contentSHA256']==b['contentSHA256']for a,b in zip(old_pages,pages)),'extractedTextExactPerPage':all(a['textSHA256']==b['textSHA256']for a,b in zip(old_pages,pages)),'fontPayloadSetUnchanged':new['uniqueFontPayloadSHA256']==report['uniqueFontPayloadSHA256'],'fontNamesUnchanged':new['fontNames']==report['fontNames'],'originalIdentityMetadataRetained':identity(PdfReader(target))==identity(r),'originalUnmodified':sha(source.read_bytes())==report['sha256']}
 row={'reportId':report['id'],'method':report['method'],'quality':quality,'policy':policy,'source':report['path'],'sourceSHA256':report['sha256'],'output':str(target.relative_to(Path.cwd())).replace('\\','/'),'outputSHA256':new['sha256'],'originalBytes':report['fileBytes'],'optimizedBytes':new['fileBytes'],'savedBytes':report['fileBytes']-new['fileBytes'],'reductionPercent':round(100*(1-new['fileBytes']/report['fileBytes']),3),'pageCount':new['pageCount'],'encoderWallSeconds':round(wall,4),'encoderCpuSeconds':round(cpu_used,4),'verificationWallSeconds':new['inspectionWallSeconds'],'imageChanges':changes,'skippedImages':skips,'checks':checks,'passStructural':all(checks.values()),'visualApproval':'PENDING_ACTUAL_RENDER_AND_HUMAN_REVIEW','newManuscriptGenerated':False,'humanAccepted':False,'providerCalls':0}
 save('proofs/'+report['method']+'/'+target.stem+'-DETAIL.json',new);return row
def main():
 audit=read(ROOT/'SIZE-AUDIT.json');only=next((a.split('=',1)[1]for a in sys.argv if a.startswith('--only=')),None);rows=read(ROOT/'OPTIMIZATION-RESULTS.json')['rows']if only else[]
 if only:rows=[r for r in rows if r['reportId']!=only]
 for report in audit['reports']:
  if not report.get('primary')or(only and report['id']!=only):continue
  for q in[None,76,82,87]:
   row=optimize(report,q);rows.append(row);save('OPTIMIZATION-RESULTS.json',{'rows':rows,'scope':'JPEG only on opaque large full-page candidates; no resize, no text/diagram rasterization, ICC retained; original PDFs/assets untouched','paidProviderCalls':0});print(json.dumps({'id':row['reportId'],'q':q,'bytes':row['optimizedBytes'],'savedPct':row['reductionPercent'],'checks':row['checks']}),flush=True)
 if not all(r['passStructural']for r in rows):raise SystemExit('STRUCTURAL_VERIFICATION_FAILED')
if __name__=='__main__':main()
