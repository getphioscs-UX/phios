from pathlib import Path
import json, re
from pypdf import PdfReader
import pypdfium2 as pdfium
from PIL import Image, ImageDraw
base=Path('content/professional/ast-full-production/publication/r1r3')
plan=json.loads((base/'page-plan.json').read_text(encoding='utf-8'))['pages']
ir=json.loads((base/'bilingual-publication-ir.json').read_text(encoding='utf-8'))
file=Path('tools/review/AST-VFR-R1R3-TL-BILINGUAL-PRINT-REVIEW.pdf')
reader=PdfReader(file)
compact=lambda s:re.sub(r'\s+','',s)
text=compact(''.join(p.extract_text() or '' for p in reader.pages))
missing=[]
for section in ir['sections']:
    for locale in ['zhHans','en']:
        for block in section['localeBlocks'][locale]:
            for i,paragraph in enumerate(block['paragraphs']):
                if compact(paragraph) not in text:missing.append([locale,block['blockId'],i])
doc=pdfium.PdfDocument(file)
for start in range(0,len(doc),16):
    sheet=Image.new('RGB',(1040,1512),'#142e3e');draw=ImageDraw.Draw(sheet)
    for idx in range(start,min(start+16,len(doc))):
        image=doc[idx].render(scale=.42).to_pil().convert('RGB');image.thumbnail((250,354))
        x=(idx-start)%4*260+5;y=(idx-start)//4*378+19
        sheet.paste(image,(x,y));draw.text((x,y-15),f'P{idx+1:02}',fill='white')
    sheet.save(f'tools/review/AST-VFR-R1R3-PRINT-CONTACT-{start//16+1}.png')
receipt={'status':'PASS' if not missing and len(doc)==len(plan) else 'FAIL','actualPageCount':len(doc),'missingParagraphs':missing,'allPagesRendered':True,'a4':all(abs(float(p.mediabox.width)-595.28)<2 and abs(float(p.mediabox.height)-841.89)<2 for p in reader.pages),'providerCalls':0}
(base/'pdf-content-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8')
print(json.dumps(receipt));assert receipt['status']=='PASS' and receipt['a4']
