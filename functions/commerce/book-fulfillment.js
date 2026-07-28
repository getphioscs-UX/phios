import {
  applyRefund,
  finishWebhookEvent,
  fulfillPaidBookSession,
  markCheckoutFailed,
  purchaseAccessBySession
} from './book-commerce-store.js';
import {
  dispatchWatermark,
  sendReceiptAndDelivery
} from './book-delivery.js';

export async function fulfillCheckout({
  env,
  session,
  origin,
  fetcher = fetch,
  clock = Date.now
}) {
  const purchase = await fulfillPaidBookSession({ env, session, clock });
  const watermark = await dispatchWatermark({
    env,
    purchaseId: purchase.purchase_id,
    origin,
    fetcher,
    clock
  });
  let delivery = { status: 'pending' };
  if (watermark.status === 'completed') {
    delivery = await sendReceiptAndDelivery({
      env,
      purchaseId: purchase.purchase_id,
      origin,
      fetcher,
      clock
    });
  }
  return {
    purchase: await purchaseAccessBySession(env, session.id),
    watermark,
    delivery
  };
}

export async function processStripeEvent({
  env,
  event,
  origin,
  fetcher = fetch,
  clock = Date.now
}) {
  const object = event?.data?.object || {};
  try {
    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded'
    ) {
      if (object.payment_status !== 'paid') {
        await finishWebhookEvent({
          env,
          eventId: event.id,
          status: 'ignored',
          errorCode: 'payment_not_paid',
          clock
        });
        return { status: 'ignored', reason: 'payment_not_paid' };
      }
      const result = await fulfillCheckout({
        env,
        session: object,
        origin,
        fetcher,
        clock
      });
      await finishWebhookEvent({
        env,
        eventId: event.id,
        status: 'processed',
        clock
      });
      return { status: 'processed', purchaseId: result.purchase.purchase_id };
    }

    if (
      event.type === 'checkout.session.async_payment_failed' ||
      event.type === 'checkout.session.expired'
    ) {
      const attemptId = object?.metadata?.checkout_attempt_id;
      if (attemptId) {
        await markCheckoutFailed(
          env,
          attemptId,
          event.type.endsWith('expired') ? 'expired' : 'failed',
          clock
        );
      }
      await finishWebhookEvent({
        env,
        eventId: event.id,
        status: 'processed',
        clock
      });
      return { status: 'processed' };
    }

    if (event.type === 'charge.refunded') {
      const refund = await applyRefund({
        env,
        paymentIntentId:
          typeof object.payment_intent === 'string'
            ? object.payment_intent
            : object.payment_intent?.id,
        refundedAmountMinor: object.amount_refunded,
        clock
      });
      await finishWebhookEvent({
        env,
        eventId: event.id,
        status: refund.matched ? 'processed' : 'ignored',
        errorCode: refund.matched ? null : 'purchase_not_found',
        clock
      });
      return { status: refund.matched ? 'processed' : 'ignored', refund };
    }

    await finishWebhookEvent({
      env,
      eventId: event.id,
      status: 'ignored',
      errorCode: 'event_type_not_handled',
      clock
    });
    return { status: 'ignored', reason: 'event_type_not_handled' };
  } catch (error) {
    await finishWebhookEvent({
      env,
      eventId: event.id,
      status: 'failed',
      errorCode: String(error?.code || 'event_processing_failed').slice(0, 96),
      clock
    });
    throw error;
  }
}
