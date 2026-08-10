import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  buildLessonPracticeProjection,
  evaluatePracticeDeliveryEligibility,
  resolveSimulationTransition,
  validateGuidedPracticeRegistry,
  validatePracticeLearningBindings,
  validatePracticeRegistry,
  validatePracticeRuntime,
  validateReflectionRegistry,
  validateSimulationRegistry
} from './lib/academy-learning-runtime/alr-practice-v1.mjs';

const root = process.cwd();
const base = 'content/academy/academy-learning-runtime';
const read = async file => JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));
const normalizeText = source => source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const digest = async file => crypto.createHash('sha256')
  .update(normalizeText(await fs.readFile(path.join(root, file), 'utf8')), 'utf8')
  .digest('hex');

const audit = await read(`${base}/audits/alr-practice-reconciliation-v1.json`);
assert.equal(audit.baselineCommit, 'e16f8e39ea09586833d848770c9d0eb042032144');
assert.equal(audit.scope, 'ALR-W20-W23');
assert.deepEqual(audit.implementationDecision, {
  practiceCount: 5,
  guidedPracticeCount: 5,
  simulationCount: 5,
  reflectionCount: 5,
  practiceBindingOverlayRequired: true,
  practiceDefinitionsMayBeUnscored: true,
  guidedPracticeMayUseStaticScaffolding: true,
  guidedPracticeMayProfileLearnerOrAdaptFromLearnerData: false,
  simulationMayResolveSyntheticDeterministicBranches: true,
  simulationMayExecuteRealWorldActionOrProfessionalDecision: false,
  reflectionMayDefinePrompts: true,
  reflectionMayCaptureOrPersistResponse: false,
  practiceMayBecomeAssessmentOrCapabilityEvidenceAutomatically: false,
  learnerDeliveryMayBeActivated: false
});
assert.equal(audit.checkerIntegrationRepair.classification, 'CHECKER_GOVERNANCE_COMPATIBILITY');
assert.equal(audit.checkerIntegrationRepair.runtimeSemanticsMutated, false);
assert.equal(audit.preservation.w0W19ContractsRegistriesRuntimeOrFreezeMutated, false);
assert.equal(audit.preservation.w15W19CheckerSemanticAssertionsReduced, false);
assert.equal(audit.preservation.rdgCarCprOrIcrAuthorityMutated, false);
assert.equal(audit.preservation.lessonOrObjectiveAuthorityMutated, false);
assert.equal(audit.preservation.existingRuntimeOrUserDataMutated, false);
for (const source of audit.inspectedAuthorities) {
  await fs.access(path.join(root, source.reference));
  assert.equal(await digest(source.reference), source.sha256, source.reference);
}

const masterWork = await read('content/governance/canonical-master-work/registries/canonical-master-work-registry-v1.json');
const workEntries = masterWork.entries.filter(entry => /^ALR-W(?:20|21|22|23)$/.test(entry.workCode));
assert.deepEqual(workEntries.map(entry => entry.workCode), ['ALR-W20', 'ALR-W21', 'ALR-W22', 'ALR-W23']);
assert.deepEqual(workEntries.map(entry => entry.executionOrder), [133, 134, 135, 136]);
assert.ok(workEntries.every(entry => entry.runtimeCode === 'ALR' && entry.status === 'PLANNED'));

