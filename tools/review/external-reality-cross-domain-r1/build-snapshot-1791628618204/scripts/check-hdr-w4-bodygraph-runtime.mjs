import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  createHdrBodyGraphRuntime,
  HDR_BODYGRAPH_RUNTIME_CODE
} from '../functions/core-method-runtime/hdr-bodygraph-runtime.js';

const root = process.cwd();
const readJson = async file =>
  JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));

const contract = await readJson(
  'content/professional/core-method-runtime/hdr-bodygraph-runtime-v1.json'
);
const schema = await readJson(
  'content/professional/core-method-runtime/hdr-bodygraph-result-v1.schema.json'
);
const gateContract = await readJson(
  'content/professional/core-method-runtime/hdr-gate-runtime-v1.json'
);
const dataRights = await readJson(
  'content/professional/method-audits/hdr-w0-data-rights.json'
);
const eligibility = await readJson(
  'content/professional/method-governance/imr-production-eligibility-registry-v1.json'
);

assert.equal(contract.stageCode, 'HDR-W4');
assert.equal(contract.requiredInput, 'HDR_GATE_RESULT');
assert.deepEqual(contract.execution.allowedModes, ['validation']);
assert.equal(contract.execution.productionExecutionAllowed, false);
assert.equal(contract.structureAuthority.embeddedChannelTableAllowed, false);
assert.equal(contract.structureAuthority.embeddedCenterRulesAllowed, false);
assert.equal(contract.structureAuthority.embeddedTypeRulesAllowed, false);
assert.equal(contract.structureAuthority.embeddedAuthorityRulesAllowed, false);
assert.equal(contract.structureAuthority.embeddedProfileRulesAllowed, false);
assert.equal(contract.scope.createsBodyGraph, true);
assert.equal(contract.scope.createsProjection, false);
assert.equal(contract.nextStage, 'HDR-W5');
assert.equal(gateContract.stageCode, 'HDR-W3');

const bodyGraphRights = dataRights.categories.find(
  item => item.categoryCode === 'BODYGRAPH_STRUCTURE'
);
assert.equal(bodyGraphRights.rightsStatus, 'source_required');
assert.equal(bodyGraphRights.selfCalculationEligibility, 'blocked');

const hdEligibility = eligibility.methods.find(
  item => item.methodCode === 'HUMAN_DESIGN'
);
assert.equal(hdEligibility.productionReady, false);
assert.equal(hdEligibility.professionalReady, false);
assert.equal(schema.properties.productionEligible.const, false);

const bodies = [
  'SUN', 'EARTH', 'MOON', 'NORTH_NODE', 'SOUTH_NODE', 'MERCURY', 'VENUS',
  'MARS', 'JUPITER', 'SATURN', 'URANUS', 'NEPTUNE', 'PLUTO'
];

const activations = [];
for (const [layerIndex, layer] of ['PERSONALITY', 'DESIGN'].entries()) {
  for (const [bodyIndex, bodyCode] of bodies.entries()) {
    activations.push({
      layer,
      bodyCode,
      longitude: (layerIndex * 120 + bodyIndex * 13.25) % 360,
      gate: ((bodyIndex + layerIndex * 13) % 64) + 1,
      line: (bodyIndex % 6) + 1,
      positionWithinLine: 0.25,
      mappingCode: `TEST-${layer}-${bodyCode}`
    });
  }
}

const adapter = {
  adapterCode: 'TEST_BODYGRAPH_STRUCTURE',
  adapterVersion: '1.0.0',
  structureVersion: 'TEST-STRUCTURE-1',
  sourceAuthorityCode: 'TEST_AUTHORITY',
  licenseStatus: 'restricted',
  aiUsed: false,
  providerUsed: false,
  async resolveBodyGraph({ activations: input, structureVersion }) {
    assert.equal(input.length, 26);
    assert.equal(structureVersion, 'TEST-STRUCTURE-1');
    return {
      channels: [
        {
          channelCode: 'TEST-1-2',
          gates: [2, 1],
          centers: ['G', 'THROAT'],
          activationLayers: ['DESIGN', 'PERSONALITY']
        },
        {
          channelCode: 'TEST-3-60',
          gates: [60, 3],
          centers: ['ROOT', 'SACRAL'],
          activationLayers: ['DESIGN']
        }
      ],
      definedCenters: ['THROAT', 'G', 'ROOT', 'SACRAL'],
      typeCode: 'GENERATOR',
      humanDesignAuthorityCode: 'SACRAL',
      profile: {
        personalityLine: 5,
        designLine: 1
      },
      definitionCode: 'SPLIT'
    };
  }
};

