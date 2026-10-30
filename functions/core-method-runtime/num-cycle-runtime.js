import {
  createSharedCalculationRuntime,
  SHARED_CALCULATION_RUNTIME_CODE
} from '../method-runtime/shared-calculation-runtime.js';

export const NUM_CYCLE_RUNTIME_CODE = 'NUM_CYCLE_RUNTIME';
export const NUM_CYCLE_RUNTIME_VERSION = '1.0.0';
export const NUM_CYCLE_ALGORITHM_CODE = 'NUM_DATE_AND_LIFE_STAGE_CYCLES';
export const NUM_CYCLE_ALGORITHM_VERSION = '1.0.0';

const MASTER = new Set([11,22,33]);

// Select among already calculated Western age bands. No Energy timing or new
// cycle formula is introduced. Completed age changes on the birthday (a Feb 29
// birthday changes on March 1 in a non-leap year under this calendar policy).
export function selectNumWesternLifeStage(input={}) {
  const {birthDate,targetDate,pinnacles=[],challenges=[]}=input??{};
  if(!birthDate||!targetDate)return Object.freeze({available:false,reason:'DATES_REQUIRED'});
  let b,t;
  try { b=parseDate(birthDate,'birthDate');t=parseDate(targetDate,'targetDate'); }
  catch { return Object.freeze({available:false,reason:'INVALID_DATES'}); }
  const completedAge=t.year-b.year-Number(t.month<b.month||(t.month===b.month&&t.day<b.day));
  if(completedAge<0)return Object.freeze({available:false,reason:'TARGET_BEFORE_BIRTH'});
  if(!Array.isArray(pinnacles)||!Array.isArray(challenges))return Object.freeze({available:false,reason:'NATIVE_BANDS_REQUIRED'});
  const matches=pinnacles.filter(x=>x&&Number.isInteger(x.cycleNumber)&&x.cycleNumber>=1&&x.cycleNumber<=4&&Number.isInteger(x.startAge)&&x.startAge>=0&&(x.endAge===null||(Number.isInteger(x.endAge)&&x.endAge>=x.startAge))&&completedAge>=x.startAge&&(x.endAge===null||completedAge<=x.endAge));
  if(matches.length!==1)return Object.freeze({available:false,reason:matches.length?'AMBIGUOUS_STAGE':'NATIVE_BANDS_REQUIRED'});
  const selected=matches[0],paired=challenges.filter(x=>x?.cycleNumber===selected.cycleNumber);
  if(paired.length!==1||!Number.isFinite(selected.value??selected.number)||!Number.isFinite(paired[0].value??paired[0].number))return Object.freeze({available:false,reason:'NATIVE_BANDS_REQUIRED'});
  const challenge=paired[0];
  return Object.freeze({available:true,birthDate,targetDate,completedAge,cycleNumber:selected.cycleNumber,pinnacle:selected.value??selected.number,challenge:challenge.value??challenge.number,startAge:selected.startAge,endAge:selected.endAge,agePolicy:'COMPLETED_CALENDAR_YEARS_FEB29_ROLLOVER_MARCH1',boundaryPolicy:'PHI_OS_NUMERIC_LIFE_STAGE_BOUNDARY_V1',calculationAuthority:'functions/core-method-runtime/num-cycle-runtime.js'});
}

function object(value, message) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(message);
  }
}
function parseDate(value, label) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new TypeError(`${label} must use YYYY-MM-DD.`);
  }
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) ||
      parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth()+1 !== month ||
      parsed.getUTCDate() !== day) {
    throw new TypeError(`${label} is invalid.`);
  }
  return { year, month, day };
}
function digitSum(value) {
  return String(value).replace(/\D/g,'').split('').reduce((a,b)=>a+Number(b),0);
}
function reduce(value, preserveMaster = true) {
  let current = value;
  const steps = [current];
  while (current > 9 && !(preserveMaster && MASTER.has(current))) {
    current = digitSum(current);
    steps.push(current);
  }
  return Object.freeze({
    rawValue: value,
    reductionSteps: Object.freeze(steps),
    reducedValue: current,
    masterNumberPreserved: MASTER.has(current)
  });
}
function simple(value) {
  let current = Math.abs(value);
  while (current > 9) current = digitSum(current);
  return current;
}
function findBirth(records) {
  return records.find(record => record.recordType === 'NUM_BIRTH_NUMBER_RESULT');
}

