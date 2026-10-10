import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  createAstProjectionRuntime,
  AST_PROJECTION_RUNTIME_CODE
} from '../functions/core-method-runtime/ast-projection-runtime.js';

const root = process.cwd();
const readJson = async file =>
  JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));

const contract = await readJson(
  'content/professional/core-method-runtime/ast-projection-runtime-v1.json'
);
const schema = await readJson(
  'content/professional/core-method-runtime/ast-projection-bundle-v1.schema.json'
);
const canonicalProjection = await readJson(
  'content/professional/method-runtime/canonical-projection-v1.schema.json'
);
const sharedProjection = await readJson(
  'content/professional/method-runtime/shared-projection-runtime-v1.json'
);
const planetContract = await readJson(
  'content/professional/core-method-runtime/ast-planet-runtime-v1.json'
);
const houseContract = await readJson(
  'content/professional/core-method-runtime/ast-house-runtime-v1.json'
);
const aspectContract = await readJson(
  'content/professional/core-method-runtime/ast-aspect-runtime-v1.json'
);
const eligibility = await readJson(
  'content/professional/method-governance/imr-production-eligibility-registry-v1.json'
);

assert.equal(contract.stageCode, 'AST-W5');
assert.deepEqual(contract.projectionTypes, ['PLANET', 'HOUSE', 'ASPECT']);
assert.equal(
  contract.projectionAuthority.runtimeCode,
  'SHARED_PROJECTION_RUNTIME'
);
assert.equal(
  contract.projectionAuthority.syntheticCombinedCalculationAllowed,
  false
);
assert.equal(
  contract.projectionAuthority.perProjectionCalculationLineageRequired,
  true
);
assert.equal(contract.execution.productionExecutionAllowed, false);
assert.equal(contract.boundaries.createsProjection, true);
assert.equal(contract.boundaries.createsInterpretation, false);
assert.equal(contract.nextStage, 'AST-W6');

assert.equal(sharedProjection.runtimeCode, 'SHARED_PROJECTION_RUNTIME');
for (const projectionType of ['PLANET', 'HOUSE', 'ASPECT']) {
  assert.ok(
    canonicalProjection.properties.projectionType.enum.includes(
      projectionType
    )
  );
}
assert.equal(planetContract.stageCode, 'AST-W2');
assert.equal(houseContract.stageCode, 'AST-W3');
assert.equal(aspectContract.stageCode, 'AST-W4B');

const astEligibility = eligibility.methods.find(
  item => item.methodCode === 'ASTROLOGY'
);
assert.equal(astEligibility.validationPassed, false);
assert.equal(astEligibility.regressionPassed, false);
assert.equal(astEligibility.productionReady, false);
assert.equal(astEligibility.professionalReady, false);
assert.equal(schema.properties.productionEligible.const, false);

const common = {
  utcIso: '1989-11-15T14:50:00.000Z',
  timeScale: 'TT',
  referenceFrame: 'ECLIPTIC_OF_DATE',
  observerMode: 'TOPOCENTRIC'
};

const baseCalculation = ({
  calculationId,
  algorithmCode,
  outputDigest,
  output
}) => ({
  calculationId,
  runtimeCode: 'SHARED_CALCULATION_RUNTIME',
  runtimeVersion: '1.0.0',
  methodCode: 'ASTROLOGY',
  pluginCode: 'AST',
  algorithmCode,
  algorithmVersion: '1.0.0',
  inputDigest: '1'.repeat(64),
  outputDigest,
  output,
  deterministic: true,
  providerUsed: false,
  aiUsed: false,
  projectionCreated: false,
  interpretationCreated: false,
  professionalConclusionCreated: false
});

const planetOutputDigest = 'a'.repeat(64);
const houseOutputDigest = 'b'.repeat(64);
const aspectOutputDigest = 'c'.repeat(64);

