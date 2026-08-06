/**
 * PHI OS HDR-W3 Gate Runtime.
 *
 * Maps governed Personality and Design astronomical longitudes into Gate/Line
 * activations through a versioned mapping adapter. No Gate sequence or
 * proprietary mapping table is embedded here.
 */
import {
  createSharedCalculationRuntime,
  SHARED_CALCULATION_RUNTIME_CODE
} from '../method-runtime/shared-calculation-runtime.js';

export const HDR_GATE_RUNTIME_CODE = 'HDR_GATE_RUNTIME';
export const HDR_GATE_RUNTIME_VERSION = '1.0.0';
export const HDR_GATE_ALGORITHM_CODE = 'HDR_GATE_LINE_MAPPING';
export const HDR_GATE_ALGORITHM_VERSION = '1.0.0';
export const HDR_GATE_RESULT_SCHEMA_VERSION =
  'PHI-OS-HDR-GATE-RESULT-v1.0.0';

const REQUIRED_BODIES = Object.freeze([
  'SUN',
  'EARTH',
  'MOON',
  'NORTH_NODE',
  'SOUTH_NODE',
  'MERCURY',
  'VENUS',
  'MARS',
  'JUPITER',
  'SATURN',
  'URANUS',
  'NEPTUNE',
  'PLUTO'
]);

const REQUIRED_LAYERS = Object.freeze(['PERSONALITY', 'DESIGN']);

const FORBIDDEN_KEYS = new Set([
  'channel',
  'center',
  'humanDesignAuthority',
  'profile',
  'bodyGraph',
  'projection',
  'interpretation',
  'professionalConclusion',
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
      throw new TypeError(`HDR-W3 Gate boundary forbidden at ${path}.${key}`);
    }
    assertNoForbiddenKeys(child, `${path}.${key}`);
  }
}

function normalizeLongitude(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`Invalid longitude: ${label}.`);
  }
  return Number(((((value % 360) + 360) % 360)).toFixed(12));
}

function findRecord(records, recordType) {
  return records.find(record => record.recordType === recordType);
}

function assertAstronomyRecord(record, expectedType) {
  if (!record) throw new TypeError(`${expectedType} record is required.`);
  assertObject(record.payload, `${expectedType} payload is required.`);
  if (record.payload.runtimeCode !== 'HDR_ASTRONOMY_RUNTIME' ||
      record.payload.runtimeVersion !== '1.0.0' ||
      record.payload.deterministic !== true ||
      record.payload.providerUsed !== false ||
      record.payload.aiUsed !== false ||
      record.payload.gateMappingCreated !== false ||
      record.payload.bodyGraphCreated !== false ||
      record.payload.projectionCreated !== false ||
      record.payload.interpretationCreated !== false ||
      record.payload.professionalConclusionCreated !== false) {
    throw new TypeError(`${expectedType} boundary is invalid.`);
  }
  assertObject(record.payload.longitudes, `${expectedType} longitudes are required.`);
  for (const bodyCode of REQUIRED_BODIES) {
    normalizeLongitude(
      record.payload.longitudes[bodyCode],
      `${expectedType}.${bodyCode}`
    );
  }
}

function assertDesignMoment(record, designAstronomy) {
  if (!record) throw new TypeError('HDR_DESIGN_MOMENT record is required.');
  assertObject(record.payload, 'HDR_DESIGN_MOMENT payload is required.');
  if (record.payload.runtimeCode !== 'HDR_DESIGN_MOMENT_RUNTIME' ||
      record.payload.targetSolarArcDegrees !== 88 ||
      record.payload.fixedDaySubtractionUsed !== false ||
      record.payload.designMomentCreated !== true ||
      record.payload.gateMappingCreated !== false ||
      record.payload.bodyGraphCreated !== false ||
      record.payload.projectionCreated !== false) {
    throw new TypeError('HDR Design Moment boundary is invalid.');
  }
  if (record.payload.designUtcIso !== designAstronomy.payload.utcIso) {
    throw new TypeError('Design Astronomy moment does not match HDR-W2 result.');
  }
}

function assertMappingAdapter(adapter) {
  if (!adapter || typeof adapter !== 'object' ||
      typeof adapter.adapterCode !== 'string' ||
      typeof adapter.adapterVersion !== 'string' ||
      typeof adapter.mappingVersion !== 'string' ||
      typeof adapter.sourceAuthorityCode !== 'string' ||
      typeof adapter.licenseStatus !== 'string' ||
      typeof adapter.mapLongitude !== 'function') {
    throw new TypeError('Governed Gate Mapping adapter is incomplete.');
  }
  if (adapter.aiUsed === true || adapter.providerUsed === true) {
    throw new TypeError('AI or Provider Gate Mapping is forbidden.');
  }
  if (!['restricted', 'approved'].includes(adapter.licenseStatus)) {
    throw new TypeError('Gate Mapping license status is not governed.');
  }
}

function normalizeMapping(mapping, longitude, layer, bodyCode) {
  assertObject(mapping, `Gate mapping result required: ${layer}.${bodyCode}.`);
  if (!Number.isInteger(mapping.gate) || mapping.gate < 1 || mapping.gate > 64) {
    throw new TypeError(`Invalid Gate number: ${layer}.${bodyCode}.`);
  }
  if (!Number.isInteger(mapping.line) || mapping.line < 1 || mapping.line > 6) {
    throw new TypeError(`Invalid Line number: ${layer}.${bodyCode}.`);
  }
  if (typeof mapping.positionWithinLine !== 'number' ||
      !Number.isFinite(mapping.positionWithinLine) ||
      mapping.positionWithinLine < 0 ||
      mapping.positionWithinLine >= 1) {
    throw new TypeError(
      `Invalid positionWithinLine: ${layer}.${bodyCode}.`
    );
  }
  return Object.freeze({
    layer,
    bodyCode,
    longitude,
    gate: mapping.gate,
    line: mapping.line,
    positionWithinLine: Number(mapping.positionWithinLine.toFixed(12)),
    mappingCode: mapping.mappingCode
  });
}

