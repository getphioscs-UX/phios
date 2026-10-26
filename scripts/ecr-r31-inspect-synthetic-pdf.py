import pathlib,json,re
from pypdf import PdfReader
p=pathlib.Path('tools/review/phi-configuration-deep-reading-r2-integrated/r31-author-publication')
r=PdfReader(p/'SYNTHETIC-BILINGUAL-RENDERER-QA.pdf')
expected=json.loads((p/'synthetic-exact-text.json').read_text(encoding='utf8'))
stamp='SYNTHETIC ENGINEERING SAMPLE / NOT AUTHOR MANUSCRIPT / NOT CUSTOMER DELIVERY'
normalize=lambda s:re.sub(r'\s+','',s)
texts=[x.extract_text() or '' for x in r.pages]
clean=[]
for text in texts:
 text=text.replace(stamp,'')
 text=re.sub(r'SYNTHETIC QA\s*·\s*\d+\s*/\s*\d+','',text)
 clean.append(text)
text=normalize('\n'.join(clean))
result={'syntheticOnly':True,'pages':len(r.pages),'pageSizes':[[round(float(x.mediabox.width),2),round(float(x.mediabox.height),2)] for x in r.pages],
 'fullZhTextPreserved':normalize(expected['zh']) in text,'fullEnTextPreserved':normalize(expected['en']) in text,
 'stampsEveryPage':all(stamp in x for x in texts),'comparisonRule':'Remove explicit QA headers/footers and layout whitespace only; preserve every manuscript character.','authorPdfCreated':False}
(p/'synthetic-pdf-inspection.json').write_text(json.dumps(result,indent=2),encoding='utf8')
print(json.dumps(result))
assert result['fullZhTextPreserved'] and result['fullEnTextPreserved'] and result['stampsEveryPage']
