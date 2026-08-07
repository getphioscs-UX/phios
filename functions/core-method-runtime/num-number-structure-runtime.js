import {
  createSharedCalculationRuntime,
  SHARED_CALCULATION_RUNTIME_CODE
} from '../method-runtime/shared-calculation-runtime.js';

export const NUM_NUMBER_STRUCTURE_RUNTIME_CODE =
  'NUM_NUMBER_STRUCTURE_RUNTIME';
export const NUM_NUMBER_STRUCTURE_RUNTIME_VERSION = '1.0.0';
export const NUM_NUMBER_STRUCTURE_ALGORITHM_CODE =
  'NUM_NUMBER_STRUCTURE_NORMALIZATION';
export const NUM_NUMBER_STRUCTURE_ALGORITHM_VERSION = '1.0.0';

function object(value, message) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(message);
  }
}
function birthResult(records) {
  return records.find(record => record.recordType === 'NUM_BIRTH_NUMBER_RESULT');
}
function assertBirth(record) {
  if (!record) throw new TypeError('NUM_BIRTH_NUMBER_RESULT is required.');
  object(record.payload, 'NUM-W1 payload is required.');
  const value = record.payload;
  if (value.runtimeCode !== 'NUM_BIRTH_NUMBER_RUNTIME' ||
      value.executionMode !== 'validation' ||
      value.numberFactsCreated !== true ||
      value.structureCreated !== false ||
      value.projectionCreated !== false ||
      value.productionEligible !== false ||
      typeof value.outputDigest !== 'string') {
    throw new TypeError('NUM-W1 result is not structure-ready.');
  }
}
function stableNumberFact(code, result) {
  return Object.freeze({
    factCode: code,
    rawValue: result.rawValue,
    reducedValue: result.reducedValue,
    masterNumberPreserved: result.masterNumberPreserved
  });
}

export function createNumNumberStructureRuntime() {
  const algorithm = Object.freeze({
    algorithmCode: NUM_NUMBER_STRUCTURE_ALGORITHM_CODE,
    algorithmVersion: NUM_NUMBER_STRUCTURE_ALGORITHM_VERSION,
    async calculate(records, context) {
      if (context.referenceVersions.executionMode !== 'validation') {
        throw new Error('NUM_NUMBER_STRUCTURE_PRODUCTION_EXECUTION_FORBIDDEN');
      }
      const record = birthResult(records);
      assertBirth(record);
      const value = record.payload;
      const dateDigits = value.birthDate.replace(/\D/g, '').split('').map(Number);
      const digitFrequency = [];
      for (let digit = 1; digit <= 9; digit += 1) {
        digitFrequency.push(Object.freeze({
          factCode: `NUM_DIGIT_${digit}_FREQUENCY`,
          digit,
          occurrenceCount: dateDigits.filter(item => item === digit).length,
          absenceMeansDeficit: false
        }));
      }
      const numberFacts = Object.freeze([
        stableNumberFact('NUM_LIFE_PATH', value.numbers.lifePath),
        stableNumberFact('NUM_BIRTHDAY', value.numbers.birthdayNumber),
        stableNumberFact('NUM_ATTITUDE', value.numbers.attitudeNumber),
        stableNumberFact('NUM_BIRTH_YEAR', value.numbers.birthYearNumber),
        stableNumberFact('NUM_BIRTH_MONTH', value.numbers.birthMonthNumber),
        stableNumberFact('NUM_BIRTH_DAY', value.numbers.birthDayNumber)
      ]);
      const masterNumbers = [11,22,33].map(number => Object.freeze({
        factCode: `NUM_MASTER_${number}_PRESENT`,
        number,
        present: numberFacts.some(item =>
          item.reducedValue === number && item.masterNumberPreserved === true
        )
      }));
      return Object.freeze({
        schemaVersion: 'PHI-OS-NUM-NUMBER-STRUCTURE-RESULT-v1.0.0',
        runtimeCode: NUM_NUMBER_STRUCTURE_RUNTIME_CODE,
        runtimeVersion: NUM_NUMBER_STRUCTURE_RUNTIME_VERSION,
        methodCode: 'NUMEROLOGY',
        pluginCode: 'NUM',
        executionMode: 'validation',
        birthDate: value.birthDate,
        numberFacts,
        digitFrequency: Object.freeze(digitFrequency),
        masterNumberState: Object.freeze(masterNumbers),
        compoundNumbers: Object.freeze(numberFacts.map(item => Object.freeze({
          factCode: `${item.factCode}_COMPOUND`,
          rawValue: item.rawValue,
          reducedValue: item.reducedValue
        }))),
        lineage: Object.freeze({
          birthNumberRuntimeCode: value.runtimeCode,
          birthNumberRuntimeVersion: value.runtimeVersion,
          birthNumberOutputDigest: value.outputDigest
        }),
        deterministic: true,
        providerUsed: false,
        aiUsed: false,
        structureCreated: true,
        cycleCreated: false,
        projectionCreated: false,
        meaningCreated: false,
        interpretationCreated: false,
        identityFactCreated: false,
        professionalConclusionCreated: false,
        productionEligible: false
      });
    }
  });
  const shared = createSharedCalculationRuntime({ algorithms: [algorithm] });
  return Object.freeze({
    runtimeCode: NUM_NUMBER_STRUCTURE_RUNTIME_CODE,
    runtimeVersion: NUM_NUMBER_STRUCTURE_RUNTIME_VERSION,
    async calculate(request) {
      object(request, 'NUM-W2 request is required.');
      if (request.runtimeCode !== NUM_NUMBER_STRUCTURE_RUNTIME_CODE) {
        throw new TypeError('Invalid NUM-W2 runtimeCode.');
      }
      return shared.execute({
        calculationId: request.calculationId,
        runtimeCode: SHARED_CALCULATION_RUNTIME_CODE,
        methodCode: 'NUMEROLOGY',
        pluginCode: 'NUM',
        algorithmCode: NUM_NUMBER_STRUCTURE_ALGORITHM_CODE,
        algorithmVersion: NUM_NUMBER_STRUCTURE_ALGORITHM_VERSION,
        inputRecords: request.inputRecords,
        referenceVersions: {
          executionMode: request.executionMode,
          structurePolicyCode: 'PHI_OS_NUMERIC_STRUCTURE_V1'
        }
      });
    }
  });
}
