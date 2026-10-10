import { validatePracticeRuntime } from './alr-practice-v1.mjs';

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

const validatesTypeAuthority = (typeRegistry, objectType, ownerWork) => {
  const type = typeRegistry?.objectTypes?.find(item => item.typeCode === objectType);
  return Boolean(type && type.ownerWork === ownerWork && type.contentAuthority === 'ALR');
};

export function validateAssessmentTypeRegistry(context) {
  const { assessmentTypeContract: contract, assessmentTypeRegistry: registry } = context;
  const types = registry?.assessmentTypes;
  if (!Array.isArray(types) || types.length === 0) return 'EMPTY_ASSESSMENT_TYPE_REGISTRY';
  const capabilities = context.capabilityRegistry?.capabilities ?? [];
  const objectives = context.learningObjectiveRegistry?.learningObjectives ?? [];
  const capabilityKinds = new Set(context.capabilityRegistry?.capabilityKinds ?? []);
  const actionVerbs = new Set(context.learningObjectiveRegistry?.controlledActionVerbs ?? []);
  const forbidden = new Set(contract?.forbiddenAssessmentTypeFields ?? []);
  const codes = types.map(item => item.assessmentTypeCode);
  const kinds = types.map(item => item.capabilityKind);
  if (!unique(codes)) return 'DUPLICATE_ASSESSMENT_TYPE_CODE';
  if (!unique(kinds)) return 'DUPLICATE_ASSESSMENT_TYPE_CAPABILITY_KIND';

  for (const type of types) {
    if (!validateRequired(type, contract?.requiredAssessmentTypeFields)) return 'UNRESOLVED_ASSESSMENT_TYPE_FIELDS';
    if (!type.assessmentTypeCode.startsWith(contract.identityPrefix)) return 'INVALID_ASSESSMENT_TYPE_IDENTITY';
    if (type.authorityReference !== 'ALR') return 'DENY_ASSESSMENT_TYPE_AUTHORITY';
    if (hasForbiddenFieldDeep(type, forbidden)) return 'DENY_ASSESSMENT_TYPE_DATA_PROVIDER_OR_AUTHORITY_FIELD';
    if (!capabilityKinds.has(type.capabilityKind) ||
        !(contract.evaluationModes ?? []).includes(type.evaluationMode) ||
        !(contract.responseShapes ?? []).includes(type.responseShape) ||
        !(contract.statusValues ?? []).includes(type.status)) return 'UNKNOWN_ASSESSMENT_TYPE_STATE_OR_MODE';
    if (!Array.isArray(type.supportedActionVerbs) || type.supportedActionVerbs.length === 0 ||
        !unique(type.supportedActionVerbs) || type.supportedActionVerbs.some(verb => !actionVerbs.has(verb)) ||
        !sameSet(type.requiredIntegrityDimensions, contract.requiredIntegrityDimensions)) {
      return 'INVALID_ASSESSMENT_TYPE_VERB_OR_DIMENSION';
    }
    const capabilityCodes = capabilities.filter(item => item.capabilityKind === type.capabilityKind)
      .map(item => item.capabilityCode);
    const requiredVerbs = objectives.filter(item => capabilityCodes.includes(item.capabilityCode))
      .map(item => item.actionVerb);
    if (capabilityCodes.length !== 1 || !sameSet(type.supportedActionVerbs, requiredVerbs)) {
      return 'ASSESSMENT_TYPE_CAPABILITY_OBJECTIVE_MISMATCH';
    }
  }
  if (!sameSet(kinds, [...capabilityKinds])) return 'ASSESSMENT_TYPE_CAPABILITY_KIND_COVERAGE_FAILURE';
  return 'VALID_ASSESSMENT_TYPE_REGISTRY';
}

