import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';

const readJson = async path => JSON.parse(await fs.readFile(path, 'utf8'));
const sha = async path => crypto.createHash('sha256').update(await fs.readFile(path)).digest('hex');
const paths = {
  schema: 'content/professional/canonical-meaning-runtime/schemas/canonical-meaning-code-registry-v1.schema.json',
  contract: 'content/professional/canonical-meaning-runtime/contracts/canonical-meaning-code-contract-v1.json',
  registry: 'content/professional/canonical-meaning-runtime/registries/canonical-meaning-code-registry-v1.json',
  freeze: 'content/professional/canonical-meaning-runtime/freeze/cmr-w3-freeze-v1.json',
  familyRegistry: 'content/professional/canonical-meaning-runtime/registries/canonical-meaning-family-registry-v1.json',
  familyFreeze: 'content/professional/canonical-meaning-runtime/freeze/cmr-w2-freeze-v1.json',
  identityFreeze: 'content/professional/canonical-meaning-runtime/freeze/cmr-w1-5-freeze-v1.json'
};
const [schema, contract, registry, freeze, familyRegistry, familyFreeze, identityFreeze] = await Promise.all(Object.values(paths).map(readJson));
assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
assert.equal(contract.work, 'CM-W3');
assert.equal(contract.productionStatus, 'validation_only');
assert.equal(contract.identityRules.meaningIdentityContractRequired, true);
assert.equal(contract.populationRules.phiosDefinitionRequired, true);
assert.equal(contract.populationRules.phiosBoundaryRequired, true);
assert.equal(contract.populationRules.knowledgeAuthorityRequired, true);
assert.equal(contract.populationRules.namespaceReservationDoesNotCreateMeaning, true);
assert.equal(contract.populationRules.fabricatedPlaceholderDefinitionsForbidden, true);
assert.equal(registry.registryCode, 'PHI-OS-CANONICAL-MEANING-CODE-REGISTRY');
assert.equal(registry.productionStatus, 'validation_only');
assert.equal(registry.namespaces.length, 7);
assert.deepEqual(registry.meaningCodes, []);
const familyCodes = new Set(familyRegistry.families.map(x => x.familyCode));
const namespaceCodes = registry.namespaces.map(x => x.namespaceCode);
assert.equal(new Set(namespaceCodes).size, namespaceCodes.length);
for (const namespace of registry.namespaces) {
  assert.match(namespace.namespaceCode, /^CM-[A-Z0-9-]+$/);
  assert.equal(familyCodes.has(namespace.familyCode), true, `unknown family ${namespace.familyCode}`);
  assert.equal(namespace.populationStatus, 'reserved');
  assert.ok(namespace.reservedCapacity > 0);
  assert.ok(namespace.codePattern.startsWith(namespace.namespaceCode));
}
const expected = new Map([
  ['CM-FORMATION-SDU',64],['CM-CONNECTION-SCU',36],['CM-RESOURCE-CENTER',9],
  ['CM-PROCESSING-NETWORK',5],['CM-DIRECTION-DRIVER',12],['CM-QUESTION-ORIENTATION',16],['CM-CAPABILITY',9]
]);
for (const namespace of registry.namespaces) assert.equal(namespace.reservedCapacity, expected.get(namespace.namespaceCode));
assert.equal(familyFreeze.status, 'frozen');
assert.equal(identityFreeze.status, 'frozen');
assert.equal(freeze.status, 'frozen');
assert.equal(freeze.work, 'CM-W3');
for (const output of freeze.outputs) assert.equal(await sha(output), freeze.digests[output], `${output} changed after CM-W3 freeze`);
assert.equal(freeze.invariants.cmrW2FreezeUnchanged, true);
assert.equal(freeze.invariants.khW4G6SemanticRuntimeFreezeUnchanged, true);
assert.equal(freeze.invariants.methodRuntimeFreezesUnchanged, true);
assert.equal(freeze.invariants.meaningDimensionRegistryCreated, false);
assert.equal(freeze.invariants.methodMappingCreated, false);
assert.equal(freeze.invariants.productionAuthorityCreated, false);
console.log('✓ CM-W3 Canonical Meaning Code Registry passed.');
console.log('✓ 7 controlled PHI OS Meaning Code namespaces reserved with stable Identity and Family authority.');
console.log('✓ No fabricated Meaning definition, Method Mapping, Dimension population or Production authority was created.');
console.log('✓ KH-W4G.6 Semantic Runtime Freeze and Method Runtime freezes remain unchanged.');
