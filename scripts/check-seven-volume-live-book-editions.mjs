import assert from 'node:assert/strict';
import { STRIPE_PRODUCT_REGISTRY, commerceProduct } from '../functions/pws/commercial/stripe-product-registry.js';
import { bookLanguageIdentity, resolveBookPdfSource, requireBookPdfReadiness } from '../functions/commerce/book-product-registry.js';
import { commerceStripeProduct } from '../functions/commerce/commerce-environment.js';

// No Stripe request, R2 request, payment, production mutation, or paid provider call.
const prices = { 1: 8900, 2: 8900, 3: 8900, 4: 8900, 5: 10900, 6: 10900, 7: 5900 };
const live = STRIPE_PRODUCT_REGISTRY.filter(p => p.liveOnly);
assert.equal(live.length, 14, 'seven volumes x two separately purchased editions');
const productIds = new Set(), priceIds = new Set(), entitlementIds = new Set();
for (const product of live) {
  const identity = bookLanguageIdentity(product.productId);
  assert.ok(identity, 'each Live SKU resolves a numbered book/language');
  const { volume, language } = identity;
  assert.ok(volume >= 1 && volume <= 7);
  assert.equal(product.language, language);
  assert.equal(product.publicationVolume, volume);
  assert.equal(product.amountMinor, prices[volume]);
  assert.equal(product.currency, 'MYR');
  assert.equal(product.deliveryFormat, 'FULL_PDF_DOWNLOAD');
  assert.equal(product.requiresBookPdfReadiness, true);
  assert.equal(product.fulfillmentType, 'WATERMARKED_PDF');
  assert.ok(product.liveProductId?.startsWith('prod_'));
  assert.ok(product.livePriceId?.startsWith('price_'));
  assert.ok(!product.qaPriceId && !product.qaProductId, 'Live-only SKU cannot borrow QA identity');
  assert.equal(commerceProduct(product.productId), product);
  assert.equal(commerceStripeProduct(product, 'LIVE').qaPriceId, product.livePriceId);
  assert.ok(!productIds.has(product.productId)); productIds.add(product.productId);
  assert.ok(!priceIds.has(product.livePriceId)); priceIds.add(product.livePriceId);
  assert.ok(!entitlementIds.has(product.entitlementPolicy)); entitlementIds.add(product.entitlementPolicy);
}
for (let n=1;n<=7;n++) {
  for (const suffix of ['ZH','EN']) {
    const id = `COM-BOOK-${n}-${suffix}`;
    assert.ok(productIds.has(id), `missing live language product ${id}`);
    assert.equal(bookLanguageIdentity(id)?.volume,n);
  }
}
for (let n=1;n<=4;n++) {
  const historic = `COM-BOOK-0${n}-EN`;
  assert.equal(bookLanguageIdentity(historic)?.volume,n,'historical QA language identity retained');
  assert.equal(commerceProduct(historic).qaOnly,true);
}
assert.equal(bookLanguageIdentity('COM-BOOK-8-EN'),null,'Book VIII cannot enter paid language route');
assert.equal(STRIPE_PRODUCT_REGISTRY.some(p=>p.publicationVolume===8&&p.active),false,'Book VIII never sold');
for (let n=5;n<=7;n++) {
  const legacy=STRIPE_PRODUCT_REGISTRY.find(p=>p.category==='BOOK'&&p.publicationVolume===n&&!p.language);
  assert.equal(legacy?.checkoutBlockedReason,'BOOK_LANGUAGE_VERSION_REQUIRED');
}
// Validate that an English source can only be the private manuscript bucket.
const sha='a'.repeat(64);
const edition='COM-BOOK-7-EN';
const candidate={binding:'MANUSCRIPTS',objectKey:'books/book-7/en/PHI-OS-Book-7-en-v1.pdf',sourceSha256:sha,byteSize:1024,pageCount:300};
const env={COMMERCE_BOOK_SOURCE_VERSIONS_JSON:JSON.stringify({[edition]:candidate})};
assert.equal(resolveBookPdfSource(env,edition).objectKey,candidate.objectKey);
assert.throws(()=>resolveBookPdfSource({COMMERCE_BOOK_SOURCE_VERSIONS_JSON:JSON.stringify({[edition]:{...candidate,binding:'BOOKS'}})},edition),/Verified private PDF source/);
await assert.rejects(()=>requireBookPdfReadiness(env,edition),error=>error?.code==='book_pdf_delivery_not_ready');
console.log('PASS: 14 Stripe Live edition identities, prices, entitlements, legacy boundaries and fail-closed R2 source.');
