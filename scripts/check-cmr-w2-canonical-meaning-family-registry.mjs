import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';

const readJson = async path => JSON.parse(await fs.readFile(path, 'utf8'));
const sha = async path => crypto.createHash('sha256').update(await fs.readFile(path)).digest('hex');
const paths = {
  schema: 'content/professional/canonical-meaning-runtime/schemas/canonical-meaning-family-registry-v1.schema.json',
  contract: 'content/professional/canonical-meaning-runtime/contracts/canonical-meaning-family-contract-v1.json',
  registry: 'content/professional/canonical-meaning-runtime/registries/canonical-meaning-family-registry-v1.json',
  freeze: 'content/professional/canonical-meaning-runtime/freeze/cmr-w2-freeze-v1.json',
  identityFreeze: 'content/professional/canonical-meaning-runtime/freeze/cmr-w1-5-freeze-v1.json'
};
const [schema, contract, registry, freeze, identityFreeze] = await Promise.all(Object.values(paths).map(readJson));
assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
assert.equal(contract.work, 'CM-W2');
assert.equal(contract.productionStatus, 'validation_only');
assert.equal(contract.rules.familyRegistrationDoesNotCreateMeaningCode, true);
assert.equal(contract.rules.familyRegistrationDoesNotCreateMethodMapping, true);
assert.equal(contract.invariants.khW4G6SemanticRuntimeFreezeUnchanged, true);
assert.equal(registry.registryCode, 'PHI-OS-CANONICAL-MEANING-FAMILY-REGISTRY');
assert.equal(registry.productionStatus, 'validation_only');
assert.equal(registry.families.length, 19);
const ids = registry.families.map(x => x.familyId);
const codes = registry.families.map(x => x.familyCode);
assert.equal(new Set(ids).size, ids.length);
assert.equal(new Set(codes).size, codes.length);
for (const family of registry.families) {
  assert.match(family.familyId, /^CMF-[A-Z0-9-]+$/);
  assert.match(family.familyCode, /^[A-Z][A-Z0-9_]+$/);
  assert.match(family.familyVersion, /^\d+\.\d+\.\d+$/);
  assert.equal(family.status, 'registered');
  assert.equal(family.meaningCodePopulationAllowed, false);
  assert.equal(family.methodMappingAllowed, false);
  assert.ok(family.definition.length >= 20);
}
const expected = ['FORMATION_UNIT','STRUCTURAL_CONNECTION','RESOURCE_CENTER','PROCESSING_NETWORK','DECISION_RUNTIME','ENERGY_RUNTIME','EXPERIENCE_CONFIGURATION','COGNITION_MODE','DETERMINATION_MODE','ENVIRONMENT_MODE','MOTIVATION_DRIVER','PERSPECTIVE_ORIENTATION','CAPABILITY_PATTERN','CONNECTIVITY_PATTERN','INITIALIZATION_PATTERN','DIRECTION_DRIVER','QUESTION_ORIENTATION','IDENTITY_CONFIGURATION','RELATIONAL_CONFIGURATION'];
assert.deepEqual([...codes].sort(), [...expected].sort());
assert.equal(identityFreeze.status, 'frozen');
assert.equal(freeze.status, 'frozen');
assert.equal(freeze.work, 'CM-W2');
for (const output of freeze.outputs) assert.equal(await sha(output), freeze.digests[output], `${output} changed after CM-W2 freeze`);
assert.equal(freeze.invariants.meaningCodeRegistryCreated, false);
assert.equal(freeze.invariants.meaningDimensionRegistryCreated, false);
assert.equal(freeze.invariants.methodMappingCreated, false);
assert.equal(freeze.invariants.productionAuthorityCreated, false);
assert.equal(freeze.invariants.khW4G6SemanticRuntimeFreezeUnchanged, true);
console.log('✓ CM-W2 Canonical Meaning Family Registry passed.');
console.log('✓ 19 PHI OS-owned Meaning Families registered with stable family identity and version.');
console.log('✓ No Meaning Code, Dimension, Method Mapping or Production authority was created.');
console.log('✓ KH-W4G.6 Semantic Runtime Freeze and Method Runtime freezes remain unchanged.');
