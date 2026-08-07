/**
 * PHI OS BZR-W3 Luck Cycle Runtime.
 *
 * Calculates governed Luck Cycle direction, exact Jie interval, unrounded
 * start age and deterministic 10-year cycle sequence from BZR-W1 + BZR-W2.
 *
 * traditionalCalculationSex is used only for Luck Cycle direction.
 * No identity, personality, Ten Gods, useful-god, interpretation or
 * professional conclusion is created.
 */
import {
  createSharedCalculationRuntime,
  SHARED_CALCULATION_RUNTIME_CODE
} from '../method-runtime/shared-calculation-runtime.js';

export const BZR_LUCK_CYCLE_RUNTIME_CODE = 'BZR_LUCK_CYCLE_RUNTIME';
export const BZR_LUCK_CYCLE_RUNTIME_VERSION = '1.0.0';
export const BZR_LUCK_CYCLE_ALGORITHM_CODE = 'BZR_LUCK_CYCLE_SEQUENCE';
export const BZR_LUCK_CYCLE_ALGORITHM_VERSION = '1.0.0';
export const BZR_LUCK_CYCLE_RESULT_SCHEMA_VERSION =
  'PHI-OS-BZR-LUCK-CYCLE-RESULT-v1.0.0';

const STEMS = Object.freeze([
  'JIA','YI','BING','DING','WU','JI','GENG','XIN','REN','GUI'
]);
const BRANCHES = Object.freeze([
  'ZI','CHOU','YIN','MAO','CHEN','SI','WU','WEI','SHEN','YOU','XU','HAI'
]);
const YANG_STEMS = new Set(['JIA','BING','WU','GENG','REN']);
const YIN_STEMS = new Set(['YI','DING','JI','XIN','GUI']);
const SEX_VALUES = new Set(['MALE','FEMALE']);
const DIRECTION_VALUES = new Set(['FORWARD','BACKWARD']);

