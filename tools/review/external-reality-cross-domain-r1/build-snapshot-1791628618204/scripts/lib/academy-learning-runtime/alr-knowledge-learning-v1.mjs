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

const lessonMaps = context => ({
  lessons: new Map((context.lessonRegistry?.lessons ?? []).map(item => [item.lessonCode, item])),
  objectives: new Map((context.learningObjectiveRegistry?.learningObjectives ?? [])
    .map(item => [item.learningObjectiveCode, item]))
});

const objectivesMatchLesson = (lesson, objectiveCodes, objectives) =>
  Array.isArray(objectiveCodes) && objectiveCodes.length > 0 && unique(objectiveCodes) &&
  sameSet(objectiveCodes, lesson?.learningObjectiveCodes ?? []) &&
  objectiveCodes.every(code => objectives.get(code)?.lessonCode === lesson.lessonCode);

const validState = (item, contract) =>
  (contract?.statusValues ?? []).includes(item.status) &&
  (contract?.deliveryActivationStates ?? []).includes(item.deliveryActivationState);

const articleReferenceKey = item => [item.articleCode, item.locale, item.version, item.href].join('|');

export function validateKnowledgeProjectionRegistry(context) {
  const { knowledgeProjectionContract: contract, knowledgeProjectionRegistry: registry } = context;
  const projections = registry?.projections;
  if (!Array.isArray(projections) || projections.length === 0) return 'EMPTY_KNOWLEDGE_PROJECTION_REGISTRY';
  const { lessons, objectives } = lessonMaps(context);
  const publishedNodes = context.publishedNodes?.records ?? [];
  const publishedArticles = context.publishedArticles?.records ?? [];
  const forbidden = new Set(contract?.forbiddenProjectionFields ?? []);
  const codes = projections.map(item => item.projectionCode);
  const targetLessons = projections.map(item => item.lessonCode);
  if (!unique(codes)) return 'DUPLICATE_KNOWLEDGE_PROJECTION_CODE';
  if (!unique(targetLessons)) return 'DUPLICATE_KNOWLEDGE_PROJECTION_LESSON';

  for (const projection of projections) {
    if (!validateRequired(projection, contract?.requiredProjectionFields)) {
      return 'UNRESOLVED_KNOWLEDGE_PROJECTION_FIELDS';
    }
    if (!projection.projectionCode.startsWith(contract.identityPrefix)) return 'INVALID_KNOWLEDGE_PROJECTION_IDENTITY';
    if (projection.authorityReference !== 'ALR' || projection.sourceAuthorityReference !== contract.sourceAuthority) {
      return 'DENY_KNOWLEDGE_PROJECTION_AUTHORITY';
    }
    if (hasForbiddenFieldDeep(projection, forbidden)) return 'DENY_KNOWLEDGE_BODY_DATA_OR_AUTHORITY_FIELD';
    if (!validState(projection, contract)) return 'UNKNOWN_KNOWLEDGE_PROJECTION_STATE';
    if (!(contract.transformationModes ?? []).includes(projection.transformationMode) ||
        !(contract.sourceEligibilityStates ?? []).includes(projection.sourceEligibilityState)) {
      return 'DENY_KNOWLEDGE_PROJECTION_MODE';
    }
    if (!Array.isArray(projection.excludedClaims) || projection.excludedClaims.length === 0 ||
        !unique(projection.excludedClaims)) return 'UNRESOLVED_EXCLUDED_CLAIMS';
    const lesson = lessons.get(projection.lessonCode);
    if (!lesson || !objectivesMatchLesson(lesson, projection.learningObjectiveCodes, objectives)) {
      return 'UNKNOWN_KNOWLEDGE_PROJECTION_LESSON_OR_OBJECTIVE';
    }
    const nodeRecords = publishedNodes.filter(item =>
      item.nodeCode === projection.sourceNodeCode && item.publicationStatus === 'published'
    );
    const articleRecords = publishedArticles.filter(item =>
      item.nodeCode === projection.sourceNodeCode && item.publicationStatus === 'published'
    );
    if (nodeRecords.length === 0 || articleRecords.length === 0) return 'DENY_UNPUBLISHED_KNOWLEDGE_SOURCE';
    if (!Array.isArray(projection.sourceArticleReferences) ||
        !sameSet(projection.sourceArticleReferences.map(articleReferenceKey), articleRecords.map(articleReferenceKey)) ||
        !sameSet(projection.sourceArticleReferences.map(item => `${item.articleCode}|${item.locale}`),
          nodeRecords.map(item => `${item.articleCode}|${item.locale}`))) {
      return 'PUBLISHED_ARTICLE_REFERENCE_MISMATCH';
    }
  }
  if (!sameSet(targetLessons, [...lessons.keys()])) return 'KNOWLEDGE_PROJECTION_LESSON_COVERAGE_FAILURE';
  return 'VALID_KNOWLEDGE_PROJECTION_REGISTRY';
}

