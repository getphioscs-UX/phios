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

const validState = (item, contract) =>
  (contract?.statusValues ?? []).includes(item.status) &&
  (contract?.deliveryActivationStates ?? []).includes(item.deliveryActivationState);

const lessonMaps = context => ({
  lessons: registryIndex(context.lessonRegistry?.lessons, 'lessonCode'),
  objectives: registryIndex(context.learningObjectiveRegistry?.learningObjectives, 'learningObjectiveCode')
});

const objectivesMatchLesson = (lesson, objectiveCodes, objectives) =>
  Array.isArray(objectiveCodes) && objectiveCodes.length > 0 && unique(objectiveCodes) &&
  sameSet(objectiveCodes, lesson?.learningObjectiveCodes ?? []) &&
  objectiveCodes.every(code => objectives.get(code)?.lessonCode === lesson.lessonCode);

export function validatePracticeRegistry(context) {
  const { practiceContract: contract, practiceRegistry: registry } = context;
  if (!validatesTypeAuthority(context.typeRegistry, 'PRACTICE', 'ALR-W20')) {
    return 'DENY_PRACTICE_TYPE_AUTHORITY';
  }
  const practices = registry?.practices;
  if (!Array.isArray(practices) || practices.length === 0) return 'EMPTY_PRACTICE_REGISTRY';
  const { lessons, objectives } = lessonMaps(context);
  const bindings = registryIndex(context.knowledgeLearningBindingRegistry?.bindings, 'bindingCode');
  const forbidden = new Set(contract?.forbiddenPracticeFields ?? []);
  const codes = practices.map(item => item.practiceCode);
  const lessonCodes = practices.map(item => item.lessonCode);
  const bindingCodes = practices.map(item => item.knowledgeLearningBindingCode);
  if (!unique(codes)) return 'DUPLICATE_PRACTICE_CODE';
  if (!unique(lessonCodes)) return 'DUPLICATE_PRACTICE_LESSON';
  if (!unique(bindingCodes)) return 'DUPLICATE_PRACTICE_KNOWLEDGE_BINDING';

  for (const practice of practices) {
    if (!validateRequired(practice, contract?.requiredPracticeFields)) return 'UNRESOLVED_PRACTICE_FIELDS';
    if (!practice.practiceCode.startsWith(contract.identityPrefix)) return 'INVALID_PRACTICE_IDENTITY';
    if (practice.authorityReference !== 'ALR') return 'DENY_PRACTICE_AUTHORITY';
    if (hasForbiddenFieldDeep(practice, forbidden)) return 'DENY_PRACTICE_LEARNER_ASSESSMENT_OR_AUTHORITY_FIELD';
    if (!validState(practice, contract) || !(contract.practiceModes ?? []).includes(practice.practiceMode) ||
        !(contract.dataStates ?? []).includes(practice.dataState) ||
        !(contract.assessmentStates ?? []).includes(practice.assessmentState)) {
      return 'UNKNOWN_PRACTICE_STATE_OR_MODE';
    }
    if (!Array.isArray(practice.taskSequence) || practice.taskSequence.length === 0 ||
        !Array.isArray(practice.selfCheckPrompts) || practice.selfCheckPrompts.length === 0 ||
        !validateRequired(practice.learnerArtifactContract, ['artifactType', 'requiredElements']) ||
        !Array.isArray(practice.learnerArtifactContract.requiredElements) ||
        practice.learnerArtifactContract.requiredElements.length === 0 ||
        !unique(practice.learnerArtifactContract.requiredElements)) return 'UNRESOLVED_PRACTICE_CONTENT';
    const lesson = lessons.get(practice.lessonCode);
    const binding = bindings.get(practice.knowledgeLearningBindingCode);
    if (!lesson || !binding || binding.lessonCode !== practice.lessonCode ||
        !objectivesMatchLesson(lesson, practice.learningObjectiveCodes, objectives)) {
      return 'UNKNOWN_PRACTICE_BINDING_LESSON_OR_OBJECTIVE';
    }
  }
  if (!sameSet(lessonCodes, [...lessons.keys()]) || !sameSet(bindingCodes, [...bindings.keys()])) {
    return 'PRACTICE_LESSON_OR_BINDING_COVERAGE_FAILURE';
  }
  return 'VALID_PRACTICE_REGISTRY';
}

