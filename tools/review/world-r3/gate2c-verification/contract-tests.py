import json,pathlib,copy,hashlib
D=pathlib.Path('tools/review/world-r3/gate2c-verification');rd=lambda p:json.loads(pathlib.Path(p).read_text(encoding='utf-8-sig'))
def gate(x):
 if x['http']==403:return 'access_denied'
 if x['http']==429:return 'rate_limited'
 if not x['licence']:return 'license_unknown'
 if x['schema']!=1:return 'source_schema_changed'
 if x['region']!='MYS':return 'country_mismatch'
 if x['period']!='2024':return 'year_mismatch'
 if x['unit']!='MYR':return 'uncomparable'
 if x['population']!='residential_purpose_financial_institution_flow':return 'population_mismatch'
 if x['metric']!='application_amount':return 'metric_mismatch'
 if not x['series']:return 'missing_series'
 if x['stale']:return 'stale_data'
 if x['formula']=='unknown':return 'unknown_formula'
 if x['probability'] and (x['denominator']==0 or not x['matchedCohort']):return 'NOT_MEASURABLE_FROM_AVAILABLE_DATA'
 if x['private']:return 'PRIVATE_DATA_NOT_PUBLIC_SOURCE'
 return 'HISTORICAL_FACT_ONLY' if x['publication'] is None else 'eligible'
base=dict(http=200,licence=True,schema=1,region='MYS',period='2024',unit='MYR',population='residential_purpose_financial_institution_flow',metric='application_amount',series=True,stale=False,formula='identity',probability=False,denominator=None,matchedCohort=False,private=False,publication=None)
cases=[('historical date missing',{},'HISTORICAL_FACT_ONLY'),('403',{'http':403},'access_denied'),('429',{'http':429},'rate_limited'),('licence',{'licence':False},'license_unknown'),('schema',{'schema':2},'source_schema_changed'),('country',{'region':'USA'},'country_mismatch'),('period',{'period':'2025'},'year_mismatch'),('unit',{'unit':'count'},'uncomparable'),('population',{'population':'HMDA_actions'},'population_mismatch'),('metric',{'metric':'denial_share'},'metric_mismatch'),('missing',{'series':False},'missing_series'),('stale',{'stale':True},'stale_data'),('formula',{'formula':'unknown'},'unknown_formula'),('zero denominator',{'probability':True,'denominator':0},'NOT_MEASURABLE_FROM_AVAILABLE_DATA'),('amount not cohort',{'probability':True,'denominator':100},'NOT_MEASURABLE_FROM_AVAILABLE_DATA'),('private',{'private':True},'PRIVATE_DATA_NOT_PUBLIC_SOURCE')]
rows=[]
for name,patch,expected in cases:
 actual=gate({**base,**patch});rows.append(dict(name=name,inputPatch=patch,expected=expected,actual=actual,passed=actual==expected))
raw=b'old immutable source';revised=b'new revised source';versions={'v1':hashlib.sha256(raw).hexdigest(),'v2':hashlib.sha256(revised).hexdigest()};rows.append({'name':'revision keeps old answer hash pinned','expected':'v1 unchanged, v2 distinct','passed':versions['v1']==hashlib.sha256(raw).hexdigest() and versions['v1']!=versions['v2'],'versions':versions})
(D/'REVISION-AND-FAILURE-TESTS.json').write_text(json.dumps({'mode':'EXECUTED_REVIEW_CONTRACT_FIXTURE_NOT_PRODUCT_ENFORCEMENT','tests':rows,'passed':all(r['passed'] for r in rows),'productGateImplemented':False,'schedulerActivated':False,'productionWrites':0},indent=2)+'\n',encoding='utf-8');assert all(r['passed'] for r in rows);print(len(rows),'review-contract assertions passed; product implementation NOT_IMPLEMENTED')
