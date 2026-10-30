from pathlib import Path
import json
from PIL import Image,ImageDraw
D=Path('tools/review/ecr-flagship-visual-r1/r31');data=json.loads((D/'PUBLIC-READS.json').read_text());canvas=Image.new('RGB',(1500,1050),'#f8f6f0');draw=ImageDraw.Draw(canvas)
for i,a in enumerate(data['rows']):
 im=Image.open(a['file']);im.load();assert im.format=='WEBP';a['width'],a['height']=im.size;a['decode']='PASS';a['alphaExtrema']=im.convert('RGBA').getchannel('A').getextrema();rgb=im.convert('RGB');w,h=rgb.size
 def edge(box):
  p=list(rgb.crop(box).getdata());return {'nearWhite':round(sum(min(x)>245 for x in p)/len(p),4),'mean':[round(sum(x[j] for x in p)/len(p)) for j in range(3)]}
 a['edges']={k:edge(b) for k,b in {'top':(0,0,w,2),'bottom':(0,h-2,w,h),'left':(0,0,2,h),'right':(w-2,0,w,h)}.items()};thumb=rgb.copy();thumb.thumbnail((480,980));canvas.paste(thumb,(i*500+(500-thumb.width)//2,40));draw.text((i*500+10,8),a['section']+' '+str(im.size),fill='#163f46')
assert len({a['sha256'] for a in data['rows']})==3
(D/'PUBLIC-READS.json').write_text(json.dumps(data,indent=2));canvas.save(D/'FIGURE-CONTACT.jpg',quality=92)
print(json.dumps([{'id':a['id'],'dimensions':[a['width'],a['height']],'edges':a['edges']} for a in data['rows']]))
