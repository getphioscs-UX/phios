import { assertRecordDigest, stableDigest } from './rne-navigation-foundation-v1.mjs';

const FORBIDDEN_FIELDS = new Set([
  'rawData', 'rawReality', 'rawReadout', 'payload', 'command', 'recommendedDirection',
  'selectedOption', 'automaticSelection', 'prediction', 'professionalJudgment',
  'probability', 'severityScore', 'forecast', 'guaranteedOutcome'
]);

function requireObject(value, code) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(code);
  return value;
}

function requireText(value, code) {
  if (typeof value !== 'string' || value.trim().length === 0) throw new Error(code);
  return value;
}

function requireDigest(value, code) {
  requireText(value, code);
  if (!/^[a-f0-9]{64}$/.test(value)) throw new Error(code);
  return value;
}

function requireSemver(value, code) {
  requireText(value, code);
  if (!/^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/.test(value)) throw new Error(code);
  return value;
}

function uniqueTextArray(value, code, { min = 0 } = {}) {
  if (!Array.isArray(value) || value.length < min) throw new Error(code);
  const out = value.map(item => requireText(item, code));
  if (new Set(out).size !== out.length) throw new Error(`${code}_DUPLICATE`);
  return out;
}

function assertNoForbiddenFields(value, prefix = 'RNE_FORBIDDEN_FIELD') {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) assertNoForbiddenFields(item, prefix);
    return;
  }
  for (const [key, nested] of Object.entries(value)) {
    if (FORBIDDEN_FIELDS.has(key)) throw new Error(`${prefix}:${key}`);
    assertNoForbiddenFields(nested, prefix);
  }
}

function reference(value, code) {
  const ref = requireObject(value, code);
  return {
    code: requireText(ref.code, `${code}_CODE`),
    version: requireSemver(ref.version, `${code}_VERSION`),
    digest: requireDigest(ref.digest, `${code}_DIGEST`)
  };
}

function typedReference(value, code, expectedDataType, expectedAuthority) {
  const ref = {
    ...reference(value, code),
    dataType: requireText(value.dataType, `${code}_DATA_TYPE`),
    authorityRuntime: requireText(value.authorityRuntime, `${code}_AUTHORITY_RUNTIME`)
  };
  if (ref.dataType !== expectedDataType) throw new Error(`${code}_DATA_TYPE_INVALID`);
  if (ref.authorityRuntime !== expectedAuthority) throw new Error(`${code}_AUTHORITY_INVALID`);
  return ref;
}

function outputReference(code, version, digest) {
  return { code, version, digest };
}

function redigest(record, digestField) {
  const copy = structuredClone(record);
  delete copy[digestField];
  record[digestField] = stableDigest(copy);
  return record;
}

