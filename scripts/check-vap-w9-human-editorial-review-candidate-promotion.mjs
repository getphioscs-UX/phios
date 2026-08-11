import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  VAP_W9_EXPECTED_NODE_CODES,
  VAP_W9_PATHS,
  buildVapW9ReviewQueue,
  buildPendingDecisionEnvelope,
  validateDecisionEnvelope,
  applyVapW9,
  snapshotAuthorityDigests
} from './lib/visual-article-production/human-editorial-review-candidate-promotion-v1.mjs';
import { validateHumanReview } from './lib/knowledge-production/human-review-v1.mjs';
import { serialize, digest } from './lib/knowledge-production/canonical-brief-v2.mjs';

const root = process.cwd();
const readJson = async rel => JSON.parse(await fs.readFile(path.join(root, rel), 'utf8'));
const fileExists = rel => fs.access(path.join(root, rel)).then(() => true, () => false);

const [contract, policy, decisionSchema, promotionSchema, reviewQueue, decisions, promotionManifest, activation, pjaReviewContract, pjaCandidateRegistry, pjaReviewRegistry, pjaApprovalRegistry, pjaPublicationRegistry] = await Promise.all([
  readJson('content/production/visual-article/contracts/vap-w9-human-editorial-review-candidate-promotion-v1.json'),
  readJson('content/production/visual-article/policies/vap-w9-human-editorial-review-candidate-promotion-policy-v1.json'),
  readJson('content/production/visual-article/schemas/vap-w9-human-editorial-decisions-v1.schema.json'),
  readJson('content/production/visual-article/schemas/vap-w9-candidate-promotion-v1.schema.json'),
  readJson(VAP_W9_PATHS.reviewQueue),
  readJson(VAP_W9_PATHS.decisions),
  readJson(VAP_W9_PATHS.promotionManifest),
  readJson(VAP_W9_PATHS.activation),
  readJson('content/knowledge/production/contracts/human-review-contract.json'),
  readJson(VAP_W9_PATHS.pjaCandidateRegistry),
  readJson(VAP_W9_PATHS.pjaReviewRegistry),
  readJson(VAP_W9_PATHS.pjaApprovalRegistry),
  readJson(VAP_W9_PATHS.pjaPublicationRegistry)
]);

assert.equal(contract.work, 'VAP-W9');
assert.equal(contract.implementationBaselineCommit, '9cd28c6ad24ebffeeb553cfe65fb572ef562d3ed');
assert.equal(contract.existingPjaRuntimeReuse.humanReviewRuntime, 'scripts/lib/knowledge-production/human-review-v1.mjs');
assert.equal(contract.existingPjaRuntimeReuse.secondHumanReviewRuntimeAllowed, false);
assert.equal(contract.humanReviewGate.oneIndependentDecisionPerNode, true);
assert.equal(contract.humanReviewGate.bulkEnvelopeIsNotBulkReviewDecision, true);
assert.equal(contract.candidatePromotion.candidateBodyMutationAllowed, false);
assert.equal(contract.candidatePromotion.candidateAcceptanceIsApproval, false);
assert.equal(contract.candidatePromotion.candidateAcceptanceIsPublication, false);
assert.equal(contract.candidatePromotion.pjaCandidateRegistryMutationAllowed, false);
assert.equal(contract.candidatePromotion.nextAuthority, 'PJA Human Approval Runtime');
assert(contract.prohibited.includes('fabricate_human_review'));
assert(contract.prohibited.includes('create_human_approval'));
assert(contract.prohibited.includes('create_publication'));

assert.equal(policy.expectedCandidateCount, 6);
assert.equal(policy.reviewAuthority, 'TL Human Review Authority');
assert.equal(policy.reviewPackageAuthority, 'review_only');
assert.equal(policy.aiEditorialRecommendationAuthority, false);
assert.equal(policy.candidateMutationAllowed, false);
assert.equal(policy.candidateRegistryMutationAllowed, false);
assert.equal(policy.approvalRegistryMutationAllowed, false);
assert.equal(policy.publicationRegistryMutationAllowed, false);
assert.equal(policy.candidatePromotionEqualsApproval, false);
assert.equal(policy.candidatePromotionEqualsPublication, false);
assert.deepEqual(policy.allowedHumanDecisions, ['accept', 'changes_required', 'reject', 'defer']);

assert.equal(decisionSchema.properties.entries.minItems, 6);
assert.equal(decisionSchema.properties.entries.maxItems, 6);
assert.deepEqual(decisionSchema.properties.entries.items.properties.decision.enum, ['accept', 'changes_required', 'reject', 'defer', null]);
assert.equal(promotionSchema.properties.reviewDecision.const, 'accept');
assert.equal(promotionSchema.properties.candidateAcceptanceIsApproval.const, false);
assert.equal(promotionSchema.properties.approvalRecorded.const, false);
assert.equal(promotionSchema.properties.publicationRecorded.const, false);

