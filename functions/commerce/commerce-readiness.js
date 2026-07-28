import { BOOK_ONE_PRODUCT } from './book-product-registry.js';

function configured(value, prefix = '') {
  const text = String(value || '').trim();
  return Boolean(text && (!prefix || text.startsWith(prefix)));
}

export async function commerceReadiness(env = {}) {
  const checks = {
    salesEnabled: String(env.PHIOS_BOOK_ONE_SALES_ENABLED) === 'true',
    databaseBound: Boolean(env.RUNTIME_DB?.prepare),
    stripeSecretConfigured: configured(env.STRIPE_SECRET_KEY, 'sk_'),
    stripeWebhookConfigured: configured(env.STRIPE_WEBHOOK_SECRET, 'whsec_'),
    accessSecretConfigured:
      String(env.BOOK_ACCESS_TOKEN_SECRET || '').trim().length >= 32,
    privateBookBucketBound: Boolean(env.BOOKS?.head && env.BOOKS?.get),
    sourceBookPresent: false,
    sourceChecksumConfigured:
      /^[0-9a-f]{64}$/i.test(String(env.BOOK_ONE_SOURCE_SHA256 || '')),
    watermarkServiceConfigured: Boolean(
      String(env.BOOK_WATERMARK_SERVICE_URL || '').trim() &&
      String(env.BOOK_WATERMARK_SERVICE_TOKEN || '').trim()
    ),
    receiptSenderConfigured: Boolean(
      configured(env.RESEND_API_KEY, 're_') &&
      String(env.BOOK_RECEIPT_FROM_EMAIL || '').includes('@')
    )
  };

  if (checks.privateBookBucketBound) {
    try {
      checks.sourceBookPresent = Boolean(
        await env.BOOKS.head(BOOK_ONE_PRODUCT.sourceObjectKey)
      );
    } catch {
      checks.sourceBookPresent = false;
    }
  }

  const required = Object.values(checks);
  return Object.freeze({
    ...checks,
    checkoutReady: required.every(Boolean)
  });
}

export function requireCheckoutReady(readiness) {
  if (!readiness.checkoutReady) {
    throw Object.assign(new Error(
      'Checkout is not available until every payment and delivery gate is ready.'
    ), {
      status: 503,
      code: 'checkout_not_ready'
    });
  }
}
