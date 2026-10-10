export const SECURITY_PRIVACY_CONTRACT_ID =
  'phi-os.runtime-security-privacy.v1';

export const RUNTIME_DATA_CLASSIFICATIONS = Object.freeze([
  'public',
  'private',
  'sensitive',
  'professional',
  'research-consented'
]);

export const PRIVACY_OPERATIONS = Object.freeze({
  DELETE_SESSION: 'delete_session',
  DELETE_RUNTIME: 'delete_runtime',
  DELETE_ACCOUNT: 'delete_account',
  EXPORT_DATA: 'export_data',
  PROFESSIONAL_ACCESS: 'professional_access',
  RESEARCH_USE: 'research_use'
});

export const SECURITY_ERROR_CODES = Object.freeze({
  INVALID_INPUT: 'security_invalid_input',
  PERSISTENCE_REQUIRED: 'security_persistence_required',
  USER_ACTION_REQUIRED: 'security_user_action_required',
  OWNERSHIP_REQUIRED: 'security_ownership_required',
  NOT_FOUND: 'security_not_found',
  ACCOUNT_CONFIRMATION_REQUIRED:
    'security_account_confirmation_required',
  SESSION_STORE_REQUIRED: 'security_session_store_required',
  PROFESSIONAL_CONSENT_REQUIRED:
    'security_professional_consent_required',
  PROFESSIONAL_SCOPE_DENIED: 'security_professional_scope_denied',
  RESEARCH_CONSENT_REQUIRED: 'security_research_consent_required',
  RESEARCH_SCOPE_DENIED: 'security_research_scope_denied'
});

export class SecurityPrivacyError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'SecurityPrivacyError';
    this.code = code;
    this.details = details;
  }
}

export function assertSecurityPersistence(persistence) {
  const required = [
    'read',
    'list',
    'delete',
    'listEvents',
    'loadSnapshot'
  ];
  if (!persistence || required.some(method =>
    typeof persistence[method] !== 'function'
  )) {
    throw new SecurityPrivacyError(
      SECURITY_ERROR_CODES.PERSISTENCE_REQUIRED,
      'Security and Privacy requires the Runtime Persistence boundary.'
    );
  }
  return persistence;
}

export default Object.freeze({
  id: SECURITY_PRIVACY_CONTRACT_ID,
  classifications: RUNTIME_DATA_CLASSIFICATIONS,
  operations: PRIVACY_OPERATIONS,
  errors: SECURITY_ERROR_CODES
});
