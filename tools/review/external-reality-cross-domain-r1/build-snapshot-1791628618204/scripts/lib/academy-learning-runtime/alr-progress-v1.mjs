const hasField = (value, field) => {
  if (!Object.prototype.hasOwnProperty.call(value ?? {}, field)) return false;
  const fieldValue = value[field];
  if (fieldValue === undefined || fieldValue === null) return false;
  if (typeof fieldValue === 'string') return fieldValue.trim().length > 0;
  return true;
};

const validateRequired = (value, fields = []) => fields.every(field => hasField(value, field));
const unique = values => new Set(values).size === values.length;
const sorted = values => [...values].sort();
const sameSet = (left = [], right = []) =>
  left.length === right.length && sorted(left).every((value, index) => value === sorted(right)[index]);
const registryIndex = (items = [], codeField) => new Map(items.map(item => [item[codeField], item]));

const hasForbiddenFieldDeep = (value, forbidden) => {
  if (Array.isArray(value)) return value.some(item => hasForbiddenFieldDeep(item, forbidden));
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(([key, nested]) =>
    forbidden.has(key) || hasForbiddenFieldDeep(nested, forbidden)
  );
};

const exactInput = (input, fields) =>
  validateRequired(input, fields) && sameSet(Object.keys(input), fields);

export function validateLearningProgressStateRegistry(context) {
  const contract = context.learningProgressContract;
  const registry = context.learningProgressStateRegistry;
  const states = registry?.states;
  if (!Array.isArray(states) || states.length === 0) return 'EMPTY_LEARNING_PROGRESS_STATE_REGISTRY';
  const codes = states.map(item => item.stateCode);
  if (!unique(codes) || !sameSet(codes, contract?.progressStates) ||
      !sameSet(registry.evaluationPriority, contract?.progressStates) ||
      !unique(registry.evaluationPriority) || registry.initialState !== 'NOT_STARTED') {
    return 'LEARNING_PROGRESS_STATE_COVERAGE_FAILURE';
  }
  if (states.some(item => !validateRequired(item, ['stateCode', 'definition']))) {
    return 'UNRESOLVED_LEARNING_PROGRESS_STATE';
  }
  return 'VALID_LEARNING_PROGRESS_STATE_REGISTRY';
}