export function buildJrNavigationIntelligenceHandoff(
  currentPosition,
  target,
  optionSet,
  riskContext,
  decisionSupport,
  scenarioSet,
  routeSet,
  request,
  contract
) {
  assertNoForbiddenFields(request);
  if (contract?.work !== 'RNE-W10') throw new Error('RNE_JR_INTEGRATION_CONTRACT_INVALID');
  for (const [record, digestField] of [
    [currentPosition, 'positionDigest'], [target, 'targetDigest'], [optionSet, 'optionSetDigest'],
    [riskContext, 'riskContextDigest'], [decisionSupport, 'decisionSupportDigest'],
    [scenarioSet, 'scenarioSetDigest'], [routeSet, 'routeSetDigest']
  ]) assertRecordDigest(record, digestField);

  const purpose = requireText(request.dataPurpose, 'RNE_JR_DATA_PURPOSE_REQUIRED');
  if (!contract.allowedPurposes.includes(purpose)) throw new Error(`RNE_JR_DATA_PURPOSE_INVALID:${purpose}`);
  const consentReferences = uniqueTextArray(request.consentReferences, 'RNE_JR_CONSENT_REFERENCES_INVALID', { min: 1 });
  const governanceReferences = uniqueTextArray(request.governanceReferences, 'RNE_JR_GOVERNANCE_REFERENCES_INVALID', { min: 1 });
  const canonicalReadoutReference = typedReference(
    request.canonicalReadoutReference,
    'RNE_CANONICAL_READOUT_REFERENCE',
    'REALITY_READOUT_RECORD',
    'RRE'
  );

  const knownRiskReferences = riskContext.knownRisks.map(item => item.riskReference);
  const tradeoffReferences = decisionSupport.optionDecisionSupport.map(item => `${decisionSupport.decisionSupportCode}:${item.optionCode}:TRADEOFF`);
  const reversibilityReferences = decisionSupport.optionDecisionSupport.map(item => `${decisionSupport.decisionSupportCode}:${item.optionCode}:REVERSIBILITY`);

  const record = {
    schemaVersion: 'PHI-OS-RNE-JR-NAVIGATION-INTELLIGENCE-HANDOFF-v1.0.0',
    handoffCode: requireText(request.handoffCode, 'RNE_JR_HANDOFF_CODE_REQUIRED'),
    handoffVersion: '1.0.0',
    objectType: 'JR_NAVIGATION_INTELLIGENCE_HANDOFF',
    dataType: 'NAVIGATION_RECORD',
    journeyReference: requireText(request.journeyReference, 'RNE_JOURNEY_REFERENCE_REQUIRED'),
    currentPositionReference: outputReference(currentPosition.positionCode, currentPosition.positionVersion, currentPosition.positionDigest),
    targetReference: outputReference(target.targetCode, target.targetVersion, target.targetDigest),
    canonicalReadoutReference,
    responseReferences: {
      navigationOptionReferences: optionSet.options.map(item => item.optionCode),
      tradeoffReferences,
      riskReferences: knownRiskReferences,
      reversibilityReferences,
      scenarioReferences: scenarioSet.scenarios.map(item => item.scenarioCode),
      routeCandidateReferences: routeSet.routeCandidates.map(item => item.routeCode)
    },
    dataPurpose: purpose,
    consentReferences,
    governanceReferences,
    integrationState: 'REFERENCE_ONLY_ACTIVE',
    authorityBoundary: {
      workflowAuthority: 'JR',
      navigationIntelligenceAuthority: 'RNE',
      readoutAuthority: 'RRE',
      dataGovernanceAuthority: 'RDG',
      professionalJudgmentAuthority: 'PR'
    },
    journeyStageMutationCreated: false,
    journeyWorkflowImplementedByRne: false,
    navigationReasoningImplementedByJr: false,
    professionalJudgmentCreated: false,
    executionCreated: false,
    rawReadoutCopied: false,
    productionExecutionActivated: false
  };
  return redigest(record, 'handoffDigest');
}