export function validateAssessmentIntegrityRuleRegistry(context) {
  const { assessmentIntegrityContract: contract, assessmentIntegrityRuleRegistry: registry } = context;
  const ruleSets = registry?.ruleSets;
  if (!Array.isArray(ruleSets) || ruleSets.length !== 1) return 'INVALID_ASSESSMENT_INTEGRITY_RULE_SET_COUNT';
  const ruleSet = ruleSets[0];
  if (!validateRequired(ruleSet, ['ruleSetCode', 'ruleSetVersion', 'rules', 'successDecision', 'status', 'authorityReference'])) {
    return 'UNRESOLVED_ASSESSMENT_INTEGRITY_RULE_SET';
  }
  if (ruleSet.ruleSetCode !== 'ALR-ASMT-INTEGRITY-BASE-v1' || ruleSet.status !== 'ACTIVE' ||
      ruleSet.authorityReference !== 'ALR' || ruleSet.successDecision !== 'INTEGRITY_VALID') {
    return 'INVALID_ASSESSMENT_INTEGRITY_RULE_SET_STATE';
  }
  if (!Array.isArray(ruleSet.rules) || ruleSet.rules.length === 0 ||
      !unique(ruleSet.rules.map(item => item.ruleCode)) ||
      ruleSet.rules.some((item, index) => item.sequence !== index + 1 ||
        !(contract.integrityDecisions ?? []).includes(item.failureDecision))) {
    return 'INVALID_ASSESSMENT_INTEGRITY_RULE_SEQUENCE';
  }
  return 'VALID_ASSESSMENT_INTEGRITY_RULE_REGISTRY';
}