export function validateTeachingExplanationRegistry(context) {
  const { teachingExplanationContract: contract, teachingExplanationRegistry: registry } = context;
  if (!validatesTypeAuthority(context.typeRegistry, 'TEACHING_EXPLANATION', 'ALR-W16')) {
    return 'DENY_TEACHING_EXPLANATION_TYPE_AUTHORITY';
  }
  const explanations = registry?.teachingExplanations;
  if (!Array.isArray(explanations) || explanations.length === 0) return 'EMPTY_TEACHING_EXPLANATION_REGISTRY';
  const projectionResult = validateKnowledgeProjectionRegistry(context);
  if (projectionResult !== 'VALID_KNOWLEDGE_PROJECTION_REGISTRY') return projectionResult;
  const projections = new Map(context.knowledgeProjectionRegistry.projections
    .map(item => [item.projectionCode, item]));
  const forbidden = new Set(contract?.forbiddenExplanationFields ?? []);
  const codes = explanations.map(item => item.teachingExplanationCode);
  const projectionCodes = explanations.map(item => item.knowledgeProjectionCode);
  if (!unique(codes)) return 'DUPLICATE_TEACHING_EXPLANATION_CODE';
  if (!unique(projectionCodes)) return 'DUPLICATE_TEACHING_EXPLANATION_PROJECTION';

  for (const explanation of explanations) {
    if (!validateRequired(explanation, contract?.requiredExplanationFields)) {
      return 'UNRESOLVED_TEACHING_EXPLANATION_FIELDS';
    }
    if (!explanation.teachingExplanationCode.startsWith(contract.identityPrefix)) {
      return 'INVALID_TEACHING_EXPLANATION_IDENTITY';
    }
    if (explanation.authorityReference !== 'ALR') return 'DENY_TEACHING_EXPLANATION_AUTHORITY';
    if (hasForbiddenFieldDeep(explanation, forbidden)) return 'DENY_TEACHING_KNOWLEDGE_DATA_OR_AUTHORITY_FIELD';
    if (!validState(explanation, contract) || !(contract.explanationModes ?? []).includes(explanation.explanationMode)) {
      return 'UNKNOWN_TEACHING_EXPLANATION_STATE_OR_MODE';
    }
    if (!Array.isArray(explanation.teachingMoves) || explanation.teachingMoves.length === 0 ||
        !Array.isArray(explanation.governanceReferences) || explanation.governanceReferences.length === 0 ||
        !Array.isArray(explanation.localeAvailability) || explanation.localeAvailability.length === 0) {
      return 'UNRESOLVED_TEACHING_EXPLANATION_CONTENT';
    }
    const projection = projections.get(explanation.knowledgeProjectionCode);
    if (!projection || projection.lessonCode !== explanation.lessonCode ||
        !sameSet(projection.learningObjectiveCodes, explanation.learningObjectiveCodes)) {
      return 'UNKNOWN_TEACHING_PROJECTION_LESSON_OR_OBJECTIVE';
    }
  }
  if (!sameSet(projectionCodes, [...projections.keys()])) return 'TEACHING_PROJECTION_COVERAGE_FAILURE';
  return 'VALID_TEACHING_EXPLANATION_REGISTRY';
}

