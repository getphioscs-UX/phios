import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  createAstAspectRuntime,
  AST_ASPECT_RUNTIME_CODE
} from '../functions/core-method-runtime/ast-aspect-runtime.js';

const root = process.cwd();
const readJson = async file =>
  JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));

const contract = await readJson(
  'content/professional/core-method-runtime/ast-aspect-runtime-v1.json'
);
const schema = await readJson(
  'content/professional/core-method-runtime/ast-aspect-result-v1.schema.json'
);
const governance = await readJson(
  'content/professional/core-method-runtime/ast-aspect-governance-v1.json'
);
const governanceFreeze = await readJson(
  'content/professional/core-method-runtime/ast-aspect-governance-freeze-v1.json'
);
const planetContract = await readJson(
  'content/professional/core-method-runtime/ast-planet-runtime-v1.json'
);
const houseContract = await readJson(
  'content/professional/core-method-runtime/ast-house-runtime-v1.json'
);
const eligibility = await readJson(
  'content/professional/method-governance/imr-production-eligibility-registry-v1.json'
);
const sharedCalculation = await readJson(
  'content/professional/method-runtime/shared-calculation-runtime-v1.json'
);

assert.equal(contract.stageCode, 'AST-W4B');
assert.equal(contract.input.runtimeCode, 'AST_PLANET_RUNTIME');
assert.equal(contract.input.houseResultRequired, false);
assert.equal(contract.governanceAuthority.registryReadRequired, true);
assert.equal(contract.governanceAuthority.runtimeMayInventPolicy, false);
assert.deepEqual(contract.requiredPolicies, [
  'aspectSetCode',
  'orbPolicyCode',
  'applyingPolicyCode',
  'priorityPolicyCode',
  'normalizationPolicyCode'
]);
assert.equal(contract.currentPolicyBoundary.maximumAuthorizedOrbDegrees, 0);
assert.equal(contract.currentPolicyBoundary.minorAspectsAllowed, false);
assert.equal(contract.execution.productionExecutionAllowed, false);
assert.equal(contract.scope.createsAspectMatch, true);
assert.equal(contract.scope.createsProjection, false);
assert.equal(contract.nextStage, 'AST-W5');

assert.equal(governance.stageCode, 'AST-W4A');
assert.equal(governanceFreeze.status, 'AST Aspect Governance Frozen v1');
assert.equal(planetContract.stageCode, 'AST-W2');
assert.equal(houseContract.stageCode, 'AST-W3');
assert.equal(houseContract.scope.createsAspects, false);
assert.equal(sharedCalculation.runtimeCode, 'SHARED_CALCULATION_RUNTIME');

const astEligibility = eligibility.methods.find(
  item => item.methodCode === 'ASTROLOGY'
);
assert.equal(astEligibility.validationPassed, false);
assert.equal(astEligibility.regressionPassed, false);
assert.equal(astEligibility.productionReady, false);
assert.equal(astEligibility.professionalReady, false);
assert.equal(schema.properties.productionEligible.const, false);

const bodies = [
  {
    bodyCode: 'SUN',
    longitude: 10,
    latitude: 0,
    distanceAu: 1,
    speedLongitudeDegreesPerDay: 1,
    retrograde: false,
    nodeType: 'NONE'
  },
  {
    bodyCode: 'MOON',
    longitude: 70,
    latitude: 0,
    distanceAu: 0.0026,
    speedLongitudeDegreesPerDay: 13,
    retrograde: false,
    nodeType: 'NONE'
  },
  {
    bodyCode: 'MARS',
    longitude: 100,
    latitude: 0,
    distanceAu: 1.5,
    speedLongitudeDegreesPerDay: 0.5,
    retrograde: false,
    nodeType: 'NONE'
  },
  {
    bodyCode: 'SATURN',
    longitude: 190,
    latitude: 0,
    distanceAu: 9,
    speedLongitudeDegreesPerDay: -0.05,
    retrograde: true,
    nodeType: 'NONE'
  },
  {
    bodyCode: 'VENUS',
    longitude: 11,
    latitude: 0,
    distanceAu: 0.7,
    speedLongitudeDegreesPerDay: 1.2,
    retrograde: false,
    nodeType: 'NONE'
  }
];

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
    outputDigest: 'a'.repeat(64),
    executionMode: 'validation',
    utcIso: '1989-11-15T14:50:00.000Z',
    timeScale: 'TT',
    referenceFrame: 'ECLIPTIC_OF_DATE',
    observerMode: 'GEOCENTRIC',
    bodies,
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

