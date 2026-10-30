from pathlib import Path
import json,subprocess,sys
from PIL import Image,ImageDraw
D=Path(__file__).parent;b=json.loads((D/'ECR-SOURCE-BINDING.json').read_text());q=json.loads((D/'ECR-Q87-REGRESSION.json').read_text());maps=json.loads(Path(b['pageMapPath']).read_text());numbers=[1,next(i+1 for i,m in enumerate(maps) if m.get('kind')=='BODY_TEXT'),next(i+1 for i,m in enumerate(maps) if m.get('assetId')=='SEC-07'),132]
sys.path.insert(0,str(Path('scripts/lib').resolve()));from disk_space_guard import require_disk_space,reserve_render_slot
require_disk_space('Four existing ECR source/Q87 representative page pairs',80_000_000);release=reserve_render_slot('ECR accepted author four-page Q87 visual recheck')
try:
 T=Path('.tmp/r2-background-ecr-publication-repair/private/ecr-representatives');T.mkdir(parents=True,exist_ok=True);rows=[];sheet=Image.new('RGB',(1200,1760),'#e9eeec')
 for i,n in enumerate(numbers):
  pictures=[]
  for k,(label,file) in enumerate([('SOURCE',b['originalPDF']['path']),('Q87',q['output'])]):
   p=T/f'{n:03}-{label}';subprocess.run(['C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe','-f',str(n),'-l',str(n),'-r','100','-singlefile','-png',file,str(p)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE);im=Image.open(str(p)+'.png').convert('RGB');pictures.append(str(p)+'.png');im.thumbnail((290,397));panel=Image.new('RGB',(300,440),'#e9eeec');panel.paste(im,((300-im.width)//2,30));ImageDraw.Draw(panel).text((8,8),f'ECR p{n} / {label}',fill='black');sheet.paste(panel,((i%2)*600+k*300,(i//2)*440))
  rows.append({'page':n,'before':pictures[0],'after':pictures[1],'samePageDimensions':Image.open(pictures[0]).size==Image.open(pictures[1]).size})
 out=T/'ECR-Q87-SOURCE-COMPARE.jpg';sheet.crop((0,0,1200,880)).save(out,quality=94);(D/'ECR-VISUAL-REPRESENTATIVES.json').write_text(json.dumps({'rows':rows,'contact':str(out).replace('\\','/'),'full132PriorVisualScope':'Existing R33 source281-page visual QA inherited; current Q87 structural/text checks cover132 pages,8 representative rasters freshly rendered','review':'PENDING_ACTUAL_CONTACT_INSPECTION','private':True},indent=2)+'\n');print('ECR four real source/Q87 pairs rendered under private isolated output',flush=True)
finally:release()
