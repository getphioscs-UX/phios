import fs from'node:fs';import assert from'node:assert/strict';import{execFileSync}from'node:child_process';
const dir='tools/review/free-ask-manuscript-r1/',read=p=>JSON.parse(fs.readFileSync(p));
const current=read(dir+'CURRENT-ASK-PRESERVED-CONFIG-PUBLICATION.json'),live=read(dir+'whole-chapter-batch-r1/LIVE-ANSWERS.json');
assert(live.results.some(r=>!r.pass));
const history=fs.readdirSync(dir).filter(p=>p.startsWith('ASK-PUBLICATION-HISTORY-')).map(p=>read(dir+p));
const original=history.find(p=>p.deploymentId==='030ab90a-71a5-4609-b1f5-7f7971fea777');
assert.equal(original.rollbackDeployment,'ddcd00ed-4c7e-4706-824d-2fe66c7dc2de');assert.equal(original.configurationComparison.runtimeChanges.length,0);
const auth=JSON.parse(execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','auth','token','--json'],{encoding:'utf8'}));
const endpoint='https://api.cloudflare.com/client/v4/accounts/0b9f36bdf56f38d7d09aebe388f15204/pages/projects/phios-github',headers={Authorization:`Bearer ${auth.token}`};
async function project(){const r=await fetch(endpoint,{headers}),j=await r.json();assert(j.success);return j.result;}
const stable=x=>JSON.stringify(x&&typeof x==='object'?(Array.isArray(x)?x.map(v=>JSON.parse(stable(v))):Object.fromEntries(Object.keys(x).sort().map(k=>[k,JSON.parse(stable(x[k]))]))):x);
const before=await project();assert.equal(before.canonical_deployment.id,current.deploymentId,'CONCURRENT_PRODUCTION_DEPLOYMENT_STOP');
fs.writeFileSync('.tmp/whole-chapter-batch-pre-rollback-private.json',JSON.stringify(before,null,2));
const response=await fetch(endpoint+'/deployments/'+original.rollbackDeployment+'/rollback',{method:'POST',headers}),body=await response.json();assert(response.ok&&body.success);
const after=await project();assert.equal(after.canonical_deployment.id,original.rollbackDeployment);
assert.equal(stable(before.deployment_configs.production),stable(after.deployment_configs.production),'ROLLBACK_RUNTIME_CONFIG_CHANGED');
const receipt={at:new Date().toISOString(),reason:'Two unused production questions selected incorrect argument passages. New whole-chapter ranges withdrawn; pre-batch deployment restored.',failedDeployments:[original.deploymentId,current.deploymentId],restoredDeployment:after.canonical_deployment.id,configurationUnchanged:true,stripeFlag:'LIVE_PRESERVED',providerCalls:0,payments:0,secretWrites:0,commitPush:0,sourceChangesRetained:true,failureEvidence:dir+'whole-chapter-batch-r1/LIVE-ANSWERS.json'};
fs.writeFileSync(dir+'whole-chapter-batch-r1/ROLLBACK-RECEIPT.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
