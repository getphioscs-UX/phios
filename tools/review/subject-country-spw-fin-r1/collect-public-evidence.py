from pathlib import Path
import urllib.request,json,hashlib,datetime,concurrent.futures,time
q=Path('C:/phios/tools/review/subject-country-spw-fin-r1');q.mkdir(parents=True,exist_ok=True);out=q/'world-country-public-evidence-r1.json';ids=['SP.POP.TOTL','NY.GDP.MKTP.CD','NY.GDP.MKTP.KD.ZG','FP.CPI.TOTL.ZG','SL.EMP.TOTL.SP.ZS','NE.TRD.GNFS.ZS','SP.URB.TOTL.IN.ZS','EG.ELC.ACCS.ZS','EG.FEC.RNEW.ZS','IT.NET.USER.ZS','GC.REV.XGRT.GD.ZS','GC.XPN.TOTL.GD.ZS','GC.DOD.TOTL.GD.ZS','GC.BAL.CASH.GD.ZS'];now=datetime.datetime.now(datetime.timezone.utc).isoformat()
def get(u):
 for attempt in range(2):
  try:
   with urllib.request.urlopen(urllib.request.Request(u,headers={'Accept':'application/json','User-Agent':'PHIOS-Manual-Public-Evidence-Review/1'}),timeout=35)as r:raw=r.read();return json.loads(raw),hashlib.sha256(raw).hexdigest()
  except Exception:
   if attempt:raise
   time.sleep(1)
def collect(indicator):
 mu=f'https://api.worldbank.org/v2/sources/2/series/{indicator}/metadata?format=json';du=f'https://api.worldbank.org/v2/country/MY;SG;ID/indicator/{indicator}?format=json&date=2019:2024&per_page=100';meta,mh=get(mu);data,dh=get(du);items=meta.get('source',[{}])[0].get('concept',[{}])[0].get('variable',[{}])[0].get('metatype',[]);m={x['id']:x['value']for x in items};rows=data[1]if isinstance(data,list)and len(data)>1 and isinstance(data[1],list)else[];assert all(x['indicator']['id']==indicator and x['countryiso3code']in['MYS','SGP','IDN']and 2019<=int(x['date'])<=2024 for x in rows);allowed=m.get('License_Type')=='CC BY-4.0';return {'indicatorId':indicator,'metadataUrl':mu,'metadataSha256':mh,'dataUrl':du,'dataSha256':dh,'retrievedAt':now,'sourceUpdatedAt':data[0].get('lastupdated')if isinstance(data,list)else None,'metadata':{k:m.get(k)for k in ['IndicatorName','Longdefinition','Shortdefinition','Source','Periodicity','Unitofmeasure','Limitationsandexceptions','Statisticalconceptandmethodology','License_Type','License_URL','Referenceperiod']},'licenseStatus':'INDICATOR_CC_BY_4_0_VERIFIED'if allowed else'RIGHTS_PENDING','observations':[{'countryCode':x['countryiso3code'],'countryCodeAlpha2':x['country']['id'],'period':int(x['date']),'value':x['value']if allowed else None,'qualityState':'OBSERVED'if allowed and isinstance(x['value'],(int,float))else'MISSING'if allowed else'RIGHTS_PENDING','sourceUnit':x.get('unit')or None,'decimal':x.get('decimal')}for x in rows]}
series=[];errors=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=3)as pool:
 tasks={pool.submit(collect,i):i for i in ids}
 for f in concurrent.futures.as_completed(tasks):
  try:x=f.result();series.append(x);print(x['indicatorId'],x['licenseStatus'],sum(v['qualityState']=='OBSERVED'for v in x['observations']),flush=True)
  except Exception as e:errors.append({'indicatorId':tasks[f],'error':str(e)});print('UNAVAILABLE',tasks[f],type(e).__name__,flush=True)
# Country identity metadata is a reference to the existing World code, not a new Subject Registry.
u='https://api.worldbank.org/v2/country/MY;SG;ID?format=json&per_page=10';countries,ch=get(u);countries=[{k:x.get(k)for k in ['id','iso2Code','name','region','capitalCity','longitude','latitude']}for x in countries[1]];d={'schemaVersion':'WORLD_PUBLIC_COUNTRY_EVIDENCE_R1','owner':'WORLD_EVIDENCE','collectionMode':'EXPLICIT_MANUAL_READ_ONLY','retrievedAt':now,'periodRequest':{'start':2019,'end':2024},'identitySource':{'url':u,'sha256':ch,'countries':countries},'series':sorted(series,key=lambda x:ids.index(x['indicatorId'])),'sourceFailures':errors,'paidProviderCalls':0,'productionWrites':0,'automaticRefreshEnabled':False};d['projectionDigest']=hashlib.sha256(json.dumps(d,sort_keys=True,separators=(',',':')).encode()).hexdigest();out.write_bytes((json.dumps(d,ensure_ascii=False,indent=2)+'\n').encode());print('SAVED',len(series),'series;',len(errors),'failures;',out.stat().st_size,'bytes')
