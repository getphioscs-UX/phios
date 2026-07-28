import {
  markWatermarkFailed,
  markWatermarkReady,
  watermarkJobById
} from '../commerce/book-commerce-store.js';
import {
  sendReceiptAndDelivery
} from '../commerce/book-delivery.js';
import {
  verifyHmacHex
} from '../commerce/commerce-crypto.js';
import {
  commerceError,
  json,
  methodNotAllowed,
  requestOrigin
} from '../commerce/commerce-http.js';

export async function onRequestPost({
  request,
  env = {},
  fetch: fetcher
}) {
  try {
    const rawBody = await request.text();
    const timestamp = Number(request.headers.get('x-phios-timestamp'));
    const signature = request.headers.get('x-phios-signature');
    if (
      !Number.isInteger(timestamp) ||
      Math.abs(Math.floor(Date.now() / 1000) - timestamp) > 300 ||
      !await verifyHmacHex(
        env.BOOK_WATERMARK_SERVICE_TOKEN,
        `${timestamp}.${rawBody}`,
        signature,
        'watermark-service'
      )
    ) {
      throw Object.assign(new Error('Watermark callback signature is invalid.'), {
        status: 401,
        code: 'watermark_callback_unauthorized'
      });
    }
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      throw Object.assign(new Error('Watermark callback JSON is invalid.'), {
        status: 400,
        code: 'watermark_callback_json_invalid'
      });
    }
    const job = await watermarkJobById(env, body.jobId);
    if (!job) {
      throw Object.assign(new Error('Watermark job was not found.'), {
        status: 404,
        code: 'watermark_job_not_found'
      });
    }
    if (body.status === 'failed') {
      await markWatermarkFailed({
        env,
        watermarkJobId: job.watermark_job_id,
        errorCode: String(body.errorCode || 'watermark_service_failed')
      });
      return json({ success: true, status: 'failed' });
    }
    if (
      body.status !== 'completed' ||
      body.destinationObjectKey !== job.destination_object_key
    ) {
      throw Object.assign(new Error('Watermark callback payload is invalid.'), {
        status: 422,
        code: 'watermark_callback_invalid'
      });
    }
    const object = await env.BOOKS?.head(job.destination_object_key);
    if (!object) {
      throw Object.assign(new Error(
        'Completed watermarked PDF was not found in private R2.'
      ), {
        status: 409,
        code: 'watermarked_object_missing'
      });
    }
    await markWatermarkReady({
      env,
      watermarkJobId: job.watermark_job_id,
      destinationObjectKey: job.destination_object_key
    });
    await sendReceiptAndDelivery({
      env,
      purchaseId: job.purchase_id,
      origin: requestOrigin(request),
      fetcher
    });
    return json({ success: true, status: 'completed' });
  } catch (error) {
    return commerceError(error, 'watermark_callback_failed');
  }
}

export async function onRequest(context) {
  return context.request.method === 'POST'
    ? onRequestPost(context)
    : methodNotAllowed(['POST']);
}
