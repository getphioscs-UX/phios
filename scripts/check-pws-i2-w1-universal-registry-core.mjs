import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import {
  applyRuntimeMigrations
} from '../functions/runtime/migrations/migration-runner.js';
import {
  createUniversalRegistry
} from '../functions/pws/registry/universal-registry.js';
import {
  REGISTRY_SCHEMA_ID, RegistryValidationError
} from '../functions/pws/registry/universal-registry-schema.js';
import {
  createSqliteD1Adapter, loadRuntimeMigrations
} from './runtime-migration-loader.mjs';

const root = process.cwd();
const database = new DatabaseSync(':memory:');
database.exec('PRAGMA foreign_keys = ON;');
const db = createSqliteD1Adapter(database);
const { migrations } = loadRuntimeMigrations(root);
await applyRuntimeMigrations({
  db, migrations, now: () => '2026-07-30T00:00:00.000Z'
});

assert.equal(REGISTRY_SCHEMA_ID, 'phi-os.pws.universal-registry.v1');
const expectedTables = [
  'pws_registry_objects', 'pws_registry_versions',
  'pws_registry_relationships', 'pws_registry_restrictions',
  'pws_registry_audit', 'pws_registry_outbox'
];
const tables = database.prepare(`
  SELECT name FROM sqlite_schema WHERE type = 'table'
  AND name LIKE 'pws_registry_%' ORDER BY name
`).all().map(row => row.name);
assert.deepEqual(tables, [...expectedTables].sort());

let sequence = 0;
const registry = createUniversalRegistry({
  db,
  clock: () => '2026-07-30T01:00:00.000Z',
  createId: prefix => `${prefix}_${++sequence}`
});
const context = { actor_id: 'professional_1', correlation_id: 'corr_1' };
await registry.registerObject({
  object_id: 'pws.object.service.demo',
  object_code: 'PWS-SERVICE-DEMO',
  object_type: 'Service',
  canonical_name: 'Demo Service',
  owner_module: 'runtime/service',
  metadata: { source: 'canonical' }
}, context);
await registry.registerObject({
  object_id: 'pws.object.product.demo',
  object_code: 'PWS-PRODUCT-DEMO',
  object_type: 'Product',
  canonical_name: 'Demo Product',
  owner_module: 'runtime/product'
}, context);

const checksum = 'a'.repeat(64);
const version = await registry.versionStore.append({
  object_id: 'pws.object.service.demo',
  payload: { name: 'Demo Service' },
  checksum,
  created_by: 'professional_1'
});
assert.equal(version.version_number, 1);

await registry.relationshipStore.create({
  source_object_id: 'pws.object.service.demo',
  target_object_id: 'pws.object.product.demo',
  relationship_type: 'includes',
  created_by: 'professional_1'
});
await registry.restrictionStore.create({
  object_id: 'pws.object.service.demo',
  restriction_type: 'jurisdiction',
  effect: 'limit',
  scope: { countries: ['MY'] },
  reason: 'Demonstrate governed scope.',
  created_by: 'professional_1'
});

const view = await registry.query.getObjectView('pws.object.service.demo');
assert.equal(view.object.metadata.source, 'canonical');
assert.equal(view.versions.length, 1);
assert.equal(view.relationships.length, 1);
assert.equal(view.restrictions.length, 1);
assert.equal((await registry.auditStore.list(view.object.object_id)).length, 1);
assert.equal((await registry.eventOutbox.pending()).length, 2);

await registry.updateStatus(view.object.object_id, 'suspended', context);
assert.equal((await registry.query.getObject(view.object.object_id)).status, 'suspended');
assert.equal((await registry.auditStore.list(view.object.object_id)).length, 2);
assert.equal((await registry.eventOutbox.pending()).length, 3);

await assert.rejects(
  () => registry.registerObject({
    object_id: '', object_code: 'INVALID', object_type: 'Service',
    canonical_name: 'Invalid', owner_module: 'runtime/service'
  }, context),
  RegistryValidationError
);

database.close();
console.log('✓ PWS-I2-W1 Universal Registry Core passed.');
console.log('  Schema, Version, Relationship, Restriction, Audit and Outbox stores verified.');
console.log('  Internal Registry Query API and D1 migration 0005 verified.');
