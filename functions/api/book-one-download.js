import {
  consumeDownloadToken,
  recordDownload
} from '../commerce/book-commerce-store.js';
import {
  hmacHex
} from '../commerce/commerce-crypto.js';
import {
  cleanText,
  commerceError,
  methodNotAllowed
} from '../commerce/commerce-http.js';

export async function onRequestGet({ request, env = {} }) {
  try {
    const rawToken = cleanText(
      new URL(request.url).searchParams.get('token'),
      256
    );
    if (!rawToken) {
      throw Object.assign(new Error('A secure download token is required.'), {
        status: 401,
        code: 'download_token_required'
      });
    }
    const authorization = await consumeDownloadToken({ env, rawToken });
    if (!authorization) {
      throw Object.assign(new Error(
        'The download token is invalid, expired, revoked or fully used.'
      ), {
        status: 403,
        code: 'download_token_invalid'
      });
    }
    if (
      !authorization.watermarked_object_key.startsWith(
        'private/books/book-one/watermarked/'
      )
    ) {
      throw Object.assign(new Error('Unwatermarked delivery is forbidden.'), {
        status: 403,
        code: 'watermarked_delivery_required'
      });
    }
    if (!env.BOOKS?.get) {
      throw Object.assign(new Error('Private book storage is not configured.'), {
        status: 503,
        code: 'private_book_storage_not_configured'
      });
    }
    const object = await env.BOOKS.get(authorization.watermarked_object_key);
    if (!object?.body) {
      throw Object.assign(new Error('The protected book file is unavailable.'), {
        status: 503,
        code: 'protected_book_unavailable'
      });
    }
    const fingerprint = await hmacHex(
      env.BOOK_ACCESS_TOKEN_SECRET,
      [
        request.headers.get('cf-connecting-ip') || '',
        request.headers.get('user-agent') || ''
      ].join('|'),
      'download-audit'
    );
    await recordDownload({
      env,
      authorization,
      requestFingerprint: fingerprint
    });
    const headers = new Headers({
      'content-type': 'application/pdf',
      'content-disposition':
        'attachment; filename="PHI-OS-Book-I-Watermarked.pdf"',
      'cache-control': 'private, no-store, max-age=0',
      'content-security-policy': "default-src 'none'",
      'x-content-type-options': 'nosniff',
      'x-robots-tag': 'noindex, nofollow, noarchive'
    });
    if (Number.isFinite(Number(object.size))) {
      headers.set('content-length', String(object.size));
    }
    if (object.httpEtag) headers.set('etag', object.httpEtag);
    return new Response(object.body, { status: 200, headers });
  } catch (error) {
    return commerceError(error, 'secure_download_failed');
  }
}

export async function onRequest(context) {
  return context.request.method === 'GET'
    ? onRequestGet(context)
    : methodNotAllowed(['GET']);
}
