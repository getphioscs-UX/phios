from pathlib import Path
import sys,json,io,hashlib
from PIL import Image,JpegImagePlugin
from pypdf import PdfReader
D=Path(__file__).parent;sys.path.insert(0,str(D.parent.resolve()));from audit import all_objects
j=lambda n:json.loads((D/n).read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
ref=io.BytesIO();Image.new('RGB',(8,8)).save(ref,format='JPEG',quality=87,subsampling=0,optimize=True);qt=Image.open(ref).quantization
reports=[]
items=j('REPAIRED-PDF-MANIFEST.json')['results'];e=j('ECR-Q87-REGRESSION.json');items.append({'method':'ECR','file':e['output'],'source':{'path':e['source']}})
for item in items:
 before=PdfReader(item['source']['path']);after=PdfReader(item['file']);old=[];new=[]
 for r,out in [(before,old),(after,new)]:
  for k,o in all_objects(r):
   if isinstance(o,dict) and o.get('/Subtype')=='/Image':out.append({'sha256':sha(o._data),'size':[int(o['/Width']),int(o['/Height'])],'filter':str(o.get('/Filter','')),'data':o.get_data() if '/DCTDecode' in str(o.get('/Filter')) else None})
 oldhash={x['sha256'] for x in old};changed=[x for x in new if x['sha256'] not in oldhash];checks=[]
 for x in changed:
  assert '/DCTDecode' in x['filter'];im=Image.open(io.BytesIO(x['data']));assert im.quantization==qt;assert JpegImagePlugin.get_sampling(im)==0;checks.append({'size':x['size'],'quality87QuantizationMatched':True,'sampling444':True})
 if item['method']=='ECR':assert {tuple(x['size']) for x in old}=={tuple(x['size']) for x in new}
 else:assert oldhash<={x['sha256'] for x in new}
 reports.append({'method':item['method'],'newOrReencodedRasterObjects':len(changed),'allNewJPEGsUseExactQ87TablesAnd444':True,'originalRasterDimensionsPreserved':True,'originalMainPayloadsRetained':item['method']!='ECR','checks':checks})
(D/'Q87-ENCODING-VERIFY.json').write_text(json.dumps({'reports':reports,'allPassed':True,'oldOptimizationMatrixRerun':False},indent=2)+'\n');print([(r['method'],r['newOrReencodedRasterObjects']) for r in reports],'Q87 encoding verified')
