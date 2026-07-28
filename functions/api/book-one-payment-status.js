import {
  accessCookie,
  signAccessSession
} from '../commerce/commerce-crypto.js';
import {
  fulfillCheckout
} from '../commerce/book-fulfillment.js';
import {
  commerceError,
  json,
  methodNotAllowed,
  requestOrigin
} from '../commerce/commerce-http.js';
import {
  retrieveCheckoutSession
} from '../commerce/stripe-client.js';

function publicAccess(record) {
  let receipt = null;
  try {
    receipt = record?.receipt_json ? JSON.parse(record.receipt_json) : null;
  } catch {
    receipt = null;
  }
  return {
    productId: record?.product_id || 'phios-book-one-zh-pdf',
    purchaseState: record?.purchase_state || 'payment_pending',
    accessGranted:
      record?.purchase_state === 'purchased' &&
      record?.entitlement_status === 'active',
    deliveryState: record?.watermark_status || 'pending',
    downloadReady:
      record?.watermark_status === 'ready' &&
      Boolean(record?.watermarked_object_key),
    receipt
  };
}

export async function onRequestGet({
  request,
  env = {},
  fetch: fetcher
}) {
  try {
    const sessionId = new URL(request.url).searchParams.get('session_id');
    const session = await retrieveCheckoutSession(env, sessionId, fetcher);
    if (session.payment_status !== 'paid') {
      return json({
        success: true,
        productId: 'phios-book-one-zh-pdf',
        purchaseState: 'payment_pending',
        accessGranted: false,
        deliveryState: 'pending',
        downloadReady: false
      });
    }
    const fulfilled = await fulfillCheckout({
      env,
      session,
      origin: requestOrigin(request),
      fetcher
    });
    const record = fulfilled.purchase;
    const nowSeconds = Math.floor(Date.now() / 1000);
    const token = await signAccessSession({
      purchaseId: record.purchase_id,
      entitlementId: record.entitlement_id,
      productId: record.product_id,
      iat: nowSeconds,
      exp: nowSeconds + 2592000
    }, env.BOOK_ACCESS_TOKEN_SECRET);
    return json({
      success: true,
      ...publicAccess(record)
    }, 200, {
      'set-cookie': accessCookie(token)
    });
  } catch (error) {
    return commerceError(error, 'payment_status_failed');
  }
}

export async function onRequest(context) {
  return context.request.method === 'GET'
    ? onRequestGet(context)
    : methodNotAllowed(['GET']);
}
