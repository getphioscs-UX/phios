import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  buildLessonKnowledgeLearningProjection,
  evaluateFigureLearningProjectionEligibility,
  evaluateKnowledgeLearningDeliveryEligibility,
  validateCaseStudyRegistry,
  validateExampleRegistry,
  validateFigureLearningProjectionRegistry,
  validateKnowledgeLearningBindings,
  validateKnowledgeLearningRuntime,
  validateKnowledgeProjectionRegistry,
  validateTeachingExplanationRegistry
} from './lib/academy-learning-runtime/alr-knowledge-learning-v1.mjs';

const root = process.cwd();
const base = 'content/academy/academy-learning-runtime';
const read = async file => JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));
const normalizeText = source => source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const digest = async file => crypto.createHash('sha256')
  .update(normalizeText(await fs.readFile(path.join(root, file), 'utf8')), 'utf8')
  .digest('hex');

const audit = await read(`${base}/audits/alr-knowledge-learning-reconciliation-v1.json`);
assert.equal(audit.baselineCommit, 'f3fcc4b9887f75737d8fd07b4539031a4540ca54');
assert.equal(audit.scope, 'ALR-W15-W19');
assert.deepEqual(audit.implementationDecision, {
  knowledgeProjectionCount: 5,
  teachingExplanationCount: 5,
  exampleCount: 5,
  caseStudyCount: 5,
  figureLearningProjectionCount: 0,
  lessonBindingOverlayRequired: true,
  publishedKnowledgeMayBeReferenced: true,
  publishedKnowledgeMayBeMutatedOrCopiedAsAuthority: false,
  teachingObjectsMayAddUngroundedKnowledgeClaims: false,
  syntheticExamplesOrCaseStudiesMayBecomeRealityEvidence: false,
  candidateOrFixtureAssetMayBecomeFigureLearningProjection: false,
  emptyFigureProjectionRegistryRequiredUntilPublishedCarAssetExists: true,
  learnerDeliveryMayBeActivated: false
});
assert.equal(audit.baselineRepair.runtimeSemanticsMutated, false);
assert.equal(audit.baselineRepair.crossPlatformTextHashingApplied, true);
assert.equal(audit.preservation.w0W14FrozenArtifactsMutated, false);
assert.equal(audit.preservation.publishedKnowledgeMutated, false);
assert.equal(audit.preservation.carOrCprAuthorityMutated, false);
assert.equal(audit.preservation.rdgLearningDataAuthorityMutated, false);
assert.equal(audit.preservation.icrCaseSemanticsMutated, false);
assert.equal(audit.preservation.existingRuntimeOrUserDataMutated, false);
for (const source of audit.inspectedAuthorities) {
  await fs.access(path.join(root, source.reference));
  assert.equal(await digest(source.reference), source.sha256, source.reference);
}

const masterWork = await read('content/governance/canonical-master-work/registries/canonical-master-work-registry-v1.json');
const workEntries = masterWork.entries.filter(entry => /^ALR-W(?:15|16|17|18|19)$/.test(entry.workCode));
assert.deepEqual(workEntries.map(entry => entry.workCode), ['ALR-W15', 'ALR-W16', 'ALR-W17', 'ALR-W18', 'ALR-W19']);
assert.ok(workEntries.every(entry => entry.runtimeCode === 'ALR' && entry.status === 'PLANNED'));

const context = {
  knowledgeProjectionContract: await read(`${base}/contracts/knowledge-to-learning-projection-contract-v1.json`),
  teachingExplanationContract: await read(`${base}/contracts/teaching-explanation-contract-v1.json`),
  exampleContract: await read(`${base}/contracts/example-runtime-contract-v1.json`),
  caseStudyContract: await read(`${base}/contracts/case-study-runtime-contract-v1.json`),
  figureLearningProjectionContract: await read(`${base}/contracts/figure-learning-projection-contract-v1.json`),
  typeRegistry: await read(`${base}/registries/learning-object-registry-v1.json`),
  lessonRegistry: await read(`${base}/registries/lesson-registry-v1.json`),
  learningObjectiveRegistry: await read(`${base}/registries/learning-objective-registry-v1.json`),
  knowledgeProjectionRegistry: await read(`${base}/registries/knowledge-to-learning-projection-registry-v1.json`),
  teachingExplanationRegistry: await read(`${base}/registries/teaching-explanation-registry-v1.json`),
  exampleRegistry: await read(`${base}/registries/example-registry-v1.json`),
  caseStudyRegistry: await read(`${base}/registries/case-study-registry-v1.json`),
  figureLearningProjectionRegistry: await read(`${base}/registries/figure-learning-projection-registry-v1.json`),
  knowledgeLearningBindingRegistry: await read(`${base}/registries/knowledge-learning-binding-registry-v1.json`),
  publishedNodes: await read('content/knowledge/public/published-nodes.json'),
  publishedArticles: await read('content/knowledge/public/published-articles.json'),
  publishedAssetRegistry: await read('content/professional/canonical-asset-runtime/registries/published-asset-registry-v1.json')
};

