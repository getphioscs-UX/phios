import {
  createSharedCalculationRuntime,
  SHARED_CALCULATION_RUNTIME_CODE
} from '../method-runtime/shared-calculation-runtime.js';

export const NUM_BIRTH_NUMBER_RUNTIME_CODE = 'NUM_BIRTH_NUMBER_RUNTIME';
export const NUM_BIRTH_NUMBER_RUNTIME_VERSION = '1.0.0';
export const NUM_BIRTH_NUMBER_ALGORITHM_CODE = 'NUM_BIRTH_NUMBER_CALCULATION';
export const NUM_BIRTH_NUMBER_ALGORITHM_VERSION = '1.0.0';

const MASTER = new Set([11, 22, 33]);
const FORBIDDEN = new Set([
  'name','phoneNumber','addressNumber','luckyNumber','gambling',
  'interpretation','knowledge','identity','personality',
  'futurePrediction','professionalConclusion','projection'
]);

function object(value, message) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(message);
  }
}
function noForbidden(value, path = '$') {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN.has(key)) {
      throw new TypeError(`NUM-W1 boundary forbidden at ${path}.${key}`);
    }
    noForbidden(child, `${path}.${key}`);
  }
}
function dateParts(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new TypeError('birthDate must use YYYY-MM-DD.');
  }
  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) ||
      parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth() + 1 !== month ||
      parsed.getUTCDate() !== day) {
    throw new TypeError('birthDate is not a valid calendar date.');
  }
  return { year, month, day };
}
function digits(value) {
  return String(value).replace(/\D/g, '').split('').map(Number);
}
function reduce(rawValue, preserveMaster = true) {
  let current = rawValue;
  const steps = [current];
  while (current > 9 && !(preserveMaster && MASTER.has(current))) {
    current = digits(current).reduce((sum, digit) => sum + digit, 0);
    steps.push(current);
  }
  return Object.freeze({
    rawValue,
    reductionSteps: Object.freeze(steps),
    reducedValue: current,
    masterNumberPreserved: MASTER.has(current)
  });
}
function findBirth(records) {
  return records.find(record => record.recordType === 'BIRTH_RECORD');
}

export function createNumBirthNumberRuntime() {
  const algorithm = Object.freeze({
    algorithmCode: NUM_BIRTH_NUMBER_ALGORITHM_CODE,
    algorithmVersion: NUM_BIRTH_NUMBER_ALGORITHM_VERSION,
    async calculate(records, context) {
      if (context.referenceVersions.executionMode !== 'validation') {
        throw new Error('NUM_BIRTH_NUMBER_PRODUCTION_EXECUTION_FORBIDDEN');
      }
      const record = findBirth(records);
      if (!record) throw new TypeError('BIRTH_RECORD is required.');
      object(record.payload, 'Birth payload is required.');
      const { year, month, day } = dateParts(record.payload.birthDate);

      const lifePathRaw = digits(record.payload.birthDate)
        .reduce((sum, digit) => sum + digit, 0);
      const results = Object.freeze({
        lifePath: reduce(lifePathRaw),
        birthdayNumber: reduce(day),
        attitudeNumber: reduce(month + day),
        birthYearNumber: reduce(digits(year).reduce((a,b) => a + b, 0)),
        birthMonthNumber: reduce(month),
        birthDayNumber: reduce(day)
      });

      return Object.freeze({
        schemaVersion: 'PHI-OS-NUM-BIRTH-NUMBER-RESULT-v1.0.0',
        runtimeCode: NUM_BIRTH_NUMBER_RUNTIME_CODE,
        runtimeVersion: NUM_BIRTH_NUMBER_RUNTIME_VERSION,
        methodCode: 'NUMEROLOGY',
        pluginCode: 'NUM',
        executionMode: 'validation',
        birthDate: record.payload.birthDate,
        dateComponents: Object.freeze({ year, month, day }),
        policy: Object.freeze({
          reductionPolicyCode: 'PHI_OS_NUMERIC_REDUCTION_V1',
          reductionPolicyVersion: '1.0.0',
          masterNumbers: Object.freeze([11,22,33]),
          zeroCreatesCoreNumber: false
        }),
        numbers: results,
        deterministic: true,
        providerUsed: false,
        aiUsed: false,
        numberFactsCreated: true,
        structureCreated: false,
        cycleCreated: false,
        projectionCreated: false,
        interpretationCreated: false,
        knowledgeCreated: false,
        identityFactCreated: false,
        futurePredictionCreated: false,
        professionalConclusionCreated: false,
        productionEligible: false
      });
    }
  });
  const shared = createSharedCalculationRuntime({ algorithms: [algorithm] });
  return Object.freeze({
    runtimeCode: NUM_BIRTH_NUMBER_RUNTIME_CODE,
    runtimeVersion: NUM_BIRTH_NUMBER_RUNTIME_VERSION,
    async calculate(request) {
      object(request, 'NUM-W1 request is required.');
      noForbidden(request);
      if (request.runtimeCode !== NUM_BIRTH_NUMBER_RUNTIME_CODE) {
        throw new TypeError('Invalid NUM-W1 runtimeCode.');
      }
      return shared.execute({
        calculationId: request.calculationId,
        runtimeCode: SHARED_CALCULATION_RUNTIME_CODE,
        methodCode: 'NUMEROLOGY',
        pluginCode: 'NUM',
        algorithmCode: NUM_BIRTH_NUMBER_ALGORITHM_CODE,
        algorithmVersion: NUM_BIRTH_NUMBER_ALGORITHM_VERSION,
        inputRecords: request.inputRecords,
        referenceVersions: {
          executionMode: request.executionMode,
          proposalCode: 'IMR-PROP-NUMEROLOGY-001',
          proposalStatus: 'proposal_only',
          reductionPolicyCode: 'PHI_OS_NUMERIC_REDUCTION_V1'
        }
      });
    }
  });
}
