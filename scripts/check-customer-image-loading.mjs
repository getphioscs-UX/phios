import assert from 'node:assert/strict';
import { hydrateCustomerAssets } from '../assets/customer-ui/js/assets.js';

// Simulate native lazy loading: display:none images never receive load.
class ImageNode extends EventTarget {
  dataset = { cxAsset: 'TEST' };
  hidden = false;
  loading = '';
  naturalWidth = 0;
  complete = false;
  fallback = { hidden: true, dataset: {} };
  parentElement = { querySelector: () => this.fallback };
  hasAttribute() { return false; }
  removeAttribute() {}
  set src(value) {
    this.url = value;
    if (this.hidden && this.loading === 'lazy') return;
    queueMicrotask(() => {
      this.naturalWidth = value.endsWith('bad.webp') ? 0 : 800;
      this.dispatchEvent(new Event(this.naturalWidth ? 'load' : 'error'));
    });
  }
}
globalThis.HTMLImageElement = ImageNode;
globalThis.document = { documentElement: { lang: 'en' } };
globalThis.fetch = async () => ({ ok: true, json: async () => ({ entries: [
  { assetId: 'TEST', available: true, publicUrl: 'https://assets.test/good.webp' },
  { assetId: 'BAD', available: true, publicUrl: 'https://assets.test/bad.webp' }
] }) });
const good = new ImageNode(), bad = new ImageNode();
bad.dataset.cxAsset = 'BAD';
let timeout;
try {
  await Promise.race([
    hydrateCustomerAssets({ querySelectorAll: () => [good, bad] }),
    new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('Lazy image loading deadlocked')), 1000); })
  ]);
} finally { clearTimeout(timeout); }
assert.equal(good.hidden, false);
assert.equal(good.dataset.cxAssetState, 'ready');
assert.equal(good.fallback.hidden, true);
assert.equal(bad.hidden, true);
assert.equal(bad.dataset.cxAssetState, 'unavailable');
assert.equal(bad.fallback.hidden, false);
console.log('✓ Native lazy image layout and failed-image fallback verified.');
