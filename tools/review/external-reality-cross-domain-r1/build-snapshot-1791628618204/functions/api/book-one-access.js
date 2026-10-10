import {
  purchaseAccessByClaims
} from '../commerce/book-commerce-store.js';
import {
  verifyAccessSession
} from '../commerce/commerce-crypto.js';
import {
  cookieValue,
  commerceError,
  json,
  methodNotAllowed
} from '../commerce/commerce-http.js';

function locked(reason = 'purchase_required') {
  return json({
    success: true,
    productId: 'phios-book-one-zh-pdf',
    purchaseState: 'not_purchased',
    accessGranted: false,
    accessConfigured: false,
    deliveryState: 'unavailable',
    downloadReady: false,
    reason
  });
}

export async function onRequestGet({ request, env = {} }) {
  try {
    if (!env.RUNTIME_DB?.prepare || !env.BOOK_ACCESS_TOKEN_SECRET) {
      return locked('commerce_not_configured');
    }
    const claims = await verifyAccessSession(
      cookieValue(request, 'phios_book_access'),
      env.BOOK_ACCESS_TOKEN_SECRET
    );
    if (!claims) return locked('access_session_required');

    const record = await purchaseAccessByClaims(env, claims);
    if (!record) return locked('entitlement_not_found');
    const accessGranted = (
      record.purchase_state === 'purchased' &&
      record.entitlement_status === 'active' &&
      (
        !record.expires_at ||
        Date.parse(record.expires_at) > Date.now()
      )
    );
    let receipt = null;
    try {
      receipt = record.receipt_json ? JSON.parse(record.receipt_json) : null;
    } catch {
      receipt = null;
    }
    return json({
      success: true,
      productId: record.product_id,
      purchaseState: record.purchase_state,
      accessGranted,
      accessConfigured: true,
      entitlementState: record.entitlement_status,
      deliveryState: record.watermark_status,
      downloadReady:
        accessGranted &&
        record.watermark_status === 'ready' &&
        Boolean(record.watermarked_object_key),
      receipt
    });
  } catch (error) {
    return commerceError(error, 'book_access_failed');
  }
}

export async function onRequest(context) {
  return context.request.method === 'GET'
    ? onRequestGet(context)
    : methodNotAllowed(['GET']);
}
