/**
 * PHI OS AST-W1 Astronomy Runtime.
 *
 * Establishes the deterministic astronomical context required by later
 * Astrology stages: normalized instant, Julian Day, time scale, reference
 * frame, observer mode and ephemeris lineage.
 *
 * AST-W1 does not calculate Planet positions, Houses, Aspects, Projection,
 * Interpretation or Professional output.
 */
import {
  createSharedCalculationRuntime,
  SHARED_CALCULATION_RUNTIME_CODE
} from '../method-runtime/shared-calculation-runtime.js';

export const AST_ASTRONOMY_RUNTIME_CODE = 'AST_ASTRONOMY_RUNTIME';
export const AST_ASTRONOMY_RUNTIME_VERSION = '1.0.0';
export const AST_ASTRONOMY_ALGORITHM_CODE = 'AST_ASTRONOMY_CONTEXT';
export const AST_ASTRONOMY_ALGORITHM_VERSION = '1.0.0';
export const AST_ASTRONOMY_RESULT_SCHEMA_VERSION =
  'PHI-OS-AST-ASTRONOMY-RESULT-v1.0.0';

const ALLOWED_OBSERVER_MODES = new Set(['GEOCENTRIC', 'TOPOCENTRIC']);
const ALLOWED_TIME_SCALES = new Set(['UTC', 'UT1', 'TT', 'TDB']);

const FORBIDDEN_KEYS = new Set([
  'planet',
  'planets',
  'planetLongitude',
  'planetLatitude',
  'retrograde',
  'node',
  'house',
  'ascendant',
  'midheaven',
  'aspect',
  'orb',
  'projection',
  'interpretation',
  'professionalConclusion',
  'professionalReport',
  'realityDecision'
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
      throw new TypeError(`AST-W1 Astronomy boundary forbidden at ${path}.${key}`);
    }
    assertNoForbiddenKeys(child, `${path}.${key}`);
  }
}

function findRecord(records, recordType) {
  return records.find(record => record.recordType === recordType);
}

function assertMoment(record) {
  if (!record) {
    throw new TypeError('NORMALIZED_BIRTH_MOMENT record is required.');
  }
  assertObject(record.payload, 'Normalized birth moment payload is required.');
  if (typeof record.payload.utcIso !== 'string' ||
      Number.isNaN(Date.parse(record.payload.utcIso))) {
    throw new TypeError('Normalized birth moment requires valid utcIso.');
  }
  if (record.payload.timeScale !== 'UTC') {
    throw new TypeError('AST-W1 requires a UTC normalized birth moment.');
  }
  if (record.payload.uncertain === true) {
    throw new TypeError('Uncertain birth time cannot establish full AST astronomy context.');
  }
}

function assertCoordinate(record, observerMode) {
  if (observerMode === 'GEOCENTRIC') return;
  if (!record) {
    throw new TypeError('COORDINATE record is required for TOPOCENTRIC mode.');
  }
  assertObject(record.payload, 'Coordinate payload is required.');
  const { latitude, longitude, elevationMeters = 0 } = record.payload;
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      !Number.isFinite(longitude) || longitude < -180 || longitude > 180 ||
      !Number.isFinite(elevationMeters)) {
    throw new TypeError('Invalid topocentric coordinate.');
  }
}

function assertAdapter(adapter) {
  if (!adapter || typeof adapter !== 'object' ||
      typeof adapter.adapterCode !== 'string' ||
      typeof adapter.adapterVersion !== 'string' ||
      typeof adapter.engineCode !== 'string' ||
      typeof adapter.engineVersion !== 'string' ||
      typeof adapter.licenseCode !== 'string' ||
      typeof adapter.createAstronomyContext !== 'function') {
    throw new TypeError('Governed Astrology astronomy adapter is incomplete.');
  }
  if (adapter.engineCode !== 'ASTRONOMY_ENGINE_JS') {
    throw new TypeError('AST-W1 requires the governed Astronomy Engine candidate.');
  }
  if (adapter.licenseCode !== 'MIT') {
    throw new TypeError('AST-W1 astronomy adapter must preserve MIT governance.');
  }
  if (adapter.aiUsed === true || adapter.providerUsed === true) {
    throw new TypeError('AI or Provider astronomy calculation is forbidden.');
  }
}

function normalizeJulianDay(value) {
  if (!Number.isFinite(value) || value < 0) {
    throw new TypeError('Julian Day must be a finite positive number.');
  }
  return Number(value.toFixed(12));
}

