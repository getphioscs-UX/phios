from pathlib import Path
from PIL import Image
import json
D=Path('tools/review/ecr-flagship-visual-r1/r3')
for r in json.loads((D/'BROWSER-QA.json').read_text())['results']:
 if r['width'] not in [360,1440]:continue
 im=Image.open(r['file'])
 for s in r['geometry']['sections']:
  if s['id'] in ['configuration-hero','report-preview','reading-flow']:
   im.crop((0,int(s['y']),r['width'],int(s['y']+s['height']))).save(D/('REVIEW-{}-{}-{}.png'.format(r['locale'],r['width'],s['id'])))