export function validateAssessmentRegistry(context) {
  const { assessmentContract: contract, assessmentRegistry: registry } = context;
  if (!validatesTypeAuthority(context.typeRegistry, 'ASSESSMENT', 'ALR-W24')) {
    return 'DENY_ASSESSMENT_TYPE_AUTHORITY';
  }
  const typeResult = validateAssessmentTypeRegistry(context);
  if (typeResult !== 'VALID_ASSESSMENT_TYPE_REGISTRY') return typeResult;
  const integrityResult = validateAssessmentIntegrityRuleRegistry(context);
  if (integrityResult !== 'VALID_ASSESSMENT_INTEGRITY_RULE_REGISTRY') return integrityResult;
  const practiceResult = validatePracticeRuntime(context);
  if (practiceResult !== 'VALID_PRACTICE_RUNTIME') return practiceResult;
  const assessments = registry?.assessments;
  if (!Array.isArray(assessments) || assessments.length === 0) return 'EMPTY_ASSESSMENT_REGISTRY';
  const types = registryIndex(context.assessmentTypeRegistry.assessmentTypes, 'assessmentTypeCode');
  const practiceBindings = registryIndex(context.practiceLearningBindingRegistry.bindings, 'bindingCode');
  const practices = registryIndex(context.practiceRegistry.practices, 'practiceCode');
  const simulations = registryIndex(context.simulationRegistry.simulations, 'simulationCode');
  const caseStudies = registryIndex(context.caseStudyRegistry.caseStudies, 'caseStudyCode');
  const lessons = registryIndex(context.lessonRegistry.lessons, 'lessonCode');
  const objectives = registryIndex(context.learningObjectiveRegistry.learningObjectives, 'learningObjectiveCode');
  const capabilities = registryIndex(context.capabilityRegistry.capabilities, 'capabilityCode');
  const ruleSets = registryIndex(context.assessmentIntegrityRuleRegistry.ruleSets, 'ruleSetCode');
  const forbidden = new Set(contract?.forbiddenAssessmentFields ?? []);
  const codes = assessments.map(item => item.assessmentCode);
  const lessonCodes = assessments.map(item => item.lessonCode);
  const practiceBindingCodes = assessments.map(item => item.practiceLearningBindingCode);
  const capabilityCodes = assessments.map(item => item.capabilityCode);
  if (!unique(codes)) return 'DUPLICATE_ASSESSMENT_CODE';
  if (!unique(lessonCodes)) return 'DUPLICATE_ASSESSMENT_LESSON';
  if (!unique(practiceBindingCodes)) return 'DUPLICATE_ASSESSMENT_PRACTICE_BINDING';
  if (!unique(capabilityCodes)) return 'DUPLICATE_ASSESSMENT_CAPABILITY';
  const coveredObjectives = [];
  const coveredCriteria = [];
  const requiredFindingFields = contract.requiredCriterionRubricFields ?
    context.assessmentIntegrityContract.requiredCriterionFindingFields.filter(field => field !== 'criterionCode') : [];

  for (const assessment of assessments) {
    if (!validateRequired(assessment, contract?.requiredAssessmentFields)) return 'UNRESOLVED_ASSESSMENT_FIELDS';
    if (!assessment.assessmentCode.startsWith(contract.identityPrefix)) return 'INVALID_ASSESSMENT_IDENTITY';
    if (assessment.authorityReference !== 'ALR') return 'DENY_ASSESSMENT_AUTHORITY';
    if (hasForbiddenFieldDeep(assessment, forbidden)) return 'DENY_ASSESSMENT_RESPONSE_RESULT_PROVIDER_OR_AUTHORITY_FIELD';
    if (!(contract.assessmentModes ?? []).includes(assessment.assessmentMode) ||
        !(contract.resultStates ?? []).includes(assessment.resultState) ||
        !(contract.statusValues ?? []).includes(assessment.status) ||
        !(contract.deliveryActivationStates ?? []).includes(assessment.deliveryActivationState)) {
      return 'UNKNOWN_ASSESSMENT_STATE_OR_MODE';
    }
    const type = types.get(assessment.assessmentTypeCode);
    const binding = practiceBindings.get(assessment.practiceLearningBindingCode);
    const practice = practices.get(assessment.practiceCode);
    const simulation = simulations.get(assessment.simulationCode);
    const caseStudy = caseStudies.get(assessment.caseStudyCode);
    const lesson = lessons.get(assessment.lessonCode);
    const capability = capabilities.get(assessment.capabilityCode);
    if (!type || !binding || !practice || !simulation || !caseStudy || !lesson || !capability ||
        !ruleSets.has(assessment.integrityRuleSetCode) ||
        binding.lessonCode !== assessment.lessonCode || binding.practiceCode !== assessment.practiceCode ||
        binding.simulationCode !== assessment.simulationCode || practice.lessonCode !== assessment.lessonCode ||
        simulation.lessonCode !== assessment.lessonCode || simulation.caseStudyCode !== assessment.caseStudyCode ||
        caseStudy.lessonCode !== assessment.lessonCode || type.capabilityKind !== capability.capabilityKind ||
        assessment.scenarioVersion !== caseStudy.caseStudyVersion) {
      return 'UNKNOWN_ASSESSMENT_TYPE_BINDING_PRACTICE_CASE_LESSON_CAPABILITY_OR_RULE_SET';
    }
    if (!sameSet(assessment.learningObjectiveCodes, lesson.learningObjectiveCodes) ||
        !Array.isArray(assessment.criterionRubrics) || assessment.criterionRubrics.length === 0 ||
        !unique(assessment.criterionRubrics.map(item => item.criterionCode)) ||
        !unique(assessment.criterionRubrics.map(item => item.learningObjectiveCode))) {
      return 'ASSESSMENT_OBJECTIVE_OR_CRITERION_COVERAGE_FAILURE';
    }
    const capabilityCriteria = capability.requiredEvidenceCriteria.map(item => item.criterionCode);
    if (!sameSet(assessment.criterionRubrics.map(item => item.criterionCode), capabilityCriteria)) {
      return 'ASSESSMENT_CAPABILITY_CRITERION_MISMATCH';
    }
    for (const rubric of assessment.criterionRubrics) {
      if (!validateRequired(rubric, contract.requiredCriterionRubricFields) ||
          !sameSet(rubric.requiredFindingFields, requiredFindingFields)) return 'INVALID_ASSESSMENT_CRITERION_RUBRIC';
      const objective = objectives.get(rubric.learningObjectiveCode);
      if (!objective || objective.lessonCode !== assessment.lessonCode ||
          objective.capabilityCode !== assessment.capabilityCode ||
          objective.evidenceCriterionCode !== rubric.criterionCode ||
          !assessment.learningObjectiveCodes.includes(objective.learningObjectiveCode) ||
          !type.supportedActionVerbs.includes(objective.actionVerb)) {
        return 'ASSESSMENT_OBJECTIVE_CAPABILITY_CRITERION_MISMATCH';
      }
      coveredObjectives.push(rubric.learningObjectiveCode);
      coveredCriteria.push(rubric.criterionCode);
    }
  }
  if (!sameSet(lessonCodes, [...lessons.keys()]) ||
      !sameSet(practiceBindingCodes, [...practiceBindings.keys()]) ||
      !sameSet(capabilityCodes, [...capabilities.keys()]) ||
      !sameSet(coveredObjectives, [...objectives.keys()]) ||
      !sameSet(coveredCriteria, context.capabilityRegistry.capabilities.flatMap(item =>
        item.requiredEvidenceCriteria.map(criterion => criterion.criterionCode)))) {
    return 'ASSESSMENT_CANONICAL_COVERAGE_FAILURE';
  }
  return 'VALID_ASSESSMENT_REGISTRY';
}

