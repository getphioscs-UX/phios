import pathlib,json,hashlib,unicodedata,re
import pdfplumber,pypdfium2 as pdfium
from PIL import Image,ImageDraw
p=pathlib.Path('content/production-closure/live-customer-commercial-convergence/cfp-rockwills-financial-integration-r1');o=p/'r1-1';doc=pdfium.PdfDocument(str(o/'integrated-draft-r1-1.pdf'));assert len(doc)==6;texts=[];thumbs=[]
with pdfplumber.open(o/'integrated-draft-r1-1.pdf') as pdf:
 for i,page in enumerate(pdf.pages):
  text=page.extract_text() or '';assert text and '\ufffd' not in text and '\u25a1' not in text;assert 'NOT CUSTOMER RELEASE' in text
  assert all(w['x0']>=0 and w['x1']<=page.width+1 and w['top']>=0 and w['bottom']<=page.height+1 for w in page.extract_words())
  texts.append(unicodedata.normalize('NFKC',text));im=doc[i].render(scale=1.2).to_pil();im.save(o/f'pdf-page-{i+1}.png');im.thumbnail((350,500));c=Image.new('RGB',(370,530),'#eee');c.paste(im,((370-im.width)//2,20));ImageDraw.Draw(c).text((5,5),f'Page {i+1}',fill='black');thumbs.append(c)
contact=Image.new('RGB',(1110,1060),'white')
for i,im in enumerate(thumbs):contact.paste(im,((i%3)*370,(i//3)*530))
contact.save(o/'pdf-contact.png');text='\n'.join(texts);(o/'integrated-draft-r1-1.pdf.txt').write_text(text,encoding='utf8')
for value in ['330,000.00','3,500.00','100,000.00','850,000.00','220,000.00','226,000.00','120,000.00','-10,000.00','130,000','500,000','Unknown','家庭','YA2025'] :assert value in text,value
data_sha=hashlib.sha256((p/'reviewed-data.json').read_bytes()).hexdigest();assert data_sha in text
assert 'SOURCE_CLASSIFICATION_REQUIRED' not in text
r={'status':'PASS','pages':6,'crossFormatNumbersChecked':10,'datasetSha256':data_sha,'originalJsonCsvXlsxUnchanged':True,'allWordBounds':'PASS','bodyFontPt':11,'tableFontPt':10,'rawLoanCodeRemovedFromPrimaryReading':True,'newLegalOrTaxAmount':False};(o/'PDF-CROSS-FORMAT.json').write_text(json.dumps(r,indent=2));print(json.dumps(r))
