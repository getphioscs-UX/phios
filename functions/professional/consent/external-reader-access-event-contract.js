import { assertReaderType, cleanText, isoDate, requiredText } from '../external-readers/external-reader-constants.js';

export const EXTERNAL_READER_ACCESS_EVENT_VERSION = 'phi-os.external-reader-access-event.v1';
export const EXTERNAL_READER_ACCESS_ACTIONS = Object.freeze([
  'consent_granted', 'resource_accessed', 'birth_data_accessed',
  'chart_viewed', 'chart_downloaded', 'report_shared', 'access_revoked'
]);

export function createExternalReaderAccessEvent(input = {}, options = {}) {
  const action = requiredText(input.action, 'action');
  if (!EXTERNAL_READER_ACCESS_ACTIONS.includes(action)) throw new TypeError('Unsupported access action.');
  return Object.freeze({
    schema_version: EXTERNAL_READER_ACCESS_EVENT_VERSION,
    event_id: requiredText(input.event_id, 'event_id'),
    professional_id: requiredText(input.professional_id, 'professional_id'),
    client_id: requiredText(input.client_id, 'client_id'),
    resource_type: requiredText(input.resource_type, 'resource_type'),
    access_purpose: requiredText(input.access_purpose, 'access_purpose'),
    access_time: isoDate(options.now || input.access_time || new Date().toISOString(), 'access_time'),
    access_duration: requiredText(input.access_duration, 'access_duration'),
    consent_id: requiredText(input.consent_id, 'consent_id'),
    service_id: requiredText(input.service_id, 'service_id'),
    reader_type: assertReaderType(input.reader_type),
    action,
    status: cleanText(input.status) || 'recorded',
    contains_sensitive_payload: false,
    contains_chart_content: false,
    audit_only: true
  });
}
