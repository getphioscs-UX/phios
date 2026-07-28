import { BOOK_ONE_PRODUCT } from './book-product-registry.js';
import {
  decryptSensitive,
  hmacHex
} from './commerce-crypto.js';
import {
  deliveryRecordForPurchase,
  issueDownloadToken,
  markWatermarkFailed,
  markWatermarkProcessing,
  markWatermarkReady,
  updateDeliveryStatus,
  watermarkJobForPurchase
} from './book-commerce-store.js';

async function signedServiceRequest({
  env,
  path,
  payload,
  fetcher = fetch
}) {
  const base = String(env.BOOK_WATERMARK_SERVICE_URL || '').replace(/\/+$/, '');
  const token = String(env.BOOK_WATERMARK_SERVICE_TOKEN || '');
  if (!base || !token) {
    throw Object.assign(new Error('Watermark service is not configured.'), {
      code: 'watermark_service_not_configured'
    });
  }
  const body = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = await hmacHex(
    token,
    `${timestamp}.${body}`,
    'watermark-service'
  );
  return fetcher(`${base}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-phios-timestamp': String(timestamp),
      'x-phios-signature': signature
    },
    body
  });
}

export async function dispatchWatermark({
  env,
  purchaseId,
  origin,
  fetcher = fetch,
  clock = Date.now
}) {
  const job = await watermarkJobForPurchase(env, purchaseId);
  if (!job) throw new Error('Watermark job was not created.');
  if (job.job_status === 'completed') return { status: 'completed', job };
  if (job.job_status === 'processing') return { status: 'processing', job };

  await markWatermarkProcessing(env, job.watermark_job_id, clock);
  const watermark = JSON.parse(await decryptSensitive(
    job.watermark_payload_ciphertext,
    env.BOOK_ACCESS_TOKEN_SECRET
  ));

  let response;
  try {
    response = await signedServiceRequest({
      env,
      path: '/jobs',
      payload: {
        jobId: job.watermark_job_id,
        sourceObjectKey: job.source_object_key,
        destinationObjectKey: job.destination_object_key,
        watermark,
        callbackUrl: `${String(
          env.PHIOS_PUBLIC_ORIGIN || origin || ''
        ).replace(/\/+$/, '')}/api/book-one-watermark-complete`
      },
      fetcher
    });
  } catch (error) {
    await markWatermarkFailed({
      env,
      watermarkJobId: job.watermark_job_id,
      errorCode: error?.code || 'watermark_dispatch_failed',
      clock
    });
    throw error;
  }

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    // Status validation below is authoritative.
  }
  if (!response.ok) {
    await markWatermarkFailed({
      env,
      watermarkJobId: job.watermark_job_id,
      errorCode: 'watermark_service_rejected',
      clock
    });
    throw new Error('Watermark service rejected the job.');
  }

  if (payload.status === 'completed') {
    const destination = String(
      payload.destinationObjectKey || job.destination_object_key
    );
    if (destination !== job.destination_object_key) {
      throw new Error('Watermark service returned an unexpected object key.');
    }
    const object = await env.BOOKS.head(destination);
    if (!object) throw new Error('Watermarked PDF was not found in private R2.');
    await markWatermarkReady({
      env,
      watermarkJobId: job.watermark_job_id,
      destinationObjectKey: destination,
      clock
    });
    return { status: 'completed', job: { ...job, destination_object_key: destination } };
  }
  return { status: 'processing', job };
}

function receiptEmail({ receipt, downloadUrl, name }) {
  const greeting = name ? `Hello ${name},` : 'Hello,';
  const text = [
    greeting,
    '',
    `Your payment for ${receipt.productTitle} was received.`,
    `Receipt: ${receipt.receiptNumber}`,
    `Amount: ${receipt.displayAmount} ${receipt.currency}`,
    '',
    'Your purchaser-watermarked PDF is ready. The secure link expires in 72 hours and permits up to 3 downloads:',
    downloadUrl,
    '',
    'This copy is licensed to the purchaser for personal use only.',
    'PHI OS'
  ].join('\n');
  const escape = value => String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
  const html = `
    <p>${escape(greeting)}</p>
    <p>Your payment for <strong>${escape(receipt.productTitle)}</strong> was received.</p>
    <p>Receipt: <strong>${escape(receipt.receiptNumber)}</strong><br>
    Amount: <strong>${escape(receipt.displayAmount)} ${escape(receipt.currency)}</strong></p>
    <p>Your purchaser-watermarked PDF is ready. This secure link expires in
    72 hours and permits up to 3 downloads.</p>
    <p><a href="${escape(downloadUrl)}">Download your Book I PDF</a></p>
    <p>This copy is licensed to the purchaser for personal use only.</p>
    <p>PHI OS</p>
  `;
  return { text, html };
}

export async function sendReceiptAndDelivery({
  env,
  purchaseId,
  origin,
  fetcher = fetch,
  clock = Date.now
}) {
  const record = await deliveryRecordForPurchase(env, purchaseId);
  if (!record) throw new Error('Purchase delivery record is missing.');
  if (record.delivery_status === 'sent') return { status: 'sent', replay: true };
  if (
    record.purchase_state !== 'purchased' ||
    record.entitlement_status !== 'active' ||
    record.watermark_status !== 'ready'
  ) {
    return { status: 'pending', reason: 'watermark_or_entitlement_not_ready' };
  }

  const apiKey = String(env.RESEND_API_KEY || '');
  const from = String(env.BOOK_RECEIPT_FROM_EMAIL || '');
  if (!apiKey.startsWith('re_') || !from.includes('@')) {
    return { status: 'pending', reason: 'receipt_sender_not_configured' };
  }
  const secret = env.BOOK_ACCESS_TOKEN_SECRET;
  const email = await decryptSensitive(record.buyer_email_ciphertext, secret);
  const name = record.buyer_name_ciphertext
    ? await decryptSensitive(record.buyer_name_ciphertext, secret)
    : '';
  const token = await issueDownloadToken({
    env,
    entitlementId: record.entitlement_id,
    purpose: 'delivery_email',
    lifetimeSeconds: BOOK_ONE_PRODUCT.emailTokenLifetimeSeconds,
    maxUses: BOOK_ONE_PRODUCT.emailTokenMaxUses,
    clock
  });
  const downloadUrl =
    `${origin}/api/book-one-download?token=${encodeURIComponent(token.rawToken)}`;
  const content = receiptEmail({
    receipt: JSON.parse(record.receipt_json),
    downloadUrl,
    name
  });

  let response;
  try {
    response = await fetcher('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
        'idempotency-key': `book-delivery/${purchaseId}`
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: `PHI OS receipt ${record.receipt_number} and Book I delivery`,
        text: content.text,
        html: content.html
      })
    });
  } catch {
    await updateDeliveryStatus({
      env,
      purchaseId,
      status: 'failed',
      errorCode: 'receipt_provider_unreachable',
      clock
    });
    throw new Error('Receipt provider could not be reached.');
  }

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    // The normalized status below remains authoritative.
  }
  if (!response.ok || !payload.id) {
    await updateDeliveryStatus({
      env,
      purchaseId,
      status: 'failed',
      errorCode: 'receipt_provider_rejected',
      clock
    });
    throw new Error('Receipt provider rejected the message.');
  }
  await updateDeliveryStatus({
    env,
    purchaseId,
    status: 'sent',
    providerMessageId: payload.id,
    clock
  });
  return { status: 'sent', providerMessageId: payload.id };
}