const context = {
  practiceContract: await read(`${base}/contracts/practice-registry-contract-v1.json`),
  guidedPracticeContract: await read(`${base}/contracts/guided-practice-contract-v1.json`),
  simulationContract: await read(`${base}/contracts/simulation-runtime-contract-v1.json`),
  reflectionContract: await read(`${base}/contracts/reflection-runtime-contract-v1.json`),
  typeRegistry: await read(`${base}/registries/learning-object-registry-v1.json`),
  lessonRegistry: await read(`${base}/registries/lesson-registry-v1.json`),
  learningObjectiveRegistry: await read(`${base}/registries/learning-objective-registry-v1.json`),
  capabilityRegistry: await read(`${base}/registries/capability-registry-v1.json`),
  knowledgeLearningBindingRegistry: await read(`${base}/registries/knowledge-learning-binding-registry-v1.json`),
  caseStudyRegistry: await read(`${base}/registries/case-study-registry-v1.json`),
  practiceRegistry: await read(`${base}/registries/practice-registry-v1.json`),
  guidedPracticeRegistry: await read(`${base}/registries/guided-practice-registry-v1.json`),
  simulationRegistry: await read(`${base}/registries/simulation-registry-v1.json`),
  reflectionRegistry: await read(`${base}/registries/reflection-registry-v1.json`),
  practiceLearningBindingRegistry: await read(`${base}/registries/practice-learning-binding-registry-v1.json`),
  rdgLearningDataContract: await read('content/governance/reality-data-governance/contracts/alr-learning-data-contract-v1.json'),
  capabilityEvidenceBoundary: await read('content/governance/reality-data-governance/contracts/capability-evidence-boundary-v1.json')
};

assert.equal(validatePracticeRegistry(context), 'VALID_PRACTICE_REGISTRY');
assert.equal(validateGuidedPracticeRegistry(context), 'VALID_GUIDED_PRACTICE_REGISTRY');
assert.equal(validateSimulationRegistry(context), 'VALID_SIMULATION_REGISTRY');
assert.equal(validateReflectionRegistry(context), 'VALID_REFLECTION_REGISTRY');
assert.equal(validatePracticeLearningBindings(context), 'VALID_PRACTICE_LEARNING_BINDINGS');
assert.equal(validatePracticeRuntime(context), 'VALID_PRACTICE_RUNTIME');

assert.equal(context.practiceRegistry.practices.length, 5);
assert.equal(context.guidedPracticeRegistry.guidedPractices.length, 5);
assert.equal(context.simulationRegistry.simulations.length, 5);
assert.equal(context.reflectionRegistry.reflections.length, 5);
assert.equal(context.practiceLearningBindingRegistry.bindings.length, 5);
assert.ok(context.practiceRegistry.practices.every(item =>
  item.practiceMode === 'UNSCORED_STRUCTURED_PRACTICE' && item.assessmentState === 'NOT_ASSESSMENT' &&
  item.dataState === 'DEFINITION_ONLY_NO_LEARNER_RESPONSE'
));
assert.ok(context.guidedPracticeRegistry.guidedPractices.every(item =>
  item.guidanceMode === 'STATIC_SCAFFOLD_SEQUENCE' &&
  item.supportReleaseContract === 'STATIC_ORDER_NO_ADAPTIVE_LEARNER_PROFILING'
));
assert.ok(context.simulationRegistry.simulations.every(item =>
  item.simulationMode === 'SYNTHETIC_DETERMINISTIC_BRANCHING' &&
  item.dataClassification === 'SYNTHETIC_NON_PERSONAL' &&
  item.realWorldActionState === 'NO_REAL_WORLD_ACTION' &&
  item.resultContract === 'PATH_TRACE_ONLY_NO_SCORE' && item.assessmentState === 'NOT_ASSESSMENT'
));
assert.ok(context.reflectionRegistry.reflections.every(item =>
  item.responseCaptureState === 'NO_RESPONSE_CAPTURE_W23' &&
  item.dataState === 'DEFINITION_ONLY_NO_RESPONSE_STORAGE' && item.assessmentState === 'NOT_ASSESSMENT'
));
assert.ok(context.lessonRegistry.lessons.every(lesson =>
  Object.values(lesson.futureIntegrationReferences).every(references => references.length === 0)
));

