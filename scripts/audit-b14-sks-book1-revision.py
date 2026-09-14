"""Read a private PDF; publish only digests and candidate heading/page mappings."""
import hashlib
import json
import pathlib
import re
import sys
from pypdf import PdfReader

root = pathlib.Path(__file__).resolve().parent.parent
source = pathlib.Path(sys.argv[1])
digest = hashlib.sha256(source.read_bytes()).hexdigest()
reader = PdfReader(source)
pages = [page.extract_text() or '' for page in reader.pages]
normalize = lambda text: re.sub(r'\s+', '', text)
normalized = [normalize(text) for text in pages]
inventory = json.loads((root / 'content/knowledge/manuscripts/extraction/book-1-full-section-inventory-v1.json').read_text(encoding='utf-8'))
rows = []
for section in inventory['sections']:
    heading = normalize(section['heading'])
    matches = [i + 1 for i, text in enumerate(normalized) if heading and heading in text]
    rows.append({'historicalSectionCode': section['sectionCode'], 'heading': section['heading'], 'historicalPages': [section['startPage'], section['endPage']], 'candidatePages': matches, 'status': 'UNIQUE_HEADING_CANDIDATE' if len(matches) == 1 else 'AMBIGUOUS_HEADING' if matches else 'HEADING_NOT_MATCHED', 'approvedBinding': False})
report = {'version': '1.0.0', 'bookCode': 'BOOK-1', 'status': 'REVISION_RECONCILIATION_PENDING', 'sourceSha256': digest, 'pageCount': len(pages), 'historicalSourceSha256': inventory['sourceSha256'], 'extractionEngine': 'pypdf', 'matchingNormalization': 'Whitespace removed for candidate search only; no claim of section-text equality.', 'pageDigests': [{'page': i + 1, 'textSha256': hashlib.sha256(text.encode()).hexdigest(), 'characters': len(text)} for i, text in enumerate(pages)], 'sectionCandidates': rows, 'counts': {status: sum(row['status'] == status for row in rows) for status in ['UNIQUE_HEADING_CANDIDATE', 'AMBIGUOUS_HEADING', 'HEADING_NOT_MATCHED']}, 'privateBodyIncluded': False, 'humanAcceptanceComplete': False, 'mayReplaceCanonicalBindings': False}
output = root / 'docs/knowledge/structured-successor/book-1-revision-reconciliation-v1.json'
output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'pageCount': len(pages), 'counts': report['counts'], 'sourceSha256': digest}))
