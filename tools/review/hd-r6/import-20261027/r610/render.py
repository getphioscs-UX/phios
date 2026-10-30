"""Configure the existing R68/R65 PDF owner; use the exact HTML SVG for diagrams."""
import pathlib,json,hashlib,sys
D=pathlib.Path(__file__).parent
for n in ['BODYGRAPH-GEOMETRY.json','R2-ASSET-MANIFEST.json','SEC11-OWNER-VISUAL-ACCEPTANCE.json']:
 (D/n).write_bytes((D/'../r68'/n).read_bytes())
bridge=r'''
import xml.etree.ElementTree as ET
ExistingGraphic=Graphic
class Graphic(ExistingGraphic):
 def __init__(self,kind,section=None):
  super().__init__(kind,section)
  if kind not in ['bodygraph','activation']:self.height=602
 def draw(self):
  if self.kind in ['bodygraph','activation']:return ExistingGraphic.draw(self)
  caseId=next(r['id'] for r in j(D/'CONTRASTING-CHARTS.json')['rows'] if r['chartDigest']==preview['chartDigest']);root=ET.fromstring((D/'diagrams'/(caseId+'-'+self.kind+'.svg')).read_text(encoding='utf-8'));cv=self.canv;cv.saveState();cv.translate(15,0);cv.scale(455/794,602/1050)
  def color(v):return HexColor(v) if v and v!='none' else None
  for node in root:
   k=node.tag.rsplit('}',1)[-1];a=node.attrib;num=lambda k,default=0:float(a.get(k,default));stroke=color(a.get('stroke'));fill=color(a.get('fill'));cv.setLineWidth(num('stroke-width',1));cv.setDash([float(v) for v in a.get('stroke-dasharray','').split()] or [])
   if stroke:cv.setStrokeColor(stroke)
   if fill:cv.setFillColor(fill)
   if k=='rect':cv.roundRect(num('x'),1050-num('y')-num('height'),num('width'),num('height'),num('rx'),fill=bool(fill),stroke=bool(stroke))
   elif k=='circle':cv.circle(num('cx'),1050-num('cy'),num('r'),fill=bool(fill),stroke=bool(stroke))
   elif k=='line':cv.line(num('x1'),1050-num('y1'),num('x2'),1050-num('y2'))
   elif k=='text':
    cv.setFont('Noto',num('font-size',22));method={'middle':cv.drawCentredString,'end':cv.drawRightString}.get(a.get('text-anchor'),cv.drawString);method(num('x'),1050-num('y'),node.text or '')
  cv.restoreState()
'''
# The established adapter contains the accepted pagination/bookmark fixes.
source=(D/'../r68/render.py').read_text(encoding='utf-8')
source=source.replace('hd-r68','hd-r610').replace('/r68','/r610').replace('R68','R610').replace('R6.8','R6.10')
# Do not replace the original R65 base module or modify historical adapter bytes.
needle="exec(compile(s,'R65-existing-export-adapter-with-R610-inputs','exec'),{'__name__':'__main__'})"
assert needle in source
source=source.replace(needle,"s=s.replace('class Poster(Flowable):',bridge+'\\nclass Poster(Flowable):')\n"+needle)
exec(compile(source,'R68-existing-configuration-with-R610-selected-input','exec'),{'__name__':'__main__','bridge':bridge})
