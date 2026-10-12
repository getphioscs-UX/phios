import {activeContinuitySubscription} from './continuity-quota-d1.js';
import {commerceEnvironment} from '../../commerce/commerce-environment.js';
import {readZeroCallOutcome} from './membership-zero-call-outcome.js';
import {admitCreditTask,integerCost,formatCredits} from './continuity-credit-policy.js';
const fail=code=>{throw Object.assign(Error(code),{code,status:409});};
// Existing metered usage is subtracted until it has a corresponding task allocation.
// Account-owned grants survive subscription expiry or replacement. Activation is separate.
export const AVAILABLE_CREDIT_SQL=`SELECT q.*,q.maximum_micro_usd-
 COALESCE((SELECT SUM(COALESCE(a.charged_micro_usd,a.reserved_micro_usd)) FROM continuity_ask_allocations a WHERE a.quota_unit_id=q.quota_unit_id),0)-
 COALESCE((SELECT SUM(COALESCE(x.measured_micro_usd,x.reserved_micro_usd)) FROM provider_product_cost_entries x WHERE json_extract(x.payload_json,'$.quotaUnit')=q.quota_unit_id AND NOT EXISTS(SELECT 1 FROM continuity_ask_tasks t WHERE t.task_id=x.request_id)),0) AS available
 FROM continuity_quota_units q JOIN commerce_purchases p ON p.purchase_id=q.purchase_id JOIN commerce_checkout_attempts o ON o.checkout_attempt_id=p.checkout_attempt_id
 WHERE q.owner_account_id=?1 AND p.customer_id=?1 AND o.customer_id=?1 AND p.purchase_state='purchased' AND o.review_required=0 AND o.environment=?2 AND q.billing_period_start<=?3`;
