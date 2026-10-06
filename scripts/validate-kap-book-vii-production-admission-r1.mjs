import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const directory='content/knowledge/book-vii/production-admission/evidence';
const env={...process.env,REPORT_PROVIDER_LIVE_ALLOWED:'false',REPORT_ZERO_COST_REPLAY:'true',NODE_OPTIONS:`${process.env.NODE_OPTIONS||''} --import=${pathToFileURL(path.resolve('scripts/lib/report-zero-cost-preload.mjs')).href}`};
for(const key of Object.keys(env))if(/^(OPENAI|ANTHROPIC|DEEPSEEK|GEMINI|GOOGLE_AI|OPENROUTER).*(API_KEY|ACCESS_TOKEN|SECRET)$/.test(key))delete env[key];
const records=[];
for(const alias of ['check:kap','check:kap-phase18','check:kap-book-vii','check:kap-book-vii-production-admission','check:kap-current','check:pages-build']) {
 const command=`npm run ${alias}`;console.log(`RUN ${command}`);
 const result=spawnSync(command,{shell:true,encoding:'utf8',env,maxBuffer:16*1024*1024});if(result.error)throw result.error;
 const log=`${directory}/${alias.replaceAll(':','-')}.log`;fs.writeFileSync(log,result.stdout+result.stderr);records.push({command,exitCode:result.status,log});console.log(`RESULT ${command}: ${result.status}`);
 if(result.status!==0){console.log(result.stdout.slice(-5000)+result.stderr.slice(-5000));break;}
}
const staticProjectionIncluded=fs.existsSync('.pages-output/content/knowledge/public/successors/book-vii-production-admission-v1/published-projection.json');
const privateLineageExcluded=!fs.existsSync('.pages-output/content/knowledge/book-vii');
const status=records.length===6&&records.every(r=>r.exitCode===0)&&staticProjectionIncluded&&privateLineageExcluded?'PRODUCTION_ADMITTED_LOCAL_VALIDATED':'VALIDATION_FAILED';
const probes=[];
if(status!=='VALIDATION_FAILED')for(const question of ['为什么没有观察到不代表不存在？','如果两个高质量证据互相冲突怎么办？','为什么人工智能越流畅越不能代表越确定？']){
 const command=`npm run knowledge:project:published -- "${question}" --locale=zh-Hans --mode=auto`;
 const result=spawnSync(command,{shell:true,encoding:'utf8',env,maxBuffer:8*1024*1024});if(result.error)throw result.error;
 const payload=JSON.parse(result.stdout.slice(result.stdout.indexOf('{')));probes.push({command,exitCode:result.status,result:payload});
 if(result.status!==0||payload.projection.node?.bookCode!=='BOOK-7')throw Error('PUBLISHED_PROBE_NOT_BOOK_VII');
}
const report={work:'KAP-BOOK-VII-PRODUCTION-ADMISSION-R1',status,records,staticProjectionIncluded,privateLineageExcluded,providerInvocationsAllowed:false,liveDeploymentPerformed:false,publishedCommandProbes:probes};
fs.writeFileSync(`${directory}/validation-summary-v1.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,publishedCommandProbes:probes.map(p=>({command:p.command,exitCode:p.exitCode,nodeCode:p.result.projection.node?.nodeCode,bookCode:p.result.projection.node?.bookCode}))},null,2));
if(status==='VALIDATION_FAILED')process.exit(1);
