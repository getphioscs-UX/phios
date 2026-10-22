import json, re, logging
from pathlib import Path
import pypdfium2 as pdfium
import pdfplumber
logging.getLogger('pdfminer').setLevel(logging.ERROR)
root=Path(__file__).resolve().parents[3]
receipt=root/'tools/review/knowledge-answer-quality-r1/ENGLISH-SOURCE-READABILITY.json'
data=json.loads(receipt.read_text(encoding='utf-8'))
scratch=Path(data['privateScratchDirectory'])
results=[]
for row in data['records']:
    pdf=pdfium.PdfDocument(row['fullPath'])
    image=pdf[2].render(scale=1.6).to_pil()
    dest=scratch/(row['bookCode'].lower()+'-page3-pdfium.png')
    image.save(dest)
    pdf.close()
    headings=[]
    with pdfplumber.open(row['fullPath']) as book:
        sample_indices=sorted(set([2,len(book.pages)//2,len(book.pages)-3]))
        for i in sample_indices:
            page=book.pages[i]
            # Existing manuscript extraction convention: remove identical glyph overprints.
            clean=page.dedupe_chars(tolerance=1)
            words=clean.extract_words(extra_attrs=['size'])
            large=[w for w in words if w['size']>=15]
            lines={}
            for w in large:lines.setdefault(round(w['top']/3)*3,[]).append(w)
            for top,ws in sorted(lines.items()):
                title=' '.join(w['text'] for w in sorted(ws,key=lambda w:w['x0']))
                if len(title)>4:headings.append({'physicalPage':i+1,'top':top,'text':title,'sizeMax':round(max(w['size'] for w in ws),2)})
    private_path=scratch/(row['bookCode'].lower()+'-layout-headings.json')
    private_path.write_bytes(json.dumps(headings,ensure_ascii=False,indent=2).encode('utf-8'))
    results.append({'bookCode':row['bookCode'],'sampledPhysicalPages':[i+1 for i in sample_indices],'fontHeadingCandidateLinesInSamples':len(headings),'privateHeadingPath':str(private_path),'independentPage3Render':str(dest),'method':'SAMPLED_DEDUPLICATED_GLYPHS_FONT_SIZE_GE15_NOT_FULL_CHAPTER_INDEX_OR_SEMANTIC_ACCEPTANCE'})
    print(json.dumps(results[-1]),flush=True)
(root/'tools/review/knowledge-answer-quality-r1/ENGLISH-SOURCE-LAYOUT.json').write_bytes(json.dumps({'records':results,'bodyCopiedToRepository':False},indent=2).encode('utf-8'))
