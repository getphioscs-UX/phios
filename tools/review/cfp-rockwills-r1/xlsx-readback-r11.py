import pathlib,json,zipfile,html,hashlib
import openpyxl
p=pathlib.Path('content/production-closure/live-customer-commercial-convergence/cfp-rockwills-financial-integration-r1');o=p/'r1-1';x=p/'integrated-review.xlsx'
with zipfile.ZipFile(x) as z:
 assert z.testzip() is None
 assert all(k in z.namelist() for k in ['[Content_Types].xml','xl/workbook.xml','xl/worksheets/sheet1.xml','xl/worksheets/sheet2.xml'])
w=openpyxl.load_workbook(x,data_only=False);d=json.loads((p/'integrated-review.json').read_text(encoding='utf8'));values=openpyxl.load_workbook(x,data_only=True)
for i,m in enumerate(d['metrics'],2):assert values['Review'].cell(i,2).value==(m['valueMYR'] if m['valueMYR'] is not None else 'Unknown / 未知')
parts=[]
for s in w:
 rows=[]
 for row in s.iter_rows():
  cells=[]
  for c in row:
   v=c.value
   if isinstance(v,(int,float)):v=f'{v:,.2f}' if s.title=='Review' and c.column==2 else str(v)
   cells.append('<td>'+html.escape(str(v if v is not None else ''))+'</td>')
  rows.append('<tr>'+''.join(cells)+'</tr>')
 parts.append('<section data-sheet="'+s.title+'"><h1>'+s.title+'</h1><p>Read-only preview of the saved XLSX · 已保存工作簿的只读预览</p><div class="scroll"><table>'+''.join(rows)+'</table></div></section>')
page='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Saved XLSX read-only preview</title><style>body{font:15px/1.5 system-ui,"Microsoft YaHei",sans-serif;color:#173047;background:#f4f1e9;margin:32px}section{margin-bottom:50px}table{border-collapse:collapse;width:100%;table-layout:fixed;background:white}td{padding:14px;border:1px solid #ddd;overflow-wrap:anywhere;vertical-align:top}td:nth-child(1){width:22%}td:nth-child(2){width:18%}td:nth-child(3){width:30%}tr:first-child{background:#173047;color:white;font-weight:bold}.scroll{overflow:auto}table{min-width:1050px}</style>'+''.join(parts)+'</html>'
(o/'xlsx-preview.html').write_text(page,encoding='utf8');r={'status':'PASS','zipCRC':'PASS','sheets':w.sheetnames,'metricsChecked':11,'sha256':hashlib.sha256(x.read_bytes()).hexdigest(),'excelApplication':'NOT_VERIFIED','renderer':'Chromium HTML projection of actual saved cells; not Excel engine','formulasExpected':0};(o/'XLSX-READBACK.json').write_text(json.dumps(r,indent=2));print(json.dumps(r))
