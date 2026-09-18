// Successor dispatch of the existing /api/stripe-webhook, not a second endpoint.
import {commerceProduct} from '../pws/commercial/stripe-product-registry.js';
import {commerceOrder,commerceCustomerBinding,fulfillCommerceOrder,setCommercePaymentState,markCommerceReview,finishWebhookEvent,recordCommerceSubscription,refundCommerceOrder,prepareCommerceBookDelivery} from './book-commerce-store.js';
import {dispatchWatermark} from './book-delivery.js';
import {commerceLog} from './commerce-observability.js';
import {retrieveCommerceSession,retrieveCommerceSubscription,requireStripeQa} from './stripe-client.js';
const id=value=>typeof value==='string'?value:value?.id;
const mismatch=()=>Object.assign(new Error('Provider object does not match the canonical order.'),{status:422,code:'commerce_provider_mismatch'});
function assert(condition){if(!condition)throw mismatch();}
async function boundOrder(env,object){
  const metadata=object.metadata||{};
  assert(typeof metadata.order_id==='string'&&/^ord_[A-Za-z0-9]+$/.test(metadata.order_id));
  const order=await commerceOrder(env,metadata.order_id);
  assert(order&&metadata.schema_version==='COM-STRIPE-R1'&&metadata.environment==='QA'&&metadata.customer_id===order.customer_id&&metadata.commerce_product_id===order.product_id);
  const binding=await commerceCustomerBinding(env,order.customer_id);
  assert(binding&&id(object.customer)===binding.stripe_customer_id);
  let product;try{product=commerceProduct(order.product_id);}catch{throw mismatch();}
  assert(order.amount_minor===product.amountMinor&&order.currency==='MYR'&&order.qa_price_id===product.qaPriceId);
  return {order,product};
}
function validateLineItems(lines,product){
  assert(lines?.has_more!==true&&lines?.data?.length===1);
  const line=lines.data[0],price=line.price||line.pricing?.price_details?.price;
  assert(id(price)===product.qaPriceId&&line.quantity===1);
}
export async function processCommerceStripeEvent({env,event,fetcher,origin,clock=Date.now}){
  requireStripeQa(env);
  assert(event.livemode===false&&event.data?.object?.livemode!==true);
  const object=event.data?.object||{};
  let orderId=object.metadata?.order_id;
  try{
    await finishWebhookEvent({env,eventId:event.id,status:'processing',clock});
    if(event.type.startsWith('checkout.session.')){
      await boundOrder(env,object);
      const session=await retrieveCommerceSession(env,object.id,fetcher);
      const {order,product}=await boundOrder(env,session);orderId=order.checkout_attempt_id;
      assert(order.stripe_checkout_session_id===session.id&&session.livemode===false);
      validateLineItems(session.line_items,product);
      assert(session.currency==='myr'&&session.amount_total===product.amountMinor&&session.mode===(product.billingType==='RECURRING'?'subscription':'payment'));
      if(['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type)){
        if(session.payment_status!=='paid') await setCommercePaymentState(env,orderId,'PAYMENT_PROCESSING');
        else{
          // Membership access still requires invoice.paid plus current valid status.
          await fulfillCommerceOrder({env,order,session,clock});
          commerceLog('PAYMENT_CONFIRMED',{order_id:orderId,stripe_event_id:event.id,product_id:product.productId});
          if(product.category==='BOOK'){
            const purchaseId=await prepareCommerceBookDelivery(env,order);
            await dispatchWatermark({env,purchaseId,origin,fetcher,clock});
          }
          if(product.billingType==='RECURRING'){
            const subscription=await retrieveCommerceSubscription(env,id(session.subscription),fetcher);
            await boundOrder(env,subscription);
            await recordCommerceSubscription({env,order,subscription,clock});
          }
        }
      }else if(event.type==='checkout.session.expired') await setCommercePaymentState(env,orderId,'CANCELED');
      else if(event.type==='checkout.session.async_payment_failed') await setCommercePaymentState(env,orderId,'PAYMENT_FAILED');
    }else if(event.type.startsWith('customer.subscription.')||event.type.startsWith('invoice.')){
      const subscriptionId=event.type.startsWith('customer.subscription.')?object.id:id(object.subscription||object.parent?.subscription_details?.subscription);
      const subscription=await retrieveCommerceSubscription(env,subscriptionId,fetcher);
      const {order,product}=await boundOrder(env,subscription);orderId=order.checkout_attempt_id;
      assert(product.billingType==='RECURRING'&&subscription.livemode===false);
      validateLineItems(subscription.items,product);
      let invoice=null;
      if(event.type==='invoice.paid'){
        assert(object.status==='paid'&&object.paid!==false&&object.amount_paid===product.amountMinor&&object.currency==='myr'&&id(object.customer)===id(subscription.customer));
        validateLineItems(object.lines,product);
        assert(Number.isSafeInteger(object.lines.data[0].period?.end));
        invoice=object;
      }
      await recordCommerceSubscription({env,order,subscription,invoice,clock});
      commerceLog('SUBSCRIPTION_UPDATED',{order_id:orderId,stripe_event_id:event.id,status:subscription.status});
    }else if(event.type==='charge.refunded'){
      const refund=await refundCommerceOrder(env,object);
      assert(refund);orderId=refund.orderId;
      commerceLog('REFUND_RECORDED',{order_id:orderId,stripe_event_id:event.id});
    }else if(event.type==='payment_intent.succeeded'){
      // Checkout is the single fulfillment source; a PI cannot double-grant.
      const {order}=await boundOrder(env,object);orderId=order.checkout_attempt_id;
    }else{
      await finishWebhookEvent({env,eventId:event.id,status:'ignored',errorCode:'event_type_not_handled',clock});
      return {status:'ignored'};
    }
    if(orderId) await env.RUNTIME_DB.prepare('UPDATE commerce_webhook_events SET order_id=?2 WHERE stripe_event_id=?1').bind(event.id,orderId).run();
    await finishWebhookEvent({env,eventId:event.id,status:'processed',clock});
    return {status:'processed',orderId};
  }catch(error){
    if(error.code==='commerce_provider_mismatch'){
      await markCommerceReview(env,orderId);
      await finishWebhookEvent({env,eventId:event.id,status:'failed_terminal',errorCode:'review_required_provider_mismatch',clock});
      return {status:'review_required',orderId:orderId||null};
    }
    await finishWebhookEvent({env,eventId:event.id,status:'failed',errorCode:'commerce_retry_required',clock});
    // Database and provider failures must be retried, including RECEIVED replays.
    throw Object.assign(new Error('Temporary commerce processing failure.'),{status:503,code:'commerce_retry_required'});
  }
}
