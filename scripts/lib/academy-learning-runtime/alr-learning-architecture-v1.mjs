const hasField = (value, field) => {
  if (!Object.prototype.hasOwnProperty.call(value ?? {}, field)) return false;
  const fieldValue = value[field];
  return fieldValue !== undefined && fieldValue !== null &&
    (typeof fieldValue !== 'string' || fieldValue.trim().length > 0);
};

const unique = values => new Set(values).size === values.length;

const sameSet = (left = [], right = []) =>
  left.length === right.length && [...left].sort().every((value, index) => value === [...right].sort()[index]);

const hasForbiddenFieldDeep = (value, forbidden) => {
  if (Array.isArray(value)) return value.some(item => hasForbiddenFieldDeep(item, forbidden));
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(([key, nested]) =>
    forbidden.has(key) || hasForbiddenFieldDeep(nested, forbidden)
  );
};

const validateRequired = (value, fields = []) => fields.every(field => hasField(value, field));

const validateContiguousSequences = (entries, parentField) => {
  const groups = new Map();
  for (const entry of entries) {
    const parent = entry[parentField];
    if (!groups.has(parent)) groups.set(parent, []);
    groups.get(parent).push(entry.sequence);
  }
  return [...groups.values()].every(sequences =>
    unique(sequences) &&
    sequences.every(Number.isInteger) &&
    sequences.slice().sort((a, b) => a - b).every((sequence, index) => sequence === index + 1)
  );
};

const validateTypeAuthority = (typeRegistry, objectType, ownerWork) => {
  const type = typeRegistry?.objectTypes?.find(item => item.typeCode === objectType);
  return Boolean(type && type.ownerWork === ownerWork && type.contentAuthority === 'ALR');
};

const detectDirectedCycle = (nodes, edges) => {
  const adjacency = new Map(nodes.map(node => [node, []]));
  for (const [from, to] of edges) {
    if (!adjacency.has(from) || !adjacency.has(to)) return true;
    adjacency.get(from).push(to);
  }
  const visiting = new Set();
  const visited = new Set();
  const visit = node => {
    if (visiting.has(node)) return true;
    if (visited.has(node)) return false;
    visiting.add(node);
    for (const next of adjacency.get(node)) if (visit(next)) return true;
    visiting.delete(node);
    visited.add(node);
    return false;
  };
  return nodes.some(visit);
};

export function validateProgramRegistry(context) {
  const { contract, typeRegistry, levelRegistry, capabilityRegistry, programRegistry } = context;
  if (!validateTypeAuthority(typeRegistry, 'PROGRAM', 'ALR-W10')) return 'DENY_PROGRAM_TYPE_AUTHORITY';
  if (!programRegistry || !Array.isArray(programRegistry.programs) || programRegistry.programs.length === 0) {
    return 'EMPTY_PROGRAM_REGISTRY';
  }
  const forbidden = new Set(contract?.forbiddenDefinitionFields ?? []);
  const levels = new Set((levelRegistry?.levels ?? []).map(item => item.levelCode));
  const capabilities = new Set((capabilityRegistry?.capabilities ?? []).map(item => item.capabilityCode));
  const statuses = new Set(contract?.structuralStatusValues ?? []);
  const activations = new Set(contract?.deliveryActivationStates ?? []);
  const codes = programRegistry.programs.map(item => item.programCode);
  if (!unique(codes)) return 'DUPLICATE_PROGRAM_CODE';
  for (const program of programRegistry.programs) {
    if (!validateRequired(program, programRegistry.requiredProgramFields)) return 'UNRESOLVED_PROGRAM_FIELDS';
    if (!program.programCode.startsWith(contract.identityPrefixes.PROGRAM)) return 'INVALID_PROGRAM_IDENTITY';
    if (program.authorityReference !== 'ALR') return 'DENY_PROGRAM_AUTHORITY';
    if (!statuses.has(program.status) || !activations.has(program.deliveryActivationState)) return 'UNKNOWN_PROGRAM_STATE';
    if (hasForbiddenFieldDeep(program, forbidden)) return 'DENY_PROGRAM_DATA_OR_CONTENT_FIELD';
    if (!Array.isArray(program.entryAcademyLevelCodes) || program.entryAcademyLevelCodes.length === 0 ||
        program.entryAcademyLevelCodes.some(level => !levels.has(level))) return 'UNKNOWN_PROGRAM_ENTRY_LEVEL';
    if (!Array.isArray(program.includedAcademyLevelCodes) || program.includedAcademyLevelCodes.length === 0 ||
        !unique(program.includedAcademyLevelCodes) ||
        program.includedAcademyLevelCodes.some(level => !levels.has(level))) return 'UNKNOWN_PROGRAM_LEVEL';
    if (!Array.isArray(program.targetCapabilityCodes) || program.targetCapabilityCodes.length === 0 ||
        !unique(program.targetCapabilityCodes) ||
        program.targetCapabilityCodes.some(code => !capabilities.has(code))) return 'UNKNOWN_PROGRAM_CAPABILITY';
    if (!Array.isArray(program.learningPathCodes) || program.learningPathCodes.length === 0 ||
        !unique(program.learningPathCodes)) return 'INVALID_PROGRAM_PATH_REFERENCES';
    if (!Array.isArray(program.localeAvailability) || program.localeAvailability.length === 0) {
      return 'EMPTY_PROGRAM_LOCALE_AVAILABILITY';
    }
  }
  return 'VALID_PROGRAM_REGISTRY';
}

