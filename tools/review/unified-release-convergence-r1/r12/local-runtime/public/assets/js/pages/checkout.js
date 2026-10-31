import {
  getLocale,
  onLocaleChange,
  t
} from '../i18n.js';

const form = document.querySelector('[data-checkout-form]');
const submit = document.querySelector('[data-checkout-submit]');
const status = document.querySelector('[data-checkout-status]');
let checkoutReady = false;

function setStatus(key, fallback = '') {
  status.textContent = t(key, {}, fallback);
}

async function checkReadiness() {
  submit.disabled = true;
  setStatus('knowledge.checkout.checking');
  try {
    const response = await fetch('/api/book-one-product', {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin'
    });
    const payload = response.ok ? await response.json() : {};
    checkoutReady = payload.checkoutReady === true;
    submit.disabled = !checkoutReady;
    setStatus(
      checkoutReady
        ? 'knowledge.checkout.ready'
        : 'knowledge.checkout.notReady'
    );
  } catch {
    checkoutReady = false;
    submit.disabled = true;
    setStatus('knowledge.checkout.unavailable');
  }
}

function idempotencyKey() {
  const key = `book-one-${crypto.randomUUID()}`;
  try {
    window.sessionStorage.setItem('phios:book-one:checkout-attempt', key);
  } catch {
    // Stripe and D1 remain authoritative when sessionStorage is unavailable.
  }
  return key;
}

form?.addEventListener('submit', async event => {
  event.preventDefault();
  if (!checkoutReady || submit.disabled) return;
  if (!form.reportValidity()) return;

  submit.disabled = true;
  setStatus('knowledge.checkout.creating');
  try {
    const response = await fetch('/api/book-one-checkout', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey()
      },
      body: JSON.stringify({
        locale: getLocale(),
        acceptDigitalPolicy: form.elements.acceptDigitalPolicy.checked
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.checkoutUrl) {
      throw new Error(payload.error || 'checkout_creation_failed');
    }
    const destination = new URL(payload.checkoutUrl);
    if (destination.protocol !== 'https:' || destination.hostname !== 'checkout.stripe.com') {
      throw new Error('checkout_destination_invalid');
    }
    window.location.assign(destination.href);
  } catch {
    submit.disabled = false;
    setStatus('knowledge.checkout.failed');
  }
});

onLocaleChange(() => {
  setStatus(
    checkoutReady
      ? 'knowledge.checkout.ready'
      : 'knowledge.checkout.notReady'
  );
});

checkReadiness();
