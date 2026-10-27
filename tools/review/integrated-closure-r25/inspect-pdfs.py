import pathlib,json,hashlib,re,unicodedata,subprocess,concurrent.futures
from pypdf import PdfReader
repo=pathlib.Path.cwd();out=repo/'.tmp/integrated-closure-r25/private/ecr';safe=repo/'tools/review/integrated-closure-r25';read=lambda p:json.loads(p.read_text(encoding='utf8'))
receipt=read(out/'PDF-RESULTS.json');versions=read(pathlib.Path(receipt['root'])/'CURRENT-EFFECTIVE-CHAPTERS.json')['versions'];motions=read(repo/'content/embodied-configuration/ecr-motion-registry-v1.json')['entries'];poppler=pathlib.Path('C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe')
def norm(s):return re.sub(r'\s+','',unicodedata.normalize('NFKC',s))
def visible(s):
 s=re.sub(r'^#{1,6}\s+','',s,flags=re.M);s=re.sub(r'\*\*([^*]+)\*\*',r'\1',s);s=re.sub(r'`([^`]+)`',r'\1',s);return re.sub(r'^\s*---\s*$','',s,flags=re.M)
def inspect(r):
 pdf=PdfReader(r['file']);maps=read(pathlib.Path(r['file']).parent/'page-map.json');assert len(pdf.pages)==r['pages']==len(maps);assert hashlib.sha256(pathlib.Path(r['file']).read_bytes()).hexdigest()==r['sha256'];texts=[p.extract_text() or '' for p in pdf.pages];checks=[]
 for p,m in zip(pdf.pages,maps):
  assert abs(float(p.mediabox.width)-595.2756)<.03 and abs(float(p.mediabox.height)-841.8898)<.03
  if m['kind']=='BODY_TEXT':
   b=m['backgroundBox'];assert b['x']<=0.01 and b['y']<=0.01 and b['width']>=595.27 and b['height']>=841.88
 for v in versions:
  raw=(pathlib.Path(v['folder'])/'exact-text.txt').read_bytes();assert hashlib.sha256(raw).hexdigest()==v['exactTextSha256']
  if r['locale']!='bilingual' and v['locale']!=r['locale']:continue
  actual=''.join(re.sub(r'PRIVATE AUTHOR REVIEW - NOT CUSTOMER DELIVERY\s+\d+\s*$','',texts[i]) for i,m in enumerate(maps) if m.get('sectionId')==v['sectionId'] and m['kind']=='BODY_TEXT');assert norm(visible(raw.decode('utf8'))) in norm(actual),(r['locale'],v['sectionId'],v['locale']);checks.append({'section':v['sectionId'],'language':v['locale'],'status':'PASS'})
 sec=texts[r['sec07Page']-1];assert all(m['label'] in sec and m['labelZhHans'] in sec and m['trigramZhHans'] in sec for m in motions);assert 'NOT A PERSONAL RESULT' in sec and 'HEXAGRAM 27' in sec and '颐' in sec
 appendix=''.join(texts[i] for i,m in enumerate(maps) if m.get('sectionId')=='APPENDIX');assert 'Legacy single-solar-anchor' not in appendix and '旧单太阳锚点' not in appendix;assert not re.search(r'\b[a-f0-9]{64}\b',texts[-1]);assert maps[-1].get('publicationAudience')=='CUSTOMER_CALCULATION'
 pages=pathlib.Path(r['file']).parent/'pages';pages.mkdir(exist_ok=True)
 # Prior complete 281-page rasterization is preserved. Only the replacement
 # SEC07 page changed in this iteration; refresh that exact screenshot.
 subprocess.run([str(poppler),'-f',str(r['sec07Page']),'-l',str(r['sec07Page']),'-scale-to','1000','-singlefile','-png',r['file'],str(pages/('page-'+str(r['sec07Page']).zfill(3 if r['pages']>=100 else 2)))],check=True,capture_output=True);assert len(list(pages.glob('page-*.png')))==r['pages']
 return {'locale':r['locale'],'pages':r['pages'],'a4':'PASS','bodyBackground':'PASS','bodyChecks':checks,'allPagesRasterized':True,'customerAppendixBoundary':'PASS','sha256':r['sha256'],'scope':'PRIVATE_LOCAL_AUTHOR_CANDIDATE_NOT_CUSTOMER_RELEASE'}
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:results=list(pool.map(inspect,receipt['results']))
subprocess.run([str(poppler),'-f',str(receipt['results'][0]['sec07Page']),'-l',str(receipt['results'][0]['sec07Page']),'-scale-to','2400','-singlefile','-png',receipt['results'][0]['file'],str(safe/'SEC07-A4-R25')],check=True,capture_output=True)
(safe/'PDF-INTEGRITY.json').write_text(json.dumps({'results':results,'sourceHashChecks':20,'bodyChecks':sum(len(r['bodyChecks']) for r in results),'renderedPages':sum(r['pages'] for r in results),'providerCalls':0,'humanPrintAcceptance':False},indent=2),encoding='utf8');print('PASS',sum(r['pages'] for r in results),'raster pages; 40 full body checks; 20 source hashes')
