import fs from 'node:fs';import cp from 'node:child_process';
const out='tools/review/phi-configuration-deep-reading-r2-integrated/r31-author-publication',base='tools/review/phi-configuration-deep-reading-r2-integrated/continuation-local-20261025';
const sqlFile='db/migration-candidates/0020_continuity_ask_credit_allocations_successor.sql';
const results=await Promise.all(['check-ecr-r2-followup-isolation-local','check-ecr-r2-membership-owner-local'].map(name=>new Promise(resolve=>{
 const source=fs.readFileSync('scripts/'+name+'.mjs','utf8');
 const anchor=name.includes('membership-owner')?"sql.exec(fs.readFileSync(candidate,'utf8'));":"sql.exec(fs.readFileSync('db/migration-candidates/0018_continuity_quota_units.sql','utf8'));";
 if(!source.includes(anchor))throw Error('SCHEMA_INJECTION_ANCHOR_NOT_FOUND');
 const patched=source.replaceAll(base,out+'/regressions/schema-successor-receipts').replace(anchor,anchor+`sql.exec(fs.readFileSync('${sqlFile}','utf8'));`),file='scripts/.tmp-r31-schema-'+name+'-'+process.pid+'.mjs';
 fs.mkdirSync(out+'/regressions/schema-successor-receipts',{recursive:true});fs.writeFileSync(file,patched,{flag:'wx'});
 cp.execFile(process.execPath,['--import','./scripts/lib/pages-json-import-preload.mjs',file],{timeout:120000,maxBuffer:8e6},(error,stdout,stderr)=>{fs.writeFileSync(out+'/regressions/'+name+'-schema-successor.log',stdout+stderr);fs.unlinkSync(file);resolve({name,status:error?'FAIL':'PASS',exitCode:error?.code||0,changes:'Load existing local candidate SQL in isolated SQLite only; assertions unchanged.',candidateSql:sqlFile,productionMigration:false,originalFailurePreserved:true,log:'regressions/'+name+'-schema-successor.log'});});
})));fs.writeFileSync(out+'/regression-schema-successor-results.json',JSON.stringify({results,providerCalls:0,originalFailuresNotWaived:true},null,2));console.log(JSON.stringify({suites:results.length,pass:results.filter(r=>r.status==='PASS').length,fail:results.filter(r=>r.status==='FAIL').length}));