const runtime = createAstAspectRuntime({
  aspectGovernance: governance
});
const request = {
  calculationId: 'AST-ASPECT-001',
  runtimeCode: AST_ASPECT_RUNTIME_CODE,
  executionMode: 'validation',
  aspectSetCode: 'MAJOR_ASPECTS_V1',
  orbPolicyCode: 'EXACT_ONLY_VALIDATION_V1',
  applyingPolicyCode: 'LONGITUDE_SPEED_DIRECTION_V1',
  priorityPolicyCode: 'MAJOR_ASPECT_PRIORITY_V1',
  normalizationPolicyCode: 'SHORTEST_ANGULAR_SEPARATION_V1',
  inputRecords: [planetRecord]
};

const first = await runtime.calculate(request);
const second = await runtime.calculate(request);

assert.equal(first.runtimeCode, 'SHARED_CALCULATION_RUNTIME');
assert.equal(first.methodCode, 'ASTROLOGY');
assert.equal(first.pluginCode, 'AST');
assert.equal(first.output.runtimeCode, 'AST_ASPECT_RUNTIME');
assert.equal(first.output.evaluatedBodyCount, 5);
assert.equal(first.output.evaluatedPairCount, 10);
assert.equal(first.output.aspects.length, 5);
assert.deepEqual(
  first.output.aspects.map(item => [
    item.pairCode,
    item.aspectCode,
    item.orbDegrees,
    item.motionClassification
  ]),
  [
    ['MARS__SATURN', 'SQUARE', 0, 'EXACT'],
    ['MARS__SUN', 'SQUARE', 0, 'EXACT'],
    ['MOON__SATURN', 'TRINE', 0, 'EXACT'],
    ['MOON__SUN', 'SEXTILE', 0, 'EXACT'],
    ['SATURN__SUN', 'OPPOSITION', 0, 'EXACT']
  ]
);
assert.equal(
  first.output.aspects.some(item => item.pairCode === 'SUN__VENUS'),
  false
);
assert.equal(first.output.aspectRuntimeCreated, true);
assert.equal(first.output.projectionCreated, false);
assert.equal(first.output.interpretationCreated, false);
assert.equal(first.output.professionalConclusionCreated, false);
assert.equal(first.output.productionEligible, false);
assert.equal(first.outputDigest, second.outputDigest);

for (const aspect of first.output.aspects) {
  assert.ok(aspect.bodyA < aspect.bodyB);
  assert.equal(aspect.orbDegrees, 0);
  assert.equal(aspect.authorizedOrbDegrees, 0);
  assert.equal(aspect.motionClassification, 'EXACT');
}

await assert.rejects(
  () => runtime.calculate({ ...request, executionMode: 'production' }),
  /AST_ASPECT_PRODUCTION_EXECUTION_FORBIDDEN/
);

await assert.rejects(
  () => runtime.calculate({
    ...request,
    orbPolicyCode: 'FIXED_8'
  }),
  /Orb Policy must resolve to exactly one Registry entry/
);

await assert.rejects(
  () => runtime.calculate({
    ...request,
    projection: {}
  }),
  /Aspect boundary forbidden/
);

const mutatedGovernance = structuredClone(governance);
mutatedGovernance.runtimeContract.hardCodedOrbAllowed = true;
assert.throws(
  () => createAstAspectRuntime({
    aspectGovernance: mutatedGovernance
  }),
  /Aspect Governance boundary is invalid/
);

console.log('✓ AST-W4B Aspect Runtime passed.');
console.log('  AST-W2 Planet Result → frozen AST-W4A Registry → Shared Calculation Runtime.');
console.log('  Five Major Aspects are detected under EXACT_ONLY_VALIDATION_V1.');
console.log('  Non-zero Orb, Minor Aspects, Production, Projection and Interpretation remain forbidden.');
