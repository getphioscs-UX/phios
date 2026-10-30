"""Read-only exact-main/config/concurrency gate; never changes Cloudflare settings."""
from pathlib import Path
import json, urllib.request, tomllib, hashlib, subprocess, datetime
folder=Path(__file__).parent
root=Path('C:/phios/.worktrees/world-release-main')
expected='60e2a4d0aad747e82fd3b63d58b06dbf1586306c'
def git(*args):
    return subprocess.check_output(['git','-C',str(root),*args],text=True).strip()
assert git('rev-parse','HEAD')==expected
assert git('rev-parse','origin/main')==expected
assert not git('diff','--name-only')
state=json.loads((root/'.wrangler/pages-publication-build-state.json').read_text())
assert state['complete'] is True and state['stage']=='COMPLETE',state
assert not (root/'.wrangler/pages-production-build.lock').exists()
log=(folder/'R1-CHECK-PAGES-RETRY.log').read_text(encoding='utf-8-sig')
assert 'PASS Cloudflare Pages build boundary: .pages-output' in log
baseline=json.loads((folder/'PRODUCTION-BASELINE.json').read_text())
token=tomllib.loads(Path('C:/Users/Guest Account/AppData/Roaming/xdg.config/.wrangler/config/default.toml').read_text())['oauth_token']
url='https://api.cloudflare.com/client/v4/accounts/0b9f36bdf56f38d7d09aebe388f15204/pages/projects/phios-github'
with urllib.request.urlopen(urllib.request.Request(url,headers={'Authorization':'Bearer '+token}),timeout=30) as response:
    project=json.load(response)['result']
assert project['production_branch']=='main'
assert project['source']['config']['production_deployments_enabled'] is False
assert project['canonical_deployment']['id']==baseline['rollbackDeployment']['id'],'Concurrent production changed; stop'
latest=project.get('latest_deployment') or {}
assert latest.get('latest_stage',{}).get('status') not in ('active','pending'),'Concurrent deployment active; stop'
def digest(value):return hashlib.sha256(json.dumps(value,sort_keys=True).encode()).hexdigest()
config=project['deployment_configs']['production']
for key,field in [('env_vars','environmentFingerprint'),('d1_databases','d1Fingerprint'),('r2_buckets','r2Fingerprint')]:
    assert digest(config.get(key,{}))==baseline[field],field+' changed; stop'
artifacts={name:{'bytes':(root/'.pages-output'/name).stat().st_size,'sha256':hashlib.sha256((root/'.pages-output'/name).read_bytes()).hexdigest()} for name in ['_worker.js','_routes.json']}
receipt={'checkedUtc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'head':expected,'status':'PASS','sourceTrackedDiff':[],'artifacts':artifacts,'rollbackId':baseline['rollbackDeployment']['id'],'latestDeployment':{'id':latest.get('id'),'environment':latest.get('environment'),'stage':latest.get('latest_stage')},'productionWrites':0}
(folder/'R1-PREDEPLOY-GATE.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps(receipt))