const FORBIDDEN_KEYS = new Set([
  'tenGod','tenGods','usefulGod','pattern','identity','personality',
  'relationshipRole','projection','interpretation','knowledge',
  'professionalConclusion','realityConclusion','finalConclusion'
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
      throw new TypeError(`BZR-W3 boundary forbidden at ${path}.${key}`);
    }
    assertNoForbiddenKeys(child, `${path}.${key}`);
  }
}
function findRecord(records, recordType) {
  return records.find(record => record.recordType === recordType);
}
function assertIso(value, label) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new TypeError(`${label} must be a valid ISO instant.`);
  }
}
function assertPillarsRecord(record) {
  if (!record) throw new TypeError('BZR_FOUR_PILLARS_RESULT is required.');
  assertObject(record.payload, 'Four Pillars payload is required.');
  const value = record.payload;
  if (value.runtimeCode !== 'BZR_FOUR_PILLARS_RUNTIME' ||
      value.runtimeVersion !== '1.0.0' ||
      value.executionMode !== 'validation' ||
      value.calculationMode !== 'FOUR_PILLARS' ||
      value.birthTimeKnown !== true ||
      value.hourPillarStatus !== 'RESOLVED' ||
      value.deterministic !== true ||
      value.providerUsed !== false ||
      value.aiUsed !== false ||
      value.pillarCreated !== true ||
      value.luckCycleCreated !== false ||
      value.projectionCreated !== false ||
      value.interpretationCreated !== false ||
      value.professionalConclusionCreated !== false ||
      value.productionEligible !== false ||
      typeof value.outputDigest !== 'string') {
    throw new TypeError('BZR-W2 Four Pillars Result is not Luck-Cycle-ready.');
  }
  for (const type of ['yearPillar','monthPillar','dayPillar','hourPillar']) {
    const pillar = value[type];
    if (!pillar || !STEMS.includes(pillar.stemCode) ||
        !BRANCHES.includes(pillar.branchCode) ||
        !Number.isInteger(pillar.sexagenaryIndex) ||
        pillar.sexagenaryIndex < 1 || pillar.sexagenaryIndex > 60) {
      throw new TypeError(`Invalid ${type}.`);
    }
  }
}
function assertCalendarRecord(record, pillars) {
  if (!record) throw new TypeError('BZR_SOLAR_CALENDAR_CONTEXT is required.');
  assertObject(record.payload, 'Solar Calendar payload is required.');
  const value = record.payload;
  if (value.runtimeCode !== 'BZR_SOLAR_CALENDAR_RUNTIME' ||
      value.runtimeVersion !== '1.0.0' ||
      value.executionMode !== 'validation' ||
      value.deterministic !== true ||
      value.providerUsed !== false ||
      value.aiUsed !== false ||
      value.luckCycleCreated !== false ||
      value.projectionCreated !== false ||
      value.productionEligible !== false ||
      typeof value.outputDigest !== 'string' ||
      !value.trueSolarTime ||
      !Array.isArray(value.solarCalendar?.jieBoundaries) ||
      value.solarCalendar.jieBoundaries.length !== 12 ||
      value.solarCalendar.yearBoundaryPolicy !== 'exact_li_chun_instant' ||
      value.solarCalendar.monthBoundaryPolicy !== 'exact_twelve_jie_instants') {
    throw new TypeError('BZR-W1 Solar Calendar Context is invalid.');
  }
  assertIso(value.utcIso, 'calendar.utcIso');
  assertIso(value.trueSolarTime.trueSolarIso, 'calendar.trueSolarIso');
  if (pillars.lineage?.sourceCalendarOutputDigest !== value.outputDigest) {
    throw new TypeError(
      'BZR-W2 lineage does not reference the supplied BZR-W1 outputDigest.'
    );
  }
}
function assertSexRecord(record) {
  if (!record) throw new TypeError('TRADITIONAL_CALCULATION_SEX is required.');
  assertObject(record.payload, 'Traditional calculation sex payload is required.');
  const value = record.payload;
  if (!SEX_VALUES.has(value.value) ||
      value.useScope !== 'LUCK_CYCLE_DIRECTION_ONLY' ||
      value.identityInferenceAllowed !== false ||
      value.personalityClaimAllowed !== false ||
      value.relationshipRoleClaimAllowed !== false ||
      value.generalProfileClaimAllowed !== false) {
    throw new TypeError('Traditional calculation sex boundary is invalid.');
  }
  return value.value;
}
function stemPolarity(stemCode) {
  if (YANG_STEMS.has(stemCode)) return 'YANG';
  if (YIN_STEMS.has(stemCode)) return 'YIN';
  throw new TypeError(`Unknown Year Stem: ${stemCode}.`);
}
function governedDirection(polarity, sex) {
  if ((polarity === 'YANG' && sex === 'MALE') ||
      (polarity === 'YIN' && sex === 'FEMALE')) {
    return 'FORWARD';
  }
  return 'BACKWARD';
}
function assertAdapter(adapter) {
  if (!adapter || typeof adapter !== 'object' ||
      adapter.algorithmCode !== 'PHI_OS_BAZI_LUCK_CYCLE' ||
      typeof adapter.algorithmVersion !== 'string' ||
      typeof adapter.adapterCode !== 'string' ||
      typeof adapter.adapterVersion !== 'string' ||
      typeof adapter.calculateLuckCycle !== 'function') {
    throw new TypeError('Governed Luck Cycle adapter is incomplete.');
  }
  if (adapter.providerUsed === true || adapter.aiUsed === true) {
    throw new TypeError('AI or Provider Luck Cycle calculation is forbidden.');
  }
}
function normalizePillar(pillar, label) {
  assertObject(pillar, `${label} is required.`);
  if (!STEMS.includes(pillar.stemCode) ||
      !BRANCHES.includes(pillar.branchCode) ||
      !Number.isInteger(pillar.sexagenaryIndex) ||
      pillar.sexagenaryIndex < 1 || pillar.sexagenaryIndex > 60) {
    throw new TypeError(`${label} is invalid.`);
  }
  return Object.freeze({
    stemCode: pillar.stemCode,
    branchCode: pillar.branchCode,
    sexagenaryIndex: pillar.sexagenaryIndex
  });
}
function normalizeStartAge(value) {
  assertObject(value, 'Luck start age is required.');
  for (const key of [
    'years','months','days','totalYearsNumerator','totalYearsDenominator'
  ]) {
    if (!Number.isInteger(value[key]) || value[key] < 0) {
      throw new TypeError(`Luck start age ${key} is invalid.`);
    }
  }
  if (value.months > 11 || value.days > 29 ||
      value.totalYearsDenominator < 1 ||
      value.roundingApplied !== false) {
    throw new TypeError('Luck start age conversion is invalid.');
  }
  return Object.freeze({
    years: value.years,
    months: value.months,
    days: value.days,
    totalYearsNumerator: value.totalYearsNumerator,
    totalYearsDenominator: value.totalYearsDenominator,
    roundingApplied: false
  });
}
function normalizeCycles(cycles, direction, count) {
  if (!Array.isArray(cycles) || cycles.length !== count) {
    throw new TypeError('Luck Cycle sequence length is invalid.');
  }
  return Object.freeze(cycles.map((cycle, index) => {
    assertObject(cycle, `Luck Cycle ${index + 1} is required.`);
    if (cycle.cycleNumber !== index + 1 ||
        cycle.direction !== direction ||
        !Number.isInteger(cycle.startAgeYears) ||
        !Number.isInteger(cycle.endAgeYears) ||
        cycle.startAgeYears < 0 ||
        cycle.endAgeYears !== cycle.startAgeYears + 10) {
      throw new TypeError(`Luck Cycle ${index + 1} boundary is invalid.`);
    }
    return Object.freeze({
      cycleNumber: cycle.cycleNumber,
      direction,
      startAgeYears: cycle.startAgeYears,
      endAgeYears: cycle.endAgeYears,
      pillar: normalizePillar(cycle.pillar, `Luck Cycle ${index + 1} Pillar`)
    });
  }));
}