assert.equal(pjaReviewContract.outputAuthority, 'review_only');
assert.equal(pjaReviewContract.boundaries.reviewDoesNotImplyApproval, true);
assert.equal(pjaReviewContract.boundaries.reviewDoesNotImplyPublication, true);
assert(pjaReviewContract.prohibitedOperations.includes('approve'));
assert(pjaReviewContract.prohibitedOperations.includes('publish'));

const rebuiltQueue = await buildVapW9ReviewQueue(root);
assert.equal(serialize(rebuiltQueue), serialize(reviewQueue), 'VAP_W9_REVIEW_QUEUE_NOT_DETERMINISTIC');
assert.equal(reviewQueue.entries.length, 6);
assert.equal(reviewQueue.status, 'AWAITING_EXPLICIT_HUMAN_EDITORIAL_DECISIONS');
assert.equal(reviewQueue.proposalAuthority, 'AI_EDITORIAL_RECOMMENDATION_ONLY_NOT_HUMAN_REVIEW');
assert.equal(reviewQueue.candidateRegistryMutationAllowedByW9, false);
assert.equal(reviewQueue.reviewQueueDigest, `sha256:${digest(Object.fromEntries(Object.entries(reviewQueue).filter(([key]) => key !== 'reviewQueueDigest')))}`);

for (const nodeCode of VAP_W9_EXPECTED_NODE_CODES) {
  const entry = reviewQueue.entries.find(item => item.nodeCode === nodeCode);
  assert(entry, `VAP_W9_QUEUE_NODE_MISSING:${nodeCode}`);
  assert.equal(entry.humanDecisionState, 'pending_human');
  assert.equal(entry.promotionState, 'not_promoted_pending_human_review');
  assert.equal(entry.aiEditorialRecommendation.authority, 'AI_EDITORIAL_RECOMMENDATION_ONLY_NOT_HUMAN_REVIEW');
  assert.equal(entry.aiEditorialRecommendation.recommendation, 'ACCEPT_RECOMMENDED_PENDING_HUMAN_CONFIRMATION');
  assert.equal(entry.automatedValidation.factualTruthValidated, false);
  assert.equal(entry.automatedValidation.sourceTruthValidated, false);
  assert.equal(entry.automatedValidation.semanticHumanReviewStillRequired, true);
  assert(entry.humanReviewDimensions.includes('canonical_meaning'));
  assert(entry.humanReviewDimensions.includes('evidence'));
  assert(entry.humanReviewDimensions.includes('language'));
  assert.equal(pjaCandidateRegistry.records.some(record => record.nodeCode === nodeCode && record.locale === 'zh-Hans'), false, `${nodeCode}:LEGACY_CANDIDATE_REGISTRY_MUST_REMAIN_UNPROMOTED`);
  assert.equal(pjaReviewRegistry.records.some(record => record.nodeCode === nodeCode && record.locale === 'zh-Hans'), false, `${nodeCode}:HUMAN_REVIEW_MUST_NOT_BE_FABRICATED`);
  assert.equal(pjaApprovalRegistry.records.some(record => record.nodeCode === nodeCode && record.locale === 'zh-Hans'), false, `${nodeCode}:APPROVAL_MUST_NOT_EXIST`);
  assert.equal(pjaPublicationRegistry.records.some(record => record.nodeCode === nodeCode && record.locale === 'zh-Hans'), false, `${nodeCode}:PUBLICATION_MUST_NOT_EXIST`);
  assert.equal(await fileExists(`content/knowledge/production/reviews/zh-Hans/${nodeCode}/review.v1.json`), false, `${nodeCode}:REAL_REVIEW_PACKAGE_MUST_NOT_EXIST_BEFORE_HUMAN_DECISION`);
}

const pendingValidation = validateDecisionEnvelope(decisions, reviewQueue, { requireAllDecided: false });
assert.equal(pendingValidation.valid, true, JSON.stringify(pendingValidation.errors));
assert.equal(decisions.status, 'PENDING_HUMAN');
assert.equal(decisions.entries.length, 6);
assert(decisions.entries.every(entry => entry.decisionState === 'pending_human' && entry.decision === null && entry.reviewerCode === null));
const requiredValidation = validateDecisionEnvelope(decisions, reviewQueue, { requireAllDecided: true });
assert.equal(requiredValidation.valid, false);
assert.equal(requiredValidation.errors.filter(x => x.code === 'VAP_W9_EXPLICIT_HUMAN_REVIEW_REQUIRED').length, 6);
await assert.rejects(() => applyVapW9(root, decisions, { apply: false }), /VAP_W9_HUMAN_DECISIONS_INVALID/);

