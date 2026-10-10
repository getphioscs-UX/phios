import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const directory='content/knowledge/book-vii/production-admission/live-cutover';
const env={...process.env,REPORT_PROVIDER_LIVE_ALLOWED:'false',REPORT_ZERO_COST_REPLAY:'true',NODE_OPTIONS:`${process.env.NODE_OPTIONS||''} --import=${pathToFileURL(path.resolve('scripts/lib/report-zero-cost-preload.mjs')).href}`};
for(const key of Object.keys(env))if(/^(OPENAI|ANTHROPIC|DEEPSEEK|GEMINI|GOOGLE_AI|OPENROUTER).*(API_KEY|ACCESS_TOKEN|SECRET)$/.test(key))delete env[key];
const records=[];
for(const alias of ['check:kap','check:kap-phase18','check:kap-book-vii','check:kap-book-vii-production','check:kap-current','knowledge:public:build','check:pages-build','check']){
 console.log(`RUN npm run ${alias}`);
 const r=spawnSync(`npm run ${alias}`,{shell:true,encoding:'utf8',env,maxBuffer:32*1024*1024});
 const log=`${directory}/${alias.replaceAll(':','-')}.log`;fs.writeFileSync(log,(r.stdout||'')+(r.stderr||''));records.push({command:`npm run ${alias}`,exitCode:r.status,log,error:r.error?.message});console.log(`RESULT ${alias}: ${r.status}`);
 if(r.status!==0)console.log(((r.stdout||'')+(r.stderr||'')).slice(-4000));
}
fs.writeFileSync(`${directory}/full-regression-v1.json`,JSON.stringify({records,providerRequestsAllowed:false,allPass:records.every(r=>r.exitCode===0)},null,2)+'\n');
if(records.some(r=>r.exitCode!==0))process.exit(1);
