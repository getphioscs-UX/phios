import { t } from '../i18n.js';

const title = document.querySelector('[data-payment-title]');
const message = document.querySelector('[data-payment-message]');
const state = document.querySelector('[data-payment-state]');
const receipt = document.querySelector('[data-receipt]');
const receiptNumber = document.querySelector('[data-receipt-number]');
const receiptAmount = document.querySelector('[data-receipt-amount]');
const deliveryState = document.querySelector('[data-delivery-state]');
const readAction = document.querySelector('[data-read-action]');
const retryAction = document.querySelector('[data-retry-action]');

function setFailure(key = 'knowledge.paymentSuccess.failedBody') {
  title.textContent = t('knowledge.paymentSuccess.failedTitle');
  message.textContent = t(key);
  state.textContent = 'not_purchased';
  retryAction.hidden = false;
}

async function verifyPayment() {
  const sessionId = new URLSearchParams(window.location.search).get('session_id');
  if (!sessionId) {
    setFailure('knowledge.paymentSuccess.missingSession');
    return;
  }
  try {
    const response = await fetch(
      `/api/book-one-payment-status?session_id=${encodeURIComponent(sessionId)}`,
      {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin'
      }
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'verification_failed');

    state.textContent = payload.purchaseState || 'payment_pending';
    if (payload.purchaseState === 'payment_pending') {
      title.textContent = t('knowledge.paymentSuccess.pendingTitle');
      message.textContent = t('knowledge.paymentSuccess.pendingBody');
      retryAction.hidden = false;
      return;
    }
    if (!payload.accessGranted) {
      setFailure();
      return;
    }
    title.textContent = t('knowledge.paymentSuccess.paidTitle');
    message.textContent = payload.downloadReady
      ? t('knowledge.paymentSuccess.readyBody')
      : t('knowledge.paymentSuccess.preparingBody');
    readAction.hidden = false;
    if (payload.receipt) {
      receipt.hidden = false;
      receiptNumber.textContent = payload.receipt.receiptNumber || '';
      receiptAmount.textContent =
        `${payload.receipt.displayAmount || 'RM89'} ${payload.receipt.currency || 'MYR'}`;
      deliveryState.textContent = payload.deliveryState || 'pending';
    }
  } catch {
    setFailure();
  }
}

verifyPayment();
