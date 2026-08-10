import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  buildLearningProgressScopeProjection,
  evaluateLearningContinuity,
  evaluateLearningProgress,
  evaluateLearningProgressDeliveryEligibility,
  evaluateLearningReviewRetention,
  resolveLearningRecommendation,
  validateLearningContinuityStateRegistry,
  validateLearningProgressRuntime,
  validateLearningProgressScopeRegistry,
  validateLearningProgressStateRegistry,
  validateLearningRecommendationRuleRegistry,
  validateLearningReviewRuleRegistry
} from './lib/academy-learning-runtime/alr-progress-v1.mjs';

const root = process.cwd();
const base = 'content/academy/academy-learning-runtime';
const read = async file => JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));
const normalizeText = source => source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const digest = async file => crypto.createHash('sha256')
  .update(normalizeText(await fs.readFile(path.join(root, file), 'utf8')), 'utf8')
  .digest('hex');

const audit = await read(`${base}/audits/alr-progress-reconciliation-v1.json`);
assert.equal(audit.auditVersion, '1.0.1');
assert.equal(audit.baselineCommit, '6920c9efb164a6e29f7dcbd8575f7a54e9d28c2f');
assert.equal(audit.scope, 'ALR-W29-W32');
assert.deepEqual(audit.implementationDecision, {
  progressScopeCount: 5,
  progressStateCount: 7,
  continuityDecisionCount: 7,
  reviewDecisionCount: 8,
  recommendationActionCount: 11,
  progressAndCompletionAreCapability: false,
  progressMaySetCapabilityState: false,
  progressContinuityReviewAndRecommendationArePureSemanticEvaluations: true,
  alrMayChooseRetentionClassDurationExpiryDeletionOrLegalHold: false,
  recommendationIsExplainableOptionRequiringChoice: true,
  recommendationMayAutoEnrollAssignUnlockOrPurchase: false,
  providerAiPersonalizationMayBeActivated: false,
  learnerProgressOrRecommendationMayBePersisted: false,
  learnerDeliveryMayBeActivated: false
});
assert.equal(audit.parallelWorkBoundary.rmoW5W7Present, true);
assert.equal(audit.parallelWorkBoundary.wave1C2FreezeResolutionPresent, true);
assert.equal(audit.parallelWorkBoundary.wave1ValidationMode, 'PRESENCE_ONLY_NOT_ALR_CONTENT_HASH');
assert.equal(audit.parallelWorkBoundary.wave1MayAdvanceWithoutAlrHashRefresh, true);
assert.equal(audit.parallelWorkBoundary.packageIntegrationMustPreserveRmoAndWave1Commands, true);
assert.equal(audit.preservation.alrW0W28ContractsRegistriesRuntimeOrFreezeMutated, false);
assert.equal(audit.preservation.programPathModuleLessonObjectivePracticeAssessmentOrCapabilityAuthorityMutated, false);
assert.equal(audit.preservation.rdgRmoWave1CarCprIcrOrPwsAuthorityMutated, false);
assert.equal(audit.preservation.existingRuntimeOrUserDataMutated, false);
for (const source of audit.inspectedAuthorities) {
  await fs.access(path.join(root, source.reference));
  assert.equal(await digest(source.reference), source.sha256, source.reference);
}
await fs.access(path.join(root, audit.parallelWorkBoundary.wave1C2FreezeResolutionReference));

const masterWork = await read('content/governance/canonical-master-work/registries/canonical-master-work-registry-v1.json');
const workEntries = masterWork.entries.filter(entry => /^ALR-W(?:29|30|31|32)$/.test(entry.workCode));
assert.deepEqual(workEntries.map(entry => entry.workCode), ['ALR-W29', 'ALR-W30', 'ALR-W31', 'ALR-W32']);
assert.deepEqual(workEntries.map(entry => entry.executionOrder), [142, 143, 144, 145]);
assert.ok(workEntries.every(entry => entry.runtimeCode === 'ALR' && entry.status === 'PLANNED'));

