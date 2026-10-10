/**
 * PHI OS BZR-W4 Projection Runtime.
 *
 * Creates Canonical STEM, BRANCH, PILLAR and LUCK_CYCLE projections through
 * SHARED_PROJECTION_RUNTIME. BZR-W2A normalized facts are an alignment gate,
 * not a Calculation Result or Projection authority.
 */
import {
  createSharedProjectionRuntime,
  SHARED_PROJECTION_RUNTIME_CODE
} from '../method-runtime/shared-projection-runtime.js';
import { stableSerialize } from '../method-runtime/shared-calculation-runtime.js';

export const BZR_PROJECTION_RUNTIME_CODE = 'BZR_PROJECTION_RUNTIME';
export const BZR_PROJECTION_RUNTIME_VERSION = '1.0.0';
export const BZR_PROJECTION_BUNDLE_SCHEMA_VERSION =
  'PHI-OS-BZR-PROJECTION-BUNDLE-v1.0.0';

const ORDER = Object.freeze(['YEAR','MONTH','DAY','HOUR']);
const FORBIDDEN_KEYS = new Set([
  'tenGod','tenGods','usefulGod','pattern','identity','personality',
  'interpretation','knowledge','realityConclusion','professionalConclusion'
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
      throw new TypeError(`BZR-W4 boundary forbidden at ${path}.${key}`);
    }
    assertNoForbiddenKeys(child, `${path}.${key}`);
  }
}
function assertCalculation(result, algorithmCode, outputRuntimeCode, createdFlag) {
  assertObject(result, `${algorithmCode} Calculation Result is required.`);
  if (result.runtimeCode !== 'SHARED_CALCULATION_RUNTIME' ||
      result.methodCode !== 'BAZI' ||
      result.pluginCode !== 'BZR' ||
      result.algorithmCode !== algorithmCode ||
      result.deterministic !== true ||
      result.providerUsed !== false ||
      result.aiUsed !== false ||
      result.projectionCreated !== false ||
      result.interpretationCreated !== false ||
      result.professionalConclusionCreated !== false) {
    throw new TypeError(`${algorithmCode} Calculation Result boundary is invalid.`);
  }
  const output = result.output;
  assertObject(output, `${algorithmCode} output is required.`);
  if (output.runtimeCode !== outputRuntimeCode ||
      output.runtimeVersion !== '1.0.0' ||
      output.executionMode !== 'validation' ||
      output[createdFlag] !== true ||
      output.projectionCreated !== false ||
      output.interpretationCreated !== false ||
      output.professionalConclusionCreated !== false ||
      output.productionEligible !== false) {
    throw new TypeError(`${algorithmCode} output boundary is invalid.`);
  }
  for (const key of [
    'calculationId','runtimeVersion','algorithmVersion','inputDigest','outputDigest'
  ]) {
    if (typeof result[key] !== 'string' || result[key].length === 0) {
      throw new TypeError(`${algorithmCode} lineage missing: ${key}.`);
    }
  }
  assertNoForbiddenKeys(result);
}
function assertNormalizedFacts(facts, calculationResult) {
  assertObject(facts, 'BZR-W2A Normalized Facts are required.');
  if (facts.schemaVersion !==
        'PHI-OS-BZR-NORMALIZED-PROJECTION-FACTS-v1.0.0' ||
      facts.runtimeCode !== 'BZR_PROJECTION_NORMALIZATION_RUNTIME' ||
      facts.normalizationCode !== 'BZR_CANONICAL_PROJECTION_INPUT_V1' ||
      facts.executionMode !== 'validation' ||
      facts.projectionNormalized !== true ||
      facts.projectionCreated !== false ||
      facts.productionEligible !== false ||
      facts.source?.calculationId !== calculationResult.calculationId ||
      facts.source?.outputDigest !== calculationResult.outputDigest ||
      typeof facts.normalizationDigest !== 'string') {
    throw new TypeError('BZR-W2A normalized facts do not align with BZR-W2.');
  }
  const output = calculationResult.output;
  const expected = ORDER.filter(type =>
    output.pillars.some(item => item.pillarType === type)
  );
  if (stableSerialize(facts.pillarOrder) !== stableSerialize(expected)) {
    throw new TypeError('BZR-W2A pillar order is invalid.');
  }
}
function confidence() {
  return Object.freeze({
    level: 'exact',
    score: 1,
    basis: 'deterministic_mapping'
  });
}
function mappers() {
  return [
    {
      mapperCode: 'BZR_STEM_PROJECTION',
      mapperVersion: '1.0.0',
      projectionType: 'STEM',
      async map(output) {
        return {
          value: {
            calculationMode: output.calculationMode,
            hourPillarStatus: output.hourPillarStatus,
            stems: output.pillars.map(item => ({
              position: item.pillarType,
              stemCode: item.stemCode,
              factCode: `BZR_${item.pillarType}_STEM`
            }))
          },
          confidence: confidence()
        };
      }
    },
    {
      mapperCode: 'BZR_BRANCH_PROJECTION',
      mapperVersion: '1.0.0',
      projectionType: 'BRANCH',
      async map(output) {
        return {
          value: {
            calculationMode: output.calculationMode,
            hourPillarStatus: output.hourPillarStatus,
            branches: output.pillars.map(item => ({
              position: item.pillarType,
              branchCode: item.branchCode,
              factCode: `BZR_${item.pillarType}_BRANCH`
            }))
          },
          confidence: confidence()
        };
      }
    },
    {
      mapperCode: 'BZR_PILLAR_PROJECTION',
      mapperVersion: '1.0.0',
      projectionType: 'PILLAR',
      async map(output) {
        return {
          value: {
            calculationMode: output.calculationMode,
            birthTimeKnown: output.birthTimeKnown,
            hourPillarStatus: output.hourPillarStatus,
            pillars: output.pillars.map(item => ({
              factCode: `BZR_${item.pillarType}_PILLAR`,
              pillarType: item.pillarType,
              stemCode: item.stemCode,
              branchCode: item.branchCode,
              sexagenaryIndex: item.sexagenaryIndex
            }))
          },
          confidence: confidence()
        };
      }
    },
    {
      mapperCode: 'BZR_LUCK_CYCLE_PROJECTION',
      mapperVersion: '1.0.0',
      projectionType: 'LUCK_CYCLE',
      async map(output) {
        return {
          value: {
            direction: output.direction,
            yearStemPolarity: output.yearStemPolarity,
            traditionalCalculationSexUseScope:
              output.traditionalCalculationSexUseScope,
            referenceJie: output.referenceJie,
            referenceJieCode: output.referenceJieCode,
            referenceJieUtcIso: output.referenceJieUtcIso,
            intervalSeconds: output.intervalSeconds,
            startAge: structuredClone(output.startAge),
            cycleDurationYears: output.cycleDurationYears,
            cycleCount: output.cycleCount,
            cycles: structuredClone(output.cycles)
          },
          confidence: confidence()
        };
      }
    }
  ];
}

