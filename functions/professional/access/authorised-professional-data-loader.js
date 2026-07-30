import {
  evaluateProfessionalAuthorisation
} from './professional-authorisation-decision.js';
import {
  createPayloadFreeProfessionalAccessAudit
} from './professional-access-audit.js';

export const AUTHORISED_PROFESSIONAL_DATA_LOADER_VERSION =
  'phi-os.authorised-professional-data-loader.v1';

function clone(value) {
  if (value === undefined) return null;
  return structuredClone(value);
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
    return value;
  }
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

export class ProfessionalAuthorisationError extends Error {
  constructor(decision, audit) {
    super(
      `Professional access denied: ${
        decision.denial_reasons.map(reason => reason.code).join(', ')
      }`
    );
    this.name = 'ProfessionalAuthorisationError';
    this.code = decision.denial_reasons[0]?.code || 'access_denied';
    this.decision = decision;
    this.audit = audit;
  }
}

function projectWorkspace(decision, payload) {
  const source = payload && typeof payload === 'object' ? payload : {};
  const resources = source.resources &&
    typeof source.resources === 'object'
    ? Object.fromEntries(
      decision.resource_scopes.map(scope => [
        scope,
        clone(source.resources[scope])
      ])
    )
    : {};
  return deepFreeze({
    contract: 'phi-os.authorised-professional-workspace-projection.v1',
    professional_id: decision.professional_id,
    client_id: decision.client_id,
    service_id: decision.service_id,
    journey_id: decision.journey_id,
    runtime_id: decision.runtime_id,
    assignment_id: decision.assignment_id,
    consent_id: decision.consent_id,
    purpose: decision.purpose,
    resource_scopes: [...decision.resource_scopes],
    client: clone(source.client),
    journey: clone(source.journey),
    resources,
    read_only: true,
    runtime_mutation_allowed: false,
    evidence_promotion_allowed: false,
    provider_output_formalisation_allowed: false,
    automatic_signing_allowed: false,
    persistence_status: 'not_implemented'
  });
}

export async function loadAuthorisedProfessionalWorkspace(
  input = {},
  options = {}
) {
  const decision = evaluateProfessionalAuthorisation(input, {
    now: options.now
  });
  const audit = createPayloadFreeProfessionalAccessAudit(decision, {
    audit_id: options.audit_id,
    occurred_at: options.now
  });
  if (!decision.allowed) {
    throw new ProfessionalAuthorisationError(decision, audit);
  }
  if (typeof input.read_authorised_resources !== 'function') {
    throw new TypeError('An authorised resource reader is required.');
  }

  const payload = await input.read_authorised_resources(Object.freeze({
    professional_id: decision.professional_id,
    client_id: decision.client_id,
    service_id: decision.service_id,
    journey_id: decision.journey_id,
    runtime_id: decision.runtime_id,
    purpose: decision.purpose,
    resource_scopes: Object.freeze([...decision.resource_scopes]),
    assignment_id: decision.assignment_id,
    consent_id: decision.consent_id
  }));

  return Object.freeze({
    contract: AUTHORISED_PROFESSIONAL_DATA_LOADER_VERSION,
    decision,
    audit,
    workspace: projectWorkspace(decision, payload),
    read_performed_after_authorisation: true
  });
}

export default Object.freeze({
  loadAuthorisedProfessionalWorkspace
});
