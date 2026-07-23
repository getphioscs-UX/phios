import {
  HUMAN_DESIGN_DATA_FIELDS,
  classifyProfessionalData
} from './professional-data-classification.js';

export const PROFESSIONAL_MINIMIZATION_VERSION =
  'phi-os.professional-data-minimization.v1';

export const FINANCIAL_EVIDENCE_SOURCE_TYPES = Object.freeze([
  'user_entered',
  'document_extracted',
  'professional_entered',
  'calculated',
  'estimated',
  'projected',
  'unverified'
]);

export const FINANCIAL_MEMORY_SUMMARY_FIELDS = Object.freeze([
  'financial_position_date',
  'income_range',
  'expense_range',
  'net_worth_range',
  'major_liabilities',
  'primary_goals',
  'professional_review_date'
]);

const RUNTIME_MEMORY_FORBIDDEN_KEYS = new Set([
  'identity_number',
  'bank_account_number',
  'account_number',
  'policy_number',
  'tax_number',
  'signature',
  'exact_address',
  'birth_date',
  'birth_time',
  'birth_place',
  'chart_image',
  'chart_pdf',
  'raw_document',
  'raw_document_text',
  'raw_pdf_text',
  'source_document',
  'source_document_content',
  'precise_bank_balance'
]);

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function requiredText(value, field) {
  const text = cleanText(value);
  if (!text) throw new TypeError(`${field} is required.`);
  return text;
}

function normalized(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function isoDate(value, field) {
  const time = Date.parse(cleanText(value));
  if (!Number.isFinite(time)) throw new TypeError(`${field} must be a date.`);
  return new Date(time).toISOString();
}

export function maskSensitiveReference(value) {
  const compact = cleanText(value).replace(/[^a-z0-9]/gi, '');
  if (!compact) return '';
  const lastFour = compact.slice(-4);
  return `****${lastFour}`;
}

function assertSafeSummaryText(value, field) {
  const text = requiredText(value, field);
  if (/\b\d{8,}\b/.test(text.replace(/\s+/g, ''))) {
    throw new TypeError(`${field} contains a possible full identifier.`);
  }
  return text;
}

export function minimizeFinancialRecord(input = {}) {
  const category = normalized(input.category);
  const sourceType = normalized(input.source_type);
  if (!FINANCIAL_EVIDENCE_SOURCE_TYPES.includes(sourceType)) {
    throw new TypeError('A supported financial evidence source is required.');
  }
  const value = input.required_financial_value;
  if (
    value !== undefined &&
    (!Number.isFinite(value) || value < 0)
  ) {
    throw new TypeError('required_financial_value must be a non-negative number.');
  }

  const output = {
    contract: PROFESSIONAL_MINIMIZATION_VERSION,
    financial_item_id: requiredText(
      input.financial_item_id,
      'financial_item_id'
    ),
    data_subject_id: requiredText(input.data_subject_id, 'data_subject_id'),
    category: requiredText(category, 'category'),
    institution: cleanText(input.institution),
    masked_account_number: maskSensitiveReference(input.account_number),
    masked_policy_number: maskSensitiveReference(input.policy_number),
    general_property_location: cleanText(input.general_property_location),
    required_financial_value:
      value === undefined ? null : Number(value),
    currency: cleanText(input.currency).toUpperCase(),
    evidence_date: isoDate(input.evidence_date, 'evidence_date'),
    ownership: cleanText(input.ownership),
    source_type: sourceType,
    verification_status: normalized(input.verification_status) || 'unverified',
    classification: classifyProfessionalData({
      domain: 'financial',
      field: category
    }).classification,
    raw_source_document_stored: false,
    exact_address_stored: false,
    full_account_number_stored: false,
    full_policy_number_stored: false
  };
  return Object.freeze(output);
}

function walkKeys(value, keys = []) {
  if (!value || typeof value !== 'object') return keys;
  for (const [key, child] of Object.entries(value)) {
    keys.push(normalized(key));
    walkKeys(child, keys);
  }
  return keys;
}

export function assertProfessionalRuntimeMemoryBoundary(payload = {}) {
  const keys = walkKeys(payload);
  const forbidden = keys.filter(key => RUNTIME_MEMORY_FORBIDDEN_KEYS.has(key));
  if (forbidden.length > 0) {
    throw new TypeError(
      `Runtime Memory contains prohibited Professional data: ${forbidden[0]}`
    );
  }
  return true;
}

export function buildConfirmedFinancialMemorySummary(input = {}) {
  if (input.explicit_action !== true || input.client_confirmed !== true) {
    throw new TypeError(
      'Financial Runtime Memory requires explicit client confirmation.'
    );
  }
  if (
    ![
      'scheduled_annual_reviews',
      'selected_summaries_only'
    ].includes(input.retention_mode)
  ) {
    throw new TypeError(
      'A summary-compatible retention mode is required.'
    );
  }

  const summaryKeys = Object.keys(input.summary || {});
  const unsupported = summaryKeys.filter(
    field => !FINANCIAL_MEMORY_SUMMARY_FIELDS.includes(field)
  );
  if (unsupported.length > 0) {
    throw new TypeError(
      `Financial Runtime Memory contains an unsupported summary: ${unsupported[0]}`
    );
  }
  const summary = {};
  for (const field of FINANCIAL_MEMORY_SUMMARY_FIELDS) {
    const value = input.summary?.[field];
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      summary[field] = Object.freeze(
        value.map(item => assertSafeSummaryText(item, field))
      );
    } else {
      summary[field] = assertSafeSummaryText(value, field);
    }
  }
  if (Object.keys(summary).length === 0) {
    throw new TypeError('At least one confirmed financial summary is required.');
  }

  assertProfessionalRuntimeMemoryBoundary(summary);
  return Object.freeze({
    contract: PROFESSIONAL_MINIMIZATION_VERSION,
    summary_version: 'phi-os.confirmed-financial-memory-summary.v1',
    client_id: requiredText(input.client_id, 'client_id'),
    service_id: requiredText(input.service_id, 'service_id'),
    retention_consent_id: requiredText(
      input.retention_consent_id,
      'retention_consent_id'
    ),
    retention_mode: input.retention_mode,
    client_confirmed: true,
    confirmed_at: isoDate(input.confirmed_at, 'confirmed_at'),
    classification: 'professional_restricted',
    runtime_classification: 'sensitive',
    summary: Object.freeze(summary),
    source_documents_embedded: false,
    precise_identifiers_embedded: false,
    precise_account_balances_embedded: false,
    runtime_memory_eligible: true
  });
}

