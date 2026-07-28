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
    const firstDelivery = await registerWebhookEvent({
      env,
      event,
      payloadSha256: verified.payloadSha256
    });
    if (!firstDelivery) {
      return json({ success: true, replay: true });
    }
    const result = await processStripeEvent({
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
