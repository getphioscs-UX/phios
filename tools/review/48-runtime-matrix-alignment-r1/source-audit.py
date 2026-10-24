from pathlib import Path
import json,hashlib,re
from pypdf import PdfReader
base=Path(__file__).parent;base.mkdir(exist_ok=True)
sha=lambda b:hashlib.sha256(b).hexdigest()
files=[Path('C:/Users/Guest Account/Desktop/PHI-OS-Book-6-v1.pdf'),Path('C:/Users/Guest Account/Desktop/PHI-OS-Book-6-en-v1.pdf')]
results=[]
for file in files:
 if not file.exists():results.append({'path':str(file),'state':'SOURCE_NOT_AVAILABLE'});continue
 reader=PdfReader(file);pages=[]
 for i,page in enumerate(reader.pages):
  text=page.extract_text() or ''
  if re.search(r'13\s*[.．]\s*8[45]|Forty.Eight Runtime Projection|Possibility Space and Observation',text,re.I):pages.append({'pdfPage':i+1,'text':text})
 results.append({'path':str(file),'sha256':sha(file.read_bytes()),'pages':len(reader.pages),'matches':pages,'state':'LOCAL_SOURCE_BYTES_READ_ACCEPTANCE_LINK_TO_BE_CHECKED'})
(base/'PUBLICATION-SOURCE-AUDIT.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps([{'path':x['path'],'sha':x.get('sha256'),'pages':x.get('pages'),'matchingPages':[p['pdfPage'] for p in x.get('matches',[])]} for x in results]))