export function minimizeHumanDesignServiceRecord(input = {}) {
  const selected = Array.isArray(input.selected_fields)
    ? [...new Set(input.selected_fields.map(normalized))]
    : [];
  if (selected.some(field => !HUMAN_DESIGN_DATA_FIELDS.includes(field))) {
    throw new TypeError('Human Design record contains an unsupported field.');
  }
  if (selected.length === 0) {
    throw new TypeError('At least one Human Design field is required.');
  }
  if (
    input.future_session_retention_authorised === true &&
    !cleanText(input.retention_decision_id)
  ) {
    throw new TypeError(
      'Future-session Human Design retention requires a separate decision.'
    );
  }
  return Object.freeze({
    contract: PROFESSIONAL_MINIMIZATION_VERSION,
    record_id: requiredText(input.record_id, 'record_id'),
    data_subject_id: requiredText(input.data_subject_id, 'data_subject_id'),
    consent_id: requiredText(input.consent_id, 'consent_id'),
    selected_fields: Object.freeze(selected),
    chart_file_references: Object.freeze(
      Array.isArray(input.chart_file_references)
        ? input.chart_file_references.map(value =>
            requiredText(value, 'chart_file_reference'))
        : []
    ),
    raw_chart_content_embedded: false,
    runtime_memory_eligible: false,
    future_session_retention_authorised:
      input.future_session_retention_authorised === true,
    retention_decision_id: cleanText(input.retention_decision_id)
  });
}

export default Object.freeze({
  minimizeFinancialRecord,
  buildConfirmedFinancialMemorySummary,
  minimizeHumanDesignServiceRecord,
  assertProfessionalRuntimeMemoryBoundary
});