export function validateLearningFeedbackRegistry(context) {
  const { learningFeedbackContract: contract, learningFeedbackRegistry: registry } = context;
  if (!validatesTypeAuthority(context.typeRegistry, 'LEARNING_FEEDBACK', 'ALR-W27')) {
    return 'DENY_LEARNING_FEEDBACK_TYPE_AUTHORITY';
  }
  if (!Array.isArray(registry?.feedbackDefinitions) || registry.feedbackDefinitions.length === 0) {
    return 'EMPTY_LEARNING_FEEDBACK_REGISTRY';
  }
  const forbidden = new Set(contract?.forbiddenFeedbackFields ?? []);
  const definitions = registry.feedbackDefinitions;
  const codes = definitions.map(item => item.feedbackCode);
  if (!sameSet(registry.feedbackStateCodes, contract.feedbackStates) || !sameSet(codes, contract.feedbackStates) ||
      !unique(codes) || !sameSet(registry.evaluationPriority, contract.feedbackStates) ||
      !unique(registry.evaluationPriority)) return 'LEARNING_FEEDBACK_STATE_COVERAGE_FAILURE';
  const expectedPriority = [...definitions].sort((a, b) => a.priority - b.priority).map(item => item.feedbackCode);
  if (!sameSet(definitions.map(item => item.priority), definitions.map((_, index) => index + 1)) ||
      registry.evaluationPriority.some((code, index) => code !== expectedPriority[index])) {
    return 'INVALID_LEARNING_FEEDBACK_PRIORITY';
  }
  const triggerDimensions = new Set(['evidencePresent', 'unknownsPreserved', 'constraintsCorrect',
    'interpretationBounded', 'boundaryPreserved', 'supportLevel']);
  for (const definition of definitions) {
    if (!validateRequired(definition, contract.requiredFeedbackDefinitionFields)) {
      return 'UNRESOLVED_LEARNING_FEEDBACK_FIELDS';
    }
    if (hasForbiddenFieldDeep(definition, forbidden)) return 'DENY_LEARNING_FEEDBACK_DATA_OR_AUTHORITY_FIELD';
    if (!triggerDimensions.has(definition.triggerDimension) ||
        !(contract.criterionEvidenceStatuses ?? []).includes(definition.criterionEvidenceStatus) ||
        context.assessmentEvidenceRdgHandoffContract.criterionStatusMapping[definition.feedbackCode] !==
          definition.criterionEvidenceStatus) return 'INVALID_LEARNING_FEEDBACK_TRIGGER_OR_EVIDENCE_MAPPING';
  }
  return 'VALID_LEARNING_FEEDBACK_REGISTRY';
}

