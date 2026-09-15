"""Archive user-supplied PDF text for review; never promote source versions."""
import hashlib, json, pathlib, sys
from pypdf import PdfReader
root = pathlib.Path(__file__).resolve().parent.parent
desktop = pathlib.Path(sys.argv[1])
out = root / 'functions/_source-material/books'
out.mkdir(parents=True, exist_ok=True)
records = []
for number, name in enumerate(['PHI-OS-Book-I-v2.pdf','PHI-OS-Book-2-v1.pdf','PHI-OS-Book-3-v1.pdf','PHI-OS-Book-4-v1.pdf'], 1):
    source = desktop / name
    binary_hash = hashlib.file_digest(source.open('rb'), 'sha256').hexdigest()
    reader = PdfReader(source)
    pages = []
    for i, page in enumerate(reader.pages, 1):
        text = page.extract_text() or ''
        pages.append({'pdfPage':i, 'text':text, 'textSha256':hashlib.sha256(text.encode()).hexdigest()})
    relative = f'functions/_source-material/books/book-{number}-desktop-text-v1.json'
    payload = {'bookCode':f'BOOK-{number}', 'sourceFileName':name, 'sourcePdfSha256':binary_hash, 'pageCount':len(pages), 'extractionEngine':'pypdf', 'role':'USER_SUPPLIED_REVIEW_SOURCE', 'canonicalAuthority':False, 'rawDeliveryAllowed':False, 'pages':pages}
    data = (json.dumps(payload, ensure_ascii=False, indent=2)+'\n').encode()
    (root / relative).write_bytes(data)
    records.append({'bookCode':payload['bookCode'], 'sourceFileName':name,'sourcePdfSha256':binary_hash,'sourcePdfBytes':source.stat().st_size,'pageCount':len(pages),'emptyTextPages':[p['pdfPage'] for p in pages if not p['text'].strip()],'textPath':relative,'textFileSha256':hashlib.sha256(data).hexdigest(),'canonicalAuthority':False})
    print(json.dumps({k:records[-1][k] for k in ['bookCode','pageCount','sourcePdfSha256','emptyTextPages']}), flush=True)
target = root / 'docs/knowledge/structured-successor/source-material-receipt-v1.json'
target.write_text(json.dumps({'version':'1.0.0','records':records,'sourceVersionPromotion':False,'rawDeliveryAllowed':False,'storageBoundary':'functions/ is excluded by the lockfile Wrangler Pages asset validator. JSON files are not runtime imports.'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
