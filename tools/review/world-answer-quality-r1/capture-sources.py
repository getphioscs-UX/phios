import json,urllib.request,urllib.error,hashlib,datetime,concurrent.futures,re,html
from pathlib import Path
p=Path('content/world/local-answer-quality-r1.json');doc=json.loads(p.read_text(encoding='utf-8'));out=Path('tools/review/world-answer-quality-r1');raw=out/'source-http';raw.mkdir(exist_ok=True)
def fetch(s):
 record={'id':s['id'],'url':s['url'],'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'method':'GET'}
 try:
  req=urllib.request.Request(s['url'],headers={'User-Agent':'Mozilla/5.0 PHIOS-local-source-review'})
  with urllib.request.urlopen(req,timeout=25) as r:b=r.read(6000000);record.update(status=r.status,finalUrl=r.url,bytes=len(b),sha256=hashlib.sha256(b).hexdigest())
  # Preserve only our short verified excerpt; full responses are not publication assets.
  text=html.unescape(re.sub('<[^>]+>',' ',b.decode('utf-8','replace')));text=re.sub(r'\s+',' ',text)
  record['excerptFoundInHttpText']=s['quote'].casefold() in text.casefold()
 except urllib.error.HTTPError as er:record.update(status=er.code,excerptFoundInHttpText=False)
 except Exception as er:record.update(status=None,errorType=type(er).__name__,excerptFoundInHttpText=False)
 return record
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex:results=list(ex.map(fetch,doc['sources'].values()))
(out/'SOURCE-HTTP.json').write_bytes(json.dumps(results,indent=2).encode())
for r in results:print(r['id'],r['status'],r['excerptFoundInHttpText'])
