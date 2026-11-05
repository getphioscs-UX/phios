const fs=require('fs'),w=process.cwd(),d=w+'/tools/review/six-method-paid-report-integration-r2';
let s=fs.readFileSync(d+'/check-num-r30-same-order.mjs','utf8').split('try {\n const s=await seed')[0];
s=s.replace("import fs from'node:fs';", "import{saveCanonicalPerson}from'../../../functions/account/canonical-person-store.js';import{onRequest as accountApi}from'../../../functions/api/account-method-reports.js';import{PAID_REPORT_METHODS}from'../../../functions/report-delivery/paid-report-method-registry.js';import fs from'node:fs';");
s=s.replace("qa=qaCoreEnvironment(root,{fresh:true}),subjects", "qa=qaCoreEnvironment(root,{fresh:true}),subjects");
s=s.replace("let now=Date.now(),serial=0;", "qa.env.CANONICAL_PERSON_ENCRYPTION_KEY=randomBytes(32).toString('hex');let now=Date.now(),serial=0;let networkCalls=0;globalThis.fetch=async()=>{networkCalls++;throw Error('NETWORK_FORBIDDEN');};");
s=s.replace("personId='SYNTHETIC-PERSON-'+n,subject=", "personRecord=await saveCanonicalPerson(qa.ctx(owner),{action:'save',expectedVersion:0,name:snapshot.expansionInput.identityInput.fullBirthName,birth:{birthDate:snapshot.canonicalInput.birthDate,birthTime:snapshot.canonicalInput.birthTime,birthPlace:snapshot.canonicalInput.birthPlace,timezone:{iana:snapshot.canonicalInput.timezone.iana,utcOffsetAtBirth:snapshot.canonicalInput.timezone.utcOffsetAtBirth},timeAccuracy:snapshot.canonicalInput.timeAccuracy},locale:'en',consent:{personalMethod:true,report:true,saveBirthInput:true},expiresAt:new Date(Date.now()+86400000).toISOString()}),personId=personRecord.personId,subject=");
s+=`
try {
 const s=await seed('A','en');now+=60001;qa.env.PHIOS_QA_PAID_REPORT_WATCHDOG_ENABLED='true';
 await new Promise((resolve,reject)=>setTimeout(()=>runSandboxPaidReportTick(qa.env,{registry:s.registry,clock}).then(resolve,reject),10));
 const done=await sharedPaidReportCore(s.context,{registry:s.registry,clock}).store.job(s.job.jobId,s.job.ownerAccountId);assert.equal(done.state,'DELIVERED',JSON.stringify(done.lastFailure));
 const api=async(owner=s.job.ownerAccountId,query='')=>accountApi({...qa.ctx(owner),request:new Request('https://local.invalid/api/account-method-reports'+query)});
 const list=await api(),library=await list.json();assert.equal(list.status,200);assert(library.reports.some(r=>r.reportId===done.reportId&&r.status==='LOCAL_QA_CANDIDATE'));
 const get=async()=>{const r=await api(undefined,'?reportId='+done.reportId+'&format=pdf');assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'application/pdf');const bytes=Buffer.from(await r.arrayBuffer());assert.equal(r.headers.get('content-length'),String(bytes.length));assert.equal(createHash('sha256').update(bytes).digest('hex'),done.output.outputDigest);return bytes;};
 const first=await get(),second=await get();assert(first.equals(second));
 const reopen=await api(undefined,'?reportId='+done.reportId);assert.equal(reopen.status,200);assert.equal((await reopen.json()).report.reportId,done.reportId);
 const negatives=[];async function denied(name,owner){const r=await api(owner,'?reportId='+done.reportId+'&format=pdf');assert.notEqual(r.status,200,name);negatives.push({name,status:r.status});}
 await denied('wrong account','wrong-account');
 qa.sql.prepare("UPDATE digital_entitlements SET entitlement_status='revoked' WHERE purchase_id=?").run(done.purchaseId);await denied('revoked entitlement');qa.sql.prepare("UPDATE digital_entitlements SET entitlement_status='active' WHERE purchase_id=?").run(done.purchaseId);
 const saved=qa.sql.prepare('SELECT record_json FROM paid_report_jobs WHERE job_id=?').get(done.jobId).record_json;
 const changed=JSON.parse(saved);changed.purchaseId='wrong-purchase';qa.sql.prepare('UPDATE paid_report_jobs SET record_json=? WHERE job_id=?').run(JSON.stringify(changed),done.jobId);await denied('receipt purchase mismatch');qa.sql.prepare('UPDATE paid_report_jobs SET record_json=? WHERE job_id=?').run(saved,done.jobId);
 const metadataKey='num-r30/'+done.jobId+'/material',metadata=await(await qa.env.PRIVATE_REPORTS.get(metadataKey)).json();await qa.env.PRIVATE_REPORTS.put(metadataKey,JSON.stringify({...metadata,entitlementId:'wrong-entitlement'}));await denied('immutable entitlement receipt mismatch');await qa.env.PRIVATE_REPORTS.put(metadataKey,JSON.stringify(metadata));
 assert.equal(PAID_REPORT_METHODS.NUM.p8Admitted,false);assert.equal((await runSandboxPaidReportTick(qa.env,{registry:s.registry,clock})).scanned,0);
 await saveCanonicalPerson(s.context,{action:'revoke',personId:done.personId,expectedVersion:1});await denied('Subject consent revoked');assert.equal(networkCalls,0);
 const result={status:'LOCAL_TECHNICAL_PASS',scope:'One local seeded QA purchase -> actual native NUM calculation -> source-bound historical R30 PDF -> automatic shared Scheduler -> private material -> existing native Account API. No signed Stripe webhook or fresh AI/PDF rendering. Historical QA subject and content only.',purchaseId:done.purchaseId,jobId:done.jobId,personId:done.personId,reportId:done.reportId,artifactRef:done.output.artifactRef,sha256:done.output.outputDigest,entitlementId:metadata.entitlementId,pdfBytes:first.length,nativeAccountApiVerified:true,canonicalProfileAndCurrentConsentVerified:true,redownloadEqual:true,reopen:true,coldProcessReopen:false,negatives,p8Admitted:false,providerCalls:0,providerCostUsd:0,networkCalls,newPdfRenders:0,cloudVerified:false,events};
 fs.writeFileSync('C:/phios/tools/review/six-method-paid-report-integration-r2/NUM-R30-NATIVE-ACCOUNT-QA.json',JSON.stringify(result,null,2));console.log(JSON.stringify({status:result.status,bytes:first.length,negatives:negatives.length,providerCalls:0}));
}finally{qa.sql.close();}
`;
fs.writeFileSync(d+'/check-num-native-account.mjs',s);
require('C:/phios/node_modules/esbuild').buildSync({entryPoints:[d+'/check-num-native-account.mjs'],bundle:true,platform:'node',format:'esm',packages:'external',outfile:d+'/check-num-native-account.bundle.mjs',logLevel:'error'});