assert.equal(validateKnowledgeProjectionRegistry(context), 'VALID_KNOWLEDGE_PROJECTION_REGISTRY');
assert.equal(validateTeachingExplanationRegistry(context), 'VALID_TEACHING_EXPLANATION_REGISTRY');
assert.equal(validateExampleRegistry(context), 'VALID_EXAMPLE_REGISTRY');
assert.equal(validateCaseStudyRegistry(context), 'VALID_CASE_STUDY_REGISTRY');
assert.equal(validateFigureLearningProjectionRegistry(context), 'VALID_EMPTY_FIGURE_PROJECTION_REGISTRY');
assert.equal(validateKnowledgeLearningBindings(context), 'VALID_KNOWLEDGE_LEARNING_BINDINGS');
assert.equal(validateKnowledgeLearningRuntime(context), 'VALID_KNOWLEDGE_LEARNING_RUNTIME');

assert.equal(context.knowledgeProjectionRegistry.projections.length, 5);
assert.equal(context.teachingExplanationRegistry.teachingExplanations.length, 5);
assert.equal(context.exampleRegistry.examples.length, 5);
assert.equal(context.caseStudyRegistry.caseStudies.length, 5);
assert.equal(context.figureLearningProjectionRegistry.figureLearningProjections.length, 0);
assert.equal(context.knowledgeLearningBindingRegistry.bindings.length, 5);
assert.equal(context.publishedAssetRegistry.publications.length, 0);
assert.equal(context.figureLearningProjectionRegistry.populationState,
  'EMPTY_FAIL_CLOSED_NO_PUBLISHED_CAR_FIGURE_OR_DIAGRAM');

assert.deepEqual(new Set(context.publishedNodes.records.map(item => item.locale)), new Set(['en', 'zh-Hans']));
assert.ok(context.knowledgeProjectionRegistry.projections.every(item =>
  item.sourceArticleReferences.length === 2 &&
  new Set(item.sourceArticleReferences.map(reference => reference.locale)).size === 2 &&
  item.deliveryActivationState === 'CONTENT_STRUCTURE_READY_DELIVERY_BLOCKED'
));
assert.ok(context.teachingExplanationRegistry.teachingExplanations.every(item =>
  item.authorityReference === 'ALR' && item.localizationState === 'PENDING_ALR-W40-W41' &&
  item.deliveryActivationState === 'CONTENT_STRUCTURE_READY_DELIVERY_BLOCKED'
));
assert.ok(context.exampleRegistry.examples.every(item =>
  item.fictionality === 'FICTIONAL_OR_COMPOSITE' && item.personalDataState === 'NO_PERSONAL_DATA'
));
assert.ok(context.caseStudyRegistry.caseStudies.every(item =>
  item.dataClassification === 'SYNTHETIC_NON_PERSONAL' &&
  item.icrBoundaryState === 'NOT_AN_ICR_CANONICAL_CASE'
));
assert.ok(context.lessonRegistry.lessons.every(lesson =>
  Object.values(lesson.futureIntegrationReferences).every(references => references.length === 0)
));

const beforeProjection = JSON.stringify(context);
for (const lesson of context.lessonRegistry.lessons) {
  const projection = buildLessonKnowledgeLearningProjection(context, lesson.lessonCode);
  assert.equal(projection.lesson.lessonCode, lesson.lessonCode);
  assert.equal(projection.knowledgeProjections.length, 1);
  assert.equal(projection.teachingExplanations.length, 1);
  assert.equal(projection.examples.length, 1);
  assert.equal(projection.caseStudies.length, 1);
  assert.equal(projection.figureLearningProjections.length, 0);
}
assert.equal(buildLessonKnowledgeLearningProjection(context, 'ALR-LO-LESSON-UNKNOWN'), null);
assert.equal(JSON.stringify(context), beforeProjection);

const unpublishedNode = structuredClone(context);
unpublishedNode.knowledgeProjectionRegistry.projections[0].sourceNodeCode = 'KN-UNKNOWN';
assert.equal(validateKnowledgeProjectionRegistry(unpublishedNode), 'DENY_UNPUBLISHED_KNOWLEDGE_SOURCE');

const missingLocale = structuredClone(context);
missingLocale.knowledgeProjectionRegistry.projections[0].sourceArticleReferences.pop();
assert.equal(validateKnowledgeProjectionRegistry(missingLocale), 'PUBLISHED_ARTICLE_REFERENCE_MISMATCH');