export function validateAssessmentLearningBindings(context) {
  const registry = context.assessmentLearningBindingRegistry;
  if (!registry || !Array.isArray(registry.bindings) || registry.bindings.length === 0) {
    return 'EMPTY_ASSESSMENT_LEARNING_BINDING_REGISTRY';
  }
  const lessons = registryIndex(context.lessonRegistry.lessons, 'lessonCode');
  const capabilities = registryIndex(context.capabilityRegistry.capabilities, 'capabilityCode');
  const practiceBindings = registryIndex(context.practiceLearningBindingRegistry.bindings, 'bindingCode');
  const assessments = registryIndex(context.assessmentRegistry.assessments, 'assessmentCode');
  const types = registryIndex(context.assessmentTypeRegistry.assessmentTypes, 'assessmentTypeCode');
  const bindingCodes = registry.bindings.map(item => item.bindingCode);
  const lessonCodes = registry.bindings.map(item => item.lessonCode);
  if (!unique(bindingCodes)) return 'DUPLICATE_ASSESSMENT_LEARNING_BINDING_CODE';
  if (!unique(lessonCodes)) return 'DUPLICATE_ASSESSMENT_LEARNING_LESSON_BINDING';
  for (const binding of registry.bindings) {
    if (!validateRequired(binding, registry.requiredBindingFields)) return 'UNRESOLVED_ASSESSMENT_LEARNING_BINDING_FIELDS';
    const assessment = assessments.get(binding.assessmentCode);
    const type = types.get(binding.assessmentTypeCode);
    const practiceBinding = practiceBindings.get(binding.practiceLearningBindingCode);
    if (!lessons.has(binding.lessonCode) || !capabilities.has(binding.capabilityCode) ||
        !assessment || !type || !practiceBinding || assessment.lessonCode !== binding.lessonCode ||
        assessment.capabilityCode !== binding.capabilityCode || assessment.assessmentTypeCode !== binding.assessmentTypeCode ||
        assessment.practiceLearningBindingCode !== binding.practiceLearningBindingCode ||
        practiceBinding.lessonCode !== binding.lessonCode ||
        binding.feedbackContractCode !== context.learningFeedbackContract.contractCode ||
        binding.evidenceHandoffContractCode !== context.assessmentEvidenceRdgHandoffContract.contractCode) {
      return 'DANGLING_OR_MISMATCHED_ASSESSMENT_LEARNING_BINDING';
    }
    if (binding.bindingStatus !== 'APPROVED' ||
        binding.deliveryActivationState !== 'CONTENT_SEMANTICS_READY_DELIVERY_BLOCKED') {
      return 'UNKNOWN_ASSESSMENT_LEARNING_BINDING_STATE';
    }
  }
  if (!sameSet(lessonCodes, [...lessons.keys()]) ||
      !sameSet(registry.bindings.map(item => item.capabilityCode), [...capabilities.keys()]) ||
      !sameSet(registry.bindings.map(item => item.practiceLearningBindingCode), [...practiceBindings.keys()]) ||
      !sameSet(registry.bindings.map(item => item.assessmentCode), [...assessments.keys()]) ||
      !sameSet(registry.bindings.map(item => item.assessmentTypeCode), [...types.keys()])) {
    return 'ASSESSMENT_LEARNING_BINDING_RECIPROCITY_FAILURE';
  }
  return 'VALID_ASSESSMENT_LEARNING_BINDINGS';
}

export function validateAssessmentRuntime(context) {
  const results = [
    validateAssessmentTypeRegistry(context),
    validateAssessmentIntegrityRuleRegistry(context),
    validateAssessmentRegistry(context),
    validateLearningFeedbackRegistry(context),
    validateAssessmentLearningBindings(context)
  ];
  return results.find(result => !result.startsWith('VALID_')) ?? 'VALID_ASSESSMENT_RUNTIME';
}

