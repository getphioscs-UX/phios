import json,datetime,zipfile,xml.etree.ElementTree as E
from pathlib import Path
b=Path('tools/review/world-r3/gate2c');r=b/'WORLD-R3-GMCH-PILOT-SNAPSHOTS';obs=json.loads((r/'NORMALIZED-OBSERVATIONS.json').read_text());attempts=json.loads((b/'CLOSURE-READ-ATTEMPTS.json').read_text());a={x['id']:x for x in attempts}
obs=[o for o in obs if o.get('source_id') not in {'my-debt-dashboard','hmda-aggregate-2025','fhfa-hpi-history'}]
def mk(id,metric,period,value,unit,source,loc,**extra):return dict(id=id,metric_id=metric,country='MYS' if source=='my-debt-dashboard' else 'USA',observation_period=period,value=value,unit=unit,source_id=source,locator=loc,publication_date=None,fetched_at=a[source]['fetched_at'],source_hash=a[source]['sha256'],kind='observed_fact',**extra)
x=json.loads((r/'MY-DEBT-PAGE-DATA.json').read_text())['props']['pageProps']
for stage,metric in [('applied','application_amount'),('approved','approval_amount'),('disbursed','disbursement_amount')]:
 z=x['timeseries']['data'][stage]['rm'];assert len(z['x'])==len(z['property_residental'])
 for i,(stamp,value) in enumerate(zip(z['x'],z['property_residental'])):
  date=datetime.datetime.fromtimestamp(stamp/1000,datetime.timezone.utc).strftime('%Y-%m')
  if date.startswith('2024'):
   assert isinstance(value,(int,float)) and value>=0
   obs.append(mk('MY_'+stage+'_'+date,metric,date,value,'MYR', 'my-debt-dashboard',f'props.pageProps.timeseries.data.{stage}.rm.property_residental[{i}]',population='Official CCRIS aggregate residential-purpose loans; reporting exactrefinancing and institution scope not verified',revision_date=x['last_updated'],quality='OFFICIAL_MONETARY_FLOW_NOT_COHORT; first release date missing'))
h=json.loads((r/'hmda-aggregate-2025.json').read_text())
for item in h['aggregations']:obs.append(mk('HMDA_2025_ACTION_'+item['actions_taken'],'application_action_count','2025',item['count'],'records','hmda-aggregate-2025','actions_taken='+item['actions_taken']+';loan_purposes=1',action_taken=item['actions_taken'],population='HMDAreportable homepurchase; actions1/2/3; allproduct/dwelling/occupancy; dynamiccachedresponse',first_annual_release_date='2026-06-23',quality='DYNAMIC_CACHE_NOT_FROZEN2025_SNAPSHOT'))
with zipfile.ZipFile(r/'fhfa-hpi-history.xlsx') as z:
 ns={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'};ss=[''.join(x.itertext()) for x in E.fromstring(z.read('xl/sharedStrings.xml'))];root=E.fromstring(z.read('xl/worksheets/sheet1.xml'));found=[]
 for row in root.findall('.//s:row',ns):
  vals={}
  for c in row.findall('s:c',ns):
   v=c.find('s:v',ns)
   if v is not None:vals[''.join(c.get('r').rstrip('0123456789'))]=ss[int(v.text)] if c.get('t')=='s' else v.text
  if vals.get('A','').isdigit():
   period=(datetime.datetime(1899,12,30)+datetime.timedelta(days=int(vals['A']))).strftime('%Y-%m')
   if period.startswith('2024'):
    index=float(vals['T']);found.append((period,index));obs.append(mk('FHFA_'+period,'housing_price_index',period,index,'index_1991Jan_100_NSA','fhfa-hpi-history',f'sheet1!T{row.get("r")};A=date serial;U=SA not used',quality='HISTORICAL_REVISED_INDEX_INITIAL_PUBLICATION_NOT_RETAINED',population='Purchase-only conventional conforming mortgage transactions used in FHFAmonthly index; not all cash/propertytypes'))
 assert len(found)==12
(r/'NORMALIZED-OBSERVATIONS.json').write_text(json.dumps(obs,indent=2),encoding='utf8');p=json.loads((b/'WORLD-R3-GMCH-PILOT-PROVENANCE.json').read_text());p['readAttempts']+=attempts;p['normalized']['records']=len(obs);import hashlib;p['normalized']['sha256']=hashlib.sha256((r/'NORMALIZED-OBSERVATIONS.json').read_bytes()).hexdigest();p['closure']='Official dashboard embeddedCCRIs data supplied MY36monetaryobservations; HMDA2025threeaggregates; FHFA2024twelveNSAindices. Original BNM403 and wrongcurrentFHFAfile retained as diagnostics.';(b/'WORLD-R3-GMCH-PILOT-PROVENANCE.json').write_text(json.dumps(p,indent=2),encoding='utf8');print('Total actual/unknown observations',len(obs),'MYamounts',len([o for o in obs if o['source_id']=='my-debt-dashboard']),'FHFA2024',found[:2])