export function validateExampleRegistry(context) {
  const { exampleContract: contract, exampleRegistry: registry } = context;
  if (!validatesTypeAuthority(context.typeRegistry, 'EXAMPLE', 'ALR-W17')) return 'DENY_EXAMPLE_TYPE_AUTHORITY';
  const examples = registry?.examples;
  if (!Array.isArray(examples) || examples.length === 0) return 'EMPTY_EXAMPLE_REGISTRY';
  const explanationResult = validateTeachingExplanationRegistry(context);
  if (explanationResult !== 'VALID_TEACHING_EXPLANATION_REGISTRY') return explanationResult;
  const explanations = new Map(context.teachingExplanationRegistry.teachingExplanations
    .map(item => [item.teachingExplanationCode, item]));
  const forbidden = new Set(contract?.forbiddenExampleFields ?? []);
  const codes = examples.map(item => item.exampleCode);
  const explanationCodes = examples.map(item => item.teachingExplanationCode);
  if (!unique(codes)) return 'DUPLICATE_EXAMPLE_CODE';
  if (!unique(explanationCodes)) return 'DUPLICATE_EXAMPLE_EXPLANATION';

  for (const example of examples) {
    if (!validateRequired(example, contract?.requiredExampleFields)) return 'UNRESOLVED_EXAMPLE_FIELDS';
    if (!example.exampleCode.startsWith(contract.identityPrefix)) return 'INVALID_EXAMPLE_IDENTITY';
    if (example.authorityReference !== 'ALR') return 'DENY_EXAMPLE_AUTHORITY';
    if (hasForbiddenFieldDeep(example, forbidden)) return 'DENY_EXAMPLE_PERSONAL_CASE_OR_AUTHORITY_FIELD';
    if (!validState(example, contract) || !(contract.exampleModes ?? []).includes(example.exampleMode) ||
        !(contract.fictionalityValues ?? []).includes(example.fictionality) ||
        !(contract.personalDataStates ?? []).includes(example.personalDataState)) {
      return 'UNKNOWN_EXAMPLE_STATE_OR_MODE';
    }
    if (!validateRequired(example.scenarioFrame, contract.requiredScenarioFrameFields) ||
        !Array.isArray(example.scenarioFrame.availableSignals) || example.scenarioFrame.availableSignals.length === 0 ||
        !Array.isArray(example.localeAvailability) || example.localeAvailability.length === 0) {
      return 'UNRESOLVED_EXAMPLE_SCENARIO';
    }
    const explanation = explanations.get(example.teachingExplanationCode);
    if (!explanation || explanation.lessonCode !== example.lessonCode ||
        !sameSet(explanation.learningObjectiveCodes, example.learningObjectiveCodes)) {
      return 'UNKNOWN_EXAMPLE_EXPLANATION_LESSON_OR_OBJECTIVE';
    }
  }
  if (!sameSet(explanationCodes, [...explanations.keys()])) return 'EXAMPLE_EXPLANATION_COVERAGE_FAILURE';
  return 'VALID_EXAMPLE_REGISTRY';
}

