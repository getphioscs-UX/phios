import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {
  createSharedProjectionRuntime,
  SHARED_PROJECTION_RUNTIME_CODE,
  SHARED_PROJECTION_RUNTIME_VERSION,
  CANONICAL_PROJECTION_SCHEMA_VERSION
} from '../functions/method-runtime/shared-projection-runtime.js';

const read = file => fs.readFile(file, 'utf8');
const readJson = async file => JSON.parse(await read(file));
const contract = await readJson('content/professional/method-runtime/shared-projection-runtime-v1.json');
const schema = await readJson('content/professional/method-runtime/canonical-projection-v1.schema.json');
const calculationContract = await readJson('content/professional/method-runtime/shared-calculation-runtime-v1.json');
const methodRegistry = await readJson('content/professional/method-runtime/method-registry-v1.json');
const packageJson = await readJson('package.json');

assert.equal(contract.stageCode, 'MR-W4');
assert.equal(contract.runtimeCode, SHARED_PROJECTION_RUNTIME_CODE);
assert.equal(contract.runtimeVersion, SHARED_PROJECTION_RUNTIME_VERSION);
assert.equal(contract.status, 'frozen');
assert.equal(contract.authority.registryLed, true);
assert.equal(contract.calculationBoundary.runtimeCode, 'SHARED_CALCULATION_RUNTIME');
assert.equal(contract.calculationBoundary.mutationAllowed, false);
assert.equal(contract.calculationBoundary.failClosed, true);
assert.equal(contract.confidenceBoundary.meaning, 'PROJECTION_MAPPING_CERTAINTY_ONLY');
assert.equal(contract.forbidden.provider, true);
assert.equal(contract.forbidden.prompt, true);
assert.equal(contract.forbidden.interpretation, true);
assert.equal(contract.forbidden.knowledge, true);
assert.equal(contract.forbidden.realityConclusion, true);
assert.equal(contract.forbidden.professionalConclusion, true);
assert.equal(contract.compatibility.modifiesFrozenRuntime, false);
assert.equal(calculationContract.runtimeCode, 'SHARED_CALCULATION_RUNTIME');
assert.equal(calculationContract.status, 'frozen');
assert.equal(methodRegistry.registryCode, 'METHOD_REGISTRY');
assert.equal(methodRegistry.status, 'frozen');
assert.equal(packageJson.scripts['check:mr-w4'], 'node scripts/check-mr-w4-shared-projection-runtime.mjs');

assert.equal(schema.type, 'object');
assert.equal(schema.additionalProperties, false);
assert.equal(schema.properties.schemaVersion.const, CANONICAL_PROJECTION_SCHEMA_VERSION);
assert.equal(schema.properties.projectionSource.additionalProperties, false);
assert.deepEqual(schema.properties.projectionSource.required, contract.lineageRequired);

const digestA = 'a'.repeat(64);
const digestB = 'b'.repeat(64);
const calculationResult = Object.freeze({
  schemaVersion: 'PHI-OS-SHARED-CALCULATION-RESULT-v1.0.0',
  calculationId: 'CALC-MR-W4-TEST',
  runtimeCode: 'SHARED_CALCULATION_RUNTIME',
  runtimeVersion: '1.0.0',
  methodCode: 'HUMAN_DESIGN',
  pluginCode: 'HDR',
  algorithmCode: 'TEST_GATE_CALCULATION',
  algorithmVersion: '1.0.0',
  inputRecordIds: Object.freeze(['SDA-TEST-0001']),
  inputDigest: digestA,
  referenceVersions: Object.freeze({ ephemeris: '1.0.0' }),
  deterministic: true,
  aiUsed: false,
  providerUsed: false,
  output: Object.freeze({ gate: 10, line: 2 }),
  outputDigest: digestB,
  projectionCreated: false,
  interpretationCreated: false,
  professionalConclusionCreated: false
});

const runtime = createSharedProjectionRuntime({ mappers: [{
  mapperCode: 'HDR_GATE_PROJECTION',
  mapperVersion: '1.0.0',
  projectionType: 'GATE',
  map: output => ({
    value: { gate: output.gate, line: output.line },
    confidence: { level: 'exact', score: 1, basis: 'deterministic_mapping' }
  })
}] });

