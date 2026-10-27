import pathlib,json,re,subprocess
import pdfplumber
from PIL import Image,ImageDraw
D=pathlib.Path('tools/review/hd-r6/import-20261027/r65');V=D/'current-review';T=pathlib.Path('.tmp/hd-r65-private/compare');T.mkdir(exist_ok=True);pop='C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe';j=lambda p:json.loads(pathlib.Path(p).read_text(encoding='utf-8'));layout=j(D/'LAYOUT-MAP.json')['formats'][0];chap=layout['chapters'];old='output/pdf/hd-r64-owner-review/HD-R64-17SECTIONS-OWNER-zh-Hans.pdf';new='output/pdf/hd-r65-owner-review/HD-R65-PREMIUM-OWNER-zh-Hans.pdf';oldchap={}
with pdfplumber.open(old) as doc:
 for i,p in enumerate(doc.pages,1):
  for m in re.finditer(r'(?m)^(\d\d)\s*·\s*(.+)',p.extract_text() or ''):oldchap.setdefault(int(m.group(1)),i)
roles=[('Cover',1,1),('Calculated BodyGraph',2,4),('Activation table',3,5),('Chapter opening / R64 has no poster',oldchap.get(1,4),int(chap['1'])),('Body page',oldchap.get(1,4),int(chap['1'])+1),('Centers / R64 text only',oldchap.get(5,11),int(chap['5'])+1),('Channels / R64 text only',oldchap.get(6,13),int(chap['6'])+1),('Professional application',oldchap.get(13,28),int(chap['13'])+1),('Closing',37,layout['pages'])]
def image(which,pg):
 prior=pathlib.Path('tools/review/hd-r6/import-20261027/r64/owner-final')/f'representative-zh-Hans-{pg}.png' if which=='old' else V/f'zh-Hans-representative-{pg}.png'
 if prior.exists():return Image.open(prior)
 dest=T/f'{which}-{pg}.png'
 if not dest.exists():subprocess.run([pop,'-f',str(pg),'-l',str(pg),'-scale-to','850','-singlefile','-png',old if which=='old' else new,str(dest.with_suffix(''))],check=True,capture_output=True)
 return Image.open(dest)
for start in range(0,9,3):
 sheet=Image.new('RGB',(1000,1980),'#ece8df');draw=ImageDraw.Draw(sheet)
 for row,(name,a,b) in enumerate(roles[start:start+3]):
  y=row*660;draw.text((12,y+4),f'{name} | R6.4 p{a} / R6.5 p{b}',fill='black')
  for col,(w,pg) in enumerate([('old',a),('new',b)]):
   im=image(w,pg);im.thumbnail((480,620));sheet.paste(im,(col*500+10,y+25))
 sheet.save(V/f'R64-R65-COMPARISON-{start//3+1}.jpg',quality=90)
(D/'BEFORE-AFTER.json').write_text(json.dumps({'roles':[{'role':a,'r64Page':b,'r65Page':c} for a,b,c in roles],'sheets':[f'current-review/R64-R65-COMPARISON-{i}.jpg' for i in range(1,4)],'r64HistoricalUnchanged':True,'visualAssessment':'Owner decision required. New fixed imagery, full64Gate/36Channel vector, calculated specialist figures and BODY design are actual PDF content. SEC11 fixed art remains unresolved.'},indent=2)+'\n');print({'comparisons':9,'sheets':3})
