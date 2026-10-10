import { cleanText, isoDate, requiredText } from '../external-readers/external-reader-constants.js';
import {
  APPOINTMENT_SERVICE_TYPES, APPOINTMENT_STATUSES,
  EXTERNAL_READER_PRE_APPOINTMENT_CHECKS,
  FINANCIAL_APPOINTMENT_SERVICE_TYPES,
  FINANCIAL_PRE_APPOINTMENT_CHECKS,
  PROFESSIONAL_APPOINTMENT_CONTRACT_VERSION
} from './professional-appointment-constants.js';

function allowed(value, values, field) {
  const text = requiredText(value, field);
  if (!values.includes(text)) throw new TypeError(`Unsupported ${field}.`);
  return text;
}

export function createProfessionalAppointment(input = {}, options = {}) {
  const scheduledStart = isoDate(input.scheduled_start, 'scheduled_start');
  const scheduledEnd = isoDate(input.scheduled_end, 'scheduled_end');
  if (Date.parse(scheduledEnd) <= Date.parse(scheduledStart)) throw new TypeError('scheduled_end must follow scheduled_start.');
  const serviceType = allowed(
    input.service_type,
    APPOINTMENT_SERVICE_TYPES,
    'service_type'
  );
  const checkContract = FINANCIAL_APPOINTMENT_SERVICE_TYPES.includes(serviceType)
    ? FINANCIAL_PRE_APPOINTMENT_CHECKS
    : EXTERNAL_READER_PRE_APPOINTMENT_CHECKS;
  const checks = Object.freeze(checkContract.reduce((result, key) => {
    result[key] = input.pre_appointment_checks?.[key] === true;
    return result;
  }, {}));
  const incompleteChecks = Object.freeze(
    checkContract.filter(key => !checks[key])
  );
  return Object.freeze({
    schema_version: PROFESSIONAL_APPOINTMENT_CONTRACT_VERSION,
    appointment_id: requiredText(input.appointment_id, 'appointment_id'),
    client_id: requiredText(input.client_id, 'client_id'),
    professional_id: cleanText(input.professional_id) || null,
    service_type: serviceType,
    status: allowed(input.status || 'requested', APPOINTMENT_STATUSES, 'status'),
    scheduled_start: scheduledStart,
    scheduled_end: scheduledEnd,
    timezone: requiredText(input.timezone, 'timezone'),
    meeting_method: requiredText(input.meeting_method, 'meeting_method'),
    consent_reference: cleanText(input.consent_reference) || null,
    payment_record_id: cleanText(input.payment_record_id) || null,
    pre_appointment_checks: checks,
    incomplete_checks: incompleteChecks,
    pre_appointment_check_contract:
      FINANCIAL_APPOINTMENT_SERVICE_TYPES.includes(serviceType)
        ? 'financial'
        : 'external_reader_or_runtime',
    ready_for_appointment: incompleteChecks.length === 0,
    created_at: isoDate(options.now || input.created_at || new Date().toISOString(), 'created_at'),
    runtime_reading_modified: false,
    runtime_evidence_modified: false,
    runtime_memory_written: false,
    external_reader_interpretation_generated: false
  });
}
