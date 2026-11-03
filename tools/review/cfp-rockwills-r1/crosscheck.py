import pathlib,json,csv,hashlib
import pdfplumber,pypdfium2 as pdfium,openpyxl
from PIL import Image,ImageDraw
p=pathlib.Path('content/production-closure/live-customer-commercial-convergence/cfp-rockwills-financial-integration-r1'); data=json.loads((p/'integrated-review.json').read_text(encoding='utf8')); book=openpyxl.load_workbook(p/'integrated-review.xlsx',data_only=True);sheet=book['Review']
assert json.loads((p/'XLSX-PROCESS-EXIT.json').read_text())['exitCode']==0
with (p/'integrated-review.csv').open(encoding='utf-8-sig',newline='') as f: rows=list(csv.reader(f))
for i,m in enumerate(data['metrics'],2):
 expected=m['valueMYR'] if m['valueMYR'] is not None else 'Unknown / 未知'
 assert sheet.cell(i,2).value==expected,(i,sheet.cell(i,2).value,expected)
 assert rows[i-1][1]==str(expected),(i,rows[i-1][1],expected)
 assert sheet.cell(i,4).value==data['datasetSha']
assert sheet['B2'].value==330000 and sheet['B3'].value==3500 and sheet['B6'].value==220000 and sheet['B7'].value==226000 and sheet['B12'].value==500000
assert data['datasetSha']==hashlib.sha256((p/'reviewed-data.json').read_bytes()).hexdigest()
assert data['datasetSha'] in (p/'integrated-draft.html').read_text(encoding='utf8')
doc=pdfium.PdfDocument(str(p/'integrated-draft.pdf'));assert len(doc)==6
texts=[];thumbs=[]
with pdfplumber.open(p/'integrated-draft.pdf') as pdf:
 for i,page in enumerate(pdf.pages):
  t=page.extract_text() or '';assert 'SYNTHETIC REVIEW DRAFT' in t;assert '\ufffd' not in t and '\u25a1' not in t
  assert all(w['x0']>=0 and w['x1']<=page.width+1 and w['top']>=0 and w['bottom']<=page.height+1 for w in page.extract_words())
  texts.append(t);im=doc[i].render(scale=1.2).to_pil();im.save(p/f'pdf-page-{i+1}.png');im.thumbnail((350,500));c=Image.new('RGB',(370,530),'#eee');c.paste(im,((370-im.width)//2,20));ImageDraw.Draw(c).text((5,5),f'Page {i+1}',fill='black');thumbs.append(c)
contact=Image.new('RGB',(1110,1060),'white')
for i,im in enumerate(thumbs):contact.paste(im,((i%3)*370,(i//3)*530))
contact.save(p/'pdf-contact.png');text='\n'.join(texts);(p/'integrated-draft.pdf.txt').write_text(text,encoding='utf8')
for required in ['330,000.00','3,500.00','100,000.00','850,000.00','220,000.00','226,000.00','500,000','Unknown','家庭','NOT CUSTOMER RELEASE',data['datasetSha']]:assert required in text,required
result={'status':'PASS','metricsIndependentlyReadBack':11,'xlsxNativeExitCode':0,'pdfPagesRendered':6,'wordBounds':'PASS','sameDatasetSHA':data['datasetSha'],'formats':['JSON','CSV','XLSX','HTML','PDF'],'unknownsPreserved':True,'fixedSnapshotNotLiveWorkbook':True};(p/'CROSS-FORMAT-QA.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
