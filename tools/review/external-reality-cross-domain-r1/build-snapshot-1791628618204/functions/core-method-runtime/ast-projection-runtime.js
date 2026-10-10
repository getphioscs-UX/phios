/**
 * PHI OS AST-W5 Projection Runtime.
 *
 * Converts governed AST-W2 Planet, AST-W3 House and AST-W4B Aspect
 * Shared Calculation Results into three Canonical Projection JSON objects.
 *
 * Each Projection preserves the complete lineage of its own Calculation
 * Result. This Runtime does not create a synthetic combined calculation.
 */
import {
  createSharedProjectionRuntime,
  SHARED_PROJECTION_RUNTIME_CODE
} from '../method-runtime/shared-projection-runtime.js';

export const AST_PROJECTION_RUNTIME_CODE = 'AST_PROJECTION_RUNTIME';
export const AST_PROJECTION_RUNTIME_VERSION = '1.0.0';
export const AST_PROJECTION_BUNDLE_SCHEMA_VERSION =
  'PHI-OS-AST-PROJECTION-BUNDLE-v1.0.0';

const PROJECTION_ORDER = Object.freeze([
  'PLANET',
  'HOUSE',
  'ASPECT'
]);

const CALCULATION_BOUNDARIES = Object.freeze({
  PLANET: Object.freeze({
    algorithmCode: 'AST_PLANET_EPHEMERIS',
    outputRuntimeCode: 'AST_PLANET_RUNTIME',
    createdFlag: 'planetRuntimeCreated'
  }),
  HOUSE: Object.freeze({
    algorithmCode: 'AST_HOUSE_STRUCTURE',
    outputRuntimeCode: 'AST_HOUSE_RUNTIME',
    createdFlag: 'houseRuntimeCreated'
  }),
  ASPECT: Object.freeze({
    algorithmCode: 'AST_GOVERNED_ASPECT_DETECTION',
    outputRuntimeCode: 'AST_ASPECT_RUNTIME',
    createdFlag: 'aspectRuntimeCreated'
  })
});

const FORBIDDEN_KEYS = new Set([
  'prompt',
  'provider',
  'openai',
  'workersAI',
  'knowledge',
  'interpretation',
  'professionalConclusion',
  'professionalReport',
  'realityDecision',
  'realityConclusion',
  'release'
]);

function assertObject(value, message) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(message);
  }
}

function assertNoForbiddenKeys(value, path = '$') {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) {
      throw new TypeError(
        `AST-W5 Projection boundary forbidden at ${path}.${key}`
      );
    }
    assertNoForbiddenKeys(child, `${path}.${key}`);
  }
}

function assertCalculationResult(result, projectionType) {
  assertObject(result, `${projectionType} Calculation Result is required.`);
  const boundary = CALCULATION_BOUNDARIES[projectionType];

  if (result.runtimeCode !== 'SHARED_CALCULATION_RUNTIME' ||
      result.methodCode !== 'ASTROLOGY' ||
      result.pluginCode !== 'AST' ||
      result.algorithmCode !== boundary.algorithmCode ||
      result.deterministic !== true ||
      result.providerUsed !== false ||
      result.aiUsed !== false ||
      result.projectionCreated !== false ||
      result.interpretationCreated !== false ||
      result.professionalConclusionCreated !== false) {
    throw new TypeError(
      `${projectionType} Calculation Result boundary is invalid.`
    );
  }

  assertObject(
    result.output,
    `${projectionType} Calculation output is required.`
  );
  const output = result.output;
  if (output.runtimeCode !== boundary.outputRuntimeCode ||
      output.runtimeVersion !== '1.0.0' ||
      output.methodCode !== 'ASTROLOGY' ||
      output.pluginCode !== 'AST' ||
      output.executionMode !== 'validation' ||
      output[boundary.createdFlag] !== true ||
      output.projectionCreated !== false ||
      output.interpretationCreated !== false ||
      output.professionalConclusionCreated !== false ||
      output.productionEligible !== false) {
    throw new TypeError(
      `${projectionType} Calculation output boundary is invalid.`
    );
  }

  for (const key of [
    'calculationId',
    'runtimeVersion',
    'algorithmVersion',
    'inputDigest',
    'outputDigest'
  ]) {
    if (typeof result[key] !== 'string' || result[key].length === 0) {
      throw new TypeError(
        `${projectionType} Calculation lineage is incomplete: ${key}.`
      );
    }
  }

  assertNoForbiddenKeys(result);
}

function assertCrossResultAlignment(planet, house, aspect) {
  const planetOutput = planet.output;
  const houseOutput = house.output;
  const aspectOutput = aspect.output;

  for (const [label, output] of [
    ['HOUSE', houseOutput],
    ['ASPECT', aspectOutput]
  ]) {
    if (output.utcIso !== planetOutput.utcIso ||
        output.timeScale !== planetOutput.timeScale ||
        output.referenceFrame !== planetOutput.referenceFrame ||
        output.observerMode !== planetOutput.observerMode) {
      throw new TypeError(
        `${label} Calculation Result does not align with PLANET context.`
      );
    }
  }

  if (houseOutput.lineage?.planetOutputDigest !== planet.outputDigest) {
    throw new TypeError(
      'HOUSE Calculation lineage does not reference PLANET outputDigest.'
    );
  }
  if (aspectOutput.lineage?.planetOutputDigest !== planet.outputDigest) {
    throw new TypeError(
      'ASPECT Calculation lineage does not reference PLANET outputDigest.'
    );
  }
}

function exact(value) {
  return Object.freeze({
    value,
    confidence: Object.freeze({
      level: 'exact',
      score: 1,
      basis: 'deterministic_mapping'
    })
  });
}

