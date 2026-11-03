import {sharedPaidReportCore,ensureVerifiedPaidReportJob} from './paid-report-delivery-core.js';
import {paidReportStateStore} from './paid-report-state-store.js';
import {PAID_REPORT_METHODS} from './paid-report-method-registry.js';
import {commerceEnvironment} from '../commerce/commerce-environment.js';
export const PAID_REPORT_WATCHDOG_VERSION='P8-WATCHDOG-1';
// Existing scheduled owner, explicit non-production successor. No public API,
// client-selected identity, new queue, or implied method admission.
export async function runSandboxPaidReportTick(env,{registry=PAID_REPORT_METHODS,clock=Date.now,refundTransport,observe}={}){
 if(env.PHIOS_QA_PAID_REPORT_WATCHDOG_ENABLED!=='true')return {state:'SAFE_NO_OP',scanned:0};
 if(!['local','qa','preview'].includes(env.PHIOS_ENVIRONMENT)||commerceEnvironment(env)!=='QA')throw Error('QA_REPORT_WATCHDOG_ENVIRONMENT_REQUIRED');
 if(!env.RUNTIME_DB?.prepare||!env.PRIVATE_REPORTS?.get||!env.PRIVATE_REPORTS?.put)throw Error('QA_REPORT_WATCHDOG_PRIVATE_BINDINGS_REQUIRED');
 const allowed=new Set(['BZR','ZWR','AST','NUM','HD','ECR']);
 const eligible=job=>job.environment==='QA'&&allowed.has(job.methodCode)&&registry[job.methodCode]?.p8Admitted===true&&registry[job.methodCode]?.productId===job.productId;
 const eligibleOrder=order=>order.environment==='QA'&&Object.values(registry).some(a=>allowed.has(a.methodCode)&&a.p8Admitted===true&&a.productId===order.product_id);
 const rows=await sweepPaidReports(env,{registry,clock,refundTransport,observe,eligible,eligibleOrder,contextForOwner:owner=>({env,data:{symbolicAccountIdentity:{userId:owner,providerId:'QA_SERVER_SCHEDULER',verified:true,authenticated:true}},request:new Request('https://paid-report-watchdog.internal/scheduled')})});
 return {state:'SCANNED_QA_ONLY',scanned:rows.length};
}
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
