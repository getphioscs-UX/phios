import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  createAstAstronomyRuntime,
  AST_ASTRONOMY_RUNTIME_CODE
} from '../functions/core-method-runtime/ast-astronomy-runtime.js';

const root = process.cwd();
const readJson = async file =>
  JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));

const contract = await readJson(
  'content/professional/core-method-runtime/ast-astronomy-runtime-v1.json'
);
const schema = await readJson(
  'content/professional/core-method-runtime/ast-astronomy-result-v1.schema.json'
);
const foundation = await readJson(
  'content/professional/core-method-runtime/ast-runtime-manifest-v1.json'
);
const algorithmGovernance = await readJson(
  'content/professional/method-governance/imr-algorithm-governance-registry-v1.json'
);
const eligibility = await readJson(
  'content/professional/method-governance/imr-production-eligibility-registry-v1.json'
);
const sharedData = await readJson(
  'content/professional/method-runtime/shared-data-authority-v1.json'
);
const sharedCalculation = await readJson(
  'content/professional/method-runtime/shared-calculation-runtime-v1.json'
);

assert.equal(contract.stageCode, 'AST-W1');
assert.equal(contract.engine.engineCode, 'ASTRONOMY_ENGINE_JS');
assert.equal(contract.engine.licenseCode, 'MIT');
assert.equal(contract.engine.validationReferenceCode, 'NASA_JPL_HORIZONS');
assert.equal(contract.engine.validationReferenceRole, 'validation_only');
assert.deepEqual(contract.execution.allowedModes, ['validation']);
assert.equal(contract.execution.productionExecutionAllowed, false);
assert.equal(contract.scope.createsJulianDay, true);
assert.equal(contract.scope.createsPlanetPositions, false);
assert.equal(contract.scope.createsHouseCusps, false);
assert.equal(contract.scope.createsAspects, false);
assert.equal(contract.scope.createsProjection, false);
assert.equal(contract.nextStage, 'AST-W2');
assert.equal(foundation.nextStage, 'AST-W1');
assert.equal(foundation.activation.productionEligible, false);

const governed = algorithmGovernance.methods.find(
  item => item.methodCode === 'ASTROLOGY'
);
assert.equal(governed.algorithmStatus, 'pilot_candidate');
assert.equal(governed.validation.status, 'not_executed');
assert.equal(governed.validation.fixturesPassed, false);
assert.equal(governed.validation.regressionPassed, false);
assert.equal(governed.tolerance.value, null);

const eligibilityRecord = eligibility.methods.find(
  item => item.methodCode === 'ASTROLOGY'
);
assert.equal(eligibilityRecord.productionReady, false);
assert.equal(eligibilityRecord.professionalReady, false);
assert.equal(eligibilityRecord.validationPassed, false);
assert.equal(eligibilityRecord.regressionPassed, false);

assert.ok(sharedData.domains.some(
  item => item.dataCode === 'ASTRONOMY'
));
assert.equal(sharedCalculation.runtimeCode, 'SHARED_CALCULATION_RUNTIME');
assert.equal(sharedCalculation.providerBoundary.providerAllowed, false);
assert.equal(sharedCalculation.providerBoundary.aiUsed, false);
assert.equal(schema.properties.productionEligible.const, false);

const adapter = {
  adapterCode: 'TEST_ASTRONOMY_ENGINE_ADAPTER',
  adapterVersion: '1.0.0',
  engineCode: 'ASTRONOMY_ENGINE_JS',
  engineVersion: '2.1.19',
  licenseCode: 'MIT',
  aiUsed: false,
  providerUsed: false,
  async createAstronomyContext(request) {
    assert.equal(request.utcIso, '1989-11-15T14:50:00.000Z');
    assert.equal(request.observerMode, 'TOPOCENTRIC');
    assert.equal(request.requestedTimeScale, 'TT');
    assert.equal(request.referenceFrame, 'ECLIPTIC_OF_DATE');
    assert.equal(request.coordinate.latitude, 4.85);
    return {
      engineCode: 'ASTRONOMY_ENGINE_JS',
      engineVersion: '2.1.19',
      licenseCode: 'MIT',
      julianDay: 2447846.118055556,
      julianDayScale: 'JD_TT',
      timeScale: 'TT',
      deltaTSeconds: 56.913,
      referenceFrame: 'ECLIPTIC_OF_DATE',
      observerMode: 'TOPOCENTRIC'
    };
  }
};

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

