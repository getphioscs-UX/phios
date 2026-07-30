import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import {
  createCapabilityCredentialRegistry
} from '../functions/pws/registry/capability-credential-registry.js';
import {
  createMethodServiceRegistry,
  DEFAULT_METHOD_DEFINITIONS
} from '../functions/pws/registry/method-service-registry.js';
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
  now: () => '2026-07-30T04:00:00.000Z'
});

let sequence = 0;
const universalRegistry = createUniversalRegistry({
  db,
  clock: () => '2026-07-30T04:30:00.000Z',
  createId: prefix => `${prefix}_${++sequence}`
});
const context = {
  actor_id: 'pws_governance',
  correlation_id: 'pws_i2_w4_acceptance'
};
await createProfessionalRegistry({ universalRegistry }).seedDefaults(context);
await createCapabilityCredentialRegistry({
  universalRegistry
}).seedDefaults(context);

const registry = createMethodServiceRegistry({ universalRegistry });
assert.deepEqual(await registry.seedDefaults(context), {
  methods: { created: 5, existing: 0, total: 5 },
  relationships: { created: 4, existing: 0, total: 4 }
});
assert.deepEqual(await registry.seedDefaults(context), {
  methods: { created: 0, existing: 5, total: 5 },
  relationships: { created: 0, existing: 4, total: 4 }
});

const methods = await registry.listMethods();
assert.deepEqual(
  methods.map(item => item.metadata.value).sort(),
  DEFAULT_METHOD_DEFINITIONS.map(item => item.code).sort()
);
const professionalMethods = methods.filter(
  item => item.metadata.execution_authority === 'professional'
);
assert.equal(professionalMethods.length, 3);
assert(
  professionalMethods.every(item =>
    item.metadata.requires_active_professional === true &&
    item.metadata.capability_codes.length > 0 &&
    item.metadata.creates_professional_responsibility === false
  )
);
const systemMethods = methods.filter(
  item => item.metadata.execution_authority === 'system'
);
assert.deepEqual(
  systemMethods.map(item => item.metadata.value).sort(),
  ['knowledge_routing', 'reality_journey']
);
assert(
  systemMethods.every(item =>
    item.metadata.requires_active_professional === false &&
    item.metadata.capability_codes.length === 0 &&
    item.metadata.boundaries.includes(
      'does_not_create_professional_responsibility'
    )
  )
);

const methodCapabilities = database.prepare(`
  SELECT * FROM pws_registry_relationships
  WHERE relationship_type = 'method_requires_capability'
`).all();
assert.equal(methodCapabilities.length, 4);

const serviceResult = await registry.registerServiceDefinition({
  code: 'professional_runtime_reading',
  name: 'Professional Runtime Reading',
  definition:
    'Acceptance fixture for a bounded professional Runtime reading service.',
  method_codes: ['professional_runtime_reading'],
  deliverable_contract_id: 'contract.professional-response.v1',
  boundary_contract_id: 'phi-os.professional-service-boundaries',
  legacy_aliases: ['professional_runtime_reading']
}, context);
assert.equal(serviceResult.service.created, true);
assert.equal(serviceResult.relationships.length, 2);
assert.equal(serviceResult.service.record.metadata.legacy_catalog_is_write_source, false);
assert.deepEqual(
  serviceResult.service.record.metadata.capability_codes,
  ['professional_runtime_reading']
);
assert.equal((await registry.listServices()).length, 1);

await assert.rejects(
  () => registry.registerMethodDefinition({
    code: 'unqualified_professional_method',
    name: 'Unqualified Professional Method',
    domain: 'test',
    execution_authority: 'professional',
    definition: 'Invalid professional method.',
    boundaries: ['test_boundary']
  }, context),
  RegistryValidationError
);
await assert.rejects(
  () => registry.registerMethodDefinition({
    code: 'system_claiming_capability',
    name: 'System Claiming Capability',
    domain: 'test',
    execution_authority: 'system',
    definition: 'Invalid system method.',
    capability_codes: ['professional_runtime_reading'],
    boundaries: ['test_boundary']
  }, context),
  RegistryValidationError
);
await assert.rejects(
  () => registry.registerServiceDefinition({
    code: 'unknown_method_service',
    name: 'Unknown Method Service',
    definition: 'Invalid service.',
    method_codes: ['unknown_method'],
    deliverable_contract_id: 'contract.test',
    boundary_contract_id: 'boundary.test'
  }, context),
  RegistryValidationError
);

assert.equal(loadRuntimeMigrations(process.cwd()).migrations.length, 5);
database.close();
console.log('✓ PWS-I2-W4 Method and Service Registry passed.');
console.log('  Five Method Definitions registered; professional methods require W3 Capability.');
console.log('  System methods preserve routing, Runtime, payment and responsibility boundaries.');
console.log('  Service API requires Method, capability and contract mappings; legacy catalog is read-only.');
console.log('  W1 Universal Registry and W3 Capability Registry reused; no Migration added.');
