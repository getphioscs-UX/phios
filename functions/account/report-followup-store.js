import {digest} from './oidc-auth.js';
import {reportDeliveryMethod} from '../report-delivery/report-delivery-contract.js';
const fail=(code,status=403)=>{throw Object.assign(new Error(code),{code,status});};
const db=env=>{if(!env?.RUNTIME_DB?.prepare)fail('FOLLOWUP_DATABASE_REQUIRED',503);return env.RUNTIME_DB;};
// Grant is minted only from existing paid Commerce and immutable delivered SQL
// owners. A browser cannot supply an entitlement, allowance or material identity.
export async function grantDeliveredReportFollowups(env,{reportId,ownerAccountId,purchaseId,methodCode},clock=Date.now){
 const productId=reportDeliveryMethod(methodCode)?.commerceProductId;
 if(!productId||!purchaseId||!ownerAccountId)fail('PAID_REPORT_FOLLOWUP_GRANT_REJECTED');
 await db(env).prepare(`INSERT INTO account_report_followup_grants
 (report_id,owner_account_id,purchase_id,product_id,snapshot_id,material_digest,included_questions,granted_at)
 SELECT m.report_id,m.owner_account_id,p.purchase_id,e.product_id,m.snapshot_id,m.output_digest,4,?5
 FROM account_method_report_materials m JOIN digital_entitlements e ON e.customer_id=m.owner_account_id
 JOIN commerce_purchases p ON p.purchase_id=e.purchase_id
 JOIN commerce_checkout_attempts o ON o.checkout_attempt_id=p.checkout_attempt_id
 WHERE m.report_id=?1 AND m.owner_account_id=?2 AND p.purchase_id=?3 AND e.product_id=?4 AND m.method_code=?6
 AND e.entitlement_status='active' AND (e.expires_at IS NULL OR e.expires_at>?5)
 AND p.purchase_state='purchased' AND o.customer_id=m.owner_account_id
 AND o.order_state='FULFILLED' AND o.review_required=0
 ON CONFLICT DO NOTHING`).bind(reportId,ownerAccountId,purchaseId,productId,new Date(clock()).toISOString(),methodCode).run();
 const grant=await db(env).prepare('SELECT * FROM account_report_followup_grants WHERE report_id=? AND owner_account_id=? AND purchase_id=? AND product_id=?').bind(reportId,ownerAccountId,purchaseId,productId).first();
 if(!grant)fail('PAID_REPORT_FOLLOWUP_GRANT_REJECTED');return grant;
}
export async function reserveReportQuestion(env,{ownerAccountId,reportId,requestId,question,consentVersion},clock=Date.now){
 if(!ownerAccountId||!reportId||!/^[-a-zA-Z0-9_]{16,100}$/.test(requestId||'')||typeof question!=='string'||!question.trim()||question.length>2000||!consentVersion)fail('FOLLOWUP_REQUEST_INVALID',400);
 const grant=await db(env).prepare('SELECT * FROM account_report_followup_grants WHERE report_id=? AND owner_account_id=?').bind(reportId,ownerAccountId).first();
 if(!grant)fail('PAID_DELIVERED_REPORT_REQUIRED');
 const questionDigest=await digest(question),lookup=()=>db(env).prepare('SELECT * FROM account_report_followup_questions WHERE request_id=? AND owner_account_id=? AND report_id=?').bind(requestId,ownerAccountId,reportId).first();
 const prior=await lookup();if(prior){if(prior.question_digest!==questionDigest||prior.consent_version!==consentVersion)fail('FOLLOWUP_IDEMPOTENCY_CONFLICT',409);return {row:prior,newReservation:false};}
 const available=await db(env).prepare(`SELECT 1 AS allowed WHERE
 (SELECT COUNT(*) FROM account_report_followup_questions WHERE report_id=?1 AND history_state IN ('RESERVED','COMPLETE') AND included_slot IS NOT NULL)<4
 OR EXISTS(SELECT 1 FROM commerce_subscriptions s JOIN commerce_checkout_attempts o ON o.checkout_attempt_id=s.order_id WHERE s.customer_id=?2 AND o.customer_id=?2 AND o.product_id='COM-SUBSCRIPTION-MONTHLY' AND o.review_required=0 AND s.subscription_status IN ('ACTIVE','CANCEL_AT_PERIOD_END') AND s.paid_until>?3 AND s.current_period_end>?3)`).bind(reportId,ownerAccountId,Math.floor(clock()/1000)).first();
 if(!available)fail('REPORT_QUESTIONS_EXHAUSTED_MEMBERSHIP_REQUIRED',402);
 if(!env.PRIVATE_REPORTS?.put)fail('PRIVATE_FOLLOWUP_STORAGE_REQUIRED',503);
 const key=`report-questions/${await digest(ownerAccountId)}/${requestId}/${questionDigest}.json`;
 await env.PRIVATE_REPORTS.put(key,JSON.stringify({question,consentVersion,sourceClass:'PURCHASED_REPORT_CONTEXT',sourceVersion:grant.snapshot_id}),{httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});
 // One atomic insert picks the first unused slot. The unique partial index is
 // a second concurrency guard; RESERVED consumes capacity until settled.
 const inserted=await db(env).prepare(`INSERT OR IGNORE INTO account_report_followup_questions
 (request_id,owner_account_id,report_id,question_digest,question_object_key,consent_version,source_class,source_version,history_state,included_slot,access_basis,created_at)
 SELECT ?1,?2,?3,?4,?5,?6,'PURCHASED_REPORT_CONTEXT',g.snapshot_id,'RESERVED',
 (SELECT MIN(slot) FROM (SELECT 1 AS slot UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4)
 WHERE slot NOT IN (SELECT included_slot FROM account_report_followup_questions WHERE report_id=?3 AND history_state IN ('RESERVED','COMPLETE') AND included_slot IS NOT NULL)),
 CASE WHEN EXISTS(SELECT 1 FROM account_report_followup_questions WHERE report_id=?3 AND history_state IN ('RESERVED','COMPLETE') AND included_slot=4)
 AND (SELECT COUNT(*) FROM account_report_followup_questions WHERE report_id=?3 AND history_state IN ('RESERVED','COMPLETE') AND included_slot IS NOT NULL)=4
 THEN 'PHIOS_MEMBERSHIP' ELSE 'INCLUDED_REPORT_QUESTION' END,?7
 FROM account_report_followup_grants g WHERE g.report_id=?3 AND g.owner_account_id=?2
 AND ((SELECT COUNT(*) FROM account_report_followup_questions WHERE report_id=?3 AND history_state IN ('RESERVED','COMPLETE') AND included_slot IS NOT NULL)<4
 OR EXISTS(SELECT 1 FROM commerce_subscriptions s JOIN commerce_checkout_attempts o ON o.checkout_attempt_id=s.order_id WHERE s.customer_id=?2 AND o.customer_id=?2 AND o.product_id='COM-SUBSCRIPTION-MONTHLY' AND o.review_required=0 AND s.subscription_status IN ('ACTIVE','CANCEL_AT_PERIOD_END') AND s.paid_until>?8 AND s.current_period_end>?8))`)
 .bind(requestId,ownerAccountId,reportId,questionDigest,key,consentVersion,new Date(clock()).toISOString(),Math.floor(clock()/1000)).run();
 const row=await lookup();if(!row)fail('REPORT_QUESTIONS_EXHAUSTED_MEMBERSHIP_REQUIRED',402);
 if(row.question_digest!==questionDigest||row.consent_version!==consentVersion)fail('FOLLOWUP_IDEMPOTENCY_CONFLICT',409);
 return {row,newReservation:inserted.meta?.changes===1};
}
export async function completeReportQuestion(env,{ownerAccountId,requestId,answer},clock=Date.now){
 const row=await db(env).prepare('SELECT * FROM account_report_followup_questions WHERE request_id=? AND owner_account_id=?').bind(requestId,ownerAccountId).first();
 if(!row||row.history_state!=='RESERVED')fail('FOLLOWUP_RESERVATION_REQUIRED',409);
 if(!answer||typeof answer!=='object')fail('FOLLOWUP_ANSWER_INVALID',422);
 const raw=JSON.stringify(answer),hash=await digest(raw),key=`${row.question_object_key.replace(/\.json$/,'')}/answers/${hash}.json`;
 await env.PRIVATE_REPORTS.put(key,raw,{httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});
 // Immutable first answer; a racing completion cannot replace saved history.
 const result=await db(env).prepare("UPDATE account_report_followup_questions SET answer_object_key=?,answer_digest=?,history_state='COMPLETE',completed_at=? WHERE request_id=? AND owner_account_id=? AND history_state='RESERVED'").bind(key,hash,new Date(clock()).toISOString(),requestId,ownerAccountId).run();
 if(result.meta?.changes!==1)fail('FOLLOWUP_ALREADY_SETTLED',409);
}
export async function failReportQuestion(env,{ownerAccountId,requestId}){
 await db(env).prepare("UPDATE account_report_followup_questions SET history_state='FAILED' WHERE request_id=? AND owner_account_id=? AND history_state='RESERVED'").bind(requestId,ownerAccountId).run();
}
export async function readReportQuestionHistory(env,{ownerAccountId,reportId}){
 if(!ownerAccountId||!reportId)fail('FOLLOWUP_OWNER_REQUIRED');
 const grant=await db(env).prepare('SELECT * FROM account_report_followup_grants WHERE owner_account_id=? AND report_id=?').bind(ownerAccountId,reportId).first();if(!grant)fail('REPORT_UNAVAILABLE',404);
 const rows=(await db(env).prepare('SELECT * FROM account_report_followup_questions WHERE owner_account_id=? AND report_id=? ORDER BY created_at,request_id').bind(ownerAccountId,reportId).all()).results;
 // Reading saved material never depends on current membership status.
 return {grant,rows,includedRemaining:4-rows.filter(r=>r.included_slot!=null&&['RESERVED','COMPLETE'].includes(r.history_state)).length};
}