const request = {
  runtimeCode: SHARED_PROJECTION_RUNTIME_CODE,
  mapperCode: 'HDR_GATE_PROJECTION',
  mapperVersion: '1.0.0',
  projectionType: 'GATE',
  projectionVersion: '1.0.0',
  methodCode: 'HUMAN_DESIGN',
  pluginCode: 'HDR',
  calculationResult
};
const calculationBefore = JSON.stringify(calculationResult);
const first = await runtime.project(request);
const second = await runtime.project(request);
assert.deepEqual(first, second, 'Stable Projection JSON failed.');
assert.equal(first.schemaVersion, CANONICAL_PROJECTION_SCHEMA_VERSION);
assert.match(first.projectionCode, /^PRJ-GATE-[A-F0-9]{24}$/);
assert.equal(first.projectionCode, second.projectionCode, 'Stable Projection Code failed.');
assert.equal(first.deterministic, true);
assert.equal(first.providerUsed, false);
assert.equal(first.aiUsed, false);
assert.equal(first.interpretationCreated, false);
assert.equal(first.knowledgeCreated, false);
assert.equal(first.realityConclusionCreated, false);
assert.equal(first.professionalConclusionCreated, false);
assert.deepEqual(first.projectionSource, {
  calculationId: 'CALC-MR-W4-TEST',
  calculationRuntimeCode: 'SHARED_CALCULATION_RUNTIME',
  calculationRuntimeVersion: '1.0.0',
  methodCode: 'HUMAN_DESIGN',
  pluginCode: 'HDR',
  algorithmCode: 'TEST_GATE_CALCULATION',
  algorithmVersion: '1.0.0',
  inputDigest: digestA,
  outputDigest: digestB
});
assert.equal(JSON.stringify(calculationResult), calculationBefore, 'Calculation Result was modified.');
assert.deepEqual(Object.keys(first).sort(), schema.required.slice().sort());
assert.deepEqual(Object.keys(first.projectionSource).sort(), contract.lineageRequired.slice().sort());

for (const [field, value] of Object.entries({
  deterministic: false,
  providerUsed: true,
  aiUsed: true,
  projectionCreated: true,
  interpretationCreated: true,
  professionalConclusionCreated: true
})) {
  await assert.rejects(
    () => runtime.project({ ...request, calculationResult: { ...calculationResult, [field]: value } }),
    /boundary invalid/i
  );
}
await assert.rejects(
  () => runtime.project({ ...request, calculationResult: { ...calculationResult, runtimeCode: 'OTHER_RUNTIME' } }),
  /SHARED_CALCULATION_RUNTIME/
);
for (const forbidden of [
  { prompt: 'map this' },
  { provider: 'openai' },
  { interpretation: 'meaning' },
  { knowledge: { nodeCode: 'KN-1' } },
  { realityConclusion: 'fact' },
  { professionalConclusion: 'approved' }
]) {
  await assert.rejects(() => runtime.project({ ...request, ...forbidden }), /forbidden/i);
}

const randomRuntime = createSharedProjectionRuntime({ mappers: [{
  mapperCode: 'BAD_RANDOM_PROJECTION', mapperVersion: '1.0.0', projectionType: 'GATE',
  map: () => ({ value: { random: Math.random() }, confidence: { level: 'derived', score: 0.5, basis: 'deterministic_mapping' } })
}] });
await assert.rejects(
  () => randomRuntime.project({ ...request, mapperCode: 'BAD_RANDOM_PROJECTION' }),
  /NON_DETERMINISTIC_PROJECTION/
);

for (const name of ['precheck', 'check', 'postcheck', 'check:pja', 'check:knowledge-runtime', 'check:mr-w0', 'check:mr-w1', 'check:mr-w2', 'check:mr-w3']) {
  assert.equal(typeof packageJson.scripts[name], 'string', `Missing baseline script: ${name}`);
}

console.log('✓ MR-W4 Shared Projection Runtime passed.');
console.log('  Canonical Projection Schema and complete Calculation lineage validated.');
console.log('  Stable Projection Code and deterministic Projection JSON validated.');
console.log('  Provider, Prompt, Interpretation, Knowledge, Reality and Professional conclusions are forbidden.');
console.log('  Calculation Result remains immutable and Runtime Registry compatibility is preserved.');
