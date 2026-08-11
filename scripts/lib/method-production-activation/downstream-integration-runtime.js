import { isMethodProductionEligible, getMethodProductionEligibility } from './production-eligibility-runtime.js';

export const MPA_DOWNSTREAM_PROJECTION_REFERENCE_SCHEMA_VERSION =
  'PHI-OS-MPA-DOWNSTREAM-PROJECTION-REFERENCE-v1.0.0';
export const MPA_DOWNSTREAM_HANDOFF_SCHEMA_VERSION =
  'PHI-OS-MPA-DOWNSTREAM-HANDOFF-v1.0.0';

function requiredText(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${label} is required.`);
  return value.trim();
}
function requiredDigest(value, label) {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) throw new TypeError(`${label} is invalid.`);
  return value;
}

export function assertProductionMethodProjectionReference(reference = {}) {
  if (reference.schemaVersion !== MPA_DOWNSTREAM_PROJECTION_REFERENCE_SCHEMA_VERSION) {
    throw new Error('METHOD_PROJECTION_REFERENCE_SCHEMA_INVALID');
  }
  requiredText(reference.methodCode, 'methodCode');
  requiredText(reference.methodVersion, 'methodVersion');
  requiredText(reference.projectionCode, 'projectionCode');
  requiredText(reference.projectionVersion, 'projectionVersion');
  requiredDigest(reference.projectionDigest, 'projectionDigest');
  if (reference.projectionStatus !== 'PRODUCTION') throw new Error('METHOD_PROJECTION_NOT_PRODUCTION');
  if (reference.truthClaimed !== false) throw new Error('METHOD_PROJECTION_TRUTH_CLAIM_FORBIDDEN');
  if (reference.professionalJudgmentCreated !== false) throw new Error('METHOD_PROJECTION_PROFESSIONAL_JUDGMENT_FORBIDDEN');
  return true;
}

export function createProductionMethodProjectionHandoff({ methodCode, methodVersion, projectionReference } = {}) {
  assertProductionMethodProjectionReference(projectionReference);
  if (projectionReference.methodCode !== methodCode || projectionReference.methodVersion !== methodVersion) {
    throw new Error('METHOD_PROJECTION_LINEAGE_MISMATCH');
  }
  const decision = getMethodProductionEligibility(methodCode, methodVersion, 'PROJECTION');
  if (!decision || !isMethodProductionEligible(methodCode, methodVersion, 'PROJECTION')) {
    throw new Error('METHOD_PRODUCTION_NOT_ELIGIBLE_FOR_DOWNSTREAM_INTEGRATION');
  }
  return Object.freeze({
    schemaVersion: MPA_DOWNSTREAM_HANDOFF_SCHEMA_VERSION,
    methodCode,
    methodVersion,
    capability: 'PROJECTION',
    eligibilityDecision: decision.decision,
    eligibilityDecisionDigest: decision.decisionDigest,
    projectionReference: Object.freeze({ ...projectionReference }),
    canonicalFlow: Object.freeze(['METHOD_PROJECTION','RMO','RRE','JR_PR_RNE','CPR','WPR']),
    handoffMode: 'REFERENCE_ONLY',
    projectionPayloadCopied: false,
    realityFactCreated: false,
    customerReadoutCreated: false,
    professionalJudgmentCreated: false,
    navigationDecisionCreated: false,
    presentationCreatedByMpa: false,
    webProjectionCreatedByMpa: false
  });
}
