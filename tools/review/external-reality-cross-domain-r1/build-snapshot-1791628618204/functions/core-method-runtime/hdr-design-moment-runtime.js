/**
 * PHI OS HDR-W2 Design Moment Solver.
 *
 * Deterministically finds the prior instant at which the Sun is exactly
 * 88 degrees behind the Personality Sun. It does not use a fixed-day
 * subtraction and does not map Gates, Lines, Channels, Centers or BodyGraph.
 */
import {
  createSharedCalculationRuntime,
  SHARED_CALCULATION_RUNTIME_CODE
} from '../method-runtime/shared-calculation-runtime.js';

export const HDR_DESIGN_MOMENT_RUNTIME_CODE = 'HDR_DESIGN_MOMENT_RUNTIME';
export const HDR_DESIGN_MOMENT_RUNTIME_VERSION = '1.0.0';
export const HDR_DESIGN_MOMENT_ALGORITHM_CODE = 'HDR_SOLAR_ARC_88_SOLVER';
export const HDR_DESIGN_MOMENT_ALGORITHM_VERSION = '1.0.0';
export const HDR_DESIGN_MOMENT_RESULT_SCHEMA_VERSION =
  'PHI-OS-HDR-DESIGN-MOMENT-RESULT-v1.0.0';

const TARGET_SOLAR_ARC_DEGREES = 88;
const DEFAULT_EARLIEST_DAYS_BEFORE = 100;
const DEFAULT_LATEST_DAYS_BEFORE = 70;
const DEFAULT_ANGLE_TOLERANCE_DEGREES = 1e-7;
const DEFAULT_TIME_TOLERANCE_MS = 1;
const MAX_ITERATIONS = 80;
const DAY_MS = 86_400_000;

const FORBIDDEN_KEYS = new Set([
  'fixedEightyEightDays',
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
      throw new TypeError(`HDR-W2 design boundary forbidden at ${path}.${key}`);
    }
    assertNoForbiddenKeys(child, `${path}.${key}`);
  }
}

function normalizeLongitude(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError('Solar longitude must be finite.');
  }
  return Number(((((value % 360) + 360) % 360)).toFixed(12));
}

function signedAngularDifference(value, target) {
  const difference = ((value - target + 540) % 360) - 180;
  return Number(difference.toFixed(12));
}

function findPersonalityAstronomy(records) {
  return records.find(record =>
    record.recordType === 'HDR_PERSONALITY_ASTRONOMY'
  );
}

function assertPersonalityAstronomy(record) {
  if (!record) {
    throw new TypeError('HDR_PERSONALITY_ASTRONOMY record is required.');
  }
  assertObject(record.payload, 'Personality astronomy payload is required.');
  if (typeof record.payload.utcIso !== 'string' ||
      Number.isNaN(Date.parse(record.payload.utcIso))) {
    throw new TypeError('Personality astronomy requires valid utcIso.');
  }
  assertObject(record.payload.longitudes, 'Personality longitudes are required.');
  normalizeLongitude(record.payload.longitudes.SUN);
  if (record.payload.deterministic !== true ||
      record.payload.providerUsed !== false ||
      record.payload.aiUsed !== false ||
      record.payload.designMomentCreated !== false ||
      record.payload.gateMappingCreated !== false ||
      record.payload.bodyGraphCreated !== false ||
      record.payload.projectionCreated !== false ||
      record.payload.interpretationCreated !== false ||
      record.payload.professionalConclusionCreated !== false) {
    throw new TypeError('HDR-W1 Personality Astronomy boundary is invalid.');
  }
}

function assertSolarAdapter(adapter) {
  if (!adapter || typeof adapter !== 'object' ||
      typeof adapter.adapterCode !== 'string' ||
      typeof adapter.adapterVersion !== 'string' ||
      typeof adapter.ephemerisVersion !== 'string' ||
      typeof adapter.sunLongitudeAt !== 'function') {
    throw new TypeError('Governed solar longitude adapter is incomplete.');
  }
  if (adapter.aiUsed === true || adapter.providerUsed === true) {
    throw new TypeError('AI or Provider Design Moment solver is forbidden.');
  }
}