export function validateLearningProgressScopeRegistry(context) {
  const contract = context.learningProgressContract;
  const registry = context.learningProgressScopeRegistry;
  const scopes = registry?.progressScopes;
  if (!Array.isArray(scopes) || scopes.length === 0) return 'EMPTY_LEARNING_PROGRESS_SCOPE_REGISTRY';
  const programs = registryIndex(context.programRegistry?.programs, 'programCode');
  const paths = registryIndex(context.learningPathRegistry?.learningPaths, 'learningPathCode');
  const modules = registryIndex(context.moduleRegistry?.modules, 'moduleCode');
  const lessons = registryIndex(context.lessonRegistry?.lessons, 'lessonCode');
  const practices = registryIndex(context.practiceRegistry?.practices, 'practiceCode');
  const assessments = registryIndex(context.assessmentRegistry?.assessments, 'assessmentCode');
  const capabilities = registryIndex(context.capabilityRegistry?.capabilities, 'capabilityCode');
  const codeFields = ['progressCode', 'learningPathCode', 'moduleCode', 'lessonCode', 'practiceCode',
    'assessmentCode', 'capabilityCode', 'continuityCode', 'reviewCode', 'recommendationCode'];
  if (codeFields.some(field => !unique(scopes.map(item => item[field])))) {
    return 'DUPLICATE_LEARNING_PROGRESS_SCOPE_REFERENCE';
  }
  for (const scope of scopes) {
    if (!validateRequired(scope, contract?.requiredProgressScopeFields) ||
        !scope.progressCode.startsWith(contract.identityPrefix) ||
        !scope.continuityCode.startsWith(context.learningContinuityContract.identityPrefix) ||
        !scope.reviewCode.startsWith(context.learningReviewRetentionContract.identityPrefix) ||
        !scope.recommendationCode.startsWith(context.learningRecommendationContract.identityPrefix) ||
        scope.status !== 'ACTIVE' || scope.authorityReference !== 'ALR') {
      return 'INVALID_LEARNING_PROGRESS_SCOPE_FIELDS_OR_IDENTITY';
    }
    const program = programs.get(scope.programCode);
    const learningPath = paths.get(scope.learningPathCode);
    const module = modules.get(scope.moduleCode);
    const lesson = lessons.get(scope.lessonCode);
    const practice = practices.get(scope.practiceCode);
    const assessment = assessments.get(scope.assessmentCode);
    const capability = capabilities.get(scope.capabilityCode);
    if (!program || !learningPath || !module || !lesson || !practice || !assessment || !capability ||
        !program.learningPathCodes.includes(scope.learningPathCode) ||
        learningPath.programCode !== scope.programCode ||
        !learningPath.moduleCodes.includes(scope.moduleCode) ||
        module.learningPathCode !== scope.learningPathCode ||
        !module.lessonCodes.includes(scope.lessonCode) ||
        lesson.moduleCode !== scope.moduleCode ||
        !lesson.targetCapabilityCodes.includes(scope.capabilityCode) ||
        practice.lessonCode !== scope.lessonCode || assessment.lessonCode !== scope.lessonCode ||
        assessment.practiceCode !== scope.practiceCode || assessment.capabilityCode !== scope.capabilityCode) {
      return 'DANGLING_OR_MISMATCHED_LEARNING_PROGRESS_SCOPE';
    }
  }
  if (!sameSet(scopes.map(item => item.learningPathCode), [...paths.keys()]) ||
      !sameSet(scopes.map(item => item.moduleCode), [...modules.keys()]) ||
      !sameSet(scopes.map(item => item.lessonCode), [...lessons.keys()]) ||
      !sameSet(scopes.map(item => item.practiceCode), [...practices.keys()]) ||
      !sameSet(scopes.map(item => item.assessmentCode), [...assessments.keys()]) ||
      !sameSet(scopes.map(item => item.capabilityCode), [...capabilities.keys()])) {
    return 'LEARNING_PROGRESS_SCOPE_CANONICAL_COVERAGE_FAILURE';
  }
  if (!sameSet(context.capabilityDependencyGraph?.nodes, [...capabilities.keys()])) {
    return 'LEARNING_PROGRESS_CAPABILITY_DEPENDENCY_COVERAGE_FAILURE';
  }
  return 'VALID_LEARNING_PROGRESS_SCOPE_REGISTRY';
}

export function validateLearningContinuityStateRegistry(context) {
  const contract = context.learningContinuityContract;
  const registry = context.learningContinuityStateRegistry;
  const decisions = registry?.decisions;
  if (!Array.isArray(decisions) || decisions.length === 0) return 'EMPTY_LEARNING_CONTINUITY_STATE_REGISTRY';
  const codes = decisions.map(item => item.decisionCode);
  if (!unique(codes) || !sameSet(codes, contract?.continuityDecisions) ||
      !sameSet(registry.evaluationPriority, contract?.continuityDecisions) ||
      registry.evaluationPriority.some((code, index) => code !==
        [...decisions].sort((a, b) => a.priority - b.priority)[index].decisionCode) ||
      !sameSet(decisions.map(item => item.priority), decisions.map((_, index) => index + 1)) ||
      decisions.some(item => !validateRequired(item, ['decisionCode', 'priority', 'definition']))) {
    return 'INVALID_LEARNING_CONTINUITY_DECISION_REGISTRY';
  }
  return 'VALID_LEARNING_CONTINUITY_STATE_REGISTRY';
}

export function validateLearningReviewRuleRegistry(context) {
  const contract = context.learningReviewRetentionContract;
  const registry = context.learningReviewRuleRegistry;
  const rules = registry?.rules;
  if (!Array.isArray(rules) || rules.length === 0) return 'EMPTY_LEARNING_REVIEW_RULE_REGISTRY';
  const codes = rules.map(item => item.decisionCode);
  if (!unique(codes) || !sameSet(codes, contract?.reviewDecisions) ||
      !sameSet(registry.evaluationPriority, contract?.reviewDecisions) ||
      registry.evaluationPriority.some((code, index) => code !==
        [...rules].sort((a, b) => a.priority - b.priority)[index].decisionCode) ||
      !sameSet(rules.map(item => item.priority), rules.map((_, index) => index + 1)) ||
      rules.some(item => !validateRequired(item, ['decisionCode', 'priority', 'reasonCode', 'authority']))) {
    return 'INVALID_LEARNING_REVIEW_RULE_REGISTRY';
  }
  if (contract.rdgRetentionContractReference !==
        'content/governance/reality-data-governance/contracts/retention-runtime-contract-v1.json' ||
      contract.rdgRetentionRegistryReference !==
        'content/governance/reality-data-governance/registries/canonical-data-retention-registry-v1.json' ||
      context.rdgRetentionContract?.rules?.retentionMustBePurposeBound !== true ||
      context.rdgRetentionRegistry?.rules?.entryIsPolicyClassNotDurationDecision !== true) {
    return 'DENY_LEARNING_REVIEW_RETENTION_AUTHORITY';
  }
  return 'VALID_LEARNING_REVIEW_RULE_REGISTRY';
}

