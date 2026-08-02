import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  PRODUCT_COMPONENT_TYPES,
  PRODUCT_RUNTIME_CONTRACT,
  ProductRuntimeError,
  composeProductVersion,
  createProductRuntime,
  productRuntime
} from '../functions/pws/product/product-runtime.js';
import {
  DEFAULT_PRODUCT_DEFINITIONS
} from '../functions/pws/registry/product-offer-registry.js';

assert.equal(productRuntime.contract, PRODUCT_RUNTIME_CONTRACT);
assert.equal(productRuntime.listProducts().length, 2);

const book = productRuntime.resolveProduct('phios-book-one-zh-pdf');
const legacyBook = productRuntime.resolveProduct('phios-book-one');
assert.equal(book, legacyBook);
assert.equal(book.current_version, '1.0.0');
assert.equal(book.payment_provider_independent, true);
assert.equal(book.country_independent, true);
assert.equal(book.currency_independent, true);
assert.equal(book.creates_entitlement, false);
assert.equal(book.activates_journey, false);
assert.deepEqual(productRuntime.mapLegacyProduct('phios-book-one'), {
  legacy_product_id: 'phios-book-one',
  product_code: 'phios-book-one-zh-pdf',
  read_compatibility_only: true,
  legacy_write_allowed: false
});
assert.equal(productRuntime.mapLegacyProduct('not-a-legacy-id'), null);

const bookVersion = productRuntime.resolveProductVersion('phios-book-one');
const bookAccess = productRuntime.resolveComponents(
  'phios-book-one', '1.0.0', 'knowledge_access'
);
assert.equal(bookVersion.version, '1.0.0');
assert.equal(bookAccess.length, 1);
assert.equal(bookAccess[0].configuration.knowledge_asset_id, 'BOOK-I');
assert.equal(bookAccess[0].creates_entitlement, false);

const journey = productRuntime.resolveProduct('reality-journey-pass-v1');
const journeyAccess = productRuntime.resolveComponents(
  journey.product_code, null, 'journey_access'
)[0];
assert.equal(journeyAccess.configuration.journey_type, 'personal_reality_journey');
assert.equal(journeyAccess.configuration.journey_count, 1);
assert.equal(journeyAccess.activates_journey, false);
assert.equal(journeyAccess.creates_professional_assignment, false);

const composed = composeProductVersion({
  version: '2.0.0',
  status: 'active',
  effective_at: '2026-08-02T00:00:00.000Z',
  components: [
    {component_code:'knowledge',component_type:'knowledge_access',configuration:{knowledge_asset_id:'BOOK-I',access_scope:'full_asset'}},
    {component_code:'journey',component_type:'journey_access',configuration:{journey_type:'personal_reality_journey',method_code:'reality_journey',journey_count:1}},
    {component_code:'professional',component_type:'professional_service_access',configuration:{service_code:'financial_reality_review',eligibility_required:true,consent_required:true,assignment_required:true}},
    {component_code:'membership',component_type:'membership_access',configuration:{membership_tier:'reader'}},
    {component_code:'credit',component_type:'service_credit',configuration:{service_code:'financial_reality_review',units:1}}
  ]
});
assert.deepEqual(
  composed.components.map(item => item.component_type),
  PRODUCT_COMPONENT_TYPES
);
assert.equal(composed.creates_entitlement, false);
assert.equal(composed.activates_journey, false);
assert(Object.isFrozen(composed));
assert(composed.components.every(Object.isFrozen));

const versionedRuntime = createProductRuntime({ products: [{
  product_code: 'version-test-product',
  display_name: 'Version Test Product',
  product_type_code: 'knowledge_product',
  state: 'active',
  current_version: '2.0.0',
  versions: [
    {...composed, version:'1.0.0', status:'superseded', effective_at:'2026-08-01T00:00:00.000Z'},
    composed
  ]
}] });
assert.equal(versionedRuntime.resolveProductVersion('version-test-product').version, '2.0.0');
assert.equal(versionedRuntime.resolveProductVersion('version-test-product', '1.0.0').status, 'superseded');

for (const forbidden of [
  { currency: 'MYR' },
  { country: 'MY' },
  { payment_provider: 'stripe' },
  { amount_minor: 8900 },
  { entitlement_id: 'ent_legacy' },
  { journey_id: 'journey_legacy' }
]) {
  assert.throws(() => composeProductVersion({
    version: '1.0.0',
    status: 'active',
    effective_at: '2026-08-02T00:00:00.000Z',
    components: [{
      component_code: 'knowledge',
      component_type: 'knowledge_access',
      configuration: {
        knowledge_asset_id: 'BOOK-I',
        access_scope: 'full_asset',
        nested: forbidden
      }
    }]
  }), error => error instanceof ProductRuntimeError &&
    error.code === 'PWS_PRODUCT_COMMERCIAL_BINDING_FORBIDDEN');
}

assert.throws(
  () => productRuntime.resolveProduct('missing-product'),
  error => error.code === 'PWS_PRODUCT_NOT_FOUND'
);
assert.throws(
  () => productRuntime.resolveProductVersion(book.product_code, '9.9.9'),
  error => error.code === 'PWS_PRODUCT_VERSION_NOT_FOUND'
);

const registryBook = DEFAULT_PRODUCT_DEFINITIONS.find(
  item => item.product_code === book.product_code
);
const registryJourney = DEFAULT_PRODUCT_DEFINITIONS.find(
  item => item.product_code === journey.product_code
);
assert.equal(registryBook.product_version, book.current_version);
assert.equal(registryBook.knowledge_asset_id, 'BOOK-I');
assert.equal(registryBook.offer.currency, 'MYR');
assert.equal(registryJourney.product_version, journey.current_version);
assert.equal(registryJourney.journey_type, 'personal_reality_journey');
assert.equal('currency' in book, false);
assert.equal('offer' in book, false);

const contract = JSON.parse(fs.readFileSync(
  new URL('../docs/pws/product/pws-i4-w1-product-runtime-contract-v1.json', import.meta.url)
));
assert.equal(contract.contractId, PRODUCT_RUNTIME_CONTRACT);
assert.equal(contract.productRules.paymentProviderIndependent, true);
assert.equal(contract.productRules.createsEntitlement, false);
assert.equal(contract.productRules.activatesJourney, false);
assert.equal(contract.storage.migrationAdded, false);
assert.equal(contract.freeze, 'PWS-I4-W1-Passed');

console.log('✓ PWS-I4-W1 Product Runtime passed.');
console.log('  Book I and Reality Journey Pass resolve through versioned, composable Product Components.');
console.log('  Product carries no Provider, country, currency, Entitlement creation or Journey activation.');
console.log('  Legacy Product mapping remains read-only. Freeze: PWS-I4-W1-Passed.');