const context = {
  learningProgressContract: await read(`${base}/contracts/learning-progress-contract-v1.json`),
  learningContinuityContract: await read(`${base}/contracts/learning-continuity-contract-v1.json`),
  learningReviewRetentionContract: await read(`${base}/contracts/learning-review-retention-contract-v1.json`),
  learningRecommendationContract: await read(`${base}/contracts/learning-recommendation-contract-v1.json`),
  learningProgressStateRegistry: await read(`${base}/registries/learning-progress-state-registry-v1.json`),
  learningProgressScopeRegistry: await read(`${base}/registries/learning-progress-scope-registry-v1.json`),
  learningContinuityStateRegistry: await read(`${base}/registries/learning-continuity-state-registry-v1.json`),
  learningReviewRuleRegistry: await read(`${base}/registries/learning-review-rule-registry-v1.json`),
  learningRecommendationRuleRegistry: await read(`${base}/registries/learning-recommendation-rule-registry-v1.json`),
  programRegistry: await read(`${base}/registries/program-registry-v1.json`),
  learningPathRegistry: await read(`${base}/registries/learning-path-registry-v1.json`),
  moduleRegistry: await read(`${base}/registries/module-registry-v1.json`),
  lessonRegistry: await read(`${base}/registries/lesson-registry-v1.json`),
  practiceRegistry: await read(`${base}/registries/practice-registry-v1.json`),
  assessmentRegistry: await read(`${base}/registries/assessment-registry-v1.json`),
  capabilityRegistry: await read(`${base}/registries/capability-registry-v1.json`),
  capabilityDependencyGraph: await read(`${base}/registries/capability-dependency-graph-v1.json`),
  capabilityStateRegistry: await read(`${base}/registries/capability-state-registry-v1.json`),
  capabilityGapContract: await read(`${base}/contracts/capability-gap-contract-v1.json`),
  rdgLearningDataContract: await read('content/governance/reality-data-governance/contracts/alr-learning-data-contract-v1.json'),
  rdgRetentionContract: await read('content/governance/reality-data-governance/contracts/retention-runtime-contract-v1.json'),
  rdgRetentionRegistry: await read('content/governance/reality-data-governance/registries/canonical-data-retention-registry-v1.json')
};

assert.equal(validateLearningProgressStateRegistry(context), 'VALID_LEARNING_PROGRESS_STATE_REGISTRY');
assert.equal(validateLearningProgressScopeRegistry(context), 'VALID_LEARNING_PROGRESS_SCOPE_REGISTRY');
assert.equal(validateLearningContinuityStateRegistry(context), 'VALID_LEARNING_CONTINUITY_STATE_REGISTRY');
assert.equal(validateLearningReviewRuleRegistry(context), 'VALID_LEARNING_REVIEW_RULE_REGISTRY');
assert.equal(validateLearningRecommendationRuleRegistry(context), 'VALID_LEARNING_RECOMMENDATION_RULE_REGISTRY');
assert.equal(validateLearningProgressRuntime(context), 'VALID_LEARNING_PROGRESS_RUNTIME');

assert.equal(context.learningProgressScopeRegistry.progressScopes.length, 5);
assert.equal(context.learningProgressStateRegistry.states.length, 7);
assert.equal(context.learningContinuityStateRegistry.decisions.length, 7);
assert.equal(context.learningReviewRuleRegistry.rules.length, 8);
assert.equal(context.learningRecommendationRuleRegistry.rules.length, 11);
assert.deepEqual(context.learningProgressStateRegistry.states.map(item => item.stateCode), [
  'NOT_STARTED', 'IN_PROGRESS', 'ASSESSMENT_PENDING', 'REVIEW_DUE', 'COMPLETED', 'DISPUTED', 'UNKNOWN'
]);
assert.equal(context.learningProgressStateRegistry.rules.completionIsCapability, false);
assert.equal(context.learningProgressStateRegistry.rules.stateRegistryStoresLearnerProgress, false);
assert.equal(context.learningProgressScopeRegistry.rules.scopeStoresLearnerProgress, false);
assert.equal(context.rdgLearningDataContract.rules.lessonCompletionIsCapability, false);
assert.equal(context.rdgLearningDataContract.rules.permissionMustBeResolvedBeforePersistence, true);
assert.equal(context.rdgRetentionContract.rules.retentionMustBePurposeBound, true);
assert.equal(context.rdgRetentionContract.rules.silentIndefiniteRetentionForbidden, true);
assert.equal(context.rdgRetentionRegistry.rules.entryIsPolicyClassNotDurationDecision, true);
assert.equal(context.capabilityStateRegistry.rules.persistentCapabilityStateActivated, false);

