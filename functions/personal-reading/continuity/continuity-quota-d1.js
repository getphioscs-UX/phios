import {commerceEnvironment} from '../../commerce/commerce-environment.js';
import {reserveProductCost,settleProductCost} from '../../provider-cost/product-cost-envelope.js';
import {settleProviderUsage} from '../../provider-cost/provider-cost-ledger.js';
import {CONTINUITY_COMMERCIAL_AUTHORITY as authority,continuityModelPreflight} from './continuity-commercial-authority.js';
const fail=code=>{throw Object.assign(Error(code),{code,status:409});};
export async function activeContinuitySubscription(env,ownerAccountId,subscriptionId,clock=Date.now){
 const now=Math.floor(clock()/1000);
 const row=await env.RUNTIME_DB.prepare(`SELECT s.*,o.environment,o.product_id FROM commerce_subscriptions s JOIN commerce_checkout_attempts o ON o.checkout_attempt_id=s.order_id WHERE s.customer_id=?1 AND o.customer_id=?1 AND o.environment=?2 AND o.product_id='COM-SUBSCRIPTION-MONTHLY' AND o.review_required=0 AND s.subscription_status IN ('ACTIVE','CANCEL_AT_PERIOD_END') AND s.paid_until>?3 AND s.current_period_end>?3 AND (?4 IS NULL OR s.stripe_subscription_id=?4) ORDER BY s.current_period_end DESC LIMIT 1`).bind(ownerAccountId,commerceEnvironment(env),now,subscriptionId||null).first();
 if(!row)fail('CONTINUITY_ACTIVE_SUBSCRIPTION_REQUIRED');return row;
}
// Called only after the existing verified webhook has recorded paid subscription
// state or paid refill purchase. The client never receives a grant operation.
export async function grantContinuityQuota(env,{ownerAccountId,subscriptionId,sourceId,kind,purchaseId,periodStart,periodEnd},clock=Date.now){
 if(!['INVOICE','REFILL'].includes(kind)||!sourceId||!Number.isSafeInteger(periodStart)||!Number.isSafeInteger(periodEnd)||periodStart>=periodEnd)fail('CONTINUITY_QUOTA_GRANT_INVALID');
 const sub=await activeContinuitySubscription(env,ownerAccountId,subscriptionId,clock);
 if(periodEnd!==sub.current_period_end||periodEnd>sub.paid_until)fail('CONTINUITY_PERIOD_MISMATCH');
 if(kind==='INVOICE'&&sourceId!==sub.last_invoice_id)fail('CONTINUITY_PAID_INVOICE_REQUIRED');
 const db=env.RUNTIME_DB,basePurchase='pur_'+sub.order_id,envelopeId='CONTINUITY-'+sub.stripe_subscription_id,unitId='CONTQUOTA-'+kind+'-'+sourceId,now=new Date(clock()).toISOString();
 const paid=await db.prepare(`SELECT o.context_json,o.product_id,p.amount_minor FROM commerce_purchases p JOIN commerce_checkout_attempts o ON o.checkout_attempt_id=p.checkout_attempt_id WHERE p.purchase_id=?1 AND p.customer_id=?2 AND o.customer_id=?2 AND o.environment=?3 AND p.purchase_state='purchased' AND o.review_required=0 AND o.order_state IN ('PAID','FULFILLMENT_PENDING','FULFILLED')`).bind(purchaseId,ownerAccountId,commerceEnvironment(env)).first();
 if(!paid||paid.product_id!==authority.productId||paid.amount_minor!==1900)fail('CONTINUITY_PAID_PURCHASE_REQUIRED');
 if(kind==='REFILL'){const target=JSON.parse(paid.context_json||'{}').continuityRefill;if(target?.subscriptionId!==subscriptionId||target.periodStart!==periodStart||target.periodEnd!==periodEnd||sourceId!==purchaseId)fail('CONTINUITY_REFILL_PURCHASE_MISMATCH');}
 await db.batch([
  db.prepare(`INSERT OR IGNORE INTO provider_product_cost_envelopes (envelope_id,owner_account_id,purchase_id,product_id,maximum_cost_micro_usd,authority_version,created_at) VALUES (?1,?2,?3,'COM-SUBSCRIPTION-MONTHLY',3000000,?4,?5)`).bind(envelopeId,ownerAccountId,basePurchase,authority.schemaVersion,now),
  db.prepare(`INSERT OR IGNORE INTO continuity_quota_units (quota_unit_id,envelope_id,owner_account_id,stripe_subscription_id,billing_period_start,billing_period_end,grant_source_id,grant_kind,purchase_id,maximum_micro_usd,created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,3000000,?10)`).bind(unitId,envelopeId,ownerAccountId,subscriptionId,periodStart,periodEnd,sourceId,kind,purchaseId,now),
  db.prepare(`UPDATE provider_product_cost_envelopes SET maximum_cost_micro_usd=(SELECT SUM(maximum_micro_usd) FROM continuity_quota_units WHERE envelope_id=?1) WHERE envelope_id=?1 AND owner_account_id=?2`).bind(envelopeId,ownerAccountId)
 ]);
 return unitId;
}
export async function readContinuityQuota(env,ownerAccountId,clock=Date.now){
 const sub=await activeContinuitySubscription(env,ownerAccountId,null,clock),now=Math.floor(clock()/1000);
 const result=await env.RUNTIME_DB.prepare(`SELECT q.*,COALESCE((SELECT SUM(COALESCE(x.measured_micro_usd,x.reserved_micro_usd)) FROM provider_product_cost_entries x WHERE x.envelope_id=q.envelope_id AND json_extract(x.payload_json,'$.quotaUnit')=q.quota_unit_id),0) AS allocated_micro_usd FROM continuity_quota_units q JOIN commerce_purchases p ON p.purchase_id=q.purchase_id JOIN commerce_checkout_attempts o ON o.checkout_attempt_id=p.checkout_attempt_id WHERE q.owner_account_id=?1 AND q.stripe_subscription_id=?2 AND q.billing_period_start<=?3 AND o.review_required=0 AND p.purchase_state='purchased' ORDER BY q.created_at,q.quota_unit_id`).bind(ownerAccountId,sub.stripe_subscription_id,now).all();
 const currentPeriod=result.results.find(q=>q.grant_kind==='INVOICE'&&q.billing_period_end===sub.current_period_end);
 return {subscriptionId:sub.stripe_subscription_id,billingPeriodStart:currentPeriod?.billing_period_start??null,billingPeriodEnd:sub.current_period_end,units:result.results.map(q=>({...q,remainingMicroUSD:Math.max(0,q.maximum_micro_usd-q.allocated_micro_usd)})),refillLabel:authority.refill.labelEn,refillAmountMinor:1900};
}
export async function invokeContinuityProvider({env,ownerAccountId,requestId,contextId,model,payload,invoke,clock=Date.now}){
 const bound=continuityModelPreflight(model,payload),quota=await readContinuityQuota(env,ownerAccountId,clock);
 if(!requestId||!contextId||typeof invoke!=='function')fail('CONTINUITY_REQUEST_REQUIRED');
 const unit=quota.units.find(q=>q.remainingMicroUSD>=Math.ceil(bound.maximumUSD*1e6));
 if(!unit)fail('CONTINUITY_QUOTA_REFILL_REQUIRED');
 if(!Number.isSafeInteger(quota.billingPeriodStart))fail('CONTINUITY_CURRENT_PAID_PERIOD_REQUIRED');
 const stamp={quotaUnit:unit.quota_unit_id,billingPeriodStart:quota.billingPeriodStart,billingPeriodEnd:quota.billingPeriodEnd,model:model.modelId,spendStage:'CONTINUITY_CONTEXTUAL_FOLLOWUP',toolSearchCostUSD:0};
 const reservation=await reserveProductCost(env,{ownerAccountId,envelopeId:unit.envelope_id,requestId,contextId,costClass:'MODEL',conservativeMaximumUSD:bound.maximumUSD,payload:stamp},clock);
 if(!reservation.newReservation)fail('CONTINUITY_REQUEST_ALREADY_RESERVED');
 let metered=false;
 try{
  const response=await invoke(payload);if(!response.ok)fail('CONTINUITY_PROVIDER_FAILED');const raw=await response.json();
  const actual=settleProviderUsage({model:model.modelId,inputTokenBound:bound.inputTokenBound,outputTokenLimit:model.maxOutputTokens,estimatedMaximumCostUSD:bound.maximumUSD},{usage:raw.usage,model:raw.model,providerRequestId:raw.id,rates:{inputPerMillion:model.inputPricePerMillion,cachedInputPerMillion:model.cachedInputPricePerMillion,outputPerMillion:model.outputPricePerMillion}});
  await settleProductCost(env,{ownerAccountId,requestId,measuredUSD:actual.providerCostUSD,costBasis:actual.costBasis,payload:{...stamp,inputTokens:actual.inputTokens,cachedTokens:actual.cachedTokens,outputTokens:actual.outputTokens,modelCostUSD:actual.providerCostUSD,providerRequests:1,retryCount:0,providerRequestId:raw.id||null}});metered=true;
  return {raw,quotaUnit:unit.quota_unit_id,providerCalls:1};
 }catch(error){if(!metered)await settleProductCost(env,{ownerAccountId,requestId,measuredUSD:NaN,costBasis:'UNKNOWN_USAGE',payload:stamp}).catch(()=>{});throw error;}
}