export function validateGuidedPracticeRegistry(context) {
  const { guidedPracticeContract: contract, guidedPracticeRegistry: registry } = context;
  if (!validatesTypeAuthority(context.typeRegistry, 'GUIDED_PRACTICE', 'ALR-W21')) {
    return 'DENY_GUIDED_PRACTICE_TYPE_AUTHORITY';
  }
  const practiceResult = validatePracticeRegistry(context);
  if (practiceResult !== 'VALID_PRACTICE_REGISTRY') return practiceResult;
  const guidedPractices = registry?.guidedPractices;
  if (!Array.isArray(guidedPractices) || guidedPractices.length === 0) return 'EMPTY_GUIDED_PRACTICE_REGISTRY';
  const practices = registryIndex(context.practiceRegistry.practices, 'practiceCode');
  const forbidden = new Set(contract?.forbiddenGuidedPracticeFields ?? []);
  const codes = guidedPractices.map(item => item.guidedPracticeCode);
  const practiceCodes = guidedPractices.map(item => item.practiceCode);
  if (!unique(codes)) return 'DUPLICATE_GUIDED_PRACTICE_CODE';
  if (!unique(practiceCodes)) return 'DUPLICATE_GUIDED_PRACTICE_PARENT';

  for (const guided of guidedPractices) {
    if (!validateRequired(guided, contract?.requiredGuidedPracticeFields)) {
      return 'UNRESOLVED_GUIDED_PRACTICE_FIELDS';
    }
    if (!guided.guidedPracticeCode.startsWith(contract.identityPrefix)) {
      return 'INVALID_GUIDED_PRACTICE_IDENTITY';
    }
    if (guided.authorityReference !== 'ALR') return 'DENY_GUIDED_PRACTICE_AUTHORITY';
    if (hasForbiddenFieldDeep(guided, forbidden)) return 'DENY_GUIDED_PRACTICE_LEARNER_PROVIDER_OR_AUTHORITY_FIELD';
    if (!validState(guided, contract) || !(contract.guidanceModes ?? []).includes(guided.guidanceMode) ||
        !(contract.supportReleaseContracts ?? []).includes(guided.supportReleaseContract) ||
        !(contract.dataStates ?? []).includes(guided.dataState) ||
        !(contract.assessmentStates ?? []).includes(guided.assessmentState)) {
      return 'UNKNOWN_GUIDED_PRACTICE_STATE_OR_MODE';
    }
    if (!Array.isArray(guided.guidanceSteps) ||
        guided.guidanceSteps.length !== (contract.guidanceStepPhases ?? []).length ||
        guided.guidanceSteps.some(step => !validateRequired(step, contract.requiredGuidanceStepFields)) ||
        !sameSet(guided.guidanceSteps.map(step => step.sequence),
          guided.guidanceSteps.map((_, index) => index + 1)) ||
        guided.guidanceSteps.some((step, index) => step.sequence !== index + 1 ||
          step.phase !== contract.guidanceStepPhases[index])) return 'INVALID_GUIDANCE_SEQUENCE';
    const practice = practices.get(guided.practiceCode);
    if (!practice || practice.lessonCode !== guided.lessonCode ||
        !sameSet(practice.learningObjectiveCodes, guided.learningObjectiveCodes) ||
        guided.selfCheckHandoff !== `${practice.practiceCode}:SELF_CHECK`) {
      return 'UNKNOWN_GUIDED_PRACTICE_PARENT_LESSON_OR_OBJECTIVE';
    }
  }
  if (!sameSet(practiceCodes, [...practices.keys()])) return 'GUIDED_PRACTICE_PARENT_COVERAGE_FAILURE';
  return 'VALID_GUIDED_PRACTICE_REGISTRY';
}

const graphIsReachable = simulation => {
  const transitionsByState = new Map(simulation.states.map(state => [state.stateCode, []]));
  for (const transition of simulation.transitions) {
    transitionsByState.get(transition.fromStateCode)?.push(transition.toStateCode);
  }
  const visited = new Set();
  const pending = [simulation.initialStateCode];
  while (pending.length > 0) {
    const stateCode = pending.shift();
    if (visited.has(stateCode)) continue;
    visited.add(stateCode);
    pending.push(...(transitionsByState.get(stateCode) ?? []));
  }
  return visited.size === simulation.states.length;
};

