import fs from 'node:fs';import assert from 'node:assert/strict';
import {baziQa,priorBase} from './lib/p8r1-bazi-qa.mjs';
import {paidReportStateStore} from '../functions/report-delivery/paid-report-state-store.js';
import {paidReportWorkerContext,lockReconciliationWitness} from '../functions/report-delivery/paid-report-worker-fence.js';
import {inspectAccountBaziDeliveryProgress} from '../functions/account/bazi-account-delivery.js';
import {runPaidReportRefund} from '../functions/report-delivery/paid-report-refund.js';
const qa=baziQa('tmp/p8r1-fence-'+Date.now(),{fresh:true});let now=1000000;const clock=()=>now,store=paidReportStateStore(qa.env,clock),rows=[];
const r=qa.db.prepare('SELECT * FROM paid_report_jobs').get(),record=JSON.parse(r.record_json);record.state='GENERATING';qa.db.prepare("UPDATE paid_report_jobs SET state='GENERATING',record_json=?,claimed_by=NULL,lease_expires_at=NULL").run(JSON.stringify(record));
const a=await store.claim(await store.job(record.jobId,record.ownerAccountId)),ca=paidReportWorkerContext(qa.context,a,clock),pa=await inspectAccountBaziDeliveryProgress(ca,a);
await pa.stores.delivery.withLock('fencing',async()=>{
 const x=await pa.stores.delivery.inspectLock();now+=300001;const b=await store.claim(await store.job(a.jobId,a.ownerAccountId)),cb=paidReportWorkerContext(qa.context,b,clock),pb=await inspectAccountBaziDeliveryProgress(cb,b),w=await lockReconciliationWitness(cb.env,pb.stores.delivery.namespace,x);
 for(const [name,action] of [['state',()=>store.update(a,{attempts:999})],['method-state',()=>pa.stores.delivery.put('old-worker','forbidden')],['incident',()=>store.incident(a,'STALE','FORBIDDEN')],['incident-resolution',()=>store.resolveIncidents(a)],['refund',()=>runPaidReportRefund({store,job:a,adapter:{reconcile:()=>{throw Error('SHOULD_NOT_REACH');}},context:ca,transport:{execute:()=>{throw Error('SHOULD_NOT_REACH');}}})]]){await assert.rejects(action,/LEASE_LOST|FENCE_LOST/);rows.push({name,status:'PASS',oldWorkerRejected:true});}
 await assert.rejects(()=>pb.stores.delivery.releaseOrphanedLock({expectedToken:x.lock_token,reconciliationWitness:JSON.parse(JSON.stringify(w))}),/FENCE_LOST/);rows.push({name:'forged-serialized-witness',status:'PASS'});
 await pb.stores.delivery.releaseOrphanedLock({expectedToken:x.lock_token,reconciliationWitness:w});
 await pb.stores.delivery.withLock('race',async()=>{const y=await pb.stores.delivery.inspectLock();assert.notEqual(x.lock_token,y.lock_token);await assert.rejects(()=>pb.stores.delivery.releaseOrphanedLock({expectedToken:x.lock_token,reconciliationWitness:w}),/TOKEN_CHANGED/);assert.equal((await pb.stores.delivery.inspectLock()).lock_token,y.lock_token);rows.push({name:'token-X-versus-token-Y',status:'PASS',newLockPreserved:true});await pb.stores.delivery.put('winner','B');});
 assert.equal((await store.job(a.jobId,a.ownerAccountId)).claimedBy,b.claimedBy);assert.equal(await pa.stores.delivery.inspectState('old-worker'),null);assert.equal(await pb.stores.delivery.inspectState('winner'),'B');await store.unclaim(b);
});
assert.equal(qa.db.prepare('SELECT count(*) n FROM paid_report_refunds').get().n,0);qa.db.close();
fs.writeFileSync(priorBase+'P8R1-WORKER-FENCING.json',JSON.stringify({status:'PASS_LOCAL_TARGETED',rows,materialWriteGate:'Production material INSERT uses atomic job-fence EXISTS; stale actual material-write scenario pending',providerCalls:0,realRefunds:0},null,2));console.log('P8R1 exact-token race and stale worker state/incident/refund gates passed.');
