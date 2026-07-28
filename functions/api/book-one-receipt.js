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

export async function onRequestGet({ request, env = {} }) {
  try {
    const claims = await verifyAccessSession(
      cookieValue(request, 'phios_book_access'),
      env.BOOK_ACCESS_TOKEN_SECRET
    );
    if (!claims) {
      throw Object.assign(new Error('Verified Book I access is required.'), {
        status: 401,
        code: 'book_access_required'
      });
    }
    const record = await purchaseAccessByClaims(env, claims);
    if (!record?.receipt_json) {
      throw Object.assign(new Error('Receipt was not found.'), {
        status: 404,
        code: 'receipt_not_found'
      });
    }
    return json({
      success: true,
      receipt: JSON.parse(record.receipt_json)
    });
  } catch (error) {
    return commerceError(error, 'receipt_failed');
  }
}

export async function onRequest(context) {
  return context.request.method === 'GET'
    ? onRequestGet(context)
    : methodNotAllowed(['GET']);
}
