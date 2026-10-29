"""Extract supplied candidate prose only; does not calculate or admit meaning."""
from html.parser import HTMLParser
from pathlib import Path
from zipfile import ZipFile
import json
class Capture(HTMLParser):
 def __init__(self):
  super().__init__();self.pages=[];self.page=None;self.lang=None;self.inp=False;self.text=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='section'and a.get('data-logical'):
   self.page={'logicalPageId':a['data-logical'],'languages':{'zh-Hans':[],'en':[]}};self.pages.append(self.page)
  if tag=='div'and a.get('data-language'):self.lang='zh-Hans'if a['data-language']=='zh'else'en'
  if tag=='p'and self.lang:self.inp=True;self.text=[]
 def handle_data(self,value):
  if self.inp:self.text.append(value)
 def handle_endtag(self,tag):
  if tag=='p'and self.inp:self.page['languages'][self.lang].append(''.join(self.text));self.inp=False
  if tag=='div'and self.lang:self.lang=None
archive=Path('C:/Users/Guest Account/Desktop/PHIOS_NUMEROLOGY_R27_SCHOOL_TRANSPARENT_HANDOFF.zip')
with ZipFile(archive)as source:html=source.read('PHIOS_NUMEROLOGY_R27_BODY_PRINT.html').decode('utf-8')
parser=Capture();parser.feed(html)
assert len(parser.pages)==19 and all(p['languages']['en']and p['languages']['zh-Hans']for p in parser.pages)
folder=Path('.tmp/numerology-r28');folder.mkdir(parents=True,exist_ok=True)
(folder/'R27-EDITORIAL.json').write_text(json.dumps(parser.pages,ensure_ascii=False,indent=2),encoding='utf-8')
print('19 supplied bilingual candidate pages extracted; no meaning admitted.')