export function validateAssessmentIntegrity(context, input = {}) {
  const contract = context.assessmentIntegrityContract;
  if (hasForbiddenFieldDeep(input, new Set(contract?.forbiddenEvaluationInputFields ?? []))) {
    return 'DENY_FORBIDDEN_INPUT_FIELD';
  }
  if (!validateRequired(input, contract?.requiredEvaluationInputFields) ||
      !sameSet(Object.keys(input), contract.requiredEvaluationInputFields)) return 'DENY_FINDING_SHAPE';
  const assessment = context.assessmentRegistry?.assessments?.find(item => item.assessmentCode === input.assessmentCode);
  if (!assessment) return 'DENY_UNKNOWN_ASSESSMENT';
  if (assessment.assessmentVersion !== input.assessmentVersion) return 'DENY_VERSION_MISMATCH';
  if (assessment.assessmentTypeCode !== input.assessmentTypeCode) return 'DENY_TYPE_MISMATCH';
  if (assessment.scenarioVersion !== input.scenarioVersion) return 'DENY_SCENARIO_VERSION_MISMATCH';
  if (assessment.status !== 'APPROVED' ||
      assessment.deliveryActivationState !== 'CONTENT_SEMANTICS_READY_DELIVERY_BLOCKED') {
    return 'DENY_INACTIVE_DEFINITION';
  }
  if (!Array.isArray(input.criterionFindings) ||
      !unique(input.criterionFindings.map(item => item.criterionCode)) ||
      !sameSet(input.criterionFindings.map(item => item.criterionCode),
        assessment.criterionRubrics.map(item => item.criterionCode))) return 'DENY_CRITERION_COVERAGE';
  for (const finding of input.criterionFindings) {
    if (!validateRequired(finding, contract.requiredCriterionFindingFields) ||
        !sameSet(Object.keys(finding), contract.requiredCriterionFindingFields) ||
        ['evidencePresent', 'unknownsPreserved', 'constraintsCorrect', 'interpretationBounded', 'boundaryPreserved']
          .some(field => typeof finding[field] !== 'boolean') ||
        !(contract.supportLevels ?? []).includes(finding.supportLevel)) return 'DENY_FINDING_SHAPE';
  }
  return 'INTEGRITY_VALID';
}

const resolveFeedbackDefinition = (registry, finding) => {
  for (const code of registry.evaluationPriority) {
    const definition = registry.feedbackDefinitions.find(item => item.feedbackCode === code);
    if (finding[definition.triggerDimension] === definition.triggerValue) return definition;
  }
  return null;
};

export function evaluateAssessment(context, input = {}) {
  if (validateAssessmentRuntime(context) !== 'VALID_ASSESSMENT_RUNTIME') {
    return { decision: 'DENY_INVALID_ASSESSMENT_RUNTIME' };
  }
  const integrityDecision = validateAssessmentIntegrity(context, input);
  if (integrityDecision !== 'INTEGRITY_VALID') return { decision: integrityDecision };
  const assessment = context.assessmentRegistry.assessments.find(item => item.assessmentCode === input.assessmentCode);
  const findings = registryIndex(input.criterionFindings, 'criterionCode');
  const criterionFeedbackResults = assessment.criterionRubrics.map(rubric => {
    const definition = resolveFeedbackDefinition(context.learningFeedbackRegistry, findings.get(rubric.criterionCode));
    return definition ? {
      criterionCode: rubric.criterionCode,
      learningObjectiveCode: rubric.learningObjectiveCode,
      feedbackCode: definition.feedbackCode,
      criterionEvidenceStatus: definition.criterionEvidenceStatus,
      directiveCode: definition.directiveCode
    } : null;
  });
  if (criterionFeedbackResults.includes(null)) return { decision: 'DENY_FEEDBACK_RESOLUTION' };
  const aggregateFeedbackCode = context.learningFeedbackRegistry.evaluationPriority.find(code =>
    criterionFeedbackResults.some(item => item.feedbackCode === code)
  );
  return {
    decision: 'ASSESSMENT_EVALUATED_SEMANTIC_NO_PERSISTENCE',
    integrityDecision,
    assessmentCode: assessment.assessmentCode,
    assessmentVersion: assessment.assessmentVersion,
    assessmentTypeCode: assessment.assessmentTypeCode,
    practiceCode: assessment.practiceCode,
    capabilityCode: assessment.capabilityCode,
    criterionFeedbackResults,
    aggregateFeedbackCode,
    capabilityStateEffect: 'NONE',
    persistenceEffect: 'NONE'
  };
}

