import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import {
  applyRuntimeMigrations
} from '../functions/runtime/migrations/migration-runner.js';
import {
  createSqliteD1Adapter,
  loadRuntimeMigrations
} from './runtime-migration-loader.mjs';
import {
  BOOK_ONE_PRODUCT,
  BOOK_PRODUCT_REGISTRY_VERSION
} from '../functions/commerce/book-product-registry.js';
import {
  consumeDownloadToken,
  issueDownloadToken,
  validatePaidBookSession
} from '../functions/commerce/book-commerce-store.js';
import {
  createStripeTestSignature
} from '../functions/commerce/stripe-client.js';
import {
  onRequestPost as createCheckout
} from '../functions/api/book-one-checkout.js';
import {
  onRequestPost as stripeWebhook
} from '../functions/api/stripe-webhook.js';
import {
  onRequestGet as paymentStatus
} from '../functions/api/book-one-payment-status.js';
import {
  onRequestGet as bookAccess
} from '../functions/api/book-one-access.js';
import {
  onRequestPost as createDownloadToken
} from '../functions/api/book-one-download-token.js';
import {
  onRequestGet as downloadBook
} from '../functions/api/book-one-download.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const database = new DatabaseSync(':memory:');
database.exec('PRAGMA foreign_keys = ON;');
const db = createSqliteD1Adapter(database);
await applyRuntimeMigrations({
  db,
  migrations: loadRuntimeMigrations(root).migrations,
  now: () => '2026-07-28T00:00:00.000Z'
});

const sourceKey = BOOK_ONE_PRODUCT.sourceObjectKey;
const r2Objects = new Map([
  [sourceKey, new Uint8Array([37, 80, 68, 70, 45, 49, 46, 55])]
]);
const BOOKS = {
  async head(key) {
    const bytes = r2Objects.get(key);
    return bytes
      ? { key, size: bytes.byteLength, httpEtag: '"test-etag"' }
      : null;
  },
  async get(key) {
    const bytes = r2Objects.get(key);
    return bytes
      ? {
          key,
          size: bytes.byteLength,
          httpEtag: '"test-etag"',
          body: new Blob([bytes]).stream()
        }
      : null;
  }
};

const env = {
  RUNTIME_DB: db,
  BOOKS,
  PHIOS_BOOK_ONE_SALES_ENABLED: 'true',
  STRIPE_SECRET_KEY: 'sk_test_book_one',
  STRIPE_WEBHOOK_SECRET: 'whsec_book_one_test',
  BOOK_ACCESS_TOKEN_SECRET:
    'test-book-access-secret-with-more-than-32-characters',
  BOOK_ONE_SOURCE_SHA256: 'a'.repeat(64),
  BOOK_WATERMARK_SERVICE_URL: 'https://watermark.test',
  BOOK_WATERMARK_SERVICE_TOKEN: 'watermark-service-test-secret',
  RESEND_API_KEY: 're_book_one_test',
  BOOK_RECEIPT_FROM_EMAIL: 'PHI OS <books@example.test>'
};

let stripeParameters;
let paidSession;
let watermarkCalls = 0;
let emailCalls = 0;

