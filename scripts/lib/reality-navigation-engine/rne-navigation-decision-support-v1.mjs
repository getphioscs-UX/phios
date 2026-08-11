import {
  assertRecordDigest,
  stableDigest
} from './rne-navigation-foundation-v1.mjs';

const FORBIDDEN_FIELDS = new Set([
  'rawData',
  'rawReality',
  'rawReadout',
  'payload',
  'command',
  'recommendedDirection',
  'selectedOption',
  'automaticSelection',
  'prediction',
  'professionalJudgment',
  'probability',
  'severityScore',
  'forecast',
  'guaranteedOutcome'
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
  if (!/^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/.test(value)) {
    throw new Error(code);
  }
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

function outputReference(code, version, digest) {
  return { code, version, digest };
}

function redigest(record, digestField) {
  const copy = structuredClone(record);
  delete copy[digestField];
  record[digestField] = stableDigest(copy);
  return record;
}

function unique(values) {
  return [...new Set(values)];
}

function mapBy(items, key) {
  return new Map(items.map(item => [item[key], item]));
}

function assertOptionAlignment(optionSet, items, key = 'optionCode') {
  const expected = optionSet.options.map(option => option.optionCode);
  const actual = items.map(item => item[key]);
  if (expected.length !== actual.length || expected.some((code, index) => code !== actual[index])) {
    throw new Error('RNE_OPTION_ALIGNMENT_INVALID');
  }
}

function dependencyClosure(constraintGraph, startingReferences) {
  const byRef = new Map(
    constraintGraph.nodes.map(node => [node.authorityConstraintReference, node])
  );
  const out = new Set();
  const visited = new Set();

  function visit(ref) {
    if (visited.has(ref)) return;
    visited.add(ref);
    const node = byRef.get(ref);
    if (!node) return;
    if (node.navigationRole === 'DEPENDENCY') out.add(ref);
    for (const dep of node.dependsOnConstraintReferences) {
      out.add(dep);
      visit(dep);
    }
  }

  for (const ref of startingReferences) visit(ref);
  return [...out];
}

export function buildNavigationRiskContext(
  currentPosition,
  constraintGraph,
  optionSet,
  request,
  contract
) {
  assertNoForbiddenFields(request);
  requireObject(request, 'RNE_RISK_CONTEXT_REQUEST_INVALID');
  assertRecordDigest(currentPosition, 'positionDigest');
  assertRecordDigest(constraintGraph, 'graphDigest');
  assertRecordDigest(optionSet, 'optionSetDigest');
  if (contract?.work !== 'RNE-W5') throw new Error('RNE_RISK_CONTEXT_CONTRACT_INVALID');

  const graphRefs = new Set(constraintGraph.nodes.map(node => node.authorityConstraintReference));
  const optionCodes = new Set(optionSet.options.map(option => option.optionCode));
  const seenRisks = new Set();
  const knownRisks = (request.knownRisks ?? []).map(raw => {
    const risk = requireObject(raw, 'RNE_KNOWN_RISK_INVALID');
    const riskReference = requireText(risk.riskReference, 'RNE_KNOWN_RISK_REFERENCE_REQUIRED');
    if (seenRisks.has(riskReference)) throw new Error(`RNE_KNOWN_RISK_DUPLICATE:${riskReference}`);
    seenRisks.add(riskReference);
    const authorityReference = requireText(
      risk.authorityReference,
      'RNE_KNOWN_RISK_AUTHORITY_REFERENCE_REQUIRED'
    );
    const constraintReference = requireText(
      risk.constraintReference,
      'RNE_KNOWN_RISK_CONSTRAINT_REFERENCE_REQUIRED'
    );
    if (!graphRefs.has(constraintReference)) {
      throw new Error(`RNE_KNOWN_RISK_CONSTRAINT_NOT_IN_GRAPH:${constraintReference}`);
    }
    const appliesToOptionCodes = optionSet.options
      .filter(option => option.constraintReferences.includes(constraintReference))
      .map(option => option.optionCode);
    if (!appliesToOptionCodes.length) {
      throw new Error(`RNE_KNOWN_RISK_UNBOUNDED:${riskReference}`);
    }
    for (const code of appliesToOptionCodes) {
      if (!optionCodes.has(code)) throw new Error(`RNE_KNOWN_RISK_OPTION_UNKNOWN:${code}`);
    }
    return { riskReference, authorityReference, constraintReference, appliesToOptionCodes };
  });

  const unknownReferences = unique([
    ...currentPosition.unknownReferences,
    ...constraintGraph.unknownConstraintReferences
  ]);

  const dependencies = constraintGraph.nodes
    .filter(node => node.navigationRole === 'DEPENDENCY')
    .map(node => ({
      constraintReference: node.authorityConstraintReference,
      dependsOnConstraintReferences: [...node.dependsOnConstraintReferences]
    }));

  const unknownGraphRefs = new Set(constraintGraph.unknownConstraintReferences);
  const optionRiskContexts = optionSet.options.map(option => {
    const knownRiskReferences = knownRisks
      .filter(risk => risk.appliesToOptionCodes.includes(option.optionCode))
      .map(risk => risk.riskReference);
    const optionUnknowns = unique([
      ...currentPosition.unknownReferences,
      ...option.constraintReferences.filter(ref => unknownGraphRefs.has(ref))
    ]);
    const dependencyReferences = dependencyClosure(constraintGraph, option.constraintReferences);
    return {
      optionCode: option.optionCode,
      knownRiskReferences,
      unknownReferences: optionUnknowns,
      dependencyReferences,
      riskState: 'DESCRIBED_NOT_SCORED'
    };
  });

  const record = {
    schemaVersion: 'PHI-OS-RNE-NAVIGATION-RISK-CONTEXT-v1.0.0',
    riskContextCode: requireText(request.riskContextCode, 'RNE_RISK_CONTEXT_CODE_REQUIRED'),
    riskContextVersion: '1.0.0',
    objectType: 'NAVIGATION_RISK_CONTEXT',
    dataType: 'NAVIGATION_RECORD',
    optionSetReference: outputReference(
      optionSet.optionSetCode,
      optionSet.optionSetVersion,
      optionSet.optionSetDigest
    ),
    constraintGraphReference: outputReference(
      constraintGraph.graphCode,
      constraintGraph.graphVersion,
      constraintGraph.graphDigest
    ),
    knownRisks,
    unknownReferences,
    dependencies,
    optionRiskContexts,
    authorityBoundary: {
      riskFactAuthority: 'UPSTREAM_GOVERNED_SOURCE',
      unknownAuthority: 'RMO',
      dependencyAuthority: 'RMO_CONSTRAINT_REFERENCE',
      navigationRiskDescriptionAuthority: 'RNE',
      professionalJudgmentAuthority: 'PR'
    },
    riskProbabilityCreated: false,
    riskSeverityScoreCreated: false,
    predictionCreated: false,
    recommendationCreated: false,
    commandCreated: false,
    selectionMade: false,
    professionalJudgmentCreated: false,
    validationOnly: true,
    persistentStoreWriteAllowed: false
  };
  return redigest(record, 'riskContextDigest');
}

export function buildOptionRecoverabilityAssessment(
  optionSet,
  riskContext,
  request,
  rreRecoveryRegistry,
  recoverabilityRegistry,
  contract
) {
  assertNoForbiddenFields(request);
  requireObject(request, 'RNE_RECOVERABILITY_REQUEST_INVALID');
  assertRecordDigest(optionSet, 'optionSetDigest');
  assertRecordDigest(riskContext, 'riskContextDigest');
  if (contract?.work !== 'RNE-W6') throw new Error('RNE_RECOVERABILITY_CONTRACT_INVALID');

  const recoveryView = requireObject(request.recoveryViewReference, 'RNE_RECOVERY_VIEW_REFERENCE_INVALID');
  const recoveryViewReference = {
    ...reference(recoveryView, 'RNE_RECOVERY_VIEW_REFERENCE_INVALID'),
    mode: requireText(recoveryView.mode, 'RNE_RECOVERY_VIEW_MODE_REQUIRED')
  };
  if (recoveryViewReference.mode !== contract.rules.recoveryViewReferenceMode) {
    throw new Error('RNE_RECOVERY_VIEW_MODE_INVALID');
  }

  const state = requireObject(request.recoveryState, 'RNE_RECOVERY_STATE_REQUIRED');
  const capacityState = requireText(state.capacityState, 'RNE_RECOVERY_CAPACITY_STATE_REQUIRED');
  const windowState = requireText(state.windowState, 'RNE_RECOVERY_WINDOW_STATE_REQUIRED');
  const uncertaintyState = requireText(state.uncertaintyState, 'RNE_RECOVERY_UNCERTAINTY_STATE_REQUIRED');
  if (!rreRecoveryRegistry.capacityStates.includes(capacityState)) {
    throw new Error(`RNE_RECOVERY_CAPACITY_STATE_INVALID:${capacityState}`);
  }
  if (!rreRecoveryRegistry.windowStates.includes(windowState)) {
    throw new Error(`RNE_RECOVERY_WINDOW_STATE_INVALID:${windowState}`);
  }
  if (!rreRecoveryRegistry.uncertaintyClasses.includes(uncertaintyState)) {
    throw new Error(`RNE_RECOVERY_UNCERTAINTY_STATE_INVALID:${uncertaintyState}`);
  }

  const allowedClasses = new Set(
    recoverabilityRegistry.classes.map(entry => entry.recoverabilityClass)
  );
  const noStateBoundaryModes = new Set([
    'NO_STATE_CHANGE_REQUIRED',
    'CLARIFICATION_ONLY',
    'DEPENDENCY_VERIFICATION_ONLY'
  ]);

  function classify(option) {
    if (noStateBoundaryModes.has(option.boundaryMode)) return 'NO_STATE_CHANGE_REQUIRED';
    if ([capacityState, windowState, uncertaintyState].includes('UNKNOWN')) return 'RECOVERY_UNKNOWN';
    if (capacityState === 'NOT_OBSERVED' || windowState === 'NOT_OBSERVED') {
      return 'RECOVERY_NOT_OBSERVED';
    }
    if (capacityState === 'AVAILABLE' && windowState === 'OPEN' && uncertaintyState === 'BOUNDED') {
      return 'RECOVERY_WINDOW_OPEN';
    }
    return 'RECOVERY_WINDOW_CONDITIONAL';
  }

  const riskByOption = mapBy(riskContext.optionRiskContexts, 'optionCode');
  const optionAssessments = optionSet.options.map(option => {
    const recoverabilityClass = classify(option);
    if (!allowedClasses.has(recoverabilityClass)) {
      throw new Error(`RNE_RECOVERABILITY_CLASS_UNREGISTERED:${recoverabilityClass}`);
    }
    const risk = riskByOption.get(option.optionCode);
    if (!risk) throw new Error(`RNE_RECOVERABILITY_RISK_CONTEXT_MISSING:${option.optionCode}`);
    return {
      optionCode: option.optionCode,
      optionClass: option.optionClass,
      boundaryMode: option.boundaryMode,
      recoverabilityClass,
      recoveryWindowState: windowState,
      recoveryCapacityState: capacityState,
      uncertaintyState,
      knownRiskReferences: [...risk.knownRiskReferences],
      unknownReferences: [...risk.unknownReferences],
      dependencyReferences: [...risk.dependencyReferences],
      guaranteedRecoveryCreated: false,
      treatmentAdviceCreated: false,
      medicalDiagnosisCreated: false
    };
  });
  assertOptionAlignment(optionSet, optionAssessments);

  const record = {
    schemaVersion: 'PHI-OS-RNE-OPTION-RECOVERABILITY-ASSESSMENT-v1.0.0',
    recoverabilityAssessmentCode: requireText(
      request.recoverabilityAssessmentCode,
      'RNE_RECOVERABILITY_ASSESSMENT_CODE_REQUIRED'
    ),
    recoverabilityAssessmentVersion: '1.0.0',
    objectType: 'OPTION_RECOVERABILITY_ASSESSMENT',
    dataType: 'NAVIGATION_RECORD',
    optionSetReference: outputReference(
      optionSet.optionSetCode,
      optionSet.optionSetVersion,
      optionSet.optionSetDigest
    ),
    riskContextReference: outputReference(
      riskContext.riskContextCode,
      riskContext.riskContextVersion,
      riskContext.riskContextDigest
    ),
    recoveryViewReference,
    recoveryState: { capacityState, windowState, uncertaintyState },
    optionAssessments,
    authorityBoundary: {
      recoveryReadingAuthority: 'RRE',
      optionRecoverabilityMappingAuthority: 'RNE',
      professionalJudgmentAuthority: 'PR'
    },
    selectionMade: false,
    recommendationCreated: false,
    guaranteedRecoveryCreated: false,
    treatmentAdviceCreated: false,
    medicalDiagnosisCreated: false,
    professionalJudgmentCreated: false,
    validationOnly: true,
    persistentStoreWriteAllowed: false
  };
  return redigest(record, 'recoverabilityAssessmentDigest');
}

function reversibilityMode(recoverabilityClass) {
  switch (recoverabilityClass) {
    case 'NO_STATE_CHANGE_REQUIRED': return 'NO_STATE_CHANGE_REQUIRED';
    case 'RECOVERY_WINDOW_OPEN': return 'REVERSIBILITY_SUPPORTED_BY_OPEN_RECOVERY_WINDOW';
    case 'RECOVERY_WINDOW_CONDITIONAL': return 'REVERSIBILITY_CONDITIONAL';
    case 'RECOVERY_NOT_OBSERVED': return 'REVERSIBILITY_NOT_ESTABLISHED';
    case 'RECOVERY_UNKNOWN': return 'REVERSIBILITY_UNKNOWN';
    default: throw new Error(`RNE_REVERSIBILITY_CLASS_INVALID:${recoverabilityClass}`);
  }
}

export function buildDecisionSupportSet(
  optionSet,
  riskContext,
  recoverabilityAssessment,
  request,
  patternRegistry,
  contract
) {
  assertNoForbiddenFields(request);
  requireObject(request, 'RNE_DECISION_SUPPORT_REQUEST_INVALID');
  assertRecordDigest(optionSet, 'optionSetDigest');
  assertRecordDigest(riskContext, 'riskContextDigest');
  assertRecordDigest(recoverabilityAssessment, 'recoverabilityAssessmentDigest');
  if (contract?.work !== 'RNE-W7') throw new Error('RNE_DECISION_SUPPORT_CONTRACT_INVALID');

  const patternByClass = mapBy(patternRegistry.patterns, 'optionClass');
  const riskByOption = mapBy(riskContext.optionRiskContexts, 'optionCode');
  const recoveryByOption = mapBy(recoverabilityAssessment.optionAssessments, 'optionCode');

  const optionDecisionSupport = optionSet.options.map(option => {
    const pattern = patternByClass.get(option.optionClass);
    if (!pattern) throw new Error(`RNE_DECISION_PATTERN_MISSING:${option.optionClass}`);
    const risk = riskByOption.get(option.optionCode);
    const recovery = recoveryByOption.get(option.optionCode);
    if (!risk || !recovery) throw new Error(`RNE_DECISION_SUPPORT_INPUT_MISSING:${option.optionCode}`);
    return {
      optionCode: option.optionCode,
      optionClass: option.optionClass,
      tradeoff: pattern.tradeoffCode,
      dependencyReferences: [...risk.dependencyReferences],
      reversibility: {
        mode: reversibilityMode(recovery.recoverabilityClass),
        recoverabilityClass: recovery.recoverabilityClass
      },
      observationPoint: pattern.observationPoint,
      knownRiskReferences: [...risk.knownRiskReferences],
      unknownReferences: [...risk.unknownReferences],
      selectionState: 'AVAILABLE_NOT_SELECTED'
    };
  });
  assertOptionAlignment(optionSet, optionDecisionSupport);

  const record = {
    schemaVersion: 'PHI-OS-RNE-DECISION-SUPPORT-SET-v1.0.0',
    decisionSupportCode: requireText(request.decisionSupportCode, 'RNE_DECISION_SUPPORT_CODE_REQUIRED'),
    decisionSupportVersion: '1.0.0',
    objectType: 'DECISION_SUPPORT_SET',
    dataType: 'NAVIGATION_RECORD',
    optionSetReference: outputReference(
      optionSet.optionSetCode,
      optionSet.optionSetVersion,
      optionSet.optionSetDigest
    ),
    riskContextReference: outputReference(
      riskContext.riskContextCode,
      riskContext.riskContextVersion,
      riskContext.riskContextDigest
    ),
    recoverabilityAssessmentReference: outputReference(
      recoverabilityAssessment.recoverabilityAssessmentCode,
      recoverabilityAssessment.recoverabilityAssessmentVersion,
      recoverabilityAssessment.recoverabilityAssessmentDigest
    ),
    optionDecisionSupport,
    decisionAuthority: 'HUMAN_OR_AUTHORIZED_PROFESSIONAL',
    rankingCreated: false,
    selectionMade: false,
    recommendedDirectionCreated: false,
    commandCreated: false,
    executionCreated: false,
    professionalJudgmentCreated: false,
    validationOnly: true,
    persistentStoreWriteAllowed: false
  };
  return redigest(record, 'decisionSupportDigest');
}

export function buildScenarioSimulationSet(
  optionSet,
  decisionSupport,
  recoverabilityAssessment,
  request,
  scenarioRegistry,
  contract
) {
  assertNoForbiddenFields(request);
  requireObject(request, 'RNE_SCENARIO_REQUEST_INVALID');
  assertRecordDigest(optionSet, 'optionSetDigest');
  assertRecordDigest(decisionSupport, 'decisionSupportDigest');
  assertRecordDigest(recoverabilityAssessment, 'recoverabilityAssessmentDigest');
  if (contract?.work !== 'RNE-W8') throw new Error('RNE_SCENARIO_CONTRACT_INVALID');

  const mode = contract.simulationMode;
  const modeEntry = scenarioRegistry.modes.find(entry => entry.mode === mode);
  if (!modeEntry || modeEntry.truthStatus !== 'SIMULATION_ONLY') {
    throw new Error('RNE_SCENARIO_MODE_UNSAFE');
  }

  const supportByOption = mapBy(decisionSupport.optionDecisionSupport, 'optionCode');
  const recoveryByOption = mapBy(recoverabilityAssessment.optionAssessments, 'optionCode');
  const scenarioSetCode = requireText(request.scenarioSetCode, 'RNE_SCENARIO_SET_CODE_REQUIRED');

  const scenarios = optionSet.options.map(option => {
    const support = supportByOption.get(option.optionCode);
    const recovery = recoveryByOption.get(option.optionCode);
    if (!support || !recovery) throw new Error(`RNE_SCENARIO_INPUT_MISSING:${option.optionCode}`);
    return {
      scenarioCode: `${scenarioSetCode}-${option.optionClass}`,
      optionCode: option.optionCode,
      optionClass: option.optionClass,
      simulationMode: mode,
      assumptionMode: 'IF_OPTION_WERE_SELECTED_BY_AUTHORIZED_DECIDER',
      tradeoff: support.tradeoff,
      dependencyReferences: [...support.dependencyReferences],
      knownRiskReferences: [...support.knownRiskReferences],
      unknownReferences: [...support.unknownReferences],
      recoverabilityClass: recovery.recoverabilityClass,
      observationPoint: support.observationPoint,
      truthStatus: 'SIMULATION_ONLY',
      probabilityCreated: false,
      forecastCreated: false,
      causalityClaimed: false,
      outcomeClaimed: false,
      guaranteedOutcomeCreated: false,
      selectionMade: false,
      executionCreated: false
    };
  });
  assertOptionAlignment(optionSet, scenarios);

  const record = {
    schemaVersion: 'PHI-OS-RNE-SCENARIO-SIMULATION-SET-v1.0.0',
    scenarioSetCode,
    scenarioSetVersion: '1.0.0',
    objectType: 'SCENARIO_SIMULATION_SET',
    dataType: 'NAVIGATION_RECORD',
    optionSetReference: outputReference(
      optionSet.optionSetCode,
      optionSet.optionSetVersion,
      optionSet.optionSetDigest
    ),
    decisionSupportReference: outputReference(
      decisionSupport.decisionSupportCode,
      decisionSupport.decisionSupportVersion,
      decisionSupport.decisionSupportDigest
    ),
    recoverabilityAssessmentReference: outputReference(
      recoverabilityAssessment.recoverabilityAssessmentCode,
      recoverabilityAssessment.recoverabilityAssessmentVersion,
      recoverabilityAssessment.recoverabilityAssessmentDigest
    ),
    simulationMode: mode,
    scenarios,
    simulationIsPrediction: false,
    simulationIsRealityTruth: false,
    probabilityCreated: false,
    forecastCreated: false,
    causalityClaimed: false,
    guaranteedOutcomeCreated: false,
    selectionMade: false,
    executionCreated: false,
    professionalJudgmentCreated: false,
    validationOnly: true,
    persistentStoreWriteAllowed: false
  };
  return redigest(record, 'scenarioSetDigest');
}

export function buildRouteCandidateSet(
  currentPosition,
  targetState,
  optionSet,
  decisionSupport,
  scenarioSet,
  request,
  routeStageRegistry,
  contract
) {
  assertNoForbiddenFields(request);
  requireObject(request, 'RNE_ROUTE_REQUEST_INVALID');
  assertRecordDigest(currentPosition, 'positionDigest');
  assertRecordDigest(targetState, 'targetDigest');
  assertRecordDigest(optionSet, 'optionSetDigest');
  assertRecordDigest(decisionSupport, 'decisionSupportDigest');
  assertRecordDigest(scenarioSet, 'scenarioSetDigest');
  if (contract?.work !== 'RNE-W9') throw new Error('RNE_ROUTE_CONTRACT_INVALID');

  const stageTypes = routeStageRegistry.stages.map(stage => stage.stageType);
  if (JSON.stringify(stageTypes) !== JSON.stringify(contract.routeShape)) {
    throw new Error('RNE_ROUTE_STAGE_REGISTRY_MISMATCH');
  }

  const supportByOption = mapBy(decisionSupport.optionDecisionSupport, 'optionCode');
  const scenarioByOption = mapBy(scenarioSet.scenarios, 'optionCode');
  const routeSetCode = requireText(request.routeSetCode, 'RNE_ROUTE_SET_CODE_REQUIRED');

  const routeCandidates = optionSet.options.map(option => {
    const support = supportByOption.get(option.optionCode);
    const scenario = scenarioByOption.get(option.optionCode);
    if (!support || !scenario) throw new Error(`RNE_ROUTE_INPUT_MISSING:${option.optionCode}`);
    const routeCode = `${routeSetCode}-${option.optionClass}`;
    return {
      routeCode,
      optionCode: option.optionCode,
      optionClass: option.optionClass,
      scenarioReference: scenario.scenarioCode,
      selectionState: 'AVAILABLE_NOT_SELECTED',
      stages: [
        {
          stageType: 'CURRENT',
          stateReference: currentPosition.positionCode,
          authority: 'RNE_CURRENT_POSITION_REFERENCE',
          realityTruthClaimed: false
        },
        {
          stageType: 'INTERMEDIATE',
          stateReference: `${routeCode}-CHECKPOINT`,
          authority: 'RNE_NAVIGATION_CHECKPOINT',
          observationPoint: support.observationPoint,
          dependencyReferences: [...support.dependencyReferences],
          realityTruthClaimed: false
        },
        {
          stageType: 'TARGET',
          stateReference: targetState.targetCode,
          authority: 'AUTHORIZED_TARGET_REFERENCE',
          targetSourceAuthority: targetState.source.sourceType,
          realityTruthClaimed: false
        }
      ],
      journeyStageMutationCreated: false,
      actionRecordCreated: false,
      executionCreated: false,
      outcomePredictionCreated: false
    };
  });
  assertOptionAlignment(optionSet, routeCandidates);
  if (routeCandidates.length < 2) throw new Error('RNE_ROUTE_MULTIPLE_CANDIDATES_REQUIRED');

  const record = {
    schemaVersion: 'PHI-OS-RNE-ROUTE-CANDIDATE-SET-v1.0.0',
    routeSetCode,
    routeSetVersion: '1.0.0',
    objectType: 'ROUTE_CANDIDATE_SET',
    dataType: 'NAVIGATION_RECORD',
    currentPositionReference: outputReference(
      currentPosition.positionCode,
      currentPosition.positionVersion,
      currentPosition.positionDigest
    ),
    targetReference: outputReference(
      targetState.targetCode,
      targetState.targetVersion,
      targetState.targetDigest
    ),
    optionSetReference: outputReference(
      optionSet.optionSetCode,
      optionSet.optionSetVersion,
      optionSet.optionSetDigest
    ),
    decisionSupportReference: outputReference(
      decisionSupport.decisionSupportCode,
      decisionSupport.decisionSupportVersion,
      decisionSupport.decisionSupportDigest
    ),
    scenarioSetReference: outputReference(
      scenarioSet.scenarioSetCode,
      scenarioSet.scenarioSetVersion,
      scenarioSet.scenarioSetDigest
    ),
    routeShape: ['CURRENT', 'INTERMEDIATE', 'TARGET'],
    routeCandidates,
    routeSelectionMade: false,
    journeyStageMutationCreated: false,
    actionRecordCreated: false,
    executionCreated: false,
    outcomePredictionCreated: false,
    professionalJudgmentCreated: false,
    jrIntegrationActivated: false,
    validationOnly: true,
    persistentStoreWriteAllowed: false
  };
  return redigest(record, 'routeSetDigest');
}
