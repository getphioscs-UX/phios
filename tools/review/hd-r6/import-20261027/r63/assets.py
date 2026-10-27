from pathlib import Path
import json,hashlib
from PIL import Image,ImageDraw
d=Path('tools/review/hd-r6/import-20261027/r63');old=json.loads(Path('.tmp/hd-report-publication-r51/17-ASSET-MANIFEST.json').read_text());registry=json.loads(Path('content/reports/shared/report-visual-assets-r2.json').read_text());fresh=json.loads((d/'SEC11-FRESH-READ.json').read_text());rows=[]
for r in old['rows']:
    p=Path(r['file']);data=p.read_bytes();im=Image.open(p);im.load();h=hashlib.sha256(data).hexdigest()
    assert h==r['sha256']
    rows.append({'section':r['section'],'key':r['key'],'file':str(p),'sha256':h,'bytes':len(data),'width':im.width,'height':im.height,'decode':'PASS','registered':any(a.get('methodId')=='HD' and a.get('key')==r['key'] for a in registry['assets']),'sourceStatus':r['identitySource'],'R51Approval':r['approval'],'priorFindings':r.get('findings',[]),'licensing':'Independent text/diagram expression scope not established by object existence','currentRemote':'FRESH_SEC11_ONLY' if r['section']==11 else 'CACHED_IDENTITY_VERIFIED_CURRENT_REMOTE_NOT_REFETCHED','fixedBilingualNotCustomerChart':True})
for start in range(0,len(rows),6):
    sheet=Image.new('RGB',(1200,2000),'#edf0ee');draw=ImageDraw.Draw(sheet)
    for i,r in enumerate(rows[start:start+6]):
        p=fresh.get('file') if r['section']==11 and fresh.get('file') else r['file'];im=Image.open(p).convert('RGB');im.thumbnail((380,900));x=(i%3)*400+(400-im.width)//2;y=(i//3)*1000+35;sheet.paste(im,(x,y));draw.text(((i%3)*400+12,(i//3)*1000+8),f"SEC{r['section']:02d} bilingual fixed candidate",fill='black')
    sheet.save(d/f'artwork-contact-{start//6+1}.png')
if fresh.get('file'):
    im=Image.open(fresh['file']);im.load();fresh.update({'width':im.width,'height':im.height,'decode':'PASS'})
(d/'VISUAL-ASSET-AUDIT.json').write_text(json.dumps({'rows':rows,'total':len(rows),'sharedRegistryHDAssetCount':sum(a.get('methodId')=='HD' for a in registry['assets']),'sharedRegistryHDSectionCount':len(registry['reports']['HD']['sections']),'SEC11Fresh':fresh,'scope':'Exact cached identities decoded; current SEC11 separately fetched. No production registration/approval created.','allProductLanguages':'Same fixed bilingual bytes, not separate language images','diagramAccuracy':'Fixed conceptual diagrams not calculated customer charts. Semantic/IP approval remains open.'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print('17 cached exact assets decoded; SEC11',fresh)
