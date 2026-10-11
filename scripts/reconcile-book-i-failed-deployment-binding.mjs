import fs from 'node:fs';import {execFileSync}from'node:child_process';
process.env.WRANGLER_LOG_PATH='C:/phios/.tmp/book-i-deployment-binding-reconcile.log';process.env.WRANGLER_SEND_METRICS='false';
const auth=JSON.parse(execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','auth','token','--json'],{encoding:'utf8'})),headers={Authorization:`Bearer ${auth.token}`};
const base='https://api.cloudflare.com/client/v4/accounts/0b9f36bdf56f38d7d09aebe388f15204';
const projectResponse=await fetch(base+'/pages/projects/phios-github',{headers});const projectJson=await projectResponse.json();if(!projectResponse.ok||!projectJson.success)throw Error('PROJECT_READ_FAILED');
const project=projectJson.result,saved=JSON.parse(fs.readFileSync('.tmp/manuscript-production-rollback-private.json'));
const stable=x=>JSON.stringify(x&&typeof x==='object'?Array.isArray(x)?x.map(v=>JSON.parse(stable(v))):Object.fromEntries(Object.keys(x).sort().map(k=>[k,JSON.parse(stable(x[k]))])):x);
const changedPaths=[];function differences(a,b,path='production'){if(stable(a??null)===stable(b??null))return;if(a&&b&&typeof a==='object'&&typeof b==='object'&&!Array.isArray(a)&&!Array.isArray(b)){for(const key of new Set([...Object.keys(a),...Object.keys(b)]))differences(a[key],b[key],path+'.'+key);}else changedPaths.push(path);}
differences(saved.project.deployment_configs.production,project.deployment_configs.production);
const serviceResponse=await fetch(base+'/workers/services/phios-method-report-renderer-production',{headers});const service=await serviceResponse.json();
const receipt={at:new Date().toISOString(),state:'DEPLOYMENT_BLOCKED_MISSING_EXISTING_SERVICE_BINDING',binding:'METHOD_REPORT_RENDERER',referencedService:'phios-method-report-renderer-production',serviceReadStatus:serviceResponse.status,serviceFound:service.success===true,canonicalDeploymentAfterFailure:project.canonical_deployment.id,pairedRollbackDeployment:saved.deployment.id,canonicalUnchanged:project.canonical_deployment.id===saved.deployment.id,configurationUnchanged:JSON.stringify(project.deployment_configs.production)===JSON.stringify(saved.project.deployment_configs.production),rollbackRequired:project.canonical_deployment.id!==saved.deployment.id,firstBookCurrentRevisionDeployed:false,providerCalls:0,bindingsNotModified:true};
receipt.configurationUnchanged=changedPaths.length===0;receipt.configurationChangedPaths=changedPaths;receipt.configurationSecretsNotPrinted=true;
fs.writeFileSync('tools/review/free-ask-manuscript-r1/BOOK-I-V3-DEPLOYMENT-BINDING-FAILURE.json',JSON.stringify(receipt,null,2)+'\n');
const path='tools/review/free-ask-manuscript-r1/CURRENT-IV-VI-PRODUCTION-RELEASE.json',release=JSON.parse(fs.readFileSync(path));release.DEPLOYMENT='FAILED_NOT_ACTIVATED';release.failedAttempt=receipt;fs.writeFileSync(path,JSON.stringify(release,null,2)+'\n');
console.log(receipt);