export function validateLearningRecommendationRuleRegistry(context) {
  const contract = context.learningRecommendationContract;
  const registry = context.learningRecommendationRuleRegistry;
  const rules = registry?.rules;
  if (!Array.isArray(rules) || rules.length === 0) return 'EMPTY_LEARNING_RECOMMENDATION_RULE_REGISTRY';
  const codes = rules.map(item => item.actionCode);
  if (!unique(codes) || !sameSet(codes, contract?.recommendationActions) ||
      !sameSet(registry.evaluationPriority, contract?.recommendationActions) ||
      registry.evaluationPriority.some((code, index) => code !==
        [...rules].sort((a, b) => a.priority - b.priority)[index].actionCode) ||
      !sameSet(rules.map(item => item.priority), rules.map((_, index) => index + 1)) ||
      rules.some(item => !validateRequired(item,
        ['actionCode', 'priority', 'targetScope', 'reasonCode', 'requiresChoice']) ||
        item.requiresChoice !== true)) {
    return 'INVALID_LEARNING_RECOMMENDATION_RULE_REGISTRY';
  }
  if (!sameSet(contract.capabilityGapTypes,
    ['NO_GAP', ...(context.capabilityGapContract?.gapTypes ?? [])])) {
    return 'LEARNING_RECOMMENDATION_CAPABILITY_GAP_CONTRACT_MISMATCH';
  }
  return 'VALID_LEARNING_RECOMMENDATION_RULE_REGISTRY';
}

export function validateLearningProgressRuntime(context) {
  const results = [
    validateLearningProgressStateRegistry(context),
    validateLearningProgressScopeRegistry(context),
    validateLearningContinuityStateRegistry(context),
    validateLearningReviewRuleRegistry(context),
    validateLearningRecommendationRuleRegistry(context)
  ];
  return results.find(result => !result.startsWith('VALID_')) ?? 'VALID_LEARNING_PROGRESS_RUNTIME';
}

export function buildLearningProgressScopeProjection(context, lessonCode) {
  if (validateLearningProgressRuntime(context) !== 'VALID_LEARNING_PROGRESS_RUNTIME') return null;
  const scope = context.learningProgressScopeRegistry.progressScopes.find(item => item.lessonCode === lessonCode);
  if (!scope) return null;
  return {
    progressScope: structuredClone(scope),
    program: structuredClone(context.programRegistry.programs.find(item => item.programCode === scope.programCode)),
    learningPath: structuredClone(context.learningPathRegistry.learningPaths.find(item =>
      item.learningPathCode === scope.learningPathCode)),
    module: structuredClone(context.moduleRegistry.modules.find(item => item.moduleCode === scope.moduleCode)),
    lesson: structuredClone(context.lessonRegistry.lessons.find(item => item.lessonCode === scope.lessonCode)),
    practice: structuredClone(context.practiceRegistry.practices.find(item => item.practiceCode === scope.practiceCode)),
    assessment: structuredClone(context.assessmentRegistry.assessments.find(item =>
      item.assessmentCode === scope.assessmentCode)),
    capability: structuredClone(context.capabilityRegistry.capabilities.find(item =>
      item.capabilityCode === scope.capabilityCode))
  };
}

