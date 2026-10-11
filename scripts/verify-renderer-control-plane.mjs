import fs from 'node:fs';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
const account='0b9f36bdf56f38d7d09aebe388f15204',name='phios-method-report-renderer-production';
const auth=JSON.parse(execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','auth','token','--json'],{encoding:'utf8'}));
const endpoint=`https://api.cloudflare.com/client/v4/accounts/${account}/workers/services/${name}`;
const response=await fetch(endpoint,{headers:{Authorization:`Bearer ${auth.token}`}});const data=await response.json();
const config='workers/method-report-renderer/wrangler.production.jsonc',sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const receipt={at:new Date().toISOString(),endpoint,interface:'CLOUDFLARE_ACCOUNT_WORKER_SERVICE_CONTROL_PLANE_NOT_APPLICATION_ROUTE',accountId:account,environment:'production',serviceName:name,httpStatus:response.status,success:data.success,errors:(data.errors||[]).map(x=>({code:x.code,message:x.message})),configSha256:sha(config),entrypointSha256:sha('workers/method-report-renderer/production.js'),providerCalls:0};
fs.writeFileSync('content/production-closure/live-customer-commercial-convergence/bazi-p9/RENDERER-CONTROL-PLANE-VERIFICATION.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
if(response.status!==404&&!data.success)process.exitCode=1;