export function validateSimulationRegistry(context) {
  const { simulationContract: contract, simulationRegistry: registry } = context;
  if (!validatesTypeAuthority(context.typeRegistry, 'SIMULATION', 'ALR-W22')) {
    return 'DENY_SIMULATION_TYPE_AUTHORITY';
  }
  const guidedResult = validateGuidedPracticeRegistry(context);
  if (guidedResult !== 'VALID_GUIDED_PRACTICE_REGISTRY') return guidedResult;
  const simulations = registry?.simulations;
  if (!Array.isArray(simulations) || simulations.length === 0) return 'EMPTY_SIMULATION_REGISTRY';
  const practices = registryIndex(context.practiceRegistry.practices, 'practiceCode');
  const guidedPractices = registryIndex(context.guidedPracticeRegistry.guidedPractices, 'guidedPracticeCode');
  const caseStudies = registryIndex(context.caseStudyRegistry?.caseStudies, 'caseStudyCode');
  const forbidden = new Set(contract?.forbiddenSimulationFields ?? []);
  const codes = simulations.map(item => item.simulationCode);
  const practiceCodes = simulations.map(item => item.practiceCode);
  if (!unique(codes)) return 'DUPLICATE_SIMULATION_CODE';
  if (!unique(practiceCodes)) return 'DUPLICATE_SIMULATION_PRACTICE';

  for (const simulation of simulations) {
    if (!validateRequired(simulation, contract?.requiredSimulationFields)) return 'UNRESOLVED_SIMULATION_FIELDS';
    if (!simulation.simulationCode.startsWith(contract.identityPrefix)) return 'INVALID_SIMULATION_IDENTITY';
    if (simulation.authorityReference !== 'ALR') return 'DENY_SIMULATION_AUTHORITY';
    if (hasForbiddenFieldDeep(simulation, forbidden)) return 'DENY_SIMULATION_LEARNER_CASE_ACTION_OR_AUTHORITY_FIELD';
    if (!validState(simulation, contract) || !(contract.simulationModes ?? []).includes(simulation.simulationMode) ||
        !(contract.resultContracts ?? []).includes(simulation.resultContract) ||
        !(contract.dataClassifications ?? []).includes(simulation.dataClassification) ||
        !(contract.realWorldActionStates ?? []).includes(simulation.realWorldActionState) ||
        !(contract.assessmentStates ?? []).includes(simulation.assessmentState)) {
      return 'UNKNOWN_SIMULATION_STATE_OR_MODE';
    }
    const practice = practices.get(simulation.practiceCode);
    const guided = guidedPractices.get(simulation.guidedPracticeCode);
    const caseStudy = caseStudies.get(simulation.caseStudyCode);
    if (!practice || !guided || !caseStudy || guided.practiceCode !== practice.practiceCode ||
        practice.lessonCode !== simulation.lessonCode || guided.lessonCode !== simulation.lessonCode ||
        caseStudy.lessonCode !== simulation.lessonCode ||
        !sameSet(practice.learningObjectiveCodes, simulation.learningObjectiveCodes) ||
        !sameSet(guided.learningObjectiveCodes, simulation.learningObjectiveCodes) ||
        !sameSet(caseStudy.learningObjectiveCodes, simulation.learningObjectiveCodes)) {
      return 'UNKNOWN_SIMULATION_PRACTICE_GUIDANCE_CASE_LESSON_OR_OBJECTIVE';
    }
    if (!Array.isArray(simulation.states) || simulation.states.length === 0 ||
        !Array.isArray(simulation.transitions) || simulation.transitions.length === 0 ||
        !Array.isArray(simulation.terminalStateCodes)) return 'UNRESOLVED_SIMULATION_GRAPH';
    const stateCodes = simulation.states.map(item => item.stateCode);
    const transitionCodes = simulation.transitions.map(item => item.transitionCode);
    if (!unique(stateCodes) || !unique(transitionCodes)) return 'DUPLICATE_SIMULATION_STATE_OR_TRANSITION';
    const states = registryIndex(simulation.states, 'stateCode');
    const transitions = registryIndex(simulation.transitions, 'transitionCode');
    if (states.get(simulation.initialStateCode)?.stateType !== 'START') return 'INVALID_SIMULATION_INITIAL_STATE';
    const actualTerminals = simulation.states.filter(item => item.stateType.startsWith('TERMINAL_'))
      .map(item => item.stateCode);
    if (!sameSet(actualTerminals, simulation.terminalStateCodes) || actualTerminals.length === 0) {
      return 'INVALID_SIMULATION_TERMINAL_STATES';
    }
    for (const state of simulation.states) {
      if (!validateRequired(state, contract.requiredStateFields) ||
          !(contract.stateTypes ?? []).includes(state.stateType) ||
          !Array.isArray(state.allowedTransitionCodes) || !unique(state.allowedTransitionCodes)) {
        return 'INVALID_SIMULATION_STATE';
      }
      const outgoing = simulation.transitions.filter(item => item.fromStateCode === state.stateCode)
        .map(item => item.transitionCode);
      if (!sameSet(outgoing, state.allowedTransitionCodes) ||
          (state.stateType.startsWith('TERMINAL_') && outgoing.length > 0)) {
        return 'SIMULATION_STATE_TRANSITION_RECIPROCITY_FAILURE';
      }
    }
    for (const transition of simulation.transitions) {
      if (!validateRequired(transition, contract.requiredTransitionFields) ||
          !states.has(transition.fromStateCode) || !states.has(transition.toStateCode) ||
          !(contract.boundarySignals ?? []).includes(transition.boundarySignal)) {
        return 'INVALID_OR_DANGLING_SIMULATION_TRANSITION';
      }
      if (!transitions.has(transition.transitionCode)) return 'INVALID_OR_DANGLING_SIMULATION_TRANSITION';
    }
    if (!graphIsReachable(simulation)) return 'UNREACHABLE_SIMULATION_STATE';
  }
  if (!sameSet(practiceCodes, [...practices.keys()])) return 'SIMULATION_PRACTICE_COVERAGE_FAILURE';
  return 'VALID_SIMULATION_REGISTRY';
}

