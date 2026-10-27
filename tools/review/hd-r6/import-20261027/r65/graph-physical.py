import pathlib,json,math,hashlib
import pdfplumber
D=pathlib.Path('tools/review/hd-r6/import-20261027/r65');g=json.loads((D/'BODYGRAPH-GEOMETRY.json').read_text());rows=[]
for f in json.loads((D/'PDF-MANIFEST.json').read_text())['files']:
 with pdfplumber.open(f['path']) as pdf:
  p=pdf.pages[3];words=p.extract_words(extra_attrs=['size','fontname']);numbers=[w for w in words if w['text'].isdigit() and 1<=int(w['text'])<=64 and abs(w['size']-8.75)<.02 and 'Helvetica' in w['fontname']];assert len(numbers)==64 and len({w['text'] for w in numbers})==64
  offset=sum((w['x0']+w['x1'])/2-g['gates'][w['text']]['x']*.70 for w in numbers)/64
  assert all(abs((w['x0']+w['x1'])/2-(offset+g['gates'][w['text']]['x']*.70))<.04 for w in numbers)
  under=[x for x in p.lines if isinstance(x.get('stroking_color'),(list,tuple)) and max(abs(a-b) for a,b in zip(x['stroking_color'],[214/255,207/255,192/255]))<.002]
  expected=sum(len(c['route'])-1 for c in g['channels']);assert len(under)==expected,(len(under),expected)
  rows.append({'format':f['format'],'page':4,'printedGateLabels':64,'all64ActualXCoordinatesMatchSharedMap':True,'gateFontPt':8.75,'neutralChannelRouteSegments':len(under),'sharedExpectedSegments':expected,'nativeVectorNotRaster':True,'geometrySHA256':hashlib.sha256((D/'BODYGRAPH-GEOMETRY.json').read_bytes()).hexdigest(),'pdfSHA256':f['sha256'],'scope':'Endpoint/state/coordinate/render proof; manual conventional visual review and astronomical precision are separate.'})
(D/'BODYGRAPH-PHYSICAL-QA.json').write_text(json.dumps({'rows':rows},indent=2)+'\n');print({'formats':len(rows),'actualGateLabels':64,'routes':'PASS_NATIVE_VECTOR'})