function createMappers() {
  return [
    Object.freeze({
      mapperCode: 'AST_PLANET_PROJECTION',
      mapperVersion: '1.0.0',
      projectionType: 'PLANET',
      async map(output) {
        return exact({
          executionMode: output.executionMode,
          utcIso: output.utcIso,
          timeScale: output.timeScale,
          referenceFrame: output.referenceFrame,
          observerMode: output.observerMode,
          planetSetCode: output.planetSetCode,
          nodePolicyCode: output.nodePolicyCode,
          retrogradePolicyCode: output.retrogradePolicyCode,
          precisionPolicyCode: output.precisionPolicyCode,
          bodies: structuredClone(output.bodies)
        });
      }
    }),
    Object.freeze({
      mapperCode: 'AST_HOUSE_PROJECTION',
      mapperVersion: '1.0.0',
      projectionType: 'HOUSE',
      async map(output) {
        return exact({
          executionMode: output.executionMode,
          utcIso: output.utcIso,
          timeScale: output.timeScale,
          referenceFrame: output.referenceFrame,
          observerMode: output.observerMode,
          observer: structuredClone(output.observer),
          houseSystemCode: output.houseSystemCode,
          zodiacPolicyCode: output.zodiacPolicyCode,
          anglePolicyCode: output.anglePolicyCode,
          precisionPolicyCode: output.precisionPolicyCode,
          angles: {
            ascendantLongitude: output.ascendantLongitude,
            midheavenLongitude: output.midheavenLongitude,
            descendantLongitude: output.descendantLongitude,
            imumCoeliLongitude: output.imumCoeliLongitude
          },
          cusps: structuredClone(output.cusps),
          placements: structuredClone(output.placements)
        });
      }
    }),
    Object.freeze({
      mapperCode: 'AST_ASPECT_PROJECTION',
      mapperVersion: '1.0.0',
      projectionType: 'ASPECT',
      async map(output) {
        return exact({
          executionMode: output.executionMode,
          utcIso: output.utcIso,
          timeScale: output.timeScale,
          referenceFrame: output.referenceFrame,
          observerMode: output.observerMode,
          aspectSetCode: output.aspectSetCode,
          orbPolicyCode: output.orbPolicyCode,
          applyingPolicyCode: output.applyingPolicyCode,
          priorityPolicyCode: output.priorityPolicyCode,
          normalizationPolicyCode: output.normalizationPolicyCode,
          evaluatedBodyCount: output.evaluatedBodyCount,
          evaluatedPairCount: output.evaluatedPairCount,
          aspects: structuredClone(output.aspects)
        });
      }
    })
  ];
}

export function createAstProjectionRuntime() {
  const sharedProjectionRuntime = createSharedProjectionRuntime({
    mappers: createMappers()
  });

  return Object.freeze({
    runtimeCode: AST_PROJECTION_RUNTIME_CODE,
    runtimeVersion: AST_PROJECTION_RUNTIME_VERSION,
    projectionTypes: PROJECTION_ORDER,

    async project(request) {
      assertObject(request, 'AST Projection request is required.');
      assertNoForbiddenKeys(request);

      if (request.runtimeCode !== AST_PROJECTION_RUNTIME_CODE) {
        throw new TypeError('Invalid AST Projection runtimeCode.');
      }
      if (request.executionMode !== 'validation') {
        throw new Error('AST_PROJECTION_PRODUCTION_EXECUTION_FORBIDDEN');
      }
      if (!/^\d+\.\d+\.\d+$/.test(request.projectionVersion || '')) {
        throw new TypeError('AST Projection version is invalid.');
      }

      const calculations = Object.freeze({
        PLANET: request.planetCalculationResult,
        HOUSE: request.houseCalculationResult,
        ASPECT: request.aspectCalculationResult
      });

      for (const projectionType of PROJECTION_ORDER) {
        assertCalculationResult(
          calculations[projectionType],
          projectionType
        );
      }
      assertCrossResultAlignment(
        calculations.PLANET,
        calculations.HOUSE,
        calculations.ASPECT
      );

      const projections = [];
      for (const projectionType of PROJECTION_ORDER) {
        projections.push(
          await sharedProjectionRuntime.project({
            runtimeCode: SHARED_PROJECTION_RUNTIME_CODE,
            methodCode: 'ASTROLOGY',
            pluginCode: 'AST',
            mapperCode: `AST_${projectionType}_PROJECTION`,
            mapperVersion: '1.0.0',
            projectionType,
            projectionVersion: request.projectionVersion,
            calculationResult: calculations[projectionType]
          })
        );
      }

      return Object.freeze({
        schemaVersion: AST_PROJECTION_BUNDLE_SCHEMA_VERSION,
        runtimeCode: AST_PROJECTION_RUNTIME_CODE,
        runtimeVersion: AST_PROJECTION_RUNTIME_VERSION,
        methodCode: 'ASTROLOGY',
        pluginCode: 'AST',
        executionMode: 'validation',
        projectionVersion: request.projectionVersion,
        sourceCalculations: Object.freeze({
          planetCalculationId: calculations.PLANET.calculationId,
          planetOutputDigest: calculations.PLANET.outputDigest,
          houseCalculationId: calculations.HOUSE.calculationId,
          houseOutputDigest: calculations.HOUSE.outputDigest,
          aspectCalculationId: calculations.ASPECT.calculationId,
          aspectOutputDigest: calculations.ASPECT.outputDigest
        }),
        projections: Object.freeze(projections),
        deterministic: true,
        providerUsed: false,
        aiUsed: false,
        projectionCreated: true,
        interpretationCreated: false,
        knowledgeCreated: false,
        realityConclusionCreated: false,
        professionalConclusionCreated: false,
        productionEligible: false
      });
    }
  });
}
