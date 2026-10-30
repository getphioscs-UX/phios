"""Dependency-scoped re-export of native diagram pages; preserve all other pages."""
import pathlib,json,ast,hashlib,sys,copy,re,io,os,types
sys.path.insert(0,str(pathlib.Path('scripts/lib').resolve()))
from disk_space_guard import require_disk_space,reserve_render_slot
require_disk_space('HD R610 native diagram-page incremental export',500_000_000);reserve_render_slot('HD R610 native diagram-page incremental export')
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import BaseDocTemplate,PageTemplate,Frame,Paragraph,Spacer,PageBreak,Flowable,KeepTogether
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor,white
from reportlab.lib.utils import ImageReader
from xml.sax.saxutils import escape
from PIL import Image
from pypdf import PdfReader,PdfWriter
import pdfplumber
from pypdf.generic import NameObject
D=pathlib.Path(__file__).parent;T=pathlib.Path('.tmp/hd-r610-private');j=lambda p:json.loads(pathlib.Path(p).read_text(encoding='utf-8'));sha=lambda p:hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest();manifest=j(D/'PDF-MANIFEST.json');layouts=j(D/'LAYOUT-MAP.json')['formats'];selection=j(D/'FULL-REPORT-SELECTION.json');pack=j(D/'SECTION-PACKETS.json')['packets'];preview=j(D/'CURRENT-PLAN.json')['preview'];c=preview['chart'];W,H=595.2756,841.8898;navy=HexColor('#173847');teal=HexColor('#205c62');gold=HexColor('#ac8a4a');ivory=HexColor('#fffdf8');pdfmetrics.registerFont(TTFont('Noto','assets/fonts/private-report/NotoSansSC-Regular.ttf'));assets=j(D/'R2-ASSET-MANIFEST.json')['rows'];bodyImage=ImageReader(Image.open(next(a['file'] for a in assets if a['section']=='BODY')).convert('RGB'));clean=lambda t:re.sub(r'\*\*(.*?)\*\*',r'\1',t.replace('\r',''),flags=re.S)
class GraphicBase(Flowable):
 def __init__(self,kind,section=None):super().__init__();self.kind=kind;self.width=487;self.height=602
class Poster(Flowable):
 def __init__(self,n):super().__init__();self.number=n
tree=ast.parse((D/'render.py').read_text());bridge=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='bridge' for t in n.targets));Graphic=GraphicBase;exec(bridge,globals())
original=ast.parse((D/'../r65/render.py').read_text());nodes=[n for n in original.body if isinstance(n,ast.ClassDef) and n.name=='Report' or isinstance(n,ast.FunctionDef) and n.name=='build_story'];assert len(nodes)==2;exec(compile(ast.fix_missing_locations(ast.Module(body=nodes,type_ignores=[])),'existing-native-report-owner-unchanged-class-and-story','exec'),globals())
class SingleDiagramPage(Report):
 def __init__(self,file,fmt,total,page):self.actualPage=page;super().__init__(file,fmt,{'pages':total})
 def background(self,cv,doc):Report.background(self,cv,types.SimpleNamespace(page=self.actualPage))
records=[]
for f in manifest['files']:
 path=pathlib.Path(f['path']);before=sha(path);assert before==f['sha256'];reader=PdfReader(path);old=[hashlib.sha256(p.get_contents().get_data()).hexdigest() for p in reader.pages];writer=PdfWriter(clone_from=str(path));layout=next(x for x in layouts if x['format']==f['format']);changed=[]
 for kind in ['definition','centers','channels']:
  pg=next(int(p) for p,role in layout['roles'].items() if role=='DIAGRAM_'+kind);story=build_story(f['format'],{});idx=next(i for i,flow in enumerate(story) if isinstance(flow,Graphic) and flow.kind==kind);block=story[idx-1:idx+2];tmp=T/f'incremental-{f["format"]}-{kind}.pdf';doc=SingleDiagramPage(tmp,f['format'],f['pages'],pg);doc.build(block);one=PdfReader(tmp);assert len(one.pages)==1
  for key in ['/Contents','/Resources']:
   obj=one.pages[0][key].clone(writer);writer.pages[pg-1][NameObject(key)]=writer._add_object(obj) if key=='/Contents' else obj
  changed.append(pg)
 out=T/f'current-patched-{f["format"]}.pdf'
 with out.open('wb') as handle:writer.write(handle)
 with pdfplumber.open(out) as verified:assert len(verified.pages)==f['pages'],'PDFMINER_PAGE_TREE_MISMATCH'
 final=PdfReader(out);assert len(final.pages)==f['pages'];assert len(final.outline)==17;new=[hashlib.sha256(p.get_contents().get_data()).hexdigest() for p in final.pages];assert all(a==b for i,(a,b) in enumerate(zip(old,new),1) if i not in changed),'UNRELATED_PDF_PAGE_CONTENT_CHANGED';assert sha(path)==before,'CONCURRENT_PDF_MODIFICATION';os.replace(out,path)
 f['sha256']=sha(path);f['bytes']=path.stat().st_size;records.append({'format':f['format'],'beforeSHA256':before,'afterSHA256':f['sha256'],'changedPages':changed,'unchangedPageContentHashesVerified':len(old)-len(changed),'oldContentHashes':old,'newContentHashes':new,'bookmarks':17,'paragraphEdits':0})
(D/'PRE-GROUP-ORDER-PDF-MANIFEST.json').write_text(json.dumps(j(D/'PDF-MANIFEST.json'),indent=2)+'\n');(D/'PDF-MANIFEST.json').write_text(json.dumps(manifest,indent=2)+'\n');(D/'INCREMENTAL-DIAGRAM-PAGE-EXPORT.json').write_text(json.dumps({'records':records,'owner':'Existing native Report class, build_story styles, shared SVG Flowable; no second report engine','change':'Canonical connected-component order matches accepted SEC04 prose: Ajna-Throat, G-Sacral, Ego-Solar Plexus','commercial':False},indent=2)+'\n');print({'formats':3,'changedPages':sum(len(r['changedPages']) for r in records),'otherPageContentHashesUnchanged':sum(r['unchangedPageContentHashesVerified'] for r in records)})
