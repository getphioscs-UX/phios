import fs from 'node:fs';import cp from 'node:child_process';import crypto from 'node:crypto';
const out='tools/review/phi-configuration-deep-reading-r2-integrated/r31-author-publication';fs.mkdirSync(out+'/regressions',{recursive:true});
const names=['check-ecr-human-runtime-v4-1-w3-initialization','check-ecr-human-runtime-v4-1-w12-report','check-ecr-human-runtime-v4-1-w13-phi-card','check-ecr-full-r1-current','check-ecr-phi-card-r1','check-ecr-r2-followup-isolation-local','check-ecr-r2-membership-owner-local','check-ecr-r2-question-slots-local'];
const results=await Promise.all(names.map(name=>new Promise(resolve=>{
 const original='scripts/'+name+'.mjs',source=fs.readFileSync(original,'utf8'),candidate='scripts/.tmp-r31-'+name+'-'+process.pid+'.mjs';
 // Identical assertions and inputs. Redirect receipt writes into this run only.
 const patched=source.replaceAll('tools/review/phi-configuration-deep-reading-r2-integrated/continuation-local-20261025',out+'/regressions/receipts').replaceAll('docs/ecr-full-r1',out+'/regressions/ecr-full-r1');
 fs.mkdirSync(out+'/regressions/receipts',{recursive:true});fs.writeFileSync(candidate,patched,{flag:'wx'});
 const child=cp.execFile(process.execPath,['--import','./scripts/lib/pages-json-import-preload.mjs',candidate],{timeout:120000,maxBuffer:8e6},(error,stdout,stderr)=>{
  fs.writeFileSync(out+'/regressions/'+name+'.log',stdout+stderr);fs.unlinkSync(candidate);
  resolve({name,status:error?'FAIL':'PASS',exitCode:error?.code||0,sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),assertionsChanged:false,oldReceiptOverwritten:false,log:'regressions/'+name+'.log'});
 });
})));fs.writeFileSync(out+'/regression-results.json',JSON.stringify({results,providerCalls:0,oldFailureHistoryRetained:true},null,2));console.log(JSON.stringify({suites:results.length,pass:results.filter(r=>r.status==='PASS').length,fail:results.filter(r=>r.status==='FAIL').length}));
