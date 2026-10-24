"""Lossless row selection from pinned official CSV bytes; no network or admission writes."""
import csv,json,hashlib,math,os
base='tools/review/world-ux-r1/world-r4'
fetch=json.load(open(base+'/RAW-FETCH.json',encoding='utf-8'))
meta=json.load(open(base+'/METADATA-READS.json',encoding='utf-8'))
ids={'cpi_2d_state_inflation':'cpi_state_inflation','cpi_2d_state':'cpi_state','cpi_2d':'cpi_headline','cpi_2d_inflation':'cpi_headline_inflation'}
datasets=[];records=[];audit=[]
for f in fetch:
 ident=f['id'];p='.tmp/world-r4/raw/'+ident+'.csv';raw=open(p,'rb').read();digest=hashlib.sha256(raw).hexdigest()
 assert f.get('status')==200 and digest==f['sha256']
 metadata=next(m for m in meta if m['id']==ids[ident]);assert metadata['status']==200 and metadata['licenseCCBY']
 state='state' in ident
 with open(p,encoding='utf-8-sig',newline='') as h:
  reader=csv.DictReader(h);columns=reader.fieldnames;rows=list(reader)
 expected=['state','date','division'] if state else ['date','division']
 expected+=['inflation_yoy','inflation_mom'] if ident.endswith('inflation') else ['index']
 assert columns==expected
 dataset={'datasetId':ident,'metadataUrl':metadata['url'],'sourceUrl':f['url'],'sourceVersion':digest,'retrievedAt':f['at'],'publishedAt':None,'datasetUpdatedAt':'2026-10-19T13:12:00+08:00','nextScheduledUpdate':'2026-11-19T12:30:00+08:00','publisher':'Department of Statistics Malaysia','license':'CC_BY_4_0','geographicLevel':'STATE' if state else 'COUNTRY','baseYear':2010,'frequency':'MONTHLY','statisticalMethod':'DOSM_FIXED_BASKET_CPI_MCOICOP','population':'Represented consumer basket; not a household-specific budget','columns':columns,'rawRowCount':len(rows),'metadataSha256':hashlib.sha256(open('.tmp/world-r4/raw/'+ids[ident]+'-metadata.html','rb').read()).hexdigest(),'verification':{'rawBytes':True,'columns':True,'officialMetadataRead':True,'licenseRead':True,'rowIdentityChecked':True},'admissionScope':'LOCAL_VALIDATION_ONLY','productionEligible':False}
 datasets.append(dataset);n=0;seen=set()
 for i,r in enumerate(rows,2):
  geo=r.get('state','Malaysia')
  if geo not in ['Malaysia','Johor','Selangor'] or r['date']<'2024-01-01':continue
  assert r['date'][8:]=='01' and r['division'] in ['overall']+['%02d'%n for n in range(1,14)]
  key=(geo,r['date'],r['division']);assert key not in seen;seen.add(key)
  fields=['inflation_yoy','inflation_mom'] if 'inflation' in ident else ['index']
  for field in fields:
   value=None if r[field]=='' else float(r[field]);assert value is None or math.isfinite(value)
   records.append({'datasetId':ident,'rowNumber':i,'geo':geo,'period':r['date'][:7],'division':r['division'],'field':field,'value':value,'sourceRow':r})
   n+=1
 audit.append({'datasetId':ident,'rawSha256':digest,'selectedMeasurements':n,'selection':'2024-01 onward; Malaysia/Johor/Selangor; all divisions; preserve source rows and line positions'})
output={'schemaVersion':'WORLD-R4-LOCAL-DATASET-v1','successorOf':'content/world/world-evidence-series-v1.json','datasets':datasets,'records':records,'productionEligible':False,'notWholeWorldState':True}
os.makedirs('.tmp/world-r4',exist_ok=True)
json.dump(output,open('.tmp/world-r4/datasets.json','w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
json.dump(audit,open(base+'/EXTRACTION-ROW-AUDIT.json','w',encoding='utf-8'),ensure_ascii=False,indent=2)
os.makedirs('content/world/successors/world-r4-local-validation',exist_ok=True)
json.dump({'schemaVersion':'WORLD-EVIDENCE-R4-LOCAL-REGISTRY-CANDIDATE','successorOf':'content/world/world-evidence-series-v1.json','scope':'LOCAL_VALIDATION_ONLY','productionEligible':False,'datasets':datasets,'coverageRef':'content/world/successors/world-r4-local-validation/coverage.json'},open('content/world/successors/world-r4-local-validation/registry.json','w',encoding='utf-8'),ensure_ascii=False,indent=2)
print(json.dumps({'datasets':len(datasets),'selectedMeasurements':len(records),'audit':audit}))
