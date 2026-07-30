import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import {
  createProfessionalRegistry,
  PROFESSIONAL_REGISTRY_TYPES,
  PROFESSIONAL_STATUSES
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
  now: () => '2026-07-30T02:00:00.000Z'
});

let sequence = 0;
const universalRegistry = createUniversalRegistry({
  db,
  clock: () => '2026-07-30T02:30:00.000Z',
  createId: prefix => `${prefix}_${++sequence}`
});
const registry = createProfessionalRegistry({ universalRegistry });
const writeContext = {
  actor_id: 'pws_governance',
  correlation_id: 'pws_i2_w2_acceptance'
};

const firstSeed = await registry.seedDefaults(writeContext);
assert.deepEqual(firstSeed, { created: 11, existing: 0, total: 11 });
const secondSeed = await registry.seedDefaults(writeContext);
assert.deepEqual(secondSeed, { created: 0, existing: 11, total: 11 });

assert.deepEqual(
  (await registry.list(PROFESSIONAL_REGISTRY_TYPES.professionalStatus))
    .map(item => item.metadata.value).sort(),
  [...PROFESSIONAL_STATUSES].sort()
);
assert.equal(
  (await registry.list(PROFESSIONAL_REGISTRY_TYPES.professionalType)).length,
  2
);
assert.equal(
  (await registry.list(PROFESSIONAL_REGISTRY_TYPES.verificationType)).length,
  5
);

const jurisdiction = await registry.registerJurisdiction({
  country_code: 'MY',
  name: 'Malaysia',
  regulatory_scope: { source: 'authoritative_policy_required' }
}, writeContext);
assert.equal(jurisdiction.record.metadata.country_code, 'MY');

const organization = await registry.registerOrganization({
  code: 'acceptance_fixture',
  name: 'Acceptance Fixture Organization',
  legal_name: 'Acceptance Fixture Organization',
  jurisdiction_ids: [jurisdiction.record.object_id],
  identifiers: { fixture_only: true }
}, writeContext);
assert.equal(
  organization.record.metadata.jurisdiction_ids[0],
  'pws.jurisdiction.MY'
);
assert.equal(
  (await registry.list(PROFESSIONAL_REGISTRY_TYPES.organization)).length,
  1
);

await assert.rejects(
  () => registry.registerProfessionalStatus(
    { code: 'approved' },
    writeContext
  ),
  RegistryValidationError
);
await assert.rejects(
  () => registry.registerJurisdiction(
    { country_code: 'Malaysia', name: 'Invalid' },
    writeContext
  ),
  RegistryValidationError
);
await assert.rejects(
  () => registry.registerOrganization({
    code: 'invalid_fixture',
    name: 'Invalid',
    legal_name: 'Invalid',
    jurisdiction_ids: ['pws.jurisdiction.ZZ']
  }, writeContext),
  RegistryValidationError
);
await assert.rejects(
  () => registry.registerJurisdiction({
    country_code: 'MY',
    name: 'Conflicting Malaysia Name'
  }, writeContext),
  RegistryValidationError
);

const audits = database.prepare(`
  SELECT COUNT(*) AS value FROM pws_registry_audit
`).get();
const outbox = database.prepare(`
  SELECT COUNT(*) AS value FROM pws_registry_outbox
`).get();
assert.equal(Number(audits.value), 13);
assert.equal(Number(outbox.value), 13);
assert.equal(loadRuntimeMigrations(process.cwd()).migrations.length, 5);

database.close();
console.log('✓ PWS-I2-W2 Professional Registry passed.');
console.log('  Professional Type 2; frozen Professional Status 4.');
console.log('  Jurisdiction, Organization and Verification Type registration verified.');
console.log('  Universal Registry, Audit and Event Outbox reused; no Migration added.');
