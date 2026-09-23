"""Read-only extraction of the existing paid-layout review PDFs (not purchase evidence)."""
import json
import io
import hashlib
import subprocess
from pathlib import Path
import pdfplumber

root = Path('docs/guided-report-successor-r2/visual-commerce')
result = []
for locale in ['en', 'zh-Hans']:
    path = root / f'bazi-paid-{locale}.pdf'
    original = subprocess.check_output(['git', 'show', f'c6ab7321:{path.as_posix()}'])
    with pdfplumber.open(io.BytesIO(original)) as pdf:
        for number, page in enumerate(pdf.pages, 1):
            result.append({'locale': locale, 'page': number, 'pdf': str(path),
                           'baselineCommit': 'c6ab7321', 'pdfSha256': hashlib.sha256(original).hexdigest(),
                           'text': page.extract_text() or '',
                           'width': float(page.width), 'height': float(page.height)})
Path('.tmp/bazi-f-pdf-text.json').write_text(json.dumps(result, ensure_ascii=False), encoding='utf-8')
print(f'Read {len(result)} existing PDF pages; no PDF modified.')
