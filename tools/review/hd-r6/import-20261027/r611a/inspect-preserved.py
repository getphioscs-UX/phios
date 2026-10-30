from pathlib import Path
from PIL import Image
import json,hashlib
D=Path('tools/review/hd-r6/import-20261027/r611a');prior=D/'../r611'
source=json.loads((prior/'FRONT-MATTER-BINDINGS.json').read_text());rows=[]
for a in source['rows']:
 with Image.open(a['file']) as im:
  im.load();rgb=im.convert('RGB');w,h=rgb.size;pixel=hashlib.sha256(f'RGB:{w}x{h}:'.encode()+rgb.tobytes()).hexdigest()
 rows.append({'language':a['language'],'pageId':a['pageId'],'objectKey':a['objectKey'],'priorSHA256':a['sha256'],'historicalPixelSHA256':pixel,'historicalDimensions':[w,h],'currentSHA256':None,'currentPixelSHA256':None,'currentMatchesHistorical':'UNKNOWN_CURRENT_READ_BLOCKED'})
(D/'OLD-NEW-ASSET-IDENTITY.json').write_text(json.dumps({'rows':rows,'historicalCoverDistinctPixelHashes':len({r['historicalPixelSHA256'] for r in rows if r['pageId']=='P01'}),'historicalEnglishRoleDiscrepancy':'R611 cache: exact P04 displays read-guide/05; exact P05 displays PHI OS lens/04. Current remote contents unknown. Registry keys correct; cached wrong upload vs stale remote version cannot be distinguished without new bytes.','latestPDFConsumption':'NOT_RUN'},indent=2)+'\n')
old=prior/'check-toc.py';s=old.read_text();s=s.replace("(D/'TOC-PERTURBATION-QA.json').write_text","(D/'../r611a/INHERITED-TOC-RECHECK.json').write_text")
exec(compile(s,'R611-existing-TOC-assertions-read-only-successor-receipt','exec'),{'__file__':str(old),'__name__':'__main__'})
p=D/'INHERITED-TOC-RECHECK.json';x=json.loads(p.read_text());x['scope']='Recheck unchanged historical real 95-to-96 native reflow PDFs and actual links/numerals/bookmarks. Not a new R611A render or current-asset test.';x['r611aFreshRecomposition']='BLOCKED_CURRENT_ASSET_BYTES_UNAVAILABLE';p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
