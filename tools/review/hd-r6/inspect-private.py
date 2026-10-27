from pathlib import Path
import json, hashlib, re, subprocess
from pypdf import PdfReader
from PIL import Image, ImageOps, ImageDraw

src=Path('C:/Users/Guest Account/Desktop/生产者，3分人，51 Template - Teresa.pdf')
out=Path('.tmp/hd-r6-private'); out.mkdir(parents=True,exist_ok=True)
reader=PdfReader(src)
pages=[p.extract_text() or '' for p in reader.pages]
(out/'pages.json').write_text(json.dumps(pages,ensure_ascii=False),encoding='utf-8')
rows=[]
for i,(p,t) in enumerate(zip(reader.pages,pages),1):
    compact=re.sub(r'\s+','',t)
    xobjects=p.get('/Resources',{}).get('/XObject',{})
    if hasattr(xobjects,'get_object'): xobjects=xobjects.get_object()
    images=sum(1 for ob in xobjects.values() if ob.get_object().get('/Subtype')=='/Image') if xobjects else 0
    rows.append({'page':i,'textCharacters':len(t),'textSHA256':hashlib.sha256(t.encode()).hexdigest(),'topLevelImageObjects':images,
      'riskIndicators':[tag for tag,words in {'HEALTH':['健康','神经','消化','肥胖'],'DETERMINISTIC':['一定','命运','使命','注定'],'FINANCIAL':['财富','投资','财产'],'SPECIALIST':['睡梦','DNA','GeneKeys','PHS'],'OBSOLETE_COMMERCE':['RM188','RM158','代理人']}.items() if any(w in compact for w in words)]})
info={'status':'VERIFIED_LOCAL_FILE_60_PAGES','sourcePath':str(src),'bytes':src.stat().st_size,'sha256':hashlib.file_digest(src.open('rb'),'sha256').hexdigest(),'pageCount':len(pages),'authorMetadata':str(reader.metadata.get('/Author')),'titleMetadata':str(reader.metadata.get('/Title')),'pages':rows,'rawTextLocation':'IGNORED_LOCAL_ONLY .tmp/hd-r6-private/pages.json','rawTextInProductionCorpus':False,'wordMatchingIsNotFinalSemanticJudgment':True}
Path('tools/review/hd-r6/PRIVATE-SOURCE-IDENTITY.json').write_text(json.dumps(info,ensure_ascii=False,indent=2),encoding='utf-8')
exe=Path('C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe')
selected=[5,8,14,19,20,23,30,37,43]
thumbs=[]
for n in selected:
    prefix=out/f'page-{n}'
    subprocess.run([str(exe),'-f',str(n),'-l',str(n),'-scale-to','950','-singlefile','-png',str(src),str(prefix)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    im=Image.open(str(prefix)+'.png').convert('RGB');im.thumbnail((310,440))
    tile=Image.new('RGB',(330,470),'#f4f1e8');tile.paste(im,((330-im.width)//2,22));ImageDraw.Draw(tile).text((10,3),f'Private source page {n}',fill='#11334c');thumbs.append(tile)
sheet=Image.new('RGB',(990,1410),'white')
for i,t in enumerate(thumbs):sheet.paste(t,((i%3)*330,(i//3)*470))
sheet.save(out/'private-contact.png')
print(json.dumps({'pages':len(pages),'bytes':info['bytes'],'sha256':info['sha256'],'privateVisualPages':selected,'rawTextExported':False}))
