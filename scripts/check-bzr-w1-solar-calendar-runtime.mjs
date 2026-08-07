import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  createBzrSolarCalendarRuntime,
  BZR_SOLAR_CALENDAR_RUNTIME_CODE
} from './lib/core-method-runtime/bzr-solar-calendar-runtime.js';

const root = process.cwd();
const readJson = async file =>
  JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));

const contract = await readJson(
  'content/professional/core-method-runtime/bzr-solar-calendar-runtime-v1.json'
);
const schema = await readJson(
  'content/professional/core-method-runtime/bzr-solar-calendar-result-v1.schema.json'
);
const foundation = await readJson(
  'content/professional/core-method-runtime/bzr-runtime-manifest-v1.json'
);
const boundary = await readJson(
  'content/professional/core-method-runtime/bzr-runtime-boundary-v1.json'
);
const eligibility = await readJson(
  'content/professional/method-governance/imr-production-eligibility-registry-v1.json'
);

assert.equal(contract.stageCode, 'BZR-W1');
assert.deepEqual(contract.input.requiredRecordTypes, ['BIRTH_RECORD','COORDINATE']);
assert.equal(contract.authorities.timezone.authorityCode, 'IANA_TZDB');
assert.equal(contract.authorities.trueSolarTime.algorithmCode, 'PHI_OS_TRUE_SOLAR_TIME');
assert.equal(contract.authorities.solarTerms.engineCode, 'ASTRONOMY_ENGINE_JS');
assert.equal(contract.calendarPolicies.yearBoundary, 'exact_li_chun_instant');
assert.equal(contract.calendarPolicies.monthBoundary, 'exact_twelve_jie_instants');
assert.equal(contract.calendarPolicies.fixedDateLiChunAllowed, false);
assert.equal(contract.scope.createsStem, false);
assert.equal(contract.scope.createsPillar, false);
assert.equal(contract.scope.createsLuckCycle, false);
assert.deepEqual(contract.execution.allowedModes, ['validation']);
assert.equal(contract.execution.productionExecutionAllowed, false);
assert.equal(contract.nextStage, 'BZR-W2');
assert.equal(foundation.nextStage, 'BZR-W1');
assert.equal(boundary.calendarBoundary.yearBoundary, 'exact_li_chun_instant');
assert.equal(schema.properties.productionEligible.const, false);

const baziEligibility = eligibility.methods.find(item => item.methodCode === 'BAZI');
assert.equal(baziEligibility.commercialLicensePassed, false);
assert.equal(baziEligibility.productionReady, false);
assert.equal(baziEligibility.professionalReady, false);

const timezoneAdapter = {
  adapterCode: 'TEST_TZDB_ADAPTER',
  adapterVersion: '1.0.0',
  authorityCode: 'IANA_TZDB',
  authorityVersion: '2026a-test',
  aiUsed: false,
  providerUsed: false,
  async resolveCivilTime(request) {
    assert.equal(request.timezoneId, 'Asia/Kuala_Lumpur');
    return {
      authorityCode: 'IANA_TZDB',
      authorityVersion: '2026a-test',
      timezoneId: 'Asia/Kuala_Lumpur',
      utcIso: '1989-11-15T14:50:00.000Z',
      utcOffsetMinutes: 480,
      dstApplied: false,
      dstTransitionStatus: 'none'
    };
  }
};

const trueSolarTimeAdapter = {
  adapterCode: 'TEST_TRUE_SOLAR_ADAPTER',
  adapterVersion: '1.0.0',
  algorithmCode: 'PHI_OS_TRUE_SOLAR_TIME',
  algorithmVersion: '1.0.0-candidate',
  aiUsed: false,
  providerUsed: false,
  async convert() {
    return {
      algorithmCode: 'PHI_OS_TRUE_SOLAR_TIME',
      algorithmVersion: '1.0.0-candidate',
      trueSolarIso: '1989-11-15T22:37:30.000+08:00',
      longitudeCorrectionMinutes: -7.5,
      equationOfTimeMinutes: -5,
      totalCorrectionMinutes: -12.5
    };
  }
};

const jieCodes = [
  'LI_CHUN','JING_ZHE','QING_MING','LI_XIA',
  'MANG_ZHONG','XIAO_SHU','LI_QIU','BAI_LU',
  'HAN_LU','LI_DONG','DA_XUE','XIAO_HAN'
];