export function validateReflectionRegistry(context) {
  const { reflectionContract: contract, reflectionRegistry: registry } = context;
  if (!validatesTypeAuthority(context.typeRegistry, 'REFLECTION', 'ALR-W23')) {
    return 'DENY_REFLECTION_TYPE_AUTHORITY';
  }
  const simulationResult = validateSimulationRegistry(context);
  if (simulationResult !== 'VALID_SIMULATION_REGISTRY') return simulationResult;
  const reflections = registry?.reflections;
  if (!Array.isArray(reflections) || reflections.length === 0) return 'EMPTY_REFLECTION_REGISTRY';
  const practices = registryIndex(context.practiceRegistry.practices, 'practiceCode');
  const simulations = registryIndex(context.simulationRegistry.simulations, 'simulationCode');
  const forbidden = new Set(contract?.forbiddenReflectionFields ?? []);
  const codes = reflections.map(item => item.reflectionCode);
  const simulationCodes = reflections.map(item => item.simulationCode);
  if (!unique(codes)) return 'DUPLICATE_REFLECTION_CODE';
  if (!unique(simulationCodes)) return 'DUPLICATE_REFLECTION_SIMULATION';

  for (const reflection of reflections) {
    if (!validateRequired(reflection, contract?.requiredReflectionFields)) return 'UNRESOLVED_REFLECTION_FIELDS';
    if (!reflection.reflectionCode.startsWith(contract.identityPrefix)) return 'INVALID_REFLECTION_IDENTITY';
    if (reflection.authorityReference !== 'ALR') return 'DENY_REFLECTION_AUTHORITY';
    if (hasForbiddenFieldDeep(reflection, forbidden)) return 'DENY_REFLECTION_RESPONSE_PERSONAL_OR_AUTHORITY_FIELD';
    if (!validState(reflection, contract) || !(contract.reflectionModes ?? []).includes(reflection.reflectionMode) ||
        !(contract.responseCaptureStates ?? []).includes(reflection.responseCaptureState) ||
        !(contract.dataStates ?? []).includes(reflection.dataState) ||
        !(contract.assessmentStates ?? []).includes(reflection.assessmentState)) {
      return 'UNKNOWN_REFLECTION_STATE_OR_MODE';
    }
    if (!Array.isArray(reflection.promptGroups) || reflection.promptGroups.length === 0 ||
        reflection.promptGroups.some(group => !validateRequired(group, contract.requiredPromptGroupFields) ||
          !Array.isArray(group.prompts) || group.prompts.length === 0 || !unique(group.prompts)) ||
        !unique(reflection.promptGroups.map(group => group.dimensionCode))) return 'UNRESOLVED_REFLECTION_PROMPTS';
    const practice = practices.get(reflection.practiceCode);
    const simulation = simulations.get(reflection.simulationCode);
    if (!practice || !simulation || simulation.practiceCode !== practice.practiceCode ||
        simulation.lessonCode !== reflection.lessonCode ||
        !sameSet(simulation.learningObjectiveCodes, reflection.learningObjectiveCodes)) {
      return 'UNKNOWN_REFLECTION_PRACTICE_SIMULATION_LESSON_OR_OBJECTIVE';
    }
  }
  if (!sameSet(simulationCodes, [...simulations.keys()])) return 'REFLECTION_SIMULATION_COVERAGE_FAILURE';
  return 'VALID_REFLECTION_REGISTRY';
}

