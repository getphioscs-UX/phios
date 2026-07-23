import { FINANCIAL_DATA_SCOPES } from './professional-consent-contract.js';

export const JOINT_HOUSEHOLD_CONSENT_VERSION =
  'phi-os.joint-household-consent.v1';

export const JOINT_HOUSEHOLD_ROLES = Object.freeze([
  'main_client',
  'joint_client',
  'spouse',
  'parent',
  'child',
  'business_partner',
  'other_stakeholder'
]);

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function uniqueFinancialScopes(values) {
  const scopes = [];
  for (const rawValue of Array.isArray(values) ? values : []) {
    const value = cleanText(rawValue);
    if (
      !value ||
      value === '*' ||
      !FINANCIAL_DATA_SCOPES.includes(value)
    ) {
      throw new TypeError('Unsupported household financial scope.');
    }
    if (!scopes.includes(value)) scopes.push(value);
  }
  return scopes;
}

export function createHouseholdParticipantConsent(
  input = {},
  options = {}
) {
  const role = cleanText(input.role);
  if (!JOINT_HOUSEHOLD_ROLES.includes(role)) {
    throw new TypeError('A supported household role is required.');
  }
  if (input.explicit_action !== true) {
    throw new TypeError('Household consent requires an explicit action.');
  }
  const participantId = cleanText(input.participant_id);
  const dataSubjectId = cleanText(input.data_subject_id);
  if (!participantId || !dataSubjectId) {
    throw new TypeError('Participant and data subject IDs are required.');
  }
  const isAdult = input.is_adult === true;
  const authorityBasis = cleanText(input.authority_basis);
  if (!isAdult && authorityBasis !== 'guardian') {
    throw new TypeError('A minor requires a recorded guardian authority basis.');
  }
  const scopes = uniqueFinancialScopes(input.financial_data_scopes);
  if (scopes.length === 0) {
    throw new TypeError('Household consent requires explicit data scopes.');
  }
  return Object.freeze({
    schema_version: JOINT_HOUSEHOLD_CONSENT_VERSION,
    participant_id: participantId,
    data_subject_id: dataSubjectId,
    role,
    is_adult: isAdult,
    authority_basis: isAdult ? 'self' : authorityBasis,
    authorised_by: isAdult
      ? dataSubjectId
      : cleanText(input.authorised_by),
    status: 'granted',
    granted_at: cleanText(options.now || new Date().toISOString()),
    financial_data_scopes: Object.freeze(scopes),
    revoked: false
  });
}

export function authorizeHouseholdFinancialAccess(
  participantConsents,
  request = {}
) {
  const dataSubjectId = cleanText(request.data_subject_id);
  const scope = cleanText(request.scope);
  const consent = (Array.isArray(participantConsents)
    ? participantConsents
    : []
  ).find(item => cleanText(item.data_subject_id) === dataSubjectId);
  if (
    !consent ||
    consent.status !== 'granted' ||
    consent.revoked === true
  ) {
    throw new TypeError(
      'The financial data subject has not granted active consent.'
    );
  }
  if (!consent.financial_data_scopes.includes(scope)) {
    throw new TypeError(
      'The requested household data is outside that subject consent.'
    );
  }
  return Object.freeze({
    contract: JOINT_HOUSEHOLD_CONSENT_VERSION,
    allowed: true,
    participant_id: consent.participant_id,
    data_subject_id: consent.data_subject_id,
    role: consent.role,
    resource_scope: scope,
    another_adult_consent_inferred: false
  });
}

export default Object.freeze({
  createHouseholdParticipantConsent,
  authorizeHouseholdFinancialAccess
});
