import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  createHdrGateRuntime,
  HDR_GATE_RUNTIME_CODE
} from '../functions/core-method-runtime/hdr-gate-runtime.js';

const root = process.cwd();
const readJson = async file =>
  JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));

const contract = await readJson(
  'content/professional/core-method-runtime/hdr-gate-runtime-v1.json'
);
const schema = await readJson(
  'content/professional/core-method-runtime/hdr-gate-result-v1.schema.json'
);
const foundation = await readJson(
  'content/professional/core-method-runtime/hdr-foundation-audit-v1.json'
);
const algorithmGovernance = await readJson(
  'content/professional/method-governance/imr-algorithm-governance-registry-v1.json'
);
const eligibility = await readJson(
  'content/professional/method-governance/imr-production-eligibility-registry-v1.json'
);

assert.equal(contract.stageCode, 'HDR-W3');
assert.deepEqual(contract.execution.allowedModes, ['validation']);
assert.equal(contract.execution.productionExecutionAllowed, false);
assert.equal(contract.mappingAuthority.embeddedGateSequenceAllowed, false);
assert.equal(contract.mappingAuthority.embeddedProprietaryMappingAllowed, false);
assert.equal(contract.scope.createsGate, true);
assert.equal(contract.scope.createsLine, true);
assert.equal(contract.scope.createsChannel, false);
assert.equal(contract.scope.createsBodyGraph, false);
assert.equal(contract.scope.createsProjection, false);
assert.equal(contract.nextStage, 'HDR-W4');
assert.ok(
  foundation.blockingFindings.includes('GATE_LINE_MAPPING_SOURCE_REQUIRED')
);

const hdAlgorithm = algorithmGovernance.methods.find(
  item => item.methodCode === 'HUMAN_DESIGN'
);
const hdEligibility = eligibility.methods.find(
  item => item.methodCode === 'HUMAN_DESIGN'
);
assert.equal(hdAlgorithm.validation.fixturesPassed, false);
assert.equal(hdAlgorithm.validation.regressionPassed, false);
assert.equal(hdEligibility.productionReady, false);
assert.equal(hdEligibility.professionalReady, false);
assert.equal(schema.properties.productionEligible.const, false);

const bodies = contract.scope.bodies;
const makeLongitudes = offset =>
  Object.fromEntries(bodies.map((body, index) => [
    body,
    (offset + index * 13.25) % 360
  ]));

const adapter = {
  adapterCode: 'TEST_GATE_MAPPING',
  adapterVersion: '1.0.0',
  mappingVersion: 'TEST-MAP-1',
  sourceAuthorityCode: 'TEST_AUTHORITY',
  licenseStatus: 'restricted',
  aiUsed: false,
  providerUsed: false,
  async mapLongitude({ longitude, mappingVersion }) {
    assert.equal(mappingVersion, 'TEST-MAP-1');
    // Synthetic validation mapping only; no real Gate sequence embedded.
    const zone = longitude / (360 / 64);
    const gate = Math.floor(zone) + 1;
    const withinGate = zone - Math.floor(zone);
    const lineZone = withinGate * 6;
    return {
      gate,
      line: Math.floor(lineZone) + 1,
      positionWithinLine: lineZone - Math.floor(lineZone),
      mappingCode: `TEST-${gate}`
    };
  }
};

const personalityIso = '2026-08-06T00:00:00.000Z';
const designIso = '2026-05-10T00:00:00.000Z';

const record = (recordId, recordType, payload) => ({
  authority: 'SHARED_DATA_AUTHORITY',
  status: 'verified',
  methodOwner: null,
  pluginOwner: null,
  recordId,
  recordType,
  recordVersion: '1.0.0',
  payload
});

