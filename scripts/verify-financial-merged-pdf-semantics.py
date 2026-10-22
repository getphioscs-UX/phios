"""Independent checks of actual PDF text against original frozen FCR, not renderer HTML."""
from pathlib import Path
import json,re,hashlib
from pypdf import PdfReader
root=Path('tools/review/financial-publication-merged')
J=lambda p:json.loads(Path(p).read_text(encoding='utf-8-sig'))
build=J(root/'browser-verification.json');checks=[]
for o in build['outputs']:
    r=PdfReader(o['pdfPath'],strict=True)
    normalized=[''.join((p.extract_text() or '').split()) for p in r.pages]
    combined=''.join(normalized)
    for forbidden in ['Available/real','Contributions/real','Gap/cost','Opening/nominalcost']:
        assert forbidden not in combined,(o['stem'],forbidden)
    assert len(r.outline)==o['totalPages']
    for a in o['appendixManifest']:
        assert a['page']<=len(r.pages)
    if o['stem'] in ('complete','shortfall'):
        def texts(model,kind=None):
            return ''.join(normalized[a['page']-1] for a in o['appendixManifest'] if a['modelId']==model and (not kind or a['kind']==kind))
        cost=texts('EDUCATION_COST')
        for value in ['13,956.31','7,428.36','1,350.61','22,735.28']:assert value in cost,(o['stem'],'education component',value)
        assert 'Fundinggap' not in cost
        retirement=texts('RETIREMENT_FUNDING','YEARLY')
        assert 'Closingavailable' in retirement and 'Unfundedneed' in retirement
        original=J('tools/review/financial-publication-r3-2/'+o['stem']+'.snapshot.json')
        for row in original['result']['models'][1]['rows']:
            if row['gap']['value']>0:assert f"{row['gap']['value']:,.2f}" in retirement,(o['stem'],row['year'],'retirement unmet')
        if o['stem']=='complete':assert '8,404.53' in retirement
        education=texts('EDUCATION_FUNDING','YEARLY')
        for row in original['result']['models'][3]['rows']:
            if row['gap']['value']>0:assert f"{row['gap']['value']:,.2f}" in education,(o['stem'],row['year'],'education unmet')
        if o['stem']=='complete':assert '2,271.42' in education and '16,835.38' in education
        release=texts('EDUCATION_FUNDING','RECONCILE')
        for row in original['result']['models'][3]['rows']:
            if row['release']['value']>0:
                for field in ['release','priorRestrictedGrowth','opening','contributions','investmentGrowth','need','closing']:
                    value=f"{row[field]['value']:,.2f}"
                    assert value in release,(o['stem'],'release reconciliation',field,value)
        assert any(a['category']=='A00' and a['kind']=='SOURCES' for a in o['appendixManifest'])
        assert not any(a['category']=='A12' and a['kind']=='SOURCES' for a in o['appendixManifest'])
        assert '2033-01-01' in texts('LIFE_COURSE_EVENTS')
    if o['stem']=='shortfall':
        original_core=J('tools/review/financial-publication-r3-1/shortfall-en.projection.json')
        value=original_core['metrics']['surplus']['value']
        assert value<0
        assert re.search(r'[-−]'+re.escape(f'{abs(value):,.0f}'),normalized[7]), 'Negative cash balance lost in actual PDF'
    if o['stem']=='long-appendix':
        original=J(root/'correction-r3/long-appendix.fixture.json')['envelope']
        for model in original['result']['models']:
            if model['modelId'] not in ('RETIREMENT_FUNDING','EDUCATION_FUNDING'):continue
            actual=''.join(normalized[a['page']-1] for a in o['appendixManifest'] if a['modelId']==model['modelId'] and a['kind']=='YEARLY')
            for row in model['rows']:
                if row['gap']['value']>0:assert f"{row['gap']['value']:,.2f}" in actual,(o['stem'],model['modelId'],row['year'],'missing actual annual gap')
    checks.append({'stem':o['stem'],'actualPdfPages':len(r.pages),'semanticAssertions':'PASS','sha256':hashlib.sha256(Path(o['pdfPath']).read_bytes()).hexdigest()})
out={'status':'PASS_ACTUAL_PDF_SEMANTICS','checks':checks,'approximationDifference':{'auditEducation2033':2271.41,'frozenFcrEducation2033':2271.42287154,'printed':2271.42,'sourceAltered':False},'methodAssetAdmission':'BLOCKED_NOT_OVERRIDDEN','providerCalls':0}
(root/'correction-r3/pdf-semantics.json').write_text(json.dumps(out,indent=2),encoding='utf-8')
print('PASS actual PDF text: four typed semantics, closing/unfunded, authorized release, source taxonomy and timeline; all five outputs.')
