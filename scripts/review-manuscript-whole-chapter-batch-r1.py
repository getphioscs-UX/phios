import json, hashlib, re, unicodedata
from pathlib import Path
import pdfplumber, pypdfium2 as pdfium
from PIL import Image, ImageDraw

root=Path('tools/review/free-ask-manuscript-r1')
target=root/'whole-chapter-batch-r1'; target.mkdir(exist_ok=True)
cases=[('BOOK-1','B1V3-P1-S006','C:/Users/Guest Account/Desktop/PHI-OS-Book-I-v3.pdf','.tmp/knowledge-manuscripts/book-1-v3-revision-33c91cd60d5f/retrieval-corpus.json'),('BOOK-3','CM-B3V1-P8-S001','C:/Users/Guest Account/Desktop/PHI-OS-Book-3-v1.pdf','.tmp/knowledge-manuscripts/book-3-owner-final-20261011-efbfdd21fa21/positioned-candidate/retrieval-corpus.json'),('BOOK-5','B5-S002','C:/Users/Guest Account/Desktop/PHI-OS-Book-5-v1.pdf','.tmp/knowledge-manuscripts/book-5-v1/positioned-candidate-r2/retrieval-corpus.json')]
def norm(t): return re.sub(r'\s+','',unicodedata.normalize('NFKC',t))
results=[]
for book,section,pdfpath,corpuspath in cases:
    corpus=json.loads(Path(corpuspath).read_text(encoding='utf8')); record=next(r for r in corpus['records'] if r['sectionCode']==section)
    binary=hashlib.sha256(Path(pdfpath).read_bytes()).hexdigest(); assert binary==corpus['sourceSha256']
    with pdfplumber.open(pdfpath) as pdf:
        pages=[]; images=[]
        native=[]
        render=pdfium.PdfDocument(pdfpath)
        for n in range(record['startPage'],record['endPage']+1):
            p=pdf.pages[n-1]; text=p.extract_text() or ''; native.append(text)
            pages.append({'pdfPage':n,'imageObjects':len(p.images),'textChars':len(text),'printedFooter':(text.splitlines()[-1:] or [''])[0]})
            img=render[n-1].render(scale=1.2).to_pil().convert('RGB')
            img.thumbnail((710,1100)); canvas=Image.new('RGB',(730,1140),'white');canvas.paste(img,(10,30));ImageDraw.Draw(canvas).text((10,8),f'{book} PDF PAGE {n}',fill='black'); images.append(canvas)
        cols=2; sheet=Image.new('RGB',(730*cols,1140*((len(images)+1)//cols)), '#cccccc')
        for i,img in enumerate(images):sheet.paste(img,((i%cols)*730,(i//cols)*1140))
        out=target/f'{book}-source-pages.png';sheet.save(out)
        combined=norm('\n'.join(native)); expected=norm(record['text'])
        # Native layers differ in line segmentation; compare complete sentences,
        # including the chapter end, rather than treating a text-length ratio as proof.
        body=record['text'].split('\n',1)[1]
        sentences=[norm(s) for s in re.split(r'(?<=[。！？!?])',body) if len(norm(s))>5]
        missing=[s for s in sentences if s not in combined]
        results.append({'bookCode':book,'sectionCode':section,'sourceSha256':binary,'corpusPath':corpuspath,'sectionSha256':record['textSha256'],'pages':pages,'wholeSentenceCount':len(sentences),'sentencesFoundInNativePages':len(sentences)-len(missing),'missingSentences':missing,'fullBodyNativeSentenceMatch':not missing,'diagramOrFootnoteDependency':'VISUAL_REVIEW_REQUIRED_NOT_INFERRED_FROM_IMAGE_COUNT','visualReceipt':str(out).replace('\\','/'),'chapterStartAndEnd':{'start':norm(body)[:160],'end':norm(body)[-200:]},'providerCalls':0})
Path(target/'SOURCE-PAGE-COMPARISON.json').write_text(json.dumps({'scope':'THREE_WHOLE_CHAPTERS_READ_ONLY_PDF_PAGE_CHECK_NOT_WHOLE_BOOK_REEXTRACTION','results':results,'providerCalls':0},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps([{'book':r['bookCode'],'chapter':r['sectionCode'],'sentences':r['wholeSentenceCount'],'missing':len(r['missingSentences']),'visual':r['visualReceipt']} for r in results],ensure_ascii=False))