export function createHdrGateRuntime({ gateMappingAdapter } = {}) {
  assertMappingAdapter(gateMappingAdapter);

  const algorithm = Object.freeze({
    algorithmCode: HDR_GATE_ALGORITHM_CODE,
    algorithmVersion: HDR_GATE_ALGORITHM_VERSION,

    async calculate(records, context) {
      if (context.referenceVersions.executionMode !== 'validation') {
        throw new Error('HDR_GATE_PRODUCTION_EXECUTION_FORBIDDEN');
      }

      const personality = findRecord(records, 'HDR_PERSONALITY_ASTRONOMY');
      const designMoment = findRecord(records, 'HDR_DESIGN_MOMENT');
      const design = findRecord(records, 'HDR_DESIGN_ASTRONOMY');

      assertAstronomyRecord(personality, 'HDR_PERSONALITY_ASTRONOMY');
      assertAstronomyRecord(design, 'HDR_DESIGN_ASTRONOMY');
      assertDesignMoment(designMoment, design);

      const inputs = Object.freeze({
        PERSONALITY: personality,
        DESIGN: design
      });
      const activations = [];

      for (const layer of REQUIRED_LAYERS) {
        for (const bodyCode of REQUIRED_BODIES) {
          const longitude = normalizeLongitude(
            inputs[layer].payload.longitudes[bodyCode],
            `${layer}.${bodyCode}`
          );
          const mapping = await gateMappingAdapter.mapLongitude({
            longitude,
            layer,
            bodyCode,
            mappingVersion: gateMappingAdapter.mappingVersion
          });
          assertNoForbiddenKeys(mapping);
          activations.push(
            normalizeMapping(mapping, longitude, layer, bodyCode)
          );
        }
      }

      return Object.freeze({
        schemaVersion: HDR_GATE_RESULT_SCHEMA_VERSION,
        runtimeCode: HDR_GATE_RUNTIME_CODE,
        runtimeVersion: HDR_GATE_RUNTIME_VERSION,
        methodCode: 'HUMAN_DESIGN',
        pluginCode: 'HDR',
        calculationType: 'GATE_LINE_MAPPING',
        executionMode: 'validation',
        activations: Object.freeze(activations),
        lineage: Object.freeze({
          personalityAstronomyOutputDigest:
            personality.payload.outputDigest,
          designMomentOutputDigest:
            designMoment.payload.outputDigest,
          designAstronomyOutputDigest:
            design.payload.outputDigest,
          adapterCode: gateMappingAdapter.adapterCode,
          adapterVersion: gateMappingAdapter.adapterVersion,
          mappingVersion: gateMappingAdapter.mappingVersion,
          sourceAuthorityCode: gateMappingAdapter.sourceAuthorityCode,
          licenseStatus: gateMappingAdapter.licenseStatus,
          referenceVersions: Object.freeze({
            ...(context.referenceVersions || {})
          })
        }),
        deterministic: true,
        providerUsed: false,
        aiUsed: false,
        gateMappingCreated: true,
        channelCreated: false,
        centerCreated: false,
        authorityCreated: false,
        profileCreated: false,
        bodyGraphCreated: false,
        projectionCreated: false,
        interpretationCreated: false,
        professionalConclusionCreated: false,
        productionEligible: false
      });
    }
  });

  const sharedRuntime = createSharedCalculationRuntime({
    algorithms: [algorithm]
  });

  return Object.freeze({
    runtimeCode: HDR_GATE_RUNTIME_CODE,
    runtimeVersion: HDR_GATE_RUNTIME_VERSION,
    requiredBodies: REQUIRED_BODIES,
    requiredLayers: REQUIRED_LAYERS,

    async map(request) {
      assertObject(request, 'HDR Gate request is required.');
      assertNoForbiddenKeys(request);
      if (request.runtimeCode !== HDR_GATE_RUNTIME_CODE) {
        throw new TypeError('Invalid HDR Gate runtimeCode.');
      }
      if (request.executionMode !== 'validation') {
        throw new Error('HDR_GATE_PRODUCTION_EXECUTION_FORBIDDEN');
      }

      return sharedRuntime.execute({
        calculationId: request.calculationId,
        runtimeCode: SHARED_CALCULATION_RUNTIME_CODE,
        methodCode: 'HUMAN_DESIGN',
        pluginCode: 'HDR',
        algorithmCode: HDR_GATE_ALGORITHM_CODE,
        algorithmVersion: HDR_GATE_ALGORITHM_VERSION,
        inputRecords: request.inputRecords,
        referenceVersions: {
          executionMode: request.executionMode,
          gateMappingAdapter: gateMappingAdapter.adapterVersion,
          mappingVersion: gateMappingAdapter.mappingVersion,
          sourceAuthorityCode: gateMappingAdapter.sourceAuthorityCode,
          licenseStatus: gateMappingAdapter.licenseStatus,
          ...(request.referenceVersions || {})
        }
      });
    }
  });
}
