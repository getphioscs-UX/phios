from pathlib import Path
import json, subprocess
from pypdf import PdfReader
from PIL import Image, ImageDraw
root = Path('tools/review/finance-core-v2')
temporary = Path('tmp/pdfs/finance-core-v2')
temporary.mkdir(parents=True, exist_ok=True)
poppler = Path.home() / '.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe'
results = []
for pdf in sorted(root.glob('*.pdf')):
    reader = PdfReader(pdf)
    assert len(reader.pages) == 16, (pdf, len(reader.pages))
    text = ''.join(page.extract_text() or '' for page in reader.pages)
    assert '\ufffd' not in text
    for page in reader.pages:
        assert len(page.extract_text() or '') > 40
    prefix = temporary / pdf.stem
    subprocess.run([str(poppler), '-scale-to', '650', '-png', str(pdf), str(prefix)], check=True, capture_output=True)
    files = sorted(temporary.glob(pdf.stem + '-*.png'))
    assert len(files) == 16
    sheet = Image.new('RGB', (1680, 2440), '#dce2df')
    for i, file in enumerate(files):
        image = Image.open(file).convert('RGB')
        image.thumbnail((400, 575))
        sheet.paste(image, ((i % 4) * 420 + 10, (i // 4) * 610 + 10))
    sheet.save(root / (pdf.stem + '-contact.png'))
    results.append({'file': pdf.name, 'corePages': 16, 'nonemptyPages': True, 'replacementCharacters': False, 'renderedPages': len(files)})
assert len(results) == 6
(root / 'pdf-verification.json').write_text(json.dumps({'results': results, 'providerCalls': 0}, indent=2) + '\n', encoding='utf-8')
print('PASS: six PDFs, sixteen pages each, text and Poppler rendering verified')