export function evaluateLearningProgress(context, input = {}) {
  const contract = context.learningProgressContract;
  if (validateLearningProgressRuntime(context) !== 'VALID_LEARNING_PROGRESS_RUNTIME') {
    return { decision: 'DENY_INVALID_LEARNING_PROGRESS_RUNTIME' };
  }
  if (hasForbiddenFieldDeep(input, new Set(contract?.forbiddenInputFields ?? []))) {
    return { decision: 'DENY_LEARNER_DATA_OR_AUTHORITY_FIELD' };
  }
  if (!exactInput(input, contract.requiredEvaluationInputFields)) return { decision: 'DENY_PROGRESS_INPUT_SHAPE' };
  const scope = context.learningProgressScopeRegistry.progressScopes.find(item => item.progressCode === input.progressCode);
  if (!scope) return { decision: 'DENY_UNKNOWN_PROGRESS_SCOPE' };
  if (scope.progressVersion !== input.progressVersion) return { decision: 'DENY_PROGRESS_VERSION_MISMATCH' };
  if (!contract.exposureDecisions.includes(input.exposureDecision) ||
      !contract.practiceDecisions.includes(input.practiceDecision) ||
      !contract.assessmentDecisions.includes(input.assessmentDecision) ||
      !contract.reviewDecisions.includes(input.reviewDecision) ||
      !Array.isArray(input.lineageReferences) || !unique(input.lineageReferences) ||
      input.lineageReferences.some(reference => typeof reference !== 'string' || !reference.trim())) {
    return { decision: 'DENY_UNKNOWN_PROGRESS_DECISION_OR_LINEAGE' };
  }
  const decisions = [input.exposureDecision, input.practiceDecision, input.assessmentDecision, input.reviewDecision];
  let progressState;
  if (decisions.includes('DISPUTED')) progressState = 'DISPUTED';
  else if (decisions.includes('UNKNOWN')) progressState = 'UNKNOWN';
  else {
    const exposurePresent = input.exposureDecision === 'GOVERNED_RECORD_PRESENT';
    const practicePresent = input.practiceDecision === 'GOVERNED_RECORD_PRESENT';
    const assessmentPresent = input.assessmentDecision === 'INTEGRITY_VALID_RESULT_PRESENT';
    const notStarted = input.exposureDecision === 'NOT_RECORDED' &&
      input.practiceDecision === 'NOT_RECORDED' && input.assessmentDecision === 'NOT_EVALUATED' &&
      input.reviewDecision === 'NOT_DUE';
    if ((practicePresent && !exposurePresent) || (assessmentPresent && !practicePresent) ||
        (['REVIEW_DUE', 'REVIEW_COMPLETED'].includes(input.reviewDecision) && !assessmentPresent) ||
        (!notStarted && input.lineageReferences.length === 0) || (notStarted && input.lineageReferences.length !== 0)) {
      return { decision: 'DENY_PROGRESS_SEQUENCE_OR_LINEAGE' };
    }
    if (notStarted) progressState = 'NOT_STARTED';
    else if (assessmentPresent && input.reviewDecision === 'REVIEW_COMPLETED') progressState = 'COMPLETED';
    else if (assessmentPresent) progressState = 'REVIEW_DUE';
    else if (practicePresent) progressState = 'ASSESSMENT_PENDING';
    else if (exposurePresent) progressState = 'IN_PROGRESS';
    else return { decision: 'DENY_PROGRESS_SEQUENCE_OR_LINEAGE' };
  }
  return {
    decision: 'LEARNING_PROGRESS_EVALUATED_SEMANTIC_NO_PERSISTENCE',
    progressCode: scope.progressCode,
    progressVersion: scope.progressVersion,
    lessonCode: scope.lessonCode,
    capabilityCode: scope.capabilityCode,
    progressState,
    completionState: progressState === 'COMPLETED' ? 'LEARNING_COMPLETION_SUPPORTED' : 'LEARNING_COMPLETION_NOT_SUPPORTED',
    lineageReferences: [...input.lineageReferences],
    capabilityStateEffect: 'NONE',
    persistenceEffect: 'NONE'
  };
}

const progressRank = new Map([
  ['NOT_STARTED', 0], ['IN_PROGRESS', 1], ['ASSESSMENT_PENDING', 2], ['REVIEW_DUE', 3], ['COMPLETED', 4]
]);

