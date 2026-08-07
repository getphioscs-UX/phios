import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';

const readJson = async path => JSON.parse(await fs.readFile(path, 'utf8'));
const sha = async path => crypto.createHash('sha256').update(await fs.readFile(path)).digest('hex');
const root = 'content/professional/canonical-meaning-runtime/';
const paths = {
  schema: root + 'schemas/method-to-meaning-mapping-v1.schema.json',
  contract: root + 'contracts/method-to-meaning-mapping-contract-v1.json',
  valid: root + 'fixtures/method-to-meaning-mapping.valid.json',
  invalidRaw: root + 'fixtures/method-to-meaning-mapping.invalid-raw-method.json',
  invalidInterpretation: root + 'fixtures/method-to-meaning-mapping.invalid-interpretation.json',
  freeze: root + 'freeze/cmr-w6a-freeze-v1.json',
  projectionSchema: 'content/professional/method-runtime/canonical-projection-v1.schema.json',
  semanticFreeze: 'content/knowledge/semantic/semantic-runtime-freeze.json',
  mrFreeze: 'content/professional/method-runtime/method-runtime-freeze-v1.json',
  imrFreeze: 'content/professional/method-governance/imr-method-governance-freeze-v1.json',
  hdrFreeze: 'content/professional/core-method-runtime/hdr-production-freeze-v1.json',
  astFreeze: 'content/professional/core-method-runtime/ast-production-freeze-v1.json',
  codeRegistry: root + 'registries/canonical-meaning-code-registry-v1.json'
};

const [schema, contract, valid, invalidRaw, invalidInterpretation, freeze, projectionSchema, codeRegistry] = await Promise.all([
  paths.schema,
  paths.contract,
  paths.valid,
  paths.invalidRaw,
  paths.invalidInterpretation,
  paths.freeze,
  paths.projectionSchema,
  paths.codeRegistry
].map(readJson));

assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
assert.equal(contract.work, 'CM-W6A');
assert.equal(contract.productionStatus, 'validation_only');
assert.deepEqual(contract.authorityChain, ['METHOD_RUNTIME', 'CANONICAL_PROJECTION', 'CMR_MAPPING_CONTRACT', 'CANONICAL_MEANING']);
assert.equal(contract.soleInputAuthority.authority, 'CANONICAL_PROJECTION');
assert.equal(contract.soleInputAuthority.schemaVersion, projectionSchema.properties.schemaVersion.const);
assert.deepEqual(contract.allowedPredicateRoots, ['projectionCode', 'projectionValue']);
assert.equal(contract.rules.canonicalProjectionOnly, true);
assert.equal(contract.rules.rawMethodObjectAllowed, false);
assert.equal(contract.rules.methodCalculationInternalsAllowed, false);
assert.equal(contract.rules.temporaryRuntimeObjectAllowed, false);
assert.equal(contract.rules.originalMethodInterpretationTextAllowed, false);
assert.equal(contract.rules.mappingMayCreateMeaningCode, false);
assert.equal(contract.rules.mappingMayInterpret, false);
assert.equal(contract.invariants.actualMethodMappingsCreated, false);
assert.equal(contract.invariants.versionedMappingRegistryCreated, false);
assert.equal(contract.invariants.productionAuthorityCreated, false);

const projectionTypes = new Set(projectionSchema.properties.projectionType.enum);
const required = new Set(schema.required);
for (const field of contract.requiredMappingFields) assert.equal(required.has(field), true, `missing schema field: ${field}`);
assert.equal(projectionTypes.has(valid.projectionType), true);
assert.equal(valid.sourceProjectionSchemaVersion, projectionSchema.properties.schemaVersion.const);
assert.equal(valid.mappingAuthority, 'PHIOS');
assert.equal(valid.boundary, 'validation_only');
assert.equal(/^projection(Value|Code)(\.|$)/.test(valid.projectionPredicate.path), true);
assert.equal(valid.targetMeaningCodes.every(code => /^CM-/.test(code)), true);
assert.equal('rawMethodObject' in valid, false);
assert.equal('methodCalculationInternals' in valid, false);
assert.equal('temporaryRuntimeObject' in valid, false);
assert.equal('originalMethodInterpretationText' in valid, false);

assert.equal(/^projection(Value|Code)(\.|$)/.test(invalidRaw.projectionPredicate.path), false);
assert.equal('originalMethodInterpretationText' in invalidInterpretation, true);
assert.equal(schema.additionalProperties, false);
assert.deepEqual(codeRegistry.meaningCodes, []);

assert.equal(freeze.work, 'CM-W6A');
assert.equal(freeze.status, 'frozen');
for (const output of freeze.outputs) assert.equal(await sha(output), freeze.digests[output], `${output} changed after CM-W6A freeze`);
assert.equal(await sha(paths.projectionSchema), freeze.protectedDigests.canonicalProjectionSchema);
assert.equal(await sha(paths.semanticFreeze), freeze.protectedDigests.khW4G6SemanticRuntimeFreeze);
assert.equal(await sha(paths.mrFreeze), freeze.protectedDigests.methodRuntimeFreeze);
assert.equal(await sha(paths.imrFreeze), freeze.protectedDigests.imrFreeze);
assert.equal(await sha(paths.hdrFreeze), freeze.protectedDigests.hdrFreeze);
assert.equal(await sha(paths.astFreeze), freeze.protectedDigests.astFreeze);
assert.equal(freeze.invariants.canonicalProjectionOnly, true);
assert.equal(freeze.invariants.rawMethodObjectReadAllowed, false);
assert.equal(freeze.invariants.methodInterpretationTextStored, false);
assert.equal(freeze.invariants.versionedMappingRegistryCreated, false);
assert.equal(freeze.invariants.actualMethodMappingsCreated, false);
assert.equal(freeze.invariants.productionAuthorityCreated, false);

console.log('✓ CM-W6A Universal Method-to-Meaning Mapping Contract passed.');
console.log('✓ Canonical Projection is the sole Mapping input authority.');
console.log('✓ Raw Method objects, calculation internals, temporary objects and interpretation text remain forbidden.');
console.log('✓ No Versioned Mapping Registry, actual Method Mapping or Production authority was created.');