const beforeProjection = JSON.stringify(context);
for (const lesson of context.lessonRegistry.lessons) {
  const projection = buildLessonPracticeProjection(context, lesson.lessonCode);
  assert.equal(projection.lesson.lessonCode, lesson.lessonCode);
  assert.equal(projection.practice.lessonCode, lesson.lessonCode);
  assert.equal(projection.guidedPractice.practiceCode, projection.practice.practiceCode);
  assert.equal(projection.simulation.guidedPracticeCode, projection.guidedPractice.guidedPracticeCode);
  assert.equal(projection.reflection.simulationCode, projection.simulation.simulationCode);
}
assert.equal(buildLessonPracticeProjection(context, 'ALR-LO-LESSON-UNKNOWN'), null);
assert.equal(JSON.stringify(context), beforeProjection);

const simulation = context.simulationRegistry.simulations[0];
const transition = simulation.transitions[0];
const beforeTransition = JSON.stringify(context);
const resolved = resolveSimulationTransition(context, simulation.simulationCode,
  transition.fromStateCode, transition.transitionCode);
assert.equal(resolved.decision, 'TRANSITION_RESOLVED_STATIC_NO_PERSISTENCE');
assert.equal(resolved.targetState.stateCode, transition.toStateCode);
assert.equal(resolved.resultContract, 'PATH_TRACE_ONLY_NO_SCORE');
assert.equal(resolved.assessmentState, 'NOT_ASSESSMENT');
assert.equal(JSON.stringify(context), beforeTransition);
assert.equal(resolveSimulationTransition(context, simulation.simulationCode,
  transition.fromStateCode, 'ALR-LO-SIMULATION-UNKNOWN-TRANSITION').decision,
  'DENY_UNKNOWN_OR_DISALLOWED_TRANSITION');
assert.equal(resolveSimulationTransition(context, 'ALR-LO-SIMULATION-UNKNOWN',
  transition.fromStateCode, transition.transitionCode).decision, 'DENY_UNKNOWN_SIMULATION');

const practiceLearnerResponse = structuredClone(context);
practiceLearnerResponse.practiceRegistry.practices[0].learnerResponse = 'stored response';
assert.equal(validatePracticeRegistry(practiceLearnerResponse),
  'DENY_PRACTICE_LEARNER_ASSESSMENT_OR_AUTHORITY_FIELD');
const scoredPractice = structuredClone(context);
scoredPractice.practiceRegistry.practices[0].score = 100;
assert.equal(validatePracticeRegistry(scoredPractice), 'DENY_PRACTICE_LEARNER_ASSESSMENT_OR_AUTHORITY_FIELD');
const unknownKnowledgeBinding = structuredClone(context);
unknownKnowledgeBinding.practiceRegistry.practices[0].knowledgeLearningBindingCode = 'ALR-KLB-UNKNOWN';
assert.equal(validatePracticeRegistry(unknownKnowledgeBinding), 'UNKNOWN_PRACTICE_BINDING_LESSON_OR_OBJECTIVE');
const practiceObjectiveMismatch = structuredClone(context);
practiceObjectiveMismatch.practiceRegistry.practices[0].learningObjectiveCodes =
  context.practiceRegistry.practices[1].learningObjectiveCodes;
assert.equal(validatePracticeRegistry(practiceObjectiveMismatch), 'UNKNOWN_PRACTICE_BINDING_LESSON_OR_OBJECTIVE');

const adaptiveGuidance = structuredClone(context);
adaptiveGuidance.guidedPracticeRegistry.guidedPractices[0].adaptiveProfile = { level: 'inferred' };
assert.equal(validateGuidedPracticeRegistry(adaptiveGuidance),
  'DENY_GUIDED_PRACTICE_LEARNER_PROVIDER_OR_AUTHORITY_FIELD');
const providerGuidance = structuredClone(context);
providerGuidance.guidedPracticeRegistry.guidedPractices[0].providerResponse = 'dynamic hint';
assert.equal(validateGuidedPracticeRegistry(providerGuidance),
  'DENY_GUIDED_PRACTICE_LEARNER_PROVIDER_OR_AUTHORITY_FIELD');