export function buildProfessionalReviewGate(riskContext, routeSet, request, triggerRegistry, contract) {
  assertNoForbiddenFields(request);
  if (contract?.work !== 'RNE-W11') throw new Error('RNE_PROFESSIONAL_BOUNDARY_CONTRACT_INVALID');
  assertRecordDigest(riskContext, 'riskContextDigest');
  assertRecordDigest(routeSet, 'routeSetDigest');

  const knownRisks = new Set(riskContext.knownRisks.map(item => item.riskReference));
  const allowedTriggers = new Set(triggerRegistry.triggerClasses.map(item => item.triggerClass));
  const seen = new Set();
  const triggers = (request.professionalReviewTriggers ?? []).map(raw => {
    const trigger = requireObject(raw, 'RNE_PROFESSIONAL_TRIGGER_INVALID');
    const riskReference = requireText(trigger.riskReference, 'RNE_PROFESSIONAL_TRIGGER_RISK_REQUIRED');
    if (!knownRisks.has(riskReference)) throw new Error(`RNE_PROFESSIONAL_TRIGGER_RISK_UNKNOWN:${riskReference}`);
    if (seen.has(riskReference)) throw new Error(`RNE_PROFESSIONAL_TRIGGER_DUPLICATE:${riskReference}`);
    seen.add(riskReference);
    const triggerClass = requireText(trigger.triggerClass, 'RNE_PROFESSIONAL_TRIGGER_CLASS_REQUIRED');
    if (!allowedTriggers.has(triggerClass)) throw new Error(`RNE_PROFESSIONAL_TRIGGER_CLASS_INVALID:${triggerClass}`);
    return {
      riskReference,
      authorityReference: requireText(trigger.authorityReference, 'RNE_PROFESSIONAL_TRIGGER_AUTHORITY_REQUIRED'),
      triggerClass
    };
  });

  const required = triggers.length > 0;
  const record = {
    schemaVersion: 'PHI-OS-RNE-PROFESSIONAL-REVIEW-GATE-v1.0.0',
    gateCode: requireText(request.gateCode, 'RNE_PROFESSIONAL_GATE_CODE_REQUIRED'),
    gateVersion: '1.0.0',
    objectType: 'PROFESSIONAL_REVIEW_GATE',
    dataType: 'NAVIGATION_RECORD',
    riskContextReference: outputReference(riskContext.riskContextCode, riskContext.riskContextVersion, riskContext.riskContextDigest),
    routeSetReference: outputReference(routeSet.routeSetCode, routeSet.routeSetVersion, routeSet.routeSetDigest),
    professionalReviewTriggers: triggers,
    professionalReviewState: required ? 'REQUIRED_BY_GOVERNED_TRIGGER' : 'NOT_REQUIRED_BY_GOVERNED_TRIGGER',
    professionalHandoffReference: requireText(request.professionalHandoffReference, 'RNE_PROFESSIONAL_HANDOFF_REFERENCE_REQUIRED'),
    pwsRequiredGateCount: contract.pwsRequiredGateCount,
    authorityBoundary: {
      triggerFactAuthority: 'UPSTREAM_GOVERNED_RISK_AUTHORITY',
      reviewRequirementMappingAuthority: 'RNE',
      professionalJudgmentAuthority: 'PR',
      assignmentAuthority: 'PWS_ASSIGNMENT_RUNTIME'
    },
    professionalSelectionCreated: false,
    professionalResponsibilityCreated: false,
    assignmentCreated: false,
    professionalJudgmentCreated: false,
    routeSelectionCreated: false,
    navigationExecutionCreated: false,
    continuationWithoutRequiredReviewAllowed: !required,
    productionExecutionActivated: false
  };
  return redigest(record, 'gateDigest');
}

export function buildNavigationOutcomeFeedback(routeSet, request, contract) {
  assertNoForbiddenFields(request);
  if (contract?.work !== 'RNE-W12') throw new Error('RNE_OUTCOME_FEEDBACK_CONTRACT_INVALID');
  assertRecordDigest(routeSet, 'routeSetDigest');

  const actionReference = typedReference(request.actionReference, 'RNE_ACTION_REFERENCE', 'RUNTIME_STATE_RECORD', 'RMO');
  const outcomeReference = typedReference(request.outcomeReference, 'RNE_OUTCOME_REFERENCE', 'RUNTIME_STATE_RECORD', 'RMO');
  const realityDiffReference = typedReference(request.realityDiffReference, 'RNE_REALITY_DIFF_REFERENCE', 'RUNTIME_STATE_RECORD', 'RMO');
  const unknownReferences = uniqueTextArray(request.unknownReferences ?? [], 'RNE_FEEDBACK_UNKNOWN_REFERENCES_INVALID');
  const governanceReferences = uniqueTextArray(request.governanceReferences, 'RNE_FEEDBACK_GOVERNANCE_REFERENCES_INVALID', { min: 1 });

  const record = {
    schemaVersion: 'PHI-OS-RNE-NAVIGATION-OUTCOME-FEEDBACK-v1.0.0',
    feedbackCode: requireText(request.feedbackCode, 'RNE_FEEDBACK_CODE_REQUIRED'),
    feedbackVersion: '1.0.0',
    objectType: 'NAVIGATION_OUTCOME_FEEDBACK',
    dataType: 'NAVIGATION_RECORD',
    routeSetReference: outputReference(routeSet.routeSetCode, routeSet.routeSetVersion, routeSet.routeSetDigest),
    actionReference,
    outcomeReference,
    realityDiffReference,
    unknownReferences,
    governanceReferences,
    feedbackState: 'REFERENCES_BOUND_FOR_REPOSITIONING',
    nextNavigationCapability: 'CURRENT_POSITION_REASSESSMENT_AVAILABLE',
    authorityBoundary: {
      actionOutcomeDiffAuthority: 'RMO',
      evidenceEvaluationAuthority: 'RRE',
      navigationFeedbackBindingAuthority: 'RNE',
      effectivenessAuthority: 'VAL',
      professionalJudgmentAuthority: 'PR'
    },
    causalityClaimed: false,
    effectivenessDetermined: false,
    targetChangedAutomatically: false,
    optionSelectedAutomatically: false,
    routeSelectedAutomatically: false,
    actionExecutedByRne: false,
    outcomeCreatedByRne: false,
    realityDiffCreatedByRne: false,
    productionExecutionActivated: false
  };
  return redigest(record, 'feedbackDigest');
}