const copiedKnowledgeBody = structuredClone(context);
copiedKnowledgeBody.knowledgeProjectionRegistry.projections[0].bodyMarkdown = 'Copied body';
assert.equal(validateKnowledgeProjectionRegistry(copiedKnowledgeBody), 'DENY_KNOWLEDGE_BODY_DATA_OR_AUTHORITY_FIELD');

const projectionObjectiveMismatch = structuredClone(context);
projectionObjectiveMismatch.knowledgeProjectionRegistry.projections[0].learningObjectiveCodes =
  context.knowledgeProjectionRegistry.projections[1].learningObjectiveCodes;
assert.equal(validateKnowledgeProjectionRegistry(projectionObjectiveMismatch),
  'UNKNOWN_KNOWLEDGE_PROJECTION_LESSON_OR_OBJECTIVE');

const ungroundedTeachingClaim = structuredClone(context);
ungroundedTeachingClaim.teachingExplanationRegistry.teachingExplanations[0].newKnowledgeClaim = 'Ungrounded';
assert.equal(validateTeachingExplanationRegistry(ungroundedTeachingClaim),
  'DENY_TEACHING_KNOWLEDGE_DATA_OR_AUTHORITY_FIELD');

const danglingTeachingProjection = structuredClone(context);
danglingTeachingProjection.teachingExplanationRegistry.teachingExplanations[0].knowledgeProjectionCode = 'ALR-KLP-UNKNOWN';
assert.equal(validateTeachingExplanationRegistry(danglingTeachingProjection),
  'UNKNOWN_TEACHING_PROJECTION_LESSON_OR_OBJECTIVE');

const realPersonExample = structuredClone(context);
realPersonExample.exampleRegistry.examples[0].realPersonReference = 'PERSON-1';
assert.equal(validateExampleRegistry(realPersonExample), 'DENY_EXAMPLE_PERSONAL_CASE_OR_AUTHORITY_FIELD');

const icrExample = structuredClone(context);
icrExample.exampleRegistry.examples[0].caseReference = 'ICR-CASE-1';
assert.equal(validateExampleRegistry(icrExample), 'DENY_EXAMPLE_PERSONAL_CASE_OR_AUTHORITY_FIELD');

const canonicalCaseStudy = structuredClone(context);
canonicalCaseStudy.caseStudyRegistry.caseStudies[0].canonicalCaseCode = 'ICR-CASE-1';
assert.equal(validateCaseStudyRegistry(canonicalCaseStudy), 'DENY_CASE_STUDY_REALITY_ICR_OR_AUTHORITY_FIELD');

const evidencePromotionCase = structuredClone(context);
evidencePromotionCase.caseStudyRegistry.caseStudies[0].evidencePromotionState = 'PROMOTED';
assert.equal(validateCaseStudyRegistry(evidencePromotionCase), 'DENY_CASE_STUDY_REALITY_ICR_OR_AUTHORITY_FIELD');

const figureCandidate = {
  candidateAssetCode: 'CAR-CANDIDATE-FIGURE-1',
  publishedAssetCode: 'CAR-ASSET-FIGURE-1',
  lessonCode: context.lessonRegistry.lessons[0].lessonCode,
  learningObjectiveCodes: context.lessonRegistry.lessons[0].learningObjectiveCodes
};
assert.equal(evaluateFigureLearningProjectionEligibility(context, figureCandidate),
  'DENY_ASSET_PAYLOAD_OR_PRESENTATION_OWNERSHIP');
assert.equal(evaluateFigureLearningProjectionEligibility(context, {
  publishedAssetCode: 'CAR-ASSET-UNKNOWN',
  lessonCode: context.lessonRegistry.lessons[0].lessonCode,
  learningObjectiveCodes: context.lessonRegistry.lessons[0].learningObjectiveCodes
}), 'DENY_ASSET_NOT_PUBLISHED');

const wrongAssetType = structuredClone(context);
wrongAssetType.publishedAssetRegistry.publications.push({
  assetCode: 'CAR-ASSET-ARTICLE-1', assetType: 'ARTICLE', publicationState: 'published'
});
assert.equal(evaluateFigureLearningProjectionEligibility(wrongAssetType, {
  publishedAssetCode: 'CAR-ASSET-ARTICLE-1',
  lessonCode: context.lessonRegistry.lessons[0].lessonCode,
  learningObjectiveCodes: context.lessonRegistry.lessons[0].learningObjectiveCodes
}), 'DENY_ASSET_TYPE');

const danglingBinding = structuredClone(context);
danglingBinding.knowledgeLearningBindingRegistry.bindings[0].exampleCodes = ['ALR-LO-EXAMPLE-UNKNOWN'];
assert.equal(validateKnowledgeLearningBindings(danglingBinding),
  'DANGLING_OR_MISMATCHED_KNOWLEDGE_LEARNING_BINDING');

