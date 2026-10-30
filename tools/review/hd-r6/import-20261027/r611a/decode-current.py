from pathlib import Path
from PIL import Image
import json,hashlib,datetime
D=Path(__file__).parent
raw=json.loads((D/'AUTHORIZED-R2-READ.json').read_text(encoding='utf-8-sig'))
review_path=D/'VISUAL-ROLE-REVIEW.json'
reviews=json.loads(review_path.read_text(encoding='utf-8-sig')).get('rows',[]) if review_path.exists() else []
rows=[]
for a in raw['rows']:
 r=dict(a);r.update(objectExistence=None,currentDimensions=None,pdfConsumedSameBytes='NOT_RUN',freshness='BLOCKED',visualRoleReview=None)
 if a.get('readHTTP')==200 and a.get('file'):
  p=Path(a['file']);data=p.read_bytes();assert hashlib.sha256(data).hexdigest()==a['sha256']
  with Image.open(p) as im:
   assert im.format=='WEBP';im.load();rgb=im.convert('RGB');w,h=rgb.size
   pixel=hashlib.sha256(f'RGB:{w}x{h}:'.encode()+rgb.tobytes()).hexdigest()
  r.update(status='CURRENT_BYTES_DECODED',objectExistence=True,width=w,height=h,currentDimensions=[w,h],pixelSHA256=pixel,freshness='CURRENT_AUTHENTICATED_OBJECT_READ',mime='image/webp')
  matched=[x for x in reviews if x.get('sha256')==a['sha256'] and x.get('language')==a['language'] and x.get('pageId')==a['pageId']]
  if len(matched)==1:r['visualRoleReview']=matched[0]
 rows.append(r)
result={**raw,'rows':rows,'decodedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'ETagIsNotSHA256':True,'remoteAbsenceInferredFromErrors':False}
(D/'CURRENT-OBJECT-MATRIX.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'currentDecoded':sum(x.get('status')=='CURRENT_BYTES_DECODED' for x in rows),'blocked':sum(x['freshness']=='BLOCKED' for x in rows),'newPDFs':0}))