export function buildLessonAssessmentProjection(context, lessonCode) {
  if (validateAssessmentRuntime(context) !== 'VALID_ASSESSMENT_RUNTIME') return null;
  const binding = context.assessmentLearningBindingRegistry.bindings.find(item => item.lessonCode === lessonCode);
  const lesson = context.lessonRegistry.lessons.find(item => item.lessonCode === lessonCode);
  if (!binding || !lesson) return null;
  return {
    lesson: structuredClone(lesson),
    binding: structuredClone(binding),
    assessment: structuredClone(context.assessmentRegistry.assessments.find(item =>
      item.assessmentCode === binding.assessmentCode)),
    assessmentType: structuredClone(context.assessmentTypeRegistry.assessmentTypes.find(item =>
      item.assessmentTypeCode === binding.assessmentTypeCode))
  };
}

export function buildAssessmentEvidenceRdgHandoff(context, evaluation = {}, input = {}) {
  const contract = context.assessmentEvidenceRdgHandoffContract;
  if (validateAssessmentRuntime(context) !== 'VALID_ASSESSMENT_RUNTIME') {
    return { decision: 'DENY_INVALID_ASSESSMENT_RUNTIME' };
  }
  if (hasForbiddenFieldDeep(evaluation, new Set(contract?.forbiddenHandoffFields ?? [])) ||
      hasForbiddenFieldDeep(input, new Set(contract?.forbiddenHandoffFields ?? []))) {
    return { decision: 'DENY_HANDOFF_DATA_OR_AUTHORITY_FIELD' };
  }
  if (evaluation.decision !== 'ASSESSMENT_EVALUATED_SEMANTIC_NO_PERSISTENCE') {
    return { decision: 'DENY_UNRESOLVED_ASSESSMENT_EVALUATION' };
  }
  if (!validateRequired(input, contract.requiredHandoffInputFields) ||
      !sameSet(Object.keys(input), contract.requiredHandoffInputFields)) {
    return { decision: 'DENY_UNRESOLVED_HANDOFF_FIELDS' };
  }
  if (input.permissionDecision === 'DENY') return { decision: 'DENY_PERMISSION' };
  if (input.permissionDecision !== 'ALLOW_FOR_RDG_HANDOFF') return { decision: 'DENY_UNKNOWN_PERMISSION' };
  if (!input.assessmentEvidenceCode.startsWith(contract.identityPrefix) ||
      !/^ALR-AE-[A-Z0-9-]+$/.test(input.assessmentEvidenceCode)) {
    return { decision: 'DENY_ASSESSMENT_EVIDENCE_IDENTITY' };
  }
  const assessment = context.assessmentRegistry.assessments.find(item => item.assessmentCode === evaluation.assessmentCode);
  if (!assessment || assessment.assessmentVersion !== evaluation.assessmentVersion ||
      assessment.assessmentTypeCode !== evaluation.assessmentTypeCode ||
      assessment.capabilityCode !== evaluation.capabilityCode ||
      assessment.practiceCode !== evaluation.practiceCode) {
    return { decision: 'DENY_ASSESSMENT_EVALUATION_REFERENCE_MISMATCH' };
  }
  if (!Array.isArray(evaluation.criterionFeedbackResults) ||
      !sameSet(evaluation.criterionFeedbackResults.map(item => item.criterionCode),
        assessment.criterionRubrics.map(item => item.criterionCode)) ||
      evaluation.criterionFeedbackResults.some(item =>
        contract.criterionStatusMapping[item.feedbackCode] !== item.criterionEvidenceStatus)) {
    return { decision: 'DENY_FEEDBACK_EVIDENCE_MAPPING' };
  }
  const lineageReferences = [input.learningRecordReference, input.practiceAttemptReference,
    input.assessmentResponseReference, `${assessment.assessmentCode}@${assessment.assessmentVersion}`];
  if (!unique(lineageReferences)) return { decision: 'DENY_LINEAGE_REFERENCE_COLLISION' };
  const handoff = {
    assessmentEvidenceCode: input.assessmentEvidenceCode,
    recordType: 'ASSESSMENT_RESULT',
    assessmentReference: assessment.assessmentCode,
    assessmentVersion: assessment.assessmentVersion,
    practiceReference: assessment.practiceCode,
    capabilityReference: assessment.capabilityCode,
    learningRecordReference: input.learningRecordReference,
    responseReference: input.assessmentResponseReference,
    criterionResults: evaluation.criterionFeedbackResults.map(item => ({
      criterionCode: item.criterionCode,
      status: item.criterionEvidenceStatus
    })),
    feedbackResults: evaluation.criterionFeedbackResults.map(item => ({
      criterionCode: item.criterionCode,
      feedbackCode: item.feedbackCode,
      directiveCode: item.directiveCode
    })),
    lineageReferences,
    recordedAt: input.recordedAt,
    sensitivityClass: input.sensitivityClass,
    retentionClass: input.retentionClass,
    handoffState: 'READY_FOR_RDG_ELIGIBILITY_REVIEW',
    materializationState: 'NOT_MATERIALIZED_ALR_HANDOFF_ONLY',
    semanticAuthority: 'ALR',
    dataGovernanceAuthority: 'RDG'
  };
  if (!validateRequired(handoff, contract.requiredHandoffOutputFields)) {
    return { decision: 'DENY_UNRESOLVED_HANDOFF_OUTPUT' };
  }
  return { decision: 'READY_FOR_RDG_ELIGIBILITY_REVIEW', handoff };
}

