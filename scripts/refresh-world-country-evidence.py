"""Manual World Bank refresh. Local candidate files only; never schedules or publishes."""
from pathlib import Path
import argparse,base64,concurrent.futures,datetime,hashlib,json,math,os,re,subprocess,sys,urllib.request
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
def validate_scope(current,candidate):
 expected={r['id']for r in current['identitySource']['countries']}
 actual=[r['id']for r in candidate['identitySource']['countries']]
 if set(actual)!=expected or len(actual)!=len(set(actual)):raise ValueError('ACTIVE_IDENTITY_SCOPE_MUST_BE_PRESERVED')
 for series in candidate['series']:
  previous=next(s for s in current['series']if s['indicatorId']==series['indicatorId'])
  if series['metadata'].get('Unitofmeasure')!=previous['metadata'].get('Unitofmeasure'):raise ValueError('SOURCE_UNIT_CHANGE_REQUIRES_REVIEW')
  prior_units={r.get('sourceUnit')or None for r in previous['observations']}or{None}
  if any((r.get('sourceUnit')or None)not in prior_units for r in series['observations']):raise ValueError('SOURCE_ROW_UNIT_CHANGE_REQUIRES_REVIEW')
  old={(r['countryCode'],r['period']):r.get('value')for r in previous['observations']}
  new={(r['countryCode'],r['period']):r.get('value')for r in series['observations']}
  if len(new)!=len(series['observations']):raise ValueError('DUPLICATE_COUNTRY_PERIOD')
  if any(v is not None and new.get(k)is None for k,v in old.items()):raise ValueError('NUMERIC_HISTORY_DISAPPEARED_REQUIRES_REVIEW')
 return True
def validate(candidate,registered):
 if candidate.get('sourceFailures')or candidate.get('owner')!='WORLD_EVIDENCE':raise ValueError('SOURCE_FAILURE_NO_ACTIVE_VERSION_CHANGE')
 if set(s['indicatorId']for s in candidate['series'])!=set(registered):raise ValueError('REGISTERED_INDICATOR_COVERAGE_REQUIRED')
 identities={r['id']for r in candidate['identitySource']['countries']}
 for s in candidate['series']:
  if s['licenseStatus']!='INDICATOR_CC_BY_4_0_VERIFIED'or s['metadata'].get('License_Type')!='CC BY-4.0':raise ValueError('LICENSE_NOT_VERIFIED')
  for row in s['observations']:
   if row['countryCode']not in identities or not isinstance(row['period'],int)or row['period']<1960:raise ValueError('COUNTRY_PERIOD_INVALID')
   if row.get('value')is not None and row['period']>datetime.datetime.now(datetime.timezone.utc).year:raise ValueError('FUTURE_OBSERVATION_REJECTED')
   if row.get('value')is not None and(not isinstance(row['value'],(int,float))or not math.isfinite(row['value'])):raise ValueError('NONFINITE_SOURCE_VALUE')
 return True
