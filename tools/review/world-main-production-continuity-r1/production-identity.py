"""Read-only actual deployed identity; no synthetic success receipt."""
from pathlib import Path
import json, urllib.request, tomllib, hashlib, datetime
folder=Path(__file__).parent
token=tomllib.loads(Path('C:/Users/Guest Account/AppData/Roaming/xdg.config/.wrangler/config/default.toml').read_text())['oauth_token']
base='https://api.cloudflare.com/client/v4/accounts/0b9f36bdf56f38d7d09aebe388f15204/pages/projects/phios-github'
def get(url):
    with urllib.request.urlopen(urllib.request.Request(url,headers={'Authorization':'Bearer '+token,'Cache-Control':'no-cache'}),timeout=30) as response:return json.load(response)['result']
def digest(value):return hashlib.sha256(json.dumps(value,sort_keys=True).encode()).hexdigest()
project=get(base);deployment=get(base+'/deployments/'+project['canonical_deployment']['id'])
baseline=json.loads((folder/'PRODUCTION-BASELINE.json').read_text())
config=project['deployment_configs']['production']
assert project['source']['config']['production_deployments_enabled'] is False
for key,field in [('env_vars','environmentFingerprint'),('d1_databases','d1Fingerprint'),('r2_buckets','r2Fingerprint')]:assert digest(config.get(key,{}))==baseline[field],field+' drift'
identity={'checkedUtc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'environment':deployment['environment'],'commitHash':deployment['deployment_trigger']['metadata']['commit_hash'],'id':deployment['id'],'latestStage':deployment['latest_stage'],'url':'https://getphios.com','deploymentUrl':deployment['url'],'automaticProductionDeployment':False,'configurationUnchanged':True,'rollbackDeploymentId':baseline['rollbackDeployment']['id']}
assert identity['commitHash']=='60e2a4d0aad747e82fd3b63d58b06dbf1586306c'
assert identity['environment']=='production' and identity['latestStage']['status']=='success'
assert identity['id']!=baseline['rollbackDeployment']['id']
assert any(d['name']=='getphios.com' and d['status']=='active' for d in get(base+'/domains'))
(folder/'R1-PRODUCTION-IDENTITY.json').write_text(json.dumps(identity,indent=2)+'\n')
print(json.dumps(identity))
