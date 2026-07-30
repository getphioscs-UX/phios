import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import {
  createCapabilityCredentialRegistry,
  DEFAULT_CAPABILITY_DEFINITIONS
} from '../functions/pws/registry/capability-credential-registry.js';
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
  now: () => '2026-07-30T03:00:00.000Z'
});

let sequence = 0;
const universalRegistry = createUniversalRegistry({
  db,
  clock: () => '2026-07-30T03:30:00.000Z',
  createId: prefix => `${prefix}_${++sequence}`
});
const context = {
  actor_id: 'pws_governance',
  correlation_id: 'pws_i2_w3_acceptance'
};
await createProfessionalRegistry({ universalRegistry }).seedDefaults(context);

const registry = createCapabilityCredentialRegistry({ universalRegistry });
const firstSeed = await registry.seedDefaults(context);
assert.deepEqual(firstSeed, {
  capabilities: { created: 7, existing: 0, total: 7 },
  credentials: { created: 7, existing: 0, total: 7 },
  relationships: { created: 7, existing: 0, total: 7 }
});
const secondSeed = await registry.seedDefaults(context);
assert.deepEqual(secondSeed, {
  capabilities: { created: 0, existing: 7, total: 7 },
  credentials: { created: 0, existing: 7, total: 7 },
  relationships: { created: 0, existing: 7, total: 7 }
});

const capabilities = await registry.listCapabilities();
assert.deepEqual(
  capabilities.map(item => item.metadata.value).sort(),
  DEFAULT_CAPABILITY_DEFINITIONS.map(item => item.code).sort()
);
assert(
  capabilities.every(item =>
    item.metadata.definition_only === true &&
    item.metadata.grants_authority === false &&
    item.metadata.requires_active_professional === true &&
    item.metadata.requires_assignment === true &&
    item.metadata.requires_consent === true
  )
);

const financial = capabilities.find(
  item => item.metadata.value === 'financial_navigation_consultation'
);
assert.equal(financial.metadata.jurisdiction_required, true);
assert.equal(
  financial.metadata.boundaries.includes('product_neutral_only'),
  true
);
const humanDesign = capabilities.find(
  item => item.metadata.value === 'human_design_runtime_interpretation'
);
assert.equal(
  humanDesign.metadata.boundaries.includes(
    'interpretation_does_not_promote_evidence'
  ),
  true
);
const signature = capabilities.find(
  item => item.metadata.value === 'deliverable_signature'
);
assert.equal(
  signature.metadata.boundaries.includes(
    'automatic_or_provider_signature_forbidden'
  ),
  true
);

const credentials = await registry.listCredentialDefinitions();
assert.equal(credentials.length, 7);
assert(
  credentials.every(item =>
    item.metadata.issuer_required === true &&
    item.metadata.verification_required === true &&
    item.metadata.grants_capability === false &&
    item.metadata.grants_signature_authority === false
  )
);
const relationships = database.prepare(`
  SELECT * FROM pws_registry_relationships
  WHERE relationship_type = 'credential_required_for_capability'
`).all();
assert.equal(relationships.length, 7);

await assert.rejects(
  () => registry.registerCapabilityDefinition({
    code: 'unbounded',
    name: 'Unbounded',
    domain: 'test',
    definition: 'Invalid capability without a boundary.'
  }, context),
  RegistryValidationError
);
await assert.rejects(
  () => registry.registerCredentialDefinition({
    code: 'unknown_capability_qualification',
    name: 'Unknown',
    capability_code: 'unknown_capability',
    evidence_kind: 'qualification_or_authority_evidence',
    verification_type_id: 'pws.verification-type.credential',
    expiry_policy: 'issuer_or_governance_policy_defined'
  }, context),
  RegistryValidationError
);

assert.equal(loadRuntimeMigrations(process.cwd()).migrations.length, 5);
database.close();
console.log('✓ PWS-I2-W3 Capability and Credential Registry passed.');
console.log('  Seven Capability Definitions and seven Credential Requirements registered.');
console.log('  Credential evidence does not grant Capability or Signature Authority.');
console.log('  W1 Universal Registry and W2 Verification Type reused; no Migration added.');
