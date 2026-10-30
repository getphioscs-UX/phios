from PIL import Image
from pathlib import Path
import json
D=Path('tools/review/ecr-flagship-visual-r1/r2')
for r in json.loads((D/'SECTION-COORDINATES.json').read_text()):
 im=Image.open(D/'screenshots'/('ECR-R2-{}-{}.png'.format(r['locale'],r['width'])))
 for s in r['sections']:
  if s['id'] in ['reading-flow','environment-response']:
   im.crop((0,int(s['y']),r['width'],int(s['y']+s['height']))).save(D/('REVIEW-{}-{}-{}.png'.format(r['locale'],r['width'],s['id'])))