async function fakeFetch(url, options = {}) {
  const target = String(url);
  if (
    target === 'https://api.stripe.com/v1/checkout/sessions' &&
    options.method === 'POST'
  ) {
    stripeParameters = new URLSearchParams(String(options.body));
    paidSession = {
      id: 'cs_test_book1',
      object: 'checkout.session',
      mode: 'payment',
      payment_status: 'paid',
      status: 'complete',
      currency: 'myr',
      amount_total: 8900,
      customer: 'cus_book1',
      payment_intent: 'pi_book1',
      customer_details: {
        email: 'Reader@example.com',
        name: 'Test Reader'
      },
      metadata: {
        product_id: stripeParameters.get('metadata[product_id]'),
        product_version: stripeParameters.get('metadata[product_version]'),
        checkout_attempt_id:
          stripeParameters.get('metadata[checkout_attempt_id]'),
        purchase_id: stripeParameters.get('metadata[purchase_id]'),
        amount_minor: stripeParameters.get('metadata[amount_minor]'),
        currency: stripeParameters.get('metadata[currency]')
      }
    };
    return Response.json({
      id: paidSession.id,
      url: 'https://checkout.stripe.com/c/pay/cs_test_book1',
      expires_at: 1785196800
    });
  }
  if (target.startsWith(
    'https://api.stripe.com/v1/checkout/sessions/cs_test_book1'
  )) {
    return Response.json(paidSession);
  }
  if (target === 'https://watermark.test/jobs') {
    watermarkCalls += 1;
    const body = JSON.parse(options.body);
    assert.equal(body.sourceObjectKey, sourceKey);
    assert.match(
      body.destinationObjectKey,
      /^private\/books\/book-one\/watermarked\/pur_[a-z0-9]+\.pdf$/
    );
    assert.equal(body.watermark.purchaserEmail, 'reader@example.com');
    r2Objects.set(
      body.destinationObjectKey,
      new TextEncoder().encode('%PDF-1.7 WATERMARKED TEST')
    );
    return Response.json({
      status: 'completed',
      destinationObjectKey: body.destinationObjectKey
    });
  }
  if (target === 'https://api.resend.com/emails') {
    emailCalls += 1;
    const body = JSON.parse(options.body);
    assert.deepEqual(body.to, ['reader@example.com']);
    assert.match(body.text, /Receipt:/);
    assert.match(body.text, /book-one-download\?token=/);
    return Response.json({ id: 'email_book1' });
  }
  return Response.json({ error: 'unexpected_test_url' }, { status: 500 });
}

assert.equal(BOOK_PRODUCT_REGISTRY_VERSION, 'phi-os.book-products.v1');
assert.equal(BOOK_ONE_PRODUCT.productId, 'phios-book-one-zh-pdf');
assert.equal(BOOK_ONE_PRODUCT.currency, 'MYR');
assert.equal(BOOK_ONE_PRODUCT.amountMinor, 8900);
assert.deepEqual(BOOK_ONE_PRODUCT.paymentMethods, ['card', 'fpx']);

const checkoutResponse = await createCheckout({
  request: new Request('https://phios.example/api/book-one-checkout', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'idempotency-key': 'book-one-test-attempt-0001'
    },
    body: JSON.stringify({
      locale: 'zh-Hans',
      acceptDigitalPolicy: true,
      amountMinor: 1,
      currency: 'USD'
    })
  }),
  env,
  fetch: fakeFetch
});
assert.equal(checkoutResponse.status, 201);
const checkoutPayload = await checkoutResponse.json();
assert.equal(checkoutPayload.checkoutSessionId, 'cs_test_book1');
assert.equal(checkoutPayload.purchaseState, 'payment_pending');
assert.equal(stripeParameters.get('mode'), 'payment');
assert.deepEqual(stripeParameters.getAll('payment_method_types[]'), [
  'card',
  'fpx'
]);
assert.equal(stripeParameters.get('line_items[0][price_data][currency]'), 'myr');
assert.equal(stripeParameters.get('line_items[0][price_data][unit_amount]'), '8900');
assert.equal(
  stripeParameters.get('metadata[product_id]'),
  BOOK_ONE_PRODUCT.productId
);
assert.equal(
  stripeParameters.get('success_url'),
  'https://phios.example/payment-success?session_id={CHECKOUT_SESSION_ID}'
);

const replayCheckoutResponse = await createCheckout({
  request: new Request('https://phios.example/api/book-one-checkout', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'idempotency-key': 'book-one-test-attempt-0001'
    },
    body: JSON.stringify({
      locale: 'zh-Hans',
      acceptDigitalPolicy: true
    })
  }),
  env,
  fetch: fakeFetch
});
assert.equal((await replayCheckoutResponse.json()).replay, true);

assert.throws(
  () => validatePaidBookSession({
    ...paidSession,
    amount_total: 1
  }),
  /frozen Book I product contract/
);

