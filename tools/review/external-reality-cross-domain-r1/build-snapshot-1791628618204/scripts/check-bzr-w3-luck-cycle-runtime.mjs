import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  createBzrLuckCycleRuntime,
  BZR_LUCK_CYCLE_RUNTIME_CODE
} from '../functions/core-method-runtime/bzr-luck-cycle-runtime.js';

const root = process.cwd();
const readJson = async file =>
  JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));

const contract = await readJson(
  'content/professional/core-method-runtime/bzr-luck-cycle-runtime-v1.json'
);
const schema = await readJson(
  'content/professional/core-method-runtime/bzr-luck-cycle-result-v1.schema.json'
);
const w1 = await readJson(
  'content/professional/core-method-runtime/bzr-solar-calendar-runtime-v1.json'
);
const w2 = await readJson(
  'content/professional/core-method-runtime/bzr-four-pillars-runtime-v1.json'
);
const w2a = await readJson(
  'content/professional/core-method-runtime/bzr-projection-normalization-v1.json'
);
const boundary = await readJson(
  'content/professional/core-method-runtime/bzr-runtime-boundary-v1.json'
);
const algorithmGovernance = await readJson(
  'content/professional/method-governance/imr-algorithm-governance-registry-v1.json'
);
const eligibility = await readJson(
  'content/professional/method-governance/imr-production-eligibility-registry-v1.json'
);

assert.equal(contract.stageCode, 'BZR-W3');
assert.deepEqual(contract.requiredInputs, [
  'BZR_FOUR_PILLARS_RESULT',
  'BZR_SOLAR_CALENDAR_CONTEXT',
  'TRADITIONAL_CALCULATION_SEX'
]);
assert.equal(contract.inputBoundary.fourPillarsModeRequired, true);
assert.equal(contract.inputBoundary.threePillarsLuckCycleAllowed, false);
assert.equal(
  contract.inputBoundary.traditionalCalculationSexUseScope,
  'LUCK_CYCLE_DIRECTION_ONLY'
);
assert.equal(contract.inputBoundary.identityInferenceAllowed, false);
assert.equal(
  contract.directionPolicy.rule,
  'year_stem_polarity_plus_traditional_calculation_sex'
);
assert.deepEqual(contract.directionPolicy.forward, [
  'YANG_MALE','YIN_FEMALE'
]);
assert.deepEqual(contract.directionPolicy.backward, [
  'YIN_MALE','YANG_FEMALE'
]);
assert.equal(contract.startPolicy.forwardReference, 'NEXT_JIE');
assert.equal(contract.startPolicy.backwardReference, 'PREVIOUS_JIE');
assert.equal(contract.startPolicy.threeDaysEqualYears, 1);
assert.equal(contract.startPolicy.oneDayEqualMonths, 4);
assert.equal(contract.startPolicy.twoHoursEqualDays, 10);
assert.equal(contract.startPolicy.rounding, 'no_rounding_in_engine');
assert.equal(contract.scope.createsLuckCycleSequence, true);
assert.equal(contract.scope.createsTenGods, false);
assert.equal(contract.scope.createsProjection, false);
assert.equal(contract.execution.productionExecutionAllowed, false);
assert.equal(contract.nextStage, 'BZR-W4');
assert.equal(w1.stageCode, 'BZR-W1');
assert.equal(w2.stageCode, 'BZR-W2');
assert.equal(w2a.stageCode, 'BZR-W2A');
assert.deepEqual(boundary.stageOwnership['BZR-W3'], [
  'luckDirection','luckStart','luckCycleSequence'
]);
assert.equal(schema.properties.productionEligible.const, false);

const governed = algorithmGovernance.methods.find(
  item => item.methodCode === 'BAZI'
);
assert.equal(governed.validation.status, 'not_executed');
assert.equal(governed.validation.fixturesPassed, false);
assert.equal(governed.validation.regressionPassed, false);
assert.equal(governed.productionAuthorityCreated, false);

