/**
 * PHI OS HDR-W1 Astronomy Runtime.
 *
 * Astronomy-only plugin algorithm for SHARED_CALCULATION_RUNTIME.
 * It consumes Shared Data Authority records and delegates ephemeris work to a
 * governed, versioned adapter. It does not solve the Design Moment, map Gates,
 * build a BodyGraph, create Projection, interpret, or release.
 */
import {
  createSharedCalculationRuntime,
  SHARED_CALCULATION_RUNTIME_CODE
} from '../method-runtime/shared-calculation-runtime.js';

export const HDR_ASTRONOMY_RUNTIME_CODE = 'HDR_ASTRONOMY_RUNTIME';
export const HDR_ASTRONOMY_RUNTIME_VERSION = '1.0.0';
export const HDR_ASTRONOMY_ALGORITHM_CODE = 'HDR_ASTRONOMY_EPHEMERIS';
export const HDR_ASTRONOMY_ALGORITHM_VERSION = '1.0.0';
export const HDR_ASTRONOMY_RESULT_SCHEMA_VERSION =
  'PHI-OS-HDR-ASTRONOMY-RESULT-v1.0.0';

const REQUIRED_BODIES = Object.freeze([
  'SUN',
  'MOON',
  'NORTH_NODE',
  'MERCURY',
  'VENUS',
  'MARS',
  'JUPITER',
  'SATURN',
  'URANUS',
  'NEPTUNE',
  'PLUTO'
]);

const FORBIDDEN_KEYS = new Set([
  'designMoment',
  'gate',
  'line',
  'channel',
  'center',
  'humanDesignAuthority',
  'profile',
  'bodyGraph',
  'projection',
  'interpretation',
  'professionalConclusion'
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
      throw new TypeError(`HDR-W1 astronomy boundary forbidden at ${path}.${key}`);
    }
    assertNoForbiddenKeys(child, `${path}.${key}`);
  }
}

function normalizeLongitude(value, bodyCode) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`Invalid ecliptic longitude for ${bodyCode}.`);
  }
  const normalized = ((value % 360) + 360) % 360;
  return Number(normalized.toFixed(12));
}

function findRecord(records, recordType) {
  return records.find(record => record.recordType === recordType);
}

function assertInstantRecord(record) {
  if (!record) throw new TypeError('NORMALIZED_BIRTH_MOMENT record is required.');
  assertObject(record.payload, 'Normalized birth moment payload is required.');
  if (typeof record.payload.utcIso !== 'string' ||
      Number.isNaN(Date.parse(record.payload.utcIso))) {
    throw new TypeError('Normalized birth moment requires a valid utcIso.');
  }
  if (record.payload.timeScale !== 'UTC') {
    throw new TypeError('HDR-W1 requires UTC normalized birth moment.');
  }
  if (record.payload.uncertain === true) {
    throw new TypeError('Uncertain birth moment cannot produce full HDR astronomy.');
  }
}

function assertAdapter(adapter) {
  if (!adapter || typeof adapter !== 'object' ||
      typeof adapter.adapterCode !== 'string' ||
      typeof adapter.adapterVersion !== 'string' ||
      typeof adapter.referenceFrame !== 'string' ||
      typeof adapter.timeScale !== 'string' ||
      typeof adapter.calculateLongitudes !== 'function') {
    throw new TypeError('Governed astronomy adapter is incomplete.');
  }
  if (adapter.aiUsed === true || adapter.providerUsed === true) {
    throw new TypeError('AI or Provider astronomy adapter is forbidden.');
  }
}

