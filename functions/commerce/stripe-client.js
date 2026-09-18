import {
  rawHmacHex,
  sha256Hex,
  verifyRawHmacHex
} from './commerce-crypto.js';

const STRIPE_API = 'https://api.stripe.com/v1';

function stripeSecret(env) {
  const secret = String(env?.STRIPE_SECRET_KEY || '').trim();
  if (!/^(sk|rk)_/.test(secret)) {
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
        ...(options.apiVersion ? {'Stripe-Version':options.apiVersion} : {}),
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

// QA successor uses this existing adapter. Live mapping is intentionally absent.
export function requireStripeQa(env) {
  if (env?.STRIPE_ENVIRONMENT !== 'QA' || !/^(sk|rk)_test_/.test(String(env.STRIPE_SECRET_KEY || ''))) {
    throw Object.assign(new Error('QA Stripe configuration required.'), {status:503,code:'stripe_qa_required'});
  }
}
export async function stripeQaRequest(env, path, options = {}) {
  requireStripeQa(env);
  const payload=await stripeRequest(env,path,{...options,apiVersion:'2026-07-29.dahlia'});
  if (payload.livemode === true || payload.data?.some(item=>item.livemode===true)) throw Object.assign(new Error('Live object rejected.'),{status:502,code:'stripe_live_object_rejected'});
  return payload;
}
export async function verifyStripeQaAccount(env, fetcher) {
  const account=await stripeQaRequest(env,'/account',{fetcher});
  if(account.id!=='acct_1UFr0TBEKXJyHMkK') throw Object.assign(new Error('Wrong Stripe account.'),{status:503,code:'stripe_qa_account_mismatch'});
}
export function createCanonicalStripeCustomer(env, customerId, idempotencyKey, fetcher) {
  return stripeQaRequest(env,'/customers',{method:'POST',body:new URLSearchParams({'metadata[customer_id]':customerId,'metadata[environment]':'QA'}),idempotencyKey,fetcher});
}
export function createCommerceCheckoutSession({env,product,order,customerId,origin,locale,idempotencyKey,fetcher}) {
  const mode=product.billingType==='RECURRING'?'subscription':'payment';
  const metadata={order_id:order.checkout_attempt_id,commerce_product_id:product.productId,customer_id:order.customer_id,environment:'QA',schema_version:'COM-STRIPE-R1',selected_reports:order.selected_products_json};
  const body=new URLSearchParams({mode,customer:customerId,'line_items[0][price]':product.qaPriceId,'line_items[0][quantity]':'1',success_url:`${origin}/account?commerce_order=${encodeURIComponent(order.checkout_attempt_id)}`,cancel_url:`${origin}/account?commerce_order=${encodeURIComponent(order.checkout_attempt_id)}&checkout=cancelled`,locale:locale==='zh-Hans'?'zh':'en'});
  const suffix=order.checkout_attempt_id.replace('ord_','').slice(0,8).split('').map(c=>String.fromCharCode(97+parseInt(c,16))).join('');
  body.set('integration_identifier',`phios_commerce_qa_${suffix}`);
  for(const [key,value] of Object.entries(metadata)){
    body.set(`metadata[${key}]`,value);
    body.set(`${mode==='subscription'?'subscription_data':'payment_intent_data'}[metadata][${key}]`,value);
  }
  // Dynamic payment methods; never force FPX for subscriptions.
  return stripeQaRequest(env,'/checkout/sessions',{method:'POST',body,idempotencyKey,fetcher});
}
export function retrieveCommerceSession(env,id,fetcher){
  if(!/^cs_test_[A-Za-z0-9]+$/.test(id)) throw Object.assign(new Error('Invalid QA session.'),{status:400,code:'qa_session_invalid'});
  return stripeQaRequest(env,`/checkout/sessions/${encodeURIComponent(id)}?expand[]=line_items&expand[]=subscription`,{fetcher});
}
export function retrieveCommerceSubscription(env,id,fetcher){
  if(!/^sub_[A-Za-z0-9]+$/.test(id)) throw Object.assign(new Error('Invalid subscription.'),{status:400,code:'subscription_invalid'});
  return stripeQaRequest(env,`/subscriptions/${encodeURIComponent(id)}`,{fetcher});
}
export function createCommercePortal(env,customerId,origin,fetcher){
  return stripeQaRequest(env,'/billing_portal/sessions',{method:'POST',body:new URLSearchParams({customer:customerId,return_url:`${origin}/account`}),fetcher});
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
