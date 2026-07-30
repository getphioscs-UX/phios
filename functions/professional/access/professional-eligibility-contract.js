export const PROFESSIONAL_CAPABILITY_CONTRACT_VERSION =
  'phi-os.professional-capability.v1';
export const PROFESSIONAL_CREDENTIAL_CONTRACT_VERSION =
  'phi-os.professional-credential.v1';
export const PROFESSIONAL_CERTIFICATION_CONTRACT_VERSION =
  'phi-os.professional-certification.v1';

const ELIGIBILITY_STATUSES = Object.freeze([
  'active',
  'suspended',
  'expired',
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

function isoDate(value, field, optional = false) {
  const text = cleanText(value);
  if (!text && optional) return null;
  const time = Date.parse(text);
  if (!Number.isFinite(time)) throw new TypeError(`${field} must be a date.`);
  return new Date(time).toISOString();
}

function status(value) {
  const result = cleanText(value) || 'active';
  if (!ELIGIBILITY_STATUSES.includes(result)) {
    throw new TypeError('Unsupported Professional eligibility status.');
  }
  return result;
}

function baseRecord(input, options) {
  const issuedAt = isoDate(
    input.issued_at || options.now || new Date().toISOString(),
    'issued_at'
  );
  const expiresAt = isoDate(input.expires_at, 'expires_at', true);
  if (expiresAt && expiresAt <= issuedAt) {
    throw new TypeError('Eligibility expiry must be after issue time.');
  }
  return {
    professional_id: requiredText(
      input.professional_id,
      'professional_id'
    ),
    domain: requiredText(input.domain, 'domain'),
    status: status(input.status),
    issued_at: issuedAt,
    expires_at: expiresAt
  };
}

export function createProfessionalCapability(input = {}, options = {}) {
  return Object.freeze({
    contract: PROFESSIONAL_CAPABILITY_CONTRACT_VERSION,
    capability_id: requiredText(input.capability_id, 'capability_id'),
    capability_code: requiredText(
      input.capability_code,
      'capability_code'
    ),
    ...baseRecord(input, options),
    basis_reference_ids: Object.freeze(
      [...new Set(
        (Array.isArray(input.basis_reference_ids)
          ? input.basis_reference_ids
          : [])
          .map(cleanText)
          .filter(Boolean)
      )]
    ),
    runtime_capability: false
  });
}

export function createProfessionalCredential(input = {}, options = {}) {
  return Object.freeze({
    contract: PROFESSIONAL_CREDENTIAL_CONTRACT_VERSION,
    credential_id: requiredText(input.credential_id, 'credential_id'),
    credential_type: requiredText(
      input.credential_type,
      'credential_type'
    ),
    issuer: requiredText(input.issuer, 'issuer'),
    evidence_reference: requiredText(
      input.evidence_reference,
      'evidence_reference'
    ),
    ...baseRecord(input, options),
    capability_codes: Object.freeze(
      [...new Set(
        (Array.isArray(input.capability_codes)
          ? input.capability_codes
          : [])
          .map(cleanText)
          .filter(Boolean)
      )]
    ),
    grants_workspace_access: false
  });
}

export function createProfessionalCertification(input = {}, options = {}) {
  return Object.freeze({
    contract: PROFESSIONAL_CERTIFICATION_CONTRACT_VERSION,
    certification_id: requiredText(
      input.certification_id,
      'certification_id'
    ),
    certification_code: requiredText(
      input.certification_code,
      'certification_code'
    ),
    issuer: requiredText(input.issuer, 'issuer'),
    verification_reference: requiredText(
      input.verification_reference,
      'verification_reference'
    ),
    ...baseRecord(input, options),
    capability_codes: Object.freeze(
      [...new Set(
        (Array.isArray(input.capability_codes)
          ? input.capability_codes
          : [])
          .map(cleanText)
          .filter(Boolean)
      )]
    ),
    grants_workspace_access: false
  });
}

function active(record, now) {
  return (
    record?.status === 'active' &&
    (!record.expires_at || record.expires_at > now)
  );
}

export function evaluateProfessionalEligibility(input = {}, options = {}) {
  const professionalId = cleanText(input.professional_id);
  const requested = [...new Set(
    (Array.isArray(input.required_capability_codes)
      ? input.required_capability_codes
      : [])
      .map(cleanText)
      .filter(Boolean)
  )];
  const now = isoDate(
    options.now || input.evaluated_at || new Date().toISOString(),
    'evaluated_at'
  );
  const capabilities = (Array.isArray(input.capabilities)
    ? input.capabilities
    : []).filter(record =>
    record?.contract === PROFESSIONAL_CAPABILITY_CONTRACT_VERSION &&
    record.professional_id === professionalId &&
    active(record, now)
  );
  const credentials = (Array.isArray(input.credentials)
    ? input.credentials
    : []).filter(record =>
    record?.contract === PROFESSIONAL_CREDENTIAL_CONTRACT_VERSION &&
    record.professional_id === professionalId &&
    active(record, now)
  );
  const certifications = (Array.isArray(input.certifications)
    ? input.certifications
    : []).filter(record =>
    record?.contract === PROFESSIONAL_CERTIFICATION_CONTRACT_VERSION &&
    record.professional_id === professionalId &&
    active(record, now)
  );

  const missing = requested.filter(code => {
    const capability = capabilities.find(
      record => record.capability_code === code
    );
    if (!capability) return true;
    const basisIds = new Set(capability.basis_reference_ids || []);
    return ![...credentials, ...certifications].some(record =>
      basisIds.has(record.credential_id || record.certification_id) &&
      (record.capability_codes || []).includes(code)
    );
  });

  return Object.freeze({
    contract: 'phi-os.professional-eligibility-decision.v1',
    eligible: professionalId !== '' &&
      requested.length > 0 &&
      missing.length === 0,
    professional_id: professionalId || null,
    required_capability_codes: Object.freeze(requested),
    missing_capability_codes: Object.freeze(missing),
    evaluated_at: now,
    capability_is_permission: false,
    credential_is_permission: false,
    certification_is_permission: false
  });
}

export default Object.freeze({
  createProfessionalCapability,
  createProfessionalCredential,
  createProfessionalCertification,
  evaluateProfessionalEligibility
});