const beforeProjection = JSON.stringify(context);
for (const lesson of context.lessonRegistry.lessons) {
  const projection = buildLearningProgressScopeProjection(context, lesson.lessonCode);
  assert.equal(projection.progressScope.lessonCode, lesson.lessonCode);
  assert.equal(projection.program.programCode, projection.progressScope.programCode);
  assert.equal(projection.learningPath.learningPathCode, projection.progressScope.learningPathCode);
  assert.equal(projection.module.moduleCode, projection.progressScope.moduleCode);
  assert.equal(projection.practice.practiceCode, projection.progressScope.practiceCode);
  assert.equal(projection.assessment.assessmentCode, projection.progressScope.assessmentCode);
  assert.equal(projection.capability.capabilityCode, projection.progressScope.capabilityCode);
}
assert.equal(buildLearningProgressScopeProjection(context, 'ALR-LO-LESSON-UNKNOWN'), null);
assert.equal(JSON.stringify(context), beforeProjection);

const scope = context.learningProgressScopeRegistry.progressScopes[0];
const progressInput = overrides => ({
  progressCode: scope.progressCode,
  progressVersion: scope.progressVersion,
  exposureDecision: 'NOT_RECORDED',
  practiceDecision: 'NOT_RECORDED',
  assessmentDecision: 'NOT_EVALUATED',
  reviewDecision: 'NOT_DUE',
  lineageReferences: [],
  ...overrides
});
const progressCases = [
  ['NOT_STARTED', progressInput({})],
  ['IN_PROGRESS', progressInput({exposureDecision: 'GOVERNED_RECORD_PRESENT', lineageReferences: ['RDG-LE-1']})],
  ['ASSESSMENT_PENDING', progressInput({exposureDecision: 'GOVERNED_RECORD_PRESENT', practiceDecision: 'GOVERNED_RECORD_PRESENT', lineageReferences: ['RDG-LE-1', 'RDG-PA-1']})],
  ['REVIEW_DUE', progressInput({exposureDecision: 'GOVERNED_RECORD_PRESENT', practiceDecision: 'GOVERNED_RECORD_PRESENT', assessmentDecision: 'INTEGRITY_VALID_RESULT_PRESENT', reviewDecision: 'REVIEW_DUE', lineageReferences: ['RDG-LE-1', 'RDG-PA-1', 'RDG-AR-1']})],
  ['COMPLETED', progressInput({exposureDecision: 'GOVERNED_RECORD_PRESENT', practiceDecision: 'GOVERNED_RECORD_PRESENT', assessmentDecision: 'INTEGRITY_VALID_RESULT_PRESENT', reviewDecision: 'REVIEW_COMPLETED', lineageReferences: ['RDG-LE-1', 'RDG-PA-1', 'RDG-AR-1', 'RDG-LR-1']})],
  ['DISPUTED', progressInput({exposureDecision: 'DISPUTED'})],
  ['UNKNOWN', progressInput({practiceDecision: 'UNKNOWN'})]
];
for (const [state, input] of progressCases) {
  const before = JSON.stringify(context);
  const result = evaluateLearningProgress(context, input);
  assert.equal(result.decision, 'LEARNING_PROGRESS_EVALUATED_SEMANTIC_NO_PERSISTENCE');
  assert.equal(result.progressState, state);
  assert.equal(result.capabilityStateEffect, 'NONE');
  assert.equal(result.persistenceEffect, 'NONE');
  assert.equal(JSON.stringify(context), before);
}
const completed = evaluateLearningProgress(context, progressCases[4][1]);
assert.equal(completed.completionState, 'LEARNING_COMPLETION_SUPPORTED');
assert.notEqual(completed.completionState, 'SUPPORTED');
assert.equal(evaluateLearningProgress(context, progressInput({progressCode: 'ALR-LP-UNKNOWN'})).decision,
  'DENY_UNKNOWN_PROGRESS_SCOPE');
assert.equal(evaluateLearningProgress(context, progressInput({progressVersion: '2.0.0'})).decision,
  'DENY_PROGRESS_VERSION_MISMATCH');