const wrongGuidanceSequence = structuredClone(context);
wrongGuidanceSequence.guidedPracticeRegistry.guidedPractices[0].guidanceSteps[1].phase = 'SELF_CHECK';
assert.equal(validateGuidedPracticeRegistry(wrongGuidanceSequence), 'INVALID_GUIDANCE_SEQUENCE');
const danglingGuidedPractice = structuredClone(context);
danglingGuidedPractice.guidedPracticeRegistry.guidedPractices[0].practiceCode = 'ALR-LO-PRACTICE-UNKNOWN';
assert.equal(validateGuidedPracticeRegistry(danglingGuidedPractice),
  'UNKNOWN_GUIDED_PRACTICE_PARENT_LESSON_OR_OBJECTIVE');

const realCaseSimulation = structuredClone(context);
realCaseSimulation.simulationRegistry.simulations[0].caseReference = 'ICR-CASE-1';
assert.equal(validateSimulationRegistry(realCaseSimulation),
  'DENY_SIMULATION_LEARNER_CASE_ACTION_OR_AUTHORITY_FIELD');
const selectedTransition = structuredClone(context);
selectedTransition.simulationRegistry.simulations[0].selectedTransition = transition.transitionCode;
assert.equal(validateSimulationRegistry(selectedTransition),
  'DENY_SIMULATION_LEARNER_CASE_ACTION_OR_AUTHORITY_FIELD');
const realWorldAction = structuredClone(context);
realWorldAction.simulationRegistry.simulations[0].executedAction = 'execute';
assert.equal(validateSimulationRegistry(realWorldAction),
  'DENY_SIMULATION_LEARNER_CASE_ACTION_OR_AUTHORITY_FIELD');
const danglingSimulationParent = structuredClone(context);
danglingSimulationParent.simulationRegistry.simulations[0].caseStudyCode = 'ALR-LO-CASE-STUDY-UNKNOWN';
assert.equal(validateSimulationRegistry(danglingSimulationParent),
  'UNKNOWN_SIMULATION_PRACTICE_GUIDANCE_CASE_LESSON_OR_OBJECTIVE');
const danglingTransition = structuredClone(context);
danglingTransition.simulationRegistry.simulations[0].transitions[0].toStateCode = 'ALR-LO-STATE-UNKNOWN';
assert.equal(validateSimulationRegistry(danglingTransition), 'INVALID_OR_DANGLING_SIMULATION_TRANSITION');
const duplicateTransition = structuredClone(context);
duplicateTransition.simulationRegistry.simulations[0].transitions.push(
  structuredClone(duplicateTransition.simulationRegistry.simulations[0].transitions[0])
);
assert.equal(validateSimulationRegistry(duplicateTransition), 'DUPLICATE_SIMULATION_STATE_OR_TRANSITION');
const terminalOutgoing = structuredClone(context);
const terminalState = terminalOutgoing.simulationRegistry.simulations[0].states[1];
const terminalTransition = structuredClone(terminalOutgoing.simulationRegistry.simulations[0].transitions[0]);
terminalTransition.transitionCode += '-ILLEGAL';
terminalTransition.fromStateCode = terminalState.stateCode;
terminalOutgoing.simulationRegistry.simulations[0].transitions.push(terminalTransition);
assert.equal(validateSimulationRegistry(terminalOutgoing), 'SIMULATION_STATE_TRANSITION_RECIPROCITY_FAILURE');

const capturedReflection = structuredClone(context);
capturedReflection.reflectionRegistry.reflections[0].response = 'stored';
assert.equal(validateReflectionRegistry(capturedReflection), 'DENY_REFLECTION_RESPONSE_PERSONAL_OR_AUTHORITY_FIELD');
const personalReflection = structuredClone(context);
personalReflection.reflectionRegistry.reflections[0].personalHistory = 'personal';
assert.equal(validateReflectionRegistry(personalReflection), 'DENY_REFLECTION_RESPONSE_PERSONAL_OR_AUTHORITY_FIELD');
const emptyReflectionPrompts = structuredClone(context);
emptyReflectionPrompts.reflectionRegistry.reflections[0].promptGroups[0].prompts = [];
assert.equal(validateReflectionRegistry(emptyReflectionPrompts), 'UNRESOLVED_REFLECTION_PROMPTS');
const danglingReflection = structuredClone(context);
danglingReflection.reflectionRegistry.reflections[0].simulationCode = 'ALR-LO-SIMULATION-UNKNOWN';
assert.equal(validateReflectionRegistry(danglingReflection),
  'UNKNOWN_REFLECTION_PRACTICE_SIMULATION_LESSON_OR_OBJECTIVE');

