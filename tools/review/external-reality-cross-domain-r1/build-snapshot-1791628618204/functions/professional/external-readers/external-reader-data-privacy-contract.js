import { cleanText, isoDate, requiredText } from './external-reader-constants.js';

export const EXTERNAL_READER_PRIVACY_VERSION = 'm4b-w8.1';

export const EXTERNAL_READER_DATA_CLASSES = Object.freeze([
  'birth_date', 'birth_time', 'birth_place', 'coordinates',
  'chart_image', 'chart_pdf', 'derived_chart_fields', 'registry_matches',
  'professional_interpretation', 'correspondence_review'
]);

export const EXTERNAL_READER_RETENTION_CATEGORIES = Object.freeze([
  'active_service_retention', 'post_service_retention',
  'client_requested_deletion', 'legal_accounting_retention',
  'professional_notes_retention'
]);

export const EXTERNAL_READER_RETENTION_CHOICES = Object.freeze([
  'service_only', 'future_professional_sessions', 'do_not_retain_after_completion'
]);

export const EXTERNAL_READER_RIGHTS_ACTIONS = Object.freeze([
  'export_birth_data', 'export_uploaded_chart', 'export_reports',
  'delete_uploaded_chart', 'request_professional_notes_review',
  'request_account_deletion'
]);

const RESTRICTED = new Set([
  'birth_date', 'birth_time', 'birth_place', 'coordinates',
  'chart_image', 'chart_pdf', 'derived_chart_fields'
]);

export function classifyExternalReaderData(input = {}) {
  const dataClass = requiredText(input.data_class, 'data_class');
  if (!EXTERNAL_READER_DATA_CLASSES.includes(dataClass)) throw new TypeError('Unsupported External Reader data class.');
  return Object.freeze({
    schema_version: EXTERNAL_READER_PRIVACY_VERSION,
    data_class: dataClass,
    classification: RESTRICTED.has(dataClass) ? 'professional_restricted' : 'professional_record',
    source_reference: requiredText(input.source_reference, 'source_reference'),
    client_id: requiredText(input.client_id, 'client_id'),
    public: false,
    runtime_evidence: false,
    runtime_memory_eligible_by_default: false
  });
}

export function createExternalReaderRetentionDecision(input = {}, options = {}) {
  if (input.explicit_action !== true) throw new TypeError('Retention requires explicit client action.');
  const choice = requiredText(input.retention_choice, 'retention_choice');
  if (!EXTERNAL_READER_RETENTION_CHOICES.includes(choice)) throw new TypeError('Unsupported retention_choice.');
  const dataClasses = [...new Set(Array.isArray(input.data_classes) ? input.data_classes : [])];
  if (!dataClasses.length || dataClasses.some(item => !EXTERNAL_READER_DATA_CLASSES.includes(item))) {
    throw new TypeError('Supported data_classes are required.');
  }
  return Object.freeze({
    schema_version: EXTERNAL_READER_PRIVACY_VERSION,
    retention_decision_id: requiredText(input.retention_decision_id, 'retention_decision_id'),
    client_id: requiredText(input.client_id, 'client_id'),
    service_id: requiredText(input.service_id, 'service_id'),
    consent_reference: requiredText(input.consent_reference, 'consent_reference'),
    retention_choice: choice,
    data_classes: Object.freeze(dataClasses),
    selected_at: isoDate(options.now || input.selected_at || new Date().toISOString(), 'selected_at'),
    explicit_action: true,
    long_term_runtime_memory_write: false,
    future_session_access: choice === 'future_professional_sessions',
    deletion_review_required: choice === 'do_not_retain_after_completion',
    deletion_claimed_complete: false
  });
}

export function createExternalReaderRightsRequest(input = {}, options = {}) {
  if (input.explicit_action !== true) throw new TypeError('A rights request requires explicit action.');
  const action = requiredText(input.action, 'action');
  if (!EXTERNAL_READER_RIGHTS_ACTIONS.includes(action)) throw new TypeError('Unsupported rights action.');
  const resourceReferences = [...new Set((Array.isArray(input.resource_references) ? input.resource_references : []).map(cleanText).filter(Boolean))];
  if (action !== 'request_account_deletion' && !resourceReferences.length) throw new TypeError('Resource references are required.');
  return Object.freeze({
    schema_version: EXTERNAL_READER_PRIVACY_VERSION,
    request_id: requiredText(input.request_id, 'request_id'),
    client_id: requiredText(input.client_id, 'client_id'),
    action,
    resource_references: Object.freeze(resourceReferences),
    requested_at: isoDate(options.now || input.requested_at || new Date().toISOString(), 'requested_at'),
    status: 'requested',
    identity_verification_required: true,
    legal_retention_review_required: action.startsWith('delete_') || action === 'request_account_deletion',
    secure_export_required: action.startsWith('export_'),
    action_executed: false,
    deletion_claimed_complete: false
  });
}