assert.equal(promotionManifest.status, 'AWAITING_HUMAN_EDITORIAL_REVIEW');
assert.equal(promotionManifest.reviewedCount, 0);
assert.equal(promotionManifest.promotedCount, 0);
assert.equal(promotionManifest.candidateRegistryMutated, false);
assert.equal(promotionManifest.approvalRecorded, false);
assert.equal(promotionManifest.publicationRecorded, false);
assert.equal(activation.status, 'AWAITING_EXPLICIT_HUMAN_EDITORIAL_DECISIONS');
assert.equal(activation.humanEditorialReviewCount, 0);
assert.equal(activation.candidatePromotionCount, 0);
assert.equal(activation.approvalCount, 0);
assert.equal(activation.publicationCount, 0);

const makeAcceptEnvelope = () => {
  const envelope = structuredClone(buildPendingDecisionEnvelope(reviewQueue));
  envelope.status = 'HUMAN_DECISIONS_RECORDED';
  for (const entry of envelope.entries) {
    const queueEntry = reviewQueue.entries.find(item => item.nodeCode === entry.nodeCode);
    entry.decisionState = 'human_decided';
    entry.decision = 'accept';
    entry.reviewerCode = 'TL';
    entry.reviewerAuthority = 'TL Human Review Authority';
    entry.editorialActorRole = 'HUMAN_EDITORIAL_AUTHORITY';
    entry.reviewedAt = '2026-08-11T06:15:00.000Z';
    entry.summary = queueEntry.aiEditorialRecommendation.summary;
    entry.findings = queueEntry.aiEditorialRecommendation.reviewFocus.map(text => ({ category: 'boundary', severity: 'note', comment: text }));
  }
  return envelope;
};

const acceptedEnvelope = makeAcceptEnvelope();
const acceptedValidation = validateDecisionEnvelope(acceptedEnvelope, reviewQueue, { requireAllDecided: true });
assert.equal(acceptedValidation.valid, true, JSON.stringify(acceptedValidation.errors));
const authorityBefore = await snapshotAuthorityDigests(root);
const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'vap-w9-accept-'));
await fs.mkdir(path.join(temp, 'content/knowledge/production/registry'), { recursive: true });
await fs.writeFile(path.join(temp, VAP_W9_PATHS.pjaReviewRegistry), serialize(pjaReviewRegistry));
const applied = await applyVapW9(root, acceptedEnvelope, { apply: true, targetRoot: temp });
assert.equal(applied.activation.humanEditorialReviewCount, 6);
assert.equal(applied.activation.humanAcceptedCount, 6);
assert.equal(applied.activation.candidatePromotionCount, 6);
assert.equal(applied.activation.approvalCount, 0);
assert.equal(applied.activation.publicationCount, 0);
assert.equal(applied.promotionManifest.promotedCount, 6);
assert.equal(applied.promotionManifest.status, 'ALL_ACCEPTED_CANDIDATES_PROMOTED_TO_PJA_APPROVAL_ELIGIBILITY');
const tempReviewRegistry = JSON.parse(await fs.readFile(path.join(temp, VAP_W9_PATHS.pjaReviewRegistry), 'utf8'));
assert.equal(tempReviewRegistry.records.length, pjaReviewRegistry.records.length + 6);
for (const nodeCode of VAP_W9_EXPECTED_NODE_CODES) {
  const candidate = await readJson(`content/knowledge/production/candidates/zh-Hans/${nodeCode}/candidate.v1.json`);
  const review = JSON.parse(await fs.readFile(path.join(temp, `content/knowledge/production/reviews/zh-Hans/${nodeCode}/review.v1.json`), 'utf8'));
  const valid = validateHumanReview(review, candidate);
  assert.equal(valid.valid, true, `${nodeCode}:${JSON.stringify(valid.errors)}`);
  assert.equal(review.decision, 'accept');
  assert.equal(review.authority.approval, 'not_approved');
  assert.equal(review.authority.publication, 'not_published');
  const promotion = JSON.parse(await fs.readFile(path.join(temp, `content/production/visual-article/promotion/zh-Hans/${nodeCode}/promotion.v1.json`), 'utf8'));
  assert.equal(promotion.reviewDecision, 'accept');
  assert.equal(promotion.promotionState, 'promoted_to_pja_approval_eligibility');
  assert.equal(promotion.candidateContentMutated, false);
  assert.equal(promotion.candidateRegistryMutated, false);
  assert.equal(promotion.candidateAcceptanceIsApproval, false);
  assert.equal(promotion.approvalRecorded, false);
  assert.equal(promotion.publicationRecorded, false);
}
const authorityAfter = await snapshotAuthorityDigests(root);
assert.deepEqual(authorityAfter, authorityBefore, 'VAP_W9_MUST_NOT_MUTATE_CANDIDATE_APPROVAL_PUBLICATION_REGISTRIES');

