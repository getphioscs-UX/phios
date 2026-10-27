import pathlib,json,sys,subprocess,concurrent.futures
import pdfplumber
from pypdf import PdfReader
root=pathlib.Path(sys.argv[1]);out=root/'r33-publication';results=json.loads((out/'pdf-results.json').read_text(encoding='utf8'))['results']
poppler=pathlib.Path('C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe')
def inspect(result):
 locale=result['locale'];directory=out/locale;maps=json.loads((directory/'page-map.json').read_text());reader=PdfReader(result['file']);font_checks={};visited=set()
 def resources(r):
  if not r:return
  r=r.get_object()
  for name,ref in r.get('/Font',{}).items():
   key=(getattr(ref,'idnum',None),str(name))
   if key in visited:continue
   visited.add(key);font=ref.get_object();members=[font]+[x.get_object() for x in font.get('/DescendantFonts',[])];embedded=False
   for member in members:
    descriptor=member.get('/FontDescriptor')
    if descriptor and any(k in descriptor.get_object() for k in ['/FontFile','/FontFile2','/FontFile3']):embedded=True
   base=str(font.get('/BaseFont',''));font_checks[str(key)]={'font':base,'embedded':embedded,'standard14':base in ['/Helvetica','/Times-Roman','/Courier']}
  for ref in r.get('/XObject',{}).values():
   obj=ref.get_object()
   if obj.get('/Subtype')=='/Form':resources(obj.get('/Resources'))
 for p in reader.pages:resources(p.get('/Resources'))
 page_checks=[]
 with pdfplumber.open(result['file']) as pdf:
  for n,p in enumerate(pdf.pages):
   m=maps[n];c={'page':n+1,'kind':m['kind'],'sectionId':m.get('sectionId'),'a4':abs(p.width-595.2756)<.03 and abs(p.height-841.8898)<.03,'mediaBoxPoints':[p.width,p.height]}
   if m['kind']=='BODY_TEXT':
    b=m['backgroundBox'];c['backgroundCoversMediaBox']=b['x']<=.001 and b['y']<=.001 and b['x']+b['width']>=p.width-.001 and b['y']+b['height']>=p.height-.001
    full=[im for im in p.images if im['x0']<=.1 and im['x1']>=p.width-.1 and im['top']<=.1 and im['bottom']>=p.height-.1]
    c['actualFullMediaImageCount']=len(full);c['extraGutterPt']=0 if full else None;c['textCharacters']=len(p.chars);outside=[]
    for ch in p.chars:
     if not ch['text'].strip() or ch['top']>p.height-36:continue
     if ch['x0']<45 or ch['x1']>p.width-45 or ch['top']<40 or ch['bottom']>p.height-40:outside.append({'bbox':[ch['x0'],ch['top'],ch['x1'],ch['bottom']]})
    c['unsafeCharacters']=len(outside);c['unsafeBoxes']=outside
   page_checks.append(c);p.close()
 text_checks=json.loads((directory/'text-extraction-checks.json').read_text())
 detail={'locale':locale,'pages':len(reader.pages),'pageChecks':page_checks,'fonts':list(font_checks.values()),'textIntegrity':text_checks,'normalization':'Markdown layout markers, whitespace and NFKC ligatures only; source bytes stay exact.'}
 (directory/'pdf-inspection.json').write_text(json.dumps(detail,indent=2),encoding='utf8')
 pages=directory/'pages';pages.mkdir(exist_ok=True)
 command=[str(poppler),'-scale-to','1000','-png',result['file'],str(pages/'page')]
 log=subprocess.run(command,capture_output=True);(directory/'poppler-render.log').write_bytes(log.stdout+log.stderr)
 if log.returncode:raise RuntimeError('POPPLER_RENDER_FAILED')
 return {'locale':locale,'pages':len(reader.pages),'integrityPass':sum(c['pass'] for c in text_checks),'integrityTotal':len(text_checks),'a4All':all(p['a4'] for p in page_checks),'fullBackgroundAll':all(p.get('backgroundCoversMediaBox',True) and p.get('actualFullMediaImageCount',1)>0 for p in page_checks),'unsafeTextPages':[p['page'] for p in page_checks if p.get('unsafeCharacters',0)>0],'fontEmbedFailures':[f['font'] for f in font_checks.values() if not f['embedded'] and not f['standard14']],'renderedPages':len(list(pages.glob('page-*.png')))}
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:checks=list(pool.map(inspect,results))
(out/'pdf-all-page-inspection.json').write_text(json.dumps({'reports':checks,'privateScreenshots':True},indent=2),encoding='utf8')
print(json.dumps({'reports':checks,'pagesRasterized':sum(c['renderedPages'] for c in checks)}))