const baziEligibility = eligibility.methods.find(
  item => item.methodCode === 'BAZI'
);
assert.equal(baziEligibility.commercialLicensePassed, false);
assert.equal(baziEligibility.validationPassed, false);
assert.equal(baziEligibility.regressionPassed, false);
assert.equal(baziEligibility.productionReady, false);
assert.equal(baziEligibility.professionalReady, false);

const calendarDigest = 'a'.repeat(64);
const pillarsDigest = 'b'.repeat(64);

const calendarRecord = {
  authority: 'SHARED_DATA_AUTHORITY',
  status: 'verified',
  methodOwner: null,
  pluginOwner: null,
  recordId: 'BZR-CALENDAR-001',
  recordType: 'BZR_SOLAR_CALENDAR_CONTEXT',
  recordVersion: '1.0.0',
  payload: {
    runtimeCode: 'BZR_SOLAR_CALENDAR_RUNTIME',
    runtimeVersion: '1.0.0',
    outputDigest: calendarDigest,
    executionMode: 'validation',
    utcIso: '1989-11-15T14:50:00.000Z',
    trueSolarTime: {
      trueSolarIso: '1989-11-15T22:37:30.000+08:00'
    },
    solarCalendar: {
      yearBoundaryPolicy: 'exact_li_chun_instant',
      monthBoundaryPolicy: 'exact_twelve_jie_instants',
      dayBoundaryTimeBasis: 'true_solar_time',
      dayBoundaryLocalTime: '00:00',
      jieBoundaries: Array.from({ length: 12 }, (_, index) => ({
        jieCode: `JIE_${index + 1}`,
        utcIso: new Date(Date.UTC(1989, index, 4)).toISOString(),
        solarLongitudeDegrees: (315 + index * 30) % 360
      }))
    },
    deterministic: true,
    providerUsed: false,
    aiUsed: false,
    luckCycleCreated: false,
    projectionCreated: false,
    productionEligible: false
  }
};

const pillarsRecord = {
  authority: 'SHARED_DATA_AUTHORITY',
  status: 'verified',
  methodOwner: null,
  pluginOwner: null,
  recordId: 'BZR-PILLARS-001',
  recordType: 'BZR_FOUR_PILLARS_RESULT',
  recordVersion: '1.0.0',
  payload: {
    runtimeCode: 'BZR_FOUR_PILLARS_RUNTIME',
    runtimeVersion: '1.0.0',
    outputDigest: pillarsDigest,
    executionMode: 'validation',
    calculationMode: 'FOUR_PILLARS',
    birthTimeKnown: true,
    hourPillarStatus: 'RESOLVED',
    yearPillar: {
      pillarType: 'YEAR',
      stemCode: 'JI',
      branchCode: 'SI',
      sexagenaryIndex: 6
    },
    monthPillar: {
      pillarType: 'MONTH',
      stemCode: 'YI',
      branchCode: 'HAI',
      sexagenaryIndex: 12
    },
    dayPillar: {
      pillarType: 'DAY',
      stemCode: 'JI',
      branchCode: 'MAO',
      sexagenaryIndex: 16
    },
    hourPillar: {
      pillarType: 'HOUR',
      stemCode: 'YI',
      branchCode: 'HAI',
      sexagenaryIndex: 12
    },
    lineage: {
      sourceCalendarOutputDigest: calendarDigest
    },
    deterministic: true,
    providerUsed: false,
    aiUsed: false,
    pillarCreated: true,
    luckCycleCreated: false,
    projectionCreated: false,
    interpretationCreated: false,
    professionalConclusionCreated: false,
    productionEligible: false
  }
};