def collect_full_scope(current,fetcher=get,now=None):
 """Same World Evidence owner/source2; explicit manual full-scope path, never a scheduler."""
 now=now or datetime.datetime.now(datetime.timezone.utc).isoformat();end=datetime.datetime.fromisoformat(now).year
 countries=current['identitySource']['countries'];ids={c['id']for c in countries};receipts=[]
 def read(url):
  body,h=fetcher(url);receipts.append({'url':url,'sha256':h,'retrievedAt':now})
  error=body.get('message')if isinstance(body,dict)else next((x.get('message')for x in body if isinstance(x,dict)and x.get('message')),None)if isinstance(body,list)else None
  if error:raise ValueError('SOURCE_ERROR_BODY:'+json.dumps(error))
  return body,h
 series=[]
 for old in current['series']:
  id=old['indicatorId'];mu=f'https://api.worldbank.org/v2/sources/2/series/{id}/metadata?format=json'
  meta,mh=read(mu)
  if not isinstance(meta,dict)or not isinstance(meta.get('source'),list):raise ValueError('METADATA_RESPONSE_SHAPE_INVALID')
  meta={x['id']:x['value']for x in meta.get('source',[{}])[0].get('concept',[{}])[0].get('variable',[{}])[0].get('metatype',[])}
  url=f'https://api.worldbank.org/v2/country/all/indicator/{id}?format=json&source=2&date=1960:{end}&per_page=20000';rows=[];hashes=[];page=1;updated=None
  while True:
   data,dh=read(url+'&page='+str(page))
   if not isinstance(data,list)or len(data)!=2 or not isinstance(data[0],dict)or not isinstance(data[1],list):raise ValueError('SOURCE_RESPONSE_SHAPE_INVALID')
   pages=int(data[0].get('pages',0))
   if pages<1 or pages>50:raise ValueError('SOURCE_PAGE_RANGE_INVALID')
   updated=data[0].get('lastupdated');hashes.append(dh)
   for row in data[1]:
    if row['countryiso3code']not in ids:continue
    if row['indicator']['id']!=id or not 1960<=int(row['date'])<=end:raise ValueError('SOURCE_IDENTITY_MISMATCH')
    rows.append({'countryCode':row['countryiso3code'],'countryCodeAlpha2':row['country']['id'],'period':int(row['date']),'value':row['value'],'qualityState':'OBSERVED'if row['value']is not None else'MISSING','sourceUnit':row.get('unit')or None,'decimal':row.get('decimal'),'sourceReturnedObservation':True})
   if page>=pages:break
   page+=1
  series.append({**old,'metadata':meta,'metadataSha256':mh,'metadataUrl':mu,'dataUrl':url,'dataSha256':hashes[0]if len(hashes)==1 else digest(canonical(hashes)),'dataPageDigests':hashes,'observations':rows,'readStatus':'SUCCESS','readError':None,'retrievedAt':now,'validatedAt':now,'sourceUpdatedAt':updated,'licenseStatus':'INDICATOR_CC_BY_4_0_VERIFIED'if meta.get('License_Type')=='CC BY-4.0'else'RIGHTS_PENDING'})
 out={**current,'retrievedAt':now,'validatedAt':now,'collectionMode':'EXPLICIT_MANUAL_FULL_ACTIVE_SCOPE_SOURCE2','observationArchiveRange':{'start':1960,'end':end},'series':series,'sourceFailures':[],'requestReceipts':receipts,'automaticRefreshEnabled':False,'productionAutomaticRefreshEnabled':False}
 out.pop('contentSignature',None);out.pop('predecessorSnapshot',None)
 validate(out,[s['indicatorId']for s in current['series']]);validate_scope(current,out)
 verified=datetime.datetime.now(datetime.timezone.utc).isoformat();out['validatedAt']=verified
 for s in out['series']:s['validatedAt']=verified
 out['projectionDigest']=digest(canonical({k:v for k,v in out.items()if k!='projectionDigest'}));return out
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
def write_atomic_bytes(path,raw):
 path.parent.mkdir(parents=True,exist_ok=True);tmp=path.with_suffix(path.suffix+'.pending');tmp.write_bytes(raw);os.replace(tmp,path)
def write_atomic(path,value):
 write_atomic_bytes(path,(json.dumps(value,ensure_ascii=False,indent=2)+'\n').encode())
def prepare_recovery(root,work_dir):
 work_dir.mkdir(parents=True,exist_ok=True);journal=work_dir/'world-country-refresh-transaction.json'
 if journal.exists()and json.loads(journal.read_text())['state']=='PREPARED':raise ValueError('UNRESOLVED_LOCAL_RECOVERY_JOURNAL')
 records=[]
 for rel in [POINTER,STATUS,'content/civilization-atlas/reconfiguration/world-observation-projection-v1.json']:
  path=checked_path(root,rel);raw=path.read_bytes()if path.exists()else None
  records.append({'path':rel,'sha256':digest(raw)if raw is not None else None,'base64':base64.b64encode(raw).decode()if raw is not None else None})
 ref=load_active(root)[0];value={'state':'PREPARED','root':str(root.resolve()),'previousSourceVersion':ref.get('sourceVersion'),'candidateSourceVersion':None,'records':records};write_atomic(journal,value);return journal
