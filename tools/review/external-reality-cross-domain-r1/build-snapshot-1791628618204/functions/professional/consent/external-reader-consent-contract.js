import { assertReaderType, cleanText, isoDate, requiredText } from '../external-readers/external-reader-constants.js';

export const EXTERNAL_READER_CONSENT_VERSION = 'phi-os.external-reader-consent.v1';
export const EXTERNAL_READER_RESOURCE_SCOPES = Object.freeze([
  'entry', 'reconstruction', 'reading', 'navigation', 'runtime_memory',
  'uploaded_files', 'birth_information', 'external_reader_chart',
  'previous_reports'
]);
export const EXTERNAL_READER_CONSENT_DURATIONS = Object.freeze([
  'one_time', 'seven_days', 'thirty_days', 'ninety_days',
  'until_service_completion', 'custom_date'
]);
export const EXTERNAL_READER_REVOCATION_SCOPES = Object.freeze([
  'professional_runtime_access', 'birth_data_access', 'chart_access',
  'uploaded_file_access', 'report_sharing', 'follow_up_access',
  'all_professional_access'
]);
const REQUIRED_ACKNOWLEDGEMENTS = Object.freeze([
  'birth_data_voluntarily_submitted',
  'birth_time_accuracy_affects_result',
  'interpretive_not_diagnostic',
  'reader_does_not_prove_causation',
  'professional_access_is_service_bound',
  'future_access_revocable',
  'policy_retention_understood',
  'report_does_not_prove_cause',
  'correspondence_requires_runtime_evidence',
  'not_licensed_professional_advice',
  'not_deterministic_prediction',
  'client_retains_final_decision'
]);

function addDays(value, days) {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}
function expiry(duration, grantedAt, customDate) {
  if (duration === 'seven_days') return addDays(grantedAt, 7);
  if (duration === 'thirty_days') return addDays(grantedAt, 30);
  if (duration === 'ninety_days') return addDays(grantedAt, 90);
  if (duration !== 'custom_date') return null;
  const value = isoDate(customDate, 'expires_at');
  if (value <= grantedAt) throw new TypeError('Custom expiry must be after grant time.');
  return value;
}
function scopes(values, allowed, field) {
  const result = [...new Set((Array.isArray(values) ? values : []).map(cleanText).filter(Boolean))];
  if (!result.length || result.some(value => value === '*' || !allowed.includes(value))) {
    throw new TypeError(`${field} requires explicit supported scopes.`);
  }
  return Object.freeze(result);
}

export function createExternalReaderConsent(input = {}, options = {}) {
  if (input.explicit_action !== true) throw new TypeError('Consent requires explicit user action.');
  const duration = requiredText(input.duration, 'duration');
  if (!EXTERNAL_READER_CONSENT_DURATIONS.includes(duration)) throw new TypeError('Unsupported consent duration.');
  for (const key of REQUIRED_ACKNOWLEDGEMENTS) {
    if (input.acknowledgements?.[key] !== true) throw new TypeError(`Acknowledgement required: ${key}.`);
  }
  const grantedAt = isoDate(options.now || input.granted_at || new Date().toISOString(), 'granted_at');
  return Object.freeze({
    schema_version: EXTERNAL_READER_CONSENT_VERSION,
    consent_id: requiredText(input.consent_id, 'consent_id'),
    client_id: requiredText(input.client_id, 'client_id'),
    professional_id: requiredText(input.professional_id, 'professional_id'),
    service_id: requiredText(input.service_id, 'service_id'),
    reader_type: assertReaderType(input.reader_type),
    purpose: requiredText(input.purpose, 'purpose'),
    resource_scopes: scopes(input.resource_scopes, EXTERNAL_READER_RESOURCE_SCOPES, 'resource_scopes'),
    duration,
    granted_at: grantedAt,
    expires_at: expiry(duration, grantedAt, input.expires_at),
    service_status: cleanText(input.service_status) || 'active',
    acknowledgements: Object.freeze({ ...input.acknowledgements }),
    status: 'granted',
    access_count: 0,
    revoked_scopes: Object.freeze([]),
    all_scopes_granted_by_default: false,
    wildcard_scope_allowed: false,
    retention_authorised: false,
    runtime_evidence_write_authorised: false,
    runtime_memory_write_authorised: false,
    required_action_authorised: false
  });
}

export function authorizeExternalReaderAccess(consent, request = {}, options = {}) {
  const now = isoDate(options.now || new Date().toISOString(), 'now');
  if (consent?.status !== 'granted') throw new TypeError('Consent is not active.');
  if (consent.expires_at && consent.expires_at <= now) throw new TypeError('Consent has expired.');
  if (consent.duration === 'one_time' && consent.access_count > 0) throw new TypeError('One-time access was already used.');
  if (consent.duration === 'until_service_completion' && consent.service_status === 'completed') throw new TypeError('Consent ended with service completion.');
  const scope = requiredText(request.resource_scope, 'resource_scope');
  if (!consent.resource_scopes.includes(scope)) throw new TypeError('Resource is outside consent scope.');
  if (consent.professional_id !== request.professional_id) throw new TypeError('Professional is outside consent scope.');
  const revokeMap = {
    entry: 'professional_runtime_access', reconstruction: 'professional_runtime_access',
    reading: 'professional_runtime_access', navigation: 'professional_runtime_access',
    runtime_memory: 'professional_runtime_access', birth_information: 'birth_data_access',
    external_reader_chart: 'chart_access', uploaded_files: 'uploaded_file_access',
    previous_reports: 'report_sharing'
  };
  if (consent.revoked_scopes.includes(revokeMap[scope]) || consent.revoked_scopes.includes('all_professional_access')) {
    throw new TypeError('Resource access has been revoked.');
  }
  return Object.freeze({
    allowed: true,
    consent_id: consent.consent_id,
    resource_scope: scope,
    professional_id: consent.professional_id,
    reader_type: consent.reader_type,
    runtime_evidence_write_authorised: false,
    runtime_memory_write_authorised: false
  });
}

export function revokeExternalReaderConsent(consent, input = {}, options = {}) {
  if (input.explicit_action !== true) throw new TypeError('Revocation requires explicit action.');
  const revoked = scopes(input.revocation_scopes, EXTERNAL_READER_REVOCATION_SCOPES, 'revocation_scopes');
  const all = revoked.includes('all_professional_access');
  return Object.freeze({
    ...consent,
    status: all ? 'revoked' : consent.status,
    revoked_scopes: Object.freeze([...new Set([...consent.revoked_scopes, ...revoked])]),
    revocation: Object.freeze({
      revoked_at: isoDate(options.now || new Date().toISOString(), 'revoked_at'),
      revoked_by: requiredText(input.revoked_by, 'revoked_by'),
      reason: cleanText(input.reason) || null,
      new_access_stopped: true,
      audit_record_retained: true
    })
  });
}