const event = {
  id: 'evt_bookpaid1',
  type: 'checkout.session.completed',
  livemode: false,
  data: { object: paidSession }
};
const rawEvent = JSON.stringify(event);
const timestamp = Math.floor(Date.now() / 1000);
const signature = await createStripeTestSignature(
  rawEvent,
  env.STRIPE_WEBHOOK_SECRET,
  timestamp
);
const webhookRequest = () => new Request(
  'https://phios.example/api/stripe-webhook',
  {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'stripe-signature': signature
    },
    body: rawEvent
  }
);
const webhookResponse = await stripeWebhook({
  request: webhookRequest(),
  env,
  fetch: fakeFetch
});
assert.equal(webhookResponse.status, 200);
assert.equal((await webhookResponse.json()).eventStatus, 'processed');
assert.equal(watermarkCalls, 1);
assert.equal(emailCalls, 1);

const webhookReplay = await stripeWebhook({
  request: webhookRequest(),
  env,
  fetch: fakeFetch
});
assert.equal((await webhookReplay.json()).replay, true);
assert.equal(watermarkCalls, 1);
assert.equal(emailCalls, 1);

const invalidWebhook = await stripeWebhook({
  request: new Request('https://phios.example/api/stripe-webhook', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'stripe-signature': `t=${timestamp},v1=${'0'.repeat(64)}`
    },
    body: rawEvent
  }),
  env,
  fetch: fakeFetch
});
assert.equal(invalidWebhook.status, 400);

const storedPurchase = database.prepare(`
  SELECT * FROM commerce_purchases LIMIT 1
`).get();
assert.equal(storedPurchase.purchase_state, 'purchased');
assert.equal(storedPurchase.currency, 'MYR');
assert.equal(storedPurchase.amount_minor, 8900);
assert.equal(storedPurchase.buyer_email_ciphertext.includes('reader@example.com'), false);
assert.match(storedPurchase.buyer_email_hash, /^[0-9a-f]{64}$/);
const storedEntitlement = database.prepare(`
  SELECT * FROM digital_entitlements LIMIT 1
`).get();
assert.equal(storedEntitlement.entitlement_status, 'active');
assert.equal(storedEntitlement.watermark_status, 'ready');
assert.match(storedEntitlement.watermarked_object_key, /\/watermarked\//);
assert.equal(
  database.prepare('SELECT COUNT(*) AS count FROM commerce_webhook_events').get().count,
  1
);

const locked = await bookAccess({
  request: new Request('https://phios.example/api/book-one-access'),
  env
});
assert.equal((await locked.json()).accessGranted, false);

const statusResponse = await paymentStatus({
  request: new Request(
    'https://phios.example/api/book-one-payment-status?session_id=cs_test_book1'
  ),
  env,
  fetch: fakeFetch
});
assert.equal(statusResponse.status, 200);
const statusPayload = await statusResponse.json();
assert.equal(statusPayload.purchaseState, 'purchased');
assert.equal(statusPayload.accessGranted, true);
assert.equal(statusPayload.downloadReady, true);
assert.match(statusPayload.receipt.receiptNumber, /^PHI-2026-/);
const setCookie = statusResponse.headers.get('set-cookie');
assert.match(setCookie, /^phios_book_access=/);
assert.match(setCookie, /HttpOnly/);
assert.match(setCookie, /SameSite=Lax/);
assert.equal(watermarkCalls, 1);
assert.equal(emailCalls, 1);

const cookieHeader = setCookie.split(';')[0];
const accessResponse = await bookAccess({
  request: new Request('https://phios.example/api/book-one-access', {
    headers: { cookie: cookieHeader }
  }),
  env
});
const accessPayload = await accessResponse.json();
assert.equal(accessPayload.accessGranted, true);
assert.equal(accessPayload.downloadReady, true);

const forgedAccess = await bookAccess({
  request: new Request('https://phios.example/api/book-one-access', {
    headers: { cookie: 'phios_book_access=v1.forged.forged' }
  }),
  env
});
assert.equal((await forgedAccess.json()).accessGranted, false);

const tokenResponse = await createDownloadToken({
  request: new Request('https://phios.example/api/book-one-download-token', {
    method: 'POST',
    headers: { cookie: cookieHeader }
  }),
  env
});
assert.equal(tokenResponse.status, 201);
const tokenPayload = await tokenResponse.json();
assert.equal(tokenPayload.maxUses, 2);
const downloadUrl = new URL(tokenPayload.downloadUrl, 'https://phios.example');

for (let use = 0; use < 2; use += 1) {
  const downloadResponse = await downloadBook({
    request: new Request(downloadUrl, {
      headers: {
        'cf-connecting-ip': '203.0.113.8',
        'user-agent': 'PHI OS acceptance'
      }
    }),
    env
  });
  assert.equal(downloadResponse.status, 200);
  assert.equal(downloadResponse.headers.get('content-type'), 'application/pdf');
  assert.match(
    downloadResponse.headers.get('content-disposition'),
    /Watermarked\.pdf/
  );
  assert.match(await downloadResponse.text(), /WATERMARKED TEST/);
}
const exhaustedDownload = await downloadBook({
  request: new Request(downloadUrl),
  env
});
assert.equal(exhaustedDownload.status, 403);
assert.equal(
  database.prepare('SELECT COUNT(*) AS count FROM commerce_download_events').get().count,
  2
);

const expiredToken = await issueDownloadToken({
  env,
  entitlementId: storedEntitlement.entitlement_id,
  lifetimeSeconds: 1,
  clock: () => Date.now() - 10000
});
assert.equal(
  await consumeDownloadToken({ env, rawToken: expiredToken.rawToken }),
  null
);

const refundEvent = {
  id: 'evt_bookrefund1',
  type: 'charge.refunded',
  livemode: false,
  data: {
    object: {
      id: 'ch_book1',
      payment_intent: 'pi_book1',
      amount_refunded: 8900
    }
  }
};
const rawRefund = JSON.stringify(refundEvent);
const refundSignature = await createStripeTestSignature(
  rawRefund,
  env.STRIPE_WEBHOOK_SECRET,
  timestamp
);
const refundResponse = await stripeWebhook({
  request: new Request('https://phios.example/api/stripe-webhook', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'stripe-signature': refundSignature
    },
    body: rawRefund
  }),
  env,
  fetch: fakeFetch
});
assert.equal(refundResponse.status, 200);
assert.equal(
  database.prepare('SELECT purchase_state FROM commerce_purchases').get()
    .purchase_state,
  'refunded'
);
assert.equal(
  database.prepare('SELECT entitlement_status FROM digital_entitlements').get()
    .entitlement_status,
  'refunded'
);
const refundedAccess = await bookAccess({
  request: new Request('https://phios.example/api/book-one-access', {
    headers: { cookie: cookieHeader }
  }),
  env
});
const refundedPayload = await refundedAccess.json();
assert.equal(refundedPayload.purchaseState, 'refunded');
assert.equal(refundedPayload.accessGranted, false);

