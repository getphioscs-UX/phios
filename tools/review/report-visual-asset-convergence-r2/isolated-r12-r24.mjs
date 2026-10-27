import fs from 'node:fs';import cp from 'node:child_process';
const d='tools/review/report-visual-asset-convergence-r2/recovery-r24/',old='tools/review/personal-evidence-r1/commerce-r1-2/';fs.mkdirSync(d+'r12-regression/',{recursive:true});
const tmp=old+'.r24-isolated-test.mjs';if(fs.existsSync(tmp))throw Error('TEMP_PATH_ALREADY_EXISTS');
const code=fs.readFileSync(old+'test.mjs','utf8').replace("const d='"+old+"'","const d='"+d+"r12-regression/'");fs.writeFileSync(tmp,code);
try{const r=cp.spawnSync(process.execPath,['--import','./scripts/lib/pages-json-import-preload.mjs',tmp],{encoding:'utf8',maxBuffer:8e6});fs.writeFileSync(d+'r12-regression.log',(r.stdout||'')+'\n'+(r.stderr||''));fs.writeFileSync(d+'r12-regression-command.json',JSON.stringify({command:'node --import ./scripts/lib/pages-json-import-preload.mjs '+tmp,exitCode:r.status,outputIsolation:'Only const output directory changed; original test and historical outputs are not written'},null,2));console.log(r.stdout,r.stderr);process.exitCode=r.status;}finally{fs.unlinkSync(tmp);}

