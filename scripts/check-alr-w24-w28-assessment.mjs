import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  buildAssessmentEvidenceRdgHandoff,
  buildLessonAssessmentProjection,
  evaluateAssessment,
  evaluateAssessmentDeliveryEligibility,
  validateAssessmentIntegrity,
  validateAssessmentIntegrityRuleRegistry,
  validateAssessmentLearningBindings,
  validateAssessmentRegistry,
  validateAssessmentRuntime,
  validateAssessmentTypeRegistry,
  validateLearningFeedbackRegistry
} from './lib/academy-learning-runtime/alr-assessment-v1.mjs';
import {
  evaluateCapabilityEvidence as evaluateRdgCapabilityEvidence,
  evaluateLearningRecord as evaluateRdgLearningRecord
} from './lib/reality-data-governance/rdg-analytics-alr-research-v1.mjs';

const root = process.cwd();
const base = 'content/academy/academy-learning-runtime';
const read = async file => JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));
const normalizeText = source => source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const digest = async file => crypto.createHash('sha256')
  .update(normalizeText(await fs.readFile(path.join(root, file), 'utf8')), 'utf8')
  .digest('hex');

const audit = await read(`${base}/audits/alr-assessment-reconciliation-v1.json`);
assert.equal(audit.baselineCommit, '5430224d5fb21232d77c19b0f854ba4f802a73a7');
assert.equal(audit.scope, 'ALR-W24-W28');
assert.deepEqual(audit.implementationDecision, {
  assessmentCount: 5,
  assessmentTypeCount: 5,
  assessmentCriterionCount: 10,
  feedbackStateCount: 8,
  assessmentBindingOverlayRequired: true,
  assessmentDefinitionsMayStoreRawResponseOrResult: false,
  assessmentEvaluationUsesGovernedStructuredFindings: true,
  assessmentEvaluationMayCallProviderOrAi: false,
  assessmentScoreMayBecomeCapability: false,
  assessmentResultMayBecomeCapabilityEvidenceAutomatically: false,
  feedbackMaySetCapabilityState: false,
  assessmentEvidenceMayBeHandedToRdgAsUnmaterializedCandidate: true,
  alrMayPersistAssessmentResponseResultOrEvidence: false,
  learnerDeliveryMayBeActivated: false
});
assert.equal(audit.parallelRuntimeBoundary.rmoFoundationPresent, true);
assert.equal(audit.parallelRuntimeBoundary.assessmentUsesSyntheticAlrScenarioOnly, true);
assert.equal(audit.parallelRuntimeBoundary.assessmentMayReadOrMutateCanonicalReality, false);
assert.equal(audit.parallelRuntimeBoundary.packageIntegrationMustPreserveExistingRmoAliasesAndCommands, true);
assert.equal(audit.preservation.w0W23ContractsRegistriesRuntimeOrFreezeMutated, false);
assert.equal(audit.preservation.lessonObjectiveCapabilityOrPracticeAuthorityMutated, false);
assert.equal(audit.preservation.rdgCarCprIcrOrRmoAuthorityMutated, false);
assert.equal(audit.preservation.existingRuntimeOrUserDataMutated, false);
for (const source of audit.inspectedAuthorities) {
  await fs.access(path.join(root, source.reference));
  assert.equal(await digest(source.reference), source.sha256, source.reference);
}

const masterWork = await read('content/governance/canonical-master-work/registries/canonical-master-work-registry-v1.json');
const workEntries = masterWork.entries.filter(entry => /^ALR-W(?:24|25|26|27|28)$/.test(entry.workCode));
assert.deepEqual(workEntries.map(entry => entry.workCode), ['ALR-W24', 'ALR-W25', 'ALR-W26', 'ALR-W27', 'ALR-W28']);
assert.deepEqual(workEntries.map(entry => entry.executionOrder), [137, 138, 139, 140, 141]);
assert.ok(workEntries.every(entry => entry.runtimeCode === 'ALR' && entry.status === 'PLANNED'));

