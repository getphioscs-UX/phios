import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import {
  evaluateMappingCompatibility,
  validateMappingRegistryCompatibility
} from './lib/canonical-meaning-runtime/mapping-compatibility-v1.mjs';

const readJson = async path => JSON.parse(await fs.readFile(path, 'utf8'));
const sha = async path => crypto.createHash('sha256').update(await fs.readFile(path)).digest('hex');
const root = 'content/professional/canonical-meaning-runtime/';
const paths = {
  contract: root + 'contracts/mapping-checker-compatibility-contract-v1.json',
  policy: root + 'policies/mapping-compatibility-policy-v1.json',
  manifest: root + 'checkers/mapping-checker-manifest-v1.json',
  registry: root + 'registries/versioned-method-meaning-mapping-registry-v1.json',
  codeRegistry: root + 'registries/canonical-meaning-code-registry-v1.json',
  validFixture: root + 'fixtures/mapping-version-chain.valid.json',
  invalidFixture: root + 'fixtures/mapping-version-chain.invalid-breaking-minor.json',
  freeze: root + 'freeze/cmr-w6c-freeze-v1.json',
  w6aContract: root + 'contracts/method-to-meaning-mapping-contract-v1.json',
  w6aFreeze: root + 'freeze/cmr-w6a-freeze-v1.json',
  w6bContract: root + 'contracts/versioned-method-meaning-mapping-registry-contract-v1.json',
  w6bRegistry: root + 'registries/versioned-method-meaning-mapping-registry-v1.json',
  w6bFreeze: root + 'freeze/cmr-w6b-freeze-v1.json',
  semanticFreeze: 'content/knowledge/semantic/semantic-runtime-freeze.json'
};

const [contract, policy, manifest, registry, codeRegistry, validFixture, invalidFixture, freeze] = await Promise.all([
  paths.contract, paths.policy, paths.manifest, paths.registry, paths.codeRegistry,
  paths.validFixture, paths.invalidFixture, paths.freeze
].map(readJson));

assert.equal(contract.work, 'CM-W6C');
assert.equal(contract.productionStatus, 'validation_only');
assert.deepEqual(contract.checkerAuthority.allowed, ['read', 'validate', 'compare', 'fail', 'report']);
assert.equal(contract.rules.canonicalProjectionOnly, true);
assert.equal(contract.rules.sameVersionMutationAllowed, false);
assert.equal(contract.rules.breakingChangeRequiresMajor, true);
assert.equal(contract.rules.actualMethodMappingPopulationAllowedInW6C, false);
assert.equal(contract.rules.productionAuthorityCreated, false);

assert.equal(policy.work, 'CM-W6C');
assert.equal(policy.compatibilityRules.sameMappingIdRequiredForVersionComparison, true);
assert.equal(policy.compatibilityRules.sameVersionContentMutationForbidden, true);
assert.equal(policy.successorRules.successorMappingIdMustDiffer, true);
assert.equal(policy.successorRules.successorMustResolveInRegistry, true);

assert.equal(manifest.work, 'CM-W6C');
assert.equal(manifest.failClosed, true);
assert.equal(manifest.mutatesRepository, false);
assert.deepEqual(manifest.operations.allowed, ['read', 'validate', 'compare', 'fail', 'report']);
for (const forbidden of ['write', 'repair', 'update_hash', 'write_registry', 'promote_state', 'publish', 'change_approval', 'generate_freeze']) {
  assert.equal(manifest.operations.forbidden.includes(forbidden), true);
}

assert.equal(registry.mappingCount, registry.mappings.length);
assert.deepEqual(registry.mappings, []);
assert.deepEqual(codeRegistry.meaningCodes, []);
assert.deepEqual(validateMappingRegistryCompatibility(registry), []);