export function validateCaseStudyRegistry(context) {
  const { caseStudyContract: contract, caseStudyRegistry: registry } = context;
  if (!validatesTypeAuthority(context.typeRegistry, 'CASE_STUDY', 'ALR-W18')) {
    return 'DENY_CASE_STUDY_TYPE_AUTHORITY';
  }
  const caseStudies = registry?.caseStudies;
  if (!Array.isArray(caseStudies) || caseStudies.length === 0) return 'EMPTY_CASE_STUDY_REGISTRY';
  const exampleResult = validateExampleRegistry(context);
  if (exampleResult !== 'VALID_EXAMPLE_REGISTRY') return exampleResult;
  const examples = new Map(context.exampleRegistry.examples.map(item => [item.exampleCode, item]));
  const explanations = new Map(context.teachingExplanationRegistry.teachingExplanations
    .map(item => [item.teachingExplanationCode, item]));
  const forbidden = new Set(contract?.forbiddenCaseStudyFields ?? []);
  const codes = caseStudies.map(item => item.caseStudyCode);
  const exampleCodes = caseStudies.map(item => item.exampleCode);
  if (!unique(codes)) return 'DUPLICATE_CASE_STUDY_CODE';
  if (!unique(exampleCodes)) return 'DUPLICATE_CASE_STUDY_EXAMPLE';

  for (const caseStudy of caseStudies) {
    if (!validateRequired(caseStudy, contract?.requiredCaseStudyFields)) return 'UNRESOLVED_CASE_STUDY_FIELDS';
    if (!caseStudy.caseStudyCode.startsWith(contract.identityPrefix)) return 'INVALID_CASE_STUDY_IDENTITY';
    if (caseStudy.authorityReference !== 'ALR') return 'DENY_CASE_STUDY_AUTHORITY';
    if (hasForbiddenFieldDeep(caseStudy, forbidden)) return 'DENY_CASE_STUDY_REALITY_ICR_OR_AUTHORITY_FIELD';
    if (!validState(caseStudy, contract) || !(contract.caseStudyModes ?? []).includes(caseStudy.caseStudyMode) ||
        !(contract.dataClassifications ?? []).includes(caseStudy.dataClassification) ||
        !(contract.icrBoundaryStates ?? []).includes(caseStudy.icrBoundaryState)) {
      return 'UNKNOWN_CASE_STUDY_STATE_OR_MODE';
    }
    if (!validateRequired(caseStudy.evidencePacket, contract.requiredEvidencePacketFields) ||
        (contract.requiredEvidencePacketFields ?? []).some(field =>
          !Array.isArray(caseStudy.evidencePacket[field]) || caseStudy.evidencePacket[field].length === 0
        ) || !Array.isArray(caseStudy.analysisPrompts) || caseStudy.analysisPrompts.length === 0 ||
        !Array.isArray(caseStudy.localeAvailability) || caseStudy.localeAvailability.length === 0) {
      return 'UNRESOLVED_CASE_STUDY_ANALYSIS';
    }
    const example = examples.get(caseStudy.exampleCode);
    const explanation = explanations.get(caseStudy.teachingExplanationCode);
    if (!example || !explanation || example.teachingExplanationCode !== caseStudy.teachingExplanationCode ||
        example.lessonCode !== caseStudy.lessonCode || explanation.lessonCode !== caseStudy.lessonCode ||
        !sameSet(example.learningObjectiveCodes, caseStudy.learningObjectiveCodes) ||
        !sameSet(explanation.learningObjectiveCodes, caseStudy.learningObjectiveCodes)) {
      return 'UNKNOWN_CASE_STUDY_EXAMPLE_EXPLANATION_LESSON_OR_OBJECTIVE';
    }
  }
  if (!sameSet(exampleCodes, [...examples.keys()])) return 'CASE_STUDY_EXAMPLE_COVERAGE_FAILURE';
  return 'VALID_CASE_STUDY_REGISTRY';
}

export function evaluateFigureLearningProjectionEligibility(context, projection = {}) {
  const contract = context.figureLearningProjectionContract;
  if (hasForbiddenFieldDeep(projection, new Set(contract?.forbiddenProjectionFields ?? []))) {
    return 'DENY_ASSET_PAYLOAD_OR_PRESENTATION_OWNERSHIP';
  }
  const publication = (context.publishedAssetRegistry?.publications ?? [])
    .find(item => item.assetCode === projection.publishedAssetCode);
  if (!publication || publication.publicationState !== 'published') return 'DENY_ASSET_NOT_PUBLISHED';
  if (!(contract?.eligiblePublishedAssetTypes ?? []).includes(publication.assetType)) return 'DENY_ASSET_TYPE';
  const { lessons, objectives } = lessonMaps(context);
  const lesson = lessons.get(projection.lessonCode);
  if (!lesson || !objectivesMatchLesson(lesson, projection.learningObjectiveCodes, objectives)) {
    return 'DENY_UNKNOWN_LESSON_OR_OBJECTIVE';
  }
  return 'ALLOW_PUBLISHED_FIGURE_REFERENCE';
}

