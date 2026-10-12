import json, hashlib, re, subprocess
from pathlib import Path
from pypdf import PdfReader
root=Path('C:/phios');out=root/'tools/review/membership-ask-credit-r1'
registry=json.loads((root/'content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v12-candidate.json').read_text(encoding='utf-8'))
s=next(x for x in registry['records'] if x['bookCode']=='BOOK-5');pdf=Path('C:/Users/Guest Account/Desktop/PHI-OS-Book-5-v1.pdf')
assert hashlib.sha256(pdf.read_bytes()).hexdigest()==s['sourceSha256'],'CURRENT_PDF_IDENTITY_CHANGED'
c=json.loads((root/s['localPath']).read_text(encoding='utf-8'));r=next(x for x in c['records'] if x['sectionCode']=='B5-S001');end=r['text'].index('\f');text=r['text'][:end]
page=PdfReader(pdf).pages[2].extract_text();fold=lambda t:re.sub(r'\s+','',t)
assert fold(text) in fold(page),'NATIVE_FRAGMENT_NOT_CONTIGUOUS_ON_PDF_PAGE3'
exe=Path('C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe')
subprocess.run([str(exe),'-f','3','-l','3','-singlefile','-scale-to','1600','-png',str(pdf),str(out/'book5-fragment-page3')],check=True)
proof={'bookCode':'BOOK-5','sectionCode':r['sectionCode'],'sourceSha256':s['sourceSha256'],'sourceVersion':s['version'],'sectionSha256':r['textSha256'],'startOffset':0,'endOffset':end,'text':text,'textSha256':hashlib.sha256(text.encode()).hexdigest(),'pdfPages':[3],'nativeCompleteSpanMatch':True,'visualReview':'PENDING','ocrDependency':False,'diagramDependency':False,'image':str(out/'book5-fragment-page3.png')}
(out/'BOOK5-FRAGMENT-TEXT-PROOF.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps({'fragmentChars':end,'nativeMatch':True,'visual':'PENDING'}))