export async function readCreditBalance(env,ownerAccountId,clock=Date.now){
 const rows=(await env.RUNTIME_DB.prepare(AVAILABLE_CREDIT_SQL+' ORDER BY q.created_at,q.quota_unit_id').bind(ownerAccountId,commerceEnvironment(env),Math.floor(clock()/1000)).all()).results;
 if(rows.some(r=>r.available<0))fail('CREDIT_RECONCILIATION_REQUIRED');
 const micro=rows.reduce((n,r)=>n+r.available,0);integerCost(micro);let active=true;try{await activeContinuitySubscription(env,ownerAccountId,null,clock);}catch(error){if(error.code!=='CONTINUITY_ACTIVE_SUBSCRIPTION_REQUIRED')throw error;active=false;}
 return {availableMicroUSD:micro,credits:formatCredits(micro),active,modelCallsAllowed:active,units:rows};
}
export async function reserveCreditTask(env,{ownerAccountId,taskId,requestDigest,contextDigest,mode,depth,...budget},clock=Date.now){
 if(taskId?.startsWith('ZERO-'))fail('ZERO_TASK_NAMESPACE_RESERVED');
 const maximum=admitCreditTask({mode,depth,...budget});if(!ownerAccountId||!taskId||!requestDigest||!contextDigest)fail('TASK_BINDING_REQUIRED');
 const db=env.RUNTIME_DB,old=await db.prepare('SELECT * FROM continuity_ask_tasks WHERE task_id=?').bind(taskId).first();
 if(old){if(old.owner_account_id!==ownerAccountId||old.request_digest!==requestDigest||old.context_digest!==contextDigest||old.mode!==mode||old.depth!==depth||old.reserved_micro_usd!==maximum)fail('TASK_IDENTITY_CONFLICT');return {task:old,newReservation:false};}
 await activeContinuitySubscription(env,ownerAccountId,null,clock);
 const now=Math.floor(clock()/1000),stamp=new Date(clock()).toISOString(),environment=commerceEnvironment(env),token=crypto.randomUUID();
 const inserted=await db.batch([
 db.prepare(`INSERT OR IGNORE INTO continuity_ask_tasks(task_id,owner_account_id,request_digest,context_digest,reservation_token,mode,depth,reserved_micro_usd,state,created_at)
 SELECT ?4,?1,?5,?6,?11,?7,?8,?9,'RESERVED',?10 WHERE
 EXISTS(SELECT 1 FROM commerce_subscriptions s JOIN commerce_checkout_attempts o ON o.checkout_attempt_id=s.order_id WHERE s.customer_id=?1 AND o.customer_id=?1 AND o.environment=?2 AND o.product_id='COM-SUBSCRIPTION-MONTHLY' AND o.review_required=0 AND s.subscription_status IN ('ACTIVE','CANCEL_AT_PERIOD_END') AND s.paid_until>?3 AND s.current_period_end>?3)
 AND NOT EXISTS(SELECT 1 FROM provider_product_cost_entries x JOIN provider_product_cost_envelopes a ON a.envelope_id=x.envelope_id WHERE a.owner_account_id=?1 AND x.state='USAGE_UNKNOWN')
 AND NOT EXISTS(SELECT 1 FROM (${AVAILABLE_CREDIT_SQL}) WHERE available<0)
 AND (SELECT COALESCE(SUM(MAX(0,available)),0) FROM (${AVAILABLE_CREDIT_SQL}))>=?9`).bind(ownerAccountId,environment,now,taskId,requestDigest,contextDigest,mode,depth,maximum,stamp,token),
 db.prepare(`INSERT OR IGNORE INTO continuity_ask_allocations(task_id,quota_unit_id,reserved_micro_usd)
 WITH balances AS (${AVAILABLE_CREDIT_SQL}), ordered AS(SELECT *,COALESCE(SUM(MAX(0,available)) OVER(ORDER BY created_at,quota_unit_id ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING),0) AS prior FROM balances)
 SELECT ?4,quota_unit_id,MIN(available,?5-prior) FROM ordered WHERE available>0 AND prior<?5 AND EXISTS(SELECT 1 FROM continuity_ask_tasks WHERE task_id=?4 AND owner_account_id=?1 AND reservation_token=?6 AND state='RESERVED')`).bind(ownerAccountId,environment,now,taskId,maximum,token)
 ]);
 const task=await db.prepare('SELECT * FROM continuity_ask_tasks WHERE task_id=? AND owner_account_id=?').bind(taskId,ownerAccountId).first();if(!task)fail('ACTIVE_MEMBERSHIP_OR_BALANCE_REQUIRED');
 if(task.request_digest!==requestDigest||task.context_digest!==contextDigest||task.reserved_micro_usd!==maximum||task.mode!==mode||task.depth!==depth)fail('TASK_IDENTITY_CONFLICT');
 const allocation=await db.prepare('SELECT SUM(reserved_micro_usd) AS total FROM continuity_ask_allocations WHERE task_id=?').bind(taskId).first();if(allocation.total!==maximum)fail('TASK_ALLOCATION_RECONCILIATION_REQUIRED');
 return {task,newReservation:inserted[0].meta?.changes===1};
}
export async function claimCreditTask(env,{ownerAccountId,taskId},clock=Date.now){
 await activeContinuitySubscription(env,ownerAccountId,null,clock);
 const result=await env.RUNTIME_DB.prepare(`UPDATE continuity_ask_tasks SET state='RUNNING' WHERE task_id=?1 AND owner_account_id=?2 AND state='RESERVED' AND NOT EXISTS(SELECT 1 FROM continuity_ask_tasks t WHERE t.owner_account_id=?2 AND t.state='RUNNING') AND EXISTS(SELECT 1 FROM commerce_subscriptions s JOIN commerce_checkout_attempts o ON o.checkout_attempt_id=s.order_id WHERE s.customer_id=?2 AND o.customer_id=?2 AND o.environment=?3 AND o.product_id='COM-SUBSCRIPTION-MONTHLY' AND o.review_required=0 AND s.subscription_status IN ('ACTIVE','CANCEL_AT_PERIOD_END') AND s.paid_until>?4 AND s.current_period_end>?4)`).bind(taskId,ownerAccountId,commerceEnvironment(env),Math.floor(clock()/1000)).run();if(result.meta?.changes!==1)fail('TASK_ALREADY_EXECUTING_OR_FINISHED');
}
export async function finishCreditTask(env,{ownerAccountId,taskId,delivered,actualMicroUSD,answer=null,platformEntry,completionOutcome=null},clock=Date.now){
 // Unknown cost preserves platform liability; no customer delivery releases customer credits.
 const task=await env.RUNTIME_DB.prepare('SELECT * FROM continuity_ask_tasks WHERE task_id=? AND owner_account_id=?').bind(taskId,ownerAccountId).first();if(!task||task.state!=='RUNNING')fail('RUNNING_TASK_REQUIRED');
 const known=actualMicroUSD!==null&&actualMicroUSD!==undefined;if(known)integerCost(actualMicroUSD);
 if(delivered&&(!known||actualMicroUSD>task.reserved_micro_usd||!answer))fail('DELIVERY_COST_OR_ANSWER_NOT_VALIDATED');
 if(!platformEntry?.envelopeId||!platformEntry?.payload)fail('PLATFORM_COST_RECEIPT_REQUIRED');
 if(completionOutcome&&(!known||delivered||completionOutcome.executionState!=='COMPLETE'||completionOutcome.deliverable!==false||!['PARTIAL','SOURCE_INSUFFICIENT','FAILED'].includes(completionOutcome.answerCompleteness)||Object.keys(completionOutcome).some(k=>!['executionState','deliverable','answerCompleteness','reasonCode'].includes(k))))fail('NONDELIVERY_OUTCOME_INVALID');
 const charge=delivered?actualMicroUSD:0,state=delivered||completionOutcome?'COMPLETE':known?'FAILED':'RECONCILIATION',stamp=new Date(clock()).toISOString();
 const row=await env.RUNTIME_DB.prepare('SELECT * FROM provider_product_cost_envelopes WHERE envelope_id=? AND owner_account_id=?').bind(platformEntry.envelopeId,ownerAccountId).first();if(!row)fail('EXISTING_PLATFORM_ENVELOPE_REQUIRED');
 await env.RUNTIME_DB.batch([
 env.RUNTIME_DB.prepare(`INSERT INTO provider_product_cost_entries(request_id,envelope_id,cost_class,context_id,reserved_micro_usd,measured_micro_usd,state,cost_basis,payload_json,created_at) SELECT ?1,?2,'MODEL',?3,?4,?5,?6,?7,?8,?9 WHERE EXISTS(SELECT 1 FROM continuity_ask_tasks WHERE task_id=?1 AND owner_account_id=?10 AND state='RUNNING')`).bind(taskId,row.envelope_id,task.context_digest,task.reserved_micro_usd,known?actualMicroUSD:null,known?'METERED':'USAGE_UNKNOWN',known?'ACTUAL_PROVIDER_AND_TOOL_RECEIPT':'UNKNOWN_USAGE',JSON.stringify(platformEntry.payload),stamp,ownerAccountId),
 env.RUNTIME_DB.prepare(`UPDATE continuity_ask_allocations SET charged_micro_usd=MIN(reserved_micro_usd,MAX(0,?2-COALESCE((SELECT SUM(b.reserved_micro_usd) FROM continuity_ask_allocations b JOIN continuity_quota_units qb ON qb.quota_unit_id=b.quota_unit_id JOIN continuity_quota_units qa ON qa.quota_unit_id=continuity_ask_allocations.quota_unit_id WHERE b.task_id=?1 AND (qb.created_at<qa.created_at OR (qb.created_at=qa.created_at AND qb.quota_unit_id<qa.quota_unit_id))),0))) WHERE task_id=?1`).bind(taskId,charge),
 env.RUNTIME_DB.prepare("UPDATE continuity_ask_tasks SET customer_charge_micro_usd=?,state=?,answer_json=?,completed_at=? WHERE task_id=? AND owner_account_id=? AND state='RUNNING'").bind(charge,state,delivered?JSON.stringify(answer):completionOutcome?JSON.stringify(completionOutcome):null,stamp,taskId,ownerAccountId)
 ]);return {state,customerChargeMicroUSD:charge,platformCostMicroUSD:known?actualMicroUSD:null};
}
export async function readCreditTask(env,{ownerAccountId,taskId}){const task=await env.RUNTIME_DB.prepare('SELECT * FROM continuity_ask_tasks WHERE task_id=? AND owner_account_id=?').bind(taskId,ownerAccountId).first()||await readZeroCallOutcome(env,{ownerAccountId,taskId});if(!task)fail('TASK_NOT_FOUND');return task;}
