"""Render Batch 4/5 PDFs for visual inspection; never alter PDF content."""
import json
import sys
import os
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw
from pypdf import PdfReader

batch = int(sys.argv[1])
assert batch in (4, 5)
first, count = (20, 3) if batch == 4 else (23, 4)
last = first + count - 1
root = Path(f'docs/guided-report-successor-r1/batch-{batch}')
out = root / 'pdf-review'
out.mkdir(exist_ok=True)
poppler = os.environ['PHIOS_PDFTOPPM']
result = []
for locale in ['zh-Hans', 'en', 'bilingual']:
    pdf = root / f'bazi-p{first}-p{last}-{locale}.pdf'
    reader = PdfReader(pdf)
    assert len(reader.pages) == count
    for i, page in enumerate(reader.pages):
        assert abs(float(page.mediabox.width) - 595.28) < 2
        assert abs(float(page.mediabox.height) - 841.89) < 2
        assert f'{i + first} / 26' in page.extract_text()
    subprocess.run([poppler, '-scale-to', '1100', '-png', str(pdf), str(out / locale)], check=True)
    sheet = Image.new('RGB', (count * 520, 760), '#dedbd5')
    draw = ImageDraw.Draw(sheet)
    for i in range(count):
        image = Image.open(out / f'{locale}-{i + 1}.png')
        image.thumbnail((510, 720))
        sheet.paste(image, (i * 520 + (520 - image.width) // 2, 30))
        draw.text((i * 520 + 15, 8), f'{locale} P{i + first}', fill='black')
    sheet.save(out / f'{locale}-contact.png')
    result.append({'locale': locale, 'pages': count, 'format': 'A4', 'logicalPages': list(range(first, last + 1))})
(root / 'pdf-evidence.json').write_text(json.dumps(result, indent=2) + '\n')
print(f'PASS: Batch {batch}, 3 A4 PDFs, {count} pages each; renders ready for visual inspection.')
