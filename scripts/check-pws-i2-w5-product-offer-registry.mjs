import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import {
  createCapabilityCredentialRegistry
} from '../functions/pws/registry/capability-credential-registry.js';
import {
  createMethodServiceRegistry
} from '../functions/pws/registry/method-service-registry.js';
import {
  createProductOfferRegistry,
  DEFAULT_PRODUCT_TYPE_DEFINITIONS
} from '../functions/pws/registry/product-offer-registry.js';
import {
  createProfessionalRegistry
} from '../functions/pws/registry/professional-registry.js';
import {
  RegistryValidationError
} from '../functions/pws/registry/universal-registry-schema.js';
import {
  createUniversalRegistry
} from '../functions/pws/registry/universal-registry.js';
import {
  applyRuntimeMigrations
} from '../functions/runtime/migrations/migration-runner.js';
import {
  createSqliteD1Adapter,
  loadRuntimeMigrations
} from './runtime-migration-loader.mjs';

const database = new DatabaseSync(':memory:');
database.exec('PRAGMA foreign_keys = ON;');
const db = createSqliteD1Adapter(database);
await applyRuntimeMigrations({
  db,
  migrations: loadRuntimeMigrations(process.cwd()).migrations,
  now: () => '2026-07-30T05:00:00.000Z'
});

let sequence = 0;
const universalRegistry = createUniversalRegistry({
  db,
  clock: () => '2026-07-30T05:30:00.000Z',
  createId: prefix => `${prefix}_${++sequence}`
});
const context = {
  actor_id: 'pws_governance',
  correlation_id: 'pws_i2_w5_acceptance'
};
await createProfessionalRegistry({ universalRegistry }).seedDefaults(context);
await createCapabilityCredentialRegistry({
  universalRegistry
}).seedDefaults(context);
await createMethodServiceRegistry({ universalRegistry }).seedDefaults(context);

const registry = createProductOfferRegistry({ universalRegistry });
assert.deepEqual(await registry.seedDefaults(context), {
  product_types: { created: 6, existing: 0, total: 6 },
  products: { created: 1, existing: 0, total: 1 },
  offers: { created: 1, existing: 0, total: 1 },
  relationships: { created: 3, existing: 0, total: 3 }
});
assert.deepEqual(await registry.seedDefaults(context), {
  product_types: { created: 0, existing: 6, total: 6 },
  products: { created: 0, existing: 1, total: 1 },
  offers: { created: 0, existing: 1, total: 1 },
  relationships: { created: 0, existing: 3, total: 3 }
});

const productTypes = await registry.listProductTypes();
assert.deepEqual(
  productTypes.map(item => item.metadata.value).sort(),
  DEFAULT_PRODUCT_TYPE_DEFINITIONS.map(item => item.code).sort()
);
assert(
  productTypes.every(item =>
    item.metadata.definition_only === true &&
    item.metadata.creates_entitlement === false &&
    item.metadata.creates_professional_responsibility === false
  )
);

const [product] = await registry.listProducts();
assert.equal(product.object_code, 'reality-journey-pass-v1');
assert.equal(product.canonical_name, 'Reality Journey Pass');
assert.equal(product.metadata.journey_type, 'personal_reality_journey');
assert.equal(product.metadata.professional_review_included, false);
assert.equal(product.metadata.price_held_by_offer, true);
assert.equal(product.metadata.creates_entitlement, false);
assert.equal(product.metadata.activates_journey, false);
assert.equal(product.metadata.creates_professional_entitlement, false);
assert.equal(product.metadata.creates_professional_assignment, false);
assert.equal(product.metadata.creates_professional_responsibility, false);

const [offer] = await registry.listOffers();
assert.equal(offer.object_code, 'PWS-OFFER-REALITY-JOURNEY-PASS-V1-MYR');
assert.equal(offer.metadata.amount_minor, 500);
assert.equal(offer.metadata.currency, 'MYR');
assert.equal(offer.metadata.price_source, 'pws_product_offer_registry');
assert.equal(offer.metadata.html_is_write_source, false);
assert.equal(offer.metadata.creates_entitlement, false);
assert.equal(offer.metadata.activates_journey, false);

const relationships = database.prepare(`
  SELECT relationship_type, attributes_json
  FROM pws_registry_relationships
  WHERE source_object_id IN (
    'pws.product.reality-journey-pass-v1',
    'pws.offer.reality-journey-pass-v1-myr'
  )
  ORDER BY relationship_type
`).all();
assert.deepEqual(
  relationships.map(item => item.relationship_type),
  ['offer_for_product', 'product_has_type', 'product_uses_method']
);
const methodRelationship = relationships.find(
  item => item.relationship_type === 'product_uses_method'
);
assert.equal(
  JSON.parse(methodRelationship.attributes_json)
    .entitlement_required_before_execution,
  true
);

await assert.rejects(
  () => registry.registerProductDefinition({
    product_code: 'invalid-professional-pass',
    display_name: 'Invalid Professional Pass',
    product_type_code: 'reality_journey_pass',
    method_code: 'reality_journey',
    journey_type: 'personal_reality_journey',
    professional_review_included: true,
    offer: {
      code: 'invalid-professional-pass-myr',
      amount_minor: 500,
      currency: 'MYR'
    }
  }, context),
  RegistryValidationError
);
await assert.rejects(
  () => registry.registerOfferDefinition({
    code: 'invalid-price-myr',
    name: 'Invalid Price',
    product_id: product.object_id,
    amount_minor: 5.5,
    currency: 'MYR'
  }, context),
  RegistryValidationError
);

const htmlFiles = [];
const collectHtml = async directory => {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) await collectHtml(target);
    if (entry.isFile() && entry.name.endsWith('.html')) htmlFiles.push(target);
  }
};
await collectHtml(process.cwd());
for (const file of htmlFiles) {
  const source = await fs.readFile(file, 'utf8');
  assert.equal(
    /\bRM\s*5(?:\D|$)|\bMYR\s*5(?:\D|$)/i.test(source),
    false,
    `Price must not be hard-coded in HTML: ${path.relative(process.cwd(), file)}`
  );
}

assert.equal(loadRuntimeMigrations(process.cwd()).migrations.length, 5);
database.close();
console.log('✓ PWS-I2-W5 Product and Offer Registry passed.');
console.log('  Six Product Types and the Reality Journey Pass v1 registered.');
console.log('  RM5 is held canonically as 500 MYR minor units by its Offer, not HTML.');
console.log('  Payment and Product alone create no Journey or Professional entitlement.');
console.log('  W1 Universal Registry and W4 Reality Journey Method reused; no Migration added.');