assert.equal(evaluateLearningProgress(context, progressInput({practiceDecision: 'GOVERNED_RECORD_PRESENT', lineageReferences: ['RDG-PA-1']})).decision,
  'DENY_PROGRESS_SEQUENCE_OR_LINEAGE');
assert.equal(evaluateLearningProgress(context, progressInput({exposureDecision: 'GOVERNED_RECORD_PRESENT'})).decision,
  'DENY_PROGRESS_SEQUENCE_OR_LINEAGE');
assert.equal(evaluateLearningProgress(context, progressInput({exposureDecision: 'GOVERNED_RECORD_PRESENT', lineageReferences: ['RDG-LE-1', 'RDG-LE-1']})).decision,
  'DENY_UNKNOWN_PROGRESS_DECISION_OR_LINEAGE');
assert.equal(evaluateLearningProgress(context, {...progressInput({}), rawResponse: 'learner text'}).decision,
  'DENY_LEARNER_DATA_OR_AUTHORITY_FIELD');
assert.equal(evaluateLearningProgress(context, {...progressInput({}), uncontrolled: true}).decision,
  'DENY_PROGRESS_INPUT_SHAPE');

const continuityInput = overrides => ({
  continuityCode: scope.continuityCode,
  continuityVersion: scope.progressVersion,
  previousProgressState: 'IN_PROGRESS',
  currentProgressState: 'IN_PROGRESS',
  lineagePreserved: true,
  interruptionState: 'UNINTERRUPTED',
  sourceVersionState: 'CURRENT',
  ...overrides
});
const continuityCases = [
  ['HOLD_DISPUTED', {currentProgressState: 'DISPUTED'}],
  ['HOLD_UNKNOWN', {sourceVersionState: 'UNKNOWN'}],
  ['REVIEW_REQUIRED', {lineagePreserved: false}],
  ['REVIEW_REQUIRED', {sourceVersionState: 'CHANGED_REVIEW_REQUIRED'}],
  ['REVIEW_REQUIRED', {previousProgressState: 'REVIEW_DUE', currentProgressState: 'IN_PROGRESS'}],
  ['START_AVAILABLE', {previousProgressState: 'NOT_STARTED', currentProgressState: 'NOT_STARTED'}],
  ['RESUME_AVAILABLE', {interruptionState: 'INTERRUPTED_RESUMABLE'}],
  ['CONTINUE_AVAILABLE', {}],
  ['COMPLETE_NO_CONTINUATION', {currentProgressState: 'COMPLETED'}]
];
for (const [decision, overrides] of continuityCases) {
  const result = evaluateLearningContinuity(context, continuityInput(overrides));
  assert.equal(result.continuityDecision, decision);
  assert.equal(result.automaticAssignmentEffect, 'NONE');
  assert.equal(result.persistenceEffect, 'NONE');
}
assert.equal(evaluateLearningContinuity(context, continuityInput({continuityCode: 'ALR-LC-UNKNOWN'})).decision,
  'DENY_UNKNOWN_CONTINUITY_SCOPE');
assert.equal(evaluateLearningContinuity(context, continuityInput({continuityVersion: '2.0.0'})).decision,
  'DENY_CONTINUITY_VERSION_MISMATCH');
assert.equal(evaluateLearningContinuity(context, continuityInput({interruptionState: 'AUTO_RESUME'})).decision,
  'DENY_UNKNOWN_CONTINUITY_STATE');
assert.equal(evaluateLearningContinuity(context, {...continuityInput({}), automaticNextLesson: true}).decision,
  'DENY_LEARNER_DATA_OR_AUTHORITY_FIELD');

