import {paidReportStateStore} from './paid-report-state-store.js';
import {paidReportError} from './paid-report-policy.js';
import {commerceEnvironment} from '../commerce/commerce-environment.js';
// Invoked only by the existing signature-verified Commerce webhook dispatcher.
export async function reconcilePaidReportRefundEvent(env,event,clock=Date.now){
 const db=env.RUNTIME_DB,object=event.data?.object,environment=commerceEnvironment(env);
 if(environment!=='QA'||event.livemode!==false||object?.livemode!==false)throw paidReportError('REFUND_EVENT_ENVIRONMENT_MISMATCH');
 const row=await db.prepare('SELECT * FROM paid_report_refunds WHERE stripe_refund_id=? OR refund_key=?').bind(object.id,object.metadata?.paid_report_refund_key||'').first();if(!row)throw paidReportError('REFUND_EVENT_INTENT_REQUIRED');
 const request=JSON.parse(row.record_json),store=paidReportStateStore(env,clock),jr=await db.prepare('SELECT record_json FROM paid_report_jobs WHERE job_id=?').bind(row.job_id).first(),record=jr&&JSON.parse(jr.record_json),job=record&&await store.job(row.job_id,record.ownerAccountId);
 const p=job&&await db.prepare('SELECT * FROM commerce_purchases WHERE purchase_id=? AND customer_id=? AND product_id=?').bind(job.purchaseId,job.ownerAccountId,job.productId).first();
 if(!p||job.environment!==environment||row.purchase_id!==p.purchase_id||!/^re_/.test(object.id||'')||object.payment_intent!==p.stripe_payment_intent_id||object.payment_intent!==request.paymentIntentId||object.amount!==p.amount_minor||object.amount!==request.amountMinor||object.currency!=='myr'||request.currency!=='MYR'||row.stripe_refund_id&&row.stripe_refund_id!==object.id||object.metadata?.environment&&object.metadata.environment!==environment)throw paidReportError('REFUND_EVENT_IDENTITY_MISMATCH');
 if(!['pending','succeeded','failed','canceled'].includes(object.status))throw paidReportError('REFUND_EVENT_STATUS_INVALID');
 if(row.state==='REFUNDED'){if(job.state!=='REFUNDED'||row.stripe_refund_id!==object.id)throw paidReportError('REFUND_TERMINAL_RECEIPT_MISMATCH');return {status:'replay',jobId:job.jobId};}
 if(job.state==='DELIVERED'||row.state==='CANCELED_DELIVERED')throw paidReportError('REFUND_DELIVERY_CONFLICT');
 if(!/^REFUND/.test(job.state))throw paidReportError('REFUND_EVENT_JOB_STATE_MISMATCH');
 let claimed=await store.claim(job);try{
  const material=await db.prepare('SELECT report_id FROM account_method_report_materials WHERE owner_account_id=? AND person_id=? AND method_code=?').bind(job.ownerAccountId,job.personId,job.methodCode).first();
  if(material){await store.incident(claimed,'REFUND_DELIVERY_CONFLICT','REFUND_DELIVERY_CONFLICT');claimed=await store.update(claimed,{state:'REFUND_RECONCILIATION_REQUIRED',refundDeliveryConflict:true,dueAt:clock()+300000});return {status:'reconciliation_required',jobId:job.jobId};}
  await store.assertCurrent(claimed);const fence='EXISTS(SELECT 1 FROM paid_report_jobs WHERE job_id=? AND owner_account_id=? AND version=? AND claimed_by=? AND lease_expires_at>?)',b=[claimed.jobId,claimed.ownerAccountId,claimed.version,claimed.claimedBy,clock()];
  const succeeded=object.status==='succeeded';const nextState=succeeded?'REFUNDED':'REFUND_RECONCILIATION_REQUIRED';
  const statements=[db.prepare(`UPDATE paid_report_refunds SET state=?,stripe_refund_id=?,record_json=?,updated_at=? WHERE refund_key=? AND ${fence}`).bind(nextState,object.id,JSON.stringify({...request,response:object,lastWebhookEvent:event.id}),clock(),row.refund_key,...b)];
  if(succeeded)statements.push(db.prepare(`UPDATE commerce_purchases SET purchase_state='refunded',refunded_amount_minor=?,updated_at=? WHERE purchase_id=? AND ${fence}`).bind(p.amount_minor,new Date(clock()).toISOString(),p.purchase_id,...b),db.prepare(`UPDATE digital_entitlements SET entitlement_status='refunded' WHERE purchase_id=? AND ${fence}`).bind(p.purchase_id,...b));
  await db.batch(statements);if(!succeeded)await store.incident(claimed,'REFUND_FAILURE','REFUND_'+object.status.toUpperCase());claimed=await store.update(claimed,{state:nextState,refundSubmitted:true,refundId:object.id,dueAt:clock()+300000});if(succeeded)await store.resolveIncidents(claimed);return {status:succeeded?'refunded':'reconciliation_required',jobId:job.jobId};
 }finally{await store.unclaim(claimed);}
}
