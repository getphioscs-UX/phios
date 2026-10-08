from pathlib import Path
import json, re
import pypdfium2 as pdfium
from pypdf import PdfReader
from PIL import Image, ImageDraw

root=Path('content/professional/ast-full-production/publication/r1r2')
plan=json.loads((root/'page-plan.json').read_text(encoding='utf-8'))
file=Path('tools/review/AST-VFR-R1R2-TL-PRINT-REVIEW.pdf')
reader=PdfReader(file)
all_text=''.join(page.extract_text() or '' for page in reader.pages)
compact=re.sub(r'\s+','',all_text)
missing=[]
for page in plan['pages']:
    for part in page['parts']:
        text=re.sub(r'\s+','',part['text'])
        if text not in compact:
            missing.append({'page':page['pageNumber'],'part':part['blockId'],'offset':part['offset']})
doc=pdfium.PdfDocument(file)
for start in range(0,len(doc),16):
    sheet=Image.new('RGB',(1040,1512),'#102737')
    draw=ImageDraw.Draw(sheet)
    for idx in range(start,min(start+16,len(doc))):
        image=doc[idx].render(scale=.42).to_pil().convert('RGB')
        image.thumbnail((250,354))
        x=(idx-start)%4*260+5
        y=(idx-start)//4*378+19
        sheet.paste(image,(x,y))
        draw.text((x,y-15),f'P{idx+1:02}',fill='#e5d4b4')
    sheet.save(f'tools/review/AST-VFR-R1R2-PRINT-CONTACT-{start//16+1}.png')
for page in plan['pages']:
    if page['diagramIds'] and page['diagramIds'][0] in ['AST-D01','AST-D06','AST-D11']:
        image=doc[page['pageNumber']-1].render(scale=1.25).to_pil()
        image.save(f"tools/review/AST-VFR-R1R2-PRINT-{page['diagramIds'][0]}.png")
receipt={'status':'PASS' if not missing and len(doc)==len(plan['pages']) else 'FAIL','actualPageCount':len(doc),'acceptedTextMissing':missing,'allPagesRendered':True,'providerCalls':0}
(root/'pdf-content-receipt.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(receipt,ensure_ascii=False))
assert receipt['status']=='PASS'
