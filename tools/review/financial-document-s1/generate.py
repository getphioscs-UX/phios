import json,pathlib,csv,sys
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
out=pathlib.Path('content/production-closure/live-customer-commercial-convergence/financial-document-intelligence-staging-s1');(out/'documents').mkdir(exist_ok=True)
periods={
'2025-Q1':dict(revenue=186000,costOfSales=102000,operatingExpenses=51000,financeCosts=2000,tax=6000,netProfit=25000,currentAssets=84000,currentLiabilities=32000,receivables=42000,payables=22000,inventory=26000,loans=50000,otherObligations=0,operatingCashFlow=18000,investingCashFlow=-7000,financingCashFlow=-9000,openingCash=14000,closingCash=16000,restrictedCash=2000,committedCash=6000,minimumOperatingReserve=12000,loanPrincipalPayments=4000,interestPaid=2000,capitalExpenditure=7000,totalAssets=134000,totalLiabilities=72000,equity=62000,fixedAssets=50000,ownerDrawings=10000,loanProceeds=5000,householdNeeds=12000),
'2025-Q2':dict(revenue=224000,costOfSales=128000,operatingExpenses=58000,financeCosts=3000,tax=8000,netProfit=27000,currentAssets=100000,currentLiabilities=43000,receivables=61000,payables=31000,inventory=34000,loans=56000,otherObligations=0,operatingCashFlow=9000,investingCashFlow=-12000,financingCashFlow=-8000,openingCash=16000,closingCash=5000,restrictedCash=1000,committedCash=5000,minimumOperatingReserve=12000,loanPrincipalPayments=3000,interestPaid=3000,capitalExpenditure=12000,totalAssets=162000,totalLiabilities=87000,equity=75000,fixedAssets=62000,ownerDrawings=14000,loanProceeds=9000,householdNeeds=15000)}
groups={'profit-loss':['revenue','costOfSales','operatingExpenses','financeCosts','tax','netProfit'],'balance-sheet':['currentAssets','currentLiabilities','closingCash','receivables','payables','inventory','loans','fixedAssets','totalAssets','totalLiabilities','equity'],'cash-flow':['openingCash','operatingCashFlow','investingCashFlow','financingCashFlow','closingCash','capitalExpenditure','loanPrincipalPayments','interestPaid','loanProceeds'],'receivables-aging':['receivables'],'payables-aging':['payables'],'inventory':['inventory'],'owner-transactions':['ownerDrawings','householdNeeds'],'business-information':['restrictedCash','committedCash','minimumOperatingReserve','otherObligations']}
manifest=[]
for kind,fields in groups.items():
 rows=[]
 for period,values in periods.items():
  date='2025-03-31' if period.endswith('Q1') else '2025-06-30'
  for field in fields:rows.append([field,str(values[field])+'.00','CURRENCY_MINOR',period,'MYR','SYNTHETIC-S1:'+kind+':'+period+':'+field,date])
 f=out/'documents'/f'{kind}.csv'
 with f.open('w',newline='',encoding='utf8') as h:w=csv.writer(h);w.writerow(['field','value','unit','period','currency','sourceRef','sourceDate']);w.writerows(rows)
 manifest.append({'id':'S1-'+kind,'type':kind,'csv':str(f).replace('\\','/'),'rows':rows})
c=canvas.Canvas(str(out/'documents'/'synthetic-statements.pdf'),pagesize=A4)
for m in manifest:
 c.setFont('Helvetica-Bold',16);c.drawString(42,800,'FICTIONAL SME - SYNTHETIC ONLY');c.setFont('Helvetica',10);c.drawString(42,777,'Saffron Workshop Example - NOT A REAL BUSINESS');c.drawString(42,758,m['type']+' | MYR | accrual | unaudited')
 y=730
 for r in m['rows']:
  c.drawString(42,y,' | '.join([r[3],r[0],r[1],r[4]]));y-=18
 c.setFont('Helvetica',9);c.drawString(42,50,'Document data only. No real customer data. No legal or professional admission.');c.showPage()
c.save()
(out/'synthetic-package.json').write_text(json.dumps({'synthetic':True,'entity':'Saffron Workshop Example','legalForm':'SOLE_PROPRIETORSHIP','subjectId':'s1-fictional-business','periods':periods,'documents':manifest,'assumptions':['No depreciation in the two synthetic comparison periods','Q2 equity = Q1 equity + Q2 net profit - Q2 drawings','Cash flow financing includes loan proceeds less principal and drawings; do not deduct twice','Household needs are synthetic self-declared requirements, not personal account access']},indent=2))
print('GENERATED_8_CSV_AND_8_PAGE_SYNTHETIC_PDF')
