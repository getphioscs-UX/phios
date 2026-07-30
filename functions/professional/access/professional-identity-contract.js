export const PROFESSIONAL_IDENTITY_CONTRACT_VERSION =
  'phi-os.professional-identity.v1';

export const PROFESSIONAL_IDENTITY_STATUSES = Object.freeze([
  'pending_verification',
  'active',
  'suspended',
  'revoked'
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

export function createProfessionalIdentity(input = {}) {
  const status = cleanText(input.status) || 'pending_verification';
  if (!PROFESSIONAL_IDENTITY_STATUSES.includes(status)) {
    throw new TypeError('Unsupported Professional identity status.');
  }
  if (status === 'active' && input.identity_verified !== true) {
    throw new TypeError(
      'An active Professional identity requires explicit verification.'
    );
  }
  return Object.freeze({
    contract: PROFESSIONAL_IDENTITY_CONTRACT_VERSION,
    professional_id: requiredText(
      input.professional_id,
      'professional_id'
    ),
    subject_id: requiredText(input.subject_id, 'subject_id'),
    display_name: requiredText(input.display_name, 'display_name'),
    status,
    identity_verified: input.identity_verified === true,
    verified_at: input.identity_verified === true
      ? isoDate(input.verified_at, 'verified_at')
      : null,
    verified_by: input.identity_verified === true
      ? requiredText(input.verified_by, 'verified_by')
      : null,
    organization_id: cleanText(input.organization_id) || null,
    authentication_secret_embedded: false,
    user_wide_access: false
  });
}

export function evaluateProfessionalIdentity(identity) {
  const reasons = [];
  if (
    identity?.contract !== PROFESSIONAL_IDENTITY_CONTRACT_VERSION ||
    !cleanText(identity?.professional_id) ||
    !cleanText(identity?.subject_id)
  ) {
    reasons.push('professional_identity_invalid');
  } else {
    if (identity.status !== 'active') {
      reasons.push('professional_identity_inactive');
    }
    if (identity.identity_verified !== true) {
      reasons.push('professional_identity_unverified');
    }
  }
  return Object.freeze({
    valid: reasons.length === 0,
    professional_id: cleanText(identity?.professional_id) || null,
    reasons: Object.freeze(reasons)
  });
}

export default Object.freeze({
  createProfessionalIdentity,
  evaluateProfessionalIdentity
});