const sexRecord = {
  authority: 'SHARED_DATA_AUTHORITY',
  status: 'verified',
  methodOwner: null,
  pluginOwner: null,
  recordId: 'BZR-SEX-001',
  recordType: 'TRADITIONAL_CALCULATION_SEX',
  recordVersion: '1.0.0',
  payload: {
    value: 'FEMALE',
    useScope: 'LUCK_CYCLE_DIRECTION_ONLY',
    identityInferenceAllowed: false,
    personalityClaimAllowed: false,
    relationshipRoleClaimAllowed: false,
    generalProfileClaimAllowed: false
  }
};

const adapter = {
  algorithmCode: 'PHI_OS_BAZI_LUCK_CYCLE',
  algorithmVersion: '1.0.0-candidate',
  adapterCode: 'TEST_BZR_LUCK_CYCLE',
  adapterVersion: '1.0.0',
  providerUsed: false,
  aiUsed: false,
  async calculateLuckCycle(request) {
    assert.equal(request.yearStemPolarity, 'YIN');
    assert.equal(request.traditionalCalculationSex, 'FEMALE');
    assert.equal(request.direction, 'FORWARD');
    assert.equal(request.referenceJie, 'NEXT_JIE');
    assert.equal(request.conversionPolicy.rounding, 'no_rounding_in_engine');
    return {
      algorithmCode: 'PHI_OS_BAZI_LUCK_CYCLE',
      algorithmVersion: '1.0.0-candidate',
      policyCode: 'PHI_OS_BAZI_POLICY_V1',
      direction: 'FORWARD',
      yearStemPolarity: 'YIN',
      traditionalCalculationSex: 'FEMALE',
      referenceJie: 'NEXT_JIE',
      referenceJieCode: 'DA_XUE',
      birthTrueSolarIso: '1989-11-15T22:37:30.000+08:00',
      referenceJieUtcIso: '1989-12-07T00:00:00.000Z',
      intervalSeconds: 1836000,
      conversionPolicy: {
        threeDaysEqualYears: 1,
        oneDayEqualMonths: 4,
        twoHoursEqualDays: 10,
        rounding: 'no_rounding_in_engine'
      },
      startAge: {
        years: 7,
        months: 1,
        days: 10,
        totalYearsNumerator: 2575,
        totalYearsDenominator: 360,
        roundingApplied: false
      },
      cycles: Array.from({ length: request.cycleCount }, (_, index) => ({
        cycleNumber: index + 1,
        direction: 'FORWARD',
        startAgeYears: 7 + index * 10,
        endAgeYears: 17 + index * 10,
        pillar: {
          stemCode: [
            'BING','DING','WU','JI','GENG','XIN','REN','GUI'
          ][index],
          branchCode: [
            'ZI','CHOU','YIN','MAO','CHEN','SI','WU','WEI'
          ][index],
          sexagenaryIndex: 13 + index
        }
      }))
    };
  }
};

const runtime = createBzrLuckCycleRuntime({
  luckCycleAdapter: adapter
});
const request = {
  calculationId: 'BZR-LUCK-001',
  runtimeCode: BZR_LUCK_CYCLE_RUNTIME_CODE,
  executionMode: 'validation',
  policyVersion: 'candidate-1',
  cycleCount: 8,
  inputRecords: [calendarRecord, pillarsRecord, sexRecord]
};

const first = await runtime.calculate(request);
const second = await runtime.calculate(request);

assert.equal(first.runtimeCode, 'SHARED_CALCULATION_RUNTIME');
assert.equal(first.methodCode, 'BAZI');
assert.equal(first.pluginCode, 'BZR');
assert.equal(first.output.runtimeCode, 'BZR_LUCK_CYCLE_RUNTIME');
assert.equal(first.output.direction, 'FORWARD');
assert.equal(first.output.yearStemPolarity, 'YIN');
assert.equal(first.output.traditionalCalculationSex, 'FEMALE');
assert.equal(
  first.output.traditionalCalculationSexUseScope,
  'LUCK_CYCLE_DIRECTION_ONLY'
);
assert.equal(first.output.referenceJie, 'NEXT_JIE');
assert.equal(first.output.startAge.roundingApplied, false);
assert.equal(first.output.cycles.length, 8);
assert.equal(first.output.cycles[0].cycleNumber, 1);
assert.equal(first.output.cycles[0].startAgeYears, 7);
assert.equal(first.output.cycles[0].endAgeYears, 17);
assert.equal(first.output.luckCycleCreated, true);
assert.equal(first.output.projectionCreated, false);
assert.equal(first.output.interpretationCreated, false);
assert.equal(first.output.identityInferenceCreated, false);
assert.equal(first.output.personalityClaimCreated, false);
assert.equal(first.output.relationshipRoleClaimCreated, false);
assert.equal(first.output.professionalConclusionCreated, false);
assert.equal(first.output.productionEligible, false);
assert.equal(first.outputDigest, second.outputDigest);

