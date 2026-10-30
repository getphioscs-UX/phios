"""Keep variant HTML scoped to its actual four-page printed proof."""
from html.parser import HTMLParser
from pathlib import Path
import json
focus={'P10','P12','P19','P20'};rows=[]
class Sheets(HTMLParser):
 def __init__(self,text):
  super().__init__(convert_charrefs=False);self.text=text;self.offsets=[0];self.depth=0;self.active=None;self.ranges=[]
  for line in text.splitlines(keepends=True):self.offsets.append(self.offsets[-1]+len(line))
 def pos(self):
  line,col=self.getpos();return self.offsets[line-1]+col
 def handle_starttag(self,tag,attrs):
  if tag!='section':return
  self.depth+=1;a=dict(attrs)
  if 'sheet'in a.get('class','').split():self.active=(self.depth,self.pos(),a.get('data-page-id'))
 def handle_endtag(self,tag):
  if tag!='section':return
  if self.active and self.active[0]==self.depth:
   self.ranges.append((self.active[1],self.pos()+len('</section>'),self.active[2]));self.active=None
  self.depth-=1
for subject in['B','C','D']:
 for locale in['zh-Hans','en','bilingual']:
  p=Path('output/pdf/numerology-r30')/subject/locale/'REPORT.html';text=p.read_text(encoding='utf-8');parser=Sheets(text);parser.feed(text)
  kept=[r for r in parser.ranges if r[2]in focus];assert len(kept)==4
  assert len(parser.ranges)in[4,33]
  for start,end,id in reversed(parser.ranges):
   if id not in focus:text=text[:start]+text[end:]
  before=p.stat().st_size;p.write_text(text,encoding='utf-8')
  rows.append({'subject':subject,'locale':locale,'beforeBytes':before,'afterBytes':p.stat().st_size,'previewSheets':4,'nativeDiagramSVGs':len(list((p.parent/'diagrams').glob('*.svg'))),'pdfModified':False})
Path('tools/review/numerology-r30/VARIANT-PREVIEW-SCOPE.json').write_text(json.dumps(rows,indent=2),encoding='utf-8')
print(json.dumps({'previews':len(rows),'removedUnusedHTMLBytes':sum(x['beforeBytes']-x['afterBytes']for x in rows),'pdfsChanged':0}))