export function validateFigureLearningProjectionRegistry(context) {
  const { figureLearningProjectionContract: contract, figureLearningProjectionRegistry: registry } = context;
  if (!validatesTypeAuthority(context.typeRegistry, 'FIGURE_LEARNING_PROJECTION', 'ALR-W19')) {
    return 'DENY_FIGURE_PROJECTION_TYPE_AUTHORITY';
  }
  const projections = registry?.figureLearningProjections;
  if (!Array.isArray(projections)) return 'UNRESOLVED_FIGURE_PROJECTION_REGISTRY';
  const eligibleAssets = (context.publishedAssetRegistry?.publications ?? []).filter(item =>
    item.publicationState === 'published' && (contract?.eligiblePublishedAssetTypes ?? []).includes(item.assetType)
  );
  if (projections.length === 0) {
    if (eligibleAssets.length > 0) return 'EMPTY_FIGURE_PROJECTION_REGISTRY_WITH_ELIGIBLE_ASSET';
    if (registry.populationState !== 'EMPTY_FAIL_CLOSED_NO_PUBLISHED_CAR_FIGURE_OR_DIAGRAM') {
      return 'INVALID_EMPTY_FIGURE_PROJECTION_STATE';
    }
    return 'VALID_EMPTY_FIGURE_PROJECTION_REGISTRY';
  }
  const codes = projections.map(item => item.figureLearningProjectionCode);
  if (!unique(codes)) return 'DUPLICATE_FIGURE_PROJECTION_CODE';
  for (const projection of projections) {
    if (!validateRequired(projection, contract?.requiredProjectionFields)) return 'UNRESOLVED_FIGURE_PROJECTION_FIELDS';
    if (!projection.figureLearningProjectionCode.startsWith(contract.identityPrefix)) {
      return 'INVALID_FIGURE_PROJECTION_IDENTITY';
    }
    if (projection.authorityReference !== 'ALR') return 'DENY_FIGURE_PROJECTION_AUTHORITY';
    if (!validState(projection, contract)) return 'UNKNOWN_FIGURE_PROJECTION_STATE';
    const decision = evaluateFigureLearningProjectionEligibility(context, projection);
    if (decision !== 'ALLOW_PUBLISHED_FIGURE_REFERENCE') return decision;
  }
  return 'VALID_FIGURE_PROJECTION_REGISTRY';
}

const registryIndex = (items, codeField) => new Map(items.map(item => [item[codeField], item]));

export function validateKnowledgeLearningBindings(context) {
  const registry = context.knowledgeLearningBindingRegistry;
  if (!registry || !Array.isArray(registry.bindings) || registry.bindings.length === 0) {
    return 'EMPTY_KNOWLEDGE_LEARNING_BINDING_REGISTRY';
  }
  const required = registry.requiredBindingFields ?? [];
  const lessons = registryIndex(context.lessonRegistry?.lessons ?? [], 'lessonCode');
  const groups = [
    ['knowledgeProjectionCodes', registryIndex(context.knowledgeProjectionRegistry?.projections ?? [], 'projectionCode')],
    ['teachingExplanationCodes', registryIndex(context.teachingExplanationRegistry?.teachingExplanations ?? [], 'teachingExplanationCode')],
    ['exampleCodes', registryIndex(context.exampleRegistry?.examples ?? [], 'exampleCode')],
    ['caseStudyCodes', registryIndex(context.caseStudyRegistry?.caseStudies ?? [], 'caseStudyCode')],
    ['figureLearningProjectionCodes', registryIndex(context.figureLearningProjectionRegistry?.figureLearningProjections ?? [], 'figureLearningProjectionCode')]
  ];
  const bindingCodes = registry.bindings.map(item => item.bindingCode);
  const lessonCodes = registry.bindings.map(item => item.lessonCode);
  if (!unique(bindingCodes)) return 'DUPLICATE_KNOWLEDGE_LEARNING_BINDING_CODE';
  if (!unique(lessonCodes)) return 'DUPLICATE_KNOWLEDGE_LEARNING_LESSON_BINDING';
  for (const binding of registry.bindings) {
    if (!validateRequired(binding, required)) return 'UNRESOLVED_KNOWLEDGE_LEARNING_BINDING_FIELDS';
    if (!lessons.has(binding.lessonCode)) return 'UNKNOWN_KNOWLEDGE_LEARNING_BINDING_LESSON';
    if (binding.bindingStatus !== 'APPROVED' ||
        binding.deliveryActivationState !== 'CONTENT_STRUCTURE_READY_DELIVERY_BLOCKED') {
      return 'UNKNOWN_KNOWLEDGE_LEARNING_BINDING_STATE';
    }
    for (const [field, index] of groups) {
      const references = binding[field];
      if (!Array.isArray(references) || !unique(references)) return 'INVALID_KNOWLEDGE_LEARNING_BINDING_REFERENCES';
      if (field !== 'figureLearningProjectionCodes' && references.length !== 1) {
        return 'INVALID_KNOWLEDGE_LEARNING_BINDING_CARDINALITY';
      }
      if (references.some(code => !index.has(code) || index.get(code).lessonCode !== binding.lessonCode)) {
        return 'DANGLING_OR_MISMATCHED_KNOWLEDGE_LEARNING_BINDING';
      }
    }
  }
  if (!sameSet(lessonCodes, [...lessons.keys()])) return 'KNOWLEDGE_LEARNING_BINDING_LESSON_COVERAGE_FAILURE';
  for (const [field, index] of groups) {
    const referenced = registry.bindings.flatMap(binding => binding[field]);
    if (!sameSet(referenced, [...index.keys()])) return 'KNOWLEDGE_LEARNING_BINDING_RECIPROCITY_FAILURE';
  }
  return 'VALID_KNOWLEDGE_LEARNING_BINDINGS';
}