def recover_local(root,journal):
 value=json.loads(journal.read_text());allowed=[POINTER,STATUS,'content/civilization-atlas/reconfiguration/world-observation-projection-v1.json']
 if value['state']!='PREPARED'or value['root']!=str(root.resolve()):raise ValueError('RECOVERY_IDENTITY_INVALID')
 if(checked_path(root,'.tmp/world-country-refresh.lock')).exists():raise ValueError('VERIFY_STOPPED_OWNER_AND_STALE_LOCK_BEFORE_RECOVERY')
 current=load_active(root)[0]
 if current.get('sourceVersion')not in [value['previousSourceVersion'],value['candidateSourceVersion']]:raise ValueError('RECOVERY_WOULD_OVERWRITE_ANOTHER_SOURCE_VERSION')
 if sorted(r['path']for r in value['records'])!=sorted(allowed):raise ValueError('RECOVERY_PATH_SCOPE_INVALID')
 for record in value['records']:
  if record['base64']is None:raise ValueError('RECOVERY_ABSENT_PREDECESSOR_REQUIRES_OWNER_REVIEW')
  raw=base64.b64decode(record['base64']);
  if digest(raw)!=record['sha256']:raise ValueError('RECOVERY_RECEIPT_DIGEST_INVALID')
 # Validate all receipts before the first write; restore source pointer and paired projection atomically per file.
 for record in value['records']:write_atomic_bytes(checked_path(root,record['path']),base64.b64decode(record['base64']))
 value['state']='RECOVERED';write_atomic(journal,value);return {'status':'PREDECESSOR_PAIR_RECOVERED','sourceVersion':value['previousSourceVersion']}
def apply_candidate(root,candidate,apply=False,admitter=None,before_promote=None):
 ref,current,raw=load_active(root);validate(candidate,[s['indicatorId']for s in current['series']]);validate_scope(current,candidate);sig=signature(candidate);old_sig=signature(current);delta=changes(current,candidate);result={'mode':'LOCAL_MANUAL_ONLY','status':'UNCHANGED'if sig==old_sig else'CHANGED_CANDIDATE','contentSignature':sig,'previousSnapshotPath':ref['snapshotPath'],'previousSha256':digest(raw),'changes':delta,'automaticRefreshEnabled':False,'productionAutomaticRefreshEnabled':False,'productionWrites':0,'providerCalls':0}
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
 finish=before_promote(candidate,target)if before_promote else None
 pointer={'schemaVersion':'WORLD_COUNTRY_EVIDENCE_POINTER_V1','owner':'WORLD_EVIDENCE','snapshotPath':target,'sha256':digest(body),'contentSignature':sig,'sourceVersion':candidate['projectionDigest'],'lastSuccessfulSourceCheckAt':candidate['retrievedAt'],'publicationStatus':'LOCAL_CANDIDATE_HUMAN_PENDING','automaticRefreshEnabled':False,'productionAutomaticRefreshEnabled':False,'previousSnapshot':{'path':ref['snapshotPath'],'sha256':digest(raw)}};write_atomic(checked_path(root,STATUS),{'schemaVersion':'WORLD_COUNTRY_REFRESH_STATUS_V1','status':'UPDATING','automaticRefreshEnabled':False,'productionAutomaticRefreshEnabled':False});write_atomic(checked_path(root,POINTER),pointer)
 if finish:finish()
 write_atomic(checked_path(root,STATUS),{'schemaVersion':'WORLD_COUNTRY_REFRESH_STATUS_V1','status':'SUCCESS','checkedAt':candidate['retrievedAt'],'activeSourceVersion':candidate['projectionDigest'],'automaticRefreshEnabled':False,'productionAutomaticRefreshEnabled':False});result.update({'status':'LOCAL_SUCCESSOR_APPLIED','snapshotPath':target,'sha256':digest(body)});return result
