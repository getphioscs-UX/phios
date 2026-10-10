import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { deriveMappingDigests, validateCompatibility } from './lib/canonical-meaning-runtime/versioned-mapping-identity-v1.mjs';

const readJson = async path => JSON.parse(await fs.readFile(path, 'utf8'));
const sha = async path => crypto.createHash('sha256').update(await fs.readFile(path)).digest('hex');
const root = 'content/professional/canonical-meaning-runtime/';
const paths = {
  contract: root + 'contracts/versioned-method-meaning-mapping-registry-contract-v1.json',
  schema: root + 'schemas/versioned-method-meaning-mapping-registry-v1.schema.json',
  registry: root + 'registries/versioned-method-meaning-mapping-registry-v1.json',
  freeze: root + 'freeze/cmr-w6b-freeze-v1.json',
  w6aContract: root + 'contracts/method-to-meaning-mapping-contract-v1.json',
  w6aSchema: root + 'schemas/method-to-meaning-mapping-v1.schema.json',
  w6aFreeze: root + 'freeze/cmr-w6a-freeze-v1.json',
  codeRegistry: root + 'registries/canonical-meaning-code-registry-v1.json',
  semanticFreeze: 'content/knowledge/semantic/semantic-runtime-freeze.json'
};

const [contract, schema, registry, freeze, w6aContract, codeRegistry] = await Promise.all([
  paths.contract, paths.schema, paths.registry, paths.freeze, paths.w6aContract, paths.codeRegistry
].map(readJson));

assert.equal(contract.work, 'CM-W6B');
assert.equal(contract.productionStatus, 'validation_only');
assert.equal(contract.identity.mappingId, 'stable_across_versions');
assert.equal(contract.versionPolicy.versionMutationInPlaceAllowed, false);
assert.equal(contract.compatibilityPolicy.backwardCompatibleFalseRequiresMigration, true);
assert.equal(contract.deprecationPolicy.hardDeleteAllowed, false);
assert.equal(contract.registryRules.canonicalProjectionOnly, true);
assert.equal(contract.registryRules.actualMethodMappingPopulationAllowedInW6B, false);
assert.equal(contract.registryRules.productionAuthorityCreated, false);
assert.equal(w6aContract.work, 'CM-W6A');
assert.equal(w6aContract.rules.canonicalProjectionOnly, true);

assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
assert.equal(schema.additionalProperties, false);
assert.equal(registry.registryCode, 'PHI-OS-VERSIONED-METHOD-MEANING-MAPPING-REGISTRY');
assert.equal(registry.productionStatus, 'validation_only');
assert.equal(registry.mappingCount, registry.mappings.length);
assert.deepEqual(registry.mappings, []);
assert.deepEqual(codeRegistry.meaningCodes, []);

const fixture = {
  mappingId: 'MAPID-HDR-AUTHORITY-EMOTIONAL',
  mappingCode: 'MAP-HUMAN_DESIGN-AUTHORITY-EMOTIONAL',
  mappingVersion: '1.0.0',
  sourceMethodCode: 'HUMAN_DESIGN',
  sourceProjectionSchemaVersion: 'PHI-OS-CANONICAL-PROJECTION-v1.0.0',
  projectionType: 'AUTHORITY',
  projectionPredicate: {
    predicateVersion: '1.0.0', operator: 'equals',
    path: 'projectionValue.authorityCode', value: 'EMOTIONAL'
  },
  targetMeaningCodes: ['CM-FIXTURE-DECISION-01'],
  mappingAuthority: 'PHIOS',
  mappingConfidence: 'proposed',
  boundary: 'validation_only',
  compatibility: {
    backwardCompatible: true,
    migrationRequired: false,
    compatibleFromVersions: []
  },
  lifecycle: {
    status: 'validation_only', deprecated: false,
    deprecatedAt: null, deprecatedReason: null, successorMappingId: null
  },
  createdAt: '2026-08-07T00:00:00.000Z',
  updatedAt: '2026-08-07T00:00:00.000Z'
};
const digestsA = deriveMappingDigests(fixture);
const digestsB = deriveMappingDigests({ ...fixture, projectionPredicate: { value: 'EMOTIONAL', path: 'projectionValue.authorityCode', operator: 'equals', predicateVersion: '1.0.0' } });
assert.deepEqual(digestsA, digestsB, 'canonical key order must not affect mapping digests');
assert.match(digestsA.predicateHash, /^[a-f0-9]{64}$/);
assert.match(digestsA.targetMeaningHash, /^[a-f0-9]{64}$/);
assert.match(digestsA.mappingDigest, /^[a-f0-9]{64}$/);
assert.deepEqual(validateCompatibility(fixture), []);
assert.deepEqual(validateCompatibility({
  ...fixture,
  compatibility: { backwardCompatible: false, migrationRequired: false, compatibleFromVersions: [] }
}), ['MAPPING_INCOMPATIBLE_REQUIRES_MIGRATION']);
assert.deepEqual(validateCompatibility({
  ...fixture,
  lifecycle: { status: 'deprecated', deprecated: true, deprecatedAt: '2026-08-07T00:00:00.000Z', deprecatedReason: 'superseded', successorMappingId: fixture.mappingId }
}), ['MAPPING_SUCCESSOR_MUST_DIFFER']);

assert.equal(freeze.work, 'CM-W6B');
assert.equal(freeze.status, 'frozen');
for (const output of freeze.outputs) assert.equal(await sha(output), freeze.digests[output], `${output} changed after CM-W6B freeze`);
assert.equal(await sha(paths.w6aContract), freeze.protectedDigests.cmrW6AContract);
assert.equal(await sha(paths.w6aSchema), freeze.protectedDigests.cmrW6ASchema);
assert.equal(await sha(paths.w6aFreeze), freeze.protectedDigests.cmrW6AFreeze);
assert.equal(await sha(paths.semanticFreeze), freeze.protectedDigests.khW4G6SemanticRuntimeFreeze);
assert.equal(freeze.invariants.actualMethodMappingsCreated, false);
assert.equal(freeze.invariants.meaningCodesCreated, false);
assert.equal(freeze.invariants.productionAuthorityCreated, false);

console.log('✓ CM-W6B Versioned Method-to-Meaning Mapping Registry passed.');
console.log('✓ Stable Mapping identity, version, digest, compatibility, deprecation and successor rules passed.');
console.log('✓ Registry remains empty; no HDR, AST, BZR, NUM or other actual Mapping was created.');
console.log('✓ CM-W6A Projection-only boundary and KH-W4G.6 Semantic Runtime Freeze remain unchanged.');
