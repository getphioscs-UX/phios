import {
  cleanText,
  isoDate,
  requiredText
} from './external-reader-constants.js';

export const SHARED_BIRTH_DATA_CONTRACT_VERSION =
  'phi-os.external-reader-birth-data.v1';

export const BIRTH_TIME_ACCURACY = Object.freeze([
  'exact',
  'documented',
  'approximate',
  'unknown',
  'rectified'
]);

function nullableText(value) {
  return cleanText(value) || null;
}

function coordinate(value, field, min, max) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new TypeError(`${field} is outside its valid range.`);
  }
  return number;
}

export function createSharedBirthData(input = {}, options = {}) {
  const accuracy = cleanText(input.birth_time_accuracy);
  if (!BIRTH_TIME_ACCURACY.includes(accuracy)) {
    throw new TypeError('Unsupported birth_time_accuracy.');
  }
  if (!input.source || typeof input.source !== 'object') {
    throw new TypeError('Birth Data requires a source label.');
  }
  const birthDate = nullableText(input.birth_date);
  const birthTime = nullableText(input.birth_time);
  const birthPlace = nullableText(input.birth_place);
  if (accuracy !== 'unknown') {
    requiredText(birthDate, 'birth_date');
    requiredText(birthPlace, 'birth_place');
  }
  if (['exact', 'documented', 'approximate', 'rectified'].includes(accuracy)) {
    requiredText(birthTime, 'birth_time');
  }
  return Object.freeze({
    schema_version: SHARED_BIRTH_DATA_CONTRACT_VERSION,
    birth_data_id: requiredText(input.birth_data_id, 'birth_data_id'),
    client_id: requiredText(input.client_id, 'client_id'),
    birth_date: birthDate,
    birth_time: birthTime,
    birth_place: birthPlace,
    birth_timezone: nullableText(input.birth_timezone),
    daylight_saving_status: nullableText(input.daylight_saving_status),
    latitude: coordinate(input.latitude, 'latitude', -90, 90),
    longitude: coordinate(input.longitude, 'longitude', -180, 180),
    birth_time_accuracy: accuracy,
    source: input.source,
    client_confirmed: input.client_confirmed === true,
    calculation_settings: Object.freeze({
      calendar_system: nullableText(
        input.calculation_settings?.calendar_system
      ),
      timezone_method: nullableText(
        input.calculation_settings?.timezone_method
      ),
      solar_time_method: nullableText(
        input.calculation_settings?.solar_time_method
      ),
      school_or_lineage: nullableText(
        input.calculation_settings?.school_or_lineage
      ),
      calculation_method: nullableText(
        input.calculation_settings?.calculation_method
      )
    }),
    created_at: isoDate(
      input.created_at || options.now || new Date().toISOString(),
      'created_at'
    ),
    updated_at: isoDate(
      input.updated_at || options.now || new Date().toISOString(),
      'updated_at'
    ),
    reusable_by_external_readers: true,
    duplicated_per_reader: false,
    runtime_memory_written: false
  });
}

export default Object.freeze({ createSharedBirthData });
