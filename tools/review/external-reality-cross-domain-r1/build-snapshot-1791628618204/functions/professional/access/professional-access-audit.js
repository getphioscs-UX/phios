export const PROFESSIONAL_ACCESS_AUDIT_VERSION =
  'phi-os.professional-access-audit.v1';

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function createPayloadFreeProfessionalAccessAudit(
  decision,
  input = {}
) {
  if (
    decision?.contract !==
      'phi-os.professional-authorisation-decision.v1'
  ) {
    throw new TypeError('A Professional authorisation decision is required.');
  }
  return Object.freeze({
    contract: PROFESSIONAL_ACCESS_AUDIT_VERSION,
    audit_id: cleanText(input.audit_id) ||
      `audit:${decision.request_id || 'invalid'}`,
    decision_id: decision.decision_id,
    request_id: decision.request_id,
    professional_id: decision.professional_id,
    client_id: decision.client_id,
    service_id: decision.service_id,
    journey_id: decision.journey_id,
    runtime_id: decision.runtime_id,
    assignment_id: decision.assignment_id,
    consent_id: decision.consent_id,
    purpose: decision.purpose,
    resource_scopes: Object.freeze([...decision.resource_scopes]),
    outcome: decision.allowed ? 'allowed' : 'denied',
    denial_codes: Object.freeze(
      decision.denial_reasons.map(reason => reason.code)
    ),
    occurred_at: cleanText(input.occurred_at) || decision.evaluated_at,
    contains_customer_payload: false,
    contains_runtime_content: false,
    contains_document_content: false,
    contains_financial_value: false,
    persistence_status: 'caller_owned_append_only'
  });
}

export default Object.freeze({
  createPayloadFreeProfessionalAccessAudit
});