const context = {
  assessmentContract: await read(`${base}/contracts/assessment-contract-v1.json`),
  assessmentTypeContract: await read(`${base}/contracts/assessment-type-contract-v1.json`),
  assessmentIntegrityContract: await read(`${base}/contracts/assessment-integrity-contract-v1.json`),
  learningFeedbackContract: await read(`${base}/contracts/learning-feedback-contract-v1.json`),
  assessmentEvidenceRdgHandoffContract: await read(`${base}/contracts/assessment-evidence-rdg-handoff-contract-v1.json`),
  practiceContract: await read(`${base}/contracts/practice-registry-contract-v1.json`),
  guidedPracticeContract: await read(`${base}/contracts/guided-practice-contract-v1.json`),
  simulationContract: await read(`${base}/contracts/simulation-runtime-contract-v1.json`),
  reflectionContract: await read(`${base}/contracts/reflection-runtime-contract-v1.json`),
  typeRegistry: await read(`${base}/registries/learning-object-registry-v1.json`),
  lessonRegistry: await read(`${base}/registries/lesson-registry-v1.json`),
  learningObjectiveRegistry: await read(`${base}/registries/learning-objective-registry-v1.json`),
  capabilityRegistry: await read(`${base}/registries/capability-registry-v1.json`),
  capabilityStateRegistry: await read(`${base}/registries/capability-state-registry-v1.json`),
  knowledgeLearningBindingRegistry: await read(`${base}/registries/knowledge-learning-binding-registry-v1.json`),
  caseStudyRegistry: await read(`${base}/registries/case-study-registry-v1.json`),
  practiceRegistry: await read(`${base}/registries/practice-registry-v1.json`),
  guidedPracticeRegistry: await read(`${base}/registries/guided-practice-registry-v1.json`),
  simulationRegistry: await read(`${base}/registries/simulation-registry-v1.json`),
  reflectionRegistry: await read(`${base}/registries/reflection-registry-v1.json`),
  practiceLearningBindingRegistry: await read(`${base}/registries/practice-learning-binding-registry-v1.json`),
  assessmentTypeRegistry: await read(`${base}/registries/assessment-type-registry-v1.json`),
  assessmentIntegrityRuleRegistry: await read(`${base}/registries/assessment-integrity-rule-registry-v1.json`),
  learningFeedbackRegistry: await read(`${base}/registries/learning-feedback-registry-v1.json`),
  assessmentRegistry: await read(`${base}/registries/assessment-registry-v1.json`),
  assessmentLearningBindingRegistry: await read(`${base}/registries/assessment-learning-binding-registry-v1.json`),
  rdgLearningDataContract: await read('content/governance/reality-data-governance/contracts/alr-learning-data-contract-v1.json'),
  rdgCapabilityEvidenceBoundary: await read('content/governance/reality-data-governance/contracts/capability-evidence-boundary-v1.json'),
  carAlrCprReconciliation: await read('content/professional/canonical-asset-runtime/contracts/car-alr-cpr-authority-reconciliation-v1.json'),
  rmoFreeze: await read('content/runtime/reality-model-runtime/freeze/rmo-w0-w4-reality-foundation-freeze-v1.json')
};

assert.equal(validateAssessmentTypeRegistry(context), 'VALID_ASSESSMENT_TYPE_REGISTRY');
assert.equal(validateAssessmentIntegrityRuleRegistry(context), 'VALID_ASSESSMENT_INTEGRITY_RULE_REGISTRY');
assert.equal(validateAssessmentRegistry(context), 'VALID_ASSESSMENT_REGISTRY');
assert.equal(validateLearningFeedbackRegistry(context), 'VALID_LEARNING_FEEDBACK_REGISTRY');
assert.equal(validateAssessmentLearningBindings(context), 'VALID_ASSESSMENT_LEARNING_BINDINGS');
assert.equal(validateAssessmentRuntime(context), 'VALID_ASSESSMENT_RUNTIME');

