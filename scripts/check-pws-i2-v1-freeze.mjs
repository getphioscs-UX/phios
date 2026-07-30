import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import {
  createPwsI2MigrationReconciler
} from '../functions/pws/registry/migration-reconciliation.js';
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
  freeze,
  reconciliation,
  khFreeze,
  khBlueprint,
  serviceCatalog,
  pricingPolicy,
  bookProductRegistry,
  knowledgePolicy,
  packageJson
] = await Promise.all([
  readJson('docs/pws/contracts/pws-i2-v1-freeze.json'),
  readJson('docs/pws/migrations/pws-i2-w7-migration-reconciliation-v1.json'),
  readJson(
    'docs/knowledge/kh-w3-5f-canonical-extraction-scaling-freeze-v1.json'
  ),
  readJson(
    'docs/knowledge/kh-w3-5g-book-i-knowledge-blueprint-freeze-v1.json'
  ),
  readJson('content/registry/professional-service-catalog.json'),
  readJson('content/registry/professional-pricing-policy.json'),
  readJson('content/registry/book-products.json'),
  readJson('content/knowledge/registry/canonical-extraction-policy.json'),
  readJson('package.json')
]);

assert.equal(freeze.freezeId, 'PWS-I2-v1.0.0-Frozen');
assert.equal(freeze.status, 'frozen');
assert.equal(freeze.version, '1.0.0');
assert.equal(freeze.schemaVersion, 'pws-v1');
assert.equal(freeze.baseline.repository, 'getphioscs-UX/phios');
assert.equal(freeze.baseline.branch, 'main');
assert.equal(freeze.baseline.commit, '7dc7235');
assert.equal(reconciliation.status, 'reconciled');
assert.equal(khFreeze.freezeId, 'KH-W3.5F-Frozen');
assert.equal(khBlueprint.completionId, 'KH-W3.5G-Completed');
assert.equal(khBlueprint.status, 'knowledge_hub_planning_frozen');
assert.deepEqual(freeze.scope.nextExecution, ['PWS', 'PJA']);

const expectedCommands = freeze.acceptanceConditions
  .map(item => item.command)
  .filter(Boolean);
for (const command of expectedCommands) {
  if (command === 'npm run check') continue;
  const scriptName = command.replace('npm run ', '');
  assert.equal(
    typeof packageJson.scripts[scriptName],
    'string',
    `Missing acceptance script: ${scriptName}`
  );
}

const database = new DatabaseSync(':memory:');
database.exec('PRAGMA foreign_keys = ON;');
const db = createSqliteD1Adapter(database);
const migrations = loadRuntimeMigrations(process.cwd()).migrations;
await applyRuntimeMigrations({
  db,
  migrations,
  now: () => '2026-07-30T08:00:00.000Z'
});
let sequence = 0;
const universalRegistry = createUniversalRegistry({
  db,
  clock: () => '2026-07-30T08:30:00.000Z',
  createId: prefix => `${prefix}_${++sequence}`
});
await createPwsI2MigrationReconciler({
  universalRegistry
}).reconcile({
  service_catalog: serviceCatalog,
  pricing_policy: pricingPolicy,
  book_product_registry: bookProductRegistry,
  knowledge_policy: knowledgePolicy,
  report_types: PROFESSIONAL_REPORT_TYPES
}, {
  actor_id: 'pws_governance',
  correlation_id: 'pws_i2_v1_freeze_acceptance'
});

const objectCounts = Object.fromEntries(database.prepare(`
  SELECT object_type, COUNT(*) AS count
  FROM pws_registry_objects GROUP BY object_type
`).all().map(row => [row.object_type, row.count]));
const objectTotal = database.prepare(`
  SELECT COUNT(*) AS count FROM pws_registry_objects
`).get().count;
const relationshipTotal = database.prepare(`
  SELECT COUNT(*) AS count FROM pws_registry_relationships
`).get().count;

assert.equal(objectTotal, freeze.canonicalAcceptanceSnapshot.registryObjects);
assert.equal(
  relationshipTotal,
  freeze.canonicalAcceptanceSnapshot.registryRelationships
);
assert.equal(objectCounts.Capability, 7);
assert.equal(objectCounts.CredentialDefinition, 7);
assert.equal(objectCounts.Method, 6);
assert.equal(objectCounts.Service, 18);
assert.equal(objectCounts.ProductType, 6);
assert.equal(objectCounts.Product, 2);
assert.equal(objectCounts.Offer, 2);
assert.equal(objectCounts.PublishedAssetType, 7);
assert.equal(objectCounts.DeliverableType, 5);
assert.equal(migrations.length, 5);

assert.equal(freeze.frozenBoundaries.coreRuntimeAuthorityPreserved, true);
assert.equal(freeze.frozenBoundaries.pkrKnowledgeAuthorityPreserved, true);
assert.equal(freeze.frozenBoundaries.legacyReadCompatibilityPreserved, true);
assert.equal(freeze.frozenBoundaries.legacyWriteAuthorityPreserved, false);
assert.equal(freeze.frozenBoundaries.secondSourceOfTruthAllowed, false);
assert.equal(
  freeze.frozenBoundaries.paymentCreatesProfessionalResponsibility,
  false
);
assert.equal(
  freeze.frozenBoundaries.registryPresenceCreatesContentRequirement,
  false
);
assert.equal(
  freeze.frozenBoundaries.unapprovedProfessionalPriceActivated,
  false
);
assert.equal(freeze.frozenBoundaries.newD1MigrationAfter0005Added, false);
assert.equal(freeze.frozenBoundaries.pageBehaviourChanged, false);

database.close();
console.log('✓ PWS-I2 v1.0.0 Acceptance and Freeze passed.');
console.log('  W0–W7, KH-W3.5F and KH-W3.5G acceptance evidence is closed.');
console.log('  71 Registry objects and 70 relationships reconcile from the frozen baseline.');
console.log('  Core Runtime, PKR, price, payment, production and D1 boundaries remain closed.');
console.log('  State: PWS-I2-v1.0.0-Frozen.');
