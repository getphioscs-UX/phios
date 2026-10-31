import pathlib,json,re,hashlib
import pdfplumber,pypdfium2 as pdfium
from PIL import Image,ImageOps,ImageDraw

p=pathlib.Path('content/production-closure/live-customer-commercial-convergence/financial-document-intelligence-s1-1');cmap=set(json.loads(pathlib.Path('.tmp/s11-font-codepoints.json').read_text()));receipts=[]
for filename,count in [('professional-draft.pdf',2),('synthetic-statements.pdf',8)]:
 doc=pdfium.PdfDocument(str(p/filename));assert len(doc)==count
 texts=[];images=[]
 with pdfplumber.open(p/filename) as pdf:
  for i,page in enumerate(pdf.pages):
   text=page.extract_text(x_tolerance=2,y_tolerance=3) or '';texts.append(text)
   assert '\ufffd' not in text and '\u25a1' not in text
   assert all(c.isspace() or ord(c) in cmap for c in text), 'FONT_COVERAGE_MISSING'
   words=page.extract_words();assert words and all(w['x0']>=0 and w['x1']<=page.width+1 and w['top']>=0 and w['bottom']<=page.height+1 for w in words)
   target=p/f'{filename[:-4]}-page-{i+1}.png';doc[i].render(scale=1.25).to_pil().save(target);images.append(Image.open(target).convert('RGB'))
 alltext='\n'.join(texts);(p/(filename+'.txt')).write_text(alltext,encoding='utf8')
 if filename.startswith('professional'):
  for phrase in ['Operating Headroom','Unknown','27,000.00','9,000.00','LOCAL-FINANCIAL-COMPOSITION-R3','Other Obligations','经营者','发票','税务','2025-07-15']:
   assert phrase in alltext, 'PDF_TEXT_MISSING:'+phrase
  assert re.search(r'Operating\s+cash\s+flow',alltext,re.I)
 else:
  assert 'Receivables Balance Summary' in texts[3] and 'Payables Balance Summary' in texts[4]
  assert 'aging buckets' in texts[3] and '0–30' not in texts[3]
 thumbw=330;thumbs=[]
 for i,img in enumerate(images):
  img.thumbnail((thumbw,470));canvas=Image.new('RGB',(350,500),'#eee');canvas.paste(img,((350-img.width)//2,22));ImageDraw.Draw(canvas).text((12,5),f'Page {i+1}',fill='black');thumbs.append(canvas)
 cols=2 if count==2 else 4;rows=(count+cols-1)//cols;sheet=Image.new('RGB',(cols*350,rows*500),'white')
 for i,img in enumerate(thumbs):sheet.paste(img,((i%cols)*350,(i//cols)*500))
 sheet.save(p/(filename[:-4]+'-contact.png'))
 receipts.append({'file':filename,'pages':count,'actualPdfRendered':True,'textExtractionPassed':True,'replacementOrBoxCharacters':False,'fontCoverage':'ALL_EXTRACTED_TEXT_CODEPOINTS_SUPPORTED','wordBoundsPassed':True,'sha256':hashlib.sha256((p/filename).read_bytes()).hexdigest()})
(p/'PDF-TEXT-VISUAL-CHECKS.json').write_text(json.dumps(receipts,indent=2),encoding='utf8');print('ALL_10_PDF_PAGES_RENDERED_AND_TEXT_CHECKED')
