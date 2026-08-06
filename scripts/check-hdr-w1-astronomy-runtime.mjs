import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  createHdrAstronomyRuntime,
  HDR_ASTRONOMY_RUNTIME_CODE
} from '../functions/core-method-runtime/hdr-astronomy-runtime.js';

const root = process.cwd();
const readJson = async file =>
  JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));

const contract = await readJson(
  'content/professional/core-method-runtime/hdr-astronomy-runtime-v1.json'
);
const schema = await readJson(
  'content/professional/core-method-runtime/hdr-astronomy-result-v1.schema.json'
);
const foundation = await readJson(
  'content/professional/core-method-runtime/hdr-runtime-manifest-v1.json'
);
const sharedCalculation = await readJson(
  'content/professional/method-runtime/shared-calculation-runtime-v1.json'
);
const sharedData = await readJson(
  'content/professional/method-runtime/shared-data-authority-v1.json'
);

assert.equal(contract.stageCode, 'HDR-W1');
assert.equal(contract.runtimeCode, 'HDR_ASTRONOMY_RUNTIME');
assert.equal(contract.authority.input, 'SHARED_DATA_AUTHORITY');
assert.equal(contract.authority.execution, 'SHARED_CALCULATION_RUNTIME');
assert.equal(contract.boundaries.astronomyOnly, true);
assert.equal(contract.boundaries.fixedEightyEightDaySubtractionForbidden, true);
assert.equal(contract.boundaries.designMomentCreated, false);
assert.equal(contract.boundaries.gateMappingCreated, false);
assert.equal(contract.boundaries.bodyGraphCreated, false);
assert.equal(contract.boundaries.projectionCreated, false);
assert.equal(contract.boundaries.interpretationCreated, false);
assert.equal(contract.boundaries.professionalConclusionCreated, false);
assert.equal(contract.nextStage, 'HDR-W2');

assert.equal(foundation.nextStage, 'HDR-W1');
assert.equal(foundation.activation.productionEligible, false);
assert.equal(sharedCalculation.runtimeCode, 'SHARED_CALCULATION_RUNTIME');
assert.equal(sharedCalculation.providerBoundary.providerAllowed, false);
assert.equal(sharedCalculation.providerBoundary.aiUsed, false);
assert.equal(sharedData.authorityCode, 'SHARED_DATA_AUTHORITY');
assert.ok(sharedData.domains.some(item => item.dataCode === 'ASTRONOMY'));

for (const body of contract.requiredBodies) {
  assert.ok(schema.properties.longitudes.required.includes(body));
}
assert.equal(schema.properties.designMomentCreated.const, false);
assert.equal(schema.properties.projectionCreated.const, false);

const baseLongitudes = {
  SUN: 10,
  MOON: 20,
  NORTH_NODE: 30,
  MERCURY: 40,
  VENUS: 50,
  MARS: 60,
  JUPITER: 70,
  SATURN: 80,
  URANUS: 90,
  NEPTUNE: 100,
  PLUTO: 110
};

let calls = 0;
const adapter = {
  adapterCode: 'TEST_EPHEMERIS',
  adapterVersion: '1.0.0',
  referenceFrame: 'ECLIPTIC_OF_DATE',
  timeScale: 'TT',
  aiUsed: false,
  providerUsed: false,
  async calculateLongitudes(request) {
    calls += 1;
    assert.equal(request.utcIso, '1989-11-15T14:50:00.000Z');
    return {
      referenceFrame: 'ECLIPTIC_OF_DATE',
      timeScale: 'TT',
      observerMode: 'GEOCENTRIC',
      ephemerisVersion: 'TEST-1',
      longitudes: { ...baseLongitudes }
    };
  }
};

const runtime = createHdrAstronomyRuntime({ astronomyAdapter: adapter });
const record = {
  authority: 'SHARED_DATA_AUTHORITY',
  status: 'verified',
  methodOwner: null,
  pluginOwner: null,
  recordId: 'BIRTH-MOMENT-001',
  recordType: 'NORMALIZED_BIRTH_MOMENT',
  recordVersion: '1.0.0',
  payload: {
    utcIso: '1989-11-15T14:50:00.000Z',
    timeScale: 'UTC',
    uncertain: false
  }
};

const first = await runtime.calculate({
  calculationId: 'HDR-ASTRO-001',
  runtimeCode: HDR_ASTRONOMY_RUNTIME_CODE,
  inputRecords: [record],
  ephemerisVersion: 'TEST-1'
});
const second = await runtime.calculate({
  calculationId: 'HDR-ASTRO-001',
  runtimeCode: HDR_ASTRONOMY_RUNTIME_CODE,
  inputRecords: [record],
  ephemerisVersion: 'TEST-1'
});

assert.equal(first.runtimeCode, 'SHARED_CALCULATION_RUNTIME');
assert.equal(first.deterministic, true);
assert.equal(first.providerUsed, false);
assert.equal(first.aiUsed, false);
assert.equal(first.projectionCreated, false);
assert.equal(first.interpretationCreated, false);
assert.equal(first.professionalConclusionCreated, false);
assert.equal(first.output.runtimeCode, 'HDR_ASTRONOMY_RUNTIME');
assert.equal(first.output.longitudes.EARTH, 190);
assert.equal(first.output.longitudes.SOUTH_NODE, 210);
assert.equal(first.output.designMomentCreated, false);
assert.equal(first.output.gateMappingCreated, false);
assert.equal(first.output.bodyGraphCreated, false);
assert.equal(first.outputDigest, second.outputDigest);
assert.equal(calls, 4); // Shared Calculation executes twice per request.

await assert.rejects(
  () => runtime.calculate({
    runtimeCode: HDR_ASTRONOMY_RUNTIME_CODE,
    inputRecords: [{ ...record, payload: { ...record.payload, uncertain: true } }],
    ephemerisVersion: 'TEST-1'
  }),
  /Uncertain birth moment/
);

await assert.rejects(
  () => runtime.calculate({
    runtimeCode: HDR_ASTRONOMY_RUNTIME_CODE,
    inputRecords: [record],
    ephemerisVersion: 'TEST-1',
    projection: {}
  }),
  /astronomy boundary forbidden/
);

assert.throws(
  () => createHdrAstronomyRuntime({
    astronomyAdapter: { ...adapter, aiUsed: true }
  }),
  /AI or Provider astronomy adapter is forbidden/
);

console.log('✓ HDR-W1 Astronomy Runtime passed.');
console.log('  Governed ephemeris adapter → Shared Calculation Runtime → astronomical longitude facts.');
console.log('  Design Moment, Gate, BodyGraph, Projection, Interpretation and Professional output remain forbidden.');