export function evaluateLearningContinuity(context, input = {}) {
  const contract = context.learningContinuityContract;
  if (validateLearningProgressRuntime(context) !== 'VALID_LEARNING_PROGRESS_RUNTIME') {
    return { decision: 'DENY_INVALID_LEARNING_PROGRESS_RUNTIME' };
  }
  if (hasForbiddenFieldDeep(input, new Set(contract?.forbiddenInputFields ?? []))) {
    return { decision: 'DENY_LEARNER_DATA_OR_AUTHORITY_FIELD' };
  }
  if (!exactInput(input, contract.requiredEvaluationInputFields)) return { decision: 'DENY_CONTINUITY_INPUT_SHAPE' };
  const scope = context.learningProgressScopeRegistry.progressScopes.find(item =>
    item.continuityCode === input.continuityCode);
  if (!scope) return { decision: 'DENY_UNKNOWN_CONTINUITY_SCOPE' };
  if (input.continuityVersion !== scope.progressVersion) return { decision: 'DENY_CONTINUITY_VERSION_MISMATCH' };
  if (!contract.interruptionStates.includes(input.interruptionState) ||
      !contract.sourceVersionStates.includes(input.sourceVersionState) ||
      !context.learningProgressContract.progressStates.includes(input.previousProgressState) ||
      !context.learningProgressContract.progressStates.includes(input.currentProgressState) ||
      typeof input.lineagePreserved !== 'boolean') return { decision: 'DENY_UNKNOWN_CONTINUITY_STATE' };
  let continuityDecision;
  if ([input.previousProgressState, input.currentProgressState, input.interruptionState,
    input.sourceVersionState].includes('DISPUTED')) continuityDecision = 'HOLD_DISPUTED';
  else if ([input.previousProgressState, input.currentProgressState, input.interruptionState,
    input.sourceVersionState].includes('UNKNOWN')) continuityDecision = 'HOLD_UNKNOWN';
  else if (!input.lineagePreserved || input.interruptionState === 'INTERRUPTED_REVIEW_REQUIRED' ||
      input.sourceVersionState === 'CHANGED_REVIEW_REQUIRED' ||
      (progressRank.has(input.previousProgressState) && progressRank.has(input.currentProgressState) &&
        progressRank.get(input.currentProgressState) < progressRank.get(input.previousProgressState))) {
    continuityDecision = 'REVIEW_REQUIRED';
  } else if (input.currentProgressState === 'COMPLETED') continuityDecision = 'COMPLETE_NO_CONTINUATION';
  else if (input.currentProgressState === 'NOT_STARTED') continuityDecision = 'START_AVAILABLE';
  else if (input.interruptionState === 'INTERRUPTED_RESUMABLE') continuityDecision = 'RESUME_AVAILABLE';
  else continuityDecision = 'CONTINUE_AVAILABLE';
  return {
    decision: 'LEARNING_CONTINUITY_EVALUATED_SEMANTIC_NO_PERSISTENCE',
    continuityCode: scope.continuityCode,
    lessonCode: scope.lessonCode,
    continuityDecision,
    lineageEffect: 'PRESERVE_ONLY',
    automaticAssignmentEffect: 'NONE',
    persistenceEffect: 'NONE'
  };
}

export function evaluateLearningReviewRetention(context, input = {}) {
  const contract = context.learningReviewRetentionContract;
  if (validateLearningProgressRuntime(context) !== 'VALID_LEARNING_PROGRESS_RUNTIME') {
    return { decision: 'DENY_INVALID_LEARNING_PROGRESS_RUNTIME' };
  }
  if (hasForbiddenFieldDeep(input, new Set(contract?.forbiddenInputFields ?? []))) {
    return { decision: 'DENY_LEARNER_DATA_RETENTION_OR_AUTHORITY_FIELD' };
  }
  if (!exactInput(input, contract.requiredEvaluationInputFields)) return { decision: 'DENY_REVIEW_INPUT_SHAPE' };
  const scope = context.learningProgressScopeRegistry.progressScopes.find(item => item.reviewCode === input.reviewCode);
  if (!scope) return { decision: 'DENY_UNKNOWN_REVIEW_SCOPE' };
  if (input.reviewVersion !== scope.progressVersion) return { decision: 'DENY_REVIEW_VERSION_MISMATCH' };
  if (!context.learningProgressContract.progressStates.includes(input.progressState) ||
      !context.learningContinuityContract.continuityDecisions.includes(input.continuityDecision) ||
      !context.capabilityStateRegistry.states.some(item => item.stateCode === input.capabilityState) ||
      !context.learningContinuityContract.sourceVersionStates.includes(input.sourceVersionState) ||
      !contract.rdgRetentionDecisions.includes(input.rdgRetentionDecision)) {
    return { decision: 'DENY_UNKNOWN_REVIEW_OR_RETENTION_STATE' };
  }
  let reviewDecision;
  if (input.rdgRetentionDecision === 'RDG_RETENTION_DENIED') reviewDecision = 'RETENTION_BLOCKED';
  else if ([input.progressState, input.continuityDecision, input.capabilityState,
    input.sourceVersionState, input.rdgRetentionDecision].includes('DISPUTED') ||
    input.continuityDecision === 'HOLD_DISPUTED') reviewDecision = 'HOLD_DISPUTED';
  else if ([input.progressState, input.continuityDecision, input.capabilityState,
    input.sourceVersionState, input.rdgRetentionDecision].includes('UNKNOWN') ||
    input.continuityDecision === 'HOLD_UNKNOWN') reviewDecision = 'HOLD_UNKNOWN';
  else if (input.rdgRetentionDecision === 'RDG_RETENTION_REVIEW_REQUIRED') {
    reviewDecision = 'RETENTION_REVIEW_REQUIRED';
  } else if (input.sourceVersionState === 'CHANGED_REVIEW_REQUIRED') reviewDecision = 'SOURCE_REVIEW_REQUIRED';
  else if (input.capabilityState === 'MAINTENANCE_DUE') reviewDecision = 'CAPABILITY_MAINTENANCE_REVIEW';
  else if (input.progressState === 'REVIEW_DUE' || input.continuityDecision === 'REVIEW_REQUIRED') {
    reviewDecision = 'LEARNING_REVIEW_REQUIRED';
  } else reviewDecision = 'NO_REVIEW_DUE';
  const rule = context.learningReviewRuleRegistry.rules.find(item => item.decisionCode === reviewDecision);
  return {
    decision: 'LEARNING_REVIEW_EVALUATED_SEMANTIC_NO_PERSISTENCE',
    reviewCode: scope.reviewCode,
    lessonCode: scope.lessonCode,
    reviewDecision,
    reasonCode: rule.reasonCode,
    retentionAuthority: 'RDG',
    retentionEffect: 'NONE',
    capabilityStateEffect: 'NONE',
    persistenceEffect: 'NONE'
  };
}

