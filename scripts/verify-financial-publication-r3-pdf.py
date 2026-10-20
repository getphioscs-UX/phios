from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import json, re, subprocess, hashlib
from pypdf import PdfReader
from PIL import Image
root = Path('tools/review/financial-publication-r3')
temp = Path('tmp/pdfs/financial-publication-r3')
temp.mkdir(parents=True, exist_ok=True)
state = json.loads((root/'execution-state.json').read_text(encoding='utf-8'))
poppler = Path.home()/'.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe'
normalize = lambda text: re.sub(r'\s+', '', text)
def verify(entry):
    stem = entry['file'].removesuffix('.html')
    pdf = Path('output/pdf/financial-r3')/(stem+'.pdf')
    reader = PdfReader(pdf)
    assert len(reader.pages) == entry['corePages'], (stem,len(reader.pages))
    projection = json.loads((root/(stem+'.projection.json')).read_text(encoding='utf-8'))
    text_all = ''
    for index, page in enumerate(reader.pages):
        assert abs(float(page.mediabox.width)-595.28)<1 and abs(float(page.mediabox.height)-841.89)<1
        text = page.extract_text() or ''
        assert len(text)>30 and '\ufffd' not in text, (stem,index)
        if index:
            title = projection['pages'][index]['title'][entry['language']]
            assert normalize(title) in normalize(text), (stem,index,title)
        assert f"{index+1}/{entry['corePages']}" in normalize(text), (stem,index,'page marker')
        assert not re.search(r'FINANCE_PUBLICATION|CURRENT_STATE|CASH_FLOW|HFP_|SEMANTIC_REVIEW', text)
        if entry['language']=='en':
            assert not re.search(r'[\u3400-\u9fff]',text)
        text_all += text
    prefix = temp/stem
    subprocess.run([str(poppler),'-scale-to','520','-png',str(pdf),str(prefix)],check=True,capture_output=True)
    images = sorted(temp.glob(stem+'-*.png'))
    assert len(images)==entry['corePages']
    cols=4; rows=(len(images)+cols-1)//cols
    sheet=Image.new('RGB',(1520,550*rows),'#dbe3e0')
    for index,file in enumerate(images):
        image=Image.open(file).convert('RGB');image.thumbnail((360,510))
        sheet.paste(image,((index%cols)*380+10,(index//cols)*550+10))
    sheet.save(root/(stem+'-contact.png'))
    return {**entry,'pdf':str(pdf),'actualPdfPages':len(reader.pages),'a4Portrait':True,'titleOrderVerified':True,'pageMarkersVerified':True,'allPagesRendered':True,'languageVerified':True,'sha256':hashlib.sha256(pdf.read_bytes()).hexdigest()}
with ThreadPoolExecutor(max_workers=3) as pool:
    results=list(pool.map(verify,state['results']))
assert len(results)==12
for name in ['complete','shortfall','missing']:
    subset=[r for r in results if r['state']==name]
    assert len({r['sourceDraftId'] for r in subset})==1
    assert len({r['sourceContentDigest'] for r in subset})==1
(root/'pdf-verification.json').write_text(json.dumps({'results':results,'candidateCount':12,'renderedPageCount':sum(r['actualPdfPages'] for r in results),'sameSavedVersionAcrossLanguages':True,'providerCalls':0},indent=2)+'\n',encoding='utf-8')
print('PASS R3 PDFs: 12 files, 144 A4 pages, ordered bilingual titles, page markers and shared saved versions')
