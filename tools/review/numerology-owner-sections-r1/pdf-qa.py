from pathlib import Path
import json,re,unicodedata,hashlib,subprocess,sys
from pypdf import PdfReader
R=Path('tools/review/numerology-owner-sections-r1');O=Path('output/pdf/numerology-owner-sections-r1')
def load(p):return json.loads(Path(p).read_text(encoding='utf8'))
aliases=load('tools/review/numerology-r20/CURRENT-FONT-ALIASES.json')['aliases']
def norm(s):return re.sub(r'\s+','',unicodedata.normalize('NFKC',''.join(aliases.get(c,c) for c in s))).replace('\u2015','\u2014')
frozen=load('.tmp/numerology-r30-acceptance/A-PUBLICATION.json');results=[]
for locale in ['zh-Hans','en','bilingual']:
    folder=O/locale;file=next(folder.glob('*.pdf'));pdf=PdfReader(file);plan=load(folder/'PAGE-MAP.json');oldfolder=Path('output/pdf/numerology-r30-acceptance')/locale;old=PdfReader(oldfolder/f'PHI-OS-NUMEROLOGY-R30-{locale}.pdf');oldplan=load(oldfolder/'PAGE-MAP.json')
    assert len(pdf.pages)==len(plan)==39
    assert all(abs(float(p.mediabox.width)-595.27559)<.02 and abs(float(p.mediabox.height)-841.88976)<.02 for p in pdf.pages)
    outlines=pdf.outline;assert len(outlines)==10
    section_indices=[i for i,e in enumerate(plan) if e['pageRole']=='FIXED_MASTER_SECTION'];assert [pdf.get_destination_page_number(o) for o in outlines]==section_indices
    links=pdf.pages[5].get('/Annots');assert len(links)==10
    destinations=[pdf.get_page_number(a.get_object()['/Dest'][0].get_object()) for a in links];assert destinations==section_indices
    checks=[]
    for e in plan:
        if e['pageRole']!='BODY_CONTENT' or not e['logicalPageId'].startswith('P'):continue
        id=e['logicalPageId'];p=pdf.pages[e['physicalPageNumber']-1];text=p.extract_text();oe=next(x for x in oldplan if x['logicalPageId']==id and x['pageRole']=='BODY_CONTENT');oldtext=old.pages[oe['physicalPageNumber']-1].extract_text()
        def without_page_labels(t,physical,total):
            t=re.sub(re.escape(id)+r'\s*/\s*'+str(physical)+r'(?!\d)',id,t)
            t=re.sub(r'PHI\s*OS\s*[·•]?\s*'+str(physical)+r'\s*/\s*'+str(total)+r'(?!\d)','PHI OS',t)
            return norm(t)
        equal=without_page_labels(text,e['physicalPageNumber'],39)==without_page_labels(oldtext,oe['physicalPageNumber'],33)
        units=next(x for x in frozen['pages'] if x['logicalPageId']==id)['languages'];expected=[u['text'] for l in (['zh-Hans','en'] if locale=='bilingual' else [locale]) for u in units[l]['units']]
        missing=[t for t in expected if norm(t) not in norm(text)]
        checks.append(dict(id=id,textParityExceptPhysicalLabels=equal,allFrozenParagraphsSelectable=not missing,missingParagraphs=missing))
    assert len(checks)==19
    integration=[]
    editorial=load(R/'INTEGRATION-EDITORIAL.json')['pages']
    for e in plan:
        if e['pageRole']=='BODY_CONTENT' and e['logicalPageId'].startswith('I'):
            text=pdf.pages[e['physicalPageNumber']-1].extract_text();ep=next(p for p in editorial if p['logicalPageId']==e['logicalPageId']);expected=[u['text'] for l in (['zh-Hans','en'] if locale=='bilingual' else [locale]) for u in ep['languages'][l]['units']]
            missing=[t for t in expected if norm(t) not in norm(text)];assert not missing,(locale,e['logicalPageId'],missing)
            assert 'SYNTHETIC' in text;integration.append(dict(id=e['logicalPageId'],allParagraphsSelectable=True))
    assert all(c['textParityExceptPhysicalLabels'] for c in checks),(locale,[(c['id'],c['textParityExceptPhysicalLabels']) for c in checks])
    assert all(c['allFrozenParagraphsSelectable'] for c in checks),(locale,[(c['id'],len(c['missingParagraphs'])) for c in checks])
    assert 'John Michael Smith' in pdf.pages[0].extract_text()
    result=dict(locale=locale,pdf=str(file),pageCount=39,allA4=True,tenContentsLinks=True,tenSectionBookmarks=True,sectionPhysicalPages=[i+1 for i in section_indices],nativePages=checks,integration=integration,subjectIdentityPreserved=True,p06ContentReinspection=False,customerPublishable=False)
    results.append(result)
    (R/'PDF-QA.json').write_text(json.dumps(dict(results=results,scope='ACTUAL_LOCAL_PDF_NOT_LIVE_CUSTOMER_ACCEPTANCE'),ensure_ascii=False,indent=2),encoding='utf8')
    print(locale,'39 A4 / 10 links / 10 bookmarks / 19 native text parity / 4 integration selectable',flush=True)
