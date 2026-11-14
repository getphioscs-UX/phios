import {PAID_REPORT_POLICY,paidReportError} from './paid-report-policy.js';
// Invocation-owned heartbeat over the existing SQL lease. No new queue, timer
// service, identity or persistence authority. Never revive an expired claim.
export async function withPaidReportLeaseHeartbeat({store,job,work,intervalMs=30000}){
 if(typeof store?.renewLease!=='function'||typeof work!=='function'||!Number.isSafeInteger(intervalMs)||intervalMs<1||intervalMs>PAID_REPORT_POLICY.generationLease/3)throw paidReportError('PAID_REPORT_HEARTBEAT_CONFIGURATION');
 let lost=null,pending=null;
 const pulse=()=>{if(lost||pending)return;pending=store.renewLease(job).catch(e=>{lost=e;}).finally(()=>{pending=null;});};
 await store.renewLease(job);const timer=setInterval(pulse,intervalMs);
 try{const value=await work();if(pending)await pending;if(lost)throw lost;await store.assertCurrent(job);return value;}
 finally{clearInterval(timer);if(pending)await pending;}
}
