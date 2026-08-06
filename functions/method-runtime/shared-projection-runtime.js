/** PHI OS MR-W4 Shared Projection Runtime. */
import {
  SHARED_CALCULATION_RUNTIME_CODE,
  stableSerialize,
  sha256
} from './shared-calculation-runtime.js';

const FORBIDDEN_KEYS = new Set([
  'prompt', 'provider', 'providerId', 'openai', 'workersAI',
  'interpretation', 'interpretationConfidence', 'knowledge',
  'reality', 'realityConclusion', 'professionalConclusion',
  'professionalConfidence'
]);

const PROJECTION_TYPES = new Set([
  'GATE', 'CHANNEL', 'CENTER', 'AUTHORITY', 'PROFILE',
  'PLANET', 'HOUSE', 'ASPECT',
  'STEM', 'BRANCH', 'PILLAR', 'LUCK_CYCLE',
  'HEXAGRAM', 'CARD'
]);

const CONFIDENCE_LEVELS = new Set(['exact', 'derived', 'conditional']);
const CONFIDENCE_BASES = new Set([
  'deterministic_mapping', 'controlled_lookup', 'explicit_input'
]);

export const SHARED_PROJECTION_RUNTIME_CODE = 'SHARED_PROJECTION_RUNTIME';
export const SHARED_PROJECTION_RUNTIME_VERSION = '1.0.0';
export const CANONICAL_PROJECTION_SCHEMA_VERSION = 'PHI-OS-CANONICAL-PROJECTION-v1.0.0';

function assertPlainObject(value, message) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(message);
  }
}

function assertNoForbiddenKeys(value, path = '$') {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) {
      throw new TypeError(`Projection-only field forbidden at ${path}.${key}`);
    }
    assertNoForbiddenKeys(child, `${path}.${key}`);
  }
}

function assertCalculationResult(result) {
  assertPlainObject(result, 'Calculation Result is required.');
  if (result.runtimeCode !== SHARED_CALCULATION_RUNTIME_CODE) {
    throw new TypeError('Projection requires SHARED_CALCULATION_RUNTIME result.');
  }
  const requiredFlags = {
    deterministic: true,
    providerUsed: false,
    aiUsed: false,
    projectionCreated: false,
    interpretationCreated: false,
    professionalConclusionCreated: false
  };
  for (const [key, expected] of Object.entries(requiredFlags)) {
    if (result[key] !== expected) {
      throw new TypeError(`Calculation Result boundary invalid: ${key}.`);
    }
  }
  for (const key of [
    'calculationId', 'runtimeVersion', 'methodCode', 'pluginCode',
    'algorithmCode', 'algorithmVersion', 'inputDigest', 'outputDigest'
  ]) {
    if (typeof result[key] !== 'string' || result[key].length === 0) {
      throw new TypeError(`Calculation Result lineage missing: ${key}.`);
    }
  }
  if (!/^[a-f0-9]{64}$/.test(result.inputDigest) ||
      !/^[a-f0-9]{64}$/.test(result.outputDigest)) {
    throw new TypeError('Calculation Result digest is invalid.');
  }
  assertNoForbiddenKeys(result);
}

function assertMapper(mapper) {
  if (!mapper?.mapperCode || !mapper?.mapperVersion ||
      !mapper?.projectionType || typeof mapper.map !== 'function') {
    throw new TypeError('Projection mapper requires code, version, type and map function.');
  }
  if (!PROJECTION_TYPES.has(mapper.projectionType)) {
    throw new TypeError(`Unsupported projection type: ${mapper.projectionType}`);
  }
}

function assertConfidence(confidence) {
  assertPlainObject(confidence, 'Projection Confidence is required.');
  if (!CONFIDENCE_LEVELS.has(confidence.level)) {
    throw new TypeError('Invalid Projection Confidence level.');
  }
  if (!CONFIDENCE_BASES.has(confidence.basis)) {
    throw new TypeError('Invalid Projection Confidence basis.');
  }
  if (typeof confidence.score !== 'number' || confidence.score < 0 || confidence.score > 1) {
    throw new TypeError('Projection Confidence score must be between 0 and 1.');
  }
  assertNoForbiddenKeys(confidence);
}

