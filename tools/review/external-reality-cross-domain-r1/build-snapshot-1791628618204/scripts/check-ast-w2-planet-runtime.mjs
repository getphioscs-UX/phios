import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  createAstPlanetRuntime,
  AST_PLANET_RUNTIME_CODE
} from '../functions/core-method-runtime/ast-planet-runtime.js';

const root = process.cwd();
const readJson = async file =>
  JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));

const contract = await readJson(
  'content/professional/core-method-runtime/ast-planet-runtime-v1.json'
);
const schema = await readJson(
  'content/professional/core-method-runtime/ast-planet-result-v1.schema.json'
);
const astronomy = await readJson(
  'content/professional/core-method-runtime/ast-astronomy-runtime-v1.json'
);
const foundation = await readJson(
  'content/professional/core-method-runtime/ast-runtime-manifest-v1.json'
);
const governance = await readJson(
  'content/professional/method-governance/imr-algorithm-governance-registry-v1.json'
);
const eligibility = await readJson(
  'content/professional/method-governance/imr-production-eligibility-registry-v1.json'
);

assert.equal(contract.stageCode, 'AST-W2');
assert.equal(contract.input.runtimeCode, 'AST_ASTRONOMY_RUNTIME');
assert.equal(contract.requiredPolicies.implicitDefaultsAllowed, false);
assert.equal(contract.engine.engineCode, 'ASTRONOMY_ENGINE_JS');
assert.equal(contract.engine.licenseCode, 'MIT');
assert.equal(contract.engine.validationReferenceRole, 'validation_only');
assert.deepEqual(contract.execution.allowedModes, ['validation']);
assert.equal(contract.execution.productionExecutionAllowed, false);
assert.equal(contract.scope.createsPlanetLongitude, true);
assert.equal(contract.scope.createsRetrogradeStatus, true);
assert.equal(contract.scope.createsHousePlacement, false);
assert.equal(contract.scope.createsAspects, false);
assert.equal(contract.scope.createsProjection, false);
assert.equal(contract.nextStage, 'AST-W3');
assert.equal(astronomy.stageCode, 'AST-W1');
assert.equal(foundation.policyDefaults.planetSet, null);
assert.equal(foundation.policyDefaults.nodeType, null);
assert.equal(foundation.policyDefaults.retrogradePolicy, null);
assert.equal(foundation.policyDefaults.precisionPolicy, null);

const governed = governance.methods.find(
  item => item.methodCode === 'ASTROLOGY'
);
assert.equal(governed.validation.status, 'not_executed');
assert.equal(governed.validation.fixturesPassed, false);
assert.equal(governed.validation.regressionPassed, false);
assert.equal(governed.tolerance.value, null);

const eligible = eligibility.methods.find(
  item => item.methodCode === 'ASTROLOGY'
);
assert.equal(eligible.productionReady, false);
assert.equal(eligible.professionalReady, false);
assert.equal(schema.properties.productionEligible.const, false);

const adapter = {
  adapterCode: 'TEST_AST_PLANET_ADAPTER',
  adapterVersion: '1.0.0',
  engineCode: 'ASTRONOMY_ENGINE_JS',
  engineVersion: '2.1.19',
  licenseCode: 'MIT',
  aiUsed: false,
  providerUsed: false,
  async calculateBodies(request) {
    assert.deepEqual(request.bodyCodes, ['SUN', 'MERCURY', 'TRUE_NODE']);
    return {
      engineCode: 'ASTRONOMY_ENGINE_JS',
      engineVersion: '2.1.19',
      licenseCode: 'MIT',
      planetSetCode: 'PLANET_SET.TEST.V1',
      nodePolicyCode: 'TRUE_NODE.V1',
      retrogradePolicyCode: 'LONGITUDE_SPEED_SIGN.V1',
      precisionPolicyCode: 'DECIMAL_12.V1',
      bodies: [
        {
          bodyCode: 'SUN',
          longitude: 232.5,
          latitude: 0.001,
          distanceAu: 0.989,
          speedLongitudeDegreesPerDay: 1.01,
          retrograde: false,
          nodeType: 'NONE'
        },
        {
          bodyCode: 'MERCURY',
          longitude: -10,
          latitude: 2.5,
          distanceAu: 1.1,
          speedLongitudeDegreesPerDay: -0.25,
          retrograde: true,
          nodeType: 'NONE'
        },
        {
          bodyCode: 'TRUE_NODE',
          longitude: 370,
          latitude: 0,
          distanceAu: 0,
          speedLongitudeDegreesPerDay: -0.05,
          retrograde: true,
          nodeType: 'TRUE_NODE.V1'
        }
      ]
    };
  }
};

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
    observerMode: 'GEOCENTRIC',
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

const runtime = createAstPlanetRuntime({
  planetEphemerisAdapter: adapter
});
const request = {
  calculationId: 'AST-PLANET-001',
  runtimeCode: AST_PLANET_RUNTIME_CODE,
  executionMode: 'validation',
  planetSetCode: 'PLANET_SET.TEST.V1',
  nodePolicyCode: 'TRUE_NODE.V1',
  retrogradePolicyCode: 'LONGITUDE_SPEED_SIGN.V1',
  precisionPolicyCode: 'DECIMAL_12.V1',
  bodyCodes: ['SUN', 'MERCURY', 'TRUE_NODE'],
  inputRecords: [astronomyRecord]
};

const first = await runtime.calculate(request);
const second = await runtime.calculate(request);

assert.equal(first.runtimeCode, 'SHARED_CALCULATION_RUNTIME');
assert.equal(first.methodCode, 'ASTROLOGY');
assert.equal(first.pluginCode, 'AST');
assert.equal(first.output.runtimeCode, 'AST_PLANET_RUNTIME');
assert.equal(first.output.bodies.length, 3);
assert.equal(first.output.bodies[0].longitude, 232.5);
assert.equal(first.output.bodies[1].longitude, 350);
assert.equal(first.output.bodies[1].retrograde, true);
assert.equal(first.output.bodies[2].longitude, 10);
assert.equal(first.output.bodies[2].nodeType, 'TRUE_NODE.V1');
assert.equal(first.output.lineage.engineCode, 'ASTRONOMY_ENGINE_JS');
assert.equal(first.output.lineage.licenseCode, 'MIT');
assert.equal(first.output.houseRuntimeCreated, false);
assert.equal(first.output.aspectRuntimeCreated, false);
assert.equal(first.output.projectionCreated, false);
assert.equal(first.output.productionEligible, false);
assert.equal(first.outputDigest, second.outputDigest);

await assert.rejects(
  () => runtime.calculate({ ...request, executionMode: 'production' }),
  /AST_PLANET_PRODUCTION_EXECUTION_FORBIDDEN/
);

await assert.rejects(
  () => runtime.calculate({ ...request, planetSetCode: undefined }),
  /explicit versioned policy code/
);

await assert.rejects(
  () => runtime.calculate({ ...request, house: {} }),
  /Planet boundary forbidden/
);

assert.throws(
  () => createAstPlanetRuntime({
    planetEphemerisAdapter: { ...adapter, providerUsed: true }
  }),
  /AI or Provider Planet calculation is forbidden/
);

console.log('✓ AST-W2 Planet Runtime passed.');
console.log('  AST-W1 astronomy context → explicit policies → governed planetary ephemeris facts.');
console.log('  Planet Set, Node, Retrograde and Precision defaults are not invented.');
console.log('  House, Aspect, Projection, Interpretation and Professional output remain forbidden.');