assert.equal(evaluateKnowledgeLearningDeliveryEligibility(context, {
  requestedActivationState: 'CONTENT_STRUCTURE_READY_DELIVERY_BLOCKED'
}), 'CONTENT_READY_DELIVERY_BLOCKED');
assert.equal(evaluateKnowledgeLearningDeliveryEligibility(context, {
  requestedActivationState: 'DELIVERY_ELIGIBLE',
  knowledgeProjectionReady: true,
  teachingExplanationReady: true,
  exampleReady: true,
  caseStudyReady: true,
  figureEligibilityResolved: true,
  practiceReady: true,
  assessmentReady: true,
  rdgPermissionResolved: true
}), 'DENY_RUNTIME_NOT_ACTIVATED');
assert.equal(evaluateKnowledgeLearningDeliveryEligibility(context, {
  requestedActivationState: 'DELIVERY_ELIGIBLE', learnerReference: 'LEARNER-1'
}), 'DENY_LEARNER_CASE_OR_AUTHORITY_DATA');

const freeze = await read(`${base}/freeze/alr-w15-w19-knowledge-learning-freeze-v1.json`);
assert.equal(freeze.status, 'frozen');
assert.deepEqual(freeze.completedWorks, ['ALR-W15', 'ALR-W16', 'ALR-W17', 'ALR-W18', 'ALR-W19']);
assert.equal(freeze.canonicalKnowledgeProjectionCount, 5);
assert.equal(freeze.canonicalTeachingExplanationCount, 5);
assert.equal(freeze.canonicalExampleCount, 5);
assert.equal(freeze.canonicalCaseStudyCount, 5);
assert.equal(freeze.canonicalFigureLearningProjectionCount, 0);
assert.equal(freeze.canonicalLessonBindingCount, 5);
assert.equal(freeze.figureEligibilityValidatorActivated, true);
assert.equal(freeze.figureProjectionPopulationBlockedWithoutPublishedCarAsset, true);
assert.equal(freeze.learnerDeliveryRuntimeActivated, false);
assert.equal(freeze.practiceRuntimeActivated, false);
assert.equal(freeze.assessmentRuntimeActivated, false);
assert.equal(freeze.learnerDataWriteActivated, false);
assert.equal(freeze.credentialEntitlementOrProfessionalAuthorityActivated, false);
assert.equal(freeze.w0W14FrozenArtifactsMutated, false);
assert.equal(freeze.publishedKnowledgeCarRdgOrIcrAuthorityMutated, false);
assert.equal(freeze.nextWork, 'ALR-W20 Practice');
for (const output of freeze.outputs) await fs.access(path.join(root, output));

const pkg = await read('package.json');
assert.equal(pkg.scripts['check:alr-w15-w19'], 'node scripts/check-alr-w15-w19-knowledge-learning.mjs');
assert.equal(pkg.scripts['check:alr-knowledge-learning'], 'npm run check:alr-w15-w19');
const assertUniqueOrderedCommands = (actualCommands, requiredCommands) => {
  let priorIndex = -1;
  for (const command of requiredCommands) {
    const matchingIndexes = actualCommands.flatMap((candidate, index) => candidate === command ? [index] : []);
    assert.equal(matchingIndexes.length, 1, `postcheck command must occur exactly once: ${command}`);
    assert.ok(matchingIndexes[0] > priorIndex, `postcheck command order: ${command}`);
    priorIndex = matchingIndexes[0];
  }
};
const requiredPostcheckCommands = [
  'npm run check:governance-data-closure',
  'npm run check:alr-foundation',
  'npm run check:alr-capability',
  'npm run check:alr-learning-architecture',
  'npm run check:car-reconciliation',
  'npm run check:icr-foundation',
  'npm run check:icr-runtime',
  'npm run check:alr-knowledge-learning'
];
const postcheckCommands = pkg.scripts.postcheck.split('&&').map(command => command.trim());
assertUniqueOrderedCommands(postcheckCommands, requiredPostcheckCommands);
const simulatedParallelRmoCommands = [...postcheckCommands];
simulatedParallelRmoCommands.splice(
  simulatedParallelRmoCommands.indexOf('npm run check:icr-runtime') + 1,
  0,
  'npm run check:rmo-foundation'
);
assertUniqueOrderedCommands(simulatedParallelRmoCommands, requiredPostcheckCommands);

console.log('✓ ALR-W15～W19 Knowledge → Learning passed.');
console.log('✓ 5 Published Knowledge Projections → 5 Teaching Explanations → 5 synthetic Examples → 5 synthetic Case Studies are reciprocal across all 5 Lessons.');
console.log('✓ Figure eligibility fails closed at 0 projections until CAR publishes an eligible FIGURE or DIAGRAM; delivery, Practice, Assessment, learner data and authority grants remain inactive.');
