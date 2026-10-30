from pathlib import Path
from PIL import Image
import json
D=Path('tools/review/ecr-flagship-visual-r1/r31');data=json.loads((D/'BROWSER-QA.json').read_text())
for r in data['results']:
 if r['locale']=='en' and r['width']==1440:
  im=Image.open(r['file'])
  for s in r['metrics']['sections']:
   if s['id'] in ['method-origins','reading-flow','reality-comparison']:
    code={'method-origins':'P03','reading-flow':'P04','reality-comparison':'P07'}[s['id']]
    im.crop((0,int(s['y']),r['width'],int(s['y']+s['height']))).save(D/('PAGE-'+code+'.png'))
 if r['locale']=='zh-Hans' and r['width']==360:
  im=Image.open(r['file']);s=next(x for x in r['metrics']['sections'] if x['id']=='reading-flow');im.crop((0,int(s['y']),360,int(s['y']+s['height']))).save(D/'MOBILE-P04.png')
