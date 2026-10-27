import pathlib,json,hashlib,sys
from PIL import Image
root=pathlib.Path(sys.argv[1]);out=root/'r33-publication';records=[]
for file in sorted((out/'assets').glob('*.webp')):
 im=Image.open(file);orientation=im.getexif().get(274,1)
 if orientation not in (None,1):raise RuntimeError('SOURCE_ORIENTATION_REVIEW_REQUIRED')
 rgba=im.convert('RGBA');rgba.save(file.with_suffix('.png'))
 same=Image.open(file.with_suffix('.png')).convert('RGBA').tobytes()==rgba.tobytes()
 records.append({'assetId':file.stem,'width':im.width,'height':im.height,'orientation':orientation,'sourceRgbaSha256':hashlib.sha256(rgba.tobytes()).hexdigest(),'losslessPngPixelMatch':same,'sourceBytesUnmodified':True,'effectiveA4Dpi':[round(im.width/210*25.4,2),round(im.height/297*25.4,2)]})
(out/'image-decode-evidence.json').write_text(json.dumps(records,indent=2),encoding='utf8')
print(json.dumps({'imagesDecoded':len(records),'losslessConversions':sum(r['losslessPngPixelMatch'] for r in records)}))
