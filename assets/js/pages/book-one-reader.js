import { normalizePurchaseState, canAccessBook } from '../knowledge/purchase-state.js';

const guard = document.querySelector('[data-access-guard]');
const stateOutput = document.querySelector('[data-access-state]');

async function resolveAccess() {
  try {
    const response = await fetch('/api/book-one-access', {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin'
    });
    const payload = response.ok ? await response.json() : {};
    const state = normalizePurchaseState(payload.purchaseState);

    stateOutput.textContent = state;
    guard.dataset.accessGranted = String(canAccessBook(state) && payload.accessGranted === true);
  } catch {
    stateOutput.textContent = 'not_purchased';
    guard.dataset.accessGranted = 'false';
  }
}

resolveAccess();