export function validatePracticeLearningBindings(context) {
  const registry = context.practiceLearningBindingRegistry;
  if (!registry || !Array.isArray(registry.bindings) || registry.bindings.length === 0) {
    return 'EMPTY_PRACTICE_LEARNING_BINDING_REGISTRY';
  }
  const groups = [
    ['knowledgeLearningBindingCode', registryIndex(context.knowledgeLearningBindingRegistry?.bindings, 'bindingCode')],
    ['practiceCode', registryIndex(context.practiceRegistry?.practices, 'practiceCode')],
    ['guidedPracticeCode', registryIndex(context.guidedPracticeRegistry?.guidedPractices, 'guidedPracticeCode')],
    ['simulationCode', registryIndex(context.simulationRegistry?.simulations, 'simulationCode')],
    ['reflectionCode', registryIndex(context.reflectionRegistry?.reflections, 'reflectionCode')]
  ];
  const lessons = registryIndex(context.lessonRegistry?.lessons, 'lessonCode');
  const bindingCodes = registry.bindings.map(item => item.bindingCode);
  const lessonCodes = registry.bindings.map(item => item.lessonCode);
  if (!unique(bindingCodes)) return 'DUPLICATE_PRACTICE_LEARNING_BINDING_CODE';
  if (!unique(lessonCodes)) return 'DUPLICATE_PRACTICE_LEARNING_LESSON_BINDING';
  for (const binding of registry.bindings) {
    if (!validateRequired(binding, registry.requiredBindingFields)) return 'UNRESOLVED_PRACTICE_LEARNING_BINDING_FIELDS';
    if (!lessons.has(binding.lessonCode)) return 'UNKNOWN_PRACTICE_LEARNING_BINDING_LESSON';
    if (binding.bindingStatus !== 'APPROVED' ||
        binding.deliveryActivationState !== 'CONTENT_SEMANTICS_READY_DELIVERY_BLOCKED') {
      return 'UNKNOWN_PRACTICE_LEARNING_BINDING_STATE';
    }
    for (const [field, index] of groups) {
      const referenced = index.get(binding[field]);
      if (!referenced || referenced.lessonCode !== binding.lessonCode) {
        return 'DANGLING_OR_MISMATCHED_PRACTICE_LEARNING_BINDING';
      }
    }
    const practice = groups[1][1].get(binding.practiceCode);
    const guided = groups[2][1].get(binding.guidedPracticeCode);
    const simulation = groups[3][1].get(binding.simulationCode);
    const reflection = groups[4][1].get(binding.reflectionCode);
    if (guided.practiceCode !== practice.practiceCode || simulation.practiceCode !== practice.practiceCode ||
        simulation.guidedPracticeCode !== guided.guidedPracticeCode ||
        reflection.practiceCode !== practice.practiceCode || reflection.simulationCode !== simulation.simulationCode) {
      return 'PRACTICE_LEARNING_BINDING_RECIPROCITY_FAILURE';
    }
  }
  if (!sameSet(lessonCodes, [...lessons.keys()])) return 'PRACTICE_LEARNING_BINDING_LESSON_COVERAGE_FAILURE';
  for (const [field, index] of groups) {
    if (!sameSet(registry.bindings.map(item => item[field]), [...index.keys()])) {
      return 'PRACTICE_LEARNING_BINDING_RECIPROCITY_FAILURE';
    }
  }
  return 'VALID_PRACTICE_LEARNING_BINDINGS';
}

