const fail=code=>{throw Object.assign(new Error(code),{code,status:403});};
export function controlledPurchaseOffer(env,{ownerId,productId,originalAmountMinor,now=Date.now()}){
 if(env.PHIOS_CONTROLLED_PURCHASE_ENABLED!=='true')return null;
 let policy;try{policy=JSON.parse(env.PHIOS_CONTROLLED_PURCHASE_POLICY||'null');}catch{fail('controlled_policy_invalid');}
 if(!policy||!policy.campaignId||policy.ownerId!==ownerId)fail('controlled_owner_denied');
 if(policy.maximumUses!==1||!Number.isFinite(Date.parse(policy.startsAt))||!Number.isFinite(Date.parse(policy.expiresAt))||now<Date.parse(policy.startsAt)||now>=Date.parse(policy.expiresAt)||Date.parse(policy.expiresAt)-Date.parse(policy.startsAt)>7*86400000)fail('controlled_window_invalid');
 const p=policy.products?.[productId];if(!p||!policy.completedProductIds?.includes(productId))fail('controlled_product_not_completed');
 if(!/^coupon_[A-Za-z0-9_-]+$/.test(p.couponId)||p.originalAmountMinor!==originalAmountMinor||!Number.isInteger(p.paidAmountMinor)||p.paidAmountMinor<100||p.paidAmountMinor>=originalAmountMinor)fail('controlled_discount_invalid');
 return Object.freeze({campaignId:policy.campaignId,ownerId,productId,couponId:p.couponId,originalAmountMinor,discountAmountMinor:originalAmountMinor-p.paidAmountMinor,paidAmountMinor:p.paidAmountMinor,currency:'MYR',maximumUses:1,expiresAt:policy.expiresAt,reservationKey:`controlled-purchase/${policy.campaignId}/${ownerId}`,providerCostCapUnchanged:true,followupEntitlementUnchanged:true});
}
export function verifyControlledPayment({offer,ownerId,productId,session,requirePaid=true}){
 if(!offer||offer.ownerId!==ownerId||offer.productId!==productId||(requirePaid&&session.payment_status!=='paid')||session.currency!=='myr'||session.amount_subtotal!==offer.originalAmountMinor||session.amount_total!==offer.paidAmountMinor||session.total_details?.amount_discount!==offer.discountAmountMinor||session.total_details?.amount_tax||session.total_details?.amount_shipping||!session.discounts?.some(x=>(typeof x.coupon==='string'?x.coupon:x.coupon?.id)===offer.couponId))fail('controlled_payment_mismatch');
 return {originalAmountMinor:offer.originalAmountMinor,discountAmountMinor:offer.discountAmountMinor,paidAmountMinor:offer.paidAmountMinor,currency:'MYR'};
}
// Reserved order creation is injected from the existing Commerce owner. The
// unique idempotency_key_hash on commerce_checkout_attempts limits one persisted
// attempt per campaign/account across products; conflict cannot create a new use.
export async function reserveControlledPurchase(offer,{sha256,createOrder},orderInput){
 if(!offer||orderInput.customerId!==offer.ownerId||orderInput.productId!==offer.productId)fail('controlled_reservation_owner_mismatch');
 const idempotencyKeyHash=await sha256(offer.reservationKey),requestHash=await sha256(JSON.stringify({offer,context:orderInput.context}));
 return createOrder({...orderInput,idempotencyKeyHash,requestHash,context:{...orderInput.context,controlledPurchase:offer}});
}

export function controlledOrderOffer(order){let c;try{c=JSON.parse(order.context_json||'{}').controlledPurchase;}catch{fail('controlled_context_invalid');}if(!c)return null;if(c.ownerId!==order.customer_id||c.productId!==order.product_id||c.originalAmountMinor!==order.amount_minor||c.currency!=='MYR'||c.maximumUses!==1||!Number.isInteger(c.paidAmountMinor)||c.paidAmountMinor<100||c.discountAmountMinor!==c.originalAmountMinor-c.paidAmountMinor||!c.couponId||!c.campaignId)fail('controlled_order_invalid');return c;}