const [validPrevious, validNext] = validFixture.versions.map(version => ({
  ...version,
  mappingId: validFixture.mappingId,
  mappingCode: 'MAP-HUMAN_DESIGN-AUTHORITY-EMOTIONAL'
}));
const validResult = evaluateMappingCompatibility(validPrevious, validNext);
assert.equal(validResult.valid, true);
assert.equal(validResult.change, 'compatible_extension');
assert.equal(validResult.bump, 'minor');
assert.equal(validResult.outcome, 'backward_compatible_minor');

const [invalidPrevious, invalidNext] = invalidFixture.versions.map(version => ({
  ...version,
  mappingId: invalidFixture.mappingId,
  mappingCode: 'MAP-HUMAN_DESIGN-AUTHORITY-EMOTIONAL'
}));
const invalidResult = evaluateMappingCompatibility(invalidPrevious, invalidNext);
assert.equal(invalidResult.valid, false);
assert.equal(invalidResult.change, 'breaking');
assert.equal(invalidResult.bump, 'minor');
assert.equal(invalidResult.errors.includes('MAPPING_BREAKING_CHANGE_REQUIRES_MAJOR'), true);
assert.equal(invalidResult.errors.includes('MAPPING_BREAKING_CHANGE_CANNOT_BE_BACKWARD_COMPATIBLE'), false);

const unresolvedSuccessorRegistry = {
  ...registry,
  mappings: [{
    ...validPrevious,
    sourceMethodCode: 'HUMAN_DESIGN',
    sourceProjectionSchemaVersion: 'PHI-OS-CANONICAL-PROJECTION-v1.0.0',
    projectionType: 'AUTHORITY',
    projectionPredicate: { predicateVersion: '1.0.0', operator: 'equals', path: 'projectionValue.authorityCode', value: 'EMOTIONAL' },
    targetMeaningCodes: ['CM-FIXTURE-DECISION-01'],
    mappingAuthority: 'PHIOS',
    boundary: 'validation_only',
    lifecycle: { status: 'deprecated', deprecated: true, deprecatedAt: '2026-08-07T00:00:00.000Z', deprecatedReason: 'superseded', successorMappingId: 'MAPID-MISSING-SUCCESSOR' },
    createdAt: '2026-08-07T00:00:00.000Z', updatedAt: '2026-08-07T00:00:00.000Z'
  }]
};
assert.equal(validateMappingRegistryCompatibility(unresolvedSuccessorRegistry).some(error => error.startsWith('MAPPING_SUCCESSOR_UNRESOLVED:')), true);

assert.equal(freeze.work, 'CM-W6C');
assert.equal(freeze.status, 'frozen');
for (const output of freeze.outputs) assert.equal(await sha(output), freeze.digests[output], `${output} changed after CM-W6C freeze`);
assert.equal(await sha(paths.w6aContract), freeze.protectedDigests.cmrW6AContract);
assert.equal(await sha(paths.w6aFreeze), freeze.protectedDigests.cmrW6AFreeze);
assert.equal(await sha(paths.w6bContract), freeze.protectedDigests.cmrW6BContract);
assert.equal(await sha(paths.w6bRegistry), freeze.protectedDigests.cmrW6BRegistry);
assert.equal(await sha(paths.w6bFreeze), freeze.protectedDigests.cmrW6BFreeze);
assert.equal(await sha(paths.semanticFreeze), freeze.protectedDigests.khW4G6SemanticRuntimeFreeze);
assert.equal(freeze.invariants.actualMethodMappingsCreated, false);
assert.equal(freeze.invariants.registryMutationAllowed, false);
assert.equal(freeze.invariants.productionAuthorityCreated, false);

console.log('✓ CM-W6C Mapping Checker and Compatibility passed.');
console.log('✓ Checker operations are limited to read, validate, compare, fail and report.');
console.log('✓ Version progression, compatibility, deprecation and successor rules fail closed.');
console.log('✓ Registry remains empty; CM-W6A/W6B and KH-W4G.6 Semantic Runtime Freeze remain unchanged.');
