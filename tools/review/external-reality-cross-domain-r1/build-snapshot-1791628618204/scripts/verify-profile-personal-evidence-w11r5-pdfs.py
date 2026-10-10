import json
from pathlib import Path
from pypdf import PdfReader
out = Path('content/profile/successors/personal-evidence-r1/w11r5')
results = []
for case in ['CASE-01', 'CASE-08', 'CASE-09']:
    path = Path('output/pdf') / f'{case}-bilingual-dossier.pdf'
    reader = PdfReader(path)
    radar_page = None
    for index, page in enumerate(reader.pages):
        text = page.extract_text()
        if 'Pattern radar' in text:
            radar_page = index + 1
    results.append({'case': case, 'path': str(path), 'pages': len(reader.pages), 'radarPage': radar_page})
(out / 'pdf-results.json').write_text(json.dumps(results, indent=2), encoding='utf8')
print(json.dumps(results))
