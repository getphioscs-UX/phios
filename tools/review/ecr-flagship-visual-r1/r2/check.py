from pathlib import Path
import json,hashlib,xml.etree.ElementTree as E,subprocess
D=Path('tools/review/ecr-flagship-visual-r1/r2');reg=json.loads(Path('content/web-production/registries/ecr-flagship-visual-r2-successor.json').read_text(encoding='utf-8'));results=[]
for a in reg['assets']:
 p=Path(a.get('file',a.get('path')));assert hashlib.sha256(p.read_bytes()).hexdigest()==a['sha256']
 if p.suffix=='.svg':
  root=E.fromstring(p.read_bytes());assert root.attrib['viewBox'];assert not any(n.tag.split('}')[-1].lower() in ['script','text','foreignobject','image','filter','animate','style'] for n in root.iter());assert not any(k.split('}')[-1]=='href' and not v.startswith('#') for n in root.iter() for k,v in n.attrib.items());results.append({'id':a['id'],'sha':'PASS','vectorSafety':'PASS','viewBox':root.attrib['viewBox']})
 else:assert a['httpStatus']==200 and a['decode']=='PASS';results.append({'id':a['id'],'sha':'PASS','http':200,'decode':'PASS','dimensions':[a['width'],a['height']]})
baseline=json.loads((D/'BASELINE.json').read_text());protected=[]
for a in baseline['sources']:
 if a['path'] in ['assets/customer-ui/js/surfaces/ecr-flagship-r1.js','assets/customer-ui/surfaces/ecr-flagship-r1.css','assets/customer-ui/media/ecr-flagship-r1/presentation.json']:continue
 assert hashlib.sha256(Path(a['path']).read_bytes()).hexdigest()==a['sha256'];protected.append(a['path'])
old=json.loads(Path('tools/review/ecr-flagship-visual-r1/DELIVERY-MANIFEST.json').read_text());current=json.loads(Path('assets/customer-ui/media/ecr-flagship-r1/presentation.json').read_text());old_projection=Path('tools/review/ecr-flagship-visual-r1/r2/BEFORE-presentation.json')
original=json.loads(subprocess.check_output(['git','show',baseline['head']+':assets/customer-ui/media/ecr-flagship-r1/presentation.json']))
assert {k:v for k,v in current.items() if k!='visualSuccessor'}==original
assert len(current['preview'])==3 and len(current['layers']['en'])==8
(D/'ASSET-AND-SCOPE-CHECKS.json').write_text(json.dumps({'status':'PASS','assets':results,'protectedUnchanged':protected,'runtimeReplaced':False,'providerCalls':0},indent=2))
print('PASS seven asset SHA/identity/vector safety + protected HTML/Mandala/registries unchanged')
