from pathlib import Path
import json, urllib.request, tomllib, hashlib, datetime, shutil
root=Path('C:/phios');folder=Path(__file__).parent
token=tomllib.loads(Path('C:/Users/Guest Account/AppData/Roaming/xdg.config/.wrangler/config/default.toml').read_text())['oauth_token']
base='https://api.cloudflare.com/client/v4/accounts/0b9f36bdf56f38d7d09aebe388f15204/pages/projects/phios-github'
def get(url):
 with urllib.request.urlopen(urllib.request.Request(url,headers={'Authorization':'Bearer '+token,'Cache-Control':'no-cache'}),timeout=30) as response:return json.load(response)['result']
def digest(value):return hashlib.sha256(json.dumps(value,sort_keys=True).encode()).hexdigest()
deployments=get(base+'/deployments?per_page=25'); rows=[{'id':d['id'],'url':d['url'],'environment':d['environment'],'commit':d['deployment_trigger']['metadata'].get('commit_hash'),'branch':d['deployment_trigger']['metadata'].get('branch'),'stage':d['latest_stage']} for d in deployments if d['deployment_trigger']['metadata'].get('branch')=='codex/world-customer-experience-r3']; (folder/'PREVIEW-DISCOVERY.json').write_text(json.dumps(rows,indent=2),encoding='utf-8'); print(json.dumps(rows))