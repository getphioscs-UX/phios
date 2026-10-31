from pathlib import Path
import json,urllib.request,tomllib,datetime
q=Path('C:/phios/tools/review/subject-country-spw-fin-r1');token=tomllib.loads(Path('C:/Users/Guest Account/AppData/Roaming/xdg.config/.wrangler/config/default.toml').read_text(encoding='utf-8'))['oauth_token'];base='https://api.cloudflare.com/client/v4/accounts/0b9f36bdf56f38d7d09aebe388f15204/pages/projects/phios-github';result={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'mode':'READ_ONLY_METADATA_GET','productionWrites':0}
try:
 with urllib.request.urlopen(urllib.request.Request(base,headers={'Authorization':'Bearer '+token,'Cache-Control':'no-cache'}),timeout=20)as response:p=json.load(response)['result']
 s=p.get('source',{}).get('config',{});d=p.get('canonical_deployment')or{};result.update({'project':p['name'],'productionBranch':p.get('production_branch'),'productionAutoDeploy':s.get('production_deployments_enabled'),'previewSetting':s.get('preview_deployment_setting'),'canonicalDeployment':{'id':d.get('id'),'url':d.get('url'),'environment':d.get('environment'),'commit':d.get('deployment_trigger',{}).get('metadata',{}).get('commit_hash'),'branch':d.get('deployment_trigger',{}).get('metadata',{}).get('branch'),'latestStage':d.get('latest_stage')}})
except Exception as e:result['status']='UNAVAILABLE';result['error']=str(e)
(q/'CLOUDFLARE-READ-ONLY.json').write_bytes((json.dumps(result,indent=2)+'\n').encode());print(json.dumps(result))
