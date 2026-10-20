import json,csv,re,html,hashlib,datetime,zipfile,xml.etree.ElementTree as E,math
from pathlib import Path
b=Path('tools/review/world-r3/gate2c');d=Path('tools/review/world-r3/gate2c-verification');raw=b/'WORLD-R3-GMCH-PILOT-SNAPSHOTS';norm=json.loads((raw/'NORMALIZED-OBSERVATIONS.json').read_text());prov=json.loads((b/'WORLD-R3-GMCH-PILOT-PROVENANCE.json').read_text());sources={r['id']:r for r in prov['readAttempts']};checks=[]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def verify(o,value,loc,unit,country,frequency):
 p=Path(sources[o['source_id']]['path']);diff=abs(value-o['value']);ok=diff<=max(0.00006,abs(value)*1e-12);record={'id':o['id'],'rawPath':p.as_posix(),'rawSha256':sha(p),'matchesRecordedSourceHash':sha(p)==o['source_hash'],'rawLocator':loc,'expected':o['value'],'reproduced':value,'unit':unit,'country':country,'observation_period':o['observation_period'],'frequency':frequency,'publication_date':o.get('publication_date'),'fetched_at':o.get('fetched_at'),'valueMatch':ok,'status':'VERIFIED_VALUE_METADATA_PARTIAL' if ok else 'FAIL'};checks.append(record);assert ok and record['matchesRecordedSourceHash'],record
