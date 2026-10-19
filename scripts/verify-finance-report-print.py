from pathlib import Path
import json, re, hashlib, shutil, subprocess, os
from html import unescape
from pypdf import PdfReader
from PIL import Image, ImageDraw
root=Path('.tmp/finance-report-render');results=[]
for lang,prefix in [('en','en'),('zh-Hans','zh')]:
    html=(root/f'report-{lang}.html').read_text(encoding='utf-8')
    pdf=root/f'report-{lang}.pdf';reader=PdfReader(pdf)
    text=''.join(p.extract_text() or '' for p in reader.pages)
    normalized=lambda s:re.sub(r'\s+','',s)
    sections=re.findall(r'<section>(.*?)</section>',html,re.S)
    assert len(sections)==12
    for section in sections:
        for chunk in re.findall(r'<(?:h2|p)>(.*?)</(?:h2|p)>',section,re.S):
            plain=unescape(re.sub('<[^>]+>','',chunk))
            assert normalized(plain) in normalized(text),f'{lang}: missing {plain[:60]}'
    assert '\ufffd' not in text
    namespace=hashlib.sha256(pdf.read_bytes()).hexdigest()[:12]
    pages=sorted(root.glob(f'{namespace}-{prefix}-page-*.png'))
    if len(pages)!=len(reader.pages):
        executable=os.environ.get('PHIOS_PDFTOPPM') or shutil.which('pdftoppm') or str(Path.home()/'.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe')
        subprocess.run([executable,'-scale-to','1000','-png',str(pdf),str(root/f'{namespace}-{prefix}-page')],check=True,capture_output=True)
        pages=sorted(root.glob(f'{namespace}-{prefix}-page-*.png'))
    assert len(pages)==len(reader.pages)>0
    sheet=Image.new('RGB',(1560,760*((len(pages)+2)//3)),'#ddd')
    for i,file in enumerate(pages):
        im=Image.open(file).convert('RGB');im.thumbnail((500,710));sheet.paste(im,((i%3)*520+10,(i//3)*760+10))
    sheet.save(f'docs/financial-preparation/REPORT-{lang}-PAGES.png')
    results.append({'language':lang,'pages':len(pages),'sections':12,'everySectionTextReconciled':True,'htmlSha256':hashlib.sha256(html.encode()).hexdigest(),'pdfSha256':hashlib.sha256(pdf.read_bytes()).hexdigest(),'visualReview':'PENDING','source':'AUTHENTICATED_STORED_HTML_DOWNLOAD','environment':'LOCAL_SYNTHETIC'})
Path('docs/financial-preparation/REPORT-PRINT-EVIDENCE.json').write_text(json.dumps({'status':'PASS_LOCAL_TEXT_PENDING_PAGE_REVIEW','results':results,'providerCalls':0,'productionMutations':0},indent=2)+'\n',encoding='utf-8',newline='\n')
print('12 sections per language reconcile with actual PDF text; page inspection pending')