export function evaluateAssessmentDeliveryEligibility(context, input = {}) {
  const contracts = [context.assessmentContract, context.assessmentIntegrityContract,
    context.learningFeedbackContract, context.assessmentEvidenceRdgHandoffContract];
  const forbidden = new Set(contracts.flatMap(contract => [
    ...(contract?.forbiddenAssessmentFields ?? []),
    ...(contract?.forbiddenEvaluationInputFields ?? []),
    ...(contract?.forbiddenFeedbackFields ?? []),
    ...(contract?.forbiddenHandoffFields ?? [])
  ]));
  if (hasForbiddenFieldDeep(input, forbidden)) return 'DENY_LEARNER_DATA_OR_AUTHORITY_FIELD';
  if (input.requestedActivationState === 'CONTENT_SEMANTICS_READY_DELIVERY_BLOCKED') {
    return 'CONTENT_SEMANTICS_READY_DELIVERY_BLOCKED';
  }
  if (input.requestedActivationState !== 'DELIVERY_ELIGIBLE') return 'DENY_UNKNOWN_ACTIVATION_STATE';
  const gates = ['assessmentDefinitionReady', 'integrityReady', 'feedbackReady',
    'rdgPermissionResolved', 'rdgPersistenceReady'];
  if (gates.some(gate => input[gate] !== true)) return 'DENY_DELIVERY_GATES';
  if (contracts.some(contract => contract?.activation?.learnerDeliveryRuntimeActive !== true)) {
    return 'DENY_RUNTIME_NOT_ACTIVATED';
  }
  return 'DELIVERY_ELIGIBLE';
}