export function resolveLearningRecommendation(context, input = {}) {
  const contract = context.learningRecommendationContract;
  if (validateLearningProgressRuntime(context) !== 'VALID_LEARNING_PROGRESS_RUNTIME') {
    return { decision: 'DENY_INVALID_LEARNING_PROGRESS_RUNTIME' };
  }
  if (hasForbiddenFieldDeep(input, new Set(contract?.forbiddenInputFields ?? []))) {
    return { decision: 'DENY_LEARNER_PROFILE_PROVIDER_OR_AUTHORITY_FIELD' };
  }
  if (!exactInput(input, contract.requiredEvaluationInputFields)) return { decision: 'DENY_RECOMMENDATION_INPUT_SHAPE' };
  const scope = context.learningProgressScopeRegistry.progressScopes.find(item =>
    item.recommendationCode === input.recommendationCode);
  if (!scope) return { decision: 'DENY_UNKNOWN_RECOMMENDATION_SCOPE' };
  if (input.recommendationVersion !== scope.progressVersion) return { decision: 'DENY_RECOMMENDATION_VERSION_MISMATCH' };
  if (!context.learningProgressContract.progressStates.includes(input.progressState) ||
      !context.learningContinuityContract.continuityDecisions.includes(input.continuityDecision) ||
      !context.learningReviewRetentionContract.reviewDecisions.includes(input.reviewDecision) ||
      !contract.capabilityGapTypes.includes(input.capabilityGapType)) {
    return { decision: 'DENY_UNKNOWN_RECOMMENDATION_INPUT_STATE' };
  }
  let actionCode;
  if (input.progressState === 'DISPUTED' || input.continuityDecision === 'HOLD_DISPUTED' ||
      input.reviewDecision === 'HOLD_DISPUTED' || input.capabilityGapType === 'DISPUTED_GAP') {
    actionCode = 'HOLD_DISPUTED';
  } else if (input.progressState === 'UNKNOWN' || input.continuityDecision === 'HOLD_UNKNOWN' ||
      input.reviewDecision === 'HOLD_UNKNOWN' || input.capabilityGapType === 'UNKNOWN_GAP') {
    actionCode = 'HOLD_UNKNOWN';
  } else if (['RETENTION_BLOCKED', 'RETENTION_REVIEW_REQUIRED'].includes(input.reviewDecision)) {
    actionCode = 'REVIEW_RETENTION';
  } else if (input.reviewDecision === 'SOURCE_REVIEW_REQUIRED') actionCode = 'REVIEW_SOURCE';
  else if (['LEARNING_REVIEW_REQUIRED', 'CAPABILITY_MAINTENANCE_REVIEW'].includes(input.reviewDecision) ||
      input.continuityDecision === 'REVIEW_REQUIRED') actionCode = 'REVIEW_CONTINUITY';
  else if (input.capabilityGapType === 'PREREQUISITE_GAP') actionCode = 'REVISIT_PREREQUISITE';
  else if (['EVIDENCE_GAP', 'MAINTENANCE_GAP'].includes(input.capabilityGapType)) {
    actionCode = 'REINFORCE_PRACTICE';
  } else if (input.progressState === 'ASSESSMENT_PENDING') actionCode = 'REVIEW_ASSESSMENT';
  else if (input.progressState === 'NOT_STARTED') actionCode = 'START_CURRENT_LESSON';
  else if (input.progressState === 'COMPLETED' && input.capabilityGapType === 'NO_GAP') {
    actionCode = 'COMPLETE_NO_AUTOMATIC_NEXT_STEP';
  } else actionCode = 'CONTINUE_CURRENT_LESSON';
  const rule = context.learningRecommendationRuleRegistry.rules.find(item => item.actionCode === actionCode);
  const prerequisiteReferences = (context.capabilityDependencyGraph?.edges ?? [])
    .filter(edge => edge.edgeType === 'REQUIRES' && edge.toCapabilityCode === scope.capabilityCode)
    .map(edge => edge.fromCapabilityCode);
  if (actionCode === 'REVISIT_PREREQUISITE' && prerequisiteReferences.length === 0) {
    return { decision: 'DENY_PREREQUISITE_GAP_WITHOUT_REGISTERED_PREREQUISITE' };
  }
  const targetReferenceByScope = {
    CURRENT_LEARNING_SCOPE: scope.learningPathCode,
    DIRECT_PREREQUISITE_REVIEW: prerequisiteReferences[0],
    CURRENT_PRACTICE: scope.practiceCode,
    CURRENT_ASSESSMENT: scope.assessmentCode,
    CURRENT_LESSON: scope.lessonCode,
    RDG_RETENTION_REVIEW: context.learningReviewRetentionContract.rdgRetentionContractReference,
    NO_AUTOMATIC_TARGET: null
  };
  return {
    decision: ['HOLD_DISPUTED', 'HOLD_UNKNOWN'].includes(actionCode)
      ? 'RECOMMENDATION_HELD'
      : actionCode === 'COMPLETE_NO_AUTOMATIC_NEXT_STEP'
        ? 'NO_AUTOMATIC_NEXT_STEP'
        : 'LEARNING_OPTION_AVAILABLE',
    recommendationCode: scope.recommendationCode,
    lessonCode: scope.lessonCode,
    actionCode,
    targetScope: rule.targetScope,
    targetReference: targetReferenceByScope[rule.targetScope],
    reasonCode: rule.reasonCode,
    requiresChoice: true,
    automaticEnrollmentEffect: 'NONE',
    entitlementEffect: 'NONE',
    capabilityStateEffect: 'NONE',
    professionalAuthorityEffect: 'NONE',
    persistenceEffect: 'NONE'
  };
}

