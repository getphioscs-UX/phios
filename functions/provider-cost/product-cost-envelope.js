// Latest direct owner limits. Price implementation stays with Commerce's owner.
export const PRODUCT_TOTAL_COST_USD=Object.freeze({
 'COM-REPORT-BAZI-FULL':4,'COM-REPORT-ZIWEI-FULL':3,'COM-REPORT-ASTROLOGY-FULL':3,
 'COM-REPORT-PROFILE-FULL':6,'COM-REPORT-HD-FULL':5,'COM-REPORT-ECR-FULL':6,
 'COM-REPORT-NUMEROLOGY-FULL':2,'COM-REPORT-CROSS-FULL':10,
 'COM-READING-TAROT-FULL':1,'COM-READING-ICHING-FULL':2,
 'COM-REPORT-FINANCIAL-FULL':7,'COM-WILL-WRITING':2
});
const authority='DIRECT_OWNER_COMMERCIAL_AMENDMENT_2026-10-09_INCLUDING_FOUR_ASK';
const fail=code=>{throw Object.assign(new Error(code),{code,status:409});};
const micro=v=>{if(!Number.isFinite(v)||v<=0||v>100)fail('COST_ESTIMATE_INVALID');return Math.ceil(v*1e6);};
const metadata=value=>{const keys=['model','inputTokens','cachedTokens','outputTokens','providerRequests','retryCount','providerRequestId','latencyMs','currency','fxReference','estimateBasis','spendStage','sourceVersion','drawDigest','readingId'];if(!value||typeof value!=='object'||Array.isArray(value)||Object.entries(value).some(([k,v])=>!keys.includes(k)||!(v===null||typeof v==='boolean'||typeof v==='number'&&Number.isFinite(v)||typeof v==='string'&&v.length<=400)))fail('COST_METADATA_INVALID');return JSON.stringify(value);};
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
 const inserted=await db.prepare(`INSERT OR IGNORE INTO provider_product_cost_entries
 (request_id,envelope_id,cost_class,context_id,reserved_micro_usd,state,cost_basis,payload_json,created_at)
 SELECT ?1,a.envelope_id,?4,?5,?6,'RESERVED','CONSERVATIVE_PRECALL_BOUND',?7,?8
 FROM provider_product_cost_envelopes a WHERE a.envelope_id=?2 AND a.owner_account_id=?3
 AND EXISTS(SELECT 1 FROM commerce_purchases p JOIN digital_entitlements e ON e.purchase_id=p.purchase_id WHERE p.purchase_id=a.purchase_id AND p.purchase_state='purchased' AND e.customer_id=a.owner_account_id AND e.product_id=a.product_id AND e.entitlement_status='active' AND (e.expires_at IS NULL OR e.expires_at>?8))
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
