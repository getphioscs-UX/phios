"""R611 configuration of the existing R68/R65 export owner; no new PDF engine."""
import pathlib,json,ast,hashlib
D=pathlib.Path(__file__).parent
# Preserve the accepted content byte-for-byte; only candidate copies are made.
for name in ['SECTION-PACKETS.json','FULL-REPORT-SELECTION.json','CURRENT-PLAN.json','BODYGRAPH-STATE.json','BODYGRAPH-GEOMETRY.json','R2-ASSET-MANIFEST.json','SEC11-OWNER-VISUAL-ACCEPTANCE.json','CONTRASTING-CHARTS.json','PROJECTION-zh-Hans.json','PROJECTION-en.json','PROJECTION-bilingual.json']:
 (D/name).write_bytes((D/'../r610'/name).read_bytes())
bridge=next(ast.literal_eval(n.value) for n in ast.parse((D/'../r610/render.py').read_text()).body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='bridge' for t in n.targets)).replace("D/'diagrams'","D/'../r610/diagrams'")
addon=r'''
from pypdf import PdfWriter
import os
if os.environ.get('PHIOS_R611_LAYOUT_TEST')=='perturbation':
 O=pathlib.Path('.tmp/hd-r611-perturbation');O.mkdir(parents=True,exist_ok=True);T=O
 V=D/'layout-perturbation';V.mkdir(exist_ok=True)
 save=lambda n,x:(V/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 pack=copy.deepcopy(pack);extra=copy.deepcopy(max([p for p in pack[8]['paragraphs'] if p['language']=='en'],key=lambda p:len(p['text'])));extra['id']='QA_LAYOUT_PERTURBATION_ONLY';extra['text']='\n\n'.join([extra['text']]*4);pack[8]['paragraphs'].append(extra)
from pypdf.annotations import Link
from pypdf.generic import Fit,NameObject,ArrayObject
frontPlans={p['contentLanguage']:p for p in j(D/'FRONT-MATTER-SELECTION.json')['plans']}
tocContract=j(next((D/'input').rglob('HD-TOC-CONTRACT.json')))
class FrontMatter(Flowable):
 def __init__(self,n,fmt):
  Flowable.__init__(self);self.number=n;self.fmt=fmt;self.width=487;self.height=716;self.asset=frontPlans[fmt]['pages'][n-1]
  assert sha(self.asset['file'])==self.asset['sha256']
 def draw(self):
  cv=self.canv;cv.saveState();x,y=cv.absolutePosition(0,0);cv.translate(-x,-y);cv.setFillColor(ivory);cv.rect(0,0,W,H,fill=1,stroke=0)
  im=Image.open(self.asset['file']).convert('RGB');scale=min(W/im.width,H/im.height);w,h=im.width*scale,im.height*scale;cv.drawImage(ImageReader(im),(W-w)/2,(H-h)/2,w,h,mask='auto');cv.restoreState()
class Contents(Flowable):
 def __init__(self,fmt):Flowable.__init__(self);self.fmt=fmt;self.width=487;self.height=716
 def draw(self):
  cv=self.canv;cv.saveState();x,y=cv.absolutePosition(0,0);cv.translate(-x,-y);cv.setFillColor(teal);cv.setFont('Helvetica',10);cv.drawString(65,762,'PHI OS / HUMAN DESIGN');cv.setStrokeColor(gold);cv.line(65,747,W-65,747);cv.setFont('Noto',23);cv.drawString(65,711,{'en':'Contents','zh-Hans':'目录','bilingual':'目录 / Contents'}[self.fmt]);cv.line(65,697,W-65,697)
  for i,row in enumerate(tocContract['section_titles']):
   yy=675-i*31;cv.setFillColor(gold);cv.setFont('Helvetica',10);cv.drawString(67,yy,str(i+1).zfill(2));cv.setFillColor(navy)
   if self.fmt=='bilingual':cv.setFont('Noto',11.2);cv.drawString(102,yy+4.5,row['zh-Hans']);cv.setFont('Noto',8.3);cv.drawString(102,yy-8.5,row['en'])
   else:cv.setFont('Noto',11.7 if self.fmt=='zh-Hans' else (10 if len(row['en'])>29 else 10.7));cv.drawString(102,yy,row[self.fmt])
   cv.setStrokeColor(gold);cv.setDash(1,3);cv.line(449,yy,489,yy);cv.setDash()
  cv.restoreState()
ExistingReport=Report
class Report(ExistingReport):
 def background(self,cv,doc):
  if doc.page<=5:return
  return super().background(cv,doc)
 def afterFlowable(self,f):
  super().afterFlowable(f)
  if isinstance(f,FrontMatter):self.roles[self.page]='FIXED_FRONT_P0'+str(f.number)
  if isinstance(f,Contents):self.roles[self.page]='SEMIFIXED_TOC'
 def finish_toc(self,file):
  assert self.roles.get(6)=='SEMIFIXED_TOC' and sorted(self.chapters)==list(range(1,18))
  before=PdfReader(str(file));overlay=io.BytesIO();cv=canvas.Canvas(overlay,pagesize=(W,H));cv.setFillColor(navy);cv.setFont('Noto',11)
  for i,n in enumerate(range(1,18)):cv.drawRightString(W-70,675-i*31,str(self.chapters[n]))
  cv.save();writer=PdfWriter(clone_from=before);writer.pages[5].merge_page(PdfReader(overlay).pages[0])
  for i,n in enumerate(range(1,18)):
   annotation=writer.add_annotation(page_number=5,annotation=Link(rect=(65,660-i*31,W-65,690-i*31),target_page_index=self.chapters[n]-1,fit=Fit.fit()));annotation[NameObject('/Dest')]=ArrayObject([writer.pages[self.chapters[n]-1].indirect_reference,NameObject('/Fit')])
  writer.add_metadata({'/PHIOSReportId':'HD-R611-OWNER-'+self.fmt,'/PHIOSSourceReportReference':'HD-R65-OWNER-01','/PHIOSChartDigest':preview['chartDigest'],'/PHIOSLanguage':self.fmt,'/PHIOSPublication':'PRIVATE_OWNER_REVIEW_ONLY'})
  with open(file,'wb') as out:writer.write(out)
  assert len(PdfReader(str(file)).pages)==self.total
'''
source=(D/'../r68/render.py').read_text()
source=source.replace('hd-r68','hd-r611').replace('/r68','/r611').replace('R68','R611').replace('R6.8','R6.11')
needle="exec(compile(s,'R65-existing-export-adapter-with-R611-inputs','exec'),{'__name__':'__main__'})"
assert needle in source
patch=r'''
s=s.replace('class Poster(Flowable):',bridge+'\nclass Poster(Flowable):')
s=s.replace("self.canv.addOutlineEntry('SEC%02d'%f.number,","self.canv.addOutlineEntry(('SEC%02d · '%f.number)+(' / '.join([tocContract['section_titles'][f.number-1]['zh-Hans'],tocContract['section_titles'][f.number-1]['en']]) if self.fmt=='bilingual' else tocContract['section_titles'][f.number-1][self.fmt]),")
start=s.index(' s +=[Spacer(1,100)');end=s.index(" s +=[PageBreak(),P('计算所得",start)
s=s[:start]+" for n in range(1,6):s +=[FrontMatter(n,fmt),PageBreak()]\n s +=[Contents(fmt),PageBreak()]\n"+s[end:].replace(" s +=[PageBreak(),P('计算所得"," s +=[P('计算所得",1)
pos=s.index('\nmanifest=');s=s[:pos]+'\n'+addon+s[pos:]
s=s.replace("assert len(final.chapters)==17","assert len(final.chapters)==17;assert final.chapters==first.chapters;final.finish_toc(file)")
'''
source=source.replace(needle,patch+'\n'+needle)
import os
if os.environ.get('PHIOS_R611_LAYOUT_TEST')=='perturbation':source=source.replace(needle,"s=s.replace(\"for fmt in ['zh-Hans','en','bilingual']:\",\"for fmt in ['en']:\")\n"+needle)
exec(compile(source,'R611-configured-native-owner','exec'),{'__name__':'__main__','bridge':bridge,'addon':addon})