const solarTermAdapter = {
  adapterCode: 'TEST_SOLAR_TERM_ADAPTER',
  adapterVersion: '1.0.0',
  engineCode: 'ASTRONOMY_ENGINE_JS',
  engineVersion: '2.1.19',
  licenseCode: 'MIT',
  aiUsed: false,
  providerUsed: false,
  async resolveYearContext() {
    return {
      engineCode: 'ASTRONOMY_ENGINE_JS',
      engineVersion: '2.1.19',
      licenseCode: 'MIT',
      liChunUtcIso: '1989-02-04T08:27:00.000Z',
      yearBoundaryPolicy: 'exact_li_chun_instant',
      monthBoundaryPolicy: 'exact_twelve_jie_instants',
      jieBoundaries: jieCodes.map((jieCode, index) => ({
        jieCode,
        utcIso: new Date(Date.UTC(1989, index, 4, 8, 27)).toISOString(),
        solarLongitudeDegrees: (315 + index * 30) % 360
      }))
    };
  }
};

const record = (recordId, recordType, payload) => ({
  authority: 'SHARED_DATA_AUTHORITY',
  status: 'verified',
  methodOwner: null,
  pluginOwner: null,
  recordId,
  recordType,
  recordVersion: '1.0.0',
  payload
});

const birth = record('BIRTH-001', 'BIRTH_RECORD', {
  localDate: '1989-11-15',
  localTime: '22:50:00',
  timezoneId: 'Asia/Kuala_Lumpur',
  birthTimeKnown: true
});
const coordinate = record('COORD-001', 'COORDINATE', {
  latitude: 4.85,
  longitude: 100.7333,
  elevationMeters: 30,
  datum: 'WGS84'
});

const runtime = createBzrSolarCalendarRuntime({
  timezoneAdapter,
  trueSolarTimeAdapter,
  solarTermAdapter
});

const request = {
  calculationId: 'BZR-SOLAR-001',
  runtimeCode: BZR_SOLAR_CALENDAR_RUNTIME_CODE,
  executionMode: 'validation',
  policyVersion: 'candidate-1',
  dstDisambiguationPolicyCode: 'EXPLICIT_FAIL_CLOSED_V1',
  equationOfTimePolicyCode: 'APPARENT_SOLAR_TIME_V1',
  timeScale: 'TT',
  referenceFrame: 'ECLIPTIC_OF_DATE',
  inputRecords: [birth, coordinate]
};

const first = await runtime.calculate(request);
const second = await runtime.calculate(request);

assert.equal(first.runtimeCode, 'SHARED_CALCULATION_RUNTIME');
assert.equal(first.methodCode, 'BAZI');
assert.equal(first.pluginCode, 'BZR');
assert.equal(first.output.runtimeCode, 'BZR_SOLAR_CALENDAR_RUNTIME');
assert.equal(first.output.utcIso, '1989-11-15T14:50:00.000Z');
assert.equal(first.output.recordedCivilTime.localTime, '22:50:00');
assert.equal(first.output.timezone.utcOffsetMinutes, 480);
assert.equal(first.output.trueSolarTime.totalCorrectionMinutes, -12.5);
assert.equal(first.output.solarCalendar.jieBoundaries.length, 12);
assert.equal(first.output.solarCalendar.yearBoundaryPolicy, 'exact_li_chun_instant');
assert.equal(first.output.lineage.tzdbAuthorityCode, 'IANA_TZDB');
assert.equal(first.output.lineage.solarTermLicenseCode, 'MIT');
assert.equal(first.output.stemCreated, false);
assert.equal(first.output.branchCreated, false);
assert.equal(first.output.pillarCreated, false);
assert.equal(first.output.luckCycleCreated, false);
assert.equal(first.output.projectionCreated, false);
assert.equal(first.output.productionEligible, false);
assert.equal(first.outputDigest, second.outputDigest);

await assert.rejects(
  () => runtime.calculate({ ...request, executionMode: 'production' }),
  /BZR_SOLAR_CALENDAR_PRODUCTION_EXECUTION_FORBIDDEN/
);

await assert.rejects(
  () => runtime.calculate({
    ...request,
    inputRecords: [
      { ...birth, payload: { ...birth.payload, birthTimeKnown: false } },
      coordinate
    ]
  }),
  /requires known birth time/
);

await assert.rejects(
  () => runtime.calculate({ ...request, pillar: {} }),
  /BZR-W1 boundary forbidden/
);

assert.throws(
  () => createBzrSolarCalendarRuntime({
    timezoneAdapter: { ...timezoneAdapter, providerUsed: true },
    trueSolarTimeAdapter,
    solarTermAdapter
  }),
  /cannot use AI or Provider/
);

console.log('✓ BZR-W1 Solar Calendar Runtime passed.');
console.log('  Civil Time → IANA TZDB → True Solar Time → exact Li Chun and twelve Jie context.');
console.log('  Recorded civil time and complete dependency lineage are preserved.');
console.log('  Stem, Branch, Pillar, Luck Cycle, Projection and Production remain forbidden.');