const astronomyPayload = (utcIso, longitudes, outputDigest) => ({
  runtimeCode: 'HDR_ASTRONOMY_RUNTIME',
  runtimeVersion: '1.0.0',
  utcIso,
  longitudes,
  outputDigest,
  deterministic: true,
  providerUsed: false,
  aiUsed: false,
  gateMappingCreated: false,
  bodyGraphCreated: false,
  projectionCreated: false,
  interpretationCreated: false,
  professionalConclusionCreated: false
});

const personality = record(
  'HDR-PERSONALITY-ASTRO-001',
  'HDR_PERSONALITY_ASTRONOMY',
  astronomyPayload(personalityIso, makeLongitudes(10), 'a'.repeat(64))
);
const designMoment = record(
  'HDR-DESIGN-MOMENT-001',
  'HDR_DESIGN_MOMENT',
  {
    runtimeCode: 'HDR_DESIGN_MOMENT_RUNTIME',
    runtimeVersion: '1.0.0',
    outputDigest: 'b'.repeat(64),
    designUtcIso: designIso,
    targetSolarArcDegrees: 88,
    fixedDaySubtractionUsed: false,
    designMomentCreated: true,
    gateMappingCreated: false,
    bodyGraphCreated: false,
    projectionCreated: false
  }
);
const design = record(
  'HDR-DESIGN-ASTRO-001',
  'HDR_DESIGN_ASTRONOMY',
  astronomyPayload(designIso, makeLongitudes(280), 'c'.repeat(64))
);

const runtime = createHdrGateRuntime({ gateMappingAdapter: adapter });
const request = {
  calculationId: 'HDR-GATE-001',
  runtimeCode: HDR_GATE_RUNTIME_CODE,
  executionMode: 'validation',
  inputRecords: [personality, designMoment, design]
};

const first = await runtime.map(request);
const second = await runtime.map(request);

assert.equal(first.runtimeCode, 'SHARED_CALCULATION_RUNTIME');
assert.equal(first.deterministic, true);
assert.equal(first.providerUsed, false);
assert.equal(first.aiUsed, false);
assert.equal(first.output.runtimeCode, 'HDR_GATE_RUNTIME');
assert.equal(first.output.executionMode, 'validation');
assert.equal(first.output.activations.length, 26);
assert.equal(first.output.gateMappingCreated, true);
assert.equal(first.output.channelCreated, false);
assert.equal(first.output.centerCreated, false);
assert.equal(first.output.authorityCreated, false);
assert.equal(first.output.profileCreated, false);
assert.equal(first.output.bodyGraphCreated, false);
assert.equal(first.output.projectionCreated, false);
assert.equal(first.output.productionEligible, false);
assert.equal(first.outputDigest, second.outputDigest);

const uniquePairs = new Set(
  first.output.activations.map(item => `${item.layer}:${item.bodyCode}`)
);
assert.equal(uniquePairs.size, 26);
for (const activation of first.output.activations) {
  assert.ok(activation.gate >= 1 && activation.gate <= 64);
  assert.ok(activation.line >= 1 && activation.line <= 6);
}

await assert.rejects(
  () => runtime.map({ ...request, executionMode: 'production' }),
  /HDR_GATE_PRODUCTION_EXECUTION_FORBIDDEN/
);

await assert.rejects(
  () => runtime.map({
    ...request,
    inputRecords: [
      personality,
      designMoment,
      {
        ...design,
        payload: { ...design.payload, utcIso: '2026-05-11T00:00:00.000Z' }
      }
    ]
  }),
  /does not match HDR-W2/
);

await assert.rejects(
  () => runtime.map({ ...request, bodyGraph: {} }),
  /Gate boundary forbidden/
);

assert.throws(
  () => createHdrGateRuntime({
    gateMappingAdapter: { ...adapter, licenseStatus: 'unknown' }
  }),
  /license status is not governed/
);

console.log('✓ HDR-W3 Gate Runtime passed.');
console.log('  Personality + Design astronomy → governed Gate/Line mapping → 26 validation activations.');
console.log('  Embedded mapping tables, Production execution, Channel, Center, BodyGraph and Projection remain forbidden.');
