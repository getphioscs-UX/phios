from pathlib import Path
import concurrent.futures, urllib.request, hashlib, json, datetime
from html.parser import HTMLParser
class TextParser(HTMLParser):
 def __init__(self):super().__init__();self.parts=[];self.skip=0
 def handle_starttag(self,tag,attrs):
  if tag in ('script','style'):self.skip+=1
 def handle_endtag(self,tag):
  if tag in ('script','style') and self.skip:self.skip-=1
 def handle_data(self,data):
  if not self.skip and data.strip():self.parts.append(data.strip())

ROOT=Path('C:/phios')
OUT=ROOT/'tools/review/country-history-closure-r1'
CACHE=ROOT/'.tmp/country-history-closure-r1/sources'
CACHE.mkdir(parents=True,exist_ok=True)
sources=[
 ('MYGOV','https://www.malaysia.gov.my/en/government/learn-about-malaysia'),
 ('UNESCO_MELAKA','https://whc.unesco.org/en/list/1223/'),
 ('UNESCO_LENGGONG','https://whc.unesco.org/en/list/1396/'),
 ('ARKIB_INDEPENDENCE','https://pustakailmu.arkib.gov.my/index.php/ms/pustaka-ilmu/imbasan-fakta/dokumen-perisytiharan-kemerdekaan?page=1'),
 ('MY_CUSTOMS','https://www.customs.gov.my/images/penerbitan/syahbandar-2022.pdf'),
 ('ASEAN_UN_TREATY','https://treaties.un.org/Pages/showDetails.aspx?clang=_en&objid=08000002800dc241'),
 ('NAS_CONSTITUTION','https://corporate.nas.gov.sg/outreach/law-of-the-land/'),
 ('UNESCO_SANGIRAN','https://whc.unesco.org/en/list/593/'),
 ('SETNEG_PROCLAMATION','https://www.setneg.go.id/baca/index/membuka_catatan_sejarah_detik_detik_proklamasi_17_agustus_1945'),
 ('BRIN_SRIVIJAYA','https://ejournal.brin.go.id/kalpataru/article/view/2619')
]
def get(item):
 sid,url=item
 try:
  req=urllib.request.Request(url,headers={'User-Agent':'PHIOS-public-source-review/1.0','Accept':'text/html,application/pdf'})
  with urllib.request.urlopen(req,timeout=35) as r:
   data=r.read(25000000);status=r.status;ctype=r.headers.get('Content-Type','');final=r.url
  ext='.pdf' if data.startswith(b'%PDF') else '.html'
  raw=CACHE/(sid+ext);raw.write_bytes(data)
  if ext=='.pdf':
   from pypdf import PdfReader
   doc=PdfReader(raw);pages=[{'page':i+1,'text':p.extract_text()} for i,p in enumerate(doc.pages)]
   (CACHE/(sid+'-pages.json')).write_text(json.dumps(pages,ensure_ascii=False),encoding='utf-8')
   title=sid;page_count=len(pages)
  else:
   parser=TextParser();parser.feed(data.decode('utf-8',errors='replace'));title=sid
   (CACHE/(sid+'.txt')).write_text('\n'.join(parser.parts),encoding='utf-8');page_count=None
  return {'id':sid,'url':url,'finalUrl':final,'httpStatus':status,'contentType':ctype,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'title':title,'pages':page_count,'privateReviewCache':str(raw),'retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'state':'RETRIEVED_NOT_YET_CLAIM_VERIFIED'}
 except Exception as e:return {'id':sid,'url':url,'state':'READ_UNVERIFIED','reason':str(e),'httpStatus':getattr(e,'code',None)}
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:rows=list(pool.map(get,sources))
(OUT/'SOURCE-HTTP-EVIDENCE.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps([{k:r.get(k) for k in ('id','httpStatus','state','bytes','pages','reason')} for r in rows]))
