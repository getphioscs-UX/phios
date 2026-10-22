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

// Work-only checkout is retired for new purchases. Existing orders/downloads remain.
export async function onRequestPost() {
  return json({success:false,code:'book_language_version_required',purchaseUrl:'/account#commerce',message:'Choose the Chinese or English full PDF in your account. Each language is RM89.'},409);
}

export async function onRequest(context) {
  return context.request.method === 'POST'
    ? onRequestPost(context)
    : methodNotAllowed(['POST']);
}
