/**
 * PHI OS HDR-W5 Projection Runtime.
 *
 * Converts one governed HDR-W4 Shared Calculation Result into canonical
 * GATE, CHANNEL, CENTER, AUTHORITY and PROFILE Projection JSON objects by
 * delegating all projection identity, lineage and determinism rules to the
 * frozen SHARED_PROJECTION_RUNTIME.
 */
import {
  createSharedProjectionRuntime,
  SHARED_PROJECTION_RUNTIME_CODE
} from '../method-runtime/shared-projection-runtime.js';

export const HDR_PROJECTION_RUNTIME_CODE = 'HDR_PROJECTION_RUNTIME';
export const HDR_PROJECTION_RUNTIME_VERSION = '1.0.0';
export const HDR_PROJECTION_BUNDLE_SCHEMA_VERSION =
  'PHI-OS-HDR-PROJECTION-BUNDLE-v1.0.0';

const PROJECTION_TYPES = Object.freeze([
  'GATE',
  'CHANNEL',
  'CENTER',
  'AUTHORITY',
  'PROFILE'
]);

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
      throw new TypeError(`HDR-W5 Projection boundary forbidden at ${path}.${key}`);
    }
    assertNoForbiddenKeys(child, `${path}.${key}`);
  }
}

function assertBodyGraphCalculation(result) {
  assertObject(result, 'HDR-W4 Calculation Result is required.');
  if (result.runtimeCode !== 'SHARED_CALCULATION_RUNTIME' ||
      result.methodCode !== 'HUMAN_DESIGN' ||
      result.pluginCode !== 'HDR' ||
      result.algorithmCode !== 'HDR_BODYGRAPH_STRUCTURE_RESOLUTION' ||
      result.deterministic !== true ||
      result.providerUsed !== false ||
      result.aiUsed !== false ||
      result.projectionCreated !== false ||
      result.interpretationCreated !== false ||
      result.professionalConclusionCreated !== false) {
    throw new TypeError('HDR-W4 Calculation Result boundary is invalid.');
  }

  assertObject(result.output, 'HDR-W4 Calculation output is required.');
  const output = result.output;
  if (output.runtimeCode !== 'HDR_BODYGRAPH_RUNTIME' ||
      output.runtimeVersion !== '1.0.0' ||
      output.executionMode !== 'validation' ||
      output.bodyGraphCreated !== true ||
      output.projectionCreated !== false ||
      output.interpretationCreated !== false ||
      output.professionalConclusionCreated !== false ||
      output.productionEligible !== false) {
    throw new TypeError('HDR-W4 BodyGraph output boundary is invalid.');
  }

  if (!Array.isArray(output.activations) || output.activations.length !== 26 ||
      !Array.isArray(output.channels) ||
      !Array.isArray(output.definedCenters) ||
      !Array.isArray(output.undefinedCenters) ||
      typeof output.typeCode !== 'string' ||
      typeof output.humanDesignAuthorityCode !== 'string' ||
      !output.profile ||
      typeof output.definitionCode !== 'string') {
    throw new TypeError('HDR-W4 BodyGraph structure is incomplete.');
  }

  assertNoForbiddenKeys(result);
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
      mapperCode: 'HDR_GATE_PROJECTION',
      mapperVersion: '1.0.0',
      projectionType: 'GATE',
      async map(output) {
        return exact({
          executionMode: output.executionMode,
          activations: structuredClone(output.activations)
        });
      }
    }),
    Object.freeze({
      mapperCode: 'HDR_CHANNEL_PROJECTION',
      mapperVersion: '1.0.0',
      projectionType: 'CHANNEL',
      async map(output) {
        return exact({
          executionMode: output.executionMode,
          channels: structuredClone(output.channels)
        });
      }
    }),
    Object.freeze({
      mapperCode: 'HDR_CENTER_PROJECTION',
      mapperVersion: '1.0.0',
      projectionType: 'CENTER',
      async map(output) {
        return exact({
          executionMode: output.executionMode,
          definedCenters: structuredClone(output.definedCenters),
          undefinedCenters: structuredClone(output.undefinedCenters),
          definitionCode: output.definitionCode,
          typeCode: output.typeCode
        });
      }
    }),
    Object.freeze({
      mapperCode: 'HDR_AUTHORITY_PROJECTION',
      mapperVersion: '1.0.0',
      projectionType: 'AUTHORITY',
      async map(output) {
        return exact({
          executionMode: output.executionMode,
          authorityCode: output.humanDesignAuthorityCode,
          typeCode: output.typeCode
        });
      }
    }),
    Object.freeze({
      mapperCode: 'HDR_PROFILE_PROJECTION',
      mapperVersion: '1.0.0',
      projectionType: 'PROFILE',
      async map(output) {
        return exact({
          executionMode: output.executionMode,
          profile: structuredClone(output.profile)
        });
      }
    })
  ];
}

export function createHdrProjectionRuntime() {
  const sharedProjection = createSharedProjectionRuntime({
    mappers: createMappers()
  });

  return Object.freeze({
    runtimeCode: HDR_PROJECTION_RUNTIME_CODE,
    runtimeVersion: HDR_PROJECTION_RUNTIME_VERSION,
    projectionTypes: PROJECTION_TYPES,

    async project(request) {
      assertObject(request, 'HDR Projection request is required.');
      assertNoForbiddenKeys(request);

      if (request.runtimeCode !== HDR_PROJECTION_RUNTIME_CODE) {
        throw new TypeError('Invalid HDR Projection runtimeCode.');
      }
      if (request.executionMode !== 'validation') {
        throw new Error('HDR_PROJECTION_PRODUCTION_EXECUTION_FORBIDDEN');
      }

      const calculationResult = request.calculationResult;
      assertBodyGraphCalculation(calculationResult);

      const projections = [];
      for (const projectionType of PROJECTION_TYPES) {
        projections.push(await sharedProjection.project({
          runtimeCode: SHARED_PROJECTION_RUNTIME_CODE,
          methodCode: 'HUMAN_DESIGN',
          pluginCode: 'HDR',
          mapperCode: `HDR_${projectionType}_PROJECTION`,
          mapperVersion: '1.0.0',
          projectionType,
          projectionVersion: request.projectionVersion,
          calculationResult
        }));
      }

      return Object.freeze({
        schemaVersion: HDR_PROJECTION_BUNDLE_SCHEMA_VERSION,
        runtimeCode: HDR_PROJECTION_RUNTIME_CODE,
        runtimeVersion: HDR_PROJECTION_RUNTIME_VERSION,
        methodCode: 'HUMAN_DESIGN',
        pluginCode: 'HDR',
        executionMode: 'validation',
        sourceCalculationId: calculationResult.calculationId,
        sourceCalculationOutputDigest: calculationResult.outputDigest,
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
