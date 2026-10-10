import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  createHdrDesignMomentRuntime,
  HDR_DESIGN_MOMENT_RUNTIME_CODE
} from '../functions/core-method-runtime/hdr-design-moment-runtime.js';

const root = process.cwd();
const readJson = async file =>
  JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));

const contract = await readJson(
  'content/professional/core-method-runtime/hdr-design-moment-runtime-v1.json'
);
const schema = await readJson(
  'content/professional/core-method-runtime/hdr-design-moment-result-v1.schema.json'
);
const hdrW1 = await readJson(
  'content/professional/core-method-runtime/hdr-astronomy-runtime-v1.json'
);
const eligibility = await readJson(
  'content/professional/method-governance/imr-production-eligibility-registry-v1.json'
);

assert.equal(contract.stageCode, 'HDR-W2');
assert.equal(contract.solver.targetSolarArcDegrees, 88);
assert.equal(contract.solver.fixedEightyEightDaySubtractionAllowed, false);
assert.equal(contract.output.createsDesignMoment, true);
assert.equal(contract.output.createsDesignAstronomy, false);
assert.equal(contract.output.createsGateMapping, false);
assert.equal(contract.output.createsBodyGraph, false);
assert.equal(contract.output.createsProjection, false);
assert.equal(contract.nextStage, 'HDR-W3');
assert.equal(hdrW1.stageCode, 'HDR-W1');

const hdEligibility = eligibility.methods.find(
  item => item.methodCode === 'HUMAN_DESIGN'
);
assert.equal(hdEligibility.productionReady, false);
assert.equal(hdEligibility.professionalReady, false);
assert.equal(schema.properties.targetSolarArcDegrees.const, 88);
assert.equal(schema.properties.fixedDaySubtractionUsed.const, false);
assert.equal(schema.properties.gateMappingCreated.const, false);

const DAY_MS = 86_400_000;
const birthIso = '2026-08-06T00:00:00.000Z';
const birthMs = Date.parse(birthIso);
const birthSun = 120;

// Synthetic deterministic Sun: exactly 1 degree/day, increasing with time.
const adapter = {
  adapterCode: 'TEST_LINEAR_SUN',
  adapterVersion: '1.0.0',
  ephemerisVersion: 'TEST-1',
  aiUsed: false,
  providerUsed: false,
  async sunLongitudeAt({ utcIso, ephemerisVersion }) {
    assert.equal(ephemerisVersion, 'TEST-1');
    const deltaDays = (Date.parse(utcIso) - birthMs) / DAY_MS;
    return {
      ephemerisVersion: 'TEST-1',
      sunLongitude: ((birthSun + deltaDays) % 360 + 360) % 360
    };
  }
};

const runtime = createHdrDesignMomentRuntime({
  solarLongitudeAdapter: adapter
});

const record = {
  authority: 'SHARED_DATA_AUTHORITY',
  status: 'verified',
  methodOwner: null,
  pluginOwner: null,
  recordId: 'HDR-ASTRO-001',
  recordType: 'HDR_PERSONALITY_ASTRONOMY',
  recordVersion: '1.0.0',
  payload: {
    runtimeCode: 'HDR_ASTRONOMY_RUNTIME',
    runtimeVersion: '1.0.0',
    outputDigest: 'a'.repeat(64),
    utcIso: birthIso,
    longitudes: { SUN: birthSun },
    deterministic: true,
    providerUsed: false,
    aiUsed: false,
    designMomentCreated: false,
    gateMappingCreated: false,
    bodyGraphCreated: false,
    projectionCreated: false,
    interpretationCreated: false,
    professionalConclusionCreated: false
  }
};

const request = {
  calculationId: 'HDR-DESIGN-001',
  runtimeCode: HDR_DESIGN_MOMENT_RUNTIME_CODE,
  inputRecords: [record],
  ephemerisVersion: 'TEST-1'
};

const first = await runtime.solve(request);
const second = await runtime.solve(request);

assert.equal(first.runtimeCode, 'SHARED_CALCULATION_RUNTIME');
assert.equal(first.deterministic, true);
assert.equal(first.providerUsed, false);
assert.equal(first.aiUsed, false);
assert.equal(first.output.runtimeCode, 'HDR_DESIGN_MOMENT_RUNTIME');
assert.equal(first.output.targetSolarArcDegrees, 88);
assert.equal(first.output.fixedDaySubtractionUsed, false);
assert.equal(first.output.designMomentCreated, true);
assert.equal(first.output.designAstronomyCreated, false);
assert.equal(first.output.gateMappingCreated, false);
assert.equal(first.output.bodyGraphCreated, false);
assert.equal(first.output.projectionCreated, false);
assert.equal(first.output.interpretationCreated, false);
assert.equal(first.output.professionalConclusionCreated, false);
assert.equal(first.outputDigest, second.outputDigest);

const expectedMs = birthMs - 88 * DAY_MS;
assert.ok(
  Math.abs(Date.parse(first.output.designUtcIso) - expectedMs) <= 1000,
  'Solver must find the 88-degree solar-arc instant.'
);
assert.ok(first.output.angularErrorDegrees <= 1e-7);

await assert.rejects(
  () => runtime.solve({
    ...request,
    projection: {}
  }),
  /design boundary forbidden/
);

await assert.rejects(
  () => runtime.solve({
    ...request,
    earliestDaysBefore: 60,
    latestDaysBefore: 50
  }),
  /DESIGN_MOMENT_TARGET_NOT_BRACKETED/
);

assert.throws(
  () => createHdrDesignMomentRuntime({
    solarLongitudeAdapter: { ...adapter, providerUsed: true }
  }),
  /AI or Provider Design Moment solver is forbidden/
);

console.log('✓ HDR-W2 Design Moment Solver passed.');
console.log('  Personality Sun → prior 88° solar arc → deterministic Design Moment fact.');
console.log('  Fixed 88-day subtraction, Design astronomy, Gate, BodyGraph and Projection remain forbidden.');