const reviewInput = overrides => ({
  reviewCode: scope.reviewCode,
  reviewVersion: scope.progressVersion,
  progressState: 'COMPLETED',
  continuityDecision: 'COMPLETE_NO_CONTINUATION',
  capabilityState: 'SUPPORTED',
  sourceVersionState: 'CURRENT',
  rdgRetentionDecision: 'RDG_RETENTION_RESOLVED',
  ...overrides
});
const reviewCases = [
  ['RETENTION_BLOCKED', {rdgRetentionDecision: 'RDG_RETENTION_DENIED'}],
  ['HOLD_DISPUTED', {capabilityState: 'DISPUTED'}],
  ['HOLD_UNKNOWN', {progressState: 'UNKNOWN'}],
  ['RETENTION_REVIEW_REQUIRED', {rdgRetentionDecision: 'RDG_RETENTION_REVIEW_REQUIRED'}],
  ['SOURCE_REVIEW_REQUIRED', {sourceVersionState: 'CHANGED_REVIEW_REQUIRED'}],
  ['CAPABILITY_MAINTENANCE_REVIEW', {capabilityState: 'MAINTENANCE_DUE'}],
  ['LEARNING_REVIEW_REQUIRED', {progressState: 'REVIEW_DUE', continuityDecision: 'REVIEW_REQUIRED'}],
  ['NO_REVIEW_DUE', {}]
];
for (const [decision, overrides] of reviewCases) {
  const result = evaluateLearningReviewRetention(context, reviewInput(overrides));
  assert.equal(result.reviewDecision, decision);
  assert.equal(result.retentionAuthority, 'RDG');
  assert.equal(result.retentionEffect, 'NONE');
  assert.equal(result.capabilityStateEffect, 'NONE');
  assert.equal(result.persistenceEffect, 'NONE');
}
assert.equal(evaluateLearningReviewRetention(context, reviewInput({reviewCode: 'ALR-LR-UNKNOWN'})).decision,
  'DENY_UNKNOWN_REVIEW_SCOPE');
assert.equal(evaluateLearningReviewRetention(context, reviewInput({reviewVersion: '2.0.0'})).decision,
  'DENY_REVIEW_VERSION_MISMATCH');
assert.equal(evaluateLearningReviewRetention(context, reviewInput({rdgRetentionDecision: 'KEEP_FOREVER'})).decision,
  'DENY_UNKNOWN_REVIEW_OR_RETENTION_STATE');
assert.equal(evaluateLearningReviewRetention(context, {...reviewInput({}), retentionDuration: 'FOREVER'}).decision,
  'DENY_LEARNER_DATA_RETENTION_OR_AUTHORITY_FIELD');

const recommendationScope = context.learningProgressScopeRegistry.progressScopes[1];
const recommendationInput = overrides => ({
  recommendationCode: recommendationScope.recommendationCode,
  recommendationVersion: recommendationScope.progressVersion,
  progressState: 'COMPLETED',
  continuityDecision: 'COMPLETE_NO_CONTINUATION',
  reviewDecision: 'NO_REVIEW_DUE',
  capabilityGapType: 'NO_GAP',
  ...overrides
});
const recommendationCases = [
  ['HOLD_DISPUTED', {capabilityGapType: 'DISPUTED_GAP'}],
  ['HOLD_UNKNOWN', {progressState: 'UNKNOWN'}],
  ['REVIEW_RETENTION', {reviewDecision: 'RETENTION_REVIEW_REQUIRED'}],
  ['REVIEW_SOURCE', {reviewDecision: 'SOURCE_REVIEW_REQUIRED'}],
  ['REVIEW_CONTINUITY', {continuityDecision: 'REVIEW_REQUIRED'}],
  ['REVISIT_PREREQUISITE', {progressState: 'IN_PROGRESS', continuityDecision: 'CONTINUE_AVAILABLE', capabilityGapType: 'PREREQUISITE_GAP'}],
  ['REINFORCE_PRACTICE', {progressState: 'IN_PROGRESS', continuityDecision: 'CONTINUE_AVAILABLE', capabilityGapType: 'EVIDENCE_GAP'}],
  ['REVIEW_ASSESSMENT', {progressState: 'ASSESSMENT_PENDING', continuityDecision: 'CONTINUE_AVAILABLE'}],
  ['START_CURRENT_LESSON', {progressState: 'NOT_STARTED', continuityDecision: 'START_AVAILABLE'}],
  ['CONTINUE_CURRENT_LESSON', {progressState: 'IN_PROGRESS', continuityDecision: 'CONTINUE_AVAILABLE'}],
  ['COMPLETE_NO_AUTOMATIC_NEXT_STEP', {}]
];
for (const [actionCode, overrides] of recommendationCases) {
  const result = resolveLearningRecommendation(context, recommendationInput(overrides));
  assert.equal(result.actionCode, actionCode);
  assert.equal(result.requiresChoice, true);
  assert.equal(result.automaticEnrollmentEffect, 'NONE');
  assert.equal(result.entitlementEffect, 'NONE');
  assert.equal(result.capabilityStateEffect, 'NONE');
  assert.equal(result.professionalAuthorityEffect, 'NONE');
  assert.equal(result.persistenceEffect, 'NONE');
  if (actionCode === 'REVISIT_PREREQUISITE') {
    assert.equal(result.targetReference, 'ALR-CAP-EVIDENCE-DISTINCTION');
  }
}
assert.equal(resolveLearningRecommendation(context, recommendationInput({recommendationCode: 'ALR-LREC-UNKNOWN'})).decision,
  'DENY_UNKNOWN_RECOMMENDATION_SCOPE');
