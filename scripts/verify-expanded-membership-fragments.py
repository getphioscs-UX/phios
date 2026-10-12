import pathlib,json,hashlib
from pypdf import PdfReader
import subprocess
root=pathlib.Path('C:/phios'); out=root/'tools/review/membership-ask-credit-r1'; rows=[]
registry=json.loads((root/'content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v12-candidate.json').read_text(encoding='utf-8'))
for book,section,pages in [('BOOK-4','S002',[7,8]),('BOOK-6','S001',[3,4])]:
 source=next(s for s in registry['records'] if s['bookCode']==book)
 pdf=root/f'.tmp/free-ask-manuscripts/source-candidates/books/book-{book[-1]}/source/PHI-OS-Book-{book[-1]}-v1.pdf'
 actual=hashlib.sha256(pdf.read_bytes()).hexdigest(); assert actual==source['sourceSha256']
 corpus=json.loads((root/source['localPath']).read_text(encoding='utf-8')); record=next(r for r in corpus['records'] if r['sectionCode'].endswith('-'+section))
 text=record['text']; end=text.rfind('。',0,400)+1; assert 200<end<400
 fragment=text[:end]; doc=PdfReader(pdf); native=''.join(doc.pages[p-1].extract_text() for p in pages)
 norm=lambda s:''.join(s.split()); assert norm(fragment) in norm(native)
 images=[]
 for page in pages:
  dest=out/f'expanded-{book}-{page}.png';subprocess.run([str(pathlib.Path('C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe')),'-f',str(page),'-l',str(page),'-r','72','-png','-singlefile',str(pdf),str(dest.with_suffix(''))],check=True);images.append(str(dest.relative_to(root)))
 rows.append({'bookCode':book,'sectionCode':record['sectionCode'],'sourceSha256':actual,'sourceVersion':source['version'],'sectionSha256':record['textSha256'],'startOffset':0,'endOffset':end,'text':fragment,'textSha256':hashlib.sha256(fragment.encode()).hexdigest(),'pdfPages':pages,'nativeCompleteSpanMatch':True,'images':images,'visualReview':'PENDING','ocrDependency':False,'diagramDependency':False})
(out/'EXPANDED-FRAGMENT-TEXT-PROOF.json').write_text(json.dumps({'rows':rows,'providerCalls':0},ensure_ascii=False,indent=2),encoding='utf-8')
print([(r['sectionCode'],r['endOffset']) for r in rows])
