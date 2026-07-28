import {
  rawHmacHex,
  sha256Hex,
  verifyRawHmacHex
} from './commerce-crypto.js';

const STRIPE_API = 'https://api.stripe.com/v1';

function stripeSecret(env) {
  const secret = String(env?.STRIPE_SECRET_KEY || '').trim();
  if (!secret.startsWith('sk_')) {
    throw Object.assign(new Error('Stripe is not configured.'), {
      status: 503,
      code: 'stripe_not_configured'
    });
  }
  return secret;
}

async function stripeRequest(env, path, options = {}) {
  const response = await (options.fetcher || fetch)(
    `${STRIPE_API}${path}`,
    {
      method: options.method || 'GET',
      headers: {
        authorization: `Bearer ${stripeSecret(env)}`,
        ...(options.idempotencyKey
          ? { 'idempotency-key': options.idempotencyKey }
          : {}),
        ...(options.body
          ? { 'content-type': 'application/x-www-form-urlencoded' }
          : {})
      },
      body: options.body
    }
  );

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    // The normalized error below does not expose Stripe's response body.
  }

  if (!response.ok) {
    throw Object.assign(new Error('Stripe rejected the request.'), {
      status: response.status >= 400 && response.status < 500
        ? 400
        : 502,
      code: 'stripe_request_failed',
      stripeRequestId: response.headers.get('request-id') || ''
    });
  }
  return payload;
}

export async function createCheckoutSession({
  env,
  product,
  checkoutAttemptId,
  purchaseId,
  origin,
  locale,
  idempotencyKey,
  fetcher
}) {
  const parameters = new URLSearchParams();
  parameters.set('mode', 'payment');
  parameters.append('payment_method_types[]', 'card');
  parameters.append('payment_method_types[]', 'fpx');
  parameters.set('customer_creation', 'always');
  parameters.set('billing_address_collection', 'auto');
  parameters.set('line_items[0][quantity]', '1');
  parameters.set('line_items[0][price_data][currency]', 'myr');
  parameters.set(
    'line_items[0][price_data][unit_amount]',
    String(product.amountMinor)
  );
  parameters.set(
    'line_items[0][price_data][product_data][name]',
    product.title
  );
  parameters.set(
    'line_items[0][price_data][product_data][description]',
    `${product.subtitle} · ${product.format} · ${product.pageCount} pages`
  );
  parameters.set(
    'success_url',
    `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`
  );
  parameters.set(
    'cancel_url',
    `${origin}/payment-failure?reason=cancelled`
  );
  parameters.set('locale', locale === 'zh-Hans' ? 'zh' : 'en');
  parameters.set('metadata[product_id]', product.productId);
  parameters.set('metadata[product_version]', product.productVersion);
  parameters.set('metadata[checkout_attempt_id]', checkoutAttemptId);
  parameters.set('metadata[purchase_id]', purchaseId);
  parameters.set('metadata[amount_minor]', String(product.amountMinor));
  parameters.set('metadata[currency]', product.currency);

  return stripeRequest(env, '/checkout/sessions', {
    method: 'POST',
    body: parameters,
    idempotencyKey,
    fetcher
  });
}

export function retrieveCheckoutSession(env, sessionId, fetcher) {
  if (!/^cs_(?:test_|live_)?[A-Za-z0-9]+$/.test(String(sessionId || ''))) {
    throw Object.assign(new Error('Checkout Session ID is invalid.'), {
      status: 400,
      code: 'checkout_session_id_invalid'
    });
  }
  return stripeRequest(
    env,
    `/checkout/sessions/${encodeURIComponent(sessionId)}` +
      '?expand[]=payment_intent&expand[]=customer',
    { fetcher }
  );
}

function signatureParts(header) {
  const parts = {};
  for (const segment of String(header || '').split(',')) {
    const separator = segment.indexOf('=');
    if (separator === -1) continue;
    const key = segment.slice(0, separator).trim();
    const value = segment.slice(separator + 1).trim();
    if (!parts[key]) parts[key] = [];
    parts[key].push(value);
  }
  return parts;
}

export async function verifyStripeWebhook({
  rawBody,
  signatureHeader,
  secret,
  nowSeconds = Math.floor(Date.now() / 1000),
  toleranceSeconds = 300
}) {
  const parts = signatureParts(signatureHeader);
  const timestamp = Number(parts.t?.[0]);
  if (!Number.isInteger(timestamp) || !parts.v1?.length) {
    throw Object.assign(new Error('Stripe signature header is invalid.'), {
      status: 400,
      code: 'stripe_signature_invalid'
    });
  }
  if (Math.abs(nowSeconds - timestamp) > toleranceSeconds) {
    throw Object.assign(new Error('Stripe signature timestamp is stale.'), {
      status: 400,
      code: 'stripe_signature_stale'
    });
  }

  const signedPayload = `${timestamp}.${rawBody}`;
  const valid = (
    await Promise.all(parts.v1.map(signature =>
      verifyRawHmacHex(secret, signedPayload, signature)
    ))
  ).some(Boolean);

  if (!valid) {
    throw Object.assign(new Error('Stripe signature verification failed.'), {
      status: 400,
      code: 'stripe_signature_invalid'
    });
  }
  return {
    timestamp,
    payloadSha256: await sha256Hex(rawBody)
  };
}

export async function createStripeTestSignature(
  rawBody,
  secret,
  timestamp
) {
  const signature = await rawHmacHex(
    secret,
    `${timestamp}.${rawBody}`
  );
  return `t=${timestamp},v1=${signature}`;
}
