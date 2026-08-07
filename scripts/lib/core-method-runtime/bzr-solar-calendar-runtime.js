/**
 * PHI OS BZR-W1 Solar Calendar Runtime.
 *
 * Establishes the deterministic calendar context required by BZR-W2:
 * civil time, timezone/DST lineage, UTC instant, true solar time,
 * exact Li Chun instant and exact twelve Jie boundaries.
 *
 * BZR-W1 does not calculate Stem, Branch, Pillar or Luck Cycle.
 */
import {
  createSharedCalculationRuntime,
  SHARED_CALCULATION_RUNTIME_CODE
} from '../../../functions/method-runtime/shared-calculation-runtime.js';

export const BZR_SOLAR_CALENDAR_RUNTIME_CODE = 'BZR_SOLAR_CALENDAR_RUNTIME';
export const BZR_SOLAR_CALENDAR_RUNTIME_VERSION = '1.0.0';
export const BZR_SOLAR_CALENDAR_ALGORITHM_CODE = 'BZR_SOLAR_CALENDAR_CONTEXT';
export const BZR_SOLAR_CALENDAR_ALGORITHM_VERSION = '1.0.0';
export const BZR_SOLAR_CALENDAR_RESULT_SCHEMA_VERSION =
  'PHI-OS-BZR-SOLAR-CALENDAR-RESULT-v1.0.0';

const JIE_CODES = Object.freeze([
  'LI_CHUN', 'JING_ZHE', 'QING_MING', 'LI_XIA',
  'MANG_ZHONG', 'XIAO_SHU', 'LI_QIU', 'BAI_LU',
  'HAN_LU', 'LI_DONG', 'DA_XUE', 'XIAO_HAN'
]);

const FORBIDDEN_KEYS = new Set([
  'stem', 'branch', 'pillar', 'luckCycle',
  'projection', 'interpretation', 'knowledge',
  'professionalConclusion', 'realityConclusion'
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
      throw new TypeError(`BZR-W1 boundary forbidden at ${path}.${key}`);
    }
    assertNoForbiddenKeys(child, `${path}.${key}`);
  }
}

function findRecord(records, recordType) {
  return records.find(record => record.recordType === recordType);
}

function assertBirthRecord(record) {
  if (!record) throw new TypeError('BIRTH_RECORD is required.');
  assertObject(record.payload, 'Birth record payload is required.');
  const { localDate, localTime, timezoneId } = record.payload;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate || '') ||
      !/^\d{2}:\d{2}:\d{2}$/.test(localTime || '') ||
      typeof timezoneId !== 'string' || timezoneId.length === 0) {
    throw new TypeError('Birth record requires localDate, localTime and timezoneId.');
  }
  if (record.payload.birthTimeKnown !== true) {
    throw new TypeError('BZR-W1 full Solar Calendar context requires known birth time.');
  }
}

function assertCoordinate(record) {
  if (!record) throw new TypeError('COORDINATE is required.');
  assertObject(record.payload, 'Coordinate payload is required.');
  const { latitude, longitude, elevationMeters = 0, datum } = record.payload;
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      !Number.isFinite(longitude) || longitude < -180 || longitude > 180 ||
      !Number.isFinite(elevationMeters) ||
      typeof datum !== 'string' || datum.length === 0) {
    throw new TypeError('Invalid coordinate record.');
  }
}

function assertAdapter(adapter, name, method) {
  if (!adapter || typeof adapter !== 'object' ||
      typeof adapter.adapterCode !== 'string' ||
      typeof adapter.adapterVersion !== 'string' ||
      typeof adapter[method] !== 'function') {
    throw new TypeError(`${name} adapter is incomplete.`);
  }
  if (adapter.aiUsed === true || adapter.providerUsed === true) {
    throw new TypeError(`${name} adapter cannot use AI or Provider.`);
  }
}

function assertIso(value, label) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new TypeError(`${label} must be a valid ISO instant.`);
  }
}

