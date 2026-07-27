import {
  validateProfessionalConsent
} from '../consent/professional-consent-contract.js';

export const PROFESSIONAL_WORKSPACE_CONTRACT_VERSION =
  'phi-os.professional-workspace.v1';

export const PROFESSIONAL_WORKSPACE_STATUSES = Object.freeze([
  'awaiting_consent',
  'awaiting_materials',
  'ready_for_review',
  'in_professional_review',
  'client_clarification_required',
  'report_draft',
  'delivered',
  'revision_requested',
  'follow_up_due',
  'completed',
  'access_revoked'
]);

const RESOURCE_CAPABILITY_MAP = Object.freeze({
  entry: 'view_entry',
  reconstruction: 'view_reconstruction',
  reading: 'view_reading',
  navigation: 'view_navigation',
  runtime_memory: 'view_runtime_memory',
  uploaded_files: 'view_uploaded_files',
  human_design_chart: 'view_human_design_chart',
  birth_information: 'view_birth_information',
  previous_reports: 'view_previous_reports'
});

const FINANCIAL_CAPABILITY_MAP = Object.freeze({
  income: 'view_income',
  expenses: 'view_expenses',
  bank_balances: 'view_bank_cash',
  investments: 'view_investments',
  properties: 'view_properties',
  liabilities: 'view_liabilities',
  insurance: 'view_insurance',
  tax_information: 'view_tax',
  retirement_information: 'view_retirement',
  education_information: 'view_education',
  estate_information: 'view_estate',
  uploaded_documents: 'view_financial_documents',
  previous_financial_reports: 'view_previous_financial_reports'
});

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function requiredText(value, field) {
  const text = cleanText(value);
  if (!text) throw new TypeError(`${field} is required.`);
  return text;
}

function disabledCapabilities() {
  return Object.freeze(
    Object.fromEntries(
      Object.values(RESOURCE_CAPABILITY_MAP).map(key => [key, false])
    )
  );
}

function consentCapabilities(consent) {
  const capabilities = { ...disabledCapabilities() };
  for (const scope of consent.resource_scopes || []) {
    const key = RESOURCE_CAPABILITY_MAP[scope];
    if (key) capabilities[key] = true;
  }
  return Object.freeze(capabilities);
}

function financialCapabilities(consent) {
  const capabilities = Object.fromEntries(
    Object.values(FINANCIAL_CAPABILITY_MAP).map(key => [key, false])
  );
  for (const scope of consent.financial_data_scopes || []) {
    const key = FINANCIAL_CAPABILITY_MAP[scope];
    if (key) capabilities[key] = true;
  }
  return Object.freeze(capabilities);
}

function assertConsentMatches(workspace, consent) {
  for (const field of ['client_id', 'professional_id', 'service_id']) {
    if (consent?.[field] !== workspace[field]) {
      throw new TypeError(`Consent ${field} does not match Workspace.`);
    }
  }
}

export function createProfessionalWorkspace(input = {}) {
  const status = cleanText(input.status) || 'awaiting_consent';
  if (!PROFESSIONAL_WORKSPACE_STATUSES.includes(status)) {
    throw new TypeError('Unsupported Professional Workspace status.');
  }
  if (
    status !== 'awaiting_consent' &&
    status !== 'access_revoked'
  ) {
    throw new TypeError(
      'A new Workspace must remain awaiting consent until access is validated.'
    );
  }
  return Object.freeze({
    schema_version: PROFESSIONAL_WORKSPACE_CONTRACT_VERSION,
    workspace_id: requiredText(input.workspace_id, 'workspace_id'),
    client_id: requiredText(input.client_id, 'client_id'),
    professional_id: requiredText(input.professional_id, 'professional_id'),
    service_id: requiredText(input.service_id, 'service_id'),
    consent_id: null,
    current_runtime_id: cleanText(input.current_runtime_id) || null,
    status,
    capabilities: disabledCapabilities(),
    financial_capabilities: financialCapabilities({}),
    view_financial_reality: false,
    consent_validated: false,
    runtime_write_allowed: false,
    external_reader_to_runtime_evidence_allowed: false,
    automatic_recommendation_allowed: false,
    regulated_advice_activated: false,
    persistence_status: 'contract_only',
    d1_record_created: false
  });
}

export function activateProfessionalWorkspace(
  workspace,
  consent,
  options = {}
) {
  assertConsentMatches(workspace, consent);
  const validation = validateProfessionalConsent(consent, {
    now: options.now
  });
  if (!validation.valid || !validation.active) {
    throw new TypeError(
      `Professional consent is not active: ${validation.errors.join(', ')}`
    );
  }
  return Object.freeze({
    ...workspace,
    consent_id: consent.consent_id,
    status: 'awaiting_materials',
    capabilities: consentCapabilities(consent),
    financial_capabilities: financialCapabilities(consent),
    view_financial_reality:
      (consent.financial_data_scopes || []).length > 0,
    consent_validated: true
  });
}

export function revokeProfessionalWorkspaceAccess(
  workspace,
  revocation = {}
) {
  if (revocation.explicit_action !== true) {
    throw new TypeError('Workspace revocation requires an explicit action.');
  }
  return Object.freeze({
    ...workspace,
    status: 'access_revoked',
    capabilities: disabledCapabilities(),
    financial_capabilities: financialCapabilities({}),
    view_financial_reality: false,
    consent_validated: false,
    revoked_at: requiredText(revocation.revoked_at, 'revoked_at'),
    revocation_reason: requiredText(revocation.reason, 'reason')
  });
}

export default Object.freeze({
  createProfessionalWorkspace,
  activateProfessionalWorkspace,
  revokeProfessionalWorkspaceAccess
});
