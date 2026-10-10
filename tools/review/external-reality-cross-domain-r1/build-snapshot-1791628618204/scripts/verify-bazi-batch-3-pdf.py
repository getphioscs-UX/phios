"""Render the three Batch 3 PDFs for visual inspection; never alter PDF content."""
import json
import os
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw
from pypdf import PdfReader

root = Path('docs/guided-report-successor-r1/batch-3')
out = root / 'pdf-review'
out.mkdir(exist_ok=True)
poppler = os.environ['PHIOS_PDFTOPPM']
result = []
for locale in ['zh-Hans', 'en', 'bilingual']:
    pdf = root / f'bazi-p16-p19-{locale}.pdf'
    reader = PdfReader(pdf)
    assert len(reader.pages) == 4
    for i, page in enumerate(reader.pages):
        assert abs(float(page.mediabox.width) - 595.28) < 2
        assert abs(float(page.mediabox.height) - 841.89) < 2
        assert f'{i + 16} / 26' in page.extract_text()
    subprocess.run([poppler, '-scale-to', '1100', '-png', str(pdf), str(out / locale)], check=True)
    sheet = Image.new('RGB', (2080, 760), '#dedbd5')
    draw = ImageDraw.Draw(sheet)
    for i in range(4):
        image = Image.open(out / f'{locale}-{i + 1}.png')
        image.thumbnail((510, 720))
        sheet.paste(image, (i * 520 + (520 - image.width) // 2, 30))
        draw.text((i * 520 + 15, 8), f'{locale} P{i + 16}', fill='black')
    sheet.save(out / f'{locale}-contact.png')
    result.append({'locale': locale, 'pages': 4, 'format': 'A4', 'logicalPages': [16, 17, 18, 19]})
(root / 'pdf-evidence.json').write_text(json.dumps(result, indent=2) + '\n')
print('PASS: 3 A4 PDFs, 4 pages each; 12 page renders ready for visual inspection.')
