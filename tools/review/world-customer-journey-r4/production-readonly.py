from pathlib import Path
import json, urllib.request, tomllib, hashlib, datetime, shutil
root=Path('C:/phios');folder=Path(__file__).parent
token=tomllib.loads(Path('C:/Users/Guest Account/AppData/Roaming/xdg.config/.wrangler/config/default.toml').read_text())['oauth_token']
base='https://api.cloudflare.com/client/v4/accounts/0b9f36bdf56f38d7d09aebe388f15204/pages/projects/phios-github'
def get(url):
 with urllib.request.urlopen(urllib.request.Request(url,headers={'Authorization':'Bearer '+token,'Cache-Control':'no-cache'}),timeout=30) as response:return json.load(response)['result']
def digest(value):return hashlib.sha256(json.dumps(value,sort_keys=True).encode()).hexdigest()
project=get(base);domains=get(base+'/domains');config=project['deployment_configs']['production'];deployment=get(base+'/deployments/'+project['canonical_deployment']['id']);env=config.get('env_vars',{})
record={'checkedUtc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'project':project['name'],'productionBranch':project['production_branch'],'automaticProductionDeployment':project['source']['config'].get('production_deployments_enabled'),'productionMode':env.get('PHIOS_D1_MAINTENANCE_MODE',{}).get('value'),'environmentFingerprint':digest(env),'d1Fingerprint':digest(config.get('d1_databases',{})),'r2Fingerprint':digest(config.get('r2_buckets',{})),'rollbackDeployment':{k:deployment.get(k) for k in ['id','url','environment','created_on','latest_stage']},'rollbackCommit':deployment['deployment_trigger']['metadata'].get('commit_hash'),'domains':[{'name':d['name'],'status':d['status']} for d in domains],'diskFreeBytes':shutil.disk_usage(root).free,'apiWrites':0}
target=folder/'PRODUCTION-READ-ONLY-BASELINE.json'
# R4 independent read-only receipt
target.write_bytes((json.dumps(record,indent=2)+'\n').encode())
assert record['project']=='phios-github' and record['productionBranch']=='main' and record['automaticProductionDeployment'] is False
assert deployment['environment']=='production' and deployment['latest_stage']['status']=='success'
assert any(d['name']=='getphios.com' and d['status']=='active' for d in record['domains'])
print(json.dumps(record))
