import json,re,hashlib,subprocess
from pathlib import Path
import pdfplumber
from pypdf import PdfReader
from PIL import Image,ImageOps,ImageDraw
d=Path('tools/review/hd-r6/import-20261027/r62')
temp=Path('.tmp/hd-r62/pdf-pages');temp.mkdir(parents=True,exist_ok=True)
manifest=json.loads((d/'PDF-MANIFEST.json').read_text(encoding='utf-8'))
poppler=Path('C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe')
norm=lambda s: re.sub(r'\s+','',s)
results=[]
for item in manifest['files']:
    lang=item['language'];p=Path(item['path']);r=PdfReader(p)
    projection=json.loads((d/f'PDF-PROJECTION-{lang}.json').read_text(encoding='utf-8'))
    clean=[];pages=[];bounds=[]
    with pdfplumber.open(p) as doc:
        for i,page in enumerate(doc.pages):
            text=page.extract_text(x_tolerance=2,y_tolerance=3) or ''
            body='\n'.join(line for line in text.splitlines() if line not in ['PHI OS','OWNER REVIEW / NOT FOR COMMERCIAL DISTRIBUTION'] and not re.fullmatch(r'\d+ / \d+',line))
            clean.append(body)
            words=page.extract_words()
            bad=[{'text':w['text'],'x0':w['x0'],'x1':w['x1'],'top':w['top'],'bottom':w['bottom']} for w in words if w['x0']<35 or w['x1']>page.width-35 or w['top']<12 or w['bottom']>page.height-20]
            bounds.extend([{'page':i+1,'words':bad}] if bad else [])
            pages.append({'page':i+1,'chars':len(body),'watermark':'OWNER REVIEW / NOT FOR COMMERCIAL DISTRIBUTION' in text,'words':len(words)})
    joined=norm('\n'.join(clean))
    display=lambda s: re.sub(r'\*\*([\s\S]*?)\*\*',r'\1',s)
    missing=[x['id'] for x in projection['paragraphs'] if norm(display(x['text'])) not in joined]
    locations=[joined.find(norm(display(next(x['text'] for x in projection['paragraphs'] if x['id']==id)))) for id in projection['renderOrder']]
    ordered=locations==sorted(locations) and all(x>=0 for x in locations)
    isolation=not re.search(r'[\u4e00-\u9fff]',joined) if lang=='en' else True
    forbidden=[x for x in ['Inner Vision','内在视觉','HD-UA-COGNITION-4','OWNER_AUTHORING_ACCEPTED','SHA256','JSON Pointer'] if x in '\n'.join(clean)]
    subprocess.run([str(poppler),'-scale-to','1000','-png',str(p),str(temp/lang)],check=True,capture_output=True)
    pngs=sorted(temp.glob(lang+'-*.png'),key=lambda f:int(f.stem.rsplit('-',1)[1]))
    sheets=[]
    for start in range(0,len(pngs),6):
        sheet=Image.new('RGB',(1100,2400),'#e6e8e7');draw=ImageDraw.Draw(sheet)
        for k,imgpath in enumerate(pngs[start:start+6]):
            im=Image.open(imgpath).convert('RGB');im.thumbnail((530,750));x=(k%2)*550+(550-im.width)//2;y=(k//2)*800+30
            sheet.paste(im,(x,y));draw.text(((k%2)*550+15,(k//2)*800+6),f'{lang} page {start+k+1}',fill='black')
        name=d/f'visual-contact-{lang}-{start//6+1}.png';sheet.save(name);sheets.append(str(name))
    for page in [1,2,len(r.pages)//2,len(r.pages)]:
        src=pngs[page-1];Image.open(src).save(d/f'final-page-{lang}-{page}.png')
    result={'language':lang,'pages':len(r.pages),'selectedParagraphs':len(projection['paragraphs']),'missingParagraphs':missing,'exactVerbatimAfterWhitespaceAndMarkdownEmphasisNormalization':not missing,'formattingOnlyTransform':'Strip paired ** emphasis delimiters; original source prose/hash unchanged','renderOrderCorrect':ordered,'languageIsolation':isolation,'boundsFailures':bounds,'forbiddenLeaks':forbidden,'allWatermarked':all(x['watermark'] for x in pages),'pageDetails':pages,'contactSheets':sheets,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
    result['status']='PASS_MACHINE_TEXT_AND_GEOMETRY_VISUAL_REVIEW_PENDING' if not missing and ordered and isolation and not bounds and not forbidden and result['allWatermarked'] else 'FAIL'
    results.append(result)
(d/'PDF-QA.json').write_text(json.dumps({'results':results,'scope':'Full selected text/order/geometry; visual contact sheets must also be inspected'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps([{k:x[k] for k in ['language','pages','selectedParagraphs','missingParagraphs','renderOrderCorrect','languageIsolation','boundsFailures','status']} for x in results],ensure_ascii=False))
if any(x['status']=='FAIL' for x in results):raise SystemExit(1)
