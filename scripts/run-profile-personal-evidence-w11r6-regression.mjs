import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
const dir='content/profile/successors/personal-evidence-r1/w11r6/',file=dir+'PRD-W11R6-REGRESSION-RESULTS.json',keys=process.argv.slice(2),results=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)).filter(r=>!keys.includes(r.command)):[];
const guard=pathToFileURL(path.resolve('scripts/lib/w11r6-zero-cost-preload.mjs')).href;
for(const key of keys){
 const timestamp=new Date().toISOString(),args=['scripts/run-zero-cost-regression.mjs',key];if(key==='check:profile:prd-w11r5')args.push('--w11r6');
 const result=spawnSync(process.execPath,args,{encoding:'utf8',maxBuffer:30*1024*1024,env:{...process.env,W11R6_AUDIT_REDIRECT:'true',REPORT_PROVIDER_LIVE_ALLOWED:'false',REPORT_ZERO_COST_REPLAY:'true',NODE_OPTIONS:(process.env.NODE_OPTIONS||'')+' --import='+guard}});
 const log=key.replaceAll(':','-')+'.log';fs.writeFileSync(dir+log,((result.stdout||'')+(result.stderr||'')).replace(/\r\n/g,'\n').replace(/[ \t]+$/gm,''));
 results.push({command:key,startedAt:timestamp,finishedAt:new Date().toISOString(),exitCode:result.status,status:result.status===0?'PASS':'FAIL',log:dir+log});fs.writeFileSync(file,JSON.stringify(results,null,2));console.log(key,results.at(-1).status);
}
