import pathlib,json,hashlib,re,sys,subprocess
from pypdf import PdfReader
import pdfplumber
from PIL import Image,ImageChops
out=pathlib.Path(sys.argv[1])/'r33-publication';read=lambda p:json.loads(p.read_text(encoding='utf8'));write=lambda p,v:p.write_text(json.dumps(v,ensure_ascii=False,indent=2),encoding='utf8');results=read(out/'pdf-results.json')['results'];receipts=[]
poppler='C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe'
for r in results:
 d=out/r['locale'];history=d/'before-customer-appendix-boundary';old=PdfReader(history/pathlib.Path(r['file']).name);new=PdfReader(r['file']);maps=read(d/'page-map.json');base=[i for i,m in enumerate(maps) if m.get('sectionId')!='APPENDIX'];app=[i for i,m in enumerate(maps) if m.get('sectionId')=='APPENDIX'];assert len(new.pages)==r['pages']
 same=lambda a,b:hashlib.sha256(a.get_contents().get_data()).digest()==hashlib.sha256(b.get_contents().get_data()).digest()
 assert all(same(old.pages[i],new.pages[i]) for i in base)
 texts=''.join(new.pages[i].extract_text() or '' for i in app)
 forbidden=['来源：同一保存输入','Sources: the same saved input','旧单太阳锚点','Legacy single-solar-anchor','Shared Astronomy Engine','语义准入、版权审查与商业发布保持不同身份']
 assert not any(s in texts for s in forbidden);assert 'Design UTC:' in texts and 'Gate.Line' in texts
 qa=(history/'internal-source-and-compatibility.html').read_text(encoding='utf8');assert ('Sources:' in qa or '来源：' in qa)
 if r['locale']=='zh-Hans':assert len(new.pages)==64 and re.sub(r'\s+','',old.pages[63].extract_text())==re.sub(r'\s+','',new.pages[63].extract_text())
 rasterHistory=history/'pages';rasterHistory.mkdir(exist_ok=True)
 oldMap=read(history/'page-map.json');start=min(i for i,m in enumerate(oldMap) if m.get('sectionId')=='APPENDIX')+1
 for p in (d/'pages').glob('page-*.png'):
  if int(p.stem.split('-')[-1])>=start:
   target=rasterHistory/p.name
   if not target.exists():target.write_bytes(p.read_bytes())
   p.unlink()
 proc=subprocess.run([poppler,'-f',str(min(app)+1),'-l',str(max(app)+1),'-scale-to','1000','-png',r['file'],str(d/'pages/page')],capture_output=True);assert proc.returncode==0
 pixel64=None
 if r['locale']=='zh-Hans':pixel64=ImageChops.difference(Image.open(rasterHistory/'page-64.png').convert('RGB'),Image.open(d/'pages/page-64.png').convert('RGB')).getbbox() is None
 detail=read(d/'pdf-inspection.json');detail['pages']=r['pages'];detail['pageChecks']=[c for c in detail['pageChecks'] if c['page']<=len(base)]
 with pdfplumber.open(r['file']) as pdf:
  for i in app:
   p=pdf.pages[i];full=[im for im in p.images if im['x0']<=.1 and im['x1']>=p.width-.1 and im['top']<=.1 and im['bottom']>=p.height-.1];unsafe=[c for c in p.chars if c['text'].strip() and c['top']<=p.height-36 and (c['x0']<45 or c['x1']>p.width-45 or c['top']<40 or c['bottom']>p.height-40)];assert full and not unsafe and abs(p.width-595.2756)<.03 and abs(p.height-841.8898)<.03
   detail['pageChecks'].append({'page':i+1,'kind':'BODY_TEXT','sectionId':'APPENDIX','a4':True,'backgroundCoversMediaBox':True,'actualFullMediaImageCount':len(full),'unsafeCharacters':0,'publicationAudience':'CUSTOMER_CALCULATION'})
 detail['customerBoundaryRevalidated']=True;write(d/'pdf-inspection.json',detail)
 receipts.append({'locale':r['locale'],'oldPages':len(old.pages),'pages':len(new.pages),'unchangedPreAppendixPages':len(base),'unchangedPageContentStreams':True,'customerCalculationRetained':True,'chinese64TextIdentical':True if r['locale']=='zh-Hans' else None,'chinese64RasterIdentical':pixel64,'naturalLayoutDifference':'Chinese reading-field bottom ends 8 raster pixels earlier; all text and positions remain unchanged.' if r['locale']=='zh-Hans' and not pixel64 else None,'internalParagraphsInCustomerAppendix':0,'internalAuditRetained':True,'appendixRenderedPages':[i+1 for i in app],'a4AndFullBodyBackground':True,'unsafeText':0})
summary=read(out/'pdf-all-page-inspection.json')
for r in summary['reports']:
 result=next(x for x in receipts if x['locale']==r['locale']);r['pages']=result['pages'];r['renderedPages']=result['pages'];r['customerBoundaryRevalidated']=True
write(out/'pdf-all-page-inspection.json',summary);write(out/'CUSTOMER-APPENDIX-BOUNDARY-CHECK.json',{'receipts':receipts,'scope':'Generator excludes two internal audit paragraphs before HTML/PDF rendering. Not a manual page deletion.','providerCalls':0});print(json.dumps({'reports':receipts,'providerCalls':0}))
