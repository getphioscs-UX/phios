const SENSITIVE = new Set(['SENSITIVE', 'HIGHLY_SENSITIVE', 'RESTRICTED_PROFESSIONAL']);
const ALLOWED_TRANSITIONS = new Set(['UNKNOWN->SUPPORTED', 'UNKNOWN->UNRESOLVED', 'SUPPORTED->DISPUTED', 'DISPUTED->RESOLVED', 'DISPUTED->UNRESOLVED']);

export function evaluateEvidenceEligibility(input) {
  const required = ['dataReference', 'dataNature', 'sourceReference', 'lineageReferences', 'certainty', 'purposeCodes', 'sensitivityClass'];
  if (required.some(key => input[key] === undefined)) return 'UNKNOWN';
  if (!Array.isArray(input.lineageReferences) || input.lineageReferences.length === 0) return 'INELIGIBLE';
  if (input.sourceType === 'UI_TELEMETRY' || input.dataNature === 'ANALYTICS') return 'INELIGIBLE';
  if (input.certainty === 'DISPUTED') return 'DISPUTED';
  if (['INFERRED', 'INTERPRETED'].includes(input.dataNature)) return 'REQUIRES_CORROBORATION';
  if (input.dataNature === 'CALCULATED' && (!input.algorithmReference || !input.algorithmVersion)) return 'INELIGIBLE';
  return 'ELIGIBLE';
}

export function assertEvidencePromotion(input) {
  if (input.automatic === true || input.providerPromoted === true) throw new Error('RDG_EVIDENCE_PROMOTION_FORBIDDEN');
  for (const key of ['eligibilityDecision', 'authorityReference', 'lineageReferences', 'promotionReason', 'promotedAt']) {
    if (input[key] === undefined || input[key] === null) throw new Error(`RDG_EVIDENCE_PROMOTION_MISSING:${key}`);
  }
  if (input.eligibilityDecision !== 'ELIGIBLE') throw new Error('RDG_EVIDENCE_NOT_ELIGIBLE');
  if (!Array.isArray(input.lineageReferences) || input.lineageReferences.length === 0) throw new Error('RDG_EVIDENCE_PROMOTION_LINEAGE_REQUIRED');
  return 'ACCEPTED_EVIDENCE';
}

export function evaluateSensitiveInference(input) {
  if (!SENSITIVE.has(input.sensitivityClass)) return input.purposeAllowed === true ? 'ALLOW_PURPOSE_BOUND' : 'UNRESOLVED';
  if (input.professionalCategory === true && input.professionalAuthority !== 'PR') return 'REQUIRE_PROFESSIONAL_AUTHORITY';
  if (input.purposeAllowed !== true) return 'DENY';
  if (input.explicitConsent !== true) return 'REQUIRE_EXPLICIT_CONSENT';
  return 'ALLOW_PURPOSE_BOUND';
}

export function assertUnknownDisputedTransition(input) {
  const transition = `${input.fromState}->${input.toState}`;
  if (!ALLOWED_TRANSITIONS.has(transition)) throw new Error(`RDG_UNKNOWN_DISPUTED_TRANSITION_INVALID:${transition}`);
  for (const key of ['reason', 'evidenceReferences', 'authorityReference', 'recordedAt']) {
    if (input[key] === undefined || input[key] === null) throw new Error(`RDG_UNKNOWN_DISPUTED_TRANSITION_MISSING:${key}`);
  }
  if (!Array.isArray(input.evidenceReferences)) throw new Error('RDG_UNKNOWN_DISPUTED_EVIDENCE_INVALID');
  return true;
}
