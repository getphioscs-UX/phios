import { authorizeProfessionalAccess } from
  '../../runtime/security/access-boundary.js';

export const PROFESSIONAL_CONSENT_CONTRACT_VERSION =
  'phi-os.professional-consent.v1';

export const PROFESSIONAL_RESOURCE_SCOPES = Object.freeze([
  'entry',
  'reconstruction',
  'reading',
  'navigation',
  'runtime_memory',
  'uploaded_files',
  'human_design_chart',
  'birth_information',
  'previous_reports'
]);

export const FINANCIAL_DATA_SCOPES = Object.freeze([
  'income',
  'expenses',
  'bank_balances',
  'investments',
  'properties',
  'liabilities',
  'insurance',
  'tax_information',
  'retirement_information',
  'education_information',
  'estate_information',
  'uploaded_documents',
  'previous_financial_reports'
]);

export const HUMAN_DESIGN_SCOPES = Object.freeze([
  'birth_date',
  'birth_time',
  'birth_place',
  'chart_image',
  'chart_pdf',
  'derived_chart_fields',
  'professional_interpretation'
]);

export const CONSENT_DURATION_OPTIONS = Object.freeze([
  'one_time',
  'seven_days',
  'thirty_days',
  'ninety_days',
  'until_service_completion',
  'custom_date'
]);

export const CONSENT_REVOCATION_SCOPES = Object.freeze([
  'professional_runtime_access',
  'financial_data_access',
  'human_design_chart_access',
  'uploaded_file_access',
  'report_sharing',
  'follow_up_access',
  'all_professional_access'
]);

const GENERAL_ACKNOWLEDGEMENTS = Object.freeze([
  'scope_selected',
  'data_accuracy',
  'future_access_revocable'
]);
const HUMAN_DESIGN_ACKNOWLEDGEMENTS = Object.freeze([
  'birth_data_voluntarily_submitted',
  'birth_time_accuracy_affects_result',
  'interpretive_not_diagnostic',
  'future_access_revocation_understood'
]);
const RECOMMENDATION_ACKNOWLEDGEMENTS = Object.freeze([
  'information_and_date_basis',
  'missing_or_incorrect_data_affects_analysis',
  'projections_use_assumptions',
  'future_results_not_guaranteed',
  'client_retains_final_decision',
  'regulated_professional_may_be_required'
]);

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isoDate(value) {
  const text = cleanText(value);
  const time = Date.parse(text);
  return Number.isFinite(time) ? new Date(time).toISOString() : '';
}

function uniqueAllowed(values, allowed, field) {
  const source = Array.isArray(values) ? values : [];
  const result = [];
  for (const rawValue of source) {
    const value = cleanText(rawValue);
    if (!value) continue;
    if (value === '*' || !allowed.includes(value)) {
      throw new TypeError(`${field} contains an unsupported scope.`);
    }
    if (!result.includes(value)) result.push(value);
  }
  return result;
}