export function validatePracticeRuntime(context) {
  const results = [
    validatePracticeRegistry(context),
    validateGuidedPracticeRegistry(context),
    validateSimulationRegistry(context),
    validateReflectionRegistry(context),
    validatePracticeLearningBindings(context)
  ];
  return results.find(result => !result.startsWith('VALID_')) ?? 'VALID_PRACTICE_RUNTIME';
}

export function buildLessonPracticeProjection(context, lessonCode) {
  if (validatePracticeRuntime(context) !== 'VALID_PRACTICE_RUNTIME') return null;
  const binding = context.practiceLearningBindingRegistry.bindings.find(item => item.lessonCode === lessonCode);
  const lesson = context.lessonRegistry.lessons.find(item => item.lessonCode === lessonCode);
  if (!binding || !lesson) return null;
  const select = (items, field, code) => structuredClone(items.find(item => item[field] === code));
  return {
    lesson: structuredClone(lesson),
    binding: structuredClone(binding),
    practice: select(context.practiceRegistry.practices, 'practiceCode', binding.practiceCode),
    guidedPractice: select(context.guidedPracticeRegistry.guidedPractices, 'guidedPracticeCode', binding.guidedPracticeCode),
    simulation: select(context.simulationRegistry.simulations, 'simulationCode', binding.simulationCode),
    reflection: select(context.reflectionRegistry.reflections, 'reflectionCode', binding.reflectionCode)
  };
}

export function resolveSimulationTransition(context, simulationCode, stateCode, transitionCode) {
  if (validateSimulationRegistry(context) !== 'VALID_SIMULATION_REGISTRY') {
    return { decision: 'DENY_INVALID_SIMULATION_REGISTRY' };
  }
  const simulation = context.simulationRegistry.simulations.find(item => item.simulationCode === simulationCode);
  if (!simulation) return { decision: 'DENY_UNKNOWN_SIMULATION' };
  const state = simulation.states.find(item => item.stateCode === stateCode);
  const transition = simulation.transitions.find(item => item.transitionCode === transitionCode);
  if (!state) return { decision: 'DENY_UNKNOWN_SIMULATION_STATE' };
  if (!transition || transition.fromStateCode !== state.stateCode ||
      !state.allowedTransitionCodes.includes(transition.transitionCode)) {
    return { decision: 'DENY_UNKNOWN_OR_DISALLOWED_TRANSITION' };
  }
  const targetState = simulation.states.find(item => item.stateCode === transition.toStateCode);
  if (!targetState) return { decision: 'DENY_DANGLING_TRANSITION' };
  return {
    decision: 'TRANSITION_RESOLVED_STATIC_NO_PERSISTENCE',
    simulationCode,
    fromStateCode: state.stateCode,
    transition: structuredClone(transition),
    targetState: structuredClone(targetState),
    resultContract: simulation.resultContract,
    assessmentState: simulation.assessmentState
  };
}

export function evaluatePracticeDeliveryEligibility(context, input = {}) {
  const contracts = [context.practiceContract, context.guidedPracticeContract,
    context.simulationContract, context.reflectionContract];
  const forbidden = new Set(contracts.flatMap(contract => [
    ...(contract?.forbiddenPracticeFields ?? []),
    ...(contract?.forbiddenGuidedPracticeFields ?? []),
    ...(contract?.forbiddenSimulationFields ?? []),
    ...(contract?.forbiddenReflectionFields ?? [])
  ]));
  if (hasForbiddenFieldDeep(input, forbidden)) return 'DENY_LEARNER_CASE_ACTION_OR_AUTHORITY_DATA';
  if (input.requestedActivationState === 'CONTENT_SEMANTICS_READY_DELIVERY_BLOCKED') {
    return 'CONTENT_SEMANTICS_READY_DELIVERY_BLOCKED';
  }
  if (input.requestedActivationState !== 'DELIVERY_ELIGIBLE') return 'DENY_UNKNOWN_ACTIVATION_STATE';
  const gates = ['practiceReady', 'guidedPracticeReady', 'simulationReady', 'reflectionReady',
    'assessmentReady', 'rdgPermissionResolved'];
  if (gates.some(gate => input[gate] !== true)) return 'DENY_DELIVERY_GATES';
  if (contracts.some(contract => contract?.activation?.learnerDeliveryRuntimeActive !== true)) {
    return 'DENY_RUNTIME_NOT_ACTIVATED';
  }
  return 'DELIVERY_ELIGIBLE';
}