export function createNumCycleRuntime() {
  const algorithm = Object.freeze({
    algorithmCode: NUM_CYCLE_ALGORITHM_CODE,
    algorithmVersion: NUM_CYCLE_ALGORITHM_VERSION,
    async calculate(records, context) {
      if (context.referenceVersions.executionMode !== 'validation') {
        throw new Error('NUM_CYCLE_PRODUCTION_EXECUTION_FORBIDDEN');
      }
      const record = findBirth(records);
      if (!record) throw new TypeError('NUM_BIRTH_NUMBER_RESULT is required.');
      object(record.payload, 'NUM-W1 payload is required.');
      const birth = record.payload;
      if (birth.runtimeCode !== 'NUM_BIRTH_NUMBER_RUNTIME' ||
          birth.numberFactsCreated !== true ||
          typeof birth.outputDigest !== 'string') {
        throw new TypeError('NUM-W1 result is not cycle-ready.');
      }
      const birthParts = parseDate(birth.birthDate, 'birthDate');
      const target = parseDate(context.referenceVersions.targetDate, 'targetDate');

      const universalYear = reduce(digitSum(target.year));
      const personalYear = reduce(
        birthParts.month + birthParts.day + universalYear.reducedValue
      );
      const personalMonth = reduce(personalYear.reducedValue + target.month);
      const personalDay = reduce(personalMonth.reducedValue + target.day);

      const m = simple(birthParts.month);
      const d = simple(birthParts.day);
      const y = simple(birthParts.year);
      const pinnacles = [
        simple(m + d),
        simple(d + y),
        simple(simple(m + d) + simple(d + y)),
        simple(m + y)
      ];
      const challenges = [
        Math.abs(m - d),
        Math.abs(d - y),
        Math.abs(Math.abs(m - d) - Math.abs(d - y)),
        Math.abs(m - y)
      ];
      const lifePath = birth.numbers.lifePath.reducedValue;
      const firstEndAge = 36 - simple(lifePath);
      const pinnacleCycles = pinnacles.map((number, index) => Object.freeze({
        cycleNumber: index + 1,
        number,
        startAge: index === 0 ? 0 : firstEndAge + 1 + (index - 1) * 9,
        endAge: index === 3 ? null : firstEndAge + index * 9
      }));
      // Replace Python-like None marker through deterministic JS value.
      pinnacleCycles[3] = Object.freeze({
        ...pinnacleCycles[3],
        endAge: null
      });
      const challengeCycles = challenges.map((number, index) => Object.freeze({
        cycleNumber: index + 1,
        number,
        startAge: pinnacleCycles[index].startAge,
        endAge: pinnacleCycles[index].endAge
      }));

      return Object.freeze({
        schemaVersion: 'PHI-OS-NUM-CYCLE-RESULT-v1.0.0',
        runtimeCode: NUM_CYCLE_RUNTIME_CODE,
        runtimeVersion: NUM_CYCLE_RUNTIME_VERSION,
        methodCode: 'NUMEROLOGY',
        pluginCode: 'NUM',
        executionMode: 'validation',
        birthDate: birth.birthDate,
        targetDate: context.referenceVersions.targetDate,
        timezonePolicyCode: context.referenceVersions.timezonePolicyCode,
        calendarCycles: Object.freeze({
          universalYear,
          personalYear,
          personalMonth,
          personalDay
        }),
        lifeStageCycles: Object.freeze({
          pinnacleCycles: Object.freeze(pinnacleCycles),
          challengeCycles: Object.freeze(challengeCycles),
          boundaryPolicyCode: 'PHI_OS_NUMERIC_LIFE_STAGE_BOUNDARY_V1'
        }),
        lineage: Object.freeze({
          birthNumberRuntimeCode: birth.runtimeCode,
          birthNumberRuntimeVersion: birth.runtimeVersion,
          birthNumberOutputDigest: birth.outputDigest,
          cyclePolicyCode: 'PHI_OS_NUMERIC_CYCLE_V1',
          cyclePolicyVersion: '1.0.0'
        }),
        deterministic: true,
        providerUsed: false,
        aiUsed: false,
        cycleCreated: true,
        projectionCreated: false,
        interpretationCreated: false,
        futureEventPredicted: false,
        realityConclusionCreated: false,
        professionalConclusionCreated: false,
        productionEligible: false
      });
    }
  });
  const shared = createSharedCalculationRuntime({ algorithms: [algorithm] });
  return Object.freeze({
    runtimeCode: NUM_CYCLE_RUNTIME_CODE,
    runtimeVersion: NUM_CYCLE_RUNTIME_VERSION,
    async calculate(request) {
      object(request, 'NUM-W3 request is required.');
      if (request.runtimeCode !== NUM_CYCLE_RUNTIME_CODE) {
        throw new TypeError('Invalid NUM-W3 runtimeCode.');
      }
      return shared.execute({
        calculationId: request.calculationId,
        runtimeCode: SHARED_CALCULATION_RUNTIME_CODE,
        methodCode: 'NUMEROLOGY',
        pluginCode: 'NUM',
        algorithmCode: NUM_CYCLE_ALGORITHM_CODE,
        algorithmVersion: NUM_CYCLE_ALGORITHM_VERSION,
        inputRecords: request.inputRecords,
        referenceVersions: {
          executionMode: request.executionMode,
          targetDate: request.targetDate,
          timezonePolicyCode: request.timezonePolicyCode,
          cyclePolicyCode: 'PHI_OS_NUMERIC_CYCLE_V1'
        }
      });
    }
  });
}
