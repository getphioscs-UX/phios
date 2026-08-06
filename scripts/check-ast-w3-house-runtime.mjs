import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  createAstHouseRuntime,
  AST_HOUSE_RUNTIME_CODE
} from '../functions/core-method-runtime/ast-house-runtime.js';

const root = process.cwd();
const readJson = async file =>
  JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));

const contract = await readJson(
  'content/professional/core-method-runtime/ast-house-runtime-v1.json'
);
const schema = await readJson(
  'content/professional/core-method-runtime/ast-house-result-v1.schema.json'
);
const astronomy = await readJson(
  'content/professional/core-method-runtime/ast-astronomy-runtime-v1.json'
);
const planets = await readJson(
  'content/professional/core-method-runtime/ast-planet-runtime-v1.json'
);
const foundation = await readJson(
  'content/professional/core-method-runtime/ast-runtime-manifest-v1.json'
);
const eligibility = await readJson(
  'content/professional/method-governance/imr-production-eligibility-registry-v1.json'
);

assert.equal(contract.stageCode, 'AST-W3');
assert.deepEqual(
  contract.requiredInputs,
  ['AST_ASTRONOMY_CONTEXT', 'AST_PLANET_RESULT']
);
assert.equal(contract.houseReadiness.topocentricObserverRequired, true);
assert.equal(contract.houseReadiness.exactBirthTimeRequired, true);
assert.equal(contract.requiredPolicies.implicitDefaultsAllowed, false);
assert.equal(contract.scope.createsHouseCusps, true);
assert.equal(contract.scope.createsPlanetHousePlacements, true);
assert.equal(contract.scope.createsAspects, false);
assert.equal(contract.scope.createsProjection, false);
assert.deepEqual(contract.execution.allowedModes, ['validation']);
assert.equal(contract.execution.productionExecutionAllowed, false);
assert.equal(contract.nextStage, 'AST-W4');
assert.equal(astronomy.stageCode, 'AST-W1');
assert.equal(planets.stageCode, 'AST-W2');
assert.equal(foundation.policyDefaults.houseSystem, null);
assert.equal(foundation.policyDefaults.zodiacType, null);

const astEligibility = eligibility.methods.find(
  item => item.methodCode === 'ASTROLOGY'
);
assert.equal(astEligibility.productionReady, false);
assert.equal(astEligibility.professionalReady, false);
assert.equal(schema.properties.productionEligible.const, false);

const astronomyRecord = {
  authority: 'SHARED_DATA_AUTHORITY',
  status: 'verified',
  methodOwner: null,
  pluginOwner: null,
  recordId: 'AST-ASTRONOMY-001',
  recordType: 'AST_ASTRONOMY_CONTEXT',
  recordVersion: '1.0.0',
  payload: {
    runtimeCode: 'AST_ASTRONOMY_RUNTIME',
    runtimeVersion: '1.0.0',
    outputDigest: 'a'.repeat(64),
    executionMode: 'validation',
    utcIso: '1989-11-15T14:50:00.000Z',
    julianDay: 2447846.118055556,
    timeScale: 'TT',
    referenceFrame: 'ECLIPTIC_OF_DATE',
    observerMode: 'TOPOCENTRIC',
    observer: {
      latitude: 4.85,
      longitude: 100.7333,
      elevationMeters: 30,
      datum: 'WGS84'
    },
    deterministic: true,
    providerUsed: false,
    aiUsed: false,
    planetRuntimeCreated: false,
    houseRuntimeCreated: false,
    aspectRuntimeCreated: false,
    projectionCreated: false,
    interpretationCreated: false,
    professionalConclusionCreated: false,
    productionEligible: false
  }
};

const planetRecord = {
  authority: 'SHARED_DATA_AUTHORITY',
  status: 'verified',
  methodOwner: null,
  pluginOwner: null,
  recordId: 'AST-PLANET-001',
  recordType: 'AST_PLANET_RESULT',
  recordVersion: '1.0.0',
  payload: {
    runtimeCode: 'AST_PLANET_RUNTIME',
    runtimeVersion: '1.0.0',
    outputDigest: 'b'.repeat(64),
    executionMode: 'validation',
    utcIso: astronomyRecord.payload.utcIso,
    timeScale: astronomyRecord.payload.timeScale,
    referenceFrame: astronomyRecord.payload.referenceFrame,
    observerMode: astronomyRecord.payload.observerMode,
    bodies: [
      {
        bodyCode: 'SUN',
        longitude: 232.5,
        latitude: 0,
        distanceAu: 1,
        speedLongitudeDegreesPerDay: 1,
        retrograde: false,
        nodeType: 'NONE'
      },
      {
        bodyCode: 'MOON',
        longitude: 120,
        latitude: 2,
        distanceAu: 0.0026,
        speedLongitudeDegreesPerDay: 13,
        retrograde: false,
        nodeType: 'NONE'
      }
    ],
    deterministic: true,
    providerUsed: false,
    aiUsed: false,
    planetRuntimeCreated: true,
    houseRuntimeCreated: false,
    aspectRuntimeCreated: false,
    projectionCreated: false,
    interpretationCreated: false,
    professionalConclusionCreated: false,
    productionEligible: false
  }
};

