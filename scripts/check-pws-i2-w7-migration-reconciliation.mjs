import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import {
  BOOK_ONE_PRODUCT
} from '../functions/commerce/book-product-registry.js';
import {
  createPwsI2MigrationReconciler,
  LEGACY_CAPABILITY_ID_MAP,
  LEGACY_METHOD_ID_MAP,
  LEGACY_REPORT_TYPE_MAP,
  LEGACY_SERVICE_METHOD_MAP,
  PWS_I2_MIGRATION_RECONCILIATION_VERSION,
  reconcileLegacyIdentifiers
} from '../functions/pws/registry/migration-reconciliation.js';
import {
  RegistryValidationError
} from '../functions/pws/registry/universal-registry-schema.js';
import {
  createUniversalRegistry
} from '../functions/pws/registry/universal-registry.js';
import {
  PROFESSIONAL_REPORT_TYPES
} from '../functions/professional/reports/professional-report-constants.js';
import {
  applyRuntimeMigrations
} from '../functions/runtime/migrations/migration-runner.js';
import {
  createSqliteD1Adapter,
  loadRuntimeMigrations
} from './runtime-migration-loader.mjs';

const readJson = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const [
  serviceCatalog,
  pricingPolicy,
  bookProductRegistry,
  knowledgePolicy,
  nodesBefore,
  questionsBefore,
  reconciliationEvidence
] = await Promise.all([
  readJson('content/registry/professional-service-catalog.json'),
  readJson('content/registry/professional-pricing-policy.json'),
  readJson('content/registry/book-products.json'),
  readJson('content/knowledge/registry/canonical-extraction-policy.json'),
  readJson('content/knowledge/registry/nodes.json'),
  readJson('content/knowledge/registry/supporting-questions.json'),
  readJson('docs/pws/migrations/pws-i2-w7-migration-reconciliation-v1.json')
]);

assert.equal(
  reconciliationEvidence.migrationId,
  'PWS-I2-W7-Migration-and-Reconciliation-v1'
);
assert.equal(reconciliationEvidence.status, 'reconciled');
assert.equal(reconciliationEvidence.baseline.commit, '7dc7235');
assert.equal(reconciliationEvidence.scopes.length, 8);
assert.deepEqual(
  reconciliationEvidence.scopes.map(item => item.scope),
  [
    'ServiceProduct',
    'ServiceEntitlement',
    'Legacy Method',
    'Legacy Capability',
    'Legacy Report Type',
    'Static Product Configuration',
    'Legacy Price Configuration',
    'Legacy Knowledge Configuration'
  ]
);

const database = new DatabaseSync(':memory:');
database.exec('PRAGMA foreign_keys = ON;');
const db = createSqliteD1Adapter(database);
const migrations = loadRuntimeMigrations(process.cwd()).migrations;
await applyRuntimeMigrations({
  db,
  migrations,
  now: () => '2026-07-30T07:00:00.000Z'
});

let sequence = 0;
const universalRegistry = createUniversalRegistry({
  db,
  clock: () => '2026-07-30T07:30:00.000Z',
  createId: prefix => `${prefix}_${++sequence}`
});
const context = {
  actor_id: 'pws_governance',
  correlation_id: 'pws_i2_w7_acceptance'
};
const reconciler = createPwsI2MigrationReconciler({ universalRegistry });
const input = {
  service_catalog: serviceCatalog,
  pricing_policy: pricingPolicy,
  book_product_registry: bookProductRegistry,
  knowledge_policy: knowledgePolicy,
  report_types: PROFESSIONAL_REPORT_TYPES
};

const first = await reconciler.reconcile(input, context);
assert.equal(first.migration, PWS_I2_MIGRATION_RECONCILIATION_VERSION);
assert.deepEqual(first.services, { created: 18, existing: 0, total: 18 });
assert.equal(first.report_types.reconciled, 14);
assert.equal(first.report_types.canonical_targets, 5);
assert.equal(first.professional_prices, 'deferred_until_approved');
assert.equal(first.knowledge_configuration, 'pkr_authority_preserved');
assert.equal(first.storage_migration_added, false);
assert.equal(first.legacy_deleted, false);

