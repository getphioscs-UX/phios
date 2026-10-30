import json, hashlib, importlib.util
from pathlib import Path
from pypdf import PdfReader
source=Path(r'C:\Users\Guest Account\Desktop\Financial Plan.pdf')
reader=PdfReader(str(source))
terms={'planning_scope':['financial planning','financial plan'], 'cash_flow':['cash flow','income','expenses'], 'balance_sheet':['assets','liabilities','net worth'], 'goals':['objectives','goals'], 'risk_protection':['insurance','risk management','protection'], 'retirement':['retirement'], 'education':['education'], 'assumptions':['assumptions','inflation'], 'implementation_review':['implementation','review','recommendation'], 'estate':['estate','will']}
pages=[]
for i,page in enumerate(reader.pages):
    text=(page.extract_text() or '').lower()
    pages.append({'page':i+1,'structureTags':[k for k,needles in terms.items() if any(n in text for n in needles)],'hasText':bool(text.strip())})
out={'sourcePath':str(source),'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'pageCount':len(reader.pages),'pages':pages,'status':'READ_ONLY_SOURCE_STRUCTURAL_REVIEW','privateValuesCopied':False,'permission':'Methodology structure only; no original client data, amounts or source page image in public evidence.'}
Path('content/production-closure/live-customer-commercial-convergence/subject-bft-r4/PDF-SOURCE-STRUCTURE.json').write_text(json.dumps(out,indent=2),encoding='utf-8')
print(json.dumps({'pageCount':len(reader.pages),'pages':pages,'pdfiumAvailable':bool(importlib.util.find_spec('pypdfium2'))}))
if importlib.util.find_spec('pypdfium2'):
    import pypdfium2 as pdfium
    pdf=pdfium.PdfDocument(str(source))
    selected=[0]+[p['page']-1 for p in pages if 'cash_flow' in p['structureTags']][:1]
    for index in dict.fromkeys(selected):
        pdf[index].render(scale=1).to_pil().save(f'.tmp/subject-bft-r4/private-source-page-{index+1}.png')
