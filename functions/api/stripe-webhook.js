import {
  registerWebhookEvent
} from '../commerce/book-commerce-store.js';
import {
  processStripeEvent
} from '../commerce/book-fulfillment.js';
import {
  commerceError,
  json,
  methodNotAllowed,
  requestOrigin
} from '../commerce/commerce-http.js';
import {
  verifyStripeWebhook
} from '../commerce/stripe-client.js';
import {processCommerceStripeEvent} from '../commerce/commerce-stripe-events.js';
import {commerceLog} from '../commerce/commerce-observability.js';

export async function onRequestPost({
  request,
  env = {},
  fetch: fetcher
}) {
  try {
    const secret = String(env.STRIPE_WEBHOOK_SECRET || '');
    if (!secret.startsWith('whsec_')) {
      throw Object.assign(new Error('Stripe webhook is not configured.'), {
        status: 503,
        code: 'stripe_webhook_not_configured'
      });
    }
    const rawBody = await request.text();
    const verified = await verifyStripeWebhook({
      rawBody,
      signatureHeader: request.headers.get('stripe-signature'),
      secret
    });
    let event;
    try {
      event = JSON.parse(rawBody);
    } catch {
      throw Object.assign(new Error('Stripe webhook JSON is invalid.'), {
        status: 400,
        code: 'stripe_webhook_json_invalid'
      });
    }
    if (
      !/^evt_[A-Za-z0-9]+$/.test(String(event?.id || '')) ||
      typeof event?.type !== 'string'
    ) {
      throw Object.assign(new Error('Stripe event envelope is invalid.'), {
        status: 400,
        code: 'stripe_event_invalid'
      });
    }
    if (env.STRIPE_ENVIRONMENT === 'QA' && (event.livemode !== false || event.data?.object?.livemode === true)) {
      return json({success:false,code:'stripe_live_event_rejected'},400);
    }
    const firstDelivery = await registerWebhookEvent({
      env,
      event,
      payloadSha256: verified.payloadSha256
    });
    commerceLog('STRIPE_EVENT_RECEIVED',{stripe_event_id:event.id});
    if (!firstDelivery) {
      commerceLog('ENTITLEMENT_SKIPPED_DUPLICATE',{stripe_event_id:event.id});
      return json({ success: true, replay: true });
    }
    const successor = event.data?.object?.metadata?.schema_version === 'COM-STRIPE-R1' || env.STRIPE_ENVIRONMENT === 'QA' && event.data?.object?.metadata?.product_id !== 'phios-book-one-zh-pdf';
    const result = await (successor ? processCommerceStripeEvent : processStripeEvent)({
      env,
      event,
      origin: requestOrigin(request),
      fetcher
    });
    return json({ success: true, eventStatus: result.status });
  } catch (error) {
    return commerceError(error, 'stripe_webhook_failed');
  }
}

export async function onRequest(context) {
  return context.request.method === 'POST'
    ? onRequestPost(context)
    : methodNotAllowed(['POST']);
}
