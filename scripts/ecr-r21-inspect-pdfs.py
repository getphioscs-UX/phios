from pathlib import Path
import json,subprocess
from pypdf import PdfReader
from PIL import Image,ImageDraw
out=Path('tools/review/phi-configuration-deep-reading-r2-integrated/r2-1-gap-closure')
results=[]
for locale in ['zh-Hans','en','bilingual']:
    file=out/f'author-complete-{locale}.pdf'
    pdf=PdfReader(file)
    subprocess.run(['C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe','-png','-scale-to','650',str(file),str(out/f'print-{locale}')],check=True)
    pages=[]
    for i,p in enumerate(pdf.pages):
        text=p.extract_text()
        pages.append({'page':i+1,'widthPt':float(p.mediabox.width),'heightPt':float(p.mediabox.height),'characters':len(text),'replacementCharacter':'\ufffd' in text})
    sheet=Image.new('RGB',(880,2010),'#dce6e5');draw=ImageDraw.Draw(sheet)
    for i in range(len(pdf.pages)):
        img=Image.open(out/f'print-{locale}-{i+1:02}.png');img.thumbnail((210,305));x=i%4*220;y=i//4*335;sheet.paste(img,(x,y+20));draw.text((x+4,y+2),str(i+1),fill='#163b43')
    sheet.save(out/f'print-contact-{locale}.png')
    assert len(pdf.pages)==24
    assert all(p['characters']>40 and not p['replacementCharacter'] for p in pages)
    results.append({'locale':locale,'actualPages':len(pdf.pages),'mechanicalStatus':'PASS','authorMeaningApproval':'PENDING','completeStoryManuscriptsSupplied':False,'pages':pages})
(out/'pdf-verification.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps([{'locale':r['locale'],'pages':r['actualPages']}for r in results]))
