// R1.2 restriction over the EXISTING credit/provider ledgers. No second balance store.
import {activeContinuitySubscription} from './continuity-quota-d1.js';
const fail=code=>{throw Object.assign(Error(code),{code,status:409});};
export async function membershipBudgetPeriod(env,owner,clock=Date.now){
 const sub=await activeContinuitySubscription(env,owner,null,clock);
 const rows=(await env.RUNTIME_DB.prepare("SELECT DISTINCT billing_period_start,billing_period_end FROM continuity_quota_units WHERE owner_account_id=? AND stripe_subscription_id=? AND grant_kind='INVOICE' AND billing_period_end=?").bind(owner,sub.stripe_subscription_id,sub.current_period_end).all()).results;
 if(rows.length!==1||!Number.isSafeInteger(rows[0].billing_period_start)||rows[0].billing_period_start>Math.floor(clock()/1000))fail('MEMBERSHIP_VERIFIED_BILLING_PERIOD_REQUIRED');
 const overlapping=(await env.RUNTIME_DB.prepare("SELECT DISTINCT billing_period_start,billing_period_end FROM continuity_quota_units WHERE owner_account_id=? AND grant_kind='INVOICE' AND billing_period_start<=? AND billing_period_end>?").bind(owner,Math.floor(clock()/1000),Math.floor(clock()/1000)).all()).results;
 if(overlapping.some(r=>r.billing_period_start!==rows[0].billing_period_start||r.billing_period_end!==rows[0].billing_period_end))fail('MEMBERSHIP_OVERLAPPING_PERIODS_REQUIRE_RECONCILIATION');
 return {start:new Date(rows[0].billing_period_start*1000).toISOString(),end:new Date(sub.current_period_end*1000).toISOString(),subscriptionId:sub.stripe_subscription_id,maximumMicroUSD:3000000};
}
// Embedded in each atomic reservation INSERT. Includes both dispatchers, all
// features/subscriptions and failed-but-metered calls; unmetered liabilities block.
export function membershipPeriodUsage({owner,start,end}){
 return `COALESCE((SELECT SUM(COALESCE(e.measured_micro_usd,t.reserved_micro_usd)) FROM continuity_ask_tasks t LEFT JOIN provider_product_cost_entries e ON e.request_id=t.task_id WHERE t.owner_account_id=${owner} AND t.created_at>=${start} AND t.created_at<${end} AND (t.state NOT IN ('FAILED','COMPLETE') OR e.request_id IS NOT NULL)),0)
 + COALESCE((SELECT SUM(COALESCE(e.measured_micro_usd,e.reserved_micro_usd)) FROM provider_product_cost_entries e JOIN provider_product_cost_envelopes p ON p.envelope_id=e.envelope_id WHERE p.owner_account_id=${owner} AND p.product_id='COM-SUBSCRIPTION-MONTHLY' AND e.created_at>=${start} AND e.created_at<${end} AND NOT EXISTS(SELECT 1 FROM continuity_ask_tasks t WHERE t.task_id=e.request_id)),0)`;
}
export function membershipPeriodPredicate({owner,start,end,bound}){
 return `NOT EXISTS(SELECT 1 FROM provider_product_cost_entries ux JOIN provider_product_cost_envelopes ue ON ue.envelope_id=ux.envelope_id WHERE ue.owner_account_id=${owner} AND ue.product_id='COM-SUBSCRIPTION-MONTHLY' AND ux.state='USAGE_UNKNOWN') AND ${membershipPeriodUsage({owner,start,end})}+${bound}<=3000000`;
}
export async function readMembershipPeriodBudget(env,owner,clock=Date.now){const period=await membershipBudgetPeriod(env,owner,clock);const row=await env.RUNTIME_DB.prepare(`SELECT ${membershipPeriodUsage({owner:'?1',start:'?2',end:'?3'})} AS allocated`).bind(owner,period.start,period.end).first();const unknown=await env.RUNTIME_DB.prepare("SELECT 1 AS blocked FROM provider_product_cost_entries e JOIN provider_product_cost_envelopes p ON p.envelope_id=e.envelope_id WHERE p.owner_account_id=? AND p.product_id='COM-SUBSCRIPTION-MONTHLY' AND e.state='USAGE_UNKNOWN' LIMIT 1").bind(owner).first();return {...period,allocatedMicroUSD:row.allocated,remainingMicroUSD:Math.max(0,3000000-row.allocated),reconciliationRequired:!!unknown};}
