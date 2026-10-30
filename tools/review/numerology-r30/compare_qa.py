import json,sys,re,unicodedata,subprocess,hashlib
from pathlib import Path
from pypdf import PdfReader
sys.path.insert(0,str(Path('scripts/lib').resolve()))
from disk_space_guard import reserve_render_slot
root=Path('tools/review/numerology-r30');read=lambda p:json.loads(Path(p).read_text(encoding='utf-8'));identity=read(root/'COMPARISON-IDENTITY.json');path=Path(identity['file']);reader=PdfReader(path);assert len(reader.pages)==4
aliases=read('tools/review/numerology-r20/CURRENT-FONT-ALIASES.json')['aliases']
def norm(v):return re.sub(r'\s+','',unicodedata.normalize('NFKC',''.join(aliases.get(c,c)for c in v))).replace('\u2015','\u2014')
pubs=[read('.tmp/numerology-r29/PUBLICATION.json'),read('.tmp/numerology-r30/A-PUBLICATION.json')];missing=[]
for i,id in enumerate(identity['logicalPages']):
 page=reader.pages[i];assert abs(float(page.mediabox.width)-420/25.4*72)<.03 and abs(float(page.mediabox.height)-297/25.4*72)<.03;text=norm(page.extract_text()or'')
 for edition,pub in enumerate(pubs):
  p=next(p for p in pub['pages']if p['logicalPageId']==id)
  for l in['zh-Hans','en']:
   for u in p['languages'][l]['units']:
    if norm(u['text'])not in text:missing.append({'edition':edition,'pageId':id,'locale':l,'unit':u['unitId']})
assert not missing,missing
release=reserve_render_slot('R30 four-page side-by-side proof QA')
try:
 folder=path.parent/'side-by-side-pages';folder.mkdir(exist_ok=True);exe='C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe';subprocess.run([exe,'-scale-to','1800','-png',str(path),str(folder/'page')],check=True,capture_output=True)
 assert len(list(folder.glob('page-*.png')))==4
 (root/'COMPARISON-QA.json').write_text(json.dumps({'pages':4,'a3Landscape':True,'sourceParagraphsPreserved':True,'missing':missing,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'rasterized':4,'reviewArtifactOnly':True},indent=2),encoding='utf-8')
finally:release()
print('Four actual side-by-side pages: complete text, A3 landscape, rasterized.')
