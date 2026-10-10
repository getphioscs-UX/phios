export const PROFESSIONAL_RECORDS_RIGHTS_VERSION =
  'phi-os.professional-records-rights.v1';

export const PROFESSIONAL_NOTE_TYPES = Object.freeze([
  'financial_fact_note',
  'document_verification_note',
  'assumption_note',
  'calculation_note',
  'risk_observation',
  'product_neutral_recommendation',
  'regulated_advice_note',
  'client_decision',
  'implementation_note',
  'review_note',
  'human_design_interpretation_note',
  'runtime_professional_note'
]);

export const PROFESSIONAL_REPORT_STATUSES = Object.freeze([
  'draft',
  'professional_review_required',
  'approved',
  'delivered',
  'superseded',
  'withdrawn'
]);

export const PROFESSIONAL_DATA_RIGHTS_ACTIONS = Object.freeze([
  'export_birth_data',
  'export_uploaded_chart',
  'export_reports',
  'export_financial_data',
  'export_professional_notes_index',
  'delete_uploaded_chart',
  'delete_financial_source_documents',
  'request_professional_notes_review',
  'request_account_deletion'
]);

const NOTE_CONTENT_CLASS = Object.freeze({
  financial_fact_note: 'client_provided_fact',
  document_verification_note: 'document_verification',
  assumption_note: 'professional_assumption',
  calculation_note: 'calculation_result',
  risk_observation: 'professional_assessment',
  product_neutral_recommendation: 'product_neutral_recommendation',
  regulated_advice_note: 'regulated_advice',
  client_decision: 'client_decision',
  implementation_note: 'implementation_result',
  review_note: 'professional_review',
  human_design_interpretation_note: 'interpretive_perspective',
  runtime_professional_note: 'professional_assessment'
});

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function requiredText(value, field) {
  const text = cleanText(value);
  if (!text) throw new TypeError(`${field} is required.`);
  return text;
}

function isoDate(value, field) {
  const time = Date.parse(cleanText(value));
  if (!Number.isFinite(time)) throw new TypeError(`${field} must be a date.`);
  return new Date(time).toISOString();
}

function cleanReferences(values, field) {
  const result = [];
  for (const value of Array.isArray(values) ? values : []) {
    const text = cleanText(value);
    if (!text) throw new TypeError(`${field} contains an empty reference.`);
    if (!result.includes(text)) result.push(text);
  }
  return result;
}

export function createProfessionalNoteRecord(input = {}, options = {}) {
  const noteType = cleanText(input.note_type);
  if (!PROFESSIONAL_NOTE_TYPES.includes(noteType)) {
    throw new TypeError('A supported Professional note type is required.');
  }
  if (noteType === 'regulated_advice_note') {
    throw new TypeError(
      'Regulated advice is not enabled by M4A-W7 data governance.'
    );
  }
  const expectedClass = NOTE_CONTENT_CLASS[noteType];
  if (
    cleanText(input.content_class) !== expectedClass ||
    (Array.isArray(input.content_classes) &&
      input.content_classes.length !== 1)
  ) {
    throw new TypeError(
      'Professional notes must contain exactly one matching content class.'
    );
  }
  if (
    input.raw_source_document ||
    input.source_document_content ||
    input.raw_system_payload
  ) {
    throw new TypeError(
      'Professional notes cannot embed source documents or system payloads.'
    );
  }
  const content = cleanText(input.content);
  if (!content) throw new TypeError('Professional note content is required.');

  return Object.freeze({
    contract: PROFESSIONAL_RECORDS_RIGHTS_VERSION,
    note_id: requiredText(input.note_id, 'note_id'),
    client_id: requiredText(input.client_id, 'client_id'),
    service_id: requiredText(input.service_id, 'service_id'),
    author_id: requiredText(input.author_id, 'author_id'),
    note_type: noteType,
    content_class: expectedClass,
    content,
    source_references: Object.freeze(
      cleanReferences(input.source_references, 'source_references')
    ),
    created_at: isoDate(
      options.now || input.created_at || new Date().toISOString(),
      'created_at'
    ),
    classification: 'professional_record',
    raw_source_document_embedded: false,
    mixed_content_classes: false,
    regulated_advice_authorised: false
  });
}

export function createReportGovernanceRecord(input = {}, options = {}) {
  const status = cleanText(input.review_status);
  if (!PROFESSIONAL_REPORT_STATUSES.includes(status)) {
    throw new TypeError('A supported Professional report status is required.');
  }
  if (input.report_content || input.source_document_content) {
    throw new TypeError(
      'Report governance metadata cannot embed report or source content.'
    );
  }
  const sourceReferences = cleanReferences(
    input.source_references,
    'source_references'
  );
  if (sourceReferences.length === 0) {
    throw new TypeError('Report source references are required.');
  }
  const reviewedBy = cleanText(input.reviewed_by);
  if (
    ['approved', 'delivered'].includes(status) &&
    !reviewedBy
  ) {
    throw new TypeError('Approved or delivered report requires a reviewer.');
  }
  return Object.freeze({
    contract: PROFESSIONAL_RECORDS_RIGHTS_VERSION,
    report_id: requiredText(input.report_id, 'report_id'),
    client_id: requiredText(input.client_id, 'client_id'),
    service_id: requiredText(input.service_id, 'service_id'),
    report_type: requiredText(input.report_type, 'report_type'),
    version: requiredText(input.version, 'version'),
    data_date: isoDate(input.data_date, 'data_date'),
    generated_at: isoDate(
      options.now || input.generated_at || new Date().toISOString(),
      'generated_at'
    ),
    source_references: Object.freeze(sourceReferences),
    assumptions: Object.freeze(
      cleanReferences(input.assumptions, 'assumptions')
    ),
    review_status: status,
    reviewed_by: reviewedBy,
    classification: 'professional_restricted',
    public: false,
    export_logging_required: true,
    report_content_embedded: false,
    source_document_content_embedded: false,
    regulated_advice_authorised: false
  });
}

export function createProfessionalDataRightsRequest(
  input = {},
  options = {}
) {
  if (input.explicit_action !== true) {
    throw new TypeError('Professional data rights require explicit action.');
  }
  const action = cleanText(input.action);
  if (!PROFESSIONAL_DATA_RIGHTS_ACTIONS.includes(action)) {
    throw new TypeError('A supported Professional data right is required.');
  }
  const resourceIds = cleanReferences(input.resource_ids, 'resource_ids');
  if (
    action !== 'request_account_deletion' &&
    resourceIds.length === 0
  ) {
    throw new TypeError('Professional data rights require resource IDs.');
  }
  return Object.freeze({
    contract: PROFESSIONAL_RECORDS_RIGHTS_VERSION,
    request_id: requiredText(input.request_id, 'request_id'),
    client_id: requiredText(input.client_id, 'client_id'),
    data_subject_id: requiredText(input.data_subject_id, 'data_subject_id'),
    action,
    resource_ids: Object.freeze(resourceIds),
    requested_at: isoDate(
      options.now || input.requested_at || new Date().toISOString(),
      'requested_at'
    ),
    status: 'requested',
    owner_verification_required: true,
    consent_access_not_equal_ownership: true,
    secure_delivery_required: action.startsWith('export_'),
    ordinary_email_delivery_allowed: false,
    legal_retention_review_required: action.startsWith('delete_') ||
      action === 'request_account_deletion',
    action_executed: false,
    export_worker_enabled: false,
    deletion_worker_enabled: false
  });
}

export default Object.freeze({
  createProfessionalNoteRecord,
  createReportGovernanceRecord,
  createProfessionalDataRightsRequest
});
