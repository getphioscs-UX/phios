from pathlib import Path
import json,re,hashlib,unicodedata
import pypdfium2 as pdfium
from pypdf import PdfReader
r=Path('C:/phios/tools/review/five-method-paid-report-r1');p=r/'SYNTHETIC-BZR-INITIAL-PDF.pdf';proof=json.loads((r/'BZR-INITIAL-PDF-CHECKS.json').read_text(encoding='utf-8-sig'));source=json.loads((r/'BZR-FROZEN-PDF-SOURCE.json').read_text(encoding='utf-8-sig'));doc=pdfium.PdfDocument(str(p));texts=[]
for page in doc:
 t=page.get_textpage();texts.append(t.get_text_range());t.close();page.close()
norm=lambda s:re.sub(r'\s+','',unicodedata.normalize('NFKC',s).replace('\u00ad','').replace('\u200b',''))
whole=norm('\n'.join(texts));rows=[]
for section in source['sections']:
 for lang,key in [('zh-Hans','zhHansManuscript'),('en','enManuscript')]:
  paragraphs=[s.strip() for s in section[key].split('\n') if len(s.strip())>12]
  missing=[i+1 for i,s in enumerate(paragraphs) if norm(s) not in whole]
  rows.append({'sectionId':section['sectionId'],'locale':lang,'paragraphs':len(paragraphs),'missingParagraphNumbers':missing,'allFrozenParagraphsPresent':not missing})
reader=PdfReader(p);a4=all(abs(float(x.mediabox.width)-595.28)<1 and abs(float(x.mediabox.height)-841.89)<1 for x in reader.pages)
for n in [0,9,24,47]:
 page=doc[n];bmp=page.render(scale=1);bmp.to_pil().save(r/'screenshots'/f'BZR-INITIAL-page-{n+1}.png');bmp.close();page.close()
result={'scope':'Actual new uncompressed native-rendered synthetic BZR, compared with frozen generated manuscript and IR; not optimization or Human ACCEPT','bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'matchesPrivateStorageAndDownload':hashlib.sha256(p.read_bytes()).hexdigest()==proof['pdfSHA256'],'pageCount':len(doc),'nativePlanPageCount':source['publication']['pageCount'],'allA4':a4,'bookmarkCount':len(reader.outline),'linkAnnotations':sum(len(x.get('/Annots',[])) for x in reader.pages),'pagesWithExtractableText':sum(bool(s.strip()) for s in texts),'paragraphChecks':rows,'allFrozenParagraphsPresent':all(x['allFrozenParagraphsPresent'] for x in rows),'metadata':{str(k):str(v) for k,v in (reader.metadata or {}).items()},'overlapAndDiagramGate':'Existing native browser verifier passed physical 48-page/15-diagram/fit/image/print gates; key screenshots require inspection','optimization':'NOT_APPLIED_NOT_ADMITTED','newHumanAcceptance':False}
(r/'BZR-ISSUED-PDF-QA.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');doc.close();print({k:result[k] for k in ['bytes','pageCount','bookmarkCount','allA4','allFrozenParagraphsPresent','matchesPrivateStorageAndDownload']})
