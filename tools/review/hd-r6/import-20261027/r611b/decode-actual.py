from pathlib import Path
from PIL import Image,ImageDraw
import json,hashlib
D=Path('tools/review/hd-r6/import-20261027/r611b');j=lambda p:json.loads(p.read_text(encoding='utf-8-sig'));raw=[j(D/'ZIWEI-PUBLIC-READ.json'),*j(D/'OTHER-P06-PUBLIC-READS.json')['rows']];rows=[];panels=[]
for a in raw:
 assert a['httpStatus']==200;p=Path(a['file']);assert hashlib.sha256(p.read_bytes()).hexdigest()==a['sha256']
 with Image.open(p) as im:
  assert im.format=='WEBP';im.load();rgb=im.convert('RGB');w,h=rgb.size;pixel=hashlib.sha256(f'RGB:{w}x{h}:'.encode()+rgb.tobytes()).hexdigest();png=Path('.tmp/hd-r611b')/(a['sha256']+'.png');rgb.save(png);preview=rgb.copy();preview.thumbnail((390,550))
 row={**a,'verification':'CURRENT_BYTES_DECODED','width':w,'height':h,'pixelSHA256':pixel,'decodedPngFile':str(png).replace('\\','/'),'decodedPngSHA256':hashlib.sha256(png.read_bytes()).hexdigest(),'sourceChannel':'EXISTING_PUBLIC_OBJECT_URL_ANONYMOUS_GET','objectExistence':True,'visualAcceptance':'PENDING_OWNER','actualThemeReview':'PENDING_CODEX_VISUAL'};rows.append(row)
 panel=Image.new('RGB',(410,580),'#eaf0ef');panel.paste(preview,((410-preview.width)//2,25));ImageDraw.Draw(panel).text((10,7),a['methodId']+' / ACTUAL R2 P06',fill='black');panels.append(panel)
sheet=Image.new('RGB',(1230,1160),'white')
for i,im in enumerate(panels):sheet.paste(im,((i%3)*410,(i//3)*580))
sheet.save(D/'ACTUAL-SIX-P06-CONTACT.jpg',quality=94)
(D/'ACTUAL-P06-BYTE-IDENTITIES.json').write_text(json.dumps({'scope':'Six actual P06 only; distinct from HD fifteen P01-P05','rows':rows,'decoded':6,'ETagIsNotSHA256':True,'credentialsUsed':False,'productionWrites':0},indent=2)+'\n')
print(json.dumps([{'method':r['methodId'],'width':r['width'],'height':r['height'],'sha256':r['sha256']} for r in rows]))
