from pathlib import Path
for name in ['commerce-stripe-events.js','stripe-client.js','book-delivery.js','commerce-stripe-api.js']:
 p=Path('functions/commerce')/name
 s=p.read_bytes().decode();lines=s.splitlines(keepends=True);out=[]
 for line in lines:
  if out and line.strip()==out[-1].strip() and ('bookPdf' in line or 'orderBookPdfSource' in line):continue
  out.append(line)
 s=''.join(out).replace('if(bookPdf)contextSnapshot.bookPdf=bookPdf;if(bookPdf)contextSnapshot.bookPdf=bookPdf;','if(bookPdf)contextSnapshot.bookPdf=bookPdf;')
 p.write_bytes(s.encode())
p=Path('functions/commerce/book-product-registry.js');p.write_bytes(p.read_bytes().replace(b'\r\n',b'\n'))
p=Path('assets/customer-ui/js/surfaces/commerce-account.js');s=p.read_bytes().decode();s=s.replace("['BOOK','My Books','我的书籍']","['BOOK','My Books · PDF library','个人书库 · PDF 下载']");p.write_bytes(s.encode())
