import {stripeQaRequest} from './stripe-client.js';
// P8 accepts only an explicit synthetic fetcher in a local environment. P9 must
// explicitly admit and verify a live transport; no default fetch or live switch.
export function createPaidReportRefundTransport(env,{fetcher}={}){
 if(!['local','qa','preview'].includes(env.PHIOS_ENVIRONMENT)||env.STRIPE_ENVIRONMENT!=='QA'||typeof fetcher!=='function')throw Error('PAID_REPORT_REFUND_TRANSPORT_NOT_ADMITTED');
 return {
  async execute(request){const body=new URLSearchParams({payment_intent:request.paymentIntentId,amount:String(request.amountMinor),'metadata[paid_report_refund_key]':request.refundKey});return stripeQaRequest(env,'/refunds',{method:'POST',body,idempotencyKey:request.refundKey,fetcher});},
  async reconcile(request){const list=await stripeQaRequest(env,'/refunds?payment_intent='+encodeURIComponent(request.paymentIntentId)+'&limit=100',{fetcher});if(list.has_more)throw Error('REFUND_RECONCILIATION_PAGE_INCOMPLETE');const matches=(list.data||[]).filter(r=>r.metadata?.paid_report_refund_key===request.refundKey);if(matches.length>1)throw Error('REFUND_RECONCILIATION_AMBIGUOUS');return matches[0]||null;}
 };
}
