"""Read-only PDF/source check; only receipts/PNG renders write to the D: QA run.

Retain the strict extraction mismatch as evidence. The bundled CJK font's
ToUnicode map uses several radical/variant aliases; normalized coverage is a
separate check and never grants publication acceptance or exact copy fidelity.
"""
import hashlib, json, subprocess, sys, unicodedata
from pathlib import Path
from pypdf import PdfReader

root = Path(sys.argv[1]).resolve()
base = Path(r'D:\PHIOS\QA-TEMP\SIX-METHOD-R2').resolve()
if not root.is_relative_to(base):
    raise RuntimeError('APPROVED_D_QA_RUN_REQUIRED')
publication = json.loads((root / 'NATIVE-PUBLICATION.json').read_text(encoding='utf-8'))
pdf = root / 'NUM-NATIVE-CANDIDATE.pdf'
reader = PdfReader(str(pdf))
aliases = {'\u2ec6': '\u89d2', '\u2ed3': '\u957f', '\u2ec5': '\u89c1',
           '\u2eda': '\u9875', '\u6236': '\u6237', '\u2edb': '\u98ce'}

def normalized(text, glyph_aliases=False):
    text = unicodedata.normalize('NFKC', text)
    if glyph_aliases:
        for source, target in aliases.items():
            text = text.replace(source, target)
    return ''.join(c for c in text if c.isalnum())

render_receipt = json.loads((root / 'RENDER-RECEIPT.json').read_text(encoding='utf-8'))
plan = render_receipt.get('physicalPlan')
missing, strict_missing, units = [], [], 0
for index, section in enumerate(publication['pages']):
    physical = next((entry['physicalPageNumber'] for entry in plan if entry.get('logicalPageId') == section['logicalPageId']), index + 1) if plan else index + 1
    text = reader.pages[physical - 1].extract_text() or ''
    for locale in ['zh-Hans', 'en']:
        for unit in section['languages'][locale]['units']:
            units += 1
            item = {'unitId': unit['unitId'], 'locale': locale, 'pdfPage': physical}
            if normalized(unit['text']) not in normalized(text):
                strict_missing.append(item)
            if normalized(unit['text'], True) not in normalized(text, True):
                missing.append(item)

exe = Path(r'C:\Users\Guest Account\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\poppler\Library\bin\pdftoppm.exe')
images = []
sample_pages = sorted(set([1, 6, len(reader.pages)] + ([entry['physicalPageNumber'] for entry in plan if entry.get('logicalPageId') in ['P06', 'P15', 'P24']] if plan else [10])))
for page in sample_pages:
    prefix = root / f'PDF-P{page:02d}'
    subprocess.run([str(exe), '-f', str(page), '-l', str(page), '-scale-to', '1400',
                    '-png', '-singlefile', str(pdf), str(prefix)], check=True, capture_output=True)
    image = prefix.with_suffix('.png')
    images.append({'path': str(image), 'sha256': hashlib.sha256(image.read_bytes()).hexdigest()})
receipt = {'pages': len(reader.pages), 'nativeUnits': units, 'strictExtractionMissing': strict_missing,
           'normalizedMissing': missing, 'allUnitsPresentAfterDocumentedGlyphNormalization': not missing,
           'glyphAliases': aliases, 'normalization': 'NFKC, explicit CJK font aliases, whitespace/punctuation removal',
           'pdfSHA256': hashlib.sha256(pdf.read_bytes()).hexdigest(), 'renderedSamples': images,
           'publicationAccepted': False, 'coverage': render_receipt['coverage'],
           'remainingQualityItem': 'CJK ToUnicode aliases affect exact literal search/copy fidelity; native-source editorial and Owner layout review pending.'}
if (root / 'COVER-BINDING.json').exists():
    cover = json.loads((root / 'COVER-BINDING.json').read_text())
    cover_text = normalized(reader.pages[0].extract_text() or '', True)
    receipt['coverSourceFieldsPresent'] = all(normalized(field['value'], True) in cover_text for field in cover['fields'])
    if not receipt['coverSourceFieldsPresent']:
        raise RuntimeError('NATIVE_COVER_SUBJECT_FIELDS_MISSING')
if (root / 'CONTENTS-BINDING.json').exists():
    identity = reader.trailer['/Root']['/PHIOSContentsIdentity']
    issued = json.loads((root / 'issued.json').read_text())
    if str(identity['/ReportId']) != issued['reportId']:
        raise RuntimeError('CONTENTS_REPORT_ID_MISMATCH')
    receipt['contentsIdentityMatchesJobReport'] = True
    receipt['contentsLinks'] = len([a for a in reader.pages[5].get('/Annots', []) if a.get_object().get('/Subtype') == '/Link'])
    if receipt['contentsLinks'] != 10:
        raise RuntimeError('CONTENTS_TEN_SECTION_LINKS_REQUIRED')
(root / 'PDF-COVERAGE-AND-RENDER.json').write_text(json.dumps(receipt, indent=2, ensure_ascii=True), encoding='utf-8')
if missing:
    raise RuntimeError('NATIVE_PDF_SOURCE_UNIT_MISSING')
print(json.dumps({'pages': len(reader.pages), 'nativeUnits': units, 'normalizedMissing': len(missing),
                  'strictExtractionMismatches': len(strict_missing), 'images': images}))