export function validateLearningPathRegistry(context) {
  const {
    contract, typeRegistry, levelRegistry, trackRegistry,
    capabilityRegistry, programRegistry, learningPathRegistry
  } = context;
  if (!validateTypeAuthority(typeRegistry, 'LEARNING_PATH', 'ALR-W11')) return 'DENY_PATH_TYPE_AUTHORITY';
  if (!learningPathRegistry || !Array.isArray(learningPathRegistry.learningPaths) ||
      learningPathRegistry.learningPaths.length === 0) return 'EMPTY_LEARNING_PATH_REGISTRY';
  const forbidden = new Set(contract?.forbiddenDefinitionFields ?? []);
  const levels = new Set((levelRegistry?.levels ?? []).map(item => item.levelCode));
  const tracks = new Set((trackRegistry?.trackClasses ?? []).map(item => item.trackClass));
  const capabilities = new Map((capabilityRegistry?.capabilities ?? []).map(item => [item.capabilityCode, item]));
  const programs = new Set((programRegistry?.programs ?? []).map(item => item.programCode));
  const statuses = new Set(contract?.structuralStatusValues ?? []);
  const activations = new Set(contract?.deliveryActivationStates ?? []);
  const codes = learningPathRegistry.learningPaths.map(item => item.learningPathCode);
  if (!unique(codes)) return 'DUPLICATE_LEARNING_PATH_CODE';
  const codeSet = new Set(codes);
  for (const learningPath of learningPathRegistry.learningPaths) {
    if (!validateRequired(learningPath, learningPathRegistry.requiredLearningPathFields)) {
      return 'UNRESOLVED_LEARNING_PATH_FIELDS';
    }
    if (!learningPath.learningPathCode.startsWith(contract.identityPrefixes.LEARNING_PATH)) {
      return 'INVALID_LEARNING_PATH_IDENTITY';
    }
    if (!programs.has(learningPath.programCode)) return 'UNKNOWN_LEARNING_PATH_PROGRAM';
    if (!levels.has(learningPath.academyLevelCode)) return 'UNKNOWN_LEARNING_PATH_LEVEL';
    if (!tracks.has(learningPath.trackClass)) return 'UNKNOWN_LEARNING_PATH_TRACK_CLASS';
    if (learningPath.authorityReference !== 'ALR') return 'DENY_LEARNING_PATH_AUTHORITY';
    if (!statuses.has(learningPath.status) || !activations.has(learningPath.deliveryActivationState)) {
      return 'UNKNOWN_LEARNING_PATH_STATE';
    }
    if (hasForbiddenFieldDeep(learningPath, forbidden)) return 'DENY_LEARNING_PATH_DATA_OR_CONTENT_FIELD';
    if (!Array.isArray(learningPath.targetCapabilityCodes) || learningPath.targetCapabilityCodes.length !== 1 ||
        !capabilities.has(learningPath.targetCapabilityCodes[0])) return 'UNKNOWN_LEARNING_PATH_CAPABILITY';
    if (capabilities.get(learningPath.targetCapabilityCodes[0]).academyLevelCode !== learningPath.academyLevelCode) {
      return 'LEARNING_PATH_CAPABILITY_LEVEL_MISMATCH';
    }
    if (!Array.isArray(learningPath.prerequisitePathCodes) || !unique(learningPath.prerequisitePathCodes) ||
        learningPath.prerequisitePathCodes.includes(learningPath.learningPathCode) ||
        learningPath.prerequisitePathCodes.some(code => !codeSet.has(code))) return 'INVALID_PATH_PREREQUISITE';
    if (!Array.isArray(learningPath.moduleCodes) || learningPath.moduleCodes.length === 0 ||
        !unique(learningPath.moduleCodes)) return 'INVALID_PATH_MODULE_REFERENCES';
  }
  if (!validateContiguousSequences(learningPathRegistry.learningPaths, 'programCode')) {
    return 'NON_CONTIGUOUS_LEARNING_PATH_SEQUENCE';
  }
  const edges = learningPathRegistry.learningPaths.flatMap(item =>
    item.prerequisitePathCodes.map(prerequisite => [prerequisite, item.learningPathCode])
  );
  if (detectDirectedCycle(codes, edges)) return 'CYCLIC_LEARNING_PATH_GRAPH';
  return 'VALID_LEARNING_PATH_REGISTRY';
}

