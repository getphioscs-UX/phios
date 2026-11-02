"""Manual World Bank refresh. Local candidate files only; never schedules or publishes."""
from pathlib import Path
import argparse,concurrent.futures,datetime,hashlib,json,math,os,re,subprocess,sys,urllib.request
ROOT=Path(__file__).resolve().parents[1]
POINTER='content/world/world-country-public-evidence-current.json'
BASELINE='content/world/world-country-public-evidence-r1.json'
STATUS='content/world/world-country-refresh-status.json'
def digest(raw):return hashlib.sha256(raw).hexdigest()
def canonical(value):return json.dumps(value,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()
def checked_path(root,relative):
 p=(root/relative).resolve()
 if not p.is_relative_to(root.resolve()):raise ValueError('REFRESH_PATH_OUTSIDE_WORKSPACE')
 return p
def load_active(root):
 pointer=checked_path(root,POINTER)
 ref=json.loads(pointer.read_text(encoding='utf-8'))if pointer.exists()else {'snapshotPath':BASELINE}
 raw=checked_path(root,ref['snapshotPath']).read_bytes()
 if ref.get('sha256')and ref['sha256']!=digest(raw):raise ValueError('CURRENT_SNAPSHOT_DIGEST_MISMATCH')
 return ref,json.loads(raw),raw
def get(url):
 with urllib.request.urlopen(urllib.request.Request(url,headers={'Accept':'application/json','User-Agent':'PHIOS-Manual-World-Evidence-Refresh/1'}),timeout=35)as response:
  raw=response.read();return json.loads(raw),digest(raw)
def signature(snapshot):
 return digest(canonical({'identity':snapshot['identitySource']['countries'],'series':[{'id':s['indicatorId'],'metadata':s['metadataSha256'],'revision':s.get('sourceUpdatedAt'),'rows':sorted(s['observations'],key=lambda r:(r['countryCode'],r['period']))}for s in sorted(snapshot['series'],key=lambda s:s['indicatorId'])]}))
def changes(old,new):
 def rows(d):return {(s['indicatorId'],r['countryCode'],r['period']):r.get('value')for s in d['series']for r in s['observations']}
 a,b=rows(old),rows(new);return {'added':[{'key':list(k),'value':b[k]}for k in b.keys()-a.keys()],'revised':[{'key':list(k),'old':a[k],'new':b[k]}for k in a.keys()&b.keys()if a[k]!=b[k]],'noLongerReturned':[{'key':list(k),'old':a[k]}for k in a.keys()-b.keys()]}
def validate(candidate,registered):
 if candidate.get('sourceFailures')or candidate.get('owner')!='WORLD_EVIDENCE':raise ValueError('SOURCE_FAILURE_NO_ACTIVE_VERSION_CHANGE')
 if set(s['indicatorId']for s in candidate['series'])!=set(registered):raise ValueError('REGISTERED_INDICATOR_COVERAGE_REQUIRED')
 for s in candidate['series']:
  if s['licenseStatus']!='INDICATOR_CC_BY_4_0_VERIFIED'or s['metadata'].get('License_Type')!='CC BY-4.0':raise ValueError('LICENSE_NOT_VERIFIED')
  for row in s['observations']:
   if row['countryCode']not in ['MYS','SGP','IDN']or not isinstance(row['period'],int):raise ValueError('COUNTRY_PERIOD_INVALID')
   if row.get('value')is not None and row['period']>datetime.datetime.now(datetime.timezone.utc).year:raise ValueError('FUTURE_OBSERVATION_REJECTED')
   if row.get('value')is not None and(not isinstance(row['value'],(int,float))or not math.isfinite(row['value'])):raise ValueError('NONFINITE_SOURCE_VALUE')
 return True
def collect(current,fetcher=get,now=None):
 now=now or datetime.datetime.now(datetime.timezone.utc).isoformat();end=datetime.datetime.fromisoformat(now).year;start=current['periodRequest']['start'];ids=[s['indicatorId']for s in current['series']]
 def one(id):
  mu=f'https://api.worldbank.org/v2/sources/2/series/{id}/metadata?format=json';du=f'https://api.worldbank.org/v2/country/MY;SG;ID/indicator/{id}?format=json&date={start}:{end}&per_page=100';m,mh=fetcher(mu);d,dh=fetcher(du);
  if not isinstance(d,list)or len(d)<2 or(d[1]is not None and not isinstance(d[1],list)):raise ValueError('SOURCE_RESPONSE_SHAPE_INVALID')
  m={x['id']:x['value']for x in m.get('source',[{}])[0].get('concept',[{}])[0].get('variable',[{}])[0].get('metatype',[])};rows=d[1]if isinstance(d,list)and len(d)>1 and isinstance(d[1],list)else[]
  if not all(r['indicator']['id']==id and r['countryiso3code']in ['MYS','SGP','IDN']and start<=int(r['date'])<=end for r in rows):raise ValueError('SOURCE_IDENTITY_MISMATCH')
  licensed=m.get('License_Type')=='CC BY-4.0';return {'indicatorId':id,'metadataUrl':mu,'metadataSha256':mh,'dataUrl':du,'dataSha256':dh,'retrievedAt':now,'sourceUpdatedAt':d[0].get('lastupdated')if isinstance(d,list)else None,'metadata':{k:m.get(k)for k in ['IndicatorName','Longdefinition','Shortdefinition','Source','Periodicity','Unitofmeasure','Limitationsandexceptions','Statisticalconceptandmethodology','License_Type','License_URL','Referenceperiod']},'licenseStatus':'INDICATOR_CC_BY_4_0_VERIFIED'if licensed else'RIGHTS_PENDING','observations':[{'countryCode':r['countryiso3code'],'countryCodeAlpha2':r['country']['id'],'period':int(r['date']),'value':r['value']if licensed else None,'qualityState':'OBSERVED'if licensed and isinstance(r['value'],(int,float))else'MISSING'if licensed else'RIGHTS_PENDING','sourceUnit':r.get('unit')or None,'decimal':r.get('decimal')}for r in rows]}
 series=[];failures=[]
 with concurrent.futures.ThreadPoolExecutor(max_workers=3)as pool:
  for id,result in zip(ids,pool.map(one,ids)):series.append(result)
 iu='https://api.worldbank.org/v2/country/MY;SG;ID?format=json&per_page=10';identity,ih=fetcher(iu);countries=[{k:r.get(k)for k in ['id','iso2Code','name','region','capitalCity','longitude','latitude']}for r in identity[1]]
 out={'schemaVersion':'WORLD_PUBLIC_COUNTRY_EVIDENCE_R1','owner':'WORLD_EVIDENCE','collectionMode':'EXPLICIT_MANUAL_REFRESH_CANDIDATE','retrievedAt':now,'periodRequest':{'start':start,'end':end},'identitySource':{'url':iu,'sha256':ih,'countries':countries},'series':series,'sourceFailures':failures,'paidProviderCalls':0,'productionWrites':0,'automaticRefreshEnabled':False};out['projectionDigest']=digest(canonical(out));return out
def write_atomic(path,value):
 path.parent.mkdir(parents=True,exist_ok=True);tmp=path.with_suffix(path.suffix+'.pending');tmp.write_bytes((json.dumps(value,ensure_ascii=False,indent=2)+'\n').encode());os.replace(tmp,path)
def apply_candidate(root,candidate,apply=False,admitter=None):
 ref,current,raw=load_active(root);validate(candidate,[s['indicatorId']for s in current['series']]);sig=signature(candidate);old_sig=ref.get('contentSignature')or signature(current);delta=changes(current,candidate);result={'mode':'LOCAL_MANUAL_ONLY','status':'UNCHANGED'if sig==old_sig else'CHANGED_CANDIDATE','contentSignature':sig,'previousSnapshotPath':ref['snapshotPath'],'previousSha256':digest(raw),'changes':delta,'automaticRefreshEnabled':False,'productionAutomaticRefreshEnabled':False,'productionWrites':0,'providerCalls':0}
 if sig==old_sig:
  if apply:
   if admitter:admitter(candidate)
   write_atomic(checked_path(root,STATUS),{'schemaVersion':'WORLD_COUNTRY_REFRESH_STATUS_V1','status':'SUCCESS','checkedAt':candidate['retrievedAt'],'activeSourceVersion':current['projectionDigest'],'automaticRefreshEnabled':False,'productionAutomaticRefreshEnabled':False})
  return result
 candidate={**candidate,'predecessorSnapshot':{'path':ref['snapshotPath'],'sha256':digest(raw),'projectionDigest':current['projectionDigest']},'contentSignature':sig};candidate['projectionDigest']=digest(canonical({k:v for k,v in candidate.items()if k!='projectionDigest'}))
 if not apply:return result
 if admitter:admitter(candidate)
 target='content/world/world-country-public-evidence-r2-'+sig[:16]+'.json';path=checked_path(root,target);body=(json.dumps(candidate,ensure_ascii=False,indent=2)+'\n').encode()
 if path.exists()and path.read_bytes()!=body:raise ValueError('IMMUTABLE_SNAPSHOT_COLLISION')
 if not path.exists():path.write_bytes(body)
 pointer={'schemaVersion':'WORLD_COUNTRY_EVIDENCE_POINTER_V1','owner':'WORLD_EVIDENCE','snapshotPath':target,'sha256':digest(body),'contentSignature':sig,'sourceVersion':candidate['projectionDigest'],'lastSuccessfulSourceCheckAt':candidate['retrievedAt'],'publicationStatus':'LOCAL_CANDIDATE_HUMAN_PENDING','automaticRefreshEnabled':False,'productionAutomaticRefreshEnabled':False,'previousSnapshot':{'path':ref['snapshotPath'],'sha256':digest(raw)}};write_atomic(checked_path(root,STATUS),{'schemaVersion':'WORLD_COUNTRY_REFRESH_STATUS_V1','status':'UPDATING','automaticRefreshEnabled':False,'productionAutomaticRefreshEnabled':False});write_atomic(checked_path(root,POINTER),pointer);write_atomic(checked_path(root,STATUS),{'schemaVersion':'WORLD_COUNTRY_REFRESH_STATUS_V1','status':'SUCCESS','checkedAt':candidate['retrievedAt'],'activeSourceVersion':candidate['projectionDigest'],'automaticRefreshEnabled':False,'productionAutomaticRefreshEnabled':False});result.update({'status':'LOCAL_SUCCESSOR_APPLIED','snapshotPath':target,'sha256':digest(body)});return result
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--candidate',type=Path);parser.add_argument('--apply-local',action='store_true');parser.add_argument('--node',default='node');args=parser.parse_args();lock=ROOT/'.tmp/world-country-refresh.lock';lock.parent.mkdir(parents=True,exist_ok=True);fd=None
 saved={}
 try:
  fd=os.open(lock,os.O_CREAT|os.O_EXCL|os.O_WRONLY);os.write(fd,str(os.getpid()).encode());saved={rel:(checked_path(ROOT,rel).read_bytes()if checked_path(ROOT,rel).exists()else None)for rel in [POINTER,STATUS,'content/civilization-atlas/reconfiguration/world-observation-projection-v1.json']};ref,current,raw=load_active(ROOT);candidate=json.loads(args.candidate.read_text(encoding='utf-8'))if args.candidate else collect(current)
  def admit(value):
   path=ROOT/'.tmp/world-country-refresh-candidate.json';path.write_bytes((json.dumps(value,ensure_ascii=False)+'\n').encode());subprocess.run([args.node,'--import','./scripts/lib/pages-json-import-preload.mjs','scripts/validate-world-country-refresh.mjs',str(path)],cwd=ROOT,check=True,stdout=subprocess.DEVNULL)
  result=apply_candidate(ROOT,candidate,args.apply_local,admit)
  if args.apply_local and result['status']=='LOCAL_SUCCESSOR_APPLIED':subprocess.run([args.node,'--import','./scripts/lib/pages-json-import-preload.mjs','scripts/build-world-country-observation-p2.mjs'],cwd=ROOT,check=True,stdout=subprocess.DEVNULL)
  print(json.dumps(result,ensure_ascii=False));raise SystemExit(0)
 except Exception as error:
  if args.apply_local and fd is not None:
   for rel,body in saved.items():
    target=checked_path(ROOT,rel)
    if body is not None:target.write_bytes(body)
    elif target.exists():target.unlink()
   write_atomic(checked_path(ROOT,STATUS),{'schemaVersion':'WORLD_COUNTRY_REFRESH_STATUS_V1','status':'FAILED','checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'error':'REFRESH_FAILED_ACTIVE_SNAPSHOT_PRESERVED','automaticRefreshEnabled':False,'productionAutomaticRefreshEnabled':False})
  print(json.dumps({'status':'FAILED_NO_ACTIVE_SNAPSHOT_OVERWRITE','error':str(error),'automaticRefreshEnabled':False,'productionAutomaticRefreshEnabled':False}));raise SystemExit(1)
 finally:
  if fd is not None:os.close(fd);lock.unlink(missing_ok=True)
