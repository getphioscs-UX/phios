import {
  SECURITY_ERROR_CODES,
  SECURITY_PRIVACY_CONTRACT_ID,
  SecurityPrivacyError
} from './security-contract.js';

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function uniqueIds(values) {
  return [...new Set(
    (Array.isArray(values) ? values : [])
      .map(cleanText)
      .filter(Boolean)
  )];
}

function activeAt(grant, now) {
  const expiresAt = cleanText(grant.expires_at);
  return !expiresAt || expiresAt > now;
}

export function authorizeProfessionalAccess(input = {}, options = {}) {
  const runtimeId = cleanText(input.runtime_id);
  const professionalId = cleanText(input.professional_id);
  const grant = input.grant || {};
  const now = cleanText(options.now) || new Date().toISOString();
  const runtimeIds = uniqueIds(grant.runtime_ids);

  if (
    grant.status !== 'granted' ||
    grant.revoked === true ||
    !cleanText(grant.consent_version) ||
    !cleanText(grant.purpose) ||
    !activeAt(grant, now)
  ) {
    throw new SecurityPrivacyError(
      SECURITY_ERROR_CODES.PROFESSIONAL_CONSENT_REQUIRED,
      'Active, purpose-bound Professional consent is required.'
    );
  }
  if (
    !runtimeId ||
    !professionalId ||
    cleanText(grant.professional_id) !== professionalId ||
    runtimeIds.includes('*') ||
    !runtimeIds.includes(runtimeId)
  ) {
    throw new SecurityPrivacyError(
      SECURITY_ERROR_CODES.PROFESSIONAL_SCOPE_DENIED,
      'Professional access is limited to explicitly granted Runtime IDs.'
    );
  }
  return Object.freeze({
    contract: SECURITY_PRIVACY_CONTRACT_ID,
    allowed: true,
    runtime_id: runtimeId,
    professional_id: professionalId,
    purpose: cleanText(grant.purpose),
    consent_version: cleanText(grant.consent_version),
    user_wide_access: false,
    raw_account_access: false
  });
}

export function authorizeResearchUse(input = {}) {
  const runtimeId = cleanText(input.runtime_id);
  const consent = input.consent || {};
  const runtimeIds = uniqueIds(consent.runtime_ids);

  if (
    consent.status !== 'granted' ||
    consent.withdrawn === true ||
    !cleanText(consent.consent_version) ||
    !cleanText(consent.purpose)
  ) {
    throw new SecurityPrivacyError(
      SECURITY_ERROR_CODES.RESEARCH_CONSENT_REQUIRED,
      'Private Runtime data requires explicit Research consent.'
    );
  }
  if (
    !runtimeId ||
    runtimeIds.includes('*') ||
    !runtimeIds.includes(runtimeId)
  ) {
    throw new SecurityPrivacyError(
      SECURITY_ERROR_CODES.RESEARCH_SCOPE_DENIED,
      'Research consent must explicitly name each permitted Runtime.'
    );
  }
  return Object.freeze({
    contract: SECURITY_PRIVACY_CONTRACT_ID,
    allowed: true,
    runtime_id: runtimeId,
    classification: 'research-consented',
    purpose: cleanText(consent.purpose),
    consent_version: cleanText(consent.consent_version),
    community_use_allowed: consent.community_use === true,
    private_by_default: true,
    withdrawal_supported: true
  });
}

export default Object.freeze({
  authorizeProfessionalAccess,
  authorizeResearchUse
});