assert.equal(context.assessmentTypeRegistry.assessmentTypes.length, 5);
assert.equal(context.assessmentRegistry.assessments.length, 5);
assert.equal(context.assessmentRegistry.assessments.flatMap(item => item.criterionRubrics).length, 10);
assert.equal(context.learningFeedbackRegistry.feedbackDefinitions.length, 8);
assert.equal(context.assessmentLearningBindingRegistry.bindings.length, 5);
assert.deepEqual(context.learningFeedbackRegistry.feedbackStateCodes, [
  'SUPPORTED', 'PARTIALLY_SUPPORTED', 'UNSUPPORTED', 'OVER_INTERPRETED',
  'BOUNDARY_MISSED', 'UNKNOWN_IGNORED', 'EVIDENCE_MISSING', 'CONSTRAINT_MISREAD'
]);
assert.deepEqual(context.learningFeedbackRegistry.evaluationPriority, [
  'EVIDENCE_MISSING', 'UNKNOWN_IGNORED', 'CONSTRAINT_MISREAD', 'BOUNDARY_MISSED',
  'OVER_INTERPRETED', 'UNSUPPORTED', 'PARTIALLY_SUPPORTED', 'SUPPORTED'
]);
assert.ok(context.learningObjectiveRegistry.learningObjectives.every(item =>
  item.assessmentAlignmentState === 'PENDING_ALR-W24'
));
assert.ok(context.lessonRegistry.lessons.every(lesson =>
  Object.values(lesson.futureIntegrationReferences).every(references => references.length === 0)
));
assert.ok(context.assessmentRegistry.assessments.every(item =>
  item.resultState === 'DEFINITION_ONLY_NO_RESPONSE_OR_RESULT' &&
  item.deliveryActivationState === 'CONTENT_SEMANTICS_READY_DELIVERY_BLOCKED'
));
assert.equal(context.capabilityRegistry.rules.assessmentScoreIsCapability, false);
assert.equal(context.capabilityRegistry.rules.capabilityEvidenceIsCapabilityState, false);
assert.equal(context.capabilityStateRegistry.rules.persistentCapabilityStateActivated, false);
assert.equal(context.rdgLearningDataContract.rules.assessmentScoreIsCapability, false);
assert.equal(context.rdgLearningDataContract.rules.permissionMustBeResolvedBeforePersistence, true);
assert.equal(context.rdgLearningDataContract.rules.responseRequiresSensitivityAndRetentionClassification, true);
assert.equal(context.rdgCapabilityEvidenceBoundary.rules.assessmentScoreAloneIsCapabilityEvidence, false);
assert.equal(context.rdgCapabilityEvidenceBoundary.rules.capabilityEvidenceIsCapabilityState, false);
assert.equal(context.carAlrCprReconciliation.workInterpretation['CAR-W7'].equations.carQuizBriefEqualsAlrAssessmentRuntime, false);
assert.equal(context.carAlrCprReconciliation.workInterpretation['CAR-W7'].rules.carMayScoreAssessment, false);
assert.equal(context.rmoFreeze.status, 'RMO-W0-W4-FOUNDATION-FROZEN');

const beforeProjection = JSON.stringify(context);
for (const lesson of context.lessonRegistry.lessons) {
  const projection = buildLessonAssessmentProjection(context, lesson.lessonCode);
  assert.equal(projection.lesson.lessonCode, lesson.lessonCode);
  assert.equal(projection.assessment.lessonCode, lesson.lessonCode);
  assert.equal(projection.binding.assessmentCode, projection.assessment.assessmentCode);
  assert.equal(projection.binding.assessmentTypeCode, projection.assessmentType.assessmentTypeCode);
}
assert.equal(buildLessonAssessmentProjection(context, 'ALR-LO-LESSON-UNKNOWN'), null);
assert.equal(JSON.stringify(context), beforeProjection);

