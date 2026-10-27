import pathlib,json,hashlib,re,unicodedata,subprocess,concurrent.futures
from PIL import Image,ImageChops
from pypdf import PdfReader
repo=pathlib.Path.cwd();out=repo/'.tmp/ecr-r33-binding-closure-20261027';safe=repo/'tools/review/phi-configuration-deep-reading-r2-integrated/r33-publication/binding-closure-20261027';root=pathlib.Path('C:/Users/Guest Account/.codex/visualizations/2026/10/19/01a15628-6f1a-76c3-9ea2-036c17c34ef5/ecr-r3-private-author/r32-author-collection');old=root/'r33-publication'
read=lambda p:json.loads(p.read_text(encoding='utf8'));results=read(out/'PDF-RESULTS.json')['results'];versions=read(root/'CURRENT-EFFECTIVE-CHAPTERS.json')['versions'];poppler=pathlib.Path('C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe')
def visible(s):
 s=re.sub(r'^#{1,6}\s+','',s,flags=re.M);s=re.sub(r'\*\*([^*]+)\*\*',r'\1',s);s=re.sub(r'`([^`]+)`',r'\1',s);return re.sub(r'^\s*---\s*$','',s,flags=re.M)
def norm(s):return re.sub(r'\s+','',unicodedata.normalize('NFKC',s))
def stream(page):
 c=page.get_contents();return hashlib.sha256(c.get_data() if c else b'').hexdigest()
reports=[];alltext=[]
for r in results:
 locale=r['locale'];folder=out/locale;maps=read(folder/'page-map.json');pdf=PdfReader(r['file']);previous=PdfReader(r['previousFile']);checks=[]
 for i,(p,m) in enumerate(zip(pdf.pages,maps)):
  same=stream(p)==stream(previous.pages[i]);a4=abs(float(p.mediabox.width)-595.2756)<.03 and abs(float(p.mediabox.height)-841.8898)<.03
  if m.get('assetId')!='SEC-07' and not same:raise RuntimeError('UNCHANGED_PAGE_CONTENT_DRIFT')
  if not a4:raise RuntimeError('NOT_A4')
  checks.append({'page':i+1,'role':m['kind'],'sectionId':m.get('sectionId'),'assetId':m.get('assetId'),'a4':a4,'contentStreamUnchanged':same,'fullBodyBackgroundInherited':m.get('backgroundBox') if m['kind']=='BODY_TEXT' else None})
 for v in versions:
  raw=(pathlib.Path(v['folder'])/'exact-text.txt').read_bytes();assert hashlib.sha256(raw).hexdigest()==v['exactTextSha256']
  if locale!='bilingual' and v['locale']!=locale:continue
  text=''.join(re.sub(r'PRIVATE AUTHOR REVIEW - NOT CUSTOMER DELIVERY\s+\d+\s*$','',pdf.pages[i].extract_text() or '') for i,m in enumerate(maps) if m.get('sectionId')==v['sectionId'] and m['kind']=='BODY_TEXT')
  expected=norm(visible(raw.decode('utf8')));passed=expected in norm(text);alltext.append({'report':locale,'section':v['sectionId'],'language':v['locale'],'pass':passed,'sourceSHA256':v['exactTextSha256']});assert passed,(locale,v['sectionId'],v['locale'])
 sec=pdf.pages[r['fixedSec07Page']-1].extract_text();motions=read(repo/'content/embodied-configuration/ecr-motion-registry-v1.json')['entries'];assert all(m['label'] in sec and m['labelZhHans'] in sec and m['trigramZhHans'] in sec for m in motions)
 appendix=''.join(pdf.pages[i].extract_text() or '' for i,m in enumerate(maps) if m.get('sectionId')=='APPENDIX');assert 'Legacy single-solar-anchor' not in appendix and '旧单太阳锚点' not in appendix
 pages=folder/'pages';pages.mkdir(exist_ok=True);proc=subprocess.run([str(poppler),'-scale-to','1000','-png',r['file'],str(pages/'page')],capture_output=True);assert proc.returncode==0,proc.stderr[:1000]
 files=sorted(pages.glob('page-*.png'),key=lambda p:int(p.stem.split('-')[-1]));assert len(files)==r['pages'];oldfiles={int(p.stem.split('-')[-1]):p for p in (old/locale/'pages').glob('page-*.png')};raster=[]
 for p in files:
  n=int(p.stem.split('-')[-1]);same=None
  if n in oldfiles:
   a=Image.open(p).convert('RGB');b=Image.open(oldfiles[n]).convert('RGB');same=a.size==b.size and ImageChops.difference(a,b).getbbox() is None
  raster.append({'page':n,'matchesPreviousRaster':same,'newPresentation':n==r['fixedSec07Page']})
 reports.append({'locale':locale,'pages':r['pages'],'renderedPages':len(files),'pageChecks':checks,'rasterChecks':raster,'unchangedContentPages':sum(c['contentStreamUnchanged'] for c in checks),'unchangedRasterPages':sum(c['matchesPreviousRaster'] is True for c in raster),'sec07NativeLabelCheck':'PASS','appendixBoundary':'PASS'})
 (folder/'inspection.json').write_text(json.dumps(reports[-1],ensure_ascii=False,indent=2),encoding='utf8');print(locale,'rendered',len(files),'unchanged raster',reports[-1]['unchangedRasterPages'],flush=True)
# Independent higher-resolution visual check of the shared, fixed SEC07 page.
r=results[0];prefix=safe/'SEC07-A4-after';subprocess.run([str(poppler),'-f',str(r['fixedSec07Page']),'-l',str(r['fixedSec07Page']),'-scale-to','2000','-singlefile','-png',r['file'],str(prefix)],check=True,capture_output=True)
report={'reports':reports,'renderedPages':sum(r['pages'] for r in reports),'sourceSHA256Checks':20,'finalBodyChecks':alltext,'allBodyChecksPass':all(c['pass'] for c in alltext),'scope':'All pages rasterized; unchanged pages inherit prior visual review only where content/raster matches; new SEC07 requires direct visual check','privateScreenshots':True}
(out/'ALL-PAGE-QA.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8');(safe/'ALL-PAGE-QA-SUMMARY.json').write_text(json.dumps({**report,'reports':[{k:v for k,v in r.items() if k not in ['pageChecks','rasterChecks']} for r in reports]},ensure_ascii=False,indent=2),encoding='utf8')
print('PASS',report['renderedPages'],'page screenshots;',len(alltext),'body checks')