// A non-accept Human Review is recorded but must not promote that Candidate.
const mixedEnvelope = makeAcceptEnvelope();
const mixedNode = 'KN-B1-P2-009';
const mixedDecision = mixedEnvelope.entries.find(entry => entry.nodeCode === mixedNode);
mixedDecision.decision = 'changes_required';
mixedDecision.summary = '需要进一步强化更新机制与边界表达后再进入 Approval。';
mixedDecision.findings = [{ category: 'boundary', severity: 'major', comment: 'Human fixture: strengthen the Update ≠ Complete Replacement distinction before promotion.' }];
const mixedValidation = validateDecisionEnvelope(mixedEnvelope, reviewQueue, { requireAllDecided: true });
assert.equal(mixedValidation.valid, true, JSON.stringify(mixedValidation.errors));
const tempMixed = await fs.mkdtemp(path.join(os.tmpdir(), 'vap-w9-mixed-'));
await fs.mkdir(path.join(tempMixed, 'content/knowledge/production/registry'), { recursive: true });
await fs.writeFile(path.join(tempMixed, VAP_W9_PATHS.pjaReviewRegistry), serialize(pjaReviewRegistry));
const mixed = await applyVapW9(root, mixedEnvelope, { apply: true, targetRoot: tempMixed });
assert.equal(mixed.activation.humanEditorialReviewCount, 6);
assert.equal(mixed.activation.humanAcceptedCount, 5);
assert.equal(mixed.activation.candidatePromotionCount, 5);
assert.equal(mixed.promotionManifest.changesRequiredCount, 1);
assert.equal(mixed.promotionManifest.promotedCount, 5);
assert.equal(await fs.access(path.join(tempMixed, `content/production/visual-article/promotion/zh-Hans/${mixedNode}/promotion.v1.json`)).then(() => true, () => false), false);
const mixedReview = JSON.parse(await fs.readFile(path.join(tempMixed, `content/knowledge/production/reviews/zh-Hans/${mixedNode}/review.v1.json`), 'utf8'));
assert.equal(mixedReview.decision, 'changes_required');
assert.equal(mixedReview.authority.approval, 'not_approved');

// AI/System identity can never satisfy the Human Editorial authority gate.
const invalidActor = makeAcceptEnvelope();
invalidActor.entries[0].reviewerCode = 'ChatGPT';
invalidActor.entries[0].reviewerAuthority = 'AI_EDITORIAL_RECOMMENDATION_ONLY';
invalidActor.entries[0].editorialActorRole = 'AI_EDITOR';
const invalidActorValidation = validateDecisionEnvelope(invalidActor, reviewQueue, { requireAllDecided: true });
assert.equal(invalidActorValidation.valid, false);
assert(invalidActorValidation.errors.some(x => x.code === 'VAP_W9_HUMAN_REVIEWER_AUTHORITY_INVALID'));

const drifted = makeAcceptEnvelope();
drifted.entries[0].candidateDigest = '0'.repeat(64);
const driftValidation = validateDecisionEnvelope(drifted, reviewQueue, { requireAllDecided: true });
assert.equal(driftValidation.valid, false);
assert(driftValidation.errors.some(x => x.code === 'VAP_W9_DECISION_CANDIDATE_BINDING_INVALID'));

const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
assert.equal(pkg.scripts['check:vap-w9'], 'node scripts/check-vap-w9-human-editorial-review-candidate-promotion.mjs');
assert.equal(pkg.scripts['build:vap-w9'], 'node scripts/build-vap-w9-human-editorial-review-candidate-promotion.mjs');
assert.equal(pkg.scripts['vap:w9:apply'], 'node scripts/apply-vap-w9-human-editorial-review-candidate-promotion.mjs --apply');
assert(pkg.scripts['check:vap-b'].endsWith('&& npm run check:vap-w9'));

console.log('✓ VAP-W9 Human Editorial Review & Candidate Promotion passed.');
console.log('✓ 6/6 W8-imported zh-Hans Candidates are assembled into one Human Editorial Review queue; no Human decision is fabricated.');
console.log('✓ AI editorial assessment recommends accept for all 6, but remains explicitly non-authoritative and cannot satisfy TL Human Review Authority.');
console.log('✓ Existing PJA Human Review Runtime/Review Registry are reused; a second Human Review runtime is not created.');
console.log('✓ Positive fixture proves 6 explicit TL accept decisions create 6 valid PJA Human Review packages and 6 successor promotion records.');
console.log('✓ changes_required/reject/defer cannot promote a Candidate; Candidate promotion means Approval eligibility only, not Approval or Publication.');
console.log('✓ Frozen legacy PJA Candidate Registry remains untouched because W8 did not fabricate legacy prompt-package provenance.');
console.log('✓ Current real Batch 001 state remains 0 Human Reviews / 0 Promotions until explicit per-node TL decisions are recorded.');
