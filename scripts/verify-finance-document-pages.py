from pathlib import Path
import json, zipfile, re
from pypdf import PdfReader
from PIL import Image, ImageOps, ImageDraw
root=Path('.tmp/finance-document-render')
reader=PdfReader(root/'synthetic-will.pdf')
texts=[p.extract_text() or '' for p in reader.pages]
all_text=''.join(texts)
assert all_text.count('Synthetic layout specimen only.')==80
assert '合成客户陈甲' in all_text and 'Signature layout specimen' in all_text
assert '\ufffd' not in all_text
with zipfile.ZipFile(root/'synthetic-will.docx') as z:
    document=z.read('word/document.xml').decode('utf-8')
assert document.count('Synthetic layout specimen only.')==80
assert '合成客户陈甲' in document
pages=sorted(root.glob('page-*.png'))
assert len(pages)==len(reader.pages)>1
thumbs=[]
for path in pages:
    image=Image.open(path).convert('RGB');image.thumbnail((500,720))
    canvas=Image.new('RGB',(520,760),'#e5e5e5');canvas.paste(image,((520-image.width)//2,25));ImageDraw.Draw(canvas).text((12,735),path.name,fill='black');thumbs.append(canvas)
sheet=Image.new('RGB',(520*min(3,len(thumbs)),760*((len(thumbs)+2)//3)),'white')
for i,image in enumerate(thumbs):sheet.paste(image,((i%3)*520,(i//3)*760))
sheet.save('docs/financial-preparation/DOCUMENT-PAGES.png')
evidence=Path('docs/financial-preparation/DOCUMENT-RENDER-EVIDENCE.json')
record=json.loads(evidence.read_text(encoding='utf-8'))
record.update({'status':'PASS_LOCAL_TEXT_RECONCILIATION_RENDERED_FOR_VISUAL_REVIEW','pages':len(pages),'pdfCjkExtracted':True,'docxCjkXmlPresent':True,'paragraphCountPdf':80,'paragraphCountDocx':80,'visualReview':'PENDING','nativeWordReopen':'NOT_RUN','productionLegalApproval':False})
word_pdf=root/'word-render.pdf'
if word_pdf.exists():
    word=PdfReader(word_pdf)
    word_text=''.join(p.extract_text() or '' for p in word.pages)
    assert word_text.count('Synthetic layout specimen only.')==80 and '合成客户陈甲' in word_text
    word_pages=sorted(root.glob('word-page-*.png'))
    assert len(word_pages)==len(word.pages)
    word_sheet=Image.new('RGB',(1560,760*((len(word_pages)+2)//3)),'#ddd')
    for i,file in enumerate(word_pages):
        im=Image.open(file).convert('RGB');im.thumbnail((500,710));word_sheet.paste(im,((i%3)*520+10,(i//3)*760+10))
    word_sheet.save('docs/financial-preparation/DOCX-WORD-PAGES.png')
    record.update({'nativeWordReopen':'PASS_LOCAL_READ_ONLY','wordPages':len(word.pages),'wordCjkAndParagraphsReconciled':True,'wordVisualReview':'PENDING','paginationParity':'DIFFERENT_RENDERERS; identical 80 paragraphs; no identical page-count claim'})
evidence.write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('PDF pages:',len(pages),'CJK and 80 paragraphs reconcile with DOCX; visual inspection pending.')
