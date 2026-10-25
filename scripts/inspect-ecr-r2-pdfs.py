from pathlib import Path
import json
import subprocess
from pypdf import PdfReader
from PIL import Image, ImageOps, ImageDraw
root=Path('tools/review/phi-configuration-deep-reading-r2-integrated')
results=[]
for locale in ['zh-Hans','en','bilingual']:
    pdf=PdfReader(root/f'review-{locale}.pdf')
    subprocess.run(['C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe','-scale-to','650','-png',str(root/f'review-{locale}.pdf'),str(root/f'pdf-{locale}')],check=True)
    pages=[]
    for i,page in enumerate(pdf.pages):
        text=page.extract_text()
        pages.append({'page':i+1,'widthPt':float(page.mediabox.width),'heightPt':float(page.mediabox.height),'characters':len(text),'hasReviewLabel':'REVIEW' in text,'hasReplacementCharacter':'\ufffd' in text})
    sheet=Image.new('RGB',(1000,1450),'#d8e1e4')
    draw=ImageDraw.Draw(sheet)
    for i in range(len(pdf.pages)):
        image=Image.open(root/f'pdf-{locale}-{i+1:02}.png')
        image.thumbnail((240,340))
        x=(i%4)*250;y=(i//4)*480
        sheet.paste(image,(x,y+25));draw.text((x+5,y+5),f'{locale} / {i+1}',fill='#17333b')
    sheet.save(root/f'contact-{locale}.png')
    results.append({'locale':locale,'actualPages':len(pdf.pages),'pages':pages,'status':'PASS_MECHANICAL' if len(pdf.pages)==10 and all(p['hasReviewLabel'] and not p['hasReplacementCharacter'] for p in pages) else 'FAIL','humanVisualApproval':'PENDING'})
(root/'pdf-results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps([{'locale':r['locale'],'pages':r['actualPages'],'status':r['status']} for r in results]))
