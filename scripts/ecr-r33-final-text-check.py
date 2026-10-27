import pathlib,json,hashlib,re,unicodedata,sys,difflib
from pypdf import PdfReader
root=pathlib.Path(sys.argv[1]);out=root/'r33-publication';index=json.loads((root/'CURRENT-EFFECTIVE-CHAPTERS.json').read_text(encoding='utf8'));checks=[]
def visible(s):
 s=re.sub(r'^#{1,6}\s+','',s,flags=re.M);s=re.sub(r'\*\*([^*]+)\*\*',r'\1',s);s=re.sub(r'`([^`]+)`',r'\1',s);return re.sub(r'^\s*---\s*$','',s,flags=re.M)
def norm(s):return re.sub(r'\s+','',unicodedata.normalize('NFKC',s))
versions=index['versions'];source=[]
for v in versions:
 raw=(pathlib.Path(v['folder'])/'exact-text.txt').read_bytes();source.append({'section':v['sectionId'],'locale':v['locale'],'pass':hashlib.sha256(raw).hexdigest()==v['exactTextSha256']})
for r in json.loads((out/'pdf-results.json').read_text(encoding='utf8'))['results']:
 directory=out/r['locale'];maps=json.loads((directory/'page-map.json').read_text());pdf=PdfReader(r['file']);current=[]
 for v in versions:
  if r['locale']!='bilingual' and v['locale']!=r['locale']:continue
  texts=[re.sub(r'PRIVATE AUTHOR REVIEW - NOT CUSTOMER DELIVERY\s+\d+\s*$','',pdf.pages[i].extract_text() or '') for i,m in enumerate(maps) if m.get('sectionId')==v['sectionId'] and m['kind']=='BODY_TEXT'];expected=norm(visible((pathlib.Path(v['folder'])/'exact-text.txt').read_text(encoding='utf8')));actual=norm(''.join(texts));
  # Native folios and header labels are additional renderer text, never edits to the author prose.
  record={'section':v['sectionId'],'locale':v['locale'],'pass':expected in actual,'expectedCharacters':len(expected),'actualCharacters':len(actual),'finalPdfChecked':True};current.append(record);checks.append(record)
  if not record['pass']:
   ops=[{'op':t,'expectedRange':[i,j],'actualRange':[k,l],'expectedCodes':[ord(c) for c in expected[i:min(j,i+3)]],'actualCodes':[ord(c) for c in actual[k:min(l,k+3)]]} for t,i,j,k,l in difflib.SequenceMatcher(None,expected,actual,autojunk=False).get_opcodes() if t!='equal'];record['differenceCodes']=ops
 (directory/'text-extraction-checks.json').write_text(json.dumps(current,indent=2),encoding='utf8')
report={'sourceChecks':source,'finalPdfChecks':checks,'sourceIntegrity':all(x['pass'] for x in source),'renderedIntegrity':all(x['pass'] for x in checks),'normalization':'Markdown presentation markers, whitespace and NFKC; raw SHA verifies original bytes.'};(out/'FINAL-TEXT-INTEGRITY.json').write_text(json.dumps(report,indent=2),encoding='utf8');print(json.dumps({'rawHashes':sum(c['pass'] for c in source),'rawTotal':len(source),'finalBodies':sum(c['pass'] for c in checks),'finalTotal':len(checks)}))
if not report['sourceIntegrity'] or not report['renderedIntegrity']:raise RuntimeError('FINAL_TEXT_CHECK_FAILED')
