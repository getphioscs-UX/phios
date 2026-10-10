"""Verify and render all 78 audit pages, retaining approved static page images."""
import json
import os
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw
from pypdf import PdfReader

root = Path('docs/guided-report-successor-r1/batch-6')
out = root / 'pdf-review'
out.mkdir(exist_ok=True)
evidence = []
for locale in ['zh-Hans', 'en', 'bilingual']:
    pdf = root / f'bazi-p01-p26-{locale}.pdf'
    reader = PdfReader(pdf)
    assert len(reader.pages) == 26, (locale, len(reader.pages))
    for number, page in enumerate(reader.pages, 1):
        assert abs(float(page.mediabox.width) - 595.28) < 2
        assert abs(float(page.mediabox.height) - 841.89) < 2
        if number > 5:
            assert f'{number:02d} / 26' in page.extract_text(), (locale, number)
        else:
            assert len(page.images) > 0, (locale, number, 'missing editorial image')
    subprocess.run([os.environ['PHIOS_PDFTOPPM'], '-scale-to', '1100', '-png', str(pdf), str(out / locale)], check=True)
    for start, end in [(1, 26), (1, 9), (10, 18), (19, 26)]:
        cols = 5 if end == 26 and start == 1 else 3
        rows = (end - start + cols) // cols
        sheet = Image.new('RGB', (cols * 360, rows * 540), '#dedbd5')
        draw = ImageDraw.Draw(sheet)
        for i, number in enumerate(range(start, end + 1)):
            image = Image.open(out / f'{locale}-{number:02d}.png')
            image.thumbnail((350, 500))
            x, y = (i % cols) * 360, (i // cols) * 540
            sheet.paste(image, (x + (360 - image.width) // 2, y + 30))
            draw.text((x + 12, y + 8), f'{locale} P{number:02d}', fill='black')
        suffix = 'contact' if start == 1 and end == 26 else f'contact-{start:02d}-{end:02d}'
        sheet.save(out / f'{locale}-{suffix}.png')
    # Compare actual desktop and mobile captures at their own relative scales.
    sheet = Image.new('RGB', (2000, 1520), '#dedbd5')
    draw = ImageDraw.Draw(sheet)
    x = 0
    for width in [1440, 390]:
        for number in [5, 6]:
            image = Image.open(root / 'screenshots' / f'{locale}-{width}-P{number:02d}.png')
            image.thumbnail((490, 1460))
            sheet.paste(image, (x + (500 - image.width) // 2, 40))
            draw.text((x + 12, 12), f'{locale} {width}px P{number:02d}', fill='black')
            x += 500
    sheet.save(root / 'screenshots' / f'{locale}-transition.png')
    evidence.append({'locale': locale, 'pages': 26, 'format': 'A4', 'staticImagePages': 5, 'dynamicNumberedPages': 21, 'renderedPages': 26})
(root / 'pdf-evidence.json').write_text(json.dumps(evidence, indent=2) + '\n')
print('PASS: three whole-book A4 PDFs, 26 pages each; 78 renders and three P05/P06 transition comparisons.')
