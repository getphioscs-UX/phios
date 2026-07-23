export const FINANCIAL_EVIDENCE_CONTRACT_VERSION =
  'phi-os.financial-evidence.v1';

export const FINANCIAL_EVIDENCE_SOURCE_TYPES = Object.freeze([
  'user_entered',
  'document_extracted',
  'professional_entered',
  'calculated',
  'estimated',
  'projected',
  'unverified'
]);

export const FINANCIAL_EVIDENCE_VERIFICATION_STATUSES = Object.freeze([
  'unverified',
  'pending',
  'verified',
  'rejected',
  'superseded'
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

function uniqueReferences(values, field) {
  const result = [];
  for (const value of Array.isArray(values) ? values : []) {
    const text = requiredText(value, field);
    if (!result.includes(text)) result.push(text);
  }
  return result;
}

export function createFinancialEvidenceValue(input = {}, options = {}) {
  const sourceType = cleanText(input.source_type);
  if (!FINANCIAL_EVIDENCE_SOURCE_TYPES.includes(sourceType)) {
    throw new TypeError('A supported Financial evidence source is required.');
  }
  const verificationStatus = cleanText(input.verification_status);
  if (
    !FINANCIAL_EVIDENCE_VERIFICATION_STATUSES.includes(verificationStatus)
  ) {
    throw new TypeError(
      'A supported Financial evidence verification status is required.'
    );
  }
  if (
    input.raw_document_content ||
    input.raw_extraction_payload ||
    input.full_identifier
  ) {
    throw new TypeError(
      'Financial evidence metadata cannot embed source content or identifiers.'
    );
  }
  if (
    typeof input.value_numeric !== 'number' ||
    !Number.isFinite(input.value_numeric)
  ) {
    throw new TypeError('Financial evidence value must be finite.');
  }

  const assumptionIds = uniqueReferences(
    input.assumption_ids,
    'assumption_ids'
  );
  const inputEvidenceIds = uniqueReferences(
    input.input_evidence_ids,
    'input_evidence_ids'
  );
  if (
    ['estimated', 'projected'].includes(sourceType) &&
    assumptionIds.length === 0
  ) {
    throw new TypeError(
      'Estimated or projected evidence requires explicit assumptions.'
    );
  }
  if (
    sourceType === 'calculated' &&
    (
      !cleanText(input.formula_id) ||
      !cleanText(input.formula_version) ||
      inputEvidenceIds.length === 0
    )
  ) {
    throw new TypeError(
      'Calculated evidence requires formula and input evidence references.'
    );
  }
  if (
    sourceType === 'document_extracted' &&
    !cleanText(input.source_reference_id)
  ) {
    throw new TypeError(
      'Document-extracted evidence requires a source reference.'
    );
  }

  return Object.freeze({
    contract: FINANCIAL_EVIDENCE_CONTRACT_VERSION,
    evidence_value_id: requiredText(
      input.evidence_value_id,
      'evidence_value_id'
    ),
    household_id: requiredText(input.household_id, 'household_id'),
    data_subject_id: requiredText(input.data_subject_id, 'data_subject_id'),
    record_type: requiredText(input.record_type, 'record_type'),
    record_id: requiredText(input.record_id, 'record_id'),
    field: requiredText(input.field, 'field'),
    value_numeric: input.value_numeric,
    unit: requiredText(input.unit, 'unit'),
    currency: cleanText(input.currency).toUpperCase(),
    source_type: sourceType,
    source_reference_id: cleanText(input.source_reference_id),
    evidence_date: isoDate(input.evidence_date, 'evidence_date'),
    verification_status: verificationStatus,
    verified_by: cleanText(input.verified_by),
    formula_id: cleanText(input.formula_id),
    formula_version: cleanText(input.formula_version),
    input_evidence_ids: Object.freeze(inputEvidenceIds),
    assumption_ids: Object.freeze(assumptionIds),
    created_at: isoDate(
      options.now || input.created_at || new Date().toISOString(),
      'created_at'
    ),
    classification: 'professional_restricted',
    raw_document_content_embedded: false,
    full_identifier_embedded: false,
    creates_recommendation: false
  });
}

export default createFinancialEvidenceValue;