function normalizeNumber(value, digits, label) {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${label} must be finite.`);
  }
  return Number(value.toFixed(digits));
}

function validateJieBoundaries(boundaries) {
  if (!Array.isArray(boundaries) || boundaries.length !== 12) {
    throw new TypeError('Exactly twelve Jie boundaries are required.');
  }
  const byCode = new Map(boundaries.map(item => [item.jieCode, item]));
  if (byCode.size !== 12) throw new TypeError('Jie codes must be unique.');
  return Object.freeze(JIE_CODES.map(jieCode => {
    const item = byCode.get(jieCode);
    if (!item || item.jieCode !== jieCode) {
      throw new TypeError(`Missing Jie boundary: ${jieCode}.`);
    }
    assertIso(item.utcIso, `${jieCode}.utcIso`);
    if (!Number.isFinite(item.solarLongitudeDegrees)) {
      throw new TypeError(`${jieCode} solar longitude is required.`);
    }
    return Object.freeze({
      jieCode,
      utcIso: item.utcIso,
      solarLongitudeDegrees: normalizeNumber(
        item.solarLongitudeDegrees, 9, `${jieCode}.solarLongitudeDegrees`
      )
    });
  }));
}

export function createBzrSolarCalendarRuntime({
  timezoneAdapter,
  trueSolarTimeAdapter,
  solarTermAdapter
} = {}) {
  assertAdapter(timezoneAdapter, 'Timezone', 'resolveCivilTime');
  assertAdapter(trueSolarTimeAdapter, 'True Solar Time', 'convert');
  assertAdapter(solarTermAdapter, 'Solar Term', 'resolveYearContext');

  if (timezoneAdapter.authorityCode !== 'IANA_TZDB') {
    throw new TypeError('BZR-W1 requires IANA_TZDB timezone authority.');
  }
  if (solarTermAdapter.engineCode !== 'ASTRONOMY_ENGINE_JS' ||
      solarTermAdapter.licenseCode !== 'MIT') {
    throw new TypeError('BZR-W1 requires governed MIT Astronomy Engine solar terms.');
  }
  if (trueSolarTimeAdapter.algorithmCode !== 'PHI_OS_TRUE_SOLAR_TIME') {
    throw new TypeError('BZR-W1 requires PHI_OS_TRUE_SOLAR_TIME.');
  }

  const algorithm = Object.freeze({
    algorithmCode: BZR_SOLAR_CALENDAR_ALGORITHM_CODE,
    algorithmVersion: BZR_SOLAR_CALENDAR_ALGORITHM_VERSION,

    async calculate(records, context) {
      if (context.referenceVersions.executionMode !== 'validation') {
        throw new Error('BZR_SOLAR_CALENDAR_PRODUCTION_EXECUTION_FORBIDDEN');
      }

      const birth = findRecord(records, 'BIRTH_RECORD');
      const coordinate = findRecord(records, 'COORDINATE');
      assertBirthRecord(birth);
      assertCoordinate(coordinate);

      const timezone = await timezoneAdapter.resolveCivilTime({
        localDate: birth.payload.localDate,
        localTime: birth.payload.localTime,
        timezoneId: birth.payload.timezoneId,
        disambiguationPolicyCode:
          context.referenceVersions.dstDisambiguationPolicyCode,
        tzdbVersion: timezoneAdapter.authorityVersion
      });
      assertObject(timezone, 'Timezone result is required.');
      assertIso(timezone.utcIso, 'timezone.utcIso');
      if (timezone.timezoneId !== birth.payload.timezoneId ||
          timezone.authorityCode !== 'IANA_TZDB' ||
          timezone.authorityVersion !== timezoneAdapter.authorityVersion ||
          !Number.isFinite(timezone.utcOffsetMinutes) ||
          typeof timezone.dstApplied !== 'boolean') {
        throw new TypeError('Timezone result or lineage is invalid.');
      }

      const trueSolar = await trueSolarTimeAdapter.convert({
        utcIso: timezone.utcIso,
        civilLocalDate: birth.payload.localDate,
        civilLocalTime: birth.payload.localTime,
        timezoneId: birth.payload.timezoneId,
        utcOffsetMinutes: timezone.utcOffsetMinutes,
        longitude: coordinate.payload.longitude,
        equationOfTimePolicyCode:
          context.referenceVersions.equationOfTimePolicyCode,
        algorithmVersion: trueSolarTimeAdapter.algorithmVersion
      });
      assertObject(trueSolar, 'True solar time result is required.');
      assertIso(trueSolar.trueSolarIso, 'trueSolar.trueSolarIso');
      if (trueSolar.algorithmCode !== 'PHI_OS_TRUE_SOLAR_TIME' ||
          trueSolar.algorithmVersion !== trueSolarTimeAdapter.algorithmVersion ||
          !Number.isFinite(trueSolar.longitudeCorrectionMinutes) ||
          !Number.isFinite(trueSolar.equationOfTimeMinutes) ||
          !Number.isFinite(trueSolar.totalCorrectionMinutes)) {
        throw new TypeError('True solar time result or lineage is invalid.');
      }

      const solarTerms = await solarTermAdapter.resolveYearContext({
        utcIso: timezone.utcIso,
        trueSolarIso: trueSolar.trueSolarIso,
        gregorianYear: Number(birth.payload.localDate.slice(0, 4)),
        referenceFrame: context.referenceVersions.referenceFrame,
        timeScale: context.referenceVersions.timeScale,
        engineVersion: solarTermAdapter.engineVersion
      });
      assertObject(solarTerms, 'Solar term result is required.');
      assertIso(solarTerms.liChunUtcIso, 'solarTerms.liChunUtcIso');
      if (solarTerms.engineCode !== 'ASTRONOMY_ENGINE_JS' ||
          solarTerms.engineVersion !== solarTermAdapter.engineVersion ||
          solarTerms.licenseCode !== 'MIT' ||
          solarTerms.yearBoundaryPolicy !== 'exact_li_chun_instant' ||
          solarTerms.monthBoundaryPolicy !== 'exact_twelve_jie_instants') {
        throw new TypeError('Solar term result or policy lineage is invalid.');
      }
      const jieBoundaries = validateJieBoundaries(solarTerms.jieBoundaries);

      return Object.freeze({
        schemaVersion: BZR_SOLAR_CALENDAR_RESULT_SCHEMA_VERSION,
        runtimeCode: BZR_SOLAR_CALENDAR_RUNTIME_CODE,
        runtimeVersion: BZR_SOLAR_CALENDAR_RUNTIME_VERSION,
        methodCode: 'BAZI',
        pluginCode: 'BZR',
        calculationType: 'SOLAR_CALENDAR_CONTEXT',
        executionMode: 'validation',
        recordedCivilTime: Object.freeze({
          localDate: birth.payload.localDate,
          localTime: birth.payload.localTime,
          timezoneId: birth.payload.timezoneId
        }),
        utcIso: timezone.utcIso,
        timezone: Object.freeze({
          timezoneId: timezone.timezoneId,
          utcOffsetMinutes: timezone.utcOffsetMinutes,
          dstApplied: timezone.dstApplied,
          dstTransitionStatus: timezone.dstTransitionStatus
        }),
        coordinate: Object.freeze({
          latitude: coordinate.payload.latitude,
          longitude: coordinate.payload.longitude,
          elevationMeters: coordinate.payload.elevationMeters ?? 0,
          datum: coordinate.payload.datum
        }),
        trueSolarTime: Object.freeze({
          trueSolarIso: trueSolar.trueSolarIso,
          longitudeCorrectionMinutes: normalizeNumber(
            trueSolar.longitudeCorrectionMinutes, 9,
            'longitudeCorrectionMinutes'
          ),
          equationOfTimeMinutes: normalizeNumber(
            trueSolar.equationOfTimeMinutes, 9,
            'equationOfTimeMinutes'
          ),
          totalCorrectionMinutes: normalizeNumber(
            trueSolar.totalCorrectionMinutes, 9,
            'totalCorrectionMinutes'
          )
        }),
        solarCalendar: Object.freeze({
          liChunUtcIso: solarTerms.liChunUtcIso,
          jieBoundaries,
          yearBoundaryPolicy: 'exact_li_chun_instant',
          monthBoundaryPolicy: 'exact_twelve_jie_instants',
          dayBoundaryTimeBasis: 'true_solar_time',
          dayBoundaryLocalTime: '00:00'
        }),
        lineage: Object.freeze({
          tzdbAuthorityCode: timezoneAdapter.authorityCode,
          tzdbAuthorityVersion: timezoneAdapter.authorityVersion,
          timezoneAdapterCode: timezoneAdapter.adapterCode,
          timezoneAdapterVersion: timezoneAdapter.adapterVersion,
          trueSolarAlgorithmCode: trueSolarTimeAdapter.algorithmCode,
          trueSolarAlgorithmVersion: trueSolarTimeAdapter.algorithmVersion,
          trueSolarAdapterCode: trueSolarTimeAdapter.adapterCode,
          trueSolarAdapterVersion: trueSolarTimeAdapter.adapterVersion,
          solarTermEngineCode: solarTermAdapter.engineCode,
          solarTermEngineVersion: solarTermAdapter.engineVersion,
          solarTermLicenseCode: solarTermAdapter.licenseCode,
          solarTermAdapterCode: solarTermAdapter.adapterCode,
          solarTermAdapterVersion: solarTermAdapter.adapterVersion,
          policyCode: 'PHI_OS_BAZI_POLICY_V1',
          policyVersion: context.referenceVersions.policyVersion,
          referenceVersions: Object.freeze({
            ...context.referenceVersions
          })
        }),
        deterministic: true,
        providerUsed: false,
        aiUsed: false,
        stemCreated: false,
        branchCreated: false,
        pillarCreated: false,
        luckCycleCreated: false,
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
    runtimeCode: BZR_SOLAR_CALENDAR_RUNTIME_CODE,
    runtimeVersion: BZR_SOLAR_CALENDAR_RUNTIME_VERSION,

    async calculate(request) {
      assertObject(request, 'BZR Solar Calendar request is required.');
      assertNoForbiddenKeys(request);
      if (request.runtimeCode !== BZR_SOLAR_CALENDAR_RUNTIME_CODE) {
        throw new TypeError('Invalid BZR Solar Calendar runtimeCode.');
      }
      if (request.executionMode !== 'validation') {
        throw new Error('BZR_SOLAR_CALENDAR_PRODUCTION_EXECUTION_FORBIDDEN');
      }

      return sharedRuntime.execute({
        calculationId: request.calculationId,
        runtimeCode: SHARED_CALCULATION_RUNTIME_CODE,
        methodCode: 'BAZI',
        pluginCode: 'BZR',
        algorithmCode: BZR_SOLAR_CALENDAR_ALGORITHM_CODE,
        algorithmVersion: BZR_SOLAR_CALENDAR_ALGORITHM_VERSION,
        inputRecords: request.inputRecords,
        referenceVersions: {
          executionMode: request.executionMode,
          policyCode: 'PHI_OS_BAZI_POLICY_V1',
          policyVersion: request.policyVersion,
          tzdbVersion: timezoneAdapter.authorityVersion,
          dstDisambiguationPolicyCode:
            request.dstDisambiguationPolicyCode,
          equationOfTimePolicyCode:
            request.equationOfTimePolicyCode,
          timeScale: request.timeScale,
          referenceFrame: request.referenceFrame,
          ...(request.referenceVersions || {})
        }
      });
    }
  });
}