# Raw HTML is the primary saved object; compare extracted page JSON separately.
s=(raw/'my-debt-dashboard.html').read_text();page=json.loads(re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>',s,re.S).group(1));assert page==json.loads((raw/'MY-DEBT-PAGE-DATA.json').read_text());pg=page['props']['pageProps'];my=[]
for stage,metric in [('applied','application_amount'),('approved','approval_amount'),('disbursed','disbursement_amount')]:
 data=pg['timeseries']['data'][stage]['rm'];assert len(data['x'])==len(data['property_residental']);assert len(set(data['x']))==len(data['x'])
 for i,(x,v) in enumerate(zip(data['x'],data['property_residental'])):
  period=datetime.datetime.fromtimestamp(x/1000,datetime.timezone.utc).strftime('%Y-%m')
  if period.startswith('2024'):
   o=next(o for o in norm if o['id']==f'MY_{stage}_{period}');verify(o,v,f'HTML __NEXT_DATA__ props.pageProps.timeseries.data.{stage}.rm.property_residental[{i}]','MYR','MYS','MONTHLY_MONETARY_FLOW');my.append(checks[-1])
assert len(my)==36 and len({(x['id'],x['observation_period']) for x in my})==36
cpi=list(csv.DictReader((raw/'my-cpi-full.csv').open()))
for o in [o for o in norm if o['source_id']=='my-cpi-full']:
 row=next(x for x in cpi if x['date'][:7]==o['observation_period'] and x['division']=='overall');verify(o,float(row['index']),f'CSV date={row["date"]},division=overall,index','index_2010_100','MYS','MONTHLY_INDEX_NOT_RATE')
income=json.loads((raw/'my-income.json').read_text())
for o in [o for o in norm if o['source_id']=='my-income']:
 row=next(x for x in income if x['date'][:4]==o['observation_period']);verify(o,row['income_median'],'income_median; date='+row['date'],'MYR_per_month_income_LEVEL','MYS','SURVEY_REFERENCE_YEAR_NOT_MONTHLY_OBSERVATIONS')
# Parse SLOOS question boundaries independently; counts, not printed rounded net percentages.
t=re.sub(r'\s+',' ',html.unescape(re.sub('<[^>]+>',' ',(raw/'fed-table-corrected.html').read_text(errors='replace'))))
for oid,section,begin,end,labels,signs in [('US_STD_GOV_2024Q3','13. Over','B. Credit standards','C. Credit standards',['Tightened considerably','Tightened somewhat','Eased somewhat','Eased considerably'],[1,1,-1,-1]),('US_DEMAND_GOV_2024Q3','14. Apart','B. Demand','C. Demand',['Substantially stronger','Moderately stronger','Moderately weaker','Substantially weaker'],[1,1,-1,-1])]:
 q=t[t.index(section):];q=q[q.index(begin):q.index(end)];counts={l:int(re.search(re.escape(l)+r'\s+(\d+)\s+[\d.]+',q).group(1)) for l in labels};n=int(re.search(r'Total\s+(\d+)\s+100',q).group(1));assert n==49;v=sum(counts[l]*sgn for l,sgn in zip(labels,signs))/n*100;o=next(o for o in norm if o['id']==oid);verify(o,v,section+' / '+begin+' / all respondent counts',o['unit'],'USA','QUARTERLY_BANK_SURVEY');checks[-1]['inputCounts']=counts;checks[-1]['respondents']=n
hmda=[]
for year in ['2024','2025']:
 p=raw/f'hmda-aggregate-{year}.json';x=json.loads(p.read_text());assert x['parameters']['loan_purposes']=='1' and x['parameters']['actions_taken']=='1,2,3';counts={r['actions_taken']:r['count'] for r in x['aggregations']};assert set(counts)=={'1','2','3'}
 for action,n in counts.items():
  o=next(o for o in norm if o['id']==f'HMDA_{year}_ACTION_{action}');verify(o,n,'aggregations actions_taken='+action+';loan_purposes=1','records','USA','ANNUAL_ACTION_RECORDS')
 total=sum(counts.values());hmda.append({'year':year,'sourcePath':p.as_posix(),'sourceHash':sha(p),'requestURL':sources[f'hmda-aggregate-{year}']['url'],'parameters':x['parameters'],'actionCounts':counts,'numeratorDeniedAction3':counts['3'],'denominatorActions1_2_3':total,'denial_share_in_defined_hmda_scope':counts['3']/total,'unit':'share_of_reported_homepurchase_actionrecords_not_unique_people','inclusions':['1 loan originated','2 approved not accepted','3 denied'],'exclusions':['4 withdrawn','5 incomplete','6 purchased','7 preapproval denied','8 preapproval approved not accepted','loanpurpose2/31/32/4/5 excluded'],'unfiltered':['loan type','lien','occupancy','dwelling','open/closed-end','business purpose','income band','reporter institution type'],'vintage':'DYNAMIC_API_CACHE; not the frozen annual Snapshot','initialPublicationDate':None,'validConclusion':'Descriptive share in this defined record universe only; not all applications, same origination cohort or applicant probability','yearToYearCausation':'NOT_IDENTIFIED; applicant mix/reporting/revisions may differ'})
# Native OOXML read, using first numeric row as independent base-period check.
z=zipfile.ZipFile(raw/'fhfa-hpi-history.xlsx');ns={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'};ss=[''.join(e.itertext()) for e in E.fromstring(z.read('xl/sharedStrings.xml'))];root=E.fromstring(z.read('xl/worksheets/sheet1.xml'));fh=[];first=None
for row in root.findall('.//s:row',ns):
 cells={}
 for c in row.findall('s:c',ns):
  v=c.find('s:v',ns)
  if v is not None:cells[re.sub(r'\d','',c.get('r'))]=ss[int(v.text)] if c.get('t')=='s' else v.text
 if cells.get('A','').isdigit():
  date=datetime.datetime(1899,12,30)+datetime.timedelta(days=int(cells['A']));first=first or {'period':date.strftime('%Y-%m'),'value':float(cells['T'])}
  if date.year==2024:
   o=next(o for o in norm if o['id']=='FHFA_'+date.strftime('%Y-%m'));verify(o,float(cells['T']),'sheet1!T'+row.get('r')+' / A Excel date','index_1991Jan_100_NSA','USA','MONTHLY_PRICE_INDEX');fh.append(checks[-1])
assert first=={'period':'1991-01','value':100.0} and len(fh)==12
assert len(checks)==70
summary=[]
for stage in ['applied','approved','disbursed']:
 rows=[o for o in norm if o['id'].startswith('MY_'+stage+'_')];rows.sort(key=lambda o:o['observation_period']);jan,dec=rows[0]['value'],rows[-1]['value'];summary.append({'metric':stage,'JanuaryMYR':jan,'DecemberMYR':dec,'JanToDecPct':(dec/jan-1)*100,'notYearOnYear':True,'annualSumMYR':sum(o['value'] for o in rows),'interpretation':'Unadjusted monetary activity in downloaded vintage; monthly seasonality/mix/timing not controlled'})
(d/'MY-SOURCE-REPRODUCTION.json').write_text(json.dumps({'status':'VERIFIED_50_MY_VALUES_WITH_METADATA_LIMITS','myCCRIS':my,'embeddedJSONMatchesRawHTML':True,'sourceUnitLabel':pg['_nextI18Next']['initialI18nStore']['en-GB']['dashboard-household-debt']['keys']['rm'],'sourceAgency':pg['meta']['agency'],'geography':'Malaysia dashboard aggregate; exact institution/refinancing coverage unresolved','lastRevisedSnapshot':pg['last_updated'],'nextScheduledUpdate':pg['next_update'],'noDuplicates':True,'CPI':[x for x in checks if x['id'].startswith('MY_CPI')],'householdIncome':[x for x in checks if x['id'].startswith('MY_MEDIAN')],'activitySummary':summary,'approvalProbability':{'value':None,'status':'NOT_MEASURABLE_FROM_AVAILABLE_DATA','missing':'Comparable application record/cohort counts and approved outcomes for the same objects, product, coverage and period'},'BNM_XLS_assertion':'Old Python403 evidence is MHS/document page, not exact XLS request. XLS bytes unavailable; exact XLS HTTP status UNVERIFIED. Do not relabel dashboard as restored XLS.'},indent=2),encoding='utf8')
(d/'US-HMDA-METHOD-REPRODUCTION.json').write_text(json.dumps({'status':'VERIFIED_BOUNDED_RECORD_SHARES_NOT_APPLICANT_PROBABILITY','years':hmda,'definitionsURL':'https://ffiec.cfpb.gov/documentation/publications/loan-level-datasets/lar-data-fields','apiDocumentationURL':'https://ffiec.cfpb.gov/documentation/api/data-browser/','freshDefinitionRead':'2026-10-20','scopeLimit':'Multiple applications by same person allowed; no income/reporter-type mix adjustment. Reported calendar-year actions, not a tracked original-application cohort.'},indent=2),encoding='utf8')
(d/'NUMERIC-REPRODUCTION-ALL.json').write_text(json.dumps({'status':'VERIFIED_70_NON_NULL_VALUES_PLUS_ONE_EXPLICIT_UNKNOWN','checks':checks,'missingObservation':next(o for o in norm if o['value'] is None),'fhfaBase':first,'absoluteYearSeparation':True},indent=2),encoding='utf8')
print('70 values independently reproduced;36CCRIS/12CPI/2income/2SLOOS/6HMDA/12FHFA')
print('MYactivity',json.dumps(summary));print('HMDAshares',[(x['year'],x['denial_share_in_defined_hmda_scope']) for x in hmda])
