import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';

const readJson = async path => JSON.parse(await fs.readFile(path, 'utf8'));
const sha = async path => crypto.createHash('sha256').update(await fs.readFile(path)).digest('hex');
const root = 'content/professional/canonical-meaning-runtime/';
const paths = {
  contract: root + 'contracts/mapping-foundation-acceptance-contract-v1.json',
  manifest: root + 'checkers/mapping-foundation-checker-manifest-v1.json',
  acceptance: root + 'acceptance/cmr-w6-mapping-foundation-acceptance-v1.json',
  registry: root + 'registries/versioned-method-meaning-mapping-registry-v1.json',
  codeRegistry: root + 'registries/canonical-meaning-code-registry-v1.json',
  w6aFreeze: root + 'freeze/cmr-w6a-freeze-v1.json',
  w6bFreeze: root + 'freeze/cmr-w6b-freeze-v1.json',
  w6cFreeze: root + 'freeze/cmr-w6c-freeze-v1.json',
  freeze: root + 'freeze/cmr-w6d-mapping-foundation-freeze-v1.json',
  semanticFreeze: 'content/knowledge/semantic/semantic-runtime-freeze.json',
  projectionSchema: 'content/professional/method-runtime/canonical-projection-v1.schema.json',
  numManifest: 'content/professional/core-method-runtime/num-runtime-manifest-v1.json'
};

const [contract, manifest, acceptance, registry, codeRegistry, w6a, w6b, w6c, freeze, numManifest] = await Promise.all([
  paths.contract, paths.manifest, paths.acceptance, paths.registry, paths.codeRegistry,
  paths.w6aFreeze, paths.w6bFreeze, paths.w6cFreeze, paths.freeze, paths.numManifest
].map(readJson));

assert.equal(contract.work, 'CM-W6D');
assert.equal(contract.productionStatus, 'validation_only');
assert.deepEqual(contract.scope, ['CM-W6A', 'CM-W6B', 'CM-W6C']);
assert.equal(contract.acceptanceRequirements.canonicalProjectionIsSoleInput, true);
assert.equal(contract.acceptanceRequirements.registryMutationAllowed, false);
assert.equal(contract.acceptanceRequirements.actualMethodMappingPopulationAllowed, false);
assert.equal(contract.acceptanceRequirements.productionAuthorityCreated, false);
for (const forbidden of ['RAW_METHOD_OBJECT', 'METHOD_CALCULATION_INTERNALS', 'TEMPORARY_RUNTIME_OBJECT', 'ORIGINAL_METHOD_INTERPRETATION_TEXT']) {
  assert.equal(contract.forbiddenInputs.includes(forbidden), true);
}

assert.equal(manifest.work, 'CM-W6D');
assert.equal(manifest.failClosed, true);
assert.equal(manifest.mutatesRepository, false);
assert.deepEqual(manifest.operations.allowed, ['read', 'validate', 'compare', 'fail', 'report']);
for (const forbidden of ['write', 'repair', 'update_hash', 'write_registry', 'promote_state', 'publish', 'change_approval', 'generate_mapping', 'generate_freeze']) {
  assert.equal(manifest.operations.forbidden.includes(forbidden), true);
}

assert.equal(acceptance.work, 'CM-W6D');
assert.equal(acceptance.status, 'accepted');
assert.equal(acceptance.baselineCommit, 'a32504722c95a3bbd36bce4ea01b84a1c69c208d');
assert.deepEqual(acceptance.acceptedWorks, ['CM-W6A', 'CM-W6B', 'CM-W6C']);
assert.equal(acceptance.results.canonicalProjectionOnly, true);
assert.equal(acceptance.results.stableMappingIdentity, true);
assert.equal(acceptance.results.versionedMappingRegistry, true);
assert.equal(acceptance.results.deterministicMappingDigests, true);
assert.equal(acceptance.results.checkerReadOnly, true);
assert.equal(acceptance.results.checkerFailClosed, true);
assert.equal(acceptance.results.registryMappingCount, 0);
assert.equal(acceptance.results.actualMethodMappingsCreated, false);
assert.equal(acceptance.results.productionAuthorityCreated, false);

assert.equal(w6a.work, 'CM-W6A');
assert.equal(w6a.status, 'frozen');
assert.equal(w6a.invariants.canonicalProjectionOnly, true);
assert.equal(w6a.invariants.actualMethodMappingsCreated, false);
assert.equal(w6b.work, 'CM-W6B');
assert.equal(w6b.status, 'frozen');
assert.equal(w6b.invariants.stableMappingIdentityEstablished, true);
assert.equal(w6b.invariants.registryInitiallyEmpty, true);
assert.equal(w6c.work, 'CM-W6C');
assert.equal(w6c.status, 'frozen');
assert.equal(w6c.invariants.checkerReadOnly, true);
assert.equal(w6c.invariants.checkerFailClosed, true);

assert.equal(registry.mappingCount, 0);
assert.deepEqual(registry.mappings, []);
assert.deepEqual(codeRegistry.meaningCodes, []);
assert.equal(numManifest.pipeline.some(item => item.stageCode === 'NUM-W3'), true);
assert.equal(numManifest.activation.productionEligible, false);

assert.equal(freeze.work, 'CM-W6D');
assert.equal(freeze.status, 'frozen');
assert.equal(freeze.productionStatus, 'validation_only');
for (const output of freeze.outputs) {
  assert.equal(await sha(output), freeze.digests[output], `${output} changed after CM-W6D freeze`);
}
assert.equal(await sha(paths.w6aFreeze), freeze.protectedDigests.cmrW6AFreeze);
assert.equal(await sha(paths.w6bFreeze), freeze.protectedDigests.cmrW6BFreeze);
assert.equal(await sha(paths.w6cFreeze), freeze.protectedDigests.cmrW6CFreeze);
assert.equal(await sha(paths.registry), freeze.protectedDigests.versionedMappingRegistry);
assert.equal(await sha(paths.codeRegistry), freeze.protectedDigests.meaningCodeRegistry);
assert.equal(await sha(paths.semanticFreeze), freeze.protectedDigests.khW4G6SemanticRuntimeFreeze);
assert.equal(await sha(paths.projectionSchema), freeze.protectedDigests.canonicalProjectionSchema);
assert.equal(await sha(paths.numManifest), freeze.protectedDigests.numRuntimeManifest);
assert.equal(freeze.invariants.mappingFoundationFrozen, true);
assert.equal(freeze.invariants.actualMethodMappingsCreated, false);
assert.equal(freeze.invariants.parallelMappingFoundationAllowed, false);
assert.equal(freeze.invariants.productionAuthorityCreated, false);

console.log('✓ CM-W6D Mapping Foundation Acceptance and Freeze passed.');
console.log('✓ CM-W6A Contract, CM-W6B Versioned Registry and CM-W6C Checker form one frozen Mapping Foundation.');
console.log('✓ Canonical Projection remains the sole Mapping input; no actual Method Mapping or Production authority exists.');
console.log('✓ HDR, AST, BZR, NUM and future Methods must consume this foundation and may not create a parallel Mapping authority.');