const assessment = context.assessmentRegistry.assessments[0];
const finding = (criterionCode, overrides = {}) => ({
  criterionCode,
  evidencePresent: true,
  unknownsPreserved: true,
  constraintsCorrect: true,
  interpretationBounded: true,
  boundaryPreserved: true,
  supportLevel: 'FULL',
  ...overrides
});
const evaluationInput = overrides => ({
  assessmentCode: assessment.assessmentCode,
  assessmentVersion: assessment.assessmentVersion,
  assessmentTypeCode: assessment.assessmentTypeCode,
  scenarioVersion: assessment.scenarioVersion,
  criterionFindings: assessment.criterionRubrics.map(item => finding(item.criterionCode)),
  ...overrides
});

const beforeEvaluation = JSON.stringify(context);
const supportedEvaluation = evaluateAssessment(context, evaluationInput({}));
assert.equal(supportedEvaluation.decision, 'ASSESSMENT_EVALUATED_SEMANTIC_NO_PERSISTENCE');
assert.equal(supportedEvaluation.aggregateFeedbackCode, 'SUPPORTED');
assert.ok(supportedEvaluation.criterionFeedbackResults.every(item =>
  item.feedbackCode === 'SUPPORTED' && item.criterionEvidenceStatus === 'MET'
));
assert.equal(supportedEvaluation.capabilityStateEffect, 'NONE');
assert.equal(supportedEvaluation.persistenceEffect, 'NONE');
assert.equal(JSON.stringify(context), beforeEvaluation);

const feedbackCases = [
  ['PARTIALLY_SUPPORTED', { supportLevel: 'PARTIAL' }, 'NOT_MET'],
  ['UNSUPPORTED', { supportLevel: 'NONE' }, 'NOT_MET'],
  ['OVER_INTERPRETED', { interpretationBounded: false }, 'NOT_MET'],
  ['BOUNDARY_MISSED', { boundaryPreserved: false }, 'NOT_MET'],
  ['UNKNOWN_IGNORED', { unknownsPreserved: false }, 'NOT_MET'],
  ['EVIDENCE_MISSING', { evidencePresent: false }, 'UNKNOWN'],
  ['CONSTRAINT_MISREAD', { constraintsCorrect: false }, 'NOT_MET']
];
for (const [expectedFeedback, findingOverride, expectedCriterionStatus] of feedbackCases) {
  const input = evaluationInput({});
  input.criterionFindings[0] = finding(input.criterionFindings[0].criterionCode, findingOverride);
  const result = evaluateAssessment(context, input);
  assert.equal(result.aggregateFeedbackCode, expectedFeedback);
  assert.equal(result.criterionFeedbackResults[0].feedbackCode, expectedFeedback);
  assert.equal(result.criterionFeedbackResults[0].criterionEvidenceStatus, expectedCriterionStatus);
}
const precedenceInput = evaluationInput({});
precedenceInput.criterionFindings[0] = finding(precedenceInput.criterionFindings[0].criterionCode, {
  evidencePresent: false, unknownsPreserved: false, constraintsCorrect: false,
  interpretationBounded: false, boundaryPreserved: false, supportLevel: 'NONE'
});
assert.equal(evaluateAssessment(context, precedenceInput).aggregateFeedbackCode, 'EVIDENCE_MISSING');

assert.equal(validateAssessmentIntegrity(context, evaluationInput({})), 'INTEGRITY_VALID');
assert.equal(validateAssessmentIntegrity(context, evaluationInput({ assessmentCode: 'ALR-LO-ASSESSMENT-UNKNOWN' })),
  'DENY_UNKNOWN_ASSESSMENT');
assert.equal(validateAssessmentIntegrity(context, evaluationInput({ assessmentVersion: '2.0.0' })),
  'DENY_VERSION_MISMATCH');
