"""Local PDF navigation/metadata finish; preserves vector pages and approved rasters."""
from pathlib import Path
import json,hashlib
from pypdf import PdfReader,PdfWriter
from pypdf.generic import NameObject
root=Path('tools/review/financial-publication-merged')
build=json.loads((root/'browser-verification.json').read_text(encoding='utf-8-sig'))
contract=json.loads(Path('content/financial/reports/publication-bilingual-merged-22.json').read_text(encoding='utf-8-sig'))
results=[]
for o in build['outputs']:
    path=Path(o['pdfPath']);reader=PdfReader(path);already_finished=(reader.metadata or {}).get('/Title')=='PHIOS Financial Report | Same-page Bilingual | Local Human Review Candidate'
    if not already_finished:
        writer=PdfWriter();writer.clone_document_from_reader(reader)
        writer._root_object.pop(NameObject('/Outlines'),None)
        titles=[p['title']['zh-Hans']+' / '+p['title']['en'] for p in contract['pages']]+[a['category']+' · '+' / '.join(a['title']) for a in o['appendixManifest']]
        assert len(titles)==len(reader.pages)
        for i,title in enumerate(titles):writer.add_outline_item(f'{i+1:02} · {title}',i)
        writer.add_metadata({'/Title':'PHIOS Financial Report | Same-page Bilingual | Local Human Review Candidate','/Author':'PHIOS','/Subject':'A4 bilingual financial preparation report; 22 core pages; local candidate, not accepted for publication','/Keywords':'bilingual, financial preparation, local human review'})
        temporary=path.with_suffix('.finishing.pdf')
        with temporary.open('wb') as f:writer.write(f)
        temporary.replace(path)
    check=PdfReader(path)
    annotations=[a.get_object() for p in check.pages for a in p.get('/Annots',[])]
    links=[a for a in annotations if a.get('/Subtype')=='/Link']
    assert len(check.outline)==len(check.pages)
    if o['stem'] not in ('core-only',):assert links
    results.append({'stem':o['stem'],'path':str(path).replace('\\','/'),'pages':len(check.pages),'bookmarks':len(check.outline),'links':len(links),'tagged':bool(check.trailer['/Root'].get('/StructTreeRoot')),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
(root/'correction-r3/pdf-navigation.json').write_text(json.dumps({'status':'PASS_LOCAL_ONLY','results':results,'providerCalls':0},indent=2),encoding='utf-8')
print([(r['stem'],r['pages'],r['bookmarks'],r['links'],r['tagged']) for r in results])
