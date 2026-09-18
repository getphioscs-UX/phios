import { normalizeVerifiedSymbolicAccountIdentity } from '../symbolic-method-persistence/symbolic-account-identity-v1.js';
import { commerceProduct, commerceSelection, STRIPE_PRODUCT_REGISTRY, standardBundleProducts } from '../pws/commercial/stripe-product-registry.js';
import { createCommerceOrder, commerceOrder, commerceCustomerBinding, bindCommerceCustomer, attachCommerceCheckout, commerceAccountProjection,ownedCommerceBook,issueDownloadToken } from './book-commerce-store.js';
import { verifyStripeQaAccount, createCanonicalStripeCustomer, createCommerceCheckoutSession, createCommercePortal, requireStripeQa } from './stripe-client.js';
import { sha256Hex } from './commerce-crypto.js';
import { json,commerceError,readJsonBody,localeFrom } from './commerce-http.js';
import {commerceLog} from './commerce-observability.js';

function requireIdentity(context){
  const identity=normalizeVerifiedSymbolicAccountIdentity(context.data?.symbolicAccountIdentity);
  if(!identity) throw Object.assign(new Error('Sign in with your verified PHI OS account.'),{status:401,code:'commerce_authentication_required'});
  return identity.userId;
}
function sameOrigin(request){
  const origin=new URL(request.url).origin;
  if(request.headers.get('origin')!==origin) throw Object.assign(new Error('Same-origin request required.'),{status:403,code:'commerce_origin_invalid'});
  return origin;
}
export async function commerceApi(context,action){
  const {request,env={},fetch:fetcher}=context;
  try{
    if(action==='catalog') return json({success:true,environment:'QA',liveEnabled:false,checkoutAvailable:env.STRIPE_ENVIRONMENT==='QA'&&env.PHIOS_COMMERCE_QA_ENABLED==='true'&&/^(sk|rk)_test_/.test(env.STRIPE_SECRET_KEY||''),products:STRIPE_PRODUCT_REGISTRY.map(({qaPriceId,qaProductId,livePriceId,liveProductId,...p})=>p),eligibleBundleProducts:standardBundleProducts()});
    const customerId=requireIdentity(context);
    if(action==='account') return json({success:true,...await commerceAccountProjection(env,customerId)});
    if(action==='status'){
      const order=await commerceOrder(env,new URL(request.url).searchParams.get('order_id'),customerId);
      if(!order) return json({success:false,code:'order_not_found'},404);
      // Read-only: redirects and polling can never create entitlements.
      return json({success:true,order:{orderId:order.checkout_attempt_id,productId:order.product_id,state:order.order_state,amountMinor:order.amount_minor,currency:order.currency,reviewRequired:Boolean(order.review_required)}});
    }
    const origin=sameOrigin(request);
    if(action==='book-download'){
      const body=await readJsonBody(request),p=commerceProduct(body.productId);
      if(p.category!=='BOOK') return json({success:false,error:'book_required'},422);
      const record=await ownedCommerceBook(env,customerId,p.productId);
      if(!record) return json({success:false,error:'book_access_required'},403);
      if(record.watermark_status!=='ready'||!record.watermarked_object_key) return json({success:false,error:'watermarked_book_not_ready'},409);
      const token=await issueDownloadToken({env,entitlementId:record.entitlement_id});
      return json({success:true,downloadUrl:`/api/book-one-download?token=${encodeURIComponent(token.rawToken)}`,expiresAt:token.expiresAt});
    }
    requireStripeQa(env);
    if(env.PHIOS_COMMERCE_QA_ENABLED!=='true') throw Object.assign(new Error('QA checkout is not enabled.'),{status:503,code:'commerce_qa_gate_closed'});
    const body=await readJsonBody(request);
    if(action==='portal'){
      if(Object.keys(body).some(k=>k!=='locale')) throw Object.assign(new Error('Portal customer is server owned.'),{status:422,code:'portal_input_invalid'});
      const binding=await commerceCustomerBinding(env,customerId);
      if(!binding) return json({success:false,code:'stripe_customer_not_bound'},409);
      await verifyStripeQaAccount(env,fetcher);
      const portal=await createCommercePortal(env,binding.stripe_customer_id,origin,fetcher);
      return json({success:true,url:portal.url});
    }
    const allowed=new Set(['productId','selectedProducts','locale','context','acceptDigitalPolicy']);
    if(Object.keys(body).some(k=>!allowed.has(k))) throw Object.assign(new Error('Only canonical product input is accepted.'),{status:422,code:'checkout_input_invalid'});
    const product=commerceProduct(body.productId), selected=commerceSelection(product.productId,body.selectedProducts||[]);
    if(body.acceptDigitalPolicy!==true) throw Object.assign(new Error('Accept purchase terms.'),{status:422,code:'digital_policy_acceptance_required'});
    const supplied=request.headers.get('idempotency-key')||'';
    if(!/^[A-Za-z0-9._:-]{16,120}$/.test(supplied)) throw Object.assign(new Error('Idempotency key required.'),{status:422,code:'idempotency_key_required'});
    // Context stores only an opaque existing report reference, never raw intake.
    const reference=body.context?.readingId;
    if(body.context&&(Object.keys(body.context).some(k=>k!=='readingId')||typeof reference!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(reference))) throw Object.assign(new Error('Invalid report reference.'),{status:422,code:'checkout_context_invalid'});
    const contextSnapshot=reference?{readingId:reference}:{};
    const requestHash=await sha256Hex(JSON.stringify({productId:product.productId,selected,context:contextSnapshot}));
    const key=await sha256Hex(`COM-STRIPE-R1/QA/${customerId}/${supplied}`);
    const order=await createCommerceOrder({env,customerId,productId:product.productId,selectedProducts:selected,idempotencyKeyHash:key,requestHash,locale:localeFrom(body.locale),context:contextSnapshot});
    if(order.stripe_checkout_url&&order.order_state==='CHECKOUT_CREATED'&&Date.parse(order.expires_at)>Date.now()) return json({success:true,orderId:order.checkout_attempt_id,checkoutUrl:order.stripe_checkout_url,replay:true});
    if(order.order_state!=='PENDING') throw Object.assign(new Error('This checkout attempt is no longer open. Start a new purchase.'),{status:409,code:'checkout_attempt_closed'});
    await verifyStripeQaAccount(env,fetcher);
    let binding=await commerceCustomerBinding(env,customerId);
    if(!binding){
      const customer=await createCanonicalStripeCustomer(env,customerId,await sha256Hex(`COM-STRIPE-R1/customer/${customerId}`),fetcher);
      binding=await bindCommerceCustomer(env,customerId,customer.id);
    }
    const session=await createCommerceCheckoutSession({env,product,order,customerId:binding.stripe_customer_id,origin,locale:order.locale,idempotencyKey:`checkout-${key}`,fetcher});
    if(!/^cs_test_/.test(session.id)||!/^https:\/\/checkout\.stripe\.com\//.test(session.url||'')||!Number.isFinite(session.expires_at)) throw Object.assign(new Error('Invalid QA checkout response.'),{status:502,code:'checkout_response_invalid'});
    await attachCommerceCheckout(env,order,session);
    commerceLog('CHECKOUT_CREATED',{order_id:order.checkout_attempt_id,checkout_session_id:session.id,product_id:product.productId,amount_minor:product.amountMinor,currency:'MYR'});
    return json({success:true,orderId:order.checkout_attempt_id,checkoutUrl:session.url},201);
  }catch(error){return commerceError(error,'commerce_request_failed');}
}
