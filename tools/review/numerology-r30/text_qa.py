"""Actual PDF text/glyph checks, independent of the serialized raster slot."""
import json,re,unicodedata,hashlib,sys
from pathlib import Path
from pypdf import PdfReader
root=Path('tools/review/numerology-r30');read=lambda p:json.loads(Path(p).read_text(encoding='utf-8'));results=read(root/'GENERATION.json')['results'];aliases=read('tools/review/numerology-r20/CURRENT-FONT-ALIASES.json')['aliases'];rows=[]
def norm(v):return re.sub(r'\s+','',unicodedata.normalize('NFKC',''.join(aliases.get(c,c)for c in v))).replace('\u2015','\u2014')
for r in results:
 if '--debug-C-en' in sys.argv and not(r['id']=='C' and r['locale']=='en'):continue
 path=Path(r['pdf']);reader=PdfReader(path);pub=read('.tmp/numerology-r30/'+r['id']+'-PUBLICATION.json');maps=read(path.parent/'PAGE-MAP.json');missing=[];glyphs=[]
 assert len(reader.pages)==r['pages'];assert hashlib.sha256(path.read_bytes()).hexdigest()==r['pdfSHA256']
 for pg,m in zip(reader.pages,maps):
  assert abs(float(pg.mediabox.width)-210/25.4*72)<.03 and abs(float(pg.mediabox.height)-297/25.4*72)<.03
  if m['pageRole']!='BODY_CONTENT':continue
  p=next(p for p in pub['pages']if p['logicalPageId']==m['logicalPageId']);units=[u for l in(['zh-Hans','en']if r['locale']=='bilingual'else[r['locale']])for u in p['languages'][l]['units']];paragraphs=[norm(u['text'])for u in units];text=pg.extract_text()or''
  assert 'SYNTHETIC'in text
  for u in units:
   if norm(u['text'])not in norm(text):missing.append(u['unitId'])
  sizes=[];matches=[]
  def visit(t,cm,tm,f,size):
   n=norm(t)
   if abs(abs(cm[0])-.75)<.001 and len(n)>=18 and any(x.startswith(n) for x in paragraphs):sizes.append(round(size*abs(cm[3]),3));matches.append((t,round(size*abs(cm[3]),3)))
  pg.extract_text(visitor_text=visit);target=10.5 if r['locale']=='bilingual'else 12;assert sizes and min(sizes)>=target-.05,(r['id'],r['locale'],m['logicalPageId'],matches)
  glyphs.append({'pageId':m['logicalPageId'],'bodyPt':sorted(set(sizes))})
 assert not missing
 rows.append({'id':r['id'],'locale':r['locale'],'pages':len(reader.pages),'sha256':r['pdfSHA256'],'missingParagraphs':missing,'a4All':True,'bodyGlyphs':glyphs,'rasterQA':'SEPARATE_PENDING','humanSemanticApproval':False,'liveCustomer':False})
 print(json.dumps({'id':r['id'],'locale':r['locale'],'actualTextAndGlyphs':'PASS'}),flush=True)
(root/'TEXT-ONLY-QA.json').write_text(json.dumps({'checks':rows,'pass':True,'scope':'Final actual PDF bytes/text/glyphs; does not replace raster checks'},indent=2),encoding='utf-8')