export function createBzrProjectionRuntime() {
  const shared = createSharedProjectionRuntime({ mappers: mappers() });
  return Object.freeze({
    runtimeCode: BZR_PROJECTION_RUNTIME_CODE,
    runtimeVersion: BZR_PROJECTION_RUNTIME_VERSION,

    async project(request) {
      assertObject(request, 'BZR Projection request is required.');
      assertNoForbiddenKeys(request);
      if (request.runtimeCode !== BZR_PROJECTION_RUNTIME_CODE) {
        throw new TypeError('Invalid BZR Projection runtimeCode.');
      }
      if (request.executionMode !== 'validation') {
        throw new Error('BZR_PROJECTION_PRODUCTION_EXECUTION_FORBIDDEN');
      }
      if (!/^\d+\.\d+\.\d+$/.test(request.projectionVersion || '')) {
        throw new TypeError('projectionVersion is invalid.');
      }

      assertCalculation(
        request.fourPillarsCalculationResult,
        'BZR_FOUR_PILLARS',
        'BZR_FOUR_PILLARS_RUNTIME',
        'pillarCreated'
      );
      assertCalculation(
        request.luckCycleCalculationResult,
        'BZR_LUCK_CYCLE_SEQUENCE',
        'BZR_LUCK_CYCLE_RUNTIME',
        'luckCycleCreated'
      );
      assertNormalizedFacts(
        request.normalizedProjectionFacts,
        request.fourPillarsCalculationResult
      );

      const pillars = request.fourPillarsCalculationResult;
      const luck = request.luckCycleCalculationResult;
      if (luck.output.lineage?.fourPillarsOutputDigest !== pillars.outputDigest) {
        throw new TypeError(
          'BZR-W3 lineage does not reference BZR-W2 outputDigest.'
        );
      }

      const specs = [
        ['STEM','BZR_STEM_PROJECTION',pillars],
        ['BRANCH','BZR_BRANCH_PROJECTION',pillars],
        ['PILLAR','BZR_PILLAR_PROJECTION',pillars],
        ['LUCK_CYCLE','BZR_LUCK_CYCLE_PROJECTION',luck]
      ];
      const projections = [];
      for (const [projectionType, mapperCode, calculationResult] of specs) {
        projections.push(await shared.project({
          runtimeCode: SHARED_PROJECTION_RUNTIME_CODE,
          methodCode: 'BAZI',
          pluginCode: 'BZR',
          mapperCode,
          mapperVersion: '1.0.0',
          projectionType,
          projectionVersion: request.projectionVersion,
          calculationResult
        }));
      }

      return Object.freeze({
        schemaVersion: BZR_PROJECTION_BUNDLE_SCHEMA_VERSION,
        runtimeCode: BZR_PROJECTION_RUNTIME_CODE,
        runtimeVersion: BZR_PROJECTION_RUNTIME_VERSION,
        methodCode: 'BAZI',
        pluginCode: 'BZR',
        executionMode: 'validation',
        projectionVersion: request.projectionVersion,
        normalizedFactsReference: Object.freeze({
          normalizationCode:
            request.normalizedProjectionFacts.normalizationCode,
          normalizationVersion:
            request.normalizedProjectionFacts.normalizationVersion,
          normalizationDigest:
            request.normalizedProjectionFacts.normalizationDigest
        }),
        sourceCalculations: Object.freeze({
          fourPillarsCalculationId: pillars.calculationId,
          fourPillarsOutputDigest: pillars.outputDigest,
          luckCycleCalculationId: luck.calculationId,
          luckCycleOutputDigest: luck.outputDigest
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