export function createHdrAstronomyRuntime({ astronomyAdapter } = {}) {
  assertAdapter(astronomyAdapter);

  const algorithm = Object.freeze({
    algorithmCode: HDR_ASTRONOMY_ALGORITHM_CODE,
    algorithmVersion: HDR_ASTRONOMY_ALGORITHM_VERSION,

    async calculate(records, context) {
      const instant = findRecord(records, 'NORMALIZED_BIRTH_MOMENT');
      assertInstantRecord(instant);

      const adapterResult = await astronomyAdapter.calculateLongitudes({
        utcIso: instant.payload.utcIso,
        bodies: [...REQUIRED_BODIES],
        referenceFrame: astronomyAdapter.referenceFrame,
        timeScale: astronomyAdapter.timeScale
      });
      assertObject(adapterResult, 'Astronomy adapter result is required.');
      assertNoForbiddenKeys(adapterResult);

      if (adapterResult.referenceFrame !== astronomyAdapter.referenceFrame ||
          adapterResult.timeScale !== astronomyAdapter.timeScale) {
        throw new TypeError('Astronomy adapter reference lineage mismatch.');
      }
      assertObject(adapterResult.longitudes, 'Astronomy longitudes are required.');

      const longitudes = {};
      for (const bodyCode of REQUIRED_BODIES) {
        if (!Object.hasOwn(adapterResult.longitudes, bodyCode)) {
          throw new TypeError(`Astronomy body missing: ${bodyCode}.`);
        }
        longitudes[bodyCode] = normalizeLongitude(
          adapterResult.longitudes[bodyCode],
          bodyCode
        );
      }

      // Earth and South Node are deterministic opposite points.
      longitudes.EARTH = normalizeLongitude(longitudes.SUN + 180, 'EARTH');
      longitudes.SOUTH_NODE = normalizeLongitude(
        longitudes.NORTH_NODE + 180,
        'SOUTH_NODE'
      );

      return Object.freeze({
        schemaVersion: HDR_ASTRONOMY_RESULT_SCHEMA_VERSION,
        runtimeCode: HDR_ASTRONOMY_RUNTIME_CODE,
        runtimeVersion: HDR_ASTRONOMY_RUNTIME_VERSION,
        methodCode: 'HUMAN_DESIGN',
        pluginCode: 'HDR',
        calculationType: 'PERSONALITY_ASTRONOMY',
        utcIso: instant.payload.utcIso,
        referenceFrame: adapterResult.referenceFrame,
        timeScale: adapterResult.timeScale,
        observerMode: adapterResult.observerMode ?? 'GEOCENTRIC',
        longitudes: Object.freeze(longitudes),
        lineage: Object.freeze({
          adapterCode: astronomyAdapter.adapterCode,
          adapterVersion: astronomyAdapter.adapterVersion,
          ephemerisVersion: adapterResult.ephemerisVersion,
          referenceVersions: Object.freeze({ ...(context.referenceVersions || {}) })
        }),
        deterministic: true,
        providerUsed: false,
        aiUsed: false,
        designMomentCreated: false,
        gateMappingCreated: false,
        bodyGraphCreated: false,
        projectionCreated: false,
        interpretationCreated: false,
        professionalConclusionCreated: false
      });
    }
  });

  const sharedRuntime = createSharedCalculationRuntime({ algorithms: [algorithm] });

  return Object.freeze({
    runtimeCode: HDR_ASTRONOMY_RUNTIME_CODE,
    runtimeVersion: HDR_ASTRONOMY_RUNTIME_VERSION,
    requiredBodies: REQUIRED_BODIES,

    async calculate(request) {
      assertObject(request, 'HDR Astronomy request is required.');
      assertNoForbiddenKeys(request);
      if (request.runtimeCode !== HDR_ASTRONOMY_RUNTIME_CODE) {
        throw new TypeError('Invalid HDR Astronomy runtimeCode.');
      }

      return sharedRuntime.execute({
        calculationId: request.calculationId,
        runtimeCode: SHARED_CALCULATION_RUNTIME_CODE,
        methodCode: 'HUMAN_DESIGN',
        pluginCode: 'HDR',
        algorithmCode: HDR_ASTRONOMY_ALGORITHM_CODE,
        algorithmVersion: HDR_ASTRONOMY_ALGORITHM_VERSION,
        inputRecords: request.inputRecords,
        referenceVersions: {
          astronomyAdapter: astronomyAdapter.adapterVersion,
          ephemeris: request.ephemerisVersion,
          ...(request.referenceVersions || {})
        }
      });
    }
  });
}
