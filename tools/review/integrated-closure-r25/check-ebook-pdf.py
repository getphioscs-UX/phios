import pathlib,json,hashlib,subprocess
from pypdf import PdfReader
from PIL import Image
root=pathlib.Path.cwd();safe=root/'tools/review/integrated-closure-r25';private=root/'.tmp/integrated-closure-r25/private';r=json.loads((safe/'TRUSTED-METADATA-LOCAL-QA.json').read_text(encoding='utf8'));w=r['watermark'];source=root/'.tmp/seven-book-closure-20261025/private/revisions/book-3-en-r3-1792906545672.pdf';output=private/('R25-'+w['purchaseId']+'.pdf')
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
assert sha(source)==w['sourceSha256'];assert source.stat().st_size==75712797;assert sha(output)==w['sha256'];a=PdfReader(source);b=PdfReader(output);assert len(a.pages)==len(b.pages)==264;assert output.stat().st_size<source.stat().st_size*1.2
def outline(reader):
 def walk(nodes):
  result=[]
  for n in nodes:
   if isinstance(n,list):result.append(walk(n))
   else:result.append({'title':n.title,'page':reader.get_destination_page_number(n)})
  return result
 return walk(reader.outline)
assert outline(a)==outline(b),'OUTLINE_TITLE_ORDER_DESTINATION_DRIFT'
checks=[]
for i,(s,p) in enumerate(zip(a.pages,b.pages)):
 st=s.extract_text() or '';t=p.extract_text() or '';assert st.strip() in t,(i,'source text/order lost');assert w['purchaseId'] in t,(i,'purchase watermark missing');assert s.mediabox==p.mediabox;assert len(s.images)==len(p.images),(i,'image count changed');checks.append({'page':i+1,'sourceTextAndOrderPreserved':True,'watermarkPurchaseBound':True,'imageCountPreserved':True})
poppler='C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe'
for n in [1,132,264]:
 target=safe/('ebook-watermark-'+str(n));subprocess.run([poppler,'-f',str(n),'-l',str(n),'-singlefile','-scale-to','1400','-png',str(output),str(target)],check=True,capture_output=True)
 im=Image.open(str(target)+'.png');im.crop((0,int(im.height*.91),im.width,im.height)).save(str(target)+'-footer.png')
 # Keep book content private; expose only the synthetic watermark footer.
 (private/('ebook-page-'+str(n)+'.png')).write_bytes(pathlib.Path(str(target)+'.png').read_bytes());pathlib.Path(str(target)+'.png').unlink()
(safe/'EBOOK-PDF-INTEGRITY.json').write_text(json.dumps({'status':'REEXECUTED_PASS','sourceSHA256':w['sourceSha256'],'sourceBytes':source.stat().st_size,'outputSHA256':w['sha256'],'outputBytes':output.stat().st_size,'pages':264,'checks':checks,'sampleFooterPages':[1,132,264],'sourcePreserved':True,'remoteUploads':0,'providerCalls':0,'pdfParseable':True,'bookmarksBefore':len(a.outline),'bookmarksAfter':len(b.outline),'bookmarkPreservation':'PASS_FULL_HIERARCHY_TITLES_ORDER_AND_PAGE_DESTINATIONS'},indent=2),encoding='utf8');print('PASS 264 page/source text/image/identity checks; complete outline preserved')
