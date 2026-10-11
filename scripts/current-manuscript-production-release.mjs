import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const dir='tools/review/free-ask-manuscript-r1/';
const action=process.argv[2]||'preflight';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
process.env.WRANGLER_LOG_PATH='C:/phios/.tmp/manuscript-production-release.log';process.env.WRANGLER_SEND_METRICS='false';
const auth=JSON.parse(execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','auth','token','--json'],{encoding:'utf8'}));
const headers={Authorization:`Bearer ${auth.token}`,'Content-Type':'application/json'};
const base='https://api.cloudflare.com/client/v4/accounts/0b9f36bdf56f38d7d09aebe388f15204/pages/projects/phios-github';
async function api(path='',method='GET',body){const r=await fetch(base+path,{method,headers,body:body?JSON.stringify(body):undefined});const j=await r.json();if(!r.ok||!j.success)throw Error(JSON.stringify({status:r.status,errors:j.errors}));return j.result;}
if(action==='preflight'){
 const project=await api();const deployment=project.canonical_deployment;
 if(project.latest_deployment?.latest_stage?.status==='active')throw Error('BLOCKED_BY_CONCURRENT_PRODUCTION_BUILD '+project.latest_deployment.id);
 fs.writeFileSync('.tmp/manuscript-production-rollback-private.json',JSON.stringify({project,deployment},null,2));
 const receipt=JSON.parse(fs.readFileSync(dir+'CURRENT-IV-VI-BUILD-RECEIPT.json'));
 const changed=receipt.inputs.filter(x=>!fs.existsSync(x.path)||sha(fs.readFileSync(x.path))!==x.sha256);if(changed.length)throw Error('RELEVANT_INPUT_CHANGED '+changed.map(x=>x.path));
 if(sha(fs.readFileSync('.pages-output/_worker.js'))!==receipt.output.workerSha256||sha(fs.readFileSync('.pages-output/_routes.json'))!==receipt.output.routesSha256)throw Error('OUTPUT_IDENTITY_CHANGED');
 const files=[];function scan(path){for(const e of fs.readdirSync(path,{withFileTypes:true})){const p=path+'/'+e.name;if(e.isDirectory())scan(p);else files.push({path:p.slice('.pages-output/'.length),sha256:sha(fs.readFileSync(p))});}}scan('.pages-output');files.sort((a,b)=>a.path.localeCompare(b.path));
 const record={at:new Date().toISOString(),head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),relevantSourceWorkspaceDigest:receipt.relevantBuildInputDigest,buildOutput:receipt.output,fullPublicationDigest:sha(JSON.stringify(files)),publicationFiles:files,registry:'manuscript-knowledge-source-registry-v4',scopeRegistry:'manuscript-text-scope-candidates-v2',scopes:JSON.parse(fs.readFileSync('content/knowledge/source-access/registries/manuscript-text-scope-candidates-v2.json')).records,rollback:{deploymentId:deployment.id,url:deployment.url,configPrivateSnapshot:'.tmp/manuscript-production-rollback-private.json',restore:'Restore original production scope flag and QA flags, then Cloudflare Pages rollback to exact previous deployment ID; registry is bundled with Worker'},configuration:{beforeScope:project.deployment_configs.production.env_vars?.PHIOS_MANUSCRIPT_TEXT_SCOPE_ENABLED||null,QAFlags:Object.fromEntries(Object.entries(project.deployment_configs.production.env_vars||{}).filter(([k])=>/MANUSCRIPT.*QA/.test(k)))},DEPLOYMENT:'PREFLIGHT_ONLY',providerCalls:0};
 fs.writeFileSync(dir+'CURRENT-IV-VI-PRODUCTION-RELEASE.json',JSON.stringify(record,null,2));console.log(JSON.stringify({rollbackId:deployment.id,buildVerified:true,publicationFiles:files.length,configuration:record.configuration,r2:project.deployment_configs.production.r2_buckets},null,2));
}else if(action==='enable'){
 const project=await api();const saved=JSON.parse(fs.readFileSync('.tmp/manuscript-production-rollback-private.json'));
 if(project.canonical_deployment.id!==saved.deployment.id)throw Error('CONCURRENT_PRODUCTION_DEPLOYMENT');
 const vars={...project.deployment_configs.production.env_vars,PHIOS_MANUSCRIPT_TEXT_SCOPE_ENABLED:{type:'secret_text',value:'true'},PHIOS_MANUSCRIPT_TEXT_SCOPE_QA:{type:'secret_text',value:'false'},PHIOS_MANUSCRIPT_DERIVATIVE_QA:{type:'secret_text',value:'false'}};
 await api('','PATCH',{deployment_configs:{production:{env_vars:vars}}});console.log('Server scope activation configured; QA flags false.');
}else if(action==='identity'){
 const project=await api();const r=JSON.parse(fs.readFileSync(dir+'CURRENT-IV-VI-PRODUCTION-RELEASE.json'));r.deployment={id:project.canonical_deployment.id,url:project.canonical_deployment.url,stage:project.canonical_deployment.latest_stage,scopeEnabled:project.deployment_configs.production.env_vars.PHIOS_MANUSCRIPT_TEXT_SCOPE_ENABLED?.value,QAFlags:Object.fromEntries(Object.entries(project.deployment_configs.production.env_vars).filter(([k])=>/MANUSCRIPT.*QA/.test(k)).map(([k,v])=>[k,v.value]))};r.DEPLOYMENT='DEPLOYED_PENDING_LIVE';fs.writeFileSync(dir+'CURRENT-IV-VI-PRODUCTION-RELEASE.json',JSON.stringify(r,null,2));console.log(JSON.stringify(r.deployment,null,2));
}else if(action==='rollback'){
 const saved=JSON.parse(fs.readFileSync('.tmp/manuscript-production-rollback-private.json'));const restored={...saved.project.deployment_configs.production.env_vars,PHIOS_MANUSCRIPT_TEXT_SCOPE_ENABLED:{type:'secret_text',value:'false'},PHIOS_MANUSCRIPT_TEXT_SCOPE_QA:{type:'secret_text',value:'false'},PHIOS_MANUSCRIPT_DERIVATIVE_QA:{type:'secret_text',value:'false'}};await api('','PATCH',{deployment_configs:{production:{env_vars:restored}}});await api('/deployments/'+saved.deployment.id+'/rollback','POST');console.log('Disabled all new admission flags; restored paired previous configuration and exact deployment.');
}else if(action==='verify'){
 const project=await api(),release=JSON.parse(fs.readFileSync(dir+'CURRENT-IV-VI-PRODUCTION-RELEASE.json'));if(project.canonical_deployment.id!==release.deployment.id)throw Error('PRODUCTION_IDENTITY_CHANGED');console.log('PASS current production deployment identity '+project.canonical_deployment.id+'; secret bindings present '+['PHIOS_MANUSCRIPT_TEXT_SCOPE_ENABLED','PHIOS_MANUSCRIPT_TEXT_SCOPE_QA','PHIOS_MANUSCRIPT_DERIVATIVE_QA'].every(k=>project.deployment_configs.production.env_vars[k]?.type==='secret_text'));
}else throw Error('UNKNOWN_ACTION');