function addDays(value, days) {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function resolveExpiry(duration, grantedAt, customExpiry) {
  if (duration === 'one_time') return '';
  if (duration === 'seven_days') return addDays(grantedAt, 7);
  if (duration === 'thirty_days') return addDays(grantedAt, 30);
  if (duration === 'ninety_days') return addDays(grantedAt, 90);
  if (duration === 'until_service_completion') return '';
  const custom = isoDate(customExpiry);
  if (!custom || custom <= grantedAt) {
    throw new TypeError('Custom consent expiry must be after grant time.');
  }
  return custom;
}

function assertAcknowledgements(values, required, label) {
  for (const key of required) {
    if (values?.[key] !== true) {
      throw new TypeError(`${label} acknowledgement is required: ${key}`);
    }
  }
}

function hasHumanDesignScope(resourceScopes, humanDesignScopes) {
  return (
    resourceScopes.includes('human_design_chart') ||
    resourceScopes.includes('birth_information') ||
    humanDesignScopes.length > 0
  );
}

function hasFinancialScope(financialDataScopes) {
  return financialDataScopes.length > 0;
}

export function createProfessionalConsent(input = {}, options = {}) {
  const now = isoDate(options.now || new Date().toISOString());
  const duration = cleanText(input.duration);
  if (!CONSENT_DURATION_OPTIONS.includes(duration)) {
    throw new TypeError('A supported consent duration is required.');
  }
  if (input.explicit_action !== true) {
    throw new TypeError('Professional consent requires an explicit user action.');
  }

  const resourceScopes = uniqueAllowed(
    input.resource_scopes,
    PROFESSIONAL_RESOURCE_SCOPES,
    'resource_scopes'
  );
  const financialDataScopes = uniqueAllowed(
    input.financial_data_scopes,
    FINANCIAL_DATA_SCOPES,
    'financial_data_scopes'
  );
  const humanDesignScopes = uniqueAllowed(
    input.human_design_scopes,
    HUMAN_DESIGN_SCOPES,
    'human_design_scopes'
  );
  if (
    resourceScopes.length === 0 &&
    financialDataScopes.length === 0 &&
    humanDesignScopes.length === 0
  ) {
    throw new TypeError('At least one explicit consent scope is required.');
  }

  const requiredText = {
    consent_id: cleanText(input.consent_id),
    client_id: cleanText(input.client_id),
    professional_id: cleanText(input.professional_id),
    service_id: cleanText(input.service_id),
    purpose: cleanText(input.purpose),
    consent_version: cleanText(input.consent_version)
  };
  for (const [field, value] of Object.entries(requiredText)) {
    if (!value) throw new TypeError(`${field} is required.`);
  }

  assertAcknowledgements(
    input.acknowledgements,
    GENERAL_ACKNOWLEDGEMENTS,
    'General'
  );
  if (hasHumanDesignScope(resourceScopes, humanDesignScopes)) {
    assertAcknowledgements(
      input.acknowledgements,
      HUMAN_DESIGN_ACKNOWLEDGEMENTS,
      'Human Design'
    );
  }
  if (hasFinancialScope(financialDataScopes)) {
    assertAcknowledgements(
      input.acknowledgements,
      RECOMMENDATION_ACKNOWLEDGEMENTS,
      'Recommendation'
    );
  }

  const runtimeIds = uniqueAllowed(
    input.runtime_ids,
    (Array.isArray(input.runtime_ids) ? input.runtime_ids : [])
      .map(cleanText)
      .filter(value => value && value !== '*'),
    'runtime_ids'
  );
  const expiresAt = resolveExpiry(duration, now, input.expires_at);

  return Object.freeze({
    schema_version: PROFESSIONAL_CONSENT_CONTRACT_VERSION,
    ...requiredText,
    status: 'granted',
    granted_at: now,
    duration,
    expires_at: expiresAt,
    service_status: cleanText(input.service_status) || 'active',
    runtime_ids: Object.freeze(runtimeIds),
    resource_scopes: Object.freeze(resourceScopes),
    financial_data_scopes: Object.freeze(financialDataScopes),
    human_design_scopes: Object.freeze(humanDesignScopes),
    acknowledgements: Object.freeze({ ...input.acknowledgements }),
    access_count: Number.isInteger(input.access_count)
      ? Math.max(0, input.access_count)
      : 0,
    revoked: false,
    revoked_scopes: Object.freeze([]),
    revocation: null,
    guardrails: Object.freeze({
      all_scopes_granted_by_default: false,
      wildcard_scope_allowed: false,
      professional_access_is_ownership: false,
      retention_authorised: false,
      regulated_advice_authorised: false
    })
  });
}

export function validateProfessionalConsent(consent, options = {}) {
  const errors = [];
  const now = isoDate(options.now || new Date().toISOString());
  if (!consent || typeof consent !== 'object') {
    return { valid: false, active: false, errors: ['Consent is required.'] };
  }
  if (consent.schema_version !== PROFESSIONAL_CONSENT_CONTRACT_VERSION) {
    errors.push('schema_version is invalid.');
  }
  if (consent.status !== 'granted' || consent.revoked === true) {
    errors.push('Consent is not granted.');
  }
  if (
    consent.expires_at &&
    isoDate(consent.expires_at) <= now
  ) {
    errors.push('Consent has expired.');
  }
  if (
    consent.duration === 'one_time' &&
    Number(consent.access_count || 0) > 0
  ) {
    errors.push('One-time consent has already been used.');
  }
  if (
    consent.duration === 'until_service_completion' &&
    consent.service_status === 'completed'
  ) {
    errors.push('Consent ended when the service completed.');
  }
  for (const field of [
    'consent_id',
    'client_id',
    'professional_id',
    'service_id',
    'purpose',
    'consent_version'
  ]) {
    if (!cleanText(consent[field])) errors.push(`${field} is required.`);
  }
  if (
    !Array.isArray(consent.resource_scopes) ||
    !Array.isArray(consent.financial_data_scopes) ||
    !Array.isArray(consent.human_design_scopes)
  ) {
    errors.push('Consent scope arrays are required.');
  }
  return {
    valid: errors.length === 0,
    active: errors.length === 0,
    errors
  };
}

function categoryRevocationScope(category) {
  if (category === 'runtime') return 'professional_runtime_access';
  if (category === 'financial') return 'financial_data_access';
  if (category === 'human_design') return 'human_design_chart_access';
  if (category === 'file') return 'uploaded_file_access';
  if (category === 'report') return 'report_sharing';
  if (category === 'follow_up') return 'follow_up_access';
  return '';
}

function assertNotRevoked(consent, category) {
  const revoked = Array.isArray(consent.revoked_scopes)
    ? consent.revoked_scopes
    : [];
  const scope = categoryRevocationScope(category);
  if (
    consent.revoked === true ||
    revoked.includes('all_professional_access') ||
    (scope && revoked.includes(scope))
  ) {
    throw new TypeError('Requested Professional access has been revoked.');
  }
}

export function authorizeProfessionalConsentAccess(
  consent,
  request = {},
  options = {}
) {
  const validation = validateProfessionalConsent(consent, options);
  if (!validation.active) {
    throw new TypeError(validation.errors.join(' '));
  }
  const category = cleanText(request.category);
  const scope = cleanText(request.scope);
  assertNotRevoked(consent, category);

  if (category === 'runtime') {
    if (!consent.resource_scopes.includes(scope)) {
      throw new TypeError('Runtime resource is outside consent scope.');
    }
    const runtimeId = cleanText(request.runtime_id);
    const runtimeAccess = authorizeProfessionalAccess({
      runtime_id: runtimeId,
      professional_id: cleanText(request.professional_id),
      grant: consent
    }, {
      now: isoDate(options.now || new Date().toISOString())
    });
    return Object.freeze({
      ...runtimeAccess,
      consent_id: consent.consent_id,
      category,
      resource_scope: scope,
      retention_authorised: false,
      regulated_advice_authorised: false
    });
  }

  if (category === 'financial') {
    if (!consent.financial_data_scopes.includes(scope)) {
      throw new TypeError('Financial data is outside consent scope.');
    }
  } else if (category === 'human_design') {
    if (!consent.human_design_scopes.includes(scope)) {
      throw new TypeError('Human Design data is outside consent scope.');
    }
    const birthScopes = ['birth_date', 'birth_time', 'birth_place'];
    const umbrella = birthScopes.includes(scope)
      ? 'birth_information'
      : 'human_design_chart';
    if (!consent.resource_scopes.includes(umbrella)) {
      throw new TypeError('Human Design umbrella consent is required.');
    }
  } else if (category === 'file') {
    if (
      scope !== 'uploaded_files' ||
      !consent.resource_scopes.includes('uploaded_files')
    ) {
      throw new TypeError('Uploaded files are outside consent scope.');
    }
  } else if (category === 'report') {
    if (
      scope !== 'previous_reports' ||
      !consent.resource_scopes.includes('previous_reports')
    ) {
      throw new TypeError('Previous reports are outside consent scope.');
    }
  } else {
    throw new TypeError('Unsupported Professional access category.');
  }

  if (
    cleanText(request.professional_id) !== consent.professional_id
  ) {
    throw new TypeError('Professional identity is outside consent scope.');
  }

  return Object.freeze({
    contract: PROFESSIONAL_CONSENT_CONTRACT_VERSION,
    allowed: true,
    consent_id: consent.consent_id,
    client_id: consent.client_id,
    professional_id: consent.professional_id,
    service_id: consent.service_id,
    purpose: consent.purpose,
    category,
    resource_scope: scope,
    retention_authorised: false,
    regulated_advice_authorised: false,
    client_final_decision: true
  });
}

export function revokeProfessionalConsent(
  consent,
  input = {},
  options = {}
) {
  if (!consent || typeof consent !== 'object') {
    throw new TypeError('Consent is required for revocation.');
  }
  if (input.explicit_action !== true) {
    throw new TypeError('Revocation requires an explicit user action.');
  }
  const scopes = uniqueAllowed(
    input.revocation_scopes,
    CONSENT_REVOCATION_SCOPES,
    'revocation_scopes'
  );
  if (scopes.length === 0) {
    throw new TypeError('At least one revocation scope is required.');
  }
  const all = scopes.includes('all_professional_access');
  const revokedScopes = [
    ...new Set([
      ...(Array.isArray(consent.revoked_scopes)
        ? consent.revoked_scopes
        : []),
      ...scopes
    ])
  ];
  return Object.freeze({
    ...consent,
    status: all ? 'revoked' : consent.status,
    revoked: all,
    revoked_scopes: Object.freeze(revokedScopes),
    revocation: Object.freeze({
      revoked_at: isoDate(options.now || new Date().toISOString()),
      revoked_by: cleanText(input.revoked_by),
      reason: cleanText(input.reason),
      scopes: Object.freeze(scopes),
      new_access_stopped: true,
      audit_record_retained: true,
      delivered_report_automatically_deleted: false
    })
  });
}

export default Object.freeze({
  createProfessionalConsent,
  validateProfessionalConsent,
  authorizeProfessionalConsentAccess,
  revokeProfessionalConsent
});