export function createBzrLuckCycleRuntime({ luckCycleAdapter } = {}) {
  assertAdapter(luckCycleAdapter);

  const algorithm = Object.freeze({
    algorithmCode: BZR_LUCK_CYCLE_ALGORITHM_CODE,
    algorithmVersion: BZR_LUCK_CYCLE_ALGORITHM_VERSION,

    async calculate(records, context) {
      const refs = context.referenceVersions;
      if (refs.executionMode !== 'validation') {
        throw new Error('BZR_LUCK_CYCLE_PRODUCTION_EXECUTION_FORBIDDEN');
      }
      if (!Number.isInteger(refs.cycleCount) ||
          refs.cycleCount < 1 || refs.cycleCount > 12) {
        throw new TypeError('cycleCount must be an integer from 1 to 12.');
      }

      const pillarsRecord = findRecord(records, 'BZR_FOUR_PILLARS_RESULT');
      const calendarRecord = findRecord(records, 'BZR_SOLAR_CALENDAR_CONTEXT');
      const sexRecord = findRecord(records, 'TRADITIONAL_CALCULATION_SEX');

      assertPillarsRecord(pillarsRecord);
      assertCalendarRecord(calendarRecord, pillarsRecord.payload);
      const sex = assertSexRecord(sexRecord);

      const polarity = stemPolarity(
        pillarsRecord.payload.yearPillar.stemCode
      );
      const direction = governedDirection(polarity, sex);
      if (!DIRECTION_VALUES.has(direction)) {
        throw new TypeError('Luck Cycle direction is invalid.');
      }

      const result = await luckCycleAdapter.calculateLuckCycle({
        fourPillars: structuredClone(pillarsRecord.payload),
        solarCalendarContext: structuredClone(calendarRecord.payload),
        traditionalCalculationSex: sex,
        yearStemPolarity: polarity,
        direction,
        referenceJie:
          direction === 'FORWARD' ? 'NEXT_JIE' : 'PREVIOUS_JIE',
        conversionPolicy: {
          threeDaysEqualYears: 1,
          oneDayEqualMonths: 4,
          twoHoursEqualDays: 10,
          rounding: 'no_rounding_in_engine'
        },
        cycleDurationYears: 10,
        cycleCount: refs.cycleCount,
        algorithmVersion: luckCycleAdapter.algorithmVersion
      });

      assertObject(result, 'Luck Cycle adapter result is required.');
      assertNoForbiddenKeys(result);

      if (result.algorithmCode !== 'PHI_OS_BAZI_LUCK_CYCLE' ||
          result.algorithmVersion !== luckCycleAdapter.algorithmVersion ||
          result.policyCode !== 'PHI_OS_BAZI_POLICY_V1' ||
          result.direction !== direction ||
          result.yearStemPolarity !== polarity ||
          result.traditionalCalculationSex !== sex ||
          result.referenceJie !==
            (direction === 'FORWARD' ? 'NEXT_JIE' : 'PREVIOUS_JIE') ||
          result.conversionPolicy?.threeDaysEqualYears !== 1 ||
          result.conversionPolicy?.oneDayEqualMonths !== 4 ||
          result.conversionPolicy?.twoHoursEqualDays !== 10 ||
          result.conversionPolicy?.rounding !== 'no_rounding_in_engine') {
        throw new TypeError('Luck Cycle algorithm or policy lineage mismatch.');
      }

      assertIso(result.birthTrueSolarIso, 'birthTrueSolarIso');
      assertIso(result.referenceJieUtcIso, 'referenceJieUtcIso');
      if (!Number.isInteger(result.intervalSeconds) ||
          result.intervalSeconds < 0) {
        throw new TypeError('Luck Cycle Jie interval is invalid.');
      }

      const startAge = normalizeStartAge(result.startAge);
      const cycles = normalizeCycles(result.cycles, direction, refs.cycleCount);

      return Object.freeze({
        schemaVersion: BZR_LUCK_CYCLE_RESULT_SCHEMA_VERSION,
        runtimeCode: BZR_LUCK_CYCLE_RUNTIME_CODE,
        runtimeVersion: BZR_LUCK_CYCLE_RUNTIME_VERSION,
        methodCode: 'BAZI',
        pluginCode: 'BZR',
        calculationType: 'LUCK_CYCLE_SEQUENCE',
        executionMode: 'validation',
        direction,
        yearStemPolarity: polarity,
        traditionalCalculationSex: sex,
        traditionalCalculationSexUseScope:
          'LUCK_CYCLE_DIRECTION_ONLY',
        birthTrueSolarIso: result.birthTrueSolarIso,
        referenceJie: result.referenceJie,
        referenceJieCode: result.referenceJieCode,
        referenceJieUtcIso: result.referenceJieUtcIso,
        intervalSeconds: result.intervalSeconds,
        startAge,
        cycleDurationYears: 10,
        cycleCount: refs.cycleCount,
        cycles,
        lineage: Object.freeze({
          fourPillarsRuntimeCode: 'BZR_FOUR_PILLARS_RUNTIME',
          fourPillarsRuntimeVersion: pillarsRecord.payload.runtimeVersion,
          fourPillarsOutputDigest: pillarsRecord.payload.outputDigest,
          solarCalendarRuntimeCode: 'BZR_SOLAR_CALENDAR_RUNTIME',
          solarCalendarRuntimeVersion: calendarRecord.payload.runtimeVersion,
          solarCalendarOutputDigest: calendarRecord.payload.outputDigest,
          algorithmCode: luckCycleAdapter.algorithmCode,
          algorithmVersion: luckCycleAdapter.algorithmVersion,
          adapterCode: luckCycleAdapter.adapterCode,
          adapterVersion: luckCycleAdapter.adapterVersion,
          policyCode: 'PHI_OS_BAZI_POLICY_V1',
          policyVersion: refs.policyVersion,
          referenceVersions: Object.freeze({ ...refs })
        }),
        deterministic: true,
        providerUsed: false,
        aiUsed: false,
        luckCycleCreated: true,
        projectionCreated: false,
        interpretationCreated: false,
        knowledgeCreated: false,
        identityInferenceCreated: false,
        personalityClaimCreated: false,
        relationshipRoleClaimCreated: false,
        professionalConclusionCreated: false,
        productionEligible: false
      });
    }
  });

  const sharedRuntime = createSharedCalculationRuntime({
    algorithms: [algorithm]
  });

  return Object.freeze({
    runtimeCode: BZR_LUCK_CYCLE_RUNTIME_CODE,
    runtimeVersion: BZR_LUCK_CYCLE_RUNTIME_VERSION,

    async calculate(request) {
      assertObject(request, 'BZR Luck Cycle request is required.');
      assertNoForbiddenKeys(request);
      if (request.runtimeCode !== BZR_LUCK_CYCLE_RUNTIME_CODE) {
        throw new TypeError('Invalid BZR Luck Cycle runtimeCode.');
      }
      if (request.executionMode !== 'validation') {
        throw new Error('BZR_LUCK_CYCLE_PRODUCTION_EXECUTION_FORBIDDEN');
      }

      return sharedRuntime.execute({
        calculationId: request.calculationId,
        runtimeCode: SHARED_CALCULATION_RUNTIME_CODE,
        methodCode: 'BAZI',
        pluginCode: 'BZR',
        algorithmCode: BZR_LUCK_CYCLE_ALGORITHM_CODE,
        algorithmVersion: BZR_LUCK_CYCLE_ALGORITHM_VERSION,
        inputRecords: request.inputRecords,
        referenceVersions: {
          executionMode: request.executionMode,
          policyCode: 'PHI_OS_BAZI_POLICY_V1',
          policyVersion: request.policyVersion,
          cycleCount: request.cycleCount,
          luckCycleAlgorithmVersion: luckCycleAdapter.algorithmVersion,
          ...(request.referenceVersions || {})
        }
      });
    }
  });
}
