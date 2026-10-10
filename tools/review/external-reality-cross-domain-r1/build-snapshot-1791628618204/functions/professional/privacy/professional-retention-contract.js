export const PROFESSIONAL_RETENTION_VERSION =
  'phi-os.professional-retention.v1';

export const PROFESSIONAL_RETENTION_MODES = Object.freeze([
  'service_only',
  'scheduled_annual_reviews',
  'selected_summaries_only',
  'future_professional_sessions',
  'do_not_retain_after_completion',
  'no_retain_after_required_service_period'
]);

export const PROFESSIONAL_RETENTION_RECORD_CLASSES = Object.freeze([
  'intake_data',
  'source_document',
  'professional_working_file',
  'final_report',
  'professional_note',
  'consent_record',
  'access_audit',
  'phi_os_accounting_record'
]);

const ANNUAL_MODES = new Set([
  'scheduled_annual_reviews',
  'selected_summaries_only',
  'future_professional_sessions'
]);

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

function addDays(value, days) {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function earliestDate(...values) {
  const available = values.filter(Boolean).sort();
  return available[0] || '';
}

function uniqueRecordClasses(values) {
  const result = [];
  for (const value of Array.isArray(values) ? values : []) {
    const normalized = cleanText(value);
    if (!PROFESSIONAL_RETENTION_RECORD_CLASSES.includes(normalized)) {
      throw new TypeError('Unsupported Professional retention record class.');
    }
    if (!result.includes(normalized)) result.push(normalized);
  }
  if (result.length === 0) {
    throw new TypeError('At least one retention record class is required.');
  }
  return result;
}

export function createProfessionalRetentionDecision(input = {}, options = {}) {
  if (input.explicit_action !== true) {
    throw new TypeError('Retention requires an explicit client action.');
  }
  const mode = cleanText(input.retention_mode);
  if (!PROFESSIONAL_RETENTION_MODES.includes(mode)) {
    throw new TypeError('A supported Professional retention mode is required.');
  }
  const createdAt = isoDate(
    options.now || input.created_at || new Date().toISOString(),
    'created_at'
  );
  let expiresAt = '';
  if (ANNUAL_MODES.has(mode)) {
    expiresAt = isoDate(input.retention_expires_at, 'retention_expires_at');
    const maximum = addDays(createdAt, 366);
    if (expiresAt <= createdAt || expiresAt > maximum) {
      throw new TypeError(
        'Longer-term retention requires fresh consent at least annually.'
      );
    }
  }

  return Object.freeze({
    contract: PROFESSIONAL_RETENTION_VERSION,
    retention_decision_id: requiredText(
      input.retention_decision_id,
      'retention_decision_id'
    ),
    consent_id: requiredText(input.consent_id, 'consent_id'),
    data_subject_id: requiredText(input.data_subject_id, 'data_subject_id'),
    service_id: requiredText(input.service_id, 'service_id'),
    created_at: createdAt,
    retention_mode: mode,
    retention_expires_at: expiresAt,
    record_classes: Object.freeze(
      uniqueRecordClasses(input.record_classes)
    ),
    delete_source_documents_after_report:
      input.delete_source_documents_after_report === true,
    explicit_action: true,
    retention_authorised_separately_from_access: true,
    source_documents_in_runtime_memory: false,
    indefinite_retention: false,
    production_legal_review_completed: false
  });
}

export function buildProfessionalRetentionSchedule(
  decision,
  lifecycle = {}
) {
  if (decision?.contract !== PROFESSIONAL_RETENTION_VERSION) {
    throw new TypeError('A valid Professional retention decision is required.');
  }
  const completedAt = lifecycle.service_completed_at
    ? isoDate(lifecycle.service_completed_at, 'service_completed_at')
    : '';
  const deliveredAt = lifecycle.report_delivered_at
    ? isoDate(lifecycle.report_delivered_at, 'report_delivered_at')
    : '';
  const shortRetention = new Set([
    'service_only',
    'do_not_retain_after_completion',
    'no_retain_after_required_service_period'
  ]).has(decision.retention_mode);

  return Object.freeze({
    contract: PROFESSIONAL_RETENTION_VERSION,
    retention_decision_id: decision.retention_decision_id,
    source_document_delete_at: deliveredAt &&
      (decision.delete_source_documents_after_report || shortRetention)
      ? addDays(deliveredAt, 30)
      : decision.retention_expires_at,
    professional_working_file_delete_at: earliestDate(
      completedAt ? addDays(completedAt, 90) : '',
      decision.retention_expires_at
    ),
    final_report_review_or_delete_at: earliestDate(
      deliveredAt ? addDays(deliveredAt, shortRetention ? 30 : 365) : '',
      decision.retention_expires_at
    ),
    accounting_record_retention: Object.freeze({
      years: 7,
      scope: 'phi_os_transaction_and_accounting_records_only',
      client_source_documents_included_by_default: false
    }),
    automatic_deletion_executed: false,
    retention_scheduler_enabled: false
  });
}

export function createLegalRetentionException(input = {}, options = {}) {
  if (input.explicit_authorisation !== true) {
    throw new TypeError('Legal retention exception requires authorisation.');
  }
  const createdAt = isoDate(
    options.now || input.created_at || new Date().toISOString(),
    'created_at'
  );
  const expiresAt = isoDate(input.expires_at, 'expires_at');
  if (expiresAt <= createdAt) {
    throw new TypeError('Legal retention exception must have a future expiry.');
  }
  const legalBasis = cleanText(input.legal_basis);
  const approvedByRole = cleanText(input.approved_by_role);
  if (!legalBasis || !approvedByRole) {
    throw new TypeError('Legal basis and approval role are required.');
  }
  const reviewAt = isoDate(input.review_at, 'review_at');
  if (reviewAt <= createdAt || reviewAt > expiresAt) {
    throw new TypeError(
      'Legal retention review must be after creation and no later than expiry.'
    );
  }
  return Object.freeze({
    contract: PROFESSIONAL_RETENTION_VERSION,
    exception_id: requiredText(input.exception_id, 'exception_id'),
    legal_basis: legalBasis,
    record_classes: Object.freeze(
      uniqueRecordClasses(input.record_classes)
    ),
    created_at: createdAt,
    expires_at: expiresAt,
    approved_by_role: approvedByRole,
    review_at: reviewAt,
    indefinite: false,
    client_source_documents_included:
      input.client_source_documents_included === true,
    deletion_block_is_scope_limited: true
  });
}

export function handleProfessionalConsentWithdrawal(input = {}) {
  if (input.explicit_action !== true) {
    throw new TypeError('Consent withdrawal requires explicit client action.');
  }
  return Object.freeze({
    contract: PROFESSIONAL_RETENTION_VERSION,
    consent_id: requiredText(input.consent_id, 'consent_id'),
    data_subject_id: requiredText(input.data_subject_id, 'data_subject_id'),
    withdrawn_at: isoDate(
      input.withdrawn_at || new Date().toISOString(),
      'withdrawn_at'
    ),
    new_access_stopped: true,
    new_processing_stopped: true,
    pending_work_restricted: true,
    deletion_review_required: true,
    lawful_retention_exception_must_be_recorded: true,
    audit_record_separated_from_sensitive_payload: true,
    deletion_claimed_complete: false
  });
}

export default Object.freeze({
  createProfessionalRetentionDecision,
  buildProfessionalRetentionSchedule,
  createLegalRetentionException,
  handleProfessionalConsentWithdrawal
});
