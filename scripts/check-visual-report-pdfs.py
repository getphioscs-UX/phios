"""Verify exported report PDFs; optionally render all pages for visual review.

python scripts/check-visual-report-pdfs.py --poppler-bin <directory>
Requires pypdf and Pillow. The export owner remains Chromium print, not this script.
"""
import argparse
import concurrent.futures
import hashlib
import json
import math
import subprocess
from pathlib import Path

from pypdf import PdfReader
from PIL import Image, ImageDraw

args = argparse.ArgumentParser()
args.add_argument('--poppler-bin', required=True)
options = args.parse_args()
root = Path(__file__).resolve().parent.parent
output = root / 'docs/visual-report-r1/pdf-review'
temporary = root / '.tmp/vrpt-final-pdf'
output.mkdir(exist_ok=True)
temporary.mkdir(parents=True, exist_ok=True)
poppler = Path(options.poppler_bin) / ('pdftoppm.exe' if __import__('os').name == 'nt' else 'pdftoppm')


def inspect(path):
    name = path.stem.removeprefix('VRPT-')
    case, depth = name.rsplit('-', 1)
    source = json.loads((root / f'docs/visual-report-r1/cases/{case}.json').read_text(encoding='utf-8'))
    reader = PdfReader(path)
    pages = [dict(page=i + 1, textCharacters=len(page.extract_text() or ''),
                  rasterImages=len(list(page.images)), widthPt=float(page.mediabox.width),
                  heightPt=float(page.mediabox.height)) for i, page in enumerate(reader.pages)]
    expected = len(source[depth]['pages'])
    valid = len(pages) == expected and all(p['textCharacters'] > 50 and abs(p['widthPt'] - 595.28) < 1
                                          and abs(p['heightPt'] - 841.89) < 1 for p in pages)
    # Only the original six PHI card illustrations may be raster content.
    valid &= sum(p['rasterImages'] for p in pages) == (6 if case.startswith('ECR-') else 0)
    subprocess.run([str(poppler), '-r', '60', '-png', str(path), str(temporary / name)],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    # Select by the actual page count; an older, longer export must not leave
    # obsolete pages in the contact sheet.
    digits = len(str(len(pages)))
    files = [temporary / f'{name}-{i:0{digits}d}.png' for i in range(1, len(pages) + 1)]
    width, height, columns = 240, 350, min(4, len(files))
    canvas = Image.new('RGB', (columns * width, math.ceil(len(files) / columns) * height), '#e9ece7')
    draw = ImageDraw.Draw(canvas)
    for i, file in enumerate(files):
        image = Image.open(file).convert('RGB')
        image.thumbnail((width - 12, height - 26))
        x, y = i % columns * width + 6, i // columns * height + 20
        canvas.paste(image, (x, y))
        draw.text((x, y - 16), str(i + 1), fill='#293638')
    contact = output / (name + '.png')
    canvas.save(contact)
    return dict(file=path.relative_to(root).as_posix(), sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
                expectedPages=expected, actualPages=len(pages), status='PASS' if valid else 'FAIL', pages=pages,
                contactSheet=contact.relative_to(root).as_posix())


with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
    records = list(pool.map(inspect, sorted((root / 'output/pdf').glob('VRPT-*.pdf'))))
result = dict(work='VRPT-R1', sampleCount=len(records), passCount=sum(r['status'] == 'PASS' for r in records),
              measurement='Exact Page IR count, A4, extractable text, original card raster allowance; rendered contact sheets require visual review',
              results=records)
(output / 'pdf-results.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
print(json.dumps(dict(samples=len(records), failed=[r['file'] for r in records if r['status'] != 'PASS'])))
raise SystemExit(0 if len(records) == 32 and all(r['status'] == 'PASS' for r in records) else 1)
