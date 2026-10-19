import {validateHistoricalRentalObservation} from './lib/finance-historical-rental-observation.mjs';
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {spawnSync,execFileSync} from 'node:child_process';
const out='docs/financial-preparation/successor-r2',logs='.tmp/finance-successor-validation';fs.mkdirSync(logs,{recursive:true});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),walk=p=>!fs.existsSync(p)?[]:fs.statSync(p).isDirectory()?fs.readdirSync(p).flatMap(n=>walk(p+'/'+n)):[p];
const roots=['functions/account','functions/financial','functions/professional','functions/document-assembly','functions/personal-reading/report-generation-store.js','functions/report-delivery','assets/customer-ui/js/surfaces','assets/customer-ui/surfaces/financial-preparation-r1.css','content/financial','db/migration-candidates','tests/financial-preparation','scripts/lib/customer-report-runtime','scripts/lib/pages-json-import-preload.mjs','scripts/lib/report-zero-cost-preload.mjs','config/reports/zero-cost-check-commands.json'];
roots.push(...fs.readdirSync('functions/api').filter(n=>/financial|professional-financial|account-will/.test(n)).map(n=>'functions/api/'+n));
const snapshot=()=>Object.fromEntries([...new Set(roots.flatMap(walk))].sort().map(p=>[p,hash(fs.readFileSync(p))]));const dependencies=snapshot(),dependencyDigest=hash(JSON.stringify(dependencies)),head=()=>execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const app=walk('tests/financial-preparation').filter(p=>p.endsWith('.test.mjs')&&!p.includes('/reference/')&&!/\/(finance-tools|portfolio-successor|successor-n1-n5)\.test\.mjs$/.test(p));
const commands=[
 ['current-successor',['--test','--test-reporter=tap','tests/financial-preparation/successor-n1-n5.test.mjs'],'REQUIRED'],
 ['preserved-application',['--test','--test-reporter=tap',...app],'REQUIRED'],
 ['preserved-loan-goldens',['--test','--test-reporter=tap','--test-name-pattern=loan|actual payment|extra events|dates preserve|range, missing|area allocation','tests/financial-preparation/finance-tools.test.mjs'],'REQUIRED'],
 ['historical-rental-observation',['--test','--test-reporter=tap','tests/financial-preparation/finance-tools.test.mjs','tests/financial-preparation/portfolio-successor.test.mjs'],'HISTORICAL_EXPECTATION_OBSERVATION'],
 ['reference',['--test','--test-reporter=tap','tests/financial-preparation/reference/jurisdiction-capability-reference.test.mjs'],'REQUIRED'],
 ['report-material-repository-json-compat',['--import','./scripts/lib/report-zero-cost-preload.mjs','--import','./scripts/lib/pages-json-import-preload.mjs','scripts/check-fw-report-material.mjs'],'BASELINE_RECHECK'],
 ['freeze-repository-alias-compat',['scripts/run-financial-freeze-check-compat.mjs','scripts/check-fcr-freeze.mjs','check:fcr'],'REQUIRED'],
 ['privacy',['scripts/check-fw-s1-contract-privacy.mjs'],'REQUIRED'],
 ['functions-compile',['node_modules/wrangler/bin/wrangler.js','pages','functions','build','functions','--outdir','.tmp/finance-successor-functions','--compatibility-date','2026-07-14','--compatibility-flags','nodejs_compat'],'REQUIRED']
];
const file=out+'/VALIDATION.json',previous=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)): {runs:[]},run={startedAt:new Date().toISOString(),startHead:head(),dependencyDigest,results:[]};
for(const [id,args,role]of commands){const prior=previous.runs.flatMap(r=>r.dependencyDigest===dependencyDigest?r.results:[]).reverse().find(r=>r.id===id&&r.exitCode===0);if(prior&&!process.argv.includes('--force')){run.results.push({...prior,reused:true});console.log(id+': REUSED_UNCHANGED_DEPENDENCIES');continue;}
 const result=spawnSync(process.execPath,args,{encoding:'utf8',maxBuffer:10*1024*1024,env:{...process.env,WRANGLER_SEND_METRICS:'false',REPORT_PROVIDER_LIVE_ALLOWED:'false',REPORT_ZERO_COST_REPLAY:'true'}}),text=(result.stdout||'')+(result.stderr||''),log=logs+'/'+id+'-'+Date.now()+'.log';fs.writeFileSync(log,text);
 const historical=role==='HISTORICAL_EXPECTATION_OBSERVATION'?validateHistoricalRentalObservation(text,result.status):null;
 const tests=[...text.matchAll(/^(ok|not ok) \d+ - (.+)$/gm)].map(([,status,name])=>({name,status:name.includes('# SKIP')?'NOT_RUN':status==='ok'?'PASS':'FAIL'}));run.results.push({id,role,command:[process.execPath,...args],exitCode:result.status,...(historical?{historical}:{}),status:result.status===0?'PASS':role==='HISTORICAL_EXPECTATION_OBSERVATION'?(historical.pass?'SUPERSEDED_EXPECTATIONS_RECORDED':'FAIL_UNEXPLAINED_HISTORICAL_CHANGE'):role==='BASELINE_RECHECK'?'BASELINE_FAILURE':'FAIL',log,tests,logSha256:hash(text),failure:result.status===0?null:text.slice(-5000)});console.log(id+': exit='+result.status);
}
run.endHead=head();run.sourceUnchanged=hash(JSON.stringify(snapshot()))===dependencyDigest;run.finishedAt=new Date().toISOString();previous.runs.push(run);previous.dependencies=dependencies;previous.operations={providerCalls:0,costUSD:0,sends:0,payments:0,refunds:0,productionMutations:0,commit:0,push:0,deploy:0};fs.writeFileSync(file,JSON.stringify(previous,null,2)+'\n');
if(!run.sourceUnchanged||run.startHead!==run.endHead||run.results.some(r=>(r.role==='REQUIRED'&&r.exitCode!==0)||(r.historical&&!r.historical.pass)))process.exitCode=1;
