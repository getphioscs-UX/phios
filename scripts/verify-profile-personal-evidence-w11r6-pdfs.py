import json, hashlib
from pathlib import Path
from pypdf import PdfReader
root=Path('content/profile/successors/personal-evidence-r1/w11r6')
browser=json.loads((root/'browser-results.json').read_text(encoding='utf8'))
results=[]
for case in ['CASE-01','CASE-08','CASE-09']:
    filename='PRD-W11R6-CASE-01-PUBLICATION-REVIEW.pdf' if case=='CASE-01' else case+'-bilingual-dossier.pdf'
    path=Path('output/pdf/w11r6')/filename
    reader=PdfReader(path)
    dom=next(r for r in browser['results'] if r['id']==case)
    assert len(reader.pages)==dom['pages']
    anomalies=[]
    for i,page in enumerate(reader.pages):
        assert abs(float(page.mediabox.width)-595.28)<2
        assert abs(float(page.mediabox.height)-841.89)<2
        text=page.extract_text()
        if dom['pageAudit'][i]['section']:
            if len(text.strip())<100 or 'PHIOS' not in text: anomalies.append(i+1)
        else:
            assert page.get('/Resources',{}).get('/XObject'), 'Artwork missing'
    assert not anomalies
    results.append({'caseId':case,'path':str(path),'pageCount':len(reader.pages),'a4':True,'blankBodyPages':anomalies,'pageCountMatchesHtml':True,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'sizeBytes':path.stat().st_size})
(root/'pdf-results.json').write_text(json.dumps(results,indent=2),encoding='utf8')
print(json.dumps(results))