const danglingBinding = structuredClone(context);
danglingBinding.practiceLearningBindingRegistry.bindings[0].reflectionCode = 'ALR-LO-REFLECTION-UNKNOWN';
assert.equal(validatePracticeLearningBindings(danglingBinding),
  'DANGLING_OR_MISMATCHED_PRACTICE_LEARNING_BINDING');
const crossedBinding = structuredClone(context);
crossedBinding.practiceLearningBindingRegistry.bindings[0].simulationCode =
  context.practiceLearningBindingRegistry.bindings[1].simulationCode;
assert.equal(validatePracticeLearningBindings(crossedBinding),
  'DANGLING_OR_MISMATCHED_PRACTICE_LEARNING_BINDING');

assert.equal(evaluatePracticeDeliveryEligibility(context, {
  requestedActivationState: 'CONTENT_SEMANTICS_READY_DELIVERY_BLOCKED'
}), 'CONTENT_SEMANTICS_READY_DELIVERY_BLOCKED');
assert.equal(evaluatePracticeDeliveryEligibility(context, {
  requestedActivationState: 'DELIVERY_ELIGIBLE', practiceReady: true, guidedPracticeReady: true,
  simulationReady: true, reflectionReady: true, assessmentReady: true, rdgPermissionResolved: true
}), 'DENY_RUNTIME_NOT_ACTIVATED');
assert.equal(evaluatePracticeDeliveryEligibility(context, {
  requestedActivationState: 'DELIVERY_ELIGIBLE', learnerReference: 'LEARNER-1'
}), 'DENY_LEARNER_CASE_ACTION_OR_AUTHORITY_DATA');

assert.equal(context.rdgLearningDataContract.rules.responseRequiresSensitivityAndRetentionClassification, true);
assert.equal(context.rdgLearningDataContract.rules.permissionMustBeResolvedBeforePersistence, true);
assert.equal(context.rdgLearningDataContract.rules.learningRecordMaySetCapabilityState, false);
assert.equal(context.capabilityEvidenceBoundary.rules.assessmentScoreAloneIsCapabilityEvidence, false);
assert.equal(context.capabilityEvidenceBoundary.rules.capabilityEvidenceIsCapabilityState, false);
assert.equal(context.capabilityEvidenceBoundary.rules.evidenceEligibilityDoesNotGrantCredential, true);
assert.equal(context.capabilityRegistry.rules.lessonCompletionIsCapability, false);
assert.equal(context.capabilityRegistry.rules.assessmentScoreIsCapability, false);
assert.equal(context.capabilityRegistry.rules.capabilityMayGrantCredential, false);
assert.equal(context.capabilityRegistry.rules.capabilityMayGrantEntitlement, false);

