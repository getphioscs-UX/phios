"""Operational vector proof only; exact same SVG Flowable as private report export."""
import pathlib,json,ast,hashlib,sys
sys.path.insert(0,str(pathlib.Path('scripts/lib').resolve()))
from disk_space_guard import require_disk_space,reserve_render_slot
require_disk_space('HD R610 shared-vector contrasting chart proof',400_000_000);reserve_render_slot('HD R610 contrasting-vector proof')
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Flowable
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from pypdf import PdfReader
D=pathlib.Path(__file__).parent;j=lambda p:json.loads(pathlib.Path(p).read_text(encoding='utf-8'));pdfmetrics.registerFont(TTFont('Noto','assets/fonts/private-report/NotoSansSC-Regular.ttf'))
tree=ast.parse((D/'render.py').read_text(encoding='utf-8'));bridge=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='bridge' for t in n.targets))
class ExistingGraphicBase(Flowable):
 def __init__(self,kind,section=None):super().__init__();self.kind=kind;self.width=487;self.height=602
scope={'Graphic':ExistingGraphicBase,'D':D,'j':j,'HexColor':HexColor,'preview':None};exec(bridge,scope)
file=pathlib.Path('.tmp/hd-r610-private/CONTRAST-DIAGRAM-PROOF.pdf');cv=canvas.Canvas(str(file),pagesize=(595.2756,841.8898));rows=[]
for r in j(D/'CONTRASTING-CHARTS.json')['rows']:
 scope['preview']={'chartDigest':r['chartDigest']}
 for kind in ['definition','centers','channels','cross','variables','environment','profile','comparison']:
  cv.setFillColor(HexColor('#fffdf8'));cv.rect(0,0,596,842,fill=1,stroke=0);cv.setFillColor(HexColor('#173847'));cv.setFont('Noto',11);cv.drawString(54,800,r['id']+' · '+r['chart']['typeCode']+' · '+r['chart']['authority']);cv.drawString(54,780,r['chart']['definition']['definitionCode']+' · '+r['chart']['profile']['profileCode']);flow=scope['Graphic'](kind);flow.drawOn(cv,54,100);cv.setFont('Noto',8);cv.drawString(54,70,'PRIVATE CALCULATED DIAGRAM PROOF · NOT A COMPLETE REPORT / 非完整报告');cv.drawString(54,55,r['chart']['incarnationCross']['configurationCode']);cv.showPage();rows.append({'id':r['id'],'kind':kind,'chartDigest':r['chartDigest'],'page':len(rows)+1,'svgSHA256':hashlib.sha256((D/'diagrams'/f'{r["id"]}-{kind}.svg').read_bytes()).hexdigest()})
cv.save();reader=PdfReader(file);assert len(reader.pages)==48
for row in rows:
 text=reader.pages[row['page']-1].extract_text();assert row['id'] in text
record={'path':str(file).replace('\\','/'),'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'pages':48,'rows':rows,'sharedSVGFlowableSHA256':hashlib.sha256(bridge.encode()).hexdigest(),'separateRenderingEngine':False,'fullReportClaim':False,'actualTypes':5,'providerCalls':0}
(D/'CONTRAST-PDF-PROOF.json').write_text(json.dumps(record,indent=2)+'\n');print({'contrastingVectorPages':48,'actualTypes':5,'fullReportClaim':False})
