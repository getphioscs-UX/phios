from pathlib import Path
import json,hashlib,urllib.request,urllib.error,datetime
from PIL import Image
D=Path(__file__).parent;source=json.loads((D/'FRONT-MATTER-BINDINGS.json').read_text());cache=Path('.tmp/hd-r611/fresh-public-bytes');cache.mkdir(parents=True,exist_ok=True);rows=[]
for a in source['rows']:
 p=cache/(a['language']+'__'+Path(a['objectKey']).name);row={'language':a['language'],'pageId':a['pageId'],'objectKey':a['objectKey'],'priorBoundSHA256':a['sha256'],'httpStatus':None,'errorClass':None}
 try:
  req=urllib.request.Request(a['url']+('&' if '?' in a['url'] else '?')+'r611=fresh-20261029',headers={'Cache-Control':'no-cache'});r=urllib.request.urlopen(req,timeout=12);data=r.read();assert len(data)<10_000_000;p.write_bytes(data)
  with Image.open(p) as im:im.load();width,height=im.size;fmt=im.format
  digest=hashlib.sha256(data).hexdigest();row.update(httpStatus=r.status,file=str(p).replace('\\','/'),bytes=len(data),sha256=digest,width=width,height=height,format=fmt,matchesBoundBytes=digest==a['sha256'])
 except urllib.error.HTTPError as e:row.update(httpStatus=e.code,errorClass=type(e).__name__)
 except Exception as e:row.update(errorClass=type(e).__name__)
 rows.append(row);(D/'FRESH-PUBLIC-ASSET-READ.json').write_text(json.dumps({'observedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'credentialUsed':False,'rows':rows},indent=2)+'\n')
print({'http200':sum(r['httpStatus']==200 for r in rows),'changedBytes':sum(r.get('matchesBoundBytes') is False for r in rows),'noHTTPResponse':sum(r['httpStatus'] is None for r in rows)})