export function createHdrDesignMomentRuntime({ solarLongitudeAdapter } = {}) {
  assertSolarAdapter(solarLongitudeAdapter);

  const algorithm = Object.freeze({
    algorithmCode: HDR_DESIGN_MOMENT_ALGORITHM_CODE,
    algorithmVersion: HDR_DESIGN_MOMENT_ALGORITHM_VERSION,

    async calculate(records, context) {
      const personality = findPersonalityAstronomy(records);
      assertPersonalityAstronomy(personality);

      const birthMs = Date.parse(personality.payload.utcIso);
      const birthSunLongitude = normalizeLongitude(
        personality.payload.longitudes.SUN
      );
      const targetSunLongitude = normalizeLongitude(
        birthSunLongitude - TARGET_SOLAR_ARC_DEGREES
      );

      const earliestDaysBefore =
        context.referenceVersions.earliestDaysBefore ??
        DEFAULT_EARLIEST_DAYS_BEFORE;
      const latestDaysBefore =
        context.referenceVersions.latestDaysBefore ??
        DEFAULT_LATEST_DAYS_BEFORE;
      const angleToleranceDegrees =
        context.referenceVersions.angleToleranceDegrees ??
        DEFAULT_ANGLE_TOLERANCE_DEGREES;
      const timeToleranceMs =
        context.referenceVersions.timeToleranceMs ??
        DEFAULT_TIME_TOLERANCE_MS;

      if (!Number.isFinite(earliestDaysBefore) ||
          !Number.isFinite(latestDaysBefore) ||
          earliestDaysBefore <= latestDaysBefore ||
          latestDaysBefore <= 0) {
        throw new TypeError('Invalid Design Moment search window.');
      }
      if (!Number.isFinite(angleToleranceDegrees) ||
          angleToleranceDegrees <= 0 ||
          !Number.isFinite(timeToleranceMs) ||
          timeToleranceMs <= 0) {
        throw new TypeError('Invalid Design Moment tolerance.');
      }

      let lowMs = birthMs - earliestDaysBefore * DAY_MS;
      let highMs = birthMs - latestDaysBefore * DAY_MS;

      const longitudeAt = async milliseconds => {
        const utcIso = new Date(milliseconds).toISOString();
        const result = await solarLongitudeAdapter.sunLongitudeAt({
          utcIso,
          ephemerisVersion: solarLongitudeAdapter.ephemerisVersion
        });
        assertObject(result, 'Solar longitude adapter result is required.');
        assertNoForbiddenKeys(result);
        if (result.ephemerisVersion !== solarLongitudeAdapter.ephemerisVersion) {
          throw new TypeError('Solar longitude ephemeris lineage mismatch.');
        }
        return normalizeLongitude(result.sunLongitude);
      };

      let lowLongitude = await longitudeAt(lowMs);
      let highLongitude = await longitudeAt(highMs);
      let lowError = signedAngularDifference(lowLongitude, targetSunLongitude);
      let highError = signedAngularDifference(highLongitude, targetSunLongitude);

      if (!(lowError <= 0 && highError >= 0)) {
        throw new Error('DESIGN_MOMENT_TARGET_NOT_BRACKETED');
      }

      let midpointMs = lowMs;
      let midpointLongitude = lowLongitude;
      let midpointError = lowError;
      let iterations = 0;

      while (iterations < MAX_ITERATIONS) {
        midpointMs = Math.floor((lowMs + highMs) / 2);
        midpointLongitude = await longitudeAt(midpointMs);
        midpointError = signedAngularDifference(
          midpointLongitude,
          targetSunLongitude
        );
        iterations += 1;

        if (Math.abs(midpointError) <= angleToleranceDegrees ||
            highMs - lowMs <= timeToleranceMs) {
          break;
        }

        if (midpointError < 0) {
          lowMs = midpointMs;
          lowLongitude = midpointLongitude;
          lowError = midpointError;
        } else {
          highMs = midpointMs;
          highLongitude = midpointLongitude;
          highError = midpointError;
        }
      }

      if (Math.abs(midpointError) > angleToleranceDegrees &&
          highMs - lowMs > timeToleranceMs) {
        throw new Error('DESIGN_MOMENT_SOLVER_DID_NOT_CONVERGE');
      }

      const designUtcIso = new Date(midpointMs).toISOString();
      const actualSolarArcDegrees = normalizeLongitude(
        birthSunLongitude - midpointLongitude
      );

      return Object.freeze({
        schemaVersion: HDR_DESIGN_MOMENT_RESULT_SCHEMA_VERSION,
        runtimeCode: HDR_DESIGN_MOMENT_RUNTIME_CODE,
        runtimeVersion: HDR_DESIGN_MOMENT_RUNTIME_VERSION,
        methodCode: 'HUMAN_DESIGN',
        pluginCode: 'HDR',
        calculationType: 'DESIGN_MOMENT_SOLAR_ARC_88',
        personalityUtcIso: personality.payload.utcIso,
        personalitySunLongitude: birthSunLongitude,
        targetSolarArcDegrees: TARGET_SOLAR_ARC_DEGREES,
        targetSunLongitude,
        designUtcIso,
        designSunLongitude: midpointLongitude,
        actualSolarArcDegrees,
        angularErrorDegrees: Number(
          Math.abs(actualSolarArcDegrees - TARGET_SOLAR_ARC_DEGREES).toFixed(12)
        ),
        solver: Object.freeze({
          strategy: 'BRACKETED_BINARY_SEARCH',
          iterations,
          earliestDaysBefore,
          latestDaysBefore,
          angleToleranceDegrees,
          timeToleranceMs
        }),
        lineage: Object.freeze({
          astronomyRuntimeCode: 'HDR_ASTRONOMY_RUNTIME',
          astronomyRuntimeVersion: personality.payload.runtimeVersion,
          astronomyOutputDigest: personality.payload.outputDigest,
          adapterCode: solarLongitudeAdapter.adapterCode,
          adapterVersion: solarLongitudeAdapter.adapterVersion,
          ephemerisVersion: solarLongitudeAdapter.ephemerisVersion,
          referenceVersions: Object.freeze({
            ...(context.referenceVersions || {})
          })
        }),
        deterministic: true,
        providerUsed: false,
        aiUsed: false,
        fixedDaySubtractionUsed: false,
        designMomentCreated: true,
        designAstronomyCreated: false,
        gateMappingCreated: false,
        bodyGraphCreated: false,
        projectionCreated: false,
        interpretationCreated: false,
        professionalConclusionCreated: false
      });
    }
  });

  const sharedRuntime = createSharedCalculationRuntime({
    algorithms: [algorithm]
  });

  return Object.freeze({
    runtimeCode: HDR_DESIGN_MOMENT_RUNTIME_CODE,
    runtimeVersion: HDR_DESIGN_MOMENT_RUNTIME_VERSION,
    targetSolarArcDegrees: TARGET_SOLAR_ARC_DEGREES,

    async solve(request) {
      assertObject(request, 'HDR Design Moment request is required.');
      assertNoForbiddenKeys(request);
      if (request.runtimeCode !== HDR_DESIGN_MOMENT_RUNTIME_CODE) {
        throw new TypeError('Invalid HDR Design Moment runtimeCode.');
      }

      return sharedRuntime.execute({
        calculationId: request.calculationId,
        runtimeCode: SHARED_CALCULATION_RUNTIME_CODE,
        methodCode: 'HUMAN_DESIGN',
        pluginCode: 'HDR',
        algorithmCode: HDR_DESIGN_MOMENT_ALGORITHM_CODE,
        algorithmVersion: HDR_DESIGN_MOMENT_ALGORITHM_VERSION,
        inputRecords: request.inputRecords,
        referenceVersions: {
          solarLongitudeAdapter: solarLongitudeAdapter.adapterVersion,
          ephemeris: solarLongitudeAdapter.ephemerisVersion,
          earliestDaysBefore:
            request.earliestDaysBefore ?? DEFAULT_EARLIEST_DAYS_BEFORE,
          latestDaysBefore:
            request.latestDaysBefore ?? DEFAULT_LATEST_DAYS_BEFORE,
          angleToleranceDegrees:
            request.angleToleranceDegrees ?? DEFAULT_ANGLE_TOLERANCE_DEGREES,
          timeToleranceMs:
            request.timeToleranceMs ?? DEFAULT_TIME_TOLERANCE_MS,
          ...(request.referenceVersions || {})
        }
      });
    }
  });
}