export function evaluateLearningProgressDeliveryEligibility(context, input = {}) {
  const contracts = [context.learningProgressContract, context.learningContinuityContract,
    context.learningReviewRetentionContract, context.learningRecommendationContract];
  const forbidden = new Set(contracts.flatMap(contract => contract?.forbiddenInputFields ?? []));
  if (hasForbiddenFieldDeep(input, forbidden)) return 'DENY_LEARNER_DATA_OR_AUTHORITY_FIELD';
  if (input.requestedActivationState === 'SEMANTIC_RUNTIME_READY_DELIVERY_BLOCKED') {
    return 'SEMANTIC_RUNTIME_READY_DELIVERY_BLOCKED';
  }
  if (input.requestedActivationState !== 'DELIVERY_ELIGIBLE') return 'DENY_UNKNOWN_ACTIVATION_STATE';
  const gates = ['progressRuntimeReady', 'rdgPermissionResolved', 'rdgPersistenceReady',
    'learnerDeliveryReady'];
  if (gates.some(gate => input[gate] !== true)) return 'DENY_DELIVERY_GATES';
  if (contracts.some(contract => contract?.activation?.learnerDeliveryRuntimeActive !== true)) {
    return 'DENY_RUNTIME_NOT_ACTIVATED';
  }
  return 'DELIVERY_ELIGIBLE';
}