const planetCalculationResult = baseCalculation({
  calculationId: 'AST-PLANET-001',
  algorithmCode: 'AST_PLANET_EPHEMERIS',
  outputDigest: planetOutputDigest,
  output: {
    schemaVersion: 'PHI-OS-AST-PLANET-RESULT-v1.0.0',
    runtimeCode: 'AST_PLANET_RUNTIME',
    runtimeVersion: '1.0.0',
    methodCode: 'ASTROLOGY',
    pluginCode: 'AST',
    calculationType: 'PLANET_EPHEMERIS',
    executionMode: 'validation',
    ...common,
    planetSetCode: 'PLANET_SET.TEST.V1',
    nodePolicyCode: 'TRUE_NODE.V1',
    retrogradePolicyCode: 'LONGITUDE_SPEED_SIGN.V1',
    precisionPolicyCode: 'DECIMAL_12.V1',
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
    lineage: {},
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
});

const houseCalculationResult = baseCalculation({
  calculationId: 'AST-HOUSE-001',
  algorithmCode: 'AST_HOUSE_STRUCTURE',
  outputDigest: houseOutputDigest,
  output: {
    schemaVersion: 'PHI-OS-AST-HOUSE-RESULT-v1.0.0',
    runtimeCode: 'AST_HOUSE_RUNTIME',
    runtimeVersion: '1.0.0',
    methodCode: 'ASTROLOGY',
    pluginCode: 'AST',
    calculationType: 'HOUSE_STRUCTURE',
    executionMode: 'validation',
    ...common,
    observer: {
      latitude: 4.85,
      longitude: 100.7333,
      elevationMeters: 30,
      datum: 'WGS84'
    },
    houseSystemCode: 'HOUSE_SYSTEM.TEST.V1',
    zodiacPolicyCode: 'TROPICAL.TEST.V1',
    anglePolicyCode: 'ANGLES.TEST.V1',
    precisionPolicyCode: 'DECIMAL_12.V1',
    ascendantLongitude: 350,
    midheavenLongitude: 80,
    descendantLongitude: 170,
    imumCoeliLongitude: 260,
    cusps: Array.from({ length: 12 }, (_, index) => ({
      houseNumber: index + 1,
      longitude: (350 + index * 30) % 360
    })),
    placements: [
      { bodyCode: 'SUN', houseNumber: 8 },
      { bodyCode: 'MOON', houseNumber: 4 }
    ],
    lineage: {
      planetOutputDigest
    },
    deterministic: true,
    providerUsed: false,
    aiUsed: false,
    houseRuntimeCreated: true,
    aspectRuntimeCreated: false,
    projectionCreated: false,
    interpretationCreated: false,
    professionalConclusionCreated: false,
    productionEligible: false
  }
});

const aspectCalculationResult = baseCalculation({
  calculationId: 'AST-ASPECT-001',
  algorithmCode: 'AST_GOVERNED_ASPECT_DETECTION',
  outputDigest: aspectOutputDigest,
  output: {
    schemaVersion: 'PHI-OS-AST-ASPECT-RESULT-v1.0.0',
    runtimeCode: 'AST_ASPECT_RUNTIME',
    runtimeVersion: '1.0.0',
    methodCode: 'ASTROLOGY',
    pluginCode: 'AST',
    calculationType: 'GOVERNED_ASPECT_DETECTION',
    executionMode: 'validation',
    ...common,
    aspectSetCode: 'MAJOR_ASPECTS_V1',
    orbPolicyCode: 'EXACT_ONLY_VALIDATION_V1',
    applyingPolicyCode: 'LONGITUDE_SPEED_DIRECTION_V1',
    priorityPolicyCode: 'MAJOR_ASPECT_PRIORITY_V1',
    normalizationPolicyCode: 'SHORTEST_ANGULAR_SEPARATION_V1',
    evaluatedBodyCount: 2,
    evaluatedPairCount: 1,
    aspects: [
      {
        pairCode: 'MOON__SUN',
        bodyA: 'MOON',
        bodyB: 'SUN',
        longitudeA: 120,
        longitudeB: 180,
        separationDegrees: 60,
        aspectCode: 'SEXTILE',
        exactAngleDegrees: 60,
        orbDegrees: 0,
        authorizedOrbDegrees: 0,
        motionClassification: 'EXACT',
        priorityRank: 5
      }
    ],
    lineage: {
      planetOutputDigest
    },
    deterministic: true,
    providerUsed: false,
    aiUsed: false,
    aspectRuntimeCreated: true,
    projectionCreated: false,
    interpretationCreated: false,
    knowledgeCreated: false,
    realityConclusionCreated: false,
    professionalConclusionCreated: false,
    productionEligible: false
  }
});

const runtime = createAstProjectionRuntime();
const request = {
  runtimeCode: AST_PROJECTION_RUNTIME_CODE,
  executionMode: 'validation',
  projectionVersion: '1.0.0',
  planetCalculationResult,
  houseCalculationResult,
  aspectCalculationResult
};

const first = await runtime.project(request);
const second = await runtime.project(request);

assert.equal(first.runtimeCode, 'AST_PROJECTION_RUNTIME');
assert.equal(first.executionMode, 'validation');
assert.equal(first.projections.length, 3);
assert.deepEqual(
  first.projections.map(item => item.projectionType),
  ['PLANET', 'HOUSE', 'ASPECT']
);
assert.deepEqual(
  first.projections.map(item => item.projectionCode),
  second.projections.map(item => item.projectionCode)
);

const expectedSources = [
  planetCalculationResult,
  houseCalculationResult,
  aspectCalculationResult
];
for (const [index, projection] of first.projections.entries()) {
  const expected = expectedSources[index];
  assert.equal(
    projection.schemaVersion,
    'PHI-OS-CANONICAL-PROJECTION-v1.0.0'
  );
  assert.equal(
    projection.projectionSource.calculationId,
    expected.calculationId
  );
  assert.equal(
    projection.projectionSource.algorithmCode,
    expected.algorithmCode
  );
  assert.equal(
    projection.projectionSource.outputDigest,
    expected.outputDigest
  );
  assert.equal(projection.projectionConfidence.level, 'exact');
  assert.equal(projection.projectionConfidence.score, 1);
  assert.equal(
    projection.projectionConfidence.basis,
    'deterministic_mapping'
  );
  assert.equal(projection.providerUsed, false);
  assert.equal(projection.aiUsed, false);
  assert.equal(projection.interpretationCreated, false);
  assert.equal(projection.knowledgeCreated, false);
  assert.equal(projection.realityConclusionCreated, false);
  assert.equal(projection.professionalConclusionCreated, false);
}

assert.equal(
  first.projections[0].projectionValue.bodies.length,
  2
);
assert.equal(
  first.projections[1].projectionValue.cusps.length,
  12
);
assert.equal(
  first.projections[2].projectionValue.aspects.length,
  1
);
assert.equal(first.projectionCreated, true);
assert.equal(first.interpretationCreated, false);
assert.equal(first.knowledgeCreated, false);
assert.equal(first.realityConclusionCreated, false);
assert.equal(first.professionalConclusionCreated, false);
assert.equal(first.productionEligible, false);

await assert.rejects(
  () => runtime.project({
    ...request,
    executionMode: 'production'
  }),
  /AST_PROJECTION_PRODUCTION_EXECUTION_FORBIDDEN/
);

await assert.rejects(
  () => runtime.project({
    ...request,
    houseCalculationResult: {
      ...houseCalculationResult,
      output: {
        ...houseCalculationResult.output,
        utcIso: '1989-11-15T14:51:00.000Z'
      }
    }
  }),
  /does not align with PLANET context/
);

await assert.rejects(
  () => runtime.project({
    ...request,
    aspectCalculationResult: {
      ...aspectCalculationResult,
      output: {
        ...aspectCalculationResult.output,
        lineage: {
          planetOutputDigest: 'f'.repeat(64)
        }
      }
    }
  }),
  /does not reference PLANET outputDigest/
);

await assert.rejects(
  () => runtime.project({
    ...request,
    interpretation: {}
  }),
  /Projection boundary forbidden/
);

console.log('✓ AST-W5 Projection Runtime passed.');
console.log('  AST-W2 PLANET + AST-W3 HOUSE + AST-W4B ASPECT → three Canonical Projection JSON objects.');
console.log('  Each Projection preserves its own complete Calculation Lineage.');
console.log('  Synthetic combined calculations, Production, Interpretation and Professional output remain forbidden.');
