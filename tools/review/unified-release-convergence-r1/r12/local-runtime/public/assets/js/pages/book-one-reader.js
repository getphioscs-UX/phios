import {
  normalizePurchaseState
} from '../knowledge/purchase-state.js';
import { t } from '../i18n.js';

const guard = document.querySelector('[data-access-guard]');
const title = document.querySelector('[data-access-title]');
const body = document.querySelector('[data-access-body]');
const stateOutput = document.querySelector('[data-access-state]');
const delivery = document.querySelector('[data-protected-delivery]');
const deliveryMessage = document.querySelector('[data-delivery-message]');
const checkoutAction = document.querySelector('[data-checkout-action]');
const downloadButton = document.querySelector('[data-download-book]');
const downloadStatus = document.querySelector('[data-download-status]');
const receipt = document.querySelector('[data-access-receipt]');
const receiptNumber = document.querySelector('[data-access-receipt-number]');
const receiptAmount = document.querySelector('[data-access-receipt-amount]');

function showLocked(state = 'not_purchased') {
  const normalized = normalizePurchaseState(state);
  stateOutput.textContent = normalized;
  guard.dataset.accessGranted = 'false';
  title.textContent = t('knowledge.access.title');
  body.textContent = t('knowledge.access.body');
  delivery.hidden = true;
  checkoutAction.hidden = false;
}

function showPurchased(payload) {
  stateOutput.textContent = 'purchased';
  guard.dataset.accessGranted = 'true';
  title.textContent = t('knowledge.access.unlockedTitle');
  body.textContent = t('knowledge.access.unlockedBody');
  delivery.hidden = false;
  checkoutAction.hidden = true;
  downloadButton.hidden = payload.downloadReady !== true;
  deliveryMessage.textContent = payload.downloadReady
    ? t('knowledge.access.ready')
    : t('knowledge.access.preparing');
  if (payload.receipt) {
    receipt.hidden = false;
    receiptNumber.textContent = payload.receipt.receiptNumber || '';
    receiptAmount.textContent =
      `${payload.receipt.displayAmount || 'RM89'} ${payload.receipt.currency || 'MYR'}`;
  }
}

async function resolveAccess() {
  try {
    const response = await fetch('/api/book-one-access', {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin'
    });
    const payload = response.ok ? await response.json() : {};
    if (payload.accessGranted === true) showPurchased(payload);
    else showLocked(payload.purchaseState);
  } catch {
    showLocked();
  }
}

downloadButton?.addEventListener('click', async () => {
  downloadButton.disabled = true;
  downloadStatus.textContent = t('knowledge.access.creatingDownload');
  try {
    const response = await fetch('/api/book-one-download-token', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin'
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.downloadUrl) {
      throw new Error(payload.error || 'download_token_failed');
    }
    downloadStatus.textContent = t('knowledge.access.downloadStarting');
    window.location.assign(payload.downloadUrl);
  } catch {
    downloadStatus.textContent = t('knowledge.access.downloadFailed');
    downloadButton.disabled = false;
  }
});

resolveAccess();
