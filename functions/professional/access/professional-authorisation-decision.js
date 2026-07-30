import {
  validateProfessionalConsent
} from '../consent/professional-consent-contract.js';
import {
  evaluateProfessionalIdentity
} from './professional-identity-contract.js';
import {
  evaluateProfessionalAssignment
} from './professional-assignment-contract.js';

export const PROFESSIONAL_AUTHORISATION_DECISION_VERSION =
  'phi-os.professional-authorisation-decision.v1';

export const PROFESSIONAL_ACCESS_DENIAL_REASONS = Object.freeze([
  'request_invalid',
  'professional_identity_invalid',
  'professional_identity_inactive',
  'professional_identity_unverified',
  'professional_eligibility_denied',
  'assignment_invalid',
  'assignment_inactive',
  'assignment_not_started',
  'assignment_expired',
  'assignment_professional_id_mismatch',
  'assignment_client_id_mismatch',
  'assignment_service_id_mismatch',
  'assignment_journey_denied',
  'assignment_purpose_denied',
  'assignment_scope_denied',
  'consent_invalid',
  'consent_professional_id_mismatch',
  'consent_client_id_mismatch',
  'consent_service_id_mismatch',
  'consent_purpose_denied',
  'consent_journey_denied',
  'consent_scope_denied'
]);

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function requestedScopes(request) {
  return [...new Set(
    (Array.isArray(request?.resource_scopes)
      ? request.resource_scopes
      : [])
      .map(cleanText)
      .filter(Boolean)
  )];
}

function denial(code, stage, detail = '') {
  return Object.freeze({
    code,
    stage,
    detail
  });
}

function consentReasons(consent, request, now) {
  const reasons = [];
  const validation = validateProfessionalConsent(consent, { now });
  if (!validation.active) {
    reasons.push(denial(
      'consent_invalid',
      'consent',
      validation.errors.join(' ')
    ));
    return reasons;
  }
  for (const field of ['professional_id', 'client_id', 'service_id']) {
    if (cleanText(request[field]) !== cleanText(consent[field])) {
      reasons.push(denial(
        `consent_${field}_mismatch`,
        'consent'
      ));
    }
  }
  if (cleanText(request.purpose) !== cleanText(consent.purpose)) {
    reasons.push(denial('consent_purpose_denied', 'purpose'));
  }
  if (
    !Array.isArray(consent.runtime_ids) ||
    consent.runtime_ids.includes('*') ||
    !consent.runtime_ids.includes(cleanText(request.runtime_id))
  ) {
    reasons.push(denial('consent_journey_denied', 'consent'));
  }
  const scopes = requestedScopes(request);
  if (
    scopes.some(scope =>
      !Array.isArray(consent.resource_scopes) ||
      !consent.resource_scopes.includes(scope)
    )
  ) {
    reasons.push(denial('consent_scope_denied', 'scope'));
  }
  return reasons;
}

export function evaluateProfessionalAuthorisation(
  input = {},
  options = {}
) {
  const request = input.request || {};
  const now = cleanText(
    options.now || request.requested_at || new Date().toISOString()
  );
  const reasons = [];
  const scopes = requestedScopes(request);
  if (
    !cleanText(request.request_id) ||
    !cleanText(request.professional_id) ||
    !cleanText(request.client_id) ||
    !cleanText(request.service_id) ||
    !cleanText(request.journey_id) ||
    !cleanText(request.runtime_id) ||
    !cleanText(request.purpose) ||
    scopes.length === 0 ||
    scopes.includes('*')
  ) {
    reasons.push(denial('request_invalid', 'request'));
  }

  const identityDecision = evaluateProfessionalIdentity(input.identity);
  for (const code of identityDecision.reasons) {
    reasons.push(denial(code, 'identity'));
  }
  if (
    identityDecision.professional_id &&
    identityDecision.professional_id !== cleanText(request.professional_id)
  ) {
    reasons.push(denial(
      'professional_identity_invalid',
      'identity',
      'Professional identity does not match the request.'
    ));
  }

  const eligibility = input.eligibility || {};
  const assignmentCapabilities = Array.isArray(
    input.assignment?.required_capability_codes
  )
    ? input.assignment.required_capability_codes
    : [];
  if (
    eligibility.contract !==
      'phi-os.professional-eligibility-decision.v1' ||
    eligibility.eligible !== true ||
    eligibility.professional_id !== cleanText(request.professional_id) ||
    assignmentCapabilities.some(code =>
      !Array.isArray(eligibility.required_capability_codes) ||
      !eligibility.required_capability_codes.includes(code)
    )
  ) {
    reasons.push(denial(
      'professional_eligibility_denied',
      'eligibility'
    ));
  }

  const assignmentDecision = evaluateProfessionalAssignment(
    input.assignment,
    { ...request, resource_scopes: scopes },
    { now }
  );
  for (const code of assignmentDecision.reasons) {
    reasons.push(denial(code, 'assignment'));
  }

  reasons.push(...consentReasons(input.consent, {
    ...request,
    resource_scopes: scopes
  }, now));

  const uniqueReasons = reasons.filter((item, index, source) =>
    source.findIndex(candidate =>
      candidate.code === item.code &&
      candidate.stage === item.stage
    ) === index
  );

  return Object.freeze({
    contract: PROFESSIONAL_AUTHORISATION_DECISION_VERSION,
    decision_id: `decision:${cleanText(request.request_id) || 'invalid'}`,
    request_id: cleanText(request.request_id) || null,
    allowed: uniqueReasons.length === 0,
    professional_id: cleanText(request.professional_id) || null,
    client_id: cleanText(request.client_id) || null,
    service_id: cleanText(request.service_id) || null,
    journey_id: cleanText(request.journey_id) || null,
    runtime_id: cleanText(request.runtime_id) || null,
    purpose: cleanText(request.purpose) || null,
    resource_scopes: Object.freeze(scopes),
    assignment_id: assignmentDecision.assignment_id,
    consent_id: cleanText(input.consent?.consent_id) || null,
    evaluated_at: now,
    denial_reasons: Object.freeze(uniqueReasons),
    permission_order: Object.freeze([
      'request',
      'identity',
      'eligibility',
      'assignment',
      'consent',
      'purpose',
      'scope'
    ]),
    payment_is_permission: false,
    entitlement_is_permission: false,
    provider_output_is_permission: false
  });
}

export default Object.freeze({ evaluateProfessionalAuthorisation });
