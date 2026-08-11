import { canonicalDigest } from './validation-evidence-runtime.js';

export const MPA_AST_ACTIVATION_DECISION_SCHEMA_VERSION =
  'PHI-OS-MPA-AST-ACTIVATION-DECISION-v1.0.0';

const TECHNICAL_GATES = Object.freeze([
  'ephemerisVersion', 'ephemerisDigest', 'trustedJplReference', 'toleranceFreeze', 'historicalTimezoneAuthority'
]);
function object(value, message) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(message);
}
export function validateAstEphemerisAuthority(record) {
  object(record, 'AST ephemeris authority record is required.');
  const b = record.authorityBinding;
  object(b, 'AST ephemeris authority binding is required.');
  if (b.engineCode !== 'ASTRONOMY_ENGINE_JS' || b.version !== '2.1.19') throw new TypeError('AST ephemeris version drift.');
  if (!/^[a-f0-9]{40}$/.test(b.releaseCommit)) throw new TypeError('AST ephemeris release commit is invalid.');
  if (b.sourceArtifact?.digestAlgorithm !== 'GIT_BLOB_SHA1' || !/^[a-f0-9]{40}$/.test(b.sourceArtifact?.digest || '')) {
    throw new TypeError('AST ephemeris source artifact digest is invalid.');
  }
  if (b.license?.code !== 'MIT') throw new TypeError('AST ephemeris license drift.');
  if (record.authorityBindingDigest !== canonicalDigest(b)) throw new TypeError('AST ephemeris authority binding digest drift.');
  return Object.freeze({versionResolved:true,digestResolved:true,authorityBindingDigest:record.authorityBindingDigest});
}
export function validateAstTimezoneAuthority(record) {
  object(record, 'AST timezone authority record is required.');
  const b = record.authorityBinding;
  if (b?.authorityCode !== 'IANA_TZDB' || b.releaseVersion !== '2026c') throw new TypeError('AST TZDB version drift.');
  if (b.artifact?.digestAlgorithm !== 'SHA512' || !/^[a-f0-9]{128}$/.test(b.artifact?.digest || '')) throw new TypeError('AST TZDB digest is invalid.');
  if (b.license !== 'PUBLIC_DOMAIN') throw new TypeError('AST TZDB license drift.');
  if (record.historicalTimezonePolicy?.latestConvenienceAliasForbidden !== true) throw new TypeError('AST TZDB latest alias boundary drift.');
  if (record.authorityBindingDigest !== canonicalDigest(b)) throw new TypeError('AST TZDB authority binding digest drift.');
  return Object.freeze({versionResolved:true,digestResolved:true,historicalTimezoneResolved:true});
}
export function evaluateAstActivationReadiness({ technicalGates, productionPolicyAuthorityApproved = false, evidenceReferences = [] } = {}) {
  object(technicalGates, 'AST technical activation gates are required.');
  const failedTechnicalGates = TECHNICAL_GATES.filter(gate => technicalGates[gate] !== true);
  const technicalActivationEvidenceReady = failedTechnicalGates.length === 0;
  const methodSpecificReady = technicalActivationEvidenceReady && productionPolicyAuthorityApproved === true;
  return Object.freeze({
    schemaVersion: MPA_AST_ACTIVATION_DECISION_SCHEMA_VERSION, work:'MPA-W22', methodCode:'ASTROLOGY', pluginCode:'AST', methodVersion:'0.1.0',
    decision: !technicalActivationEvidenceReady ? 'AST_TECHNICAL_ACTIVATION_BLOCKED'
      : methodSpecificReady ? 'READY_FOR_MPA_W26_ELIGIBILITY_DECISION'
      : 'BLOCKED_PRODUCTION_POLICY_AUTHORITY_REQUIRED',
    technicalActivationEvidenceReady, methodSpecificReady, technicalGates:Object.freeze({...technicalGates}),
    failedTechnicalGates:Object.freeze(failedTechnicalGates), productionPolicyAuthorityApproved,
    remainingMethodSpecificBlockers:Object.freeze(methodSpecificReady ? [] : ['PRODUCTION_POLICIES_NOT_APPROVED']),
    evidenceReferences:Object.freeze([...evidenceReferences]), readyForW26:methodSpecificReady,
    globalEligibilityGate:methodSpecificReady ? 'MPA-W26_REQUIRED' : 'MPA-W26_NOT_YET_REACHABLE_AST_POLICY_BLOCKED',
    productionEligible:false, productionEligibilityDecisionCreated:false, productionExecutionAllowed:false, productionExecutionGate:'MPA-W27_REQUIRED',
    professionalEligible:false, professionalReleaseAllowed:false, publicEligible:false, frozenMrOrImrRewritten:false, legacyAstFreezeRewritten:false
  });
}
export function assertAstProductionExecutionBlocked(executionMode) {
  if (executionMode === 'production') throw new Error('MPA_W27_PRODUCTION_EXECUTION_GATE_REQUIRED');
  if (executionMode !== 'validation') throw new TypeError('AST W22 supports validation evidence only before MPA-W27.');
  return true;
}
