"""Bounded serial actual-PDF raster comparison. Never writes the shared lock."""
import io,json,time,subprocess,ctypes,math,hashlib
from ctypes import wintypes
from pathlib import Path
import numpy as np
from PIL import Image,ImageChops,ImageDraw
from audit import ROOT,read,save,sha
EXE='C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe'
def child_cpu(p):
 try:
  c,e,k,u=(wintypes.FILETIME()for _ in range(4));fn=ctypes.windll.kernel32.GetProcessTimes;fn.argtypes=[wintypes.HANDLE,*([ctypes.POINTER(wintypes.FILETIME)]*4)];fn.restype=wintypes.BOOL
  if not fn(int(p._handle),ctypes.byref(c),ctypes.byref(e),ctypes.byref(k),ctypes.byref(u)):return None
  n=lambda x:((x.dwHighDateTime<<32)+x.dwLowDateTime)/1e7
  return round(n(k)+n(u),5)
 except Exception:return None
def render(pdf,page,target):
 # User restricts writes to ROOT. Respect foreign reservations read-only and use
 # only a single bounded page renderer, never remove or write the global lock.
 waited=0
 while Path('.tmp/large-report-render.lock').exists():
  if waited==0:print('Waiting for existing large raster owner; no global lock changed.',flush=True)
  time.sleep(5);waited+=5
  if waited>3600:raise RuntimeError('SHARED_RASTER_WAIT_TIMEOUT')
 start=time.perf_counter();p=subprocess.Popen([EXE,'-f',str(page),'-l',str(page),'-singlefile','-scale-to','1200','-png',str(pdf),str(target.with_suffix(''))],stdout=subprocess.PIPE,stderr=subprocess.PIPE);_,err=p.communicate();cpu=child_cpu(p)
 if p.returncode:raise RuntimeError(err.decode(errors='replace')[:500])
 return{'wallSeconds':round(time.perf_counter()-start,4),'childCpuSeconds':cpu,'waitedSeconds':waited,'scaleTo':1200,'pdfSHA256':sha(Path(pdf).read_bytes()),'pngSHA256':sha(target.read_bytes())}
def metric(a,b):
 a=np.asarray(a,dtype=np.float64);b=np.asarray(b,dtype=np.float64);d=np.abs(a-b);mse=float(np.mean((a-b)**2));gray=lambda x:x[:,:,0]*.299+x[:,:,1]*.587+x[:,:,2]*.114
 aa,bb=gray(a),gray(b);h,w=aa.shape;h-=h%8;w-=w%8;x=aa[:h,:w].reshape(h//8,8,w//8,8).transpose(0,2,1,3).reshape(-1,64);y=bb[:h,:w].reshape(h//8,8,w//8,8).transpose(0,2,1,3).reshape(-1,64);mx=x.mean(1);my=y.mean(1);vx=x.var(1);vy=y.var(1);cv=((x-mx[:,None])*(y-my[:,None])).mean(1);ssim=((2*mx*my+6.5025)*(2*cv+58.5225))/((mx**2+my**2+6.5025)*(vx+vy+58.5225))
 return{'maeRGB':round(float(d.mean()),5),'psnrRGBdB':round(10*math.log10(255**2/mse),4)if mse else'INFINITE_PIXEL_IDENTICAL','changedPixelFraction':round(float(np.any(d>0,axis=2).mean()),6),'maximumChannelDifference':int(d.max()),'ssim8x8LuminanceMean':round(float(ssim.mean()),6),'ssim8x8LuminanceP01':round(float(np.quantile(ssim,.01)),6),'pixelIdentical':not bool(d.any())}
def main():
 reports=read(ROOT/'SIZE-AUDIT.json')['reports'];opts=read(ROOT/'OPTIMIZATION-RESULTS.json')['rows'];rows=[];selection=[]
 for r in reports:
  if not r.get('primary'):continue
  p=r['pages'];diagram=max(p,key=lambda x:(x['vectorPathOperators'],x['textChars']))['page'];reading=max((x for x in p if x['page']not in[1,diagram]),key=lambda x:x['textChars'])['page'];pages=list(dict.fromkeys([1,diagram,reading]));selection.append({'reportId':r['id'],'method':r['method'],'pages':pages,'diagramPage':diagram,'readingPage':reading,'selectionRule':'first artwork page + highest vector-path page + highest selectable-text page; bounded visual sampling, not exhaustive bitmap readability certification'})
  folder=ROOT/'visual'/r['method'];folder.mkdir(parents=True,exist_ok=True)
  for page in pages:
   original=folder/f'p{page:03}-original.png';info=render(r['path'],page,original);a=Image.open(original).convert('RGB')
   for q in[None,76,82,87]:
    if q is None and page!=diagram:continue
    opt=next(x for x in opts if x['reportId']==r['id']and x['quality']==q);suffix='lossless'if q is None else'q'+str(q);target=folder/f'p{page:03}-{suffix}.png';after=render(opt['output'],page,target);b=Image.open(target).convert('RGB');stats=metric(a,b);row={'reportId':r['id'],'method':r['method'],'page':page,'quality':q,'sourceRender':info,'optimizedRender':after,'metrics':stats,'originalImage':str(original.relative_to(ROOT)),'optimizedImage':str(target.relative_to(ROOT)),'diagramPage':page==diagram};rows.append(row)
    if q==87:
     diff=ImageChops.difference(a,b);amp=diff.point(lambda v:min(v*8,255));amp.save(folder/f'p{page:03}-diff-x8.png');w,h=a.size;box=(int(w*.12),int(h*.30),int(w*.88),int(h*.63));aa=a.crop(box);bb=b.crop(box);crop=Image.new('RGB',(aa.width*2,aa.height+25),'white');crop.paste(aa,(0,25));crop.paste(bb,(aa.width,25));dr=ImageDraw.Draw(crop);dr.text((5,5),'ORIGINAL',fill='black');dr.text((aa.width+5,5),'Q87 / LOCAL CANDIDATE',fill='black');crop.save(folder/f'p{page:03}-detail.png')
    if q is None and not stats['pixelIdentical']:raise AssertionError('LOSSLESS_COPY_PIXEL_DIFFERENCE:'+r['id'])
   save('VISUAL-COMPARISON.json',{'rows':rows,'selection':selection,'metricDefinition':'RGB MAE/PSNR; non-overlapping 8x8 luminance SSIM (not skimage Gaussian SSIM). No metric is automatic Human ACCEPT.','writeBoundary':'All images and optimized PDFs under this isolated directory; shared global lock checked read-only','fullPageTextAndVectorParity':'See per-page all-report structural verification, separate from bounded visual sampling'});print(json.dumps({'id':r['id'],'page':page,'sampledPagesSoFar':len(rows)}),flush=True)
if __name__=='__main__':main()
