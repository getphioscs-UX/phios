import json, hashlib, unicodedata, re
from pathlib import Path
import subprocess
from pypdf import PdfReader
from PIL import Image,ImageDraw
r=Path(__file__).parent
p=r/'SYNTHETIC-BZR-HISTORICAL-CURRENT-REPLAY.pdf'
reader=PdfReader(p);doc=reader.pages;ir=json.loads((r/'CURRENT-REPLAY-IR.json').read_text(encoding='utf8'));checks=json.loads((r/'CURRENT-REPLAY-CHECKS.json').read_text(encoding='utf8'))
norm=lambda s: re.sub(r'\s+','',unicodedata.normalize('NFKC',s))
text='\n'.join(pg.extract_text() for pg in doc);missing=[];printed=0
for page in ir['publication']['pages']:
 for locale,spans in (page.get('content') or {}).items():
  if not isinstance(spans,list):continue
  for span in spans:
   if not isinstance(span,dict) or not span.get('text'):continue
   printed+=1
   if norm(span['text']) not in norm(text):missing.append({'page':page['pageNumber'],'locale':locale,'start':span.get('start'),'length':len(span['text'])})
toc=[]
def walk(items):
 for item in items:
  if isinstance(item,list):walk(item)
  else:toc.append({'title':item.title,'page':reader.get_destination_page_number(item)+1})
walk(reader.outline);targets=[10,17,22,29,33,44];tiles=[]
for n in targets:
 subprocess.run(['C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe','-f',str(n),'-l',str(n),'-singlefile','-scale-to','800','-png',str(p),str(r/f'PDF-P{n:02}')],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);im=Image.open(r/f'PDF-P{n:02}.png').convert('RGB');im.thumbnail((400,570));tile=Image.new('RGB',(420,610),'white');tile.paste(im,(10,30));ImageDraw.Draw(tile).text((10,8),f'Actual PDF P{n}',fill='black');tiles.append(tile)
contact=Image.new('RGB',(1260,1220),'#ccc')
for i,tile in enumerate(tiles):contact.paste(tile,((i%3)*420,(i//3)*610))
contact.save(r/'PDF-CONTACT.jpg')
result={'pages':len(doc),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'pageBoundaries':sorted(set((round(float(x.mediabox.width),2),round(float(x.mediabox.height),2))for x in doc)),'bookmarkCount':len(toc),'bookmarks':toc,'selectableTextCharacters':len(text),'printedBodySpansChecked':printed,'missingPrintedBodySpans':missing,'syntheticLabelExtractable':'SYNTHETIC QA' in text,'browserGeometry':checks.get('geometry'),'scope':'Current deterministic review renderer; native customer projection correctly rejects fixture/reviewOnly. Not final commercial print acceptance or full-manuscript-in-PDF assertion.','providerCalls':0,'providerCostUsd':0}
result['currentReplayStatus']='CURRENT_DETERMINISTIC_REPLAY_PASS' if len(doc)==48 and not checks['geometry']['overflowPages'] and not missing and toc else 'CURRENT_DETERMINISTIC_REPLAY_PARTIAL_WITH_PUBLICATION_DEFECTS'
(r/'PDF-INSPECTION.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8');checks['currentReplayStatus']=result['currentReplayStatus'];(r/'CURRENT-REPLAY-CHECKS.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({k:result[k]for k in ['pages','bytes','bookmarkCount','selectableTextCharacters','printedBodySpansChecked','missingPrintedBodySpans','currentReplayStatus']}))