export function createSharedProjectionRuntime({ mappers = [] } = {}) {
  const registry = new Map();
  for (const mapper of mappers) {
    assertMapper(mapper);
    const identity = `${mapper.mapperCode}@${mapper.mapperVersion}`;
    if (registry.has(identity)) throw new TypeError(`Duplicate projection mapper: ${identity}`);
    registry.set(identity, Object.freeze({ ...mapper }));
  }

  return Object.freeze({
    listMappers() {
      return [...registry.values()].map(({ map, ...metadata }) => metadata);
    },

    async project(request) {
      assertNoForbiddenKeys(request);
      if (request?.runtimeCode !== SHARED_PROJECTION_RUNTIME_CODE) {
        throw new TypeError('Invalid projection runtimeCode.');
      }
      const calculationResult = request.calculationResult;
      assertCalculationResult(calculationResult);
      const calculationSnapshot = stableSerialize(calculationResult);
      const identity = `${request.mapperCode}@${request.mapperVersion}`;
      const mapper = registry.get(identity);
      if (!mapper) throw new TypeError(`Unknown governed projection mapper: ${identity}`);
      if (mapper.projectionType !== request.projectionType) {
        throw new TypeError('Projection type does not match governed mapper.');
      }
      if (request.methodCode !== calculationResult.methodCode ||
          request.pluginCode !== calculationResult.pluginCode) {
        throw new TypeError('Projection request lineage does not match Calculation Result.');
      }

      const context = Object.freeze({
        methodCode: calculationResult.methodCode,
        pluginCode: calculationResult.pluginCode,
        projectionType: mapper.projectionType,
        mapperCode: mapper.mapperCode,
        mapperVersion: mapper.mapperVersion
      });
      const first = await mapper.map(structuredClone(calculationResult.output), context);
      const second = await mapper.map(structuredClone(calculationResult.output), context);
      assertPlainObject(first, 'Projection mapper must return an object.');
      assertNoForbiddenKeys(first);
      assertNoForbiddenKeys(second);
      if (stableSerialize(first) !== stableSerialize(second)) {
        throw new Error(`NON_DETERMINISTIC_PROJECTION:${identity}`);
      }
      assertConfidence(first.confidence);
      if (!Object.hasOwn(first, 'value')) {
        throw new TypeError('Projection mapper must return value.');
      }

      const source = Object.freeze({
        calculationId: calculationResult.calculationId,
        calculationRuntimeCode: calculationResult.runtimeCode,
        calculationRuntimeVersion: calculationResult.runtimeVersion,
        methodCode: calculationResult.methodCode,
        pluginCode: calculationResult.pluginCode,
        algorithmCode: calculationResult.algorithmCode,
        algorithmVersion: calculationResult.algorithmVersion,
        inputDigest: calculationResult.inputDigest,
        outputDigest: calculationResult.outputDigest
      });
      const identitySeed = {
        projectionType: mapper.projectionType,
        projectionVersion: request.projectionVersion,
        source,
        value: first.value
      };
      const projectionCode = `PRJ-${mapper.projectionType}-${(await sha256(identitySeed)).slice(0, 24).toUpperCase()}`;
      const projection = Object.freeze({
        schemaVersion: CANONICAL_PROJECTION_SCHEMA_VERSION,
        projectionType: mapper.projectionType,
        projectionCode,
        projectionVersion: request.projectionVersion,
        projectionValue: structuredClone(first.value),
        projectionSource: source,
        projectionConfidence: Object.freeze({ ...first.confidence }),
        deterministic: true,
        providerUsed: false,
        aiUsed: false,
        interpretationCreated: false,
        knowledgeCreated: false,
        realityConclusionCreated: false,
        professionalConclusionCreated: false
      });

      if (stableSerialize(calculationResult) !== calculationSnapshot) {
        throw new Error('CALCULATION_RESULT_MUTATION_FORBIDDEN');
      }
      return projection;
    }
  });
}