assert.equal(validateAssessmentIntegrity(context, evaluationInput({ assessmentTypeCode: 'ALR-ASMT-TYPE-UNKNOWN' })),
  'DENY_TYPE_MISMATCH');
assert.equal(validateAssessmentIntegrity(context, evaluationInput({ scenarioVersion: '2.0.0' })),
  'DENY_SCENARIO_VERSION_MISMATCH');
const missingCriterion = evaluationInput({});
missingCriterion.criterionFindings.pop();
assert.equal(validateAssessmentIntegrity(context, missingCriterion), 'DENY_CRITERION_COVERAGE');
const duplicateCriterion = evaluationInput({});
duplicateCriterion.criterionFindings[1].criterionCode = duplicateCriterion.criterionFindings[0].criterionCode;
assert.equal(validateAssessmentIntegrity(context, duplicateCriterion), 'DENY_CRITERION_COVERAGE');
const extraFindingField = evaluationInput({});
extraFindingField.criterionFindings[0].comment = 'uncontrolled';
assert.equal(validateAssessmentIntegrity(context, extraFindingField), 'DENY_FINDING_SHAPE');
const invalidFindingValue = evaluationInput({});
invalidFindingValue.criterionFindings[0].supportLevel = 'INFERRED';
assert.equal(validateAssessmentIntegrity(context, invalidFindingValue), 'DENY_FINDING_SHAPE');
assert.equal(validateAssessmentIntegrity(context, { ...evaluationInput({}), rawResponse: 'learner text' }),
  'DENY_FORBIDDEN_INPUT_FIELD');
assert.equal(validateAssessmentIntegrity(context, { ...evaluationInput({}), providerResponse: 'model score' }),
  'DENY_FORBIDDEN_INPUT_FIELD');
const inactiveContext = structuredClone(context);
inactiveContext.assessmentRegistry.assessments[0].status = 'SUSPENDED';
assert.equal(validateAssessmentIntegrity(inactiveContext, evaluationInput({})), 'DENY_INACTIVE_DEFINITION');

const typeProvider = structuredClone(context);
typeProvider.assessmentTypeRegistry.assessmentTypes[0].providerPrompt = 'score this';
assert.equal(validateAssessmentTypeRegistry(typeProvider), 'DENY_ASSESSMENT_TYPE_DATA_PROVIDER_OR_AUTHORITY_FIELD');
const typeVerbMismatch = structuredClone(context);
typeVerbMismatch.assessmentTypeRegistry.assessmentTypes[0].supportedActionVerbs[0] = 'BOUND';
assert.equal(validateAssessmentTypeRegistry(typeVerbMismatch), 'ASSESSMENT_TYPE_CAPABILITY_OBJECTIVE_MISMATCH');
const assessmentAnswerKey = structuredClone(context);
assessmentAnswerKey.assessmentRegistry.assessments[0].answerKey = 'correct answer';
assert.equal(validateAssessmentRegistry(assessmentAnswerKey),
  'DENY_ASSESSMENT_RESPONSE_RESULT_PROVIDER_OR_AUTHORITY_FIELD');
const assessmentRawResponse = structuredClone(context);
assessmentRawResponse.assessmentRegistry.assessments[0].rawResponse = 'learner text';
assert.equal(validateAssessmentRegistry(assessmentRawResponse),
  'DENY_ASSESSMENT_RESPONSE_RESULT_PROVIDER_OR_AUTHORITY_FIELD');
const assessmentProvider = structuredClone(context);
assessmentProvider.assessmentRegistry.assessments[0].providerResponse = 'model score';
assert.equal(validateAssessmentRegistry(assessmentProvider),
  'DENY_ASSESSMENT_RESPONSE_RESULT_PROVIDER_OR_AUTHORITY_FIELD');
