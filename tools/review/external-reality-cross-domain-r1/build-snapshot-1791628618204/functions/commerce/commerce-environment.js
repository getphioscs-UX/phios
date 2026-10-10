export const STRIPE_LIVE_ACCOUNT='acct_1Pkdz8B2F823WiPt';
export function commerceEnvironment(env={}){return env.STRIPE_ENVIRONMENT==='LIVE'?'LIVE':'QA';}
export function commerceStripeProduct(product,environment){
 if(environment!=='LIVE')return product;
 if(!product.liveProductId||!product.livePriceId)throw Object.assign(Error('Live product binding not configured.'),{status:503,code:'stripe_live_product_unbound'});
 // Existing storage columns retain their historical names; environment is
 // separately bound in the server order, Stripe metadata and webhook checks.
 return {...product,qaProductId:product.liveProductId,qaPriceId:product.livePriceId};
}
export function requireStripeCommerce(env={}){
 const environment=commerceEnvironment(env),live=environment==='LIVE';
 const valid=live?/^(sk|rk)_live_/:/^(sk|rk)_test_/;
 if(!valid.test(env.STRIPE_SECRET_KEY||'')||(live&&env.PHIOS_COMMERCE_LIVE_ENABLED!=='true'))throw Object.assign(Error('Stripe environment is not admitted.'),{status:503,code:live?'stripe_live_gate_closed':'stripe_qa_required'});
 return environment;
}
export function commerceCheckoutAvailable(env={}){
 try{const mode=requireStripeCommerce(env);return mode==='LIVE'?env.PHIOS_COMMERCE_LIVE_ENABLED==='true':env.PHIOS_COMMERCE_QA_ENABLED==='true';}catch{return false;}
}
