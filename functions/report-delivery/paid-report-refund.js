import {paidReportError,PAID_REPORT_POLICY} from './paid-report-policy.js';
export async function runPaidReportRefund({store,job,adapter,context,transport}){
 if(!['REFUND_REQUIRED','REFUND_PENDING','REFUND_RECONCILIATION_REQUIRED'].includes(job.state))throw paidReportError('REFUND_STATE_NOT_ADMITTED');
 if(await adapter.reconcile(context,job))throw paidReportError('DELIVERED_MATERIAL_REFUND_FORBIDDEN');
 const db=store.db,p=await db.prepare("SELECT p.*,o.environment,o.customer_id AS order_owner,o.review_required FROM commerce_purchases p JOIN commerce_checkout_attempts o ON o.checkout_attempt_id=p.checkout_attempt_id WHERE p.purchase_id=? AND p.customer_id=? AND p.product_id=? AND p.purchase_state IN ('purchased','refunded') AND o.checkout_attempt_id=?").bind(job.purchaseId,job.ownerAccountId,job.productId,job.orderId).first();
 if(!p||p.order_owner!==job.ownerAccountId||p.environment!==job.environment||p.review_required||!/^pi_/.test(p.stripe_payment_intent_id||'')||p.currency!=='MYR'||!Number.isSafeInteger(p.amount_minor)||p.amount_minor<=0)throw paidReportError('REFUND_PURCHASE_AUTHORITY_REQUIRED');
 const refundKey='p8-refund:'+job.jobId,request={refundKey,jobId:job.jobId,purchaseId:job.purchaseId,paymentIntentId:p.stripe_payment_intent_id,amountMinor:p.amount_minor,currency:p.currency};
 let row=await db.prepare('SELECT * FROM paid_report_refunds WHERE job_id=?').bind(job.jobId).first();
 if(row?.state==='REFUNDED'){const saved=JSON.parse(row.record_json),v=saved.response;if(v?.status!=='succeeded'||v.payment_intent!==p.stripe_payment_intent_id||v.amount!==p.amount_minor||v.currency!=='myr'||v.id!==row.stripe_refund_id||p.refunded_amount_minor!==p.amount_minor)throw paidReportError('REFUND_PERSISTED_RECEIPT_INVALID');const done=await store.update(job,{state:'REFUNDED',refundId:v.id,dueAt:store.clock()});await store.resolveIncidents(done);return done;}
 if(p.refunded_amount_minor)throw paidReportError('REFUND_PURCHASE_AUTHORITY_REQUIRED');
 if(!row){if(job.state!=='REFUND_REQUIRED')throw paidReportError('REFUND_INTENT_REQUIRED');await db.prepare("INSERT INTO paid_report_refunds VALUES(?,?,?,'REFUND_PENDING',?,NULL,?)").bind(refundKey,job.jobId,job.purchaseId,JSON.stringify(request),store.clock()).run();row=await db.prepare('SELECT * FROM paid_report_refunds WHERE job_id=?').bind(job.jobId).first();job=await store.update(job,{state:'REFUND_PENDING',dueAt:store.clock()+PAID_REPORT_POLICY.refundLease});}
 if(job.state==='REFUND_REQUIRED')job=await store.update(job,{state:'REFUND_PENDING',dueAt:store.clock()+PAID_REPORT_POLICY.refundLease});
 const saved=JSON.parse(row.record_json);for(const k of ['refundKey','paymentIntentId','amountMinor','currency'])if(saved[k]!==request[k])throw paidReportError('REFUND_IDENTITY_MISMATCH');
 if(!transport?.execute||!transport?.reconcile){await store.incident(job,'REFUND_FAILURE','REFUND_TRANSPORT_UNAVAILABLE');return store.update(job,{state:'REFUND_RECONCILIATION_REQUIRED',dueAt:store.clock()+PAID_REPORT_POLICY.refundLease});}
 let response;
 try{
  // A persisted intent means execute might already have happened. Query first;
  // unknown outcomes never silently mint another refund request.
  if(row.stripe_refund_id||row.state==='REFUND_RECONCILIATION_REQUIRED'||job.refundSubmitted)response=await transport.reconcile(request);
  else{job=await store.update(job,{refundSubmitted:true});response=await transport.execute(request);}
  if(!response||response.status!=='succeeded')throw paidReportError('REFUND_RECONCILIATION_REQUIRED');
  if(!/^re_/.test(response.id||'')||response.payment_intent!==request.paymentIntentId||response.amount!==request.amountMinor||response.currency!=='myr'||response.livemode!==false)throw paidReportError('REFUND_RESPONSE_IDENTITY_MISMATCH');
 }catch(error){await db.prepare("UPDATE paid_report_refunds SET state='REFUND_RECONCILIATION_REQUIRED',updated_at=? WHERE refund_key=?").bind(store.clock(),refundKey).run();await store.incident(job,'REFUND_FAILURE',error.code||error.message);return store.update(job,{state:'REFUND_RECONCILIATION_REQUIRED',dueAt:store.clock()+PAID_REPORT_POLICY.refundLease});}
 // Financial state and job terminal truth advance together only after matching
 // server response. Replay of a refund never re-enters the transport.
 await db.batch([db.prepare("UPDATE paid_report_refunds SET state='REFUNDED',stripe_refund_id=?,record_json=?,updated_at=? WHERE refund_key=?").bind(response.id,JSON.stringify({...request,response}),store.clock(),refundKey),db.prepare("UPDATE commerce_purchases SET purchase_state='refunded',refunded_amount_minor=?,updated_at=? WHERE purchase_id=?").bind(p.amount_minor,new Date(store.clock()).toISOString(),p.purchase_id),db.prepare("UPDATE digital_entitlements SET entitlement_status='refunded' WHERE purchase_id=?").bind(p.purchase_id)]);
 job=await store.update(job,{state:'REFUNDED',refundId:response.id,dueAt:store.clock()});await store.resolveIncidents(job);return job;
}
