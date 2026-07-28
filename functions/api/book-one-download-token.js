import {
  issueDownloadToken,
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

export async function onRequestPost({ request, env = {} }) {
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
    if (
      !record ||
      record.purchase_state !== 'purchased' ||
      record.entitlement_status !== 'active'
    ) {
      throw Object.assign(new Error('Book I entitlement is not active.'), {
        status: 403,
        code: 'book_entitlement_inactive'
      });
    }
    if (
      record.watermark_status !== 'ready' ||
      !record.watermarked_object_key
    ) {
      throw Object.assign(new Error(
        'The purchaser-watermarked PDF is still being prepared.'
      ), {
        status: 409,
        code: 'watermarked_book_not_ready'
      });
    }
    const token = await issueDownloadToken({
      env,
      entitlementId: record.entitlement_id
    });
    return json({
      success: true,
      downloadUrl:
        `/api/book-one-download?token=${encodeURIComponent(token.rawToken)}`,
      expiresAt: token.expiresAt,
      maxUses: token.maxUses
    }, 201);
  } catch (error) {
    return commerceError(error, 'download_token_failed');
  }
}

export async function onRequest(context) {
  return context.request.method === 'POST'
    ? onRequestPost(context)
    : methodNotAllowed(['POST']);
}
