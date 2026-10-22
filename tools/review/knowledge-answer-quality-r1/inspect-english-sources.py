"""Read private author PDFs in memory. Persist metadata only, never body text."""
import hashlib, json, logging, os, re, subprocess, tempfile, time
from pathlib import Path
from pypdf import PdfReader

logging.getLogger('pypdf').setLevel(logging.ERROR)
root = Path(__file__).resolve().parents[3]
out = root / 'tools/review/knowledge-answer-quality-r1'
desktop = Path(os.environ['USERPROFILE']) / 'Desktop'
scratch = Path(tempfile.mkdtemp(prefix='phios-english-source-review-'))
terms = json.loads((root/'content/knowledge/l10n/bilingual-terminology-registry.json').read_text(encoding='utf-8'))['terms']
terms = [t for t in terms if t.get('status') == 'approved' and t.get('translationLock') is True]
rows=[]
for n in (2,3,4):
    path=desktop/f'PHI-OS-Book-{n}-en-v1.pdf'
    start=time.time()
    h=hashlib.sha256()
    with path.open('rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
    reader=PdfReader(path)
    metrics=[]; texts=[]; part_hits=[]; outline=[]
    for i,p in enumerate(reader.pages):
        text=p.extract_text() or ''
        texts.append(text)
        metrics.append({'page':i+1,'chars':len(text),'englishLetters':len(re.findall('[A-Za-z]',text)),'replacementChars':text.count('\ufffd')})
        for m in re.finditer(r'\bPart\s+([5-9]|10|11)\b',text,re.I):
            part_hits.append({'part':'P'+m.group(1),'page':i+1,'status':'TEXT_OCCURRENCE_NOT_YET_BOUNDARY'})
    full='\n\f\n'.join(texts)
    # Original extracted contents/headings remain outside the repository.
    heading_candidates=[]
    for i,text in enumerate(texts):
        for line in text.splitlines():
            if re.match(r'^\s*(?:Part\s+\d+|(?:[5-9]|10|11)\.\d+\b)',line,re.I):heading_candidates.append({'page':i+1,'heading':line.strip()})
    private_manifest={'bookCode':f'BOOK-{n}','sourceSha256':h.hexdigest(),'outline':[str(x) for x in reader.outline],'headingCandidates':heading_candidates,'firstPages':[{'page':i+1,'text':text} for i,text in enumerate(texts[:5])]}
    private_path=scratch/f'book-{n}-en-heading-review.json'
    private_path.write_bytes(json.dumps(private_manifest,ensure_ascii=False,indent=2).encode('utf-8'))
    terminology=[]
    for term in terms:
        pattern=re.compile(r'(?<![A-Za-z])'+re.escape(term['en'])+r'(?![A-Za-z])',re.I)
        pages=[i+1 for i,t in enumerate(texts) if pattern.search(t)]
        if pages:terminology.append({'termCode':term['termCode'],'key':term['key'],'en':term['en'],'zh-Hans':term['zh-Hans'],'pages':pages,'meaningConsistency':'NOT_PROVEN_BY_TERM_OCCURRENCE'})
    metadata=reader.metadata
    row={'bookCode':f'BOOK-{n}','language':'en','name':path.name,'fullPath':str(path),'byteSize':path.stat().st_size,'sha256':h.hexdigest(),'pageCount':len(reader.pages),'encrypted':reader.is_encrypted,'pdfMetadata':{'title':metadata.title,'author':metadata.author,'creator':metadata.creator,'producer':metadata.producer,'creationDateRaw':str(metadata.get('/CreationDate','')),'modificationDateRaw':str(metadata.get('/ModDate',''))},'textLayer':{'pagesWithText':sum(m['chars']>0 for m in metrics),'emptyTextPages':[m['page'] for m in metrics if m['chars']==0],'totalChars':sum(m['chars'] for m in metrics),'replacementChars':sum(m['replacementChars'] for m in metrics),'englishLetterFraction':round(sum(m['englishLetters'] for m in metrics)/max(1,sum(m['chars'] for m in metrics)),4),'perPageMetrics':metrics,'ocrPerformed':False,'losslessExtractionClaimed':False},'outlineCount':len(reader.outline),'headingCandidateCount':len(heading_candidates),'partTextOccurrences':part_hits,'terminology':terminology,'privateHeadingReviewPath':str(private_path),'elapsedSeconds':round(time.time()-start,2),'fullTextPersisted':False,'publicIndexAdded':False,'productionRetrievalPassed':False}
    rows.append(row)
    print(json.dumps({'book':n,'pages':row['pageCount'],'pagesWithText':row['textLayer']['pagesWithText'],'empty':row['textLayer']['emptyTextPages'],'outlineCount':row['outlineCount'],'terms':len(terminology),'seconds':row['elapsedSeconds']}),flush=True)
    del full, texts, reader
result={'at':time.strftime('%Y-%m-%dT%H:%M:%S%z'),'desktopAccessible':True,'method':'READONLY_PYPDF_MEMORY_TEXT_LAYER_METADATA_ONLY','privateScratchDirectory':str(scratch),'records':rows,'providerCalls':0,'productionWrites':0,'bodyTextInRepository':False}
(out/'ENGLISH-SOURCE-READABILITY.json').write_bytes(json.dumps(result,ensure_ascii=False,indent=2).encode('utf-8'))
