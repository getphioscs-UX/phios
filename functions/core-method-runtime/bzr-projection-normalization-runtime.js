/**
 * PHI OS BZR-W2A Canonical Projection Normalization.
 *
 * Produces stable projection-ready facts from BZR-W2 without invoking the
 * SHARED_PROJECTION_RUNTIME. Formal Canonical Projection remains BZR-W4.
 */
import { stableSerialize, sha256 } from '../method-runtime/shared-calculation-runtime.js';

export const BZR_PROJECTION_NORMALIZATION_RUNTIME_CODE =
  'BZR_PROJECTION_NORMALIZATION_RUNTIME';
export const BZR_PROJECTION_NORMALIZATION_RUNTIME_VERSION = '1.0.0';
export const BZR_NORMALIZED_FACTS_SCHEMA_VERSION =
  'PHI-OS-BZR-NORMALIZED-PROJECTION-FACTS-v1.0.0';

const ORDER = Object.freeze(['YEAR','MONTH','DAY','HOUR']);
function assertObject(value, message) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(message);
}
function assertCalculationResult(result) {
  assertObject(result, 'BZR-W2 Calculation Result is required.');
  if (result.runtimeCode !== 'SHARED_CALCULATION_RUNTIME' ||
      result.methodCode !== 'BAZI' || result.pluginCode !== 'BZR' ||
      result.algorithmCode !== 'BZR_FOUR_PILLARS' ||
      result.deterministic !== true || result.providerUsed !== false ||
      result.aiUsed !== false || result.projectionCreated !== false ||
      result.interpretationCreated !== false ||
      result.professionalConclusionCreated !== false) {
    throw new TypeError('BZR-W2 Calculation Result boundary is invalid.');
  }
  const output = result.output;
  assertObject(output, 'BZR-W2 output is required.');
  if (output.runtimeCode !== 'BZR_FOUR_PILLARS_RUNTIME' ||
      output.runtimeVersion !== '1.0.0' || output.pillarCreated !== true ||
      output.projectionNormalized !== false || output.projectionCreated !== false ||
      output.productionEligible !== false || !Array.isArray(output.pillars)) {
    throw new TypeError('BZR-W2 output is not normalization-ready.');
  }
}
function normalizedPillar(pillar) {
  return Object.freeze({
    factCode: `BZR_${pillar.pillarType}_PILLAR`,
    pillarType: pillar.pillarType,
    stem: Object.freeze({
      factCode: `BZR_${pillar.pillarType}_STEM`, code: pillar.stemCode
    }),
    branch: Object.freeze({
      factCode: `BZR_${pillar.pillarType}_BRANCH`, code: pillar.branchCode
    }),
    sexagenaryIndex: pillar.sexagenaryIndex
  });
}
export function createBzrProjectionNormalizationRuntime() {
  return Object.freeze({
    runtimeCode: BZR_PROJECTION_NORMALIZATION_RUNTIME_CODE,
    runtimeVersion: BZR_PROJECTION_NORMALIZATION_RUNTIME_VERSION,
    async normalize(request) {
      assertObject(request, 'BZR normalization request is required.');
      if (request.runtimeCode !== BZR_PROJECTION_NORMALIZATION_RUNTIME_CODE) {
        throw new TypeError('Invalid BZR normalization runtimeCode.');
      }
      if (request.executionMode !== 'validation') {
        throw new Error('BZR_PROJECTION_NORMALIZATION_PRODUCTION_FORBIDDEN');
      }
      assertCalculationResult(request.calculationResult);
      const sourceSnapshot = stableSerialize(request.calculationResult);
      const output = request.calculationResult.output;
      const byType = new Map(output.pillars.map(item => [item.pillarType, item]));
      const pillars = ORDER.filter(type => byType.has(type)).map(type =>
        normalizedPillar(byType.get(type))
      );
      if (output.calculationMode === 'THREE_PILLARS' && byType.has('HOUR')) {
        throw new TypeError('Three-pillar result cannot normalize an Hour Pillar.');
      }
      if (output.calculationMode === 'FOUR_PILLARS' && !byType.has('HOUR')) {
        throw new TypeError('Four-pillar result requires an Hour Pillar.');
      }
      const normalizedPayload = {
        schemaVersion: BZR_NORMALIZED_FACTS_SCHEMA_VERSION,
        runtimeCode: BZR_PROJECTION_NORMALIZATION_RUNTIME_CODE,
        runtimeVersion: BZR_PROJECTION_NORMALIZATION_RUNTIME_VERSION,
        methodCode: 'BAZI', pluginCode: 'BZR', executionMode: 'validation',
        normalizationCode: 'BZR_CANONICAL_PROJECTION_INPUT_V1',
        normalizationVersion: '1.0.0',
        calculationMode: output.calculationMode,
        hourPillarStatus: output.hourPillarStatus,
        pillarOrder: pillars.map(item => item.pillarType),
        pillars,
        source: {
          calculationId: request.calculationResult.calculationId,
          calculationRuntimeCode: request.calculationResult.runtimeCode,
          calculationRuntimeVersion: request.calculationResult.runtimeVersion,
          methodCode: request.calculationResult.methodCode,
          pluginCode: request.calculationResult.pluginCode,
          algorithmCode: request.calculationResult.algorithmCode,
          algorithmVersion: request.calculationResult.algorithmVersion,
          inputDigest: request.calculationResult.inputDigest,
          outputDigest: request.calculationResult.outputDigest
        },
        deterministic: true, providerUsed: false, aiUsed: false,
        projectionNormalized: true, projectionCreated: false,
        interpretationCreated: false, knowledgeCreated: false,
        professionalConclusionCreated: false, productionEligible: false
      };
      const normalizationDigest = await sha256(normalizedPayload);
      if (stableSerialize(request.calculationResult) !== sourceSnapshot) {
        throw new Error('BZR_W2_CALCULATION_RESULT_MUTATION_FORBIDDEN');
      }
      return Object.freeze({ ...normalizedPayload, normalizationDigest });
    }
  });
}