export function buildNavigationValidationRequest(
  jrHandoff,
  professionalGate,
  feedback,
  request,
  validationRegistry,
  contract
) {
  assertNoForbiddenFields(request);
  if (contract?.work !== 'RNE-W13') throw new Error('RNE_VALIDATION_CONTRACT_INVALID');
  assertRecordDigest(jrHandoff, 'handoffDigest');
  assertRecordDigest(professionalGate, 'gateDigest');
  assertRecordDigest(feedback, 'feedbackDigest');

  const requestedChecks = uniqueTextArray(request.requestedChecks, 'RNE_VALIDATION_CHECKS_INVALID', { min: 1 });
  const allowed = new Set(validationRegistry.validationChecks.map(item => item.checkCode));
  for (const check of requestedChecks) if (!allowed.has(check)) throw new Error(`RNE_VALIDATION_CHECK_INVALID:${check}`);
  const governanceReferences = uniqueTextArray(request.governanceReferences, 'RNE_VALIDATION_GOVERNANCE_REFERENCES_INVALID', { min: 1 });

  const record = {
    schemaVersion: 'PHI-OS-RNE-NAVIGATION-VALIDATION-REQUEST-v1.0.0',
    validationRequestCode: requireText(request.validationRequestCode, 'RNE_VALIDATION_REQUEST_CODE_REQUIRED'),
    validationRequestVersion: '1.0.0',
    objectType: 'NAVIGATION_EFFECTIVENESS_VALIDATION_REQUEST',
    dataType: 'NAVIGATION_RECORD',
    validatorRuntime: 'VAL',
    validationScope: 'NAVIGATION_EFFECTIVENESS',
    jrHandoffReference: outputReference(jrHandoff.handoffCode, jrHandoff.handoffVersion, jrHandoff.handoffDigest),
    professionalGateReference: outputReference(professionalGate.gateCode, professionalGate.gateVersion, professionalGate.gateDigest),
    feedbackReference: outputReference(feedback.feedbackCode, feedback.feedbackVersion, feedback.feedbackDigest),
    requestedChecks,
    governanceReferences,
    validationStatus: 'PENDING_VAL_EXECUTION',
    expectedResultDataType: 'SYSTEM_OPERATION_RECORD',
    authorityBoundary: {
      validationAuthority: 'VAL',
      navigationAuthority: 'RNE',
      realityStateAuthority: 'RMO',
      evidenceAuthority: 'RRE',
      professionalJudgmentAuthority: 'PR'
    },
    rneSelfValidationPerformed: false,
    effectivenessDetermined: false,
    causalityClaimed: false,
    successDeclared: false,
    productionExecutionActivated: false
  };
  return redigest(record, 'validationRequestDigest');
}
