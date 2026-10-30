from pathlib import Path
import json,urllib.request,urllib.error,hashlib,datetime,concurrent.futures
folder=Path(__file__).parent
identity=json.loads((folder/'R1-PRODUCTION-IDENTITY.json').read_text())
baseline=json.loads((folder/'R1-PREDEPLOY-PUBLIC-BASELINE.json').read_text())
def read(url):
    try:
        with urllib.request.urlopen(urllib.request.Request(url,headers={'Cache-Control':'no-cache'}),timeout=40) as r:return r.status,r.read()
    except urllib.error.HTTPError as e:return e.code,e.read()
def entrance(row):
    code,body=read(identity['url']+row['path'])
    return {'path':row['path'],'beforeStatus':row['status'],'status':code,'bytes':len(body),'sameStatus':code==row['status'],'sha256':hashlib.sha256(body).hexdigest()}
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:rows=list(pool.map(entrance,baseline['rows']))
assets=[]
for rel in ['assets/js/pages/civilization-atlas/world-company-analysis.js','assets/js/pages/civilization-atlas/reconfiguration-renderer.js','assets/js/i18n.js']:
    expected=hashlib.sha256((Path('C:/phios/.worktrees/world-release-main/.pages-output')/rel).read_bytes()).hexdigest()
    for origin in [identity['url'],identity['deploymentUrl']]:
        code,body=read(origin+'/'+rel)
        assets.append({'path':rel,'origin':origin,'status':code,'sourceHashMatches':code==200 and hashlib.sha256(body).hexdigest()==expected,'expectedSha256':expected})
status='PASS' if all(r['sameStatus'] for r in rows) and all(r['sourceHashMatches'] for r in assets) else 'FAIL'
record={'checkedUtc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':status,'identity':identity,'entrances':rows,'assets':assets,'providerCalls':0,'productionWrites':0,'scope':'Anonymous public/sensitive URL status and static asset identities; no paid entitlement/customer account claim'}
(folder/'R1-PRODUCTION-PUBLIC-BOUNDARIES.json').write_text(json.dumps(record,indent=2)+'\n')
print(json.dumps(record))
assert status=='PASS'
