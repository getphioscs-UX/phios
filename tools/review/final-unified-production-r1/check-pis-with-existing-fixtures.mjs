import fs from 'node:fs';import path from 'node:path';import {spawnSync,execFileSync} from 'node:child_process';
const wt='C:/phios/.worktrees/final-unified-production-r1',env={...process.env,REPORT_PROVIDER_LIVE_ALLOWED:'false',REPORT_ZERO_COST_REPLAY:'true'},fixtures=[];
for(const key of Object.keys(env))if(/^(OPENAI|ANTHROPIC|DEEPSEEK|GEMINI|GOOGLE_AI|OPENROUTER).*(API_KEY|ACCESS_TOKEN|SECRET)$/.test(key))delete env[key];
for(const script of ['scripts/check-pis-r1-foundation.mjs','scripts/check-pis-r1-presentation.mjs'])for(let n=0;n<20;n++){
 const r=spawnSync(process.execPath,['--import','./scripts/lib/report-zero-cost-preload.mjs','--import','./scripts/lib/pages-json-import-preload.mjs',script],{cwd:wt,env,encoding:'utf8',maxBuffer:4*1024*1024});
 if(r.status===0){console.log(r.stdout.trim());break;}
 const match=(r.stderr||'').match(/ENOENT: no such file or directory, open '([^']+)'/);if(!match){console.error(r.stderr||r.stdout);process.exit(r.status||1);}
 const full=path.resolve(match[1]),relative=path.relative(wt,full).replaceAll('\\','/');if((!relative.startsWith('tools/review/')&&relative!=='artifacts/visual-r2/CHANGED-FILES.json'&&!relative.startsWith('artifacts/visual-r2/before/'))||relative.includes('..')||!/[.](?:m?js|json|html|css|md|txt)$/i.test(relative)||fs.existsSync(full))throw Error('UNEXPECTED_FIXTURE_SCOPE '+relative);
 const bytes=execFileSync('git',['show','HEAD:'+relative],{cwd:wt,maxBuffer:30*1024*1024});fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,bytes,{flag:'wx'});fixtures.push(relative);if(n===19)throw Error('FIXTURE_LIMIT_REACHED');
}
fs.writeFileSync('C:/phios/tools/review/final-unified-production-r1/PIS-FOCUSED-FIXTURES.json',JSON.stringify({fixtures,source:'IMMUTABLE_HEAD_NOT_REGENERATED',status:'PASS'},null,2));