assert.equal(resolveLearningRecommendation(context, recommendationInput({recommendationVersion: '2.0.0'})).decision,
  'DENY_RECOMMENDATION_VERSION_MISMATCH');
assert.equal(resolveLearningRecommendation(context, recommendationInput({capabilityGapType: 'PERSONALITY_GAP'})).decision,
  'DENY_UNKNOWN_RECOMMENDATION_INPUT_STATE');
assert.equal(resolveLearningRecommendation(context, {...recommendationInput({}), profile: 'learner profile'}).decision,
  'DENY_LEARNER_PROFILE_PROVIDER_OR_AUTHORITY_FIELD');
assert.equal(resolveLearningRecommendation(context, {...recommendationInput({}), providerResponse: 'model choice'}).decision,
  'DENY_LEARNER_PROFILE_PROVIDER_OR_AUTHORITY_FIELD');
const noPrerequisiteInput = {
  ...recommendationInput({capabilityGapType: 'PREREQUISITE_GAP'}),
  recommendationCode: scope.recommendationCode
};
assert.equal(resolveLearningRecommendation(context, noPrerequisiteInput).decision,
  'DENY_PREREQUISITE_GAP_WITHOUT_REGISTERED_PREREQUISITE');

const progressDuplicate = structuredClone(context);
progressDuplicate.learningProgressScopeRegistry.progressScopes[1].progressCode =
  progressDuplicate.learningProgressScopeRegistry.progressScopes[0].progressCode;
assert.equal(validateLearningProgressScopeRegistry(progressDuplicate), 'DUPLICATE_LEARNING_PROGRESS_SCOPE_REFERENCE');
const scopeMismatch = structuredClone(context);
scopeMismatch.learningProgressScopeRegistry.progressScopes[0].lessonCode = context.lessonRegistry.lessons[1].lessonCode;
assert.equal(validateLearningProgressScopeRegistry(scopeMismatch), 'DUPLICATE_LEARNING_PROGRESS_SCOPE_REFERENCE');
const progressStateDrift = structuredClone(context);
progressStateDrift.learningProgressStateRegistry.states[0].stateCode = 'STARTED';
assert.equal(validateLearningProgressStateRegistry(progressStateDrift), 'LEARNING_PROGRESS_STATE_COVERAGE_FAILURE');
const continuityPriorityDrift = structuredClone(context);
continuityPriorityDrift.learningContinuityStateRegistry.decisions[0].priority = 7;
assert.equal(validateLearningContinuityStateRegistry(continuityPriorityDrift),
  'INVALID_LEARNING_CONTINUITY_DECISION_REGISTRY');
const reviewAuthorityDrift = structuredClone(context);
reviewAuthorityDrift.learningReviewRetentionContract.rdgRetentionContractReference = 'ALR';
assert.equal(validateLearningReviewRuleRegistry(reviewAuthorityDrift), 'DENY_LEARNING_REVIEW_RETENTION_AUTHORITY');
const recommendationProviderDrift = structuredClone(context);
recommendationProviderDrift.learningRecommendationRuleRegistry.rules[0].requiresChoice = false;
assert.equal(validateLearningRecommendationRuleRegistry(recommendationProviderDrift),
  'INVALID_LEARNING_RECOMMENDATION_RULE_REGISTRY');