export function validateModuleRegistry(context) {
  const { contract, typeRegistry, learningPathRegistry, moduleRegistry } = context;
  if (!validateTypeAuthority(typeRegistry, 'MODULE', 'ALR-W12')) return 'DENY_MODULE_TYPE_AUTHORITY';
  if (!moduleRegistry || !Array.isArray(moduleRegistry.modules) || moduleRegistry.modules.length === 0) {
    return 'EMPTY_MODULE_REGISTRY';
  }
  const forbidden = new Set(contract?.forbiddenDefinitionFields ?? []);
  const paths = new Map((learningPathRegistry?.learningPaths ?? []).map(item => [item.learningPathCode, item]));
  const statuses = new Set(contract?.structuralStatusValues ?? []);
  const activations = new Set(contract?.deliveryActivationStates ?? []);
  const codes = moduleRegistry.modules.map(item => item.moduleCode);
  if (!unique(codes)) return 'DUPLICATE_MODULE_CODE';
  for (const module of moduleRegistry.modules) {
    if (!validateRequired(module, moduleRegistry.requiredModuleFields)) return 'UNRESOLVED_MODULE_FIELDS';
    if (!module.moduleCode.startsWith(contract.identityPrefixes.MODULE)) return 'INVALID_MODULE_IDENTITY';
    const parent = paths.get(module.learningPathCode);
    if (!parent) return 'UNKNOWN_MODULE_LEARNING_PATH';
    if (module.academyLevelCode !== parent.academyLevelCode ||
        !sameSet(module.targetCapabilityCodes, parent.targetCapabilityCodes)) return 'MODULE_PARENT_SEMANTIC_MISMATCH';
    if (module.authorityReference !== 'ALR') return 'DENY_MODULE_AUTHORITY';
    if (!statuses.has(module.status) || !activations.has(module.deliveryActivationState)) return 'UNKNOWN_MODULE_STATE';
    if (hasForbiddenFieldDeep(module, forbidden)) return 'DENY_MODULE_DATA_OR_CONTENT_FIELD';
    if (!Array.isArray(module.lessonCodes) || module.lessonCodes.length === 0 || !unique(module.lessonCodes)) {
      return 'INVALID_MODULE_LESSON_REFERENCES';
    }
  }
  if (!validateContiguousSequences(moduleRegistry.modules, 'learningPathCode')) {
    return 'NON_CONTIGUOUS_MODULE_SEQUENCE';
  }
  return 'VALID_MODULE_REGISTRY';
}