export function createAstAstronomyRuntime({ astronomyAdapter } = {}) {
  assertAdapter(astronomyAdapter);

  const algorithm = Object.freeze({
    algorithmCode: AST_ASTRONOMY_ALGORITHM_CODE,
    algorithmVersion: AST_ASTRONOMY_ALGORITHM_VERSION,

    async calculate(records, context) {
      if (context.referenceVersions.executionMode !== 'validation') {
        throw new Error('AST_ASTRONOMY_PRODUCTION_EXECUTION_FORBIDDEN');
      }

      const moment = findRecord(records, 'NORMALIZED_BIRTH_MOMENT');
      const coordinate = findRecord(records, 'COORDINATE');
      assertMoment(moment);

      const observerMode = context.referenceVersions.observerMode;
      if (!ALLOWED_OBSERVER_MODES.has(observerMode)) {
        throw new TypeError('Unsupported Astrology observer mode.');
      }
      assertCoordinate(coordinate, observerMode);

      const requestedTimeScale = context.referenceVersions.timeScale;
      if (!ALLOWED_TIME_SCALES.has(requestedTimeScale)) {
        throw new TypeError('Unsupported Astrology time scale.');
      }

      const adapterResult = await astronomyAdapter.createAstronomyContext({
        utcIso: moment.payload.utcIso,
        observerMode,
        coordinate: coordinate ? structuredClone(coordinate.payload) : null,
        requestedTimeScale,
        referenceFrame: context.referenceVersions.referenceFrame,
        ephemerisVersion: astronomyAdapter.engineVersion
      });

      assertObject(adapterResult, 'Astronomy context result is required.');
      assertNoForbiddenKeys(adapterResult);

      if (adapterResult.engineCode !== astronomyAdapter.engineCode ||
          adapterResult.engineVersion !== astronomyAdapter.engineVersion ||
          adapterResult.licenseCode !== astronomyAdapter.licenseCode) {
        throw new TypeError('Astronomy engine lineage mismatch.');
      }
      if (adapterResult.observerMode !== observerMode ||
          adapterResult.timeScale !== requestedTimeScale ||
          adapterResult.referenceFrame !== context.referenceVersions.referenceFrame) {
        throw new TypeError('Astronomy context policy mismatch.');
      }

      return Object.freeze({
        schemaVersion: AST_ASTRONOMY_RESULT_SCHEMA_VERSION,
        runtimeCode: AST_ASTRONOMY_RUNTIME_CODE,
        runtimeVersion: AST_ASTRONOMY_RUNTIME_VERSION,
        methodCode: 'ASTROLOGY',
        pluginCode: 'AST',
        calculationType: 'ASTRONOMY_CONTEXT',
        executionMode: 'validation',
        utcIso: moment.payload.utcIso,
        julianDay: normalizeJulianDay(adapterResult.julianDay),
        julianDayScale: adapterResult.julianDayScale,
        timeScale: adapterResult.timeScale,
        deltaTSeconds: Number(adapterResult.deltaTSeconds.toFixed(9)),
        referenceFrame: adapterResult.referenceFrame,
        observerMode: adapterResult.observerMode,
        observer: observerMode === 'TOPOCENTRIC'
          ? Object.freeze({
              latitude: coordinate.payload.latitude,
              longitude: coordinate.payload.longitude,
              elevationMeters: coordinate.payload.elevationMeters ?? 0,
              datum: coordinate.payload.datum
            })
          : null,
        lineage: Object.freeze({
          adapterCode: astronomyAdapter.adapterCode,
          adapterVersion: astronomyAdapter.adapterVersion,
          engineCode: astronomyAdapter.engineCode,
          engineVersion: astronomyAdapter.engineVersion,
          licenseCode: astronomyAdapter.licenseCode,
          noticeRequired: true,
          validationReferenceCode: 'NASA_JPL_HORIZONS',
          validationReferenceRole: 'validation_only',
          referenceVersions: Object.freeze({
            ...(context.referenceVersions || {})
          })
        }),
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
      });
    }
  });

  const sharedRuntime = createSharedCalculationRuntime({
    algorithms: [algorithm]
  });

  return Object.freeze({
    runtimeCode: AST_ASTRONOMY_RUNTIME_CODE,
    runtimeVersion: AST_ASTRONOMY_RUNTIME_VERSION,

    async calculate(request) {
      assertObject(request, 'AST Astronomy request is required.');
      assertNoForbiddenKeys(request);

      if (request.runtimeCode !== AST_ASTRONOMY_RUNTIME_CODE) {
        throw new TypeError('Invalid AST Astronomy runtimeCode.');
      }
      if (request.executionMode !== 'validation') {
        throw new Error('AST_ASTRONOMY_PRODUCTION_EXECUTION_FORBIDDEN');
      }

      return sharedRuntime.execute({
        calculationId: request.calculationId,
        runtimeCode: SHARED_CALCULATION_RUNTIME_CODE,
        methodCode: 'ASTROLOGY',
        pluginCode: 'AST',
        algorithmCode: AST_ASTRONOMY_ALGORITHM_CODE,
        algorithmVersion: AST_ASTRONOMY_ALGORITHM_VERSION,
        inputRecords: request.inputRecords,
        referenceVersions: {
          executionMode: request.executionMode,
          observerMode: request.observerMode,
          timeScale: request.timeScale,
          referenceFrame: request.referenceFrame,
          astronomyAdapter: astronomyAdapter.adapterVersion,
          engineCode: astronomyAdapter.engineCode,
          engineVersion: astronomyAdapter.engineVersion,
          licenseCode: astronomyAdapter.licenseCode,
          ...(request.referenceVersions || {})
        }
      });
    }
  });
}
