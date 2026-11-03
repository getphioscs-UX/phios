import fs from 'node:fs';import {execFileSync} from 'node:child_process';
const D='C:/phios/tools/review/final-unified-production-r1',wt='C:/phios/.worktrees/final-unified-production-r1',m=JSON.parse(fs.readFileSync(D+'/FINAL-RELEASE-MANIFEST.json')),rows=[];
for(const f of m.currentSource.files.filter(f=>/\.(m?js)$/.test(f.path))){try{execFileSync(process.execPath,['--check',f.path],{cwd:wt,stdio:'pipe'});rows.push({path:f.path,status:'PASS'});}catch(e){rows.push({path:f.path,status:'FAIL',error:String(e.stderr)});}}
fs.writeFileSync(D+'/SYNTAX-INVENTORY.json',JSON.stringify({at:new Date().toISOString(),rows},null,2));console.log(JSON.stringify({checked:rows.length,failed:rows.filter(r=>r.status==='FAIL')}));if(rows.some(r=>r.status==='FAIL'))process.exitCode=1;