const second = await reconciler.reconcile(input, context);
assert.deepEqual(second.services, { created: 0, existing: 18, total: 18 });
assert.equal(second.seeded.professional.created, 0);
assert.equal(second.seeded.capability.capabilities.created, 0);
assert.equal(second.seeded.method.methods.created, 0);
assert.equal(second.seeded.product_offer.products.created, 0);
assert.equal(
  second.seeded.knowledge_deliverable.published_asset_types.created,
  0
);

assert.equal(Object.keys(LEGACY_SERVICE_METHOD_MAP).length, 18);
assert.equal(Object.keys(LEGACY_REPORT_TYPE_MAP).length, 14);
assert.equal(Object.keys(LEGACY_METHOD_ID_MAP).length, 7);
assert.equal(Object.keys(LEGACY_CAPABILITY_ID_MAP).length, 7);
assert.deepEqual(
  [...PROFESSIONAL_REPORT_TYPES].sort(),
  Object.keys(LEGACY_REPORT_TYPE_MAP).sort()
);

assert.deepEqual(
  reconcileLegacyIdentifiers({
    service_product_id: 'phios-book-one-zh-pdf',
    service_id: 'knowledge_routing'
  }),
  {
    product_id: 'phios-book-one-zh-pdf',
    service_id: 'knowledge_routing'
  }
);
assert.deepEqual(
  reconcileLegacyIdentifiers({
    service_entitlement_id: 'entitlement-001',
    service_id: 'professional_runtime_reading'
  }),
  {
    entitlement_id: 'entitlement-001',
    service_id: 'professional_runtime_reading'
  }
);
assert.throws(
  () => reconcileLegacyIdentifiers({
    service_product_id: 'legacy-product',
    product_id: 'different-product',
    service_id: 'service-1'
  }),
  RegistryValidationError
);
assert.throws(
  () => reconcileLegacyIdentifiers({
    service_entitlement_id: 'legacy-entitlement'
  }),
  RegistryValidationError
);

const serviceObjects = database.prepare(`
  SELECT metadata_json FROM pws_registry_objects
  WHERE object_type = 'Service'
`).all();
assert.equal(serviceObjects.length, 18);
assert(
  serviceObjects.every(row =>
    JSON.parse(row.metadata_json).legacy_catalog_is_write_source === false
  )
);
const forbiddenLegacyTypes = database.prepare(`
  SELECT object_type FROM pws_registry_objects
  WHERE object_type IN ('ServiceProduct', 'ServiceEntitlement', 'ReportType')
`).all();
assert.equal(forbiddenLegacyTypes.length, 0);

const offers = database.prepare(`
  SELECT object_code, metadata_json FROM pws_registry_objects
  WHERE object_type = 'Offer' ORDER BY object_code
`).all();
assert.equal(offers.length, 2);
const bookOffer = offers.find(
  item => item.object_code === 'PWS-OFFER-PHIOS-BOOK-ONE-ZH-PDF-MYR'
);
assert.equal(JSON.parse(bookOffer.metadata_json).amount_minor, 8900);
assert.equal(BOOK_ONE_PRODUCT.amountMinor, 8900);
assert.equal(BOOK_ONE_PRODUCT.currency, 'MYR');

const [nodesAfter, questionsAfter] = await Promise.all([
  readJson('content/knowledge/registry/nodes.json'),
  readJson('content/knowledge/registry/supporting-questions.json')
]);
assert.deepEqual(nodesAfter, nodesBefore);
assert.deepEqual(questionsAfter, questionsBefore);
assert.equal(migrations.length, 5);

database.close();
console.log('✓ PWS-I2-W7 Migration and Reconciliation passed.');
console.log('  ServiceProduct and ServiceEntitlement resolve to canonical objects with Service references.');
console.log('  18 Services, 7 Method aliases, 7 Capability aliases and 14 Report Types reconcile idempotently.');
console.log('  Book I Product/Offer is canonical; unapproved Professional prices remain deferred.');
console.log('  PKR remains Knowledge authority; no legacy deletion or D1 storage Migration added.');
