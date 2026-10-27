import json,re,hashlib,subprocess
from pathlib import Path
import pdfplumber
from PIL import Image,ImageDraw
d=Path('tools/review/hd-r6/import-20261027/r63');temp=Path('.tmp/hd-r63/pages');temp.mkdir(parents=True,exist_ok=True)
manifest=json.loads((d/'PDF-MANIFEST.json').read_text());poppler=Path('C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe')
norm=lambda s:re.sub(r'\s+','',s)
display=lambda s:re.sub(r'\*\*([\s\S]*?)\*\*',r'\1',s)
results=[]
for f in manifest['files']:
    fmt=f['format'];p=Path(f['path']);projection=json.loads((d/f'PROJECTION-{fmt}.json').read_text());pageTexts=[];pageStats=[];lineMap=[];cursor=0;bounds=[]
    with pdfplumber.open(p) as pdf:
        for n,page in enumerate(pdf.pages):
            full=page.extract_text() or ''
            if n<f['bodyPages']:
                body=page.within_bbox((35,45,page.width-35,page.height-60));text=body.extract_text(x_tolerance=2,y_tolerance=3) or '';pageTexts.append(text)
                for line in text.splitlines():
                    k=len(norm(line));lineMap.append({'page':n+1,'start':cursor,'end':cursor+k});cursor+=k
                chars=body.chars;used=max((c['bottom'] for c in chars),default=45)-min((c['top'] for c in chars),default=45)
                pageStats.append({'page':n+1,'chars':len(norm(text)),'usedHeight':round(used,2),'sparse':n>0 and used<150})
            words=page.extract_words();bad=[w['text'] for w in words if w['x0']<35 or w['x1']>page.width-35 or w['top']<12 or w['bottom']>page.height-20]
            if bad:bounds.append({'page':n+1,'words':bad})
            assert 'OWNER REVIEW / NOT FOR COMMERCIAL DISTRIBUTION' in full
    joined=norm(''.join(pageTexts));missing=[];positions=[];splits=[]
    for pid in projection['renderOrder']:
        para=next(p for p in projection['paragraphs'] if p['id']==pid);text=norm(display(para['text']));start=joined.find(text);positions.append(start)
        if start<0:missing.append(pid);continue
        touched={}
        for line in lineMap:
            if line['end']>start and line['start']<start+len(text):touched[line['page']]=touched.get(line['page'],0)+1
        if len(touched)>1:splits.append({'id':pid,'pageLineCounts':touched,'widowOrOrphan':any(c<3 for c in touched.values())})
    leaks=[x for x in ['Inner Vision','内在视觉','HD-UA-COGNITION-4','OWNER_AUTHORING_ACCEPTED','Book of Destinies'] if x in '\n'.join(pageTexts)]
    languageIsolation=fmt!='en' or not re.search(r'[\u4e00-\u9fff]',joined)
    subprocess.run([str(poppler),'-scale-to','900','-png',str(p),str(temp/fmt)],check=True,capture_output=True)
    pngs=sorted([p for p in temp.glob(fmt+'-*.png') if int(p.stem.rsplit('-',1)[1])<=f['pages']],key=lambda p:int(p.stem.rsplit('-',1)[1]));assert len(pngs)==f['pages'];sheets=[]
    for start in range(0,len(pngs),9):
        sheet=Image.new('RGB',(1650,2350),'#edf0ee');draw=ImageDraw.Draw(sheet)
        for i,imgpath in enumerate(pngs[start:start+9]):
            im=Image.open(imgpath).convert('RGB');im.thumbnail((530,735));x=(i%3)*550+(550-im.width)//2;y=(i//3)*780+25;sheet.paste(im,(x,y));draw.text(((i%3)*550+10,(i//3)*780+4),f'{fmt} page {start+i+1}',fill='black')
        name=d/f'pdf-contact-{fmt}-{start//9+1}.png';sheet.save(name);sheets.append(str(name))
    for n in [2,f['bodyPages']]:Image.open(pngs[n-1]).save(d/f'final-{fmt}-page-{n}.png')
    result={'format':fmt,'pages':f['pages'],'bodyPages':f['bodyPages'],'paragraphs':len(projection['paragraphs']),'missingParagraphs':missing,'correctOrder':all(x>=0 for x in positions) and positions==sorted(positions),'languageIsolation':languageIsolation,'forbiddenLeaks':leaks,'boundsFailures':bounds,'splitParagraphs':splits,'widowOrphanFailures':[s for s in splits if s['widowOrOrphan']],'bodyPageStats':pageStats,'sparseContinuations':[s for s in pageStats if s['sparse']],'artSHA256':[a['sha256'] for a in f['artPages']],'contactSheets':sheets}
    result['status']='PASS_MACHINE_REVIEW_VISUAL_PENDING' if not missing and result['correctOrder'] and languageIsolation and not leaks and not bounds and not result['widowOrphanFailures'] else 'FAIL'
    results.append(result)
reg=json.loads((d/'RENDERER-REGRESSION.json').read_text());default=[]
for mode in ['review-default','released-with-review-option']:
    a=next(x['file'] for x in reg['files'] if x['mode']==mode and x['version']=='before');b=next(x['file'] for x in reg['files'] if x['mode']==mode and x['version']=='after')
    def geometry(p):
        with pdfplumber.open(p) as pdf:return [[(c['text'],round(c['x0'],5),round(c['top'],5),round(c['x1'],5),round(c['bottom'],5)) for c in page.chars] for page in pdf.pages]
    same=geometry(a)==geometry(b);default.append({'mode':mode,'sameCharacterGeometryAndText':same});assert same
(d/'PDF-QA.json').write_text(json.dumps({'results':results,'defaultControls':default,'scope':'Full selected text/order and all body split-line groups, shared art hashes, margins, default-layout geometry; final visuals also require inspection'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
reg['status']='PASS_COMPILE_AND_DEFAULT_GEOMETRY_NONREGRESSION';reg['defaultControls']=default;(d/'RENDERER-REGRESSION.json').write_text(json.dumps(reg,indent=2)+'\n')
print(json.dumps([{k:r[k] for k in ['format','pages','missingParagraphs','correctOrder','widowOrphanFailures','sparseContinuations','status']} for r in results],ensure_ascii=False))
if any(r['status']=='FAIL' for r in results):raise SystemExit(1)
