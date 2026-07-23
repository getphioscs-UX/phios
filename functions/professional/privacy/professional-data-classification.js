export const PROFESSIONAL_DATA_CLASSIFICATION_VERSION =
  'phi-os.professional-data-classification.v1';

export const HUMAN_DESIGN_DATA_FIELDS = Object.freeze([
  'birth_date',
  'birth_time',
  'birth_place',
  'chart_image',
  'chart_pdf',
  'derived_chart_fields',
  'professional_interpretation'
]);

export const RESTRICTED_FINANCIAL_DATA_FIELDS = Object.freeze([
  'income',
  'bank_balance',
  'investment_value',
  'property_value',
  'debt',
  'insurance',
  'tax',
  'net_worth',
  'financial_report'
]);

export const HIGHLY_RESTRICTED_IDENTIFIER_FIELDS = Object.freeze([
  'identity_number',
  'bank_account_number',
  'policy_number',
  'tax_number',
  'signature',
  'exact_address',
  'minor_data'
]);

export const PROFESSIONAL_DATA_DOMAINS = Object.freeze([
  'general',
  'human_design',
  'financial',
  'professional_notes',
  'report',
  'file',
  'audit'
]);

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalized(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function classifyProfessionalData(input = {}) {
  const domain = normalized(input.domain);
  const field = normalized(input.field);
  if (!PROFESSIONAL_DATA_DOMAINS.includes(domain)) {
    throw new TypeError('A supported Professional data domain is required.');
  }
  if (!field) throw new TypeError('Professional data field is required.');

  let classification = 'professional_private';
  let runtimeClassification = 'private';
  let reason = 'private_by_default';

  if (
    HIGHLY_RESTRICTED_IDENTIFIER_FIELDS.includes(field) ||
    input.contains_highly_restricted_identifier === true
  ) {
    classification = 'professional_highly_restricted';
    runtimeClassification = 'sensitive';
    reason = 'highly_restricted_identifier';
  } else if (
    HUMAN_DESIGN_DATA_FIELDS.includes(field) ||
    RESTRICTED_FINANCIAL_DATA_FIELDS.includes(field) ||
    domain === 'file'
  ) {
    classification = 'professional_restricted';
    runtimeClassification = 'sensitive';
    reason = domain === 'file'
      ? 'private_professional_file'
      : 'restricted_professional_data';
  } else if (domain === 'audit') {
    classification = 'professional_audit';
    runtimeClassification = 'professional';
    reason = 'metadata_only_audit_record';
  } else if (
    domain === 'professional_notes' ||
    domain === 'report'
  ) {
    classification = 'professional_record';
    runtimeClassification = 'professional';
    reason = 'professional_work_product';
  } else if (
    domain === 'human_design' ||
    domain === 'financial'
  ) {
    classification = 'professional_restricted';
    runtimeClassification = 'sensitive';
    reason = 'conservative_domain_default';
  }

  return Object.freeze({
    contract: PROFESSIONAL_DATA_CLASSIFICATION_VERSION,
    domain,
    field,
    classification,
    runtime_classification: runtimeClassification,
    reason,
    public: false,
    professional_access_is_ownership: false,
    runtime_memory_eligible_by_default: false
  });
}

export default classifyProfessionalData;
