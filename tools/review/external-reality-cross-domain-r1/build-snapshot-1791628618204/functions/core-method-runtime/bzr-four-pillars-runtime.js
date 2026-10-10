/**
 * PHI OS BZR-W2 Four Pillars Runtime.
 *
 * Converts a governed BZR Solar Calendar context into deterministic Year,
 * Month, Day and optional Hour Pillars through PHI_OS_SEXAGENARY_CALENDAR.
 * Unknown birth time is represented by a distinct date-only context and never
 * by a fabricated clock time or Hour Pillar.
 */
import {
  createSharedCalculationRuntime,
  SHARED_CALCULATION_RUNTIME_CODE
} from '../method-runtime/shared-calculation-runtime.js';

export const BZR_FOUR_PILLARS_RUNTIME_CODE = 'BZR_FOUR_PILLARS_RUNTIME';
export const BZR_FOUR_PILLARS_RUNTIME_VERSION = '1.0.0';
export const BZR_FOUR_PILLARS_ALGORITHM_CODE = 'BZR_FOUR_PILLARS';
export const BZR_FOUR_PILLARS_ALGORITHM_VERSION = '1.0.0';
export const BZR_FOUR_PILLARS_RESULT_SCHEMA_VERSION =
  'PHI-OS-BZR-FOUR-PILLARS-RESULT-v1.0.0';

const STEMS = Object.freeze([
  'JIA','YI','BING','DING','WU','JI','GENG','XIN','REN','GUI'
]);
const BRANCHES = Object.freeze([
  'ZI','CHOU','YIN','MAO','CHEN','SI','WU','WEI','SHEN','YOU','XU','HAI'
]);
const PILLAR_ORDER = Object.freeze(['YEAR','MONTH','DAY','HOUR']);
const FORBIDDEN_KEYS = new Set([
  'luckCycle','projection','interpretation','knowledge',
  'professionalConclusion','realityConclusion','tenGod','usefulGod','pattern'
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
      throw new TypeError(`BZR-W2 boundary forbidden at ${path}.${key}`);
    }
    assertNoForbiddenKeys(child, `${path}.${key}`);
  }
}
function findRecord(records) {
  return records.find(record =>
    record.recordType === 'BZR_SOLAR_CALENDAR_CONTEXT' ||
    record.recordType === 'BZR_SOLAR_DATE_CONTEXT'
  );
}
function assertCalendarContext(record) {
  if (!record) throw new TypeError('BZR Solar Calendar or Date Context is required.');
  assertObject(record.payload, 'BZR calendar context payload is required.');
  const value = record.payload;
  const full = record.recordType === 'BZR_SOLAR_CALENDAR_CONTEXT';
  if (full) {
    if (value.runtimeCode !== 'BZR_SOLAR_CALENDAR_RUNTIME' ||
        value.runtimeVersion !== '1.0.0' ||
        value.executionMode !== 'validation' ||
        value.deterministic !== true || value.providerUsed !== false ||
        value.aiUsed !== false || value.stemCreated !== false ||
        value.branchCreated !== false || value.pillarCreated !== false ||
        value.luckCycleCreated !== false || value.projectionCreated !== false ||
        value.productionEligible !== false ||
        typeof value.trueSolarTime?.trueSolarIso !== 'string') {
      throw new TypeError('BZR-W1 Solar Calendar Context is invalid.');
    }
  } else {
    if (value.schemaVersion !== 'PHI-OS-BZR-SOLAR-DATE-CONTEXT-v1.0.0' ||
        value.contextStatus !== 'date_only_time_unresolved' ||
        value.birthTimeKnown !== false || value.fabricatedTimeUsed !== false ||
        typeof value.trueSolarDate !== 'string') {
      throw new TypeError('BZR date-only context is invalid.');
    }
  }
  if (!value.solarCalendar ||
      value.solarCalendar.yearBoundaryPolicy !== 'exact_li_chun_instant' ||
      value.solarCalendar.monthBoundaryPolicy !== 'exact_twelve_jie_instants' ||
      value.solarCalendar.dayBoundaryTimeBasis !== 'true_solar_time' ||
      !Array.isArray(value.solarCalendar.jieBoundaries) ||
      value.solarCalendar.jieBoundaries.length !== 12) {
    throw new TypeError('BZR calendar boundary policy is invalid.');
  }
  return full;
}
function assertAdapter(adapter) {
  if (!adapter || typeof adapter !== 'object' ||
      adapter.algorithmCode !== 'PHI_OS_SEXAGENARY_CALENDAR' ||
      typeof adapter.algorithmVersion !== 'string' ||
      typeof adapter.adapterCode !== 'string' ||
      typeof adapter.adapterVersion !== 'string' ||
      typeof adapter.calculatePillars !== 'function') {
    throw new TypeError('Governed Sexagenary Calendar adapter is incomplete.');
  }
  if (adapter.aiUsed === true || adapter.providerUsed === true) {
    throw new TypeError('AI or Provider Four Pillars calculation is forbidden.');
  }
}
function validatePillar(pillar, pillarType) {
  assertObject(pillar, `${pillarType} Pillar is required.`);
  if (pillar.pillarType !== pillarType ||
      !STEMS.includes(pillar.stemCode) ||
      !BRANCHES.includes(pillar.branchCode) ||
      !Number.isInteger(pillar.sexagenaryIndex) ||
      pillar.sexagenaryIndex < 1 || pillar.sexagenaryIndex > 60) {
    throw new TypeError(`${pillarType} Pillar is invalid.`);
  }
  return Object.freeze({
    pillarType,
    stemCode: pillar.stemCode,
    branchCode: pillar.branchCode,
    sexagenaryIndex: pillar.sexagenaryIndex
  });
}

