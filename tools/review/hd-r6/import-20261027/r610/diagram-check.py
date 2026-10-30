import pathlib,json,xml.etree.ElementTree as E
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
D=pathlib.Path(__file__).parent;J=lambda n:json.loads((D/n).read_text(encoding='utf-8'));pdfmetrics.registerFont(TTFont('Noto','assets/fonts/private-report/NotoSansSC-Regular.ttf'));checks=[];failures=[]
for r in J('CONTRASTING-CHARTS.json')['rows']:
 for kind in ['definition','centers','channels','cross','variables','environment','profile','comparison']:
  p=D/'diagrams'/f'{r["id"]}-{kind}.svg';root=E.parse(p).getroot();nodes=list(root);texts=[n for n in nodes if n.tag.endswith('text')]
  for n in texts:
   a=n.attrib;w=pdfmetrics.stringWidth(n.text or '','Noto',float(a['font-size']));x=float(a['x']);left=x-w/2 if a.get('text-anchor')=='middle' else x-w if a.get('text-anchor')=='end' else x
   if left<20 or left+w>774:failures.append({'file':p.name,'text':n.text,'left':left,'right':left+w})
  c=r['chart'];body=' '.join(n.text or '' for n in texts)
  if kind=='cross':
   for side,planet in [('PERSONALITY','SUN'),('PERSONALITY','EARTH'),('DESIGN','SUN'),('DESIGN','EARTH')]:
    a=next(a for a in c['activations'] if a['layer']==side and a['bodyCode']==planet);assert f'{a["gate"]}.{a["line"]}' in body
   assert c['incarnationCross']['configurationCode'] in body
  if kind in ['variables','environment']:
   for key,(x,y) in dict(designUpper=(75,295),personalityUpper=(426,295),designLower=(75,605),personalityLower=(426,605)).items():
    v=c['variables']['fields'][key];node=next(n for n in texts if float(n.attrib['x'])==x and float(n.attrib['y'])==y);assert node.text==f'Color {v["color"]} / Tone {v["tone"]}',(r['id'],key)
   assert not any('Inner Vision' in (n.text or '') for n in texts),'Numeric axes do not fabricate Cognition prose'
  if kind=='centers':
   cards=[n for n in nodes if n.tag.endswith('rect') and n.attrib.get('width')=='215'];assert len(cards)==9
   for center,card in zip(J('BODYGRAPH-GEOMETRY.json')['centers'],cards):
    if center['id'] in c['definedCenters']:assert card.attrib['fill']!='#ffffff'
    else:assert card.attrib['fill']=='#ffffff' and card.attrib.get('stroke-dasharray')=='8 6'
  if kind=='profile':assert c['profile']['profileCode'] in body
  checks.append({'case':r['id'],'kind':kind,'status':'PASS'})
assert not failures,failures
(D/'SVG-TEXT-BOUNDS.json').write_text(json.dumps({'files':len(checks),'failures':failures,'checks':checks,'fourCornerOrdering':'Design upper / Personality upper; Design lower / Personality lower','claim':'Actual computed values and text fit, not standalone semantic or professional-depth acceptance'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print({'svgFiles':len(checks),'boundsFailures':len(failures),'fourCornerIdentity':'PASS'})
