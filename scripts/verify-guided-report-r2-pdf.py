import json
import os
import re
import subprocess
from pathlib import Path
from pypdf import PdfReader
from PIL import Image, ImageDraw

root = Path('docs/guided-report-successor-r2')
out = root / 'pdf-review'
out.mkdir(exist_ok=True)
records = []
for locale in ['zh-Hans', 'en']:
    pdf = root / f'bazi-{locale}.pdf'
    reader = PdfReader(pdf)
    assert len(reader.pages) == 26, (locale, len(reader.pages))
    for number, page in enumerate(reader.pages, 1):
        assert abs(float(page.mediabox.width) - 595.28) < 2
        assert abs(float(page.mediabox.height) - 841.89) < 2
        text = page.extract_text()
        if number >= 6:
            assert len(re.findall(rf'\b{number:02d}\s*/\s*26\b', text)) == 1, (locale, number, 'folio')
            assert not re.search(r'CMP-|BAZI_FULL_REPORT:|PPR-C1-|[a-f0-9]{32,}', text)
        else:
            assert len(page.images) > 0
    subprocess.run([os.environ['PHIOS_PDFTOPPM'], '-scale-to', '1100', '-png', str(pdf), str(out / locale)], check=True)
    for start, end in [(1, 9), (10, 18), (19, 26)]:
        sheet = Image.new('RGB', (1080, 1620), '#dedbd5')
        draw = ImageDraw.Draw(sheet)
        for i, n in enumerate(range(start, end + 1)):
            im = Image.open(out / f'{locale}-{n:02d}.png')
            im.thumbnail((350, 495))
            x, y = (i % 3) * 360, (i // 3) * 540
            sheet.paste(im, (x + (360 - im.width) // 2, y + 30))
            draw.text((x + 12, y + 8), f'{locale} P{n:02d}', fill='black')
        sheet.save(out / f'{locale}-contact-{start:02d}-{end:02d}.png')
    for a, b in [(6, 7), (7, 8), (15, 16), (19, 20), (24, 25), (25, 26)]:
        sheet = Image.new('RGB', (1600, 1140), '#dedbd5')
        draw = ImageDraw.Draw(sheet)
        for col, n in enumerate([a, b]):
            im = Image.open(out / f'{locale}-{n:02d}.png')
            sheet.paste(im, (col * 800 + (800 - im.width) // 2, 30))
            draw.text((col * 800 + 15, 8), f'{locale} P{n:02d}', fill='black')
        sheet.save(out / f'{locale}-transition-{a:02d}-{b:02d}.png')
    records.append({'locale': locale, 'pages': 26, 'format': 'A4', 'singleFolioP06ThroughP26': True, 'internalIdentifierLeaks': 0, 'staticAssetPaginationException': 'USER_SELECTED_OPTION_1'})
(root / 'pdf-evidence.json').write_text(json.dumps(records, indent=2) + '\n')
print('PASS: two 26-page A4 PDFs; 52 page renders; single dynamic folios; no internal identifier text; transition comparisons ready.')
