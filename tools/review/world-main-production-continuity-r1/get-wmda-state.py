"""Bounded read-only current PR13 CI/Preview status; no deploy/retry/mutation."""
from pathlib import Path
import urllib.request,json,tomllib,datetime
folder=Path(__file__).parent
head='cfe44e808e405c038a29e127198e384ccbeed424'
checked=datetime.datetime.now(datetime.timezone.utc).isoformat()
def get(url,headers):
    with urllib.request.urlopen(urllib.request.Request(url,headers=headers),timeout=40) as response:return json.load(response)
gh={'User-Agent':'PHIOS-owned-release-validation','Cache-Control':'no-cache'}
runs=get('https://api.github.com/repos/getphioscs-UX/phios/actions/runs?head_sha='+head+'&per_page=30&fresh='+checked,gh)['workflow_runs']
rows=[{k:x.get(k)for k in ['id','name','status','conclusion','head_sha','html_url','event']}for x in runs]
(folder/'WMDA-PR13-CI.json').write_bytes((json.dumps({'checkedUtc':checked,'rows':rows},indent=2)+'\n').encode())
token=tomllib.loads(Path('C:/Users/Guest Account/AppData/Roaming/xdg.config/.wrangler/config/default.toml').read_text())['oauth_token']
base='https://api.cloudflare.com/client/v4/accounts/0b9f36bdf56f38d7d09aebe388f15204/pages/projects/phios-github'
headers={'Authorization':'Bearer '+token,'Cache-Control':'no-cache'}
all_deployments=get(base+'/deployments?per_page=25',headers)['result']
matches=[x for x in all_deployments if x['deployment_trigger']['metadata'].get('commit_hash')==head and x['environment']=='preview']
previews=[{'id':x['id'],'url':x['url'],'environment':x['environment'],'commitHash':head,'created_on':x['created_on'],'latestStage':x['latest_stage']}for x in matches]
(folder/'WMDA-PREVIEW-DISCOVERY.json').write_bytes((json.dumps({'checkedUtc':checked,'expectedHead':head,'rows':previews},indent=2)+'\n').encode())
if previews:
    latest=max(previews,key=lambda x:x['created_on'])
    if latest['latestStage']['status']=='success':
        latest['checkedUtc']=checked
        (folder/'wmda-preview/PREVIEW-IDENTITY.json').write_bytes((json.dumps(latest,indent=2)+'\n').encode())
project=get(base,headers)['result'];canonical=project['canonical_deployment']
print(json.dumps({'checkedUtc':checked,'ci':rows,'preview':previews,'production':{'id':canonical['id'],'sha':canonical['deployment_trigger']['metadata'].get('commit_hash'),'automaticDeployment':project['source']['config'].get('production_deployments_enabled')}}))
