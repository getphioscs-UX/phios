import json, pathlib, subprocess
from PIL import Image, ImageDraw
from pypdf import PdfReader

root = pathlib.Path('docs/commerce/economics-20261009/windows-integration/free-natal-diagram-audit')
out = root / 'pdf-pages'
out.mkdir(exist_ok=True)
results = []
for source in sorted(root.glob('*-print.pdf')):
    reader = PdfReader(source)
    prefix = out / source.stem
    subprocess.run(['pdftoppm', '-r', '45', '-png', str(source), str(prefix)], check=True, capture_output=True)
    files = sorted(out.glob(source.stem + '-*.png'), key=lambda p: int(p.stem.rsplit('-', 1)[1]))
    pages = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ''
        pages.append({'page': i+1, 'characters': len(text.strip()), 'blankText': not bool(text.strip())})
    for start in range(0, len(files), 12):
        group = files[start:start+12]
        sheet = Image.new('RGB', (1200, ((len(group)+3)//4)*460), 'white')
        draw = ImageDraw.Draw(sheet)
        for j, file in enumerate(group):
            img = Image.open(file).convert('RGB'); img.thumbnail((290, 430))
            x, y = (j%4)*300, (j//4)*460
            sheet.paste(img, (x,y+25)); draw.text((x+5,y+5), f'{source.stem} p{start+j+1}', fill='black')
        sheet.save(out / f'{source.stem}-contact-{start//12+1}.png')
    results.append({'file': source.name, 'pageCount': len(reader.pages), 'pages': pages, 'scope': 'TEXT_AND_RENDERED_PAGES_NOT_HUMAN_ACCEPT'})
(root / 'PDF-PAGE-RESULTS.json').write_text(json.dumps(results, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps([{'file': r['file'], 'pages': r['pageCount'], 'blankTextPages': [p['page'] for p in r['pages'] if p['blankText']]} for r in results]))
