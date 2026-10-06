import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const preload=pathToFileURL(path.resolve('scripts/lib/report-zero-cost-preload.mjs')).href;
const env={...process.env,REPORT_PROVIDER_LIVE_ALLOWED:'false',REPORT_ZERO_COST_REPLAY:'true',NODE_OPTIONS:`${process.env.NODE_OPTIONS||''} --import=${preload}`};
for(const key of Object.keys(env))if(/^(OPENAI|ANTHROPIC|DEEPSEEK|GEMINI|GOOGLE_AI|OPENROUTER).*(API_KEY|ACCESS_TOKEN|SECRET)$/.test(key))delete env[key];
const questions=['为什么没有观察到不代表不存在？','如果两个高质量证据互相冲突怎么办？','为什么人工智能越流畅越不能代表越确定？'];
const records=questions.map(question=>{
 const command=`npm run knowledge:project:published -- "${question}" --locale=zh-Hans --mode=auto`;
 const result=spawnSync(command,{shell:true,encoding:'utf8',env,maxBuffer:8*1024*1024});
 if(result.error)throw result.error;
 const start=result.stdout.indexOf('{');
 const payload=start>=0?JSON.parse(result.stdout.slice(start)):null;
 console.log(JSON.stringify({command,exitCode:result.status,projectionCode:payload?.projection?.projectionCode,bookCode:payload?.projection?.node?.bookCode||null,reason:payload?.projection?.reason||null}));
 return {command,exitCode:result.status,result:payload,stderr:result.stderr};
});
fs.writeFileSync('content/knowledge/book-vii/evidence/published-command-probes-v1.json',JSON.stringify({providerCallsAllowed:false,preload:'scripts/lib/report-zero-cost-preload.mjs',publicationCandidatePromoted:false,records},null,2)+'\n');
if(records.some(r=>r.exitCode!==0))process.exit(1);
