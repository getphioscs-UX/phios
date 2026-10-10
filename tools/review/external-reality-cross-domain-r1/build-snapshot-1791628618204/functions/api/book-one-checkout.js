import { BOOK_ONE_PRODUCT } from '../commerce/book-product-registry.js';
import {
  createCheckoutAttempt,
  attachStripeCheckout,
  markCheckoutFailed
} from '../commerce/book-commerce-store.js';
import {
  randomId,
  sha256Hex
} from '../commerce/commerce-crypto.js';
import {
  commerceReadiness,
  requireCheckoutReady
} from '../commerce/commerce-readiness.js';
import {
  cleanText,
  commerceError,
  json,
  localeFrom,
  methodNotAllowed,
  readJsonBody,
  requestOrigin
} from '../commerce/commerce-http.js';
import {
  createCheckoutSession
} from '../commerce/stripe-client.js';

function clientIdempotencyKey(request) {
  const supplied = cleanText(request.headers.get('idempotency-key'), 255);
  if (/^[A-Za-z0-9][A-Za-z0-9._:/-]{15,254}$/.test(supplied)) {
    return `book-one/${supplied}`;
  }
  return `book-one/${crypto.randomUUID()}`;
}

export async function onRequestPost({
  request,
  env = {},
  fetch: fetcher
}) {
  let attemptId = '';
  try {
    const readiness = await commerceReadiness(env);
    requireCheckoutReady(readiness);
    const body = await readJsonBody(request);
    if (body.acceptDigitalPolicy !== true) {
      throw Object.assign(new Error(
        'The digital product terms must be accepted before checkout.'
      ), {
        status: 422,
        code: 'digital_policy_acceptance_required'
      });
    }

    const locale = localeFrom(body.locale);
    const idempotencyKey = clientIdempotencyKey(request);
    const idempotencyKeyHash = await sha256Hex(idempotencyKey);
    attemptId = randomId('chk_');
    const attempt = await createCheckoutAttempt({
      env,
      checkoutAttemptId: attemptId,
      idempotencyKeyHash,
      locale
    });

    if (
      attempt?.stripe_checkout_session_id &&
      attempt?.stripe_checkout_url &&
      attempt.status === 'payment_pending'
    ) {
      return json({
        success: true,
        checkoutSessionId: attempt.stripe_checkout_session_id,
        checkoutUrl: attempt.stripe_checkout_url,
        purchaseState: 'payment_pending',
        replay: true
      });
    }

    attemptId = attempt.checkout_attempt_id;
    const purchaseId = randomId('pur_');
    const session = await createCheckoutSession({
      env,
      product: BOOK_ONE_PRODUCT,
      checkoutAttemptId: attemptId,
      purchaseId,
      origin: requestOrigin(request),
      locale,
      idempotencyKey,
      fetcher
    });
    if (!session?.id || !session?.url) {
      throw Object.assign(new Error('Stripe returned no Checkout URL.'), {
        status: 502,
        code: 'stripe_checkout_url_missing'
      });
    }
    await attachStripeCheckout({
      env,
      checkoutAttemptId: attemptId,
      session
    });
    return json({
      success: true,
      checkoutSessionId: session.id,
      checkoutUrl: session.url,
      purchaseState: 'payment_pending'
    }, 201);
  } catch (error) {
    if (attemptId) {
      try {
        await markCheckoutFailed(env, attemptId);
      } catch {
        // Preserve the original normalized checkout failure.
      }
    }
    return commerceError(error, 'checkout_creation_failed');
  }
}

export async function onRequest(context) {
  return context.request.method === 'POST'
    ? onRequestPost(context)
    : methodNotAllowed(['POST']);
}
