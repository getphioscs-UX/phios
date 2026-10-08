import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const dir='content/product-convergence-r1/audits/regression/';fs.mkdirSync(dir,{recursive:true});
const pkg=JSON.parse(fs.readFileSync('package.json')),keys=process.argv.slice(2),results=[];
for(const key of keys){if(!pkg.scripts[key]){results.push({key,status:'NOT_AVAILABLE'});continue;}const result=spawnSync(process.execPath,['scripts/run-zero-cost-regression.mjs',key],{encoding:'utf8',maxBuffer:20*1024*1024});const log=key.replaceAll(':','-')+'.log';fs.writeFileSync(dir+log,(result.stdout||'')+(result.stderr||''));results.push({key,status:result.status===0?'PASS':'FAIL',exitCode:result.status,log:dir+log});fs.writeFileSync(dir+'results.json',JSON.stringify(results,null,2));console.log(key,results.at(-1).status);}