const assessmentBindingMismatch = structuredClone(context);
assessmentBindingMismatch.assessmentRegistry.assessments[0].practiceLearningBindingCode = 'ALR-PLB-UNKNOWN';
assert.equal(validateAssessmentRegistry(assessmentBindingMismatch),
  'UNKNOWN_ASSESSMENT_TYPE_BINDING_PRACTICE_CASE_LESSON_CAPABILITY_OR_RULE_SET');
const assessmentCaseMismatch = structuredClone(context);
assessmentCaseMismatch.assessmentRegistry.assessments[0].caseStudyCode = 'ALR-LO-CASE-STUDY-UNKNOWN';
assert.equal(validateAssessmentRegistry(assessmentCaseMismatch),
  'UNKNOWN_ASSESSMENT_TYPE_BINDING_PRACTICE_CASE_LESSON_CAPABILITY_OR_RULE_SET');
const assessmentCriterionMismatch = structuredClone(context);
assessmentCriterionMismatch.assessmentRegistry.assessments[0].criterionRubrics[0].criterionCode = 'UNKNOWN_CRITERION';
assert.equal(validateAssessmentRegistry(assessmentCriterionMismatch), 'ASSESSMENT_CAPABILITY_CRITERION_MISMATCH');
const duplicateAssessment = structuredClone(context);
duplicateAssessment.assessmentRegistry.assessments[1].assessmentCode =
  duplicateAssessment.assessmentRegistry.assessments[0].assessmentCode;
assert.equal(validateAssessmentRegistry(duplicateAssessment), 'DUPLICATE_ASSESSMENT_CODE');

const feedbackMissingState = structuredClone(context);
feedbackMissingState.learningFeedbackRegistry.feedbackDefinitions.pop();
assert.equal(validateLearningFeedbackRegistry(feedbackMissingState), 'LEARNING_FEEDBACK_STATE_COVERAGE_FAILURE');
const feedbackPriorityMismatch = structuredClone(context);
feedbackPriorityMismatch.learningFeedbackRegistry.feedbackDefinitions[0].priority = 1;
assert.equal(validateLearningFeedbackRegistry(feedbackPriorityMismatch), 'INVALID_LEARNING_FEEDBACK_PRIORITY');
const feedbackEvidenceMismatch = structuredClone(context);
feedbackEvidenceMismatch.learningFeedbackRegistry.feedbackDefinitions[0].criterionEvidenceStatus = 'UNKNOWN';
assert.equal(validateLearningFeedbackRegistry(feedbackEvidenceMismatch),
  'INVALID_LEARNING_FEEDBACK_TRIGGER_OR_EVIDENCE_MAPPING');
const danglingAssessmentBinding = structuredClone(context);
danglingAssessmentBinding.assessmentLearningBindingRegistry.bindings[0].assessmentCode = 'ALR-LO-ASSESSMENT-UNKNOWN';
assert.equal(validateAssessmentLearningBindings(danglingAssessmentBinding),
  'DANGLING_OR_MISMATCHED_ASSESSMENT_LEARNING_BINDING');

const handoffInput = {
  assessmentEvidenceCode: 'ALR-AE-EVIDENCE-DISTINCTION-001',
  learningRecordReference: 'RDG-LR-001',
  practiceAttemptReference: 'RDG-PA-001',
  assessmentResponseReference: 'RDG-AR-001',
  recordedAt: '2026-08-10T00:00:00Z',
  permissionDecision: 'ALLOW_FOR_RDG_HANDOFF',
  sensitivityClass: 'PERSONAL',
  retentionClass: 'SERVICE_SCOPED'
};
const beforeHandoff = JSON.stringify({ context, supportedEvaluation, handoffInput });
const handoffResult = buildAssessmentEvidenceRdgHandoff(context, supportedEvaluation, handoffInput);
assert.equal(handoffResult.decision, 'READY_FOR_RDG_ELIGIBILITY_REVIEW');
assert.equal(handoffResult.handoff.recordType, 'ASSESSMENT_RESULT');
assert.equal(handoffResult.handoff.materializationState, 'NOT_MATERIALIZED_ALR_HANDOFF_ONLY');
assert.equal(handoffResult.handoff.semanticAuthority, 'ALR');
assert.equal(handoffResult.handoff.dataGovernanceAuthority, 'RDG');
assert.ok(handoffResult.handoff.criterionResults.every(item => item.status === 'MET'));
assert.equal(evaluateRdgLearningRecord(handoffResult.handoff), 'UNRESOLVED');
assert.equal(evaluateRdgCapabilityEvidence(handoffResult.handoff), 'INSUFFICIENT');
assert.equal(JSON.stringify({ context, supportedEvaluation, handoffInput }), beforeHandoff);
assert.equal(buildAssessmentEvidenceRdgHandoff(context, supportedEvaluation,
  { ...handoffInput, permissionDecision: 'DENY' }).decision, 'DENY_PERMISSION');
