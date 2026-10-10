import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  createHdrProjectionRuntime,
  HDR_PROJECTION_RUNTIME_CODE
} from '../functions/core-method-runtime/hdr-projection-runtime.js';

const root = process.cwd();
const readJson = async file =>
  JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));

const contract = await readJson(
  'content/professional/core-method-runtime/hdr-projection-runtime-v1.json'
);
const schema = await readJson(
  'content/professional/core-method-runtime/hdr-projection-bundle-v1.schema.json'
);
const canonicalProjection = await readJson(
  'content/professional/method-runtime/canonical-projection-v1.schema.json'
);
const bodyGraphContract = await readJson(
  'content/professional/core-method-runtime/hdr-bodygraph-runtime-v1.json'
);
const eligibility = await readJson(
  'content/professional/method-governance/imr-production-eligibility-registry-v1.json'
);

assert.equal(contract.stageCode, 'HDR-W5');
assert.equal(contract.input.algorithmCode, 'HDR_BODYGRAPH_STRUCTURE_RESOLUTION');
assert.equal(contract.projectionAuthority.runtimeCode, 'SHARED_PROJECTION_RUNTIME');
assert.equal(contract.projectionAuthority.localProjectionSchemaAllowed, false);
assert.equal(contract.projectionAuthority.localProjectionIdentityAllowed, false);
assert.deepEqual(
  contract.projectionTypes,
  ['GATE', 'CHANNEL', 'CENTER', 'AUTHORITY', 'PROFILE']
);
assert.ok(!canonicalProjection.properties.projectionType.enum.includes('BODYGRAPH'));
assert.equal(contract.boundaries.createsProjection, true);
assert.equal(contract.boundaries.createsInterpretation, false);
assert.equal(contract.nextStage, 'HDR-W6');
assert.equal(bodyGraphContract.stageCode, 'HDR-W4');

const hdEligibility = eligibility.methods.find(
  item => item.methodCode === 'HUMAN_DESIGN'
);
assert.equal(hdEligibility.productionReady, false);
assert.equal(hdEligibility.professionalReady, false);
assert.equal(schema.properties.productionEligible.const, false);

const activations = Array.from({ length: 26 }, (_, index) => ({
  layer: index < 13 ? 'PERSONALITY' : 'DESIGN',
  bodyCode: `BODY_${index % 13}`,
  longitude: index * 7,
  gate: (index % 64) + 1,
  line: (index % 6) + 1,
  positionWithinLine: 0.25,
  mappingCode: `TEST-${index}`
}));

const calculationResult = {
  calculationId: 'HDR-BODYGRAPH-001',
  runtimeCode: 'SHARED_CALCULATION_RUNTIME',
  runtimeVersion: '1.0.0',
  methodCode: 'HUMAN_DESIGN',
  pluginCode: 'HDR',
  algorithmCode: 'HDR_BODYGRAPH_STRUCTURE_RESOLUTION',
  algorithmVersion: '1.0.0',
  inputDigest: 'a'.repeat(64),
  outputDigest: 'b'.repeat(64),
  output: {
    schemaVersion: 'PHI-OS-HDR-BODYGRAPH-RESULT-v1.0.0',
    runtimeCode: 'HDR_BODYGRAPH_RUNTIME',
    runtimeVersion: '1.0.0',
    methodCode: 'HUMAN_DESIGN',
    pluginCode: 'HDR',
    calculationType: 'BODYGRAPH_STRUCTURE_RESOLUTION',
    executionMode: 'validation',
    activations,
    channels: [{
      channelCode: 'TEST-1-2',
      gates: [1, 2],
      centers: ['G', 'THROAT'],
      activationLayers: ['PERSONALITY']
    }],
    definedCenters: ['G', 'THROAT'],
    undefinedCenters: [
      'AJNA', 'EGO', 'HEAD', 'ROOT', 'SACRAL',
      'SOLAR_PLEXUS', 'SPLEEN'
    ],
    typeCode: 'PROJECTOR',
    humanDesignAuthorityCode: 'SELF_PROJECTED',
    profile: {
      personalityLine: 5,
      designLine: 1,
      profileCode: '5/1'
    },
    definitionCode: 'SINGLE',
    lineage: {},
    deterministic: true,
    providerUsed: false,
    aiUsed: false,
    bodyGraphCreated: true,
    projectionCreated: false,
    interpretationCreated: false,
    professionalConclusionCreated: false,
    productionEligible: false
  },
  deterministic: true,
  providerUsed: false,
  aiUsed: false,
  projectionCreated: false,
  interpretationCreated: false,
  professionalConclusionCreated: false
};

const runtime = createHdrProjectionRuntime();
const request = {
  runtimeCode: HDR_PROJECTION_RUNTIME_CODE,
  executionMode: 'validation',
  projectionVersion: '1.0.0',
  calculationResult
};

const first = await runtime.project(request);
const second = await runtime.project(request);

assert.equal(first.runtimeCode, 'HDR_PROJECTION_RUNTIME');
assert.equal(first.executionMode, 'validation');
assert.equal(first.projections.length, 5);
assert.deepEqual(
  first.projections.map(item => item.projectionType),
  ['GATE', 'CHANNEL', 'CENTER', 'AUTHORITY', 'PROFILE']
);
assert.deepEqual(
  first.projections.map(item => item.projectionCode),
  second.projections.map(item => item.projectionCode)
);

for (const projection of first.projections) {
  assert.equal(projection.schemaVersion, 'PHI-OS-CANONICAL-PROJECTION-v1.0.0');
  assert.equal(projection.projectionSource.calculationId, calculationResult.calculationId);
  assert.equal(
    projection.projectionSource.outputDigest,
    calculationResult.outputDigest
  );
  assert.equal(projection.projectionConfidence.level, 'exact');
  assert.equal(projection.projectionConfidence.score, 1);
  assert.equal(projection.providerUsed, false);
  assert.equal(projection.aiUsed, false);
  assert.equal(projection.interpretationCreated, false);
  assert.equal(projection.knowledgeCreated, false);
  assert.equal(projection.realityConclusionCreated, false);
  assert.equal(projection.professionalConclusionCreated, false);
}

assert.equal(first.projectionCreated, true);
assert.equal(first.interpretationCreated, false);
assert.equal(first.knowledgeCreated, false);
assert.equal(first.realityConclusionCreated, false);
assert.equal(first.professionalConclusionCreated, false);
assert.equal(first.productionEligible, false);

await assert.rejects(
  () => runtime.project({ ...request, executionMode: 'production' }),
  /HDR_PROJECTION_PRODUCTION_EXECUTION_FORBIDDEN/
);

await assert.rejects(
  () => runtime.project({
    ...request,
    calculationResult: {
      ...calculationResult,
      projectionCreated: true
    }
  }),
  /Calculation Result boundary is invalid/
);

await assert.rejects(
  () => runtime.project({ ...request, interpretation: {} }),
  /Projection boundary forbidden/
);

console.log('✓ HDR-W5 Projection Runtime passed.');
console.log('  HDR-W4 Calculation Result → five Canonical Projection JSON objects.');
console.log('  Local projection schemas, Production execution, Interpretation, Knowledge and Professional output remain forbidden.');