export function validateLessonRegistry(context) {
  const { contract, typeRegistry, moduleRegistry, lessonRegistry } = context;
  if (!validateTypeAuthority(typeRegistry, 'LESSON', 'ALR-W13')) return 'DENY_LESSON_TYPE_AUTHORITY';
  if (!lessonRegistry || !Array.isArray(lessonRegistry.lessons) || lessonRegistry.lessons.length === 0) {
    return 'EMPTY_LESSON_REGISTRY';
  }
  const forbidden = new Set(contract?.forbiddenDefinitionFields ?? []);
  const modules = new Map((moduleRegistry?.modules ?? []).map(item => [item.moduleCode, item]));
  const statuses = new Set(contract?.structuralStatusValues ?? []);
  const activations = new Set(contract?.deliveryActivationStates ?? []);
  const expectedIntegrationKeys = [
    'knowledgeProjections', 'teachingExplanations', 'examples', 'caseStudies',
    'figureLearningProjections', 'practices', 'assessments', 'publishedAssets'
  ];
  const codes = lessonRegistry.lessons.map(item => item.lessonCode);
  if (!unique(codes)) return 'DUPLICATE_LESSON_CODE';
  for (const lesson of lessonRegistry.lessons) {
    if (!validateRequired(lesson, lessonRegistry.requiredLessonFields)) return 'UNRESOLVED_LESSON_FIELDS';
    if (!lesson.lessonCode.startsWith(contract.identityPrefixes.LESSON)) return 'INVALID_LESSON_IDENTITY';
    const parent = modules.get(lesson.moduleCode);
    if (!parent) return 'UNKNOWN_LESSON_MODULE';
    if (lesson.academyLevelCode !== parent.academyLevelCode ||
        !sameSet(lesson.targetCapabilityCodes, parent.targetCapabilityCodes)) return 'LESSON_PARENT_SEMANTIC_MISMATCH';
    if (lesson.authorityReference !== 'ALR') return 'DENY_LESSON_AUTHORITY';
    if (!statuses.has(lesson.status) || !activations.has(lesson.deliveryActivationState)) return 'UNKNOWN_LESSON_STATE';
    if (hasForbiddenFieldDeep(lesson, forbidden)) return 'DENY_LESSON_DATA_OR_CONTENT_FIELD';
    if (!Array.isArray(lesson.learningObjectiveCodes) || lesson.learningObjectiveCodes.length === 0 ||
        !unique(lesson.learningObjectiveCodes)) return 'INVALID_LESSON_OBJECTIVE_REFERENCES';
    if (!lesson.futureIntegrationReferences ||
        !sameSet(Object.keys(lesson.futureIntegrationReferences), expectedIntegrationKeys) ||
        Object.values(lesson.futureIntegrationReferences).some(value => !Array.isArray(value) || value.length !== 0)) {
      return 'EARLY_OR_INVALID_LESSON_INTEGRATION';
    }
    if (!Array.isArray(lesson.activationGates) || lesson.activationGates.length === 0) {
      return 'MISSING_LESSON_ACTIVATION_GATES';
    }
  }
  if (!validateContiguousSequences(lessonRegistry.lessons, 'moduleCode')) return 'NON_CONTIGUOUS_LESSON_SEQUENCE';
  return 'VALID_LESSON_REGISTRY';
}