const gatePayload = {
  runtimeCode: 'HDR_GATE_RUNTIME',
  runtimeVersion: '1.0.0',
  outputDigest: 'a'.repeat(64),
  executionMode: 'validation',
  activations,
  deterministic: true,
  providerUsed: false,
  aiUsed: false,
  gateMappingCreated: true,
  channelCreated: false,
  centerCreated: false,
  bodyGraphCreated: false,
  projectionCreated: false,
  interpretationCreated: false,
  professionalConclusionCreated: false,
  productionEligible: false
};

const record = {
  authority: 'SHARED_DATA_AUTHORITY',
  status: 'verified',
  methodOwner: null,
  pluginOwner: null,
  recordId: 'HDR-GATE-001',
  recordType: 'HDR_GATE_RESULT',
  recordVersion: '1.0.0',
  payload: gatePayload
};

const runtime = createHdrBodyGraphRuntime({
  bodyGraphAdapter: adapter
});
const request = {
  calculationId: 'HDR-BODYGRAPH-001',
  runtimeCode: HDR_BODYGRAPH_RUNTIME_CODE,
  executionMode: 'validation',
  inputRecords: [record]
};

const first = await runtime.resolve(request);
const second = await runtime.resolve(request);

assert.equal(first.runtimeCode, 'SHARED_CALCULATION_RUNTIME');
assert.equal(first.deterministic, true);
assert.equal(first.providerUsed, false);
assert.equal(first.aiUsed, false);
assert.equal(first.output.runtimeCode, 'HDR_BODYGRAPH_RUNTIME');
assert.equal(first.output.executionMode, 'validation');
assert.equal(first.output.activations.length, 26);
assert.equal(first.output.channels.length, 2);
assert.deepEqual(first.output.channels[0].gates, [1, 2]);
assert.deepEqual(
  first.output.definedCenters,
  ['G', 'ROOT', 'SACRAL', 'THROAT']
);
assert.equal(first.output.undefinedCenters.length, 5);
assert.equal(first.output.typeCode, 'GENERATOR');
assert.equal(first.output.humanDesignAuthorityCode, 'SACRAL');
assert.equal(first.output.profile.profileCode, '5/1');
assert.equal(first.output.definitionCode, 'SPLIT');
assert.equal(first.output.bodyGraphCreated, true);
assert.equal(first.output.projectionCreated, false);
assert.equal(first.output.interpretationCreated, false);
assert.equal(first.output.professionalConclusionCreated, false);
assert.equal(first.output.productionEligible, false);
assert.equal(first.outputDigest, second.outputDigest);

await assert.rejects(
  () => runtime.resolve({ ...request, executionMode: 'production' }),
  /HDR_BODYGRAPH_PRODUCTION_EXECUTION_FORBIDDEN/
);

await assert.rejects(
  () => runtime.resolve({
    ...request,
    inputRecords: [{
      ...record,
      payload: { ...record.payload, activations: record.payload.activations.slice(0, 25) }
    }]
  }),
  /requires 26 activations/
);

await assert.rejects(
  () => runtime.resolve({ ...request, projection: {} }),
  /BodyGraph boundary forbidden/
);

assert.throws(
  () => createHdrBodyGraphRuntime({
    bodyGraphAdapter: { ...adapter, licenseStatus: 'unknown' }
  }),
  /license status is not governed/
);

console.log('✓ HDR-W4 BodyGraph Runtime passed.');
console.log('  HDR-W3 Gate Result → governed BodyGraph adapter → structural validation facts.');
console.log('  Embedded structure rules, Production execution, Projection, Interpretation and Professional output remain forbidden.');
