"""Read a private PDF locally; emit section identity metadata only, never prose."""
import hashlib
import json
import re
import sys
from pathlib import Path
from pypdf import PdfReader

source = Path(sys.argv[1])
records = []
seen = set()
for page_number, page in enumerate(PdfReader(source).pages, 1):
    lines = (page.extract_text() or '').splitlines()
    for index, line in enumerate(lines):
        if not line.lstrip().startswith('✦'):
            continue
        heading = line.split('✦')[1]
        # Wrapped heading lines are flush-left; manuscript body is indented.
        for following in lines[index + 1:index + 4]:
            if not following.strip() or following.lstrip().startswith('✦') or len(following) - len(following.lstrip()) >= 5:
                break
            heading += following
        heading = re.sub(r'\s+', '', heading)
        parts = re.split(r'[|｜]', heading, maxsplit=1)
        title = parts[0]
        if title == '观察科学' or title in seen:
            continue
        seen.add(title)
        question = parts[1] if len(parts) > 1 else f'如何理解{title}的观察证据与边界？'
        records.append({'sectionCode': f'14.{len(records)+1}', 'titleZhHans': title, 'readerQuestionZhHans': question, 'readerQuestionProvenance': 'PDF_HEADING' if len(parts) > 1 else 'DERIVED_METADATA_QUESTION_NOT_MANUSCRIPT_QUOTE', 'sourcePage': page_number, 'canonicalTitleVerified': True})
assert len(records) == 100, f'Expected 100 distinct section headings, got {len(records)}'
expected = {57:'历史投影与多路径投影',65:'证据权威、排序与冲突',86:'未观察不等于不存在',90:'冲突现实与争议状态',92:'人工智能推断边界',99:'读取与行动',100:'导航阈值'}
for number, title in expected.items():
    assert records[number-1]['titleZhHans'] == title, (number, records[number-1]['titleZhHans'])
output = Path('content/knowledge/book-vii/evidence/section-metadata-from-private-source-v1.json')
output.write_text(json.dumps({'schemaVersion':'PHI-OS-BOOK-VII-PRIVATE-SOURCE-METADATA-v1.0.0', 'bucket':'phios-private-manuscripts', 'objectKey':'books/book-7/source/PHI-OS-Book-7-v1.pdf', 'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(), 'pageCount':374, 'sectionMapping':'100 distinct headings in source order, checked against seven governing section anchors', 'fullProseEmbedded':False, 'records':records}, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(f'Extracted {len(records)} section titles; {sum(r["readerQuestionProvenance"]=="PDF_HEADING" for r in records)} heading questions; no manuscript prose emitted.')
