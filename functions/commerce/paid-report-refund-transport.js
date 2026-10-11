import {stripeQaRequest} from './stripe-client.js';
// P8 accepts only an explicit synthetic fetcher in a local environment. P9 must
// explicitly admit and verify a live transport; no default fetch or live switch.
import {requireP9Refund} from '../report-delivery/p9-canary-admission.js';
import {verifyStripeQaAccount} from './stripe-client.js';
export function createPaidReportRefundTransport(env,{fetcher}={}){
 const live=env.STRIPE_ENVIRONMENT==='LIVE';if(typeof fetcher!=='function'||!live&&(!['local','qa','preview'].includes(env.PHIOS_ENVIRONMENT)||env.STRIPE_ENVIRONMENT!=='QA'))throw Error('PAID_REPORT_REFUND_TRANSPORT_NOT_ADMITTED');
 async function authorize(request){if(!live)return;const row=await env.RUNTIME_DB.prepare('SELECT record_json FROM paid_report_jobs WHERE job_id=?').bind(request.jobId).first(),job=row&&JSON.parse(row.record_json);if(!job||job.environment!=='LIVE'||job.productId!=='COM-REPORT-BAZI-FULL'||job.methodCode!=='BZR'||job.purchaseId!==request.purchaseId||!/^REFUND/.test(job.state)||request.refundKey!=='p8-refund:'+job.jobId)throw Error('P9_REFUND_JOB_DENIED');requireP9Refund(env,job.ownerAccountId);const p=await env.RUNTIME_DB.prepare('SELECT * FROM commerce_purchases WHERE purchase_id=? AND customer_id=? AND product_id=?').bind(job.purchaseId,job.ownerAccountId,job.productId).first();if(!p||request.paymentIntentId!==p.stripe_payment_intent_id||request.amountMinor!==p.amount_minor||request.currency!==p.currency)throw Error('P9_REFUND_PURCHASE_DENIED');await verifyStripeQaAccount(env,fetcher);}
 return {
  async execute(request){await authorize(request);const body=new URLSearchParams({payment_intent:request.paymentIntentId,amount:String(request.amountMinor),'metadata[paid_report_refund_key]':request.refundKey});return stripeQaRequest(env,'/refunds',{method:'POST',body,idempotencyKey:request.refundKey,fetcher});},
  async reconcile(request){await authorize(request);const list=await stripeQaRequest(env,'/refunds?payment_intent='+encodeURIComponent(request.paymentIntentId)+'&limit=100',{fetcher});if(list.has_more)throw Error('REFUND_RECONCILIATION_PAGE_INCOMPLETE');const matches=(list.data||[]).filter(r=>r.metadata?.paid_report_refund_key===request.refundKey);if(matches.length>1)throw Error('REFUND_RECONCILIATION_AMBIGUOUS');return matches[0]||null;}
 };
}