export function createBzrFourPillarsRuntime({ sexagenaryAdapter } = {}) {
  assertAdapter(sexagenaryAdapter);
  const algorithm = Object.freeze({
    algorithmCode: BZR_FOUR_PILLARS_ALGORITHM_CODE,
    algorithmVersion: BZR_FOUR_PILLARS_ALGORITHM_VERSION,
    async calculate(records, context) {
      if (context.referenceVersions.executionMode !== 'validation') {
        throw new Error('BZR_FOUR_PILLARS_PRODUCTION_EXECUTION_FORBIDDEN');
      }
      const calendarRecord = findRecord(records);
      const fullContext = assertCalendarContext(calendarRecord);
      const value = calendarRecord.payload;
      const adapterResult = await sexagenaryAdapter.calculatePillars({
        contextType: fullContext ? 'FULL_SOLAR_CALENDAR' : 'DATE_ONLY_SOLAR_CALENDAR',
        calendarContext: structuredClone(value),
        policyCode: 'PHI_OS_BAZI_POLICY_V1',
        policyVersion: context.referenceVersions.policyVersion,
        yearBoundaryPolicy: 'exact_li_chun_instant',
        monthBoundaryPolicy: 'exact_twelve_jie_instants',
        dayBoundaryTimeBasis: 'true_solar_time',
        dayBoundaryLocalTime: '00:00',
        ziHourPolicyCode: context.referenceVersions.ziHourPolicyCode,
        algorithmVersion: sexagenaryAdapter.algorithmVersion
      });
      assertObject(adapterResult, 'Four Pillars adapter result is required.');
      assertNoForbiddenKeys(adapterResult);
      if (adapterResult.algorithmCode !== 'PHI_OS_SEXAGENARY_CALENDAR' ||
          adapterResult.algorithmVersion !== sexagenaryAdapter.algorithmVersion ||
          adapterResult.policyCode !== 'PHI_OS_BAZI_POLICY_V1' ||
          adapterResult.yearBoundaryPolicy !== 'exact_li_chun_instant' ||
          adapterResult.monthBoundaryPolicy !== 'exact_twelve_jie_instants' ||
          adapterResult.dayBoundaryTimeBasis !== 'true_solar_time') {
        throw new TypeError('Four Pillars algorithm or policy lineage mismatch.');
      }
      const year = validatePillar(adapterResult.yearPillar, 'YEAR');
      const month = validatePillar(adapterResult.monthPillar, 'MONTH');
      const day = validatePillar(adapterResult.dayPillar, 'DAY');
      let hour = null;
      let hourPillarStatus = 'UNRESOLVED';
      if (fullContext) {
        hour = validatePillar(adapterResult.hourPillar, 'HOUR');
        if (adapterResult.hourStemDerivedFromDayStem !== true) {
          throw new TypeError('Hour Stem must be derived from Day Stem.');
        }
        hourPillarStatus = 'RESOLVED';
      } else if (adapterResult.hourPillar != null) {
        throw new TypeError('Date-only context cannot create an Hour Pillar.');
      }
      const pillars = Object.freeze([year, month, day, ...(hour ? [hour] : [])]);
      return Object.freeze({
        schemaVersion: BZR_FOUR_PILLARS_RESULT_SCHEMA_VERSION,
        runtimeCode: BZR_FOUR_PILLARS_RUNTIME_CODE,
        runtimeVersion: BZR_FOUR_PILLARS_RUNTIME_VERSION,
        methodCode: 'BAZI', pluginCode: 'BZR',
        calculationType: 'FOUR_PILLARS', executionMode: 'validation',
        calculationMode: fullContext ? 'FOUR_PILLARS' : 'THREE_PILLARS',
        birthTimeKnown: fullContext,
        hourPillarStatus,
        sourceCalendarContextType: calendarRecord.recordType,
        yearPillar: year, monthPillar: month, dayPillar: day, hourPillar: hour,
        pillars,
        lineage: Object.freeze({
          sourceCalendarRuntimeCode: fullContext ? 'BZR_SOLAR_CALENDAR_RUNTIME' : null,
          sourceCalendarRuntimeVersion: fullContext ? value.runtimeVersion : null,
          sourceCalendarOutputDigest: value.outputDigest,
          sexagenaryAlgorithmCode: sexagenaryAdapter.algorithmCode,
          sexagenaryAlgorithmVersion: sexagenaryAdapter.algorithmVersion,
          sexagenaryAdapterCode: sexagenaryAdapter.adapterCode,
          sexagenaryAdapterVersion: sexagenaryAdapter.adapterVersion,
          policyCode: 'PHI_OS_BAZI_POLICY_V1',
          policyVersion: context.referenceVersions.policyVersion,
          referenceVersions: Object.freeze({ ...context.referenceVersions })
        }),
        deterministic: true, providerUsed: false, aiUsed: false,
        stemCreated: true, branchCreated: true, pillarCreated: true,
        luckCycleCreated: false, projectionNormalized: false,
        projectionCreated: false, interpretationCreated: false,
        knowledgeCreated: false, professionalConclusionCreated: false,
        productionEligible: false
      });
    }
  });
  const sharedRuntime = createSharedCalculationRuntime({ algorithms: [algorithm] });
  return Object.freeze({
    runtimeCode: BZR_FOUR_PILLARS_RUNTIME_CODE,
    runtimeVersion: BZR_FOUR_PILLARS_RUNTIME_VERSION,
    async calculate(request) {
      assertObject(request, 'BZR Four Pillars request is required.');
      assertNoForbiddenKeys(request);
      if (request.runtimeCode !== BZR_FOUR_PILLARS_RUNTIME_CODE) {
        throw new TypeError('Invalid BZR Four Pillars runtimeCode.');
      }
      if (request.executionMode !== 'validation') {
        throw new Error('BZR_FOUR_PILLARS_PRODUCTION_EXECUTION_FORBIDDEN');
      }
      return sharedRuntime.execute({
        calculationId: request.calculationId,
        runtimeCode: SHARED_CALCULATION_RUNTIME_CODE,
        methodCode: 'BAZI', pluginCode: 'BZR',
        algorithmCode: BZR_FOUR_PILLARS_ALGORITHM_CODE,
        algorithmVersion: BZR_FOUR_PILLARS_ALGORITHM_VERSION,
        inputRecords: request.inputRecords,
        referenceVersions: {
          executionMode: request.executionMode,
          policyCode: 'PHI_OS_BAZI_POLICY_V1',
          policyVersion: request.policyVersion,
          ziHourPolicyCode: request.ziHourPolicyCode,
          sexagenaryAlgorithmVersion: sexagenaryAdapter.algorithmVersion,
          ...(request.referenceVersions || {})
        }
      });
    }
  });
}