const adapter = {
  adapterCode: 'TEST_HOUSE_ADAPTER',
  adapterVersion: '1.0.0',
  engineCode: 'ASTRONOMY_ENGINE_JS',
  engineVersion: '2.1.19',
  licenseCode: 'MIT',
  aiUsed: false,
  providerUsed: false,
  async calculateHouses(request) {
    assert.equal(request.houseSystemCode, 'HOUSE_SYSTEM.TEST.V1');
    assert.equal(request.zodiacPolicyCode, 'TROPICAL.TEST.V1');
    assert.equal(request.astronomyContext.observerMode, 'TOPOCENTRIC');
    return {
      engineCode: 'ASTRONOMY_ENGINE_JS',
      engineVersion: '2.1.19',
      licenseCode: 'MIT',
      houseSystemCode: 'HOUSE_SYSTEM.TEST.V1',
      zodiacPolicyCode: 'TROPICAL.TEST.V1',
      anglePolicyCode: 'ANGLES.TEST.V1',
      precisionPolicyCode: 'DECIMAL_12.V1',
      ascendantLongitude: -10,
      midheavenLongitude: 80,
      descendantLongitude: 170,
      imumCoeliLongitude: 260,
      cusps: Array.from({ length: 12 }, (_, index) => ({
        houseNumber: index + 1,
        longitude: -10 + index * 30
      })),
      placements: [
        { bodyCode: 'SUN', houseNumber: 8 },
        { bodyCode: 'MOON', houseNumber: 4 }
      ]
    };
  }
};

const runtime = createAstHouseRuntime({ houseAdapter: adapter });
const request = {
  calculationId: 'AST-HOUSE-001',
  runtimeCode: AST_HOUSE_RUNTIME_CODE,
  executionMode: 'validation',
  houseSystemCode: 'HOUSE_SYSTEM.TEST.V1',
  zodiacPolicyCode: 'TROPICAL.TEST.V1',
  anglePolicyCode: 'ANGLES.TEST.V1',
  precisionPolicyCode: 'DECIMAL_12.V1',
  inputRecords: [astronomyRecord, planetRecord]
};

const first = await runtime.calculate(request);
const second = await runtime.calculate(request);

assert.equal(first.runtimeCode, 'SHARED_CALCULATION_RUNTIME');
assert.equal(first.methodCode, 'ASTROLOGY');
assert.equal(first.pluginCode, 'AST');
assert.equal(first.output.runtimeCode, 'AST_HOUSE_RUNTIME');
assert.equal(first.output.ascendantLongitude, 350);
assert.equal(first.output.midheavenLongitude, 80);
assert.equal(first.output.cusps.length, 12);
assert.equal(first.output.cusps[0].longitude, 350);
assert.equal(first.output.placements.length, 2);
assert.equal(first.output.placements[0].bodyCode, 'SUN');
assert.equal(first.output.placements[0].houseNumber, 8);
assert.equal(first.output.houseRuntimeCreated, true);
assert.equal(first.output.aspectRuntimeCreated, false);
assert.equal(first.output.projectionCreated, false);
assert.equal(first.output.productionEligible, false);
assert.equal(first.outputDigest, second.outputDigest);

await assert.rejects(
  () => runtime.calculate({ ...request, executionMode: 'production' }),
  /AST_HOUSE_PRODUCTION_EXECUTION_FORBIDDEN/
);

await assert.rejects(
  () => runtime.calculate({ ...request, houseSystemCode: undefined }),
  /explicit versioned policy code/
);

await assert.rejects(
  () => runtime.calculate({
    ...request,
    inputRecords: [
      {
        ...astronomyRecord,
        payload: {
          ...astronomyRecord.payload,
          observerMode: 'GEOCENTRIC',
          observer: null
        }
      },
      planetRecord
    ]
  }),
  /not House-ready/
);

await assert.rejects(
  () => runtime.calculate({ ...request, aspect: {} }),
  /House boundary forbidden/
);

assert.throws(
  () => createAstHouseRuntime({
    houseAdapter: { ...adapter, providerUsed: true }
  }),
  /AI or Provider House calculation is forbidden/
);

console.log('✓ AST-W3 House Runtime passed.');
console.log('  AST-W1 context + AST-W2 planets + explicit House/Zodiac policies → governed House facts.');
console.log('  Exact topocentric observer is required; no default House System or Zodiac is invented.');
console.log('  Aspect, Projection, Interpretation and Professional output remain forbidden.');
