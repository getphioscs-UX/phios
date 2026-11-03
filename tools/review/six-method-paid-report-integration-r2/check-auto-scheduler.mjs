import fs from'node:fs';import assert from'node:assert/strict';
import{qaCoreEnvironment,qaMockAdapter,seedQaPaidJob}from'../../../scripts/lib/p8-shared-core-qa.mjs';
import{runSandboxPaidReportTick}from'../../../functions/report-delivery/paid-report-watchdog.js';
const root='C:/phios/tools/review/six-method-paid-report-integration-r2',qa=qaCoreEnvironment(root+'/scheduler-'+Date.now(),{fresh:true,clock:()=>now});let now=1000000,network=0;globalThis.fetch=()=>{network++;throw Error('ZERO_COST_NETWORK_FORBIDDEN');};
const products={BZR:'BAZI',ZWR:'ZIWEI',AST:'ASTROLOGY',NUM:'NUMEROLOGY',HD:'HD',ECR:'ECR'},registry={},jobs=[],rows=[];
try{
for(const[method,product]of Object.entries(products)){const adapter=qaMockAdapter(qa,{code:method});adapter.productId='COM-REPORT-'+product+'-FULL';registry[method]=adapter;const seeded=await seedQaPaidJob(qa,adapter,{owner:'SYNTHETIC-SCHEDULER-'+method,job:true});jobs.push(seeded.job);}
assert.equal((await runSandboxPaidReportTick(qa.env,{registry,clock:()=>now})).state,'SAFE_NO_OP');rows.push({name:'default disabled',passed:true});
await assert.rejects(runSandboxPaidReportTick({...qa.env,PHIOS_ENVIRONMENT:'production',PHIOS_QA_PAID_REPORT_WATCHDOG_ENABLED:'true'},{registry}),/QA_REPORT_WATCHDOG_ENVIRONMENT_REQUIRED/);rows.push({name:'production environment denied',passed:true});
now+=60001;qa.env.PHIOS_QA_PAID_REPORT_WATCHDOG_ENABLED='true';let ticks=0;
// An isolated event-loop trigger starts the due scanner without per-job work()
// calls. Cloud cron and native method/PDF execution remain separate gates.
await new Promise((resolve,reject)=>{const timer=setInterval(()=>{clearInterval(timer);ticks++;runSandboxPaidReportTick(qa.env,{registry,clock:()=>now}).then(result=>{try{assert.equal(result.scanned,6);resolve();}catch(e){reject(e);}},reject);},20);});
for(const job of jobs){const row=qa.sql.prepare('SELECT state FROM paid_report_jobs WHERE job_id=?').get(job.jobId);assert.equal(row.state,'DELIVERED');rows.push({name:job.methodCode+' automatic orchestration fixture',passed:true,jobId:job.jobId,scope:'QA mock lifecycle; not native report/PDF acceptance'});}
assert.equal((await runSandboxPaidReportTick(qa.env,{registry,clock:()=>now})).scanned,0);assert.equal(qa.sql.prepare('SELECT count(*) n FROM qa_mock_invocations').get().n,6);rows.push({name:'duplicate tick does not regenerate',passed:true});
assert.equal(network,0);fs.writeFileSync(root+'/AUTOMATIC-SCHEDULER-QA.json',JSON.stringify({status:'PASS_LOCAL_AUTOMATIC_ORCHESTRATION_ONLY',rows,ticks,providerCalls:0,providerCostUsd:0,networkCalls:0,nativeMethodExecution:false,pdfGeneration:false,cloudCronVerified:false,stripeWebhookVerified:false,scope:'Six method identities and independent seeded purchases; fixture adapters injected server-side, no production admission granted'},null,2));console.log(rows.length+' targeted scheduler checks passed');
}finally{qa.sql.close();}
