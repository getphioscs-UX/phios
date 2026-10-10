// Latest direct owner limits. Price implementation stays with Commerce's owner.
import {COMMERCE_ECONOMICS} from '../pws/commercial/commerce-economics-policy.js';
export const PRODUCT_TOTAL_COST_USD=Object.freeze(Object.fromEntries(Object.values(COMMERCE_ECONOMICS).filter(p=>p.providerCapUsd!==null).map(p=>[p.productId,p.providerCapUsd])));
const authority='DIRECT_OWNER_COMMERCIAL_AMENDMENT_2026-10-09_INCLUDING_FOUR_ASK';
const fail=code=>{throw Object.assign(new Error(code),{code,status:409});};
const micro=v=>{if(!Number.isFinite(v)||v<=0||v>100)fail('COST_ESTIMATE_INVALID');return Math.ceil(v*1e6);};
const metadata=value=>{const keys=['model','inputTokens','cachedTokens','outputTokens','providerRequests','retryCount','providerRequestId','latencyMs','currency','fxReference','estimateBasis','spendStage','sourceVersion','drawDigest','readingId','quotaUnit','billingPeriodStart','billingPeriodEnd','modelCostUSD','toolSearchCostUSD'];if(!value||typeof value!=='object'||Array.isArray(value)||Object.entries(value).some(([k,v])=>!keys.includes(k)||!(v===null||typeof v==='boolean'||typeof v==='number'&&Number.isFinite(v)||typeof v==='string'&&v.length<=400)))fail('COST_METADATA_INVALID');return JSON.stringify(value);};
export async function openProductCostEnvelope(env,{ownerAccountId,purchaseId,productId},clock=Date.now){
 const maximum=PRODUCT_TOTAL_COST_USD[productId];if(!maximum||!ownerAccountId||!purchaseId)fail('PRODUCT_COST_AUTHORITY_REQUIRED');
 const db=env.RUNTIME_DB,id=crypto.randomUUID();
 // Existing Commerce paid identity admits the cost pool, including bundle child
 // entitlements. Neither a client price nor a client budget is accepted.
 await db.prepare(`INSERT INTO provider_product_cost_envelopes
 (envelope_id,owner_account_id,purchase_id,product_id,maximum_cost_micro_usd,authority_version,created_at)
 SELECT ?1,?2,?3,?4,?5,?6,?7 FROM commerce_purchases p
 JOIN commerce_checkout_attempts o ON o.checkout_attempt_id=p.checkout_attempt_id
 JOIN digital_entitlements e ON e.purchase_id=p.purchase_id
 WHERE p.purchase_id=?3 AND p.purchase_state='purchased' AND o.customer_id=?2
 AND o.review_required=0 AND o.order_state IN ('PAID','FULFILLMENT_PENDING','FULFILLED')
 AND e.customer_id=?2 AND e.product_id=?4 AND e.entitlement_status='active'
 AND (e.expires_at IS NULL OR e.expires_at>?7) ON CONFLICT DO NOTHING`).bind(id,ownerAccountId,purchaseId,productId,micro(maximum),authority,new Date(clock()).toISOString()).run();
 const row=await db.prepare('SELECT * FROM provider_product_cost_envelopes WHERE owner_account_id=? AND purchase_id=? AND product_id=?').bind(ownerAccountId,purchaseId,productId).first();
 if(!row)fail('PAID_PRODUCT_COST_ENVELOPE_REQUIRED');return row;
}
export async function reserveProductCost(env,{ownerAccountId,envelopeId,requestId,contextId,costClass,conservativeMaximumUSD,payload={}},clock=Date.now){
 if(!requestId||!contextId||!['MODEL','PAYMENT','INFRASTRUCTURE'].includes(costClass))fail('COST_REQUEST_INVALID');
 const db=env.RUNTIME_DB,bound=micro(conservativeMaximumUSD),json=metadata(payload);
 const prior=await db.prepare('SELECT x.* FROM provider_product_cost_entries x JOIN provider_product_cost_envelopes a ON a.envelope_id=x.envelope_id WHERE x.request_id=? AND a.owner_account_id=? AND a.envelope_id=?').bind(requestId,ownerAccountId,envelopeId).first();
 if(prior){if(prior.context_id!==contextId||prior.cost_class!==costClass||prior.reserved_micro_usd!==bound||prior.payload_json!==json)fail('COST_REQUEST_CONFLICT');return {entry:prior,newReservation:false};}
 // Atomic SUM + insert prevents concurrent report/Ask/payment reservations from
 // collectively exceeding the one complete-product pool. Unknown usage stops it.
 const envelope=await db.prepare('SELECT product_id FROM provider_product_cost_envelopes WHERE envelope_id=? AND owner_account_id=?').bind(envelopeId,ownerAccountId).first();
 const continuity=envelope?.product_id==='COM-SUBSCRIPTION-MONTHLY';
 const inserted=await db.prepare(`INSERT OR IGNORE INTO provider_product_cost_entries
 (request_id,envelope_id,cost_class,context_id,reserved_micro_usd,state,cost_basis,payload_json,created_at)
 SELECT ?1,a.envelope_id,?4,?5,?6,'RESERVED','CONSERVATIVE_PRECALL_BOUND',?7,?8
 FROM provider_product_cost_envelopes a WHERE a.envelope_id=?2 AND a.owner_account_id=?3
 AND ${continuity?`EXISTS(
 SELECT 1 FROM continuity_quota_units q JOIN commerce_subscriptions s ON s.stripe_subscription_id=q.stripe_subscription_id JOIN commerce_checkout_attempts o ON o.checkout_attempt_id=s.order_id JOIN commerce_purchases qp ON qp.purchase_id=q.purchase_id JOIN commerce_checkout_attempts qo ON qo.checkout_attempt_id=qp.checkout_attempt_id
 WHERE q.envelope_id=a.envelope_id AND q.owner_account_id=a.owner_account_id AND s.customer_id=a.owner_account_id AND o.customer_id=a.owner_account_id AND o.product_id=a.product_id AND o.review_required=0
 AND s.subscription_status IN ('ACTIVE','CANCEL_AT_PERIOD_END') AND s.paid_until>CAST(strftime('%s',?8) AS INTEGER) AND s.current_period_end>CAST(strftime('%s',?8) AS INTEGER)
 AND q.billing_period_start<=CAST(strftime('%s',?8) AS INTEGER) AND qp.customer_id=a.owner_account_id AND qo.customer_id=a.owner_account_id AND qp.purchase_state='purchased' AND qo.review_required=0 AND qo.environment=o.environment
 AND q.quota_unit_id=json_extract(?7,'$.quotaUnit') AND json_extract(?7,'$.billingPeriodEnd')=s.current_period_end
 AND COALESCE((SELECT SUM(COALESCE(x.measured_micro_usd,x.reserved_micro_usd)) FROM provider_product_cost_entries x WHERE x.envelope_id=a.envelope_id AND json_extract(x.payload_json,'$.quotaUnit')=q.quota_unit_id),0)+?6<=q.maximum_micro_usd)`:`EXISTS(SELECT 1 FROM commerce_purchases p JOIN commerce_checkout_attempts o ON o.checkout_attempt_id=p.checkout_attempt_id JOIN digital_entitlements e ON e.purchase_id=p.purchase_id WHERE p.purchase_id=a.purchase_id AND p.purchase_state='purchased' AND o.customer_id=a.owner_account_id AND o.review_required=0 AND o.order_state IN ('PAID','FULFILLMENT_PENDING','FULFILLED') AND e.customer_id=a.owner_account_id AND e.product_id=a.product_id AND e.entitlement_status='active' AND (e.expires_at IS NULL OR e.expires_at>?8))`}
 AND NOT EXISTS(SELECT 1 FROM provider_product_cost_entries WHERE envelope_id=?2 AND state='USAGE_UNKNOWN')
 AND COALESCE((SELECT SUM(COALESCE(measured_micro_usd,reserved_micro_usd)) FROM provider_product_cost_entries WHERE envelope_id=?2),0)+?6<=a.maximum_cost_micro_usd`)
 .bind(requestId,envelopeId,ownerAccountId,costClass,contextId,bound,json,new Date(clock()).toISOString()).run();
 const entry=await db.prepare('SELECT x.* FROM provider_product_cost_entries x JOIN provider_product_cost_envelopes a ON a.envelope_id=x.envelope_id WHERE x.request_id=? AND x.envelope_id=? AND a.owner_account_id=?').bind(requestId,envelopeId,ownerAccountId).first();
 if(!entry)fail('COMPLETE_PRODUCT_COST_LIMIT_OR_UNKNOWN_USAGE');
 if(entry.context_id!==contextId||entry.cost_class!==costClass||entry.reserved_micro_usd!==bound||entry.payload_json!==json)fail('COST_REQUEST_CONFLICT');
 return {entry,newReservation:inserted.meta?.changes===1};
}
export async function settleProductCost(env,{ownerAccountId,requestId,measuredUSD,costBasis,payload={}}){
 const db=env.RUNTIME_DB;
 const safePayload=metadata(payload);
 const row=await db.prepare('SELECT x.* FROM provider_product_cost_entries x JOIN provider_product_cost_envelopes a ON a.envelope_id=x.envelope_id WHERE x.request_id=? AND a.owner_account_id=?').bind(requestId,ownerAccountId).first();if(!row||row.state!=='RESERVED')fail('COST_RESERVATION_REQUIRED');
 const measured=Number.isFinite(measuredUSD)&&measuredUSD>=0?Math.ceil(measuredUSD*1e6):null;
 const valid=measured!==null&&measured<=row.reserved_micro_usd&&typeof costBasis==='string'&&costBasis.length>0;
 const result=await db.prepare("UPDATE provider_product_cost_entries SET measured_micro_usd=?,state=?,cost_basis=?,payload_json=? WHERE request_id=? AND state='RESERVED'").bind(measured,valid?'METERED':'USAGE_UNKNOWN',valid?costBasis:'UNKNOWN_OR_EXCEEDED_BOUND',safePayload,requestId).run();
 if(result.meta?.changes!==1)fail('COST_ALREADY_SETTLED');
 if(!valid)fail('PRODUCT_COST_USAGE_UNKNOWN_OR_OVER_BOUND');
}
