import json,csv,hashlib,re,html,zipfile,xml.etree.ElementTree as E,datetime
from pathlib import Path
b=Path('tools/review/world-r3/gate2c');raw=b/'WORLD-R3-GMCH-PILOT-SNAPSHOTS';attempts=json.loads((b/'READ-ATTEMPTS.json').read_text())+json.loads((b/'PILOT-READ-ATTEMPTS.json').read_text());lookup={x['id']:x for x in attempts}
def row(id,metric,country,period,value,unit,source,locator,publication=None,kind='observed_fact',**extra):return dict(id=id,metric_id=metric,country=country,observation_period=period,value=value,unit=unit,source_id=source,locator=locator,publication_date=publication,fetched_at=lookup.get(source,{}).get('fetched_at'),source_hash=lookup.get(source,{}).get('sha256'),kind=kind,**extra)
rows=[]
for x in csv.DictReader((raw/'my-cpi-full.csv').open()):
 if x['division']=='overall' and x['date'].startswith('2024'):
  rows.append(row('MY_CPI_'+x['date'],'cpi','MYS',x['date'][:7],float(x['index']),'index_2010_100','my-cpi-full','date='+x['date']+';division=overall',None,publication_status='NOT_RETAINED_PER_OBSERVATION; dataset updated 2026-10-19 per official catalogue',quality='VALIDATED_VALUE_PUBLICATION_DATE_PARTIAL'))
for x in json.loads((raw/'my-income.json').read_text()):
 if x['date'].startswith(('2022','2024')):rows.append(row('MY_MEDIAN_'+x['date'],'median_household_income','MYS',x['date'][:4],x['income_median'],'MYR_per_month','my-income','date='+x['date']+';income_median',None,quality='VALUE_FETCHED_METADATA_REVIEW_REQUIRED'))
text=re.sub(r'\s+',' ',html.unescape(re.sub('<[^>]+>',' ',(raw/'fed-table-corrected.html').read_text(errors='replace'))))
def category(section,start,end,labels):
 s=text[text.index(section):];s=s[s.index(start):s.index(end)];out={}
 for label in labels:
  m=re.search(re.escape(label)+r'\s+(\d+)\s+([\d.]+)',s)
  if not m:raise ValueError(label)
  out[label]={'banks':int(m.group(1)),'percent':float(m.group(2))}
 return out
std=category('13. Over','B. Credit standards','C. Credit standards',['Tightened considerably','Tightened somewhat','Remained basically unchanged','Eased somewhat','Eased considerably','Total'])
dem=category('14. Apart','B. Demand','C. Demand',['Substantially stronger','Moderately stronger','About the same','Moderately weaker','Substantially weaker','Total'])
assert std['Total']['banks']==49 and dem['Total']['banks']==49
stand=(std['Tightened considerably']['banks']+std['Tightened somewhat']['banks']-std['Eased somewhat']['banks']-std['Eased considerably']['banks'])/49*100
demand=(dem['Substantially stronger']['banks']+dem['Moderately stronger']['banks']-dem['Moderately weaker']['banks']-dem['Substantially weaker']['banks'])/49*100
rows += [row('US_STD_GOV_2024Q3','survey_standards','USA','2024-Q3',round(stand,4),'net_percent_banks_tightening','fed-table-corrected','Table1 Q13B all respondents','2024-11-12',kind='derived_from_reported_counts',population='49 domestic responding banks originating government home-purchase mortgages; new originations excluding refinancing',input_counts=std),row('US_DEMAND_GOV_2024Q3','survey_demand','USA','2024-Q3',round(demand,4),'net_percent_banks_stronger_demand','fed-table-corrected','Table1 Q14B all respondents','2024-11-12',kind='derived_from_reported_counts',population='49 responding domestic banks; government home-purchase mortgages; not national application totals',input_counts=dem)]
hmda=json.loads((raw/'hmda-aggregate-2024.json').read_text());counts={r['actions_taken']:r['count'] for r in hmda['aggregations']};assert set(counts)=={'1','2','3'}
for code,n in counts.items():rows.append(row('HMDA_2024_ACTION_'+code,'application_action_count','USA','2024',n,'records','hmda-aggregate-2024','actions_taken='+code+';loan_purposes=1',None,quality='AGGREGATE_READ_NOT_FROZEN_ANNUAL_SNAPSHOT',population='Reporting institutions; home purchase; all product/dwelling/occupancy types; dynamic API cache; excludes actions 4–8 by query',action_taken=code))
# NO rejection rate is calculated: filtered annual actions are not a tracked application-origin cohort, and metadata/vintage and product alignment remain incomplete.
rows.append(row('MY_APPROVAL_PROBABILITY','application_approval_probability','MYS','2024',None,'proportion','bnm-mhs','same-application cohort numerator and denominator unavailable',None,quality='NOT_MEASURABLE'))
# FHFA downloaded file is a recent change-estimate workbook, not the requested 2024 index series: retain as a format/semantic test, do not relabel it.
with zipfile.ZipFile(raw/'fhfa-hpi.xlsx') as z:
 ns={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'};strings=[''.join(x.itertext()) for x in E.fromstring(z.read('xl/sharedStrings.xml'))];root=E.fromstring(z.read('xl/worksheets/sheet1.xml'));cells={}
 for c in root.findall('.//s:c',ns):
  v=c.find('s:v',ns)
  if v is not None:cells[c.get('r')]=strings[int(v.text)] if c.get('t')=='s' else v.text
 assert 'Jun 26 - Jul 26' in cells['A5']
 fhfa={'source_id':'fhfa-hpi','source_hash':lookup['fhfa-hpi']['sha256'],'semanticCheck':'PASS_NOT_RELABELLED_AS_2024_INDEX','title':cells['A2'],'cell_A5':cells['A5'],'cell_B5':float(cells['B5']),'interpretedPercent':float(cells['B5'])*100,'observation_period':'2026-07','unit':'monthly_percent_change_NSA_nominal','sameYearWith2024Pilot':False,'renderNumeric':False,'reason':'2024 cohort and publication-date alignment absent; no numeric panel in 2024 pilot'}
(raw/'NORMALIZED-OBSERVATIONS.json').write_text(json.dumps(rows,indent=2),encoding='utf8');(raw/'FHFA-FORMAT-CHECK.json').write_text(json.dumps(fhfa,indent=2),encoding='utf8')
(b/'WORLD-R3-GMCH-PILOT-PROVENANCE.json').write_text(json.dumps({'status':'PARTIAL_REAL_OFFICIAL_SNAPSHOTS','readAttempts':attempts,'normalized':{'path':(raw/'NORMALIZED-OBSERVATIONS.json').as_posix(),'sha256':hashlib.sha256((raw/'NORMALIZED-OBSERVATIONS.json').read_bytes()).hexdigest(),'records':len(rows)},'manualWebEvidence':'WEB-SOURCE-READS.json','rawFileHashesAreOriginalBytes':True,'webDerivedHashesAreOnlyEvidenceRecordHashes':True,'noSyntheticValuesAsActuals':True},indent=2),encoding='utf8')
print('normalized',len(rows),'standards',stand,'demand',demand,'HMDA actions',counts)