if __name__=='__main__':
 # The historical collector has an explicitly bounded3-country scope. Never shrink an expanded current source.
 _active=load_active(ROOT)[1]
 if len(_active['identitySource']['countries'])>3 and '--full-scope'not in sys.argv:
  print(json.dumps({'status':'LEGACY_COLLECTOR_SCOPE_REJECTED_ACTIVE_SOURCE_UNCHANGED','required':'Use the explicit177-identity manual collector with current source validation; no automatic refresh.'}));raise SystemExit(2)
 parser=argparse.ArgumentParser();parser.add_argument('--candidate',type=Path);parser.add_argument('--apply-local',action='store_true');parser.add_argument('--full-scope',action='store_true');parser.add_argument('--work-dir',type=Path,default=Path(os.environ.get('PHIOS_QA_TEMP_ROOT','D:/PHIOS/QA-TEMP'))/'COUNTRY-WORLD-LIFE-R4');parser.add_argument('--node',default='node');args=parser.parse_args();lock=ROOT/'.tmp/world-country-refresh.lock';lock.parent.mkdir(parents=True,exist_ok=True);fd=None
 saved={};journal=None
 try:
  fd=os.open(lock,os.O_CREAT|os.O_EXCL|os.O_WRONLY);os.write(fd,str(os.getpid()).encode());saved={rel:(checked_path(ROOT,rel).read_bytes()if checked_path(ROOT,rel).exists()else None)for rel in [POINTER,STATUS,'content/civilization-atlas/reconfiguration/world-observation-projection-v1.json']};ref,current,raw=load_active(ROOT);candidate=json.loads(args.candidate.read_text(encoding='utf-8'))if args.candidate else collect_full_scope(current)if args.full_scope else collect(current)
  def admit(value):
   args.work_dir.mkdir(parents=True,exist_ok=True);path=args.work_dir/'world-country-refresh-candidate.json';path.write_bytes((json.dumps(value,ensure_ascii=False)+'\n').encode());subprocess.run([args.node,'--import','./scripts/lib/pages-json-import-preload.mjs','scripts/validate-world-country-refresh.mjs',str(path)],cwd=ROOT,check=True,stdout=subprocess.DEVNULL)
  if args.apply_local:journal=prepare_recovery(ROOT,args.work_dir)
  def prepare_pair(value,target):
   entry=json.loads(journal.read_text());entry['candidateSourceVersion']=value['projectionDigest'];write_atomic(journal,entry)
   staged=args.work_dir/'world-country-p2-candidate.json';subprocess.run([args.node,'--import','./scripts/lib/pages-json-import-preload.mjs','scripts/build-world-country-observation-p2.mjs','--source',str(checked_path(ROOT,target)),'--output',str(staged)],cwd=ROOT,check=True,stdout=subprocess.DEVNULL)
   body=staged.read_bytes()
   if json.loads(body)['sourceVersion']!=value['projectionDigest']:raise ValueError('PAIRED_PROJECTION_VERSION_MISMATCH')
   return lambda:write_atomic_bytes(checked_path(ROOT,'content/civilization-atlas/reconfiguration/world-observation-projection-v1.json'),body)
  result=apply_candidate(ROOT,candidate,args.apply_local,admit,prepare_pair if args.apply_local else None)
  if journal:
   entry=json.loads(journal.read_text());entry['state']='COMPLETE';write_atomic(journal,entry)
  print(json.dumps(result,ensure_ascii=False));raise SystemExit(0)
 except Exception as error:
  if args.apply_local and fd is not None:
   for rel,body in saved.items():
    target=checked_path(ROOT,rel)
    if body is not None:write_atomic_bytes(target,body)
    elif target.exists():target.unlink()
   write_atomic(checked_path(ROOT,STATUS),{'schemaVersion':'WORLD_COUNTRY_REFRESH_STATUS_V1','status':'FAILED','checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'error':'REFRESH_FAILED_ACTIVE_SNAPSHOT_PRESERVED','automaticRefreshEnabled':False,'productionAutomaticRefreshEnabled':False})
   if journal:
    entry=json.loads(journal.read_text());entry['state']='ROLLED_BACK';write_atomic(journal,entry)
  print(json.dumps({'status':'FAILED_NO_ACTIVE_SNAPSHOT_OVERWRITE','error':str(error),'automaticRefreshEnabled':False,'productionAutomaticRefreshEnabled':False}));raise SystemExit(1)
 finally:
  if fd is not None:os.close(fd);lock.unlink(missing_ok=True)