export function validateLearningObjectiveRegistry(context) {
  const { contract, typeRegistry, capabilityRegistry, lessonRegistry, learningObjectiveRegistry } = context;
  if (!validateTypeAuthority(typeRegistry, 'LEARNING_OBJECTIVE', 'ALR-W14')) {
    return 'DENY_LEARNING_OBJECTIVE_TYPE_AUTHORITY';
  }
  if (!learningObjectiveRegistry || !Array.isArray(learningObjectiveRegistry.learningObjectives) ||
      learningObjectiveRegistry.learningObjectives.length === 0) return 'EMPTY_LEARNING_OBJECTIVE_REGISTRY';
  const forbidden = new Set(contract?.forbiddenDefinitionFields ?? []);
  const capabilities = new Map((capabilityRegistry?.capabilities ?? []).map(item => [item.capabilityCode, item]));
  const lessons = new Map((lessonRegistry?.lessons ?? []).map(item => [item.lessonCode, item]));
  const verbs = new Set(learningObjectiveRegistry.controlledActionVerbs ?? []);
  const statuses = new Set(contract?.structuralStatusValues ?? []);
  const activations = new Set(contract?.deliveryActivationStates ?? []);
  const codes = learningObjectiveRegistry.learningObjectives.map(item => item.learningObjectiveCode);
  if (!unique(codes)) return 'DUPLICATE_LEARNING_OBJECTIVE_CODE';
  for (const objective of learningObjectiveRegistry.learningObjectives) {
    if (!validateRequired(objective, learningObjectiveRegistry.requiredLearningObjectiveFields)) {
      return 'UNRESOLVED_LEARNING_OBJECTIVE_FIELDS';
    }
    if (!objective.learningObjectiveCode.startsWith(contract.identityPrefixes.LEARNING_OBJECTIVE)) {
      return 'INVALID_LEARNING_OBJECTIVE_IDENTITY';
    }
    const lesson = lessons.get(objective.lessonCode);
    const capability = capabilities.get(objective.capabilityCode);
    if (!lesson) return 'UNKNOWN_LEARNING_OBJECTIVE_LESSON';
    if (!capability || !lesson.targetCapabilityCodes.includes(objective.capabilityCode)) {
      return 'LEARNING_OBJECTIVE_CAPABILITY_MISMATCH';
    }
    if (objective.academyLevelCode !== lesson.academyLevelCode) return 'LEARNING_OBJECTIVE_LEVEL_MISMATCH';
    if (!capability.requiredEvidenceCriteria.some(item => item.criterionCode === objective.evidenceCriterionCode)) {
      return 'UNKNOWN_LEARNING_OBJECTIVE_CRITERION';
    }
    if (!verbs.has(objective.actionVerb)) return 'UNKNOWN_LEARNING_OBJECTIVE_ACTION_VERB';
    if (objective.authorityReference !== 'ALR') return 'DENY_LEARNING_OBJECTIVE_AUTHORITY';
    if (!statuses.has(objective.status) || !activations.has(objective.deliveryActivationState)) {
      return 'UNKNOWN_LEARNING_OBJECTIVE_STATE';
    }
    if (hasForbiddenFieldDeep(objective, forbidden)) return 'DENY_OBJECTIVE_DATA_OR_CONTENT_FIELD';
  }
  if (!validateContiguousSequences(learningObjectiveRegistry.learningObjectives, 'lessonCode')) {
    return 'NON_CONTIGUOUS_LEARNING_OBJECTIVE_SEQUENCE';
  }
  return 'VALID_LEARNING_OBJECTIVE_REGISTRY';
}