assert.equal(evaluateLearningProgressDeliveryEligibility(context, {
  requestedActivationState: 'SEMANTIC_RUNTIME_READY_DELIVERY_BLOCKED'
}), 'SEMANTIC_RUNTIME_READY_DELIVERY_BLOCKED');
assert.equal(evaluateLearningProgressDeliveryEligibility(context, {
  requestedActivationState: 'DELIVERY_ELIGIBLE', progressRuntimeReady: true,
  rdgPermissionResolved: true, rdgPersistenceReady: true, learnerDeliveryReady: true
}), 'DENY_RUNTIME_NOT_ACTIVATED');
assert.equal(evaluateLearningProgressDeliveryEligibility(context, {
  requestedActivationState: 'DELIVERY_ELIGIBLE', learnerReference: 'user-1'
}), 'DENY_LEARNER_DATA_OR_AUTHORITY_FIELD');

const freeze = await read(`${base}/freeze/alr-w29-w32-progress-freeze-v1.json`);
assert.equal(freeze.status, 'frozen');
assert.deepEqual(freeze.completedWorks, ['ALR-W29', 'ALR-W30', 'ALR-W31', 'ALR-W32']);
assert.equal(freeze.canonicalProgressScopeCount, 5);
assert.equal(freeze.canonicalProgressStateCount, 7);
assert.equal(freeze.canonicalContinuityDecisionCount, 7);
assert.equal(freeze.canonicalReviewDecisionCount, 8);
assert.equal(freeze.canonicalRecommendationActionCount, 11);
assert.equal(freeze.learnerProgressStoreActivated, false);
assert.equal(freeze.rdgPersistenceRetentionDeletionOrLegalHoldMutationFromAlrActivated, false);
assert.equal(freeze.providerAiPersonalizationOrNetworkActivated, false);
assert.equal(freeze.automaticEnrollmentAssignmentUnlockOrPurchaseActivated, false);
assert.equal(freeze.capabilityStatePersistenceActivated, false);
assert.equal(freeze.credentialEntitlementOrProfessionalAuthorityActivated, false);
for (const output of freeze.outputs) await fs.access(path.join(root, output));

const pkg = await read('package.json');
assert.equal(pkg.scripts['check:alr-w29-w32'], 'node scripts/check-alr-w29-w32-progress.mjs');
assert.equal(pkg.scripts['check:alr-progress'], 'npm run check:alr-w29-w32');
const postcheckCommands = pkg.scripts.postcheck.split(/\s*&&\s*/u);
for (const command of ['npm run check:icr-runtime', 'npm run check:rmo', 'npm run check:alr-knowledge-learning',
  'npm run check:alr-practice', 'npm run check:alr-assessment', 'npm run check:alr-progress',
  'npm run check:wave1-production']) assert.ok(postcheckCommands.includes(command), command);
assert.ok(postcheckCommands.indexOf('npm run check:icr-runtime') < postcheckCommands.indexOf('npm run check:rmo'));
assert.ok(postcheckCommands.indexOf('npm run check:rmo') < postcheckCommands.indexOf('npm run check:alr-knowledge-learning'));
assert.ok(postcheckCommands.indexOf('npm run check:alr-knowledge-learning') < postcheckCommands.indexOf('npm run check:alr-practice'));
assert.ok(postcheckCommands.indexOf('npm run check:alr-practice') < postcheckCommands.indexOf('npm run check:alr-assessment'));
assert.ok(postcheckCommands.indexOf('npm run check:alr-assessment') < postcheckCommands.indexOf('npm run check:alr-progress'));
assert.ok(postcheckCommands.indexOf('npm run check:alr-progress') <
  postcheckCommands.indexOf('node scripts/check-exp-w4-reconstruction-customer-projection.mjs'));
assert.ok(postcheckCommands.indexOf('npm run check:alr-progress') < postcheckCommands.indexOf('npm run check:wave1-production'));

console.log('✓ ALR-W29～W32 Learning Progress / Continuity / Review / Recommendation passed.');
console.log('✓ 5 reciprocal Progress scopes resolve through 7 Progress states, 7 Continuity decisions, 8 Review decisions and 11 explainable Recommendation actions.');
console.log('✓ Completion is not Capability; RDG retains retention authority; every Recommendation remains an option requiring choice.');
console.log('✓ Learner persistence, Provider/AI personalization, automatic assignment, Entitlement, Credential and Professional authority remain inactive.');
console.log('✓ postcheck preserves RMO and the Wave 1 production chain while adding ALR Progress immediately after ALR Assessment.');
console.log('✓ Parallel Wave 1 review state is presence-bound, not ALR content-hash-bound, so Human-governed C2/C3 advancement does not invalidate ALR.');