const moment = record(
  'BIRTH-MOMENT-001',
  'NORMALIZED_BIRTH_MOMENT',
  {
    utcIso: '1989-11-15T14:50:00.000Z',
    timeScale: 'UTC',
    uncertain: false
  }
);

const coordinate = record(
  'COORDINATE-001',
  'COORDINATE',
  {
    latitude: 4.85,
    longitude: 100.7333,
    elevationMeters: 30,
    datum: 'WGS84'
  }
);

const runtime = createAstAstronomyRuntime({
  astronomyAdapter: adapter
});
const request = {
  calculationId: 'AST-ASTRONOMY-001',
  runtimeCode: AST_ASTRONOMY_RUNTIME_CODE,
  executionMode: 'validation',
  observerMode: 'TOPOCENTRIC',
  timeScale: 'TT',
  referenceFrame: 'ECLIPTIC_OF_DATE',
  inputRecords: [moment, coordinate]
};

const first = await runtime.calculate(request);
const second = await runtime.calculate(request);

assert.equal(first.runtimeCode, 'SHARED_CALCULATION_RUNTIME');
assert.equal(first.methodCode, 'ASTROLOGY');
assert.equal(first.pluginCode, 'AST');
assert.equal(first.deterministic, true);
assert.equal(first.providerUsed, false);
assert.equal(first.aiUsed, false);
assert.equal(first.output.runtimeCode, 'AST_ASTRONOMY_RUNTIME');
assert.equal(first.output.executionMode, 'validation');
assert.equal(first.output.julianDay, 2447846.118055556);
assert.equal(first.output.timeScale, 'TT');
assert.equal(first.output.referenceFrame, 'ECLIPTIC_OF_DATE');
assert.equal(first.output.observerMode, 'TOPOCENTRIC');
assert.equal(first.output.observer.datum, 'WGS84');
assert.equal(first.output.lineage.engineCode, 'ASTRONOMY_ENGINE_JS');
assert.equal(first.output.lineage.licenseCode, 'MIT');
assert.equal(
  first.output.lineage.validationReferenceRole,
  'validation_only'
);
assert.equal(first.output.planetRuntimeCreated, false);
assert.equal(first.output.houseRuntimeCreated, false);
assert.equal(first.output.aspectRuntimeCreated, false);
assert.equal(first.output.projectionCreated, false);
assert.equal(first.output.interpretationCreated, false);
assert.equal(first.output.professionalConclusionCreated, false);
assert.equal(first.output.productionEligible, false);
assert.equal(first.outputDigest, second.outputDigest);

await assert.rejects(
  () => runtime.calculate({
    ...request,
    executionMode: 'production'
  }),
  /AST_ASTRONOMY_PRODUCTION_EXECUTION_FORBIDDEN/
);

await assert.rejects(
  () => runtime.calculate({
    ...request,
    inputRecords: [
      {
        ...moment,
        payload: { ...moment.payload, uncertain: true }
      },
      coordinate
    ]
  }),
  /Uncertain birth time/
);

await assert.rejects(
  () => runtime.calculate({
    ...request,
    planet: {}
  }),
  /Astronomy boundary forbidden/
);

assert.throws(
  () => createAstAstronomyRuntime({
    astronomyAdapter: { ...adapter, providerUsed: true }
  }),
  /AI or Provider astronomy calculation is forbidden/
);

assert.throws(
  () => createAstAstronomyRuntime({
    astronomyAdapter: { ...adapter, engineCode: 'UNKNOWN_ENGINE' }
  }),
  /governed Astronomy Engine candidate/
);

console.log('✓ AST-W1 Astronomy Runtime passed.');
console.log('  Shared Data Authority → governed Astronomy Engine adapter → Shared Calculation Runtime.');
console.log('  Julian Day, time scale, reference frame and observer context are established.');
console.log('  Planet, House, Aspect, Projection, Interpretation and Professional output remain forbidden.');
