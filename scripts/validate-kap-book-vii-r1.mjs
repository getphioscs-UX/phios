import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const env={...process.env,REPORT_PROVIDER_LIVE_ALLOWED:'false',REPORT_ZERO_COST_REPLAY:'true',NODE_OPTIONS:`${process.env.NODE_OPTIONS||''} --import=${pathToFileURL(path.resolve('scripts/lib/report-zero-cost-preload.mjs')).href}`};
for(const key of Object.keys(env))if(/^(OPENAI|ANTHROPIC|DEEPSEEK|GEMINI|GOOGLE_AI|OPENROUTER).*(API_KEY|ACCESS_TOKEN|SECRET)$/.test(key))delete env[key];
const directory='content/knowledge/book-vii/evidence';
const records=[];
for(const command of ['npm run check:kap','npm run check:kap-phase18','npm run check:kap-book-vii','npm run check:kap-current','npm run check:pages-build']) {
 console.log(`RUN ${command}`);
 const result=spawnSync(command,{shell:true,encoding:'utf8',env,maxBuffer:16*1024*1024});
 if(result.error)throw result.error;
 const log=`${directory}/${command.split('check:')[1]}-final.log`;
 fs.writeFileSync(log,result.stdout+result.stderr);
 records.push({command,exitCode:result.status,log});
 console.log(`RESULT ${command}: ${result.status}`);
}
const staticPrivateExcluded=!fs.existsSync('.pages-output/content/knowledge/book-vii');
const git=spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'});
const report={status:records.every(r=>r.exitCode===0)&&staticPrivateExcluded?'READY_FOR_HUMAN_REVIEW':'VALIDATION_FAILED',records,aggregateIncludes:['check:kap','check:kap-phase18','check:kap-book-vii'],staticPrivateExcluded,requestedBaseline:'434f3278',validatedHead:git.stdout.trim(),providerRequestsAllowed:false,productionPublished:false,humanAccepted:false};
fs.writeFileSync(`${directory}/validation-summary-v1.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(report.status==='VALIDATION_FAILED')process.exit(1);