assert.equal(buildAssessmentEvidenceRdgHandoff(context, supportedEvaluation,
  { ...handoffInput, permissionDecision: 'UNKNOWN' }).decision, 'DENY_UNKNOWN_PERMISSION');
assert.equal(buildAssessmentEvidenceRdgHandoff(context, supportedEvaluation,
  { ...handoffInput, sensitivityClass: undefined }).decision, 'DENY_UNRESOLVED_HANDOFF_FIELDS');
assert.equal(buildAssessmentEvidenceRdgHandoff(context, supportedEvaluation,
  { ...handoffInput, assessmentEvidenceCode: 'INVALID' }).decision, 'DENY_ASSESSMENT_EVIDENCE_IDENTITY');
assert.equal(buildAssessmentEvidenceRdgHandoff(context, supportedEvaluation,
  { ...handoffInput, rawResponse: 'learner text' }).decision, 'DENY_HANDOFF_DATA_OR_AUTHORITY_FIELD');
assert.equal(buildAssessmentEvidenceRdgHandoff(context, { decision: 'DENY_VERSION_MISMATCH' },
  handoffInput).decision, 'DENY_UNRESOLVED_ASSESSMENT_EVALUATION');
const tamperedEvaluation = structuredClone(supportedEvaluation);
tamperedEvaluation.criterionFeedbackResults[0].criterionEvidenceStatus = 'UNKNOWN';
assert.equal(buildAssessmentEvidenceRdgHandoff(context, tamperedEvaluation, handoffInput).decision,
  'DENY_FEEDBACK_EVIDENCE_MAPPING');
assert.equal(buildAssessmentEvidenceRdgHandoff(context, supportedEvaluation,
  { ...handoffInput, practiceAttemptReference: handoffInput.learningRecordReference }).decision,
  'DENY_LINEAGE_REFERENCE_COLLISION');

assert.equal(evaluateAssessmentDeliveryEligibility(context, {
  requestedActivationState: 'CONTENT_SEMANTICS_READY_DELIVERY_BLOCKED'
}), 'CONTENT_SEMANTICS_READY_DELIVERY_BLOCKED');
assert.equal(evaluateAssessmentDeliveryEligibility(context, {
  requestedActivationState: 'DELIVERY_ELIGIBLE', assessmentDefinitionReady: true,
  integrityReady: true, feedbackReady: true, rdgPermissionResolved: true, rdgPersistenceReady: true
}), 'DENY_RUNTIME_NOT_ACTIVATED');
assert.equal(evaluateAssessmentDeliveryEligibility(context, {
  requestedActivationState: 'DELIVERY_ELIGIBLE', learnerReference: 'LEARNER-1'
}), 'DENY_LEARNER_DATA_OR_AUTHORITY_FIELD');