for (const file of [
  'functions/api/book-one-checkout.js',
  'functions/api/book-one-payment-status.js',
  'functions/api/stripe-webhook.js',
  'functions/api/book-one-download-token.js',
  'functions/api/book-one-download.js',
  'functions/api/book-one-watermark-complete.js',
  'payment-success.html',
  'payment-failure.html',
  'digital-product-policy.html'
]) {
  assert.equal(fs.existsSync(path.join(root, file)), true, `Missing ${file}`);
}
const migration = read('db/migrations/0004_book_commerce.sql');
for (const table of [
  'commerce_products',
  'commerce_checkout_attempts',
  'commerce_purchases',
  'digital_entitlements',
  'commerce_webhook_events',
  'commerce_download_tokens',
  'commerce_download_events',
  'commerce_receipts',
  'commerce_delivery_messages',
  'commerce_watermark_jobs'
]) {
  assert.match(migration, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
}
assert.match(
  read('config/book-commerce-bindings.example.jsonc'),
  /"binding": "BOOKS"/
);
assert.match(read('checkout.html'), /data-checkout-form/);
assert.match(read('read/book-one/index.html'), /data-download-book/);
assert.doesNotMatch(read('read/book-one/index.html'), /localStorage/);
assert.doesNotMatch(
  read('assets/js/pages/book-one-reader.js'),
  /purchaseState\s*=\s*['"]purchased|setItem/
);

database.close();
console.log(
  '✓ M3B-W4/W8 Book Access and Payment passed: frozen RM89 product, ' +
  'Stripe Checkout, verified idempotent webhook, D1 purchase and entitlement, ' +
  'watermarked R2 delivery, limited download tokens, receipt email and refund revocation.'
);
