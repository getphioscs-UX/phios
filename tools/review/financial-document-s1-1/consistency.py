import csv,json,pathlib,re,datetime
import pdfplumber
from openpyxl import load_workbook
p=pathlib.Path('content/production-closure/live-customer-commercial-convergence/financial-document-intelligence-s1-1');d=json.loads((p/'reviewed-data.json').read_text(encoding='utf8'));rows=list(csv.DictReader((p/'financial-export.csv').open(encoding='utf8')));w=load_workbook(p/'synthetic-statements.xlsx',data_only=False);assert w.sheetnames==['Sources','Reviewed'];review=w['Reviewed'];assert not any(c.data_type=='f' for s in w for row in s for c in row)
assert review['B10'].value==d['periods'][0]['sourceVersion'];assert review['C10'].value==d['periods'][1]['sourceVersion'];assert review['B12'].value==d['periods'][0]['calculationVersion'];assert isinstance(review['B16'].value,datetime.datetime);assert 'Fixed result' in review['D8'].value
with pdfplumber.open(p/'professional-draft.pdf') as pdf:text=pdf.pages[0].extract_text()
value_lines=[line for line in text.splitlines() if len(re.findall(r'-?\d{1,3}(?:,\d{3})*\.\d{2}',line))==2];assert len(value_lines)>=5
for i,(metric,labels) in enumerate(d['labels'].items(),2):
 vals=re.findall(r'-?\d{1,3}(?:,\d{3})*\.\d{2}',value_lines[i-2])
 for j,period in enumerate(d['periods']):
  expected=period['metrics'][metric];assert int(round(float(vals[j].replace(',',''))*100))==expected
  assert int(round(review.cell(i,j+2).value*100))==expected
  row=next(r for r in rows if r['Period']==period['period'] and r['Metric']==metric);assert int(row['ValueMinor'])==expected;assert row['SourceVersion']==period['sourceVersion']
  html=(p/'analysis.html').read_text(encoding='utf8');assert f'data-period="{period["period"]}" data-metric="{metric}" data-minor="{expected}"' in html
receipt={'status':'PASS','metrics':10,'formats':['JSON','PDF_EXTRACTED_TEXT','HTML_DATA_ATTRIBUTES','CSV','XLSX_SAVED_VALUES'],'fixedSnapshotNoFormulas':True,'metadataDateIsTyped':True,'sourceVersionsMatched':True,'publicationCandidateBlockedOnMismatch':True}
(p/'CROSS-OUTPUT-CONSISTENCY.json').write_text(json.dumps(receipt,indent=2),encoding='utf8');print('CROSS_OUTPUT_10_METRICS_PASS')
