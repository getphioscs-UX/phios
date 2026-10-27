import pathlib,json,sys,math
from PIL import Image,ImageOps,ImageDraw
root=pathlib.Path(sys.argv[1]);out=root/'r33-publication';results=json.loads((out/'pdf-results.json').read_text(encoding='utf8'))['results'];inventory=[]
for report in results:
 locale=report['locale'];directory=out/locale;files=sorted((directory/'pages').glob('page-*.png'),key=lambda p:int(p.stem.split('-')[-1]));target=directory/'contacts';target.mkdir(exist_ok=True)
 for start in range(0,len(files),12):
  selected=files[start:start+12];canvas=Image.new('RGB',(1440,1760),'#d9d6ce');draw=ImageDraw.Draw(canvas)
  for n,file in enumerate(selected):
   image=Image.open(file).convert('RGB');thumb=ImageOps.contain(image,(345,490));x=(n%4)*360+(360-thumb.width)//2;y=(n//4)*580+32;canvas.paste(thumb,(x,y));draw.text(((n%4)*360+10,(n//4)*580+8),locale+' / P'+str(int(file.stem.split('-')[-1])),fill='#173c41')
  file=target/f'contact-{start//12+1:02d}.jpg';canvas.save(file,quality=86);inventory.append({'locale':locale,'file':str(file),'firstPage':start+1,'lastPage':start+len(selected),'pages':len(selected)})
(out/'contact-sheet-inventory.json').write_text(json.dumps(inventory,indent=2),encoding='utf8');print(json.dumps({'contactSheets':len(inventory),'pagesIncluded':sum(i['pages'] for i in inventory)}))
