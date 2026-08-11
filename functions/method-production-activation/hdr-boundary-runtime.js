export const MPA_HDR_BOUNDARY_DECISION_SCHEMA_VERSION = 'PHI-OS-MPA-HDR-BOUNDARY-DECISION-v1.0.0';

export function evaluateHdrRestrictedBoundary({ gates = {}, publicPresentation = {} } = {}) {
  const boundaryEstablished = Boolean(publicPresentation.controlledLabelAllowed) && publicPresentation.restrictedInternalNameAllowed === false;
  return Object.freeze({
    schemaVersion: MPA_HDR_BOUNDARY_DECISION_SCHEMA_VERSION,
    work: 'MPA-W24', methodCode: 'HUMAN_DESIGN', pluginCode: 'HDR', methodVersion: '1.0.0',
    decision: 'RESTRICTED_BOUNDARY_ESTABLISHED_NOT_ELIGIBLE_FOR_W26',
    boundaryEstablished, methodSpecificReady: false, readyForW26: false, stateMustRemain: 'BLOCKED', gates: Object.freeze({...gates}),
    globalEligibilityGate: 'MPA-W26_EXCLUDED_WHILE_HDR_STATE_BLOCKED', productionEligible: false, productionEligibilityDecisionCreated: false,
    productionExecutionAllowed: false, productionExecutionGate: 'MPA-W27_NOT_REACHABLE_WHILE_HDR_BLOCKED',
    professionalEligible: false, professionalReleaseAllowed: false, publicMethodExecutionAllowed: false, publicPresentation: Object.freeze({...publicPresentation})
  });
}

export function assertHdrRestrictedExecutionBlocked(mode = 'production') {
  if (mode === 'validation') return true;
  throw new Error('MPA_HDR_RESTRICTED_METHOD_EXECUTION_BLOCKED');
}

export function assertPublicHdrVocabulary({ text, restrictedTerms = ['Human Design','人类图'] } = {}) {
  const source = String(text ?? '');
  for (const term of restrictedTerms) {
    if (source.includes(term)) throw new Error(`MPA_HDR_RESTRICTED_PUBLIC_TERM:${term}`);
  }
  return true;
}