const freeze = await read(`${base}/freeze/alr-w24-w28-assessment-freeze-v1.json`);
assert.equal(freeze.status, 'frozen');
assert.deepEqual(freeze.completedWorks, ['ALR-W24', 'ALR-W25', 'ALR-W26', 'ALR-W27', 'ALR-W28']);
assert.equal(freeze.canonicalAssessmentCount, 5);
assert.equal(freeze.canonicalAssessmentTypeCount, 5);
assert.equal(freeze.canonicalAssessmentCriterionCount, 10);
assert.equal(freeze.canonicalFeedbackStateCount, 8);
assert.equal(freeze.canonicalAssessmentLessonBindingCount, 5);
assert.equal(freeze.deterministicSemanticEvaluationActivated, true);
assert.equal(freeze.assessmentEvidenceRdgCandidateHandoffActivated, true);
assert.equal(freeze.learnerAssessmentSessionActivated, false);
assert.equal(freeze.rawResponseResultOrScoreStorageActivated, false);
assert.equal(freeze.providerAiOrNetworkScoringActivated, false);
assert.equal(freeze.learnerDataPersistenceActivated, false);
assert.equal(freeze.rdgMaterializationFromAlrActivated, false);
assert.equal(freeze.capabilityEvidencePromotionActivated, false);
assert.equal(freeze.capabilityStatePersistenceActivated, false);
assert.equal(freeze.canonicalRealityCaseOrEvidenceCreated, false);
assert.equal(freeze.w0W23FrozenContractsRegistriesRuntimeOrFreezeMutated, false);
assert.equal(freeze.rdgCarCprIcrOrRmoAuthorityMutated, false);
assert.equal(freeze.nextWork, 'ALR-W29 Progress and Completion');
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
assert.equal(pkg.scripts['check:alr-w24-w28'], 'node scripts/check-alr-w24-w28-assessment.mjs');
assert.equal(pkg.scripts['check:alr-assessment'], 'npm run check:alr-w24-w28');
assert.equal(pkg.scripts['check:rmo-foundation'], 'npm run check:rmo-w0-w4');
const requiredPostcheckCommands = [
  'npm run check:governance-data-closure', 'npm run check:alr-foundation',
  'npm run check:alr-capability', 'npm run check:alr-learning-architecture',
  'npm run check:car-reconciliation', 'npm run check:icr-foundation',
  'npm run check:icr-runtime', 'npm run check:alr-knowledge-learning',
  'npm run check:alr-practice', 'npm run check:alr-assessment'
];
const postcheckCommands = pkg.scripts.postcheck.split('&&').map(command => command.trim());
assertUniqueOrderedCommands(postcheckCommands, requiredPostcheckCommands);
const simulatedParallelRmoCommands = [...postcheckCommands];
if (!simulatedParallelRmoCommands.includes('npm run check:rmo-foundation')) {
  simulatedParallelRmoCommands.splice(
    simulatedParallelRmoCommands.indexOf('npm run check:icr-runtime') + 1,
    0,
    'npm run check:rmo-foundation'
  );
}
assertUniqueOrderedCommands(simulatedParallelRmoCommands, [
  'npm run check:icr-runtime', 'npm run check:rmo-foundation',
  'npm run check:alr-knowledge-learning', 'npm run check:alr-practice', 'npm run check:alr-assessment'
]);

console.log('✓ ALR-W24～W28 Assessment passed.');
console.log('✓ 5 Assessment types → 5 synthetic Assessments → 10 Objective/Capability criteria → 8 controlled PHI OS Feedback states are reciprocal and deterministic.');
console.log('✓ Integrity fails closed before feedback; raw responses, answer keys, scores, Provider/AI scoring, learner persistence and Reality/RMO authority remain excluded.');
console.log('✓ Assessment Evidence produces only an unmaterialized candidate for RDG review; Capability Evidence, Capability State, Credential, Entitlement and Professional authority are not promoted.');
console.log('✓ postcheck governance accepts parallel order: ICR Runtime → RMO Foundation → ALR Knowledge → ALR Practice → ALR Assessment.');