export function validateLearningArchitecture(context) {
  const checks = [
    validateProgramRegistry(context),
    validateLearningPathRegistry(context),
    validateModuleRegistry(context),
    validateLessonRegistry(context),
    validateLearningObjectiveRegistry(context)
  ];
  const failure = checks.find(result => !result.startsWith('VALID_'));
  if (failure) return failure;
  const {
    programRegistry, learningPathRegistry, moduleRegistry, lessonRegistry,
    learningObjectiveRegistry, capabilityGraph
  } = context;
  const paths = learningPathRegistry.learningPaths;
  const modules = moduleRegistry.modules;
  const lessons = lessonRegistry.lessons;
  const objectives = learningObjectiveRegistry.learningObjectives;
  for (const program of programRegistry.programs) {
    const children = paths.filter(item => item.programCode === program.programCode);
    if (!sameSet(program.learningPathCodes, children.map(item => item.learningPathCode))) {
      return 'PROGRAM_PATH_RECIPROCITY_FAILURE';
    }
    if (!sameSet(program.targetCapabilityCodes, children.flatMap(item => item.targetCapabilityCodes))) {
      return 'PROGRAM_CAPABILITY_COVERAGE_FAILURE';
    }
  }
  for (const learningPath of paths) {
    const children = modules.filter(item => item.learningPathCode === learningPath.learningPathCode);
    if (!sameSet(learningPath.moduleCodes, children.map(item => item.moduleCode))) {
      return 'PATH_MODULE_RECIPROCITY_FAILURE';
    }
    const targetCapability = learningPath.targetCapabilityCodes[0];
    const prerequisiteCapabilities = capabilityGraph.edges
      .filter(edge => edge.toCapabilityCode === targetCapability && edge.edgeType === 'REQUIRES')
      .map(edge => edge.fromCapabilityCode);
    const prerequisitePathCapabilities = learningPath.prerequisitePathCodes.map(code =>
      paths.find(item => item.learningPathCode === code)?.targetCapabilityCodes[0]
    );
    if (!sameSet(prerequisiteCapabilities, prerequisitePathCapabilities)) {
      return 'PATH_CAPABILITY_DEPENDENCY_MISMATCH';
    }
  }
  for (const module of modules) {
    const children = lessons.filter(item => item.moduleCode === module.moduleCode);
    if (!sameSet(module.lessonCodes, children.map(item => item.lessonCode))) {
      return 'MODULE_LESSON_RECIPROCITY_FAILURE';
    }
  }
  for (const lesson of lessons) {
    const children = objectives.filter(item => item.lessonCode === lesson.lessonCode);
    if (!sameSet(lesson.learningObjectiveCodes, children.map(item => item.learningObjectiveCode))) {
      return 'LESSON_OBJECTIVE_RECIPROCITY_FAILURE';
    }
  }
  return 'VALID_LEARNING_ARCHITECTURE';
}

export function buildLearningArchitectureProjection(context, programCode) {
  if (validateLearningArchitecture(context) !== 'VALID_LEARNING_ARCHITECTURE') return null;
  const program = context.programRegistry.programs.find(item => item.programCode === programCode);
  if (!program) return null;
  const learningPaths = program.learningPathCodes.map(pathCode => {
    const learningPath = context.learningPathRegistry.learningPaths.find(item => item.learningPathCode === pathCode);
    const modules = learningPath.moduleCodes.map(moduleCode => {
      const module = context.moduleRegistry.modules.find(item => item.moduleCode === moduleCode);
      const lessons = module.lessonCodes.map(lessonCode => {
        const lesson = context.lessonRegistry.lessons.find(item => item.lessonCode === lessonCode);
        const learningObjectives = lesson.learningObjectiveCodes.map(objectiveCode =>
          context.learningObjectiveRegistry.learningObjectives.find(
            item => item.learningObjectiveCode === objectiveCode
          )
        );
        return { ...structuredClone(lesson), learningObjectives: structuredClone(learningObjectives) };
      });
      return { ...structuredClone(module), lessons };
    });
    return { ...structuredClone(learningPath), modules };
  });
  return { ...structuredClone(program), learningPaths };
}

export function evaluateLearningDeliveryEligibility(contract, input = {}) {
  const forbidden = new Set(contract?.forbiddenDefinitionFields ?? []);
  if (hasForbiddenFieldDeep(input, forbidden)) return 'DENY_LEARNER_CASE_OR_AUTHORITY_DATA';
  if (input.requestedActivationState === 'STRUCTURE_ONLY') return 'STRUCTURE_READY_DELIVERY_BLOCKED';
  if (input.requestedActivationState !== 'DELIVERY_ELIGIBLE') return 'DENY_UNKNOWN_ACTIVATION_STATE';
  const requiredGates = [
    'knowledgeProjectionReady', 'teachingExplanationReady',
    'practiceReady', 'assessmentReady', 'rdgPermissionResolved'
  ];
  if (requiredGates.some(gate => input[gate] !== true)) return 'DENY_DELIVERY_GATES';
  if (contract?.activation?.learningDeliveryRuntimeActive !== true) return 'DENY_RUNTIME_NOT_ACTIVATED';
  return 'DELIVERY_ELIGIBLE';
}
