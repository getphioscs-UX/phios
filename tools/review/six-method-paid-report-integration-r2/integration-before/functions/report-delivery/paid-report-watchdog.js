import {sharedPaidReportCore,ensureVerifiedPaidReportJob} from './paid-report-delivery-core.js';
import {paidReportStateStore} from './paid-report-state-store.js';
export const PAID_REPORT_WATCHDOG_VERSION='P8-WATCHDOG-1';
// Trusted server scheduler port. P8 has no scheduled deployment trigger; P9 must
// supply authenticated server contexts, never accept a client-selected owner.
export async function sweepPaidReports(env,{contextForOwner,clock=Date.now,registry,refundTransport,observe,eligible=()=>true,eligibleOrder=()=>true}={}){
 if(typeof contextForOwner!=='function')throw Error('WATCHDOG_SERVER_CONTEXT_REQUIRED');
 // Reconcile a process death after payment persistence but before job insertion.
 const paid=(await env.RUNTIME_DB.prepare("SELECT o.* FROM commerce_checkout_attempts o JOIN commerce_purchases p ON p.checkout_attempt_id=o.checkout_attempt_id WHERE p.purchase_state='purchased' AND o.order_state='FULFILLED' AND o.context_json LIKE '%reportIntentId%' AND NOT EXISTS(SELECT 1 FROM paid_report_jobs j WHERE j.purchase_id=p.purchase_id)").all()).results;
 for(const order of paid)if(eligibleOrder(order))await ensureVerifiedPaidReportJob(env,order,{registry,clock});
 const jobs=await paidReportStateStore(env,clock).due(),out=[];
 for(const job of jobs){if(!eligible(job))continue;const context=await contextForOwner(job.ownerAccountId);const core=sharedPaidReportCore(context,{clock,registry,refundTransport,observe});try{out.push(await core.work(job.jobId));}catch(error){if(error.code!=='JOB_ALREADY_CLAIMED')throw error;}}
 await paidReportStateStore(env,clock).pruneReadiness();return out;
}
