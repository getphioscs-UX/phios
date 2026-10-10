export const PROFESSIONAL_ACCESS_EVENT_VERSION =
  'phi-os.professional-access-event.v1';

export const PROFESSIONAL_ACCESS_ACTIONS = Object.freeze([
  'consent_granted',
  'resource_accessed',
  'birth_data_accessed',
  'chart_viewed',
  'chart_downloaded',
  'interpretation_edited',
  'report_exported',
  'access_revoked'
]);

const EVENT_FIELDS = Object.freeze([
  'event_id',
  'professional_id',
  'client_id',
  'resource_type',
  'resource_scope',
  'access_purpose',
  'access_time',
  'access_duration',
  'consent_id',
  'service_id',
  'action',
  'status'
]);

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function createProfessionalAccessEvent(input = {}, options = {}) {
  const action = cleanText(input.action);
  if (!PROFESSIONAL_ACCESS_ACTIONS.includes(action)) {
    throw new TypeError('A supported Professional access action is required.');
  }
  const event = {
    schema_version: PROFESSIONAL_ACCESS_EVENT_VERSION
  };
  for (const field of EVENT_FIELDS) {
    const value = field === 'access_time'
      ? cleanText(input[field] || options.now || new Date().toISOString())
      : cleanText(input[field]);
    if (!value) throw new TypeError(`${field} is required.`);
    event[field] = value;
  }
  return Object.freeze({
    ...event,
    contains_sensitive_payload: false,
    contains_document_content: false,
    contains_financial_value: false,
    audit_only: true
  });
}

export default createProfessionalAccessEvent;