export function validateKnowledgeLearningRuntime(context) {
  const results = [
    validateKnowledgeProjectionRegistry(context),
    validateTeachingExplanationRegistry(context),
    validateExampleRegistry(context),
    validateCaseStudyRegistry(context),
    validateFigureLearningProjectionRegistry(context),
    validateKnowledgeLearningBindings(context)
  ];
  const failure = results.find(result => !result.startsWith('VALID_'));
  return failure ?? 'VALID_KNOWLEDGE_LEARNING_RUNTIME';
}

export function buildLessonKnowledgeLearningProjection(context, lessonCode) {
  if (validateKnowledgeLearningRuntime(context) !== 'VALID_KNOWLEDGE_LEARNING_RUNTIME') return null;
  const binding = context.knowledgeLearningBindingRegistry.bindings.find(item => item.lessonCode === lessonCode);
  const lesson = context.lessonRegistry.lessons.find(item => item.lessonCode === lessonCode);
  if (!binding || !lesson) return null;
  const select = (items, field, codes) => structuredClone(items.filter(item => codes.includes(item[field])));
  return {
    lesson: structuredClone(lesson),
    binding: structuredClone(binding),
    knowledgeProjections: select(context.knowledgeProjectionRegistry.projections, 'projectionCode', binding.knowledgeProjectionCodes),
    teachingExplanations: select(context.teachingExplanationRegistry.teachingExplanations, 'teachingExplanationCode', binding.teachingExplanationCodes),
    examples: select(context.exampleRegistry.examples, 'exampleCode', binding.exampleCodes),
    caseStudies: select(context.caseStudyRegistry.caseStudies, 'caseStudyCode', binding.caseStudyCodes),
    figureLearningProjections: select(context.figureLearningProjectionRegistry.figureLearningProjections,
      'figureLearningProjectionCode', binding.figureLearningProjectionCodes)
  };
}

export function evaluateKnowledgeLearningDeliveryEligibility(context, input = {}) {
  const contracts = [
    context.knowledgeProjectionContract,
    context.teachingExplanationContract,
    context.exampleContract,
    context.caseStudyContract,
    context.figureLearningProjectionContract
  ];
  const forbidden = new Set(contracts.flatMap(contract => [
    ...(contract?.forbiddenProjectionFields ?? []),
    ...(contract?.forbiddenExplanationFields ?? []),
    ...(contract?.forbiddenExampleFields ?? []),
    ...(contract?.forbiddenCaseStudyFields ?? [])
  ]));
  if (hasForbiddenFieldDeep(input, forbidden)) return 'DENY_LEARNER_CASE_OR_AUTHORITY_DATA';
  if (input.requestedActivationState === 'CONTENT_STRUCTURE_READY_DELIVERY_BLOCKED') {
    return 'CONTENT_READY_DELIVERY_BLOCKED';
  }
  if (input.requestedActivationState !== 'DELIVERY_ELIGIBLE') return 'DENY_UNKNOWN_ACTIVATION_STATE';
  const gates = [
    'knowledgeProjectionReady', 'teachingExplanationReady', 'exampleReady',
    'caseStudyReady', 'figureEligibilityResolved', 'practiceReady',
    'assessmentReady', 'rdgPermissionResolved'
  ];
  if (gates.some(gate => input[gate] !== true)) return 'DENY_DELIVERY_GATES';
  if (contracts.some(contract => contract?.activation?.learnerDeliveryRuntimeActive !== true)) {
    return 'DENY_RUNTIME_NOT_ACTIVATED';
  }
  return 'DELIVERY_ELIGIBLE';
}