const maleRecord = {
  ...sexRecord,
  recordId: 'BZR-SEX-002',
  payload: { ...sexRecord.payload, value: 'MALE' }
};
const backwardAdapter = {
  ...adapter,
  async calculateLuckCycle(request) {
    assert.equal(request.direction, 'BACKWARD');
    assert.equal(request.referenceJie, 'PREVIOUS_JIE');
    return {
      ...(await adapter.calculateLuckCycle({
        ...request,
        traditionalCalculationSex: 'FEMALE',
        direction: 'FORWARD',
        referenceJie: 'NEXT_JIE'
      })),
      direction: 'BACKWARD',
      traditionalCalculationSex: 'MALE',
      referenceJie: 'PREVIOUS_JIE',
      referenceJieCode: 'LI_DONG',
      cycles: Array.from({ length: request.cycleCount }, (_, index) => ({
        cycleNumber: index + 1,
        direction: 'BACKWARD',
        startAgeYears: 7 + index * 10,
        endAgeYears: 17 + index * 10,
        pillar: {
          stemCode: [
            'JIA','GUI','REN','XIN','GENG','JI','WU','DING'
          ][index],
          branchCode: [
            'XU','YOU','SHEN','WEI','WU','SI','CHEN','MAO'
          ][index],
          sexagenaryIndex: 11 - index
        }
      }))
    };
  }
};
const backwardRuntime = createBzrLuckCycleRuntime({
  luckCycleAdapter: backwardAdapter
});
const backward = await backwardRuntime.calculate({
  ...request,
  calculationId: 'BZR-LUCK-002',
  inputRecords: [calendarRecord, pillarsRecord, maleRecord]
});
assert.equal(backward.output.direction, 'BACKWARD');
assert.equal(backward.output.referenceJie, 'PREVIOUS_JIE');

await assert.rejects(
  () => runtime.calculate({ ...request, executionMode: 'production' }),
  /BZR_LUCK_CYCLE_PRODUCTION_EXECUTION_FORBIDDEN/
);

await assert.rejects(
  () => runtime.calculate({
    ...request,
    inputRecords: [
      calendarRecord,
      {
        ...pillarsRecord,
        payload: {
          ...pillarsRecord.payload,
          calculationMode: 'THREE_PILLARS',
          birthTimeKnown: false,
          hourPillarStatus: 'UNRESOLVED'
        }
      },
      sexRecord
    ]
  }),
  /not Luck-Cycle-ready/
);

await assert.rejects(
  () => runtime.calculate({
    ...request,
    identity: {}
  }),
  /BZR-W3 boundary forbidden/
);

assert.throws(
  () => createBzrLuckCycleRuntime({
    luckCycleAdapter: { ...adapter, providerUsed: true }
  }),
  /AI or Provider Luck Cycle calculation is forbidden/
);

console.log('✓ BZR-W3 Luck Cycle Runtime passed.');
console.log('  Year Stem polarity + calculation sex → governed direction.');
console.log('  Previous/next Jie interval → unrounded start age → deterministic 10-year sequence.');
console.log('  Three-pillar mode, identity claims, Projection, Interpretation and Production remain forbidden.');