const freeze = await read(`${base}/freeze/alr-w20-w23-practice-freeze-v1.json`);
assert.equal(freeze.status, 'frozen');
assert.deepEqual(freeze.completedWorks, ['ALR-W20', 'ALR-W21', 'ALR-W22', 'ALR-W23']);
assert.equal(freeze.canonicalPracticeCount, 5);
assert.equal(freeze.canonicalGuidedPracticeCount, 5);
assert.equal(freeze.canonicalSimulationCount, 5);
assert.equal(freeze.canonicalReflectionCount, 5);
assert.equal(freeze.canonicalPracticeLessonBindingCount, 5);
assert.equal(freeze.staticSimulationTransitionResolutionActivated, true);
assert.equal(freeze.learnerPracticeAttemptRuntimeActivated, false);
assert.equal(freeze.adaptiveGuidanceOrProviderRuntimeActivated, false);
assert.equal(freeze.learnerSimulationSessionActivated, false);
assert.equal(freeze.realWorldActionOrProfessionalDecisionActivated, false);
assert.equal(freeze.reflectionResponseCaptureOrPersistenceActivated, false);
assert.equal(freeze.learnerDeliveryRuntimeActivated, false);
assert.equal(freeze.assessmentRuntimeActivated, false);
assert.equal(freeze.learnerDataWriteActivated, false);
assert.equal(freeze.capabilityEvidenceOrStatePromotionActivated, false);
assert.equal(freeze.w0W19FrozenContractsRegistriesRuntimeOrFreezeMutated, false);
assert.equal(freeze.rdgCarCprOrIcrAuthorityMutated, false);
assert.equal(freeze.nextWork, 'ALR-W24 Assessment');
for (const output of freeze.outputs) await fs.access(path.join(root, output));

const assertUniqueOrderedCommands = (actualCommands, requiredCommands) => {
  let priorIndex = -1;
  for (const command of requiredCommands) {
    const indexes = actualCommands.flatMap((candidate, index) => candidate === command ? [index] : []);
    assert.equal(indexes.length, 1, `postcheck command must occur exactly once: ${command}`);
    assert.ok(indexes[0] > priorIndex, `postcheck command order: ${command}`);
    priorIndex = indexes[0];
  }
};
const pkg = await read('package.json');
assert.equal(pkg.scripts['check:alr-w20-w23'], 'node scripts/check-alr-w20-w23-practice.mjs');
assert.equal(pkg.scripts['check:alr-practice'], 'npm run check:alr-w20-w23');
const requiredPostcheckCommands = [
  'npm run check:governance-data-closure', 'npm run check:alr-foundation',
  'npm run check:alr-capability', 'npm run check:alr-learning-architecture',
  'npm run check:car-reconciliation', 'npm run check:icr-foundation',
  'npm run check:icr-runtime', 'npm run check:alr-knowledge-learning', 'npm run check:alr-practice'
];
const postcheckCommands = pkg.scripts.postcheck.split('&&').map(command => command.trim());
assertUniqueOrderedCommands(postcheckCommands, requiredPostcheckCommands);
const simulatedParallelRmoCommands = [...postcheckCommands];
simulatedParallelRmoCommands.splice(simulatedParallelRmoCommands.indexOf('npm run check:icr-runtime') + 1,
  0, 'npm run check:rmo-foundation');
assertUniqueOrderedCommands(simulatedParallelRmoCommands, requiredPostcheckCommands);
assert.ok(simulatedParallelRmoCommands.indexOf('npm run check:rmo-foundation') >
  simulatedParallelRmoCommands.indexOf('npm run check:icr-runtime'));
assert.ok(simulatedParallelRmoCommands.indexOf('npm run check:rmo-foundation') <
  simulatedParallelRmoCommands.indexOf('npm run check:alr-knowledge-learning'));

const repairedW15Checker = await fs.readFile(path.join(root,
  'scripts/check-alr-w15-w19-knowledge-learning.mjs'), 'utf8');
assert.ok(repairedW15Checker.includes('assertUniqueOrderedCommands'));
assert.ok(repairedW15Checker.includes('simulatedParallelRmoCommands'));
assert.ok(!repairedW15Checker.includes('requiredPostcheckPrefix'));
assert.ok(!repairedW15Checker.includes('postcheck.startsWith'));

console.log('✓ ALR-W20～W23 Practice passed.');
console.log('✓ 5 unscored Practices → 5 static Guided Practices → 5 closed synthetic Simulations → 5 no-capture Reflection definitions are reciprocal across all 5 Lessons.');
console.log('✓ Simulation resolution is pure and non-persistent; Assessment, learner data, adaptive providers, real-world action and capability or professional authority promotion remain inactive.');
console.log('✓ postcheck governance accepts ordered parallel insertion: ICR Runtime → RMO Foundation → ALR Knowledge → ALR Practice.');
