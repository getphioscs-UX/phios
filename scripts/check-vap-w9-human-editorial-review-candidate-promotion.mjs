import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  VAP_W9_EXPECTED_NODE_CODES,
  VAP_W9_PATHS,
  buildVapW9ReviewQueue,
  validateDecisionEnvelope,
  applyVapW9,
  snapshotAuthorityDigests
} from './lib/visual-article-production/human-editorial-review-candidate-promotion-v1.mjs';
import { validateHumanReview } from './lib/knowledge-production/human-review-v1.mjs';
import { serialize, digest } from './lib/knowledge-production/canonical-brief-v2.mjs';
import { resolveVapW11PublishedSuccessorAuthority } from './lib/visual-article-production/publication-handoff-decision-v1.mjs';

const root = process.cwd();
const readJson = async rel => JSON.parse(await fs.readFile(path.join(root, rel), 'utf8'));
const fileExists = rel => fs.access(path.join(root, rel)).then(() => true, () => false);
const [contract, policy, reviewQueue, decisions, promotionManifest, activation, candidateRegistry, reviewRegistry, approvalRegistry, publicationRegistry] = await Promise.all([
  readJson('content/production/visual-article/contracts/vap-w9-human-editorial-review-candidate-promotion-v1.json'),
  readJson('content/production/visual-article/policies/vap-w9-human-editorial-review-candidate-promotion-policy-v1.json'),
  readJson(VAP_W9_PATHS.reviewQueue), readJson(VAP_W9_PATHS.decisions), readJson(VAP_W9_PATHS.promotionManifest), readJson(VAP_W9_PATHS.activation),
  readJson(VAP_W9_PATHS.pjaCandidateRegistry), readJson(VAP_W9_PATHS.pjaReviewRegistry), readJson(VAP_W9_PATHS.pjaApprovalRegistry), readJson(VAP_W9_PATHS.pjaPublicationRegistry)
]);
const w10DecisionPath = 'content/production/visual-article/decisions/vap-w10-batch-001-human-approval-decisions-v1.json';
const w10Decisions = await fileExists(w10DecisionPath) ? await readJson(w10DecisionPath) : null;
const w10DecisionByNode = new Map((w10Decisions?.entries ?? []).map(entry => [entry.nodeCode, entry]));

assert.equal(contract.work, 'VAP-W9');
assert.equal(contract.implementationBaselineCommit, '9cd28c6ad24ebffeeb553cfe65fb572ef562d3ed');
assert.equal(contract.candidatePromotion.candidateAcceptanceIsApproval, false);
assert.equal(contract.candidatePromotion.candidateAcceptanceIsPublication, false);
assert.equal(contract.existingPjaRuntimeReuse.secondHumanReviewRuntimeAllowed, false);
assert.equal(policy.reviewAuthority, 'TL Human Review Authority');
assert.equal(policy.candidateMutationAllowed, false);
assert.equal(policy.approvalRegistryMutationAllowed, false);
assert.equal(policy.publicationRegistryMutationAllowed, false);

const rebuiltQueue = await buildVapW9ReviewQueue(root);
assert.equal(serialize(rebuiltQueue), serialize(reviewQueue), 'VAP_W9_REVIEW_QUEUE_NOT_DETERMINISTIC');
assert.equal(reviewQueue.entries.length, 6);
assert.equal(reviewQueue.proposalAuthority, 'AI_EDITORIAL_RECOMMENDATION_ONLY_NOT_HUMAN_REVIEW');
assert.equal(reviewQueue.reviewQueueDigest, `sha256:${digest(Object.fromEntries(Object.entries(reviewQueue).filter(([key]) => key !== 'reviewQueueDigest')))}`);
const decisionValidation = validateDecisionEnvelope(decisions, reviewQueue, { requireAllDecided: true });
assert.equal(decisionValidation.valid, true, JSON.stringify(decisionValidation.errors));
assert.equal(decisions.status, 'HUMAN_DECISIONS_RECORDED');
assert.equal(decisions.entries.length, 6);
assert(decisions.entries.every(entry => entry.decisionState === 'human_decided' && entry.decision === 'accept' && entry.reviewerCode === 'TL' && entry.reviewerAuthority === 'TL Human Review Authority' && entry.editorialActorRole === 'HUMAN_EDITORIAL_AUTHORITY'));

assert.equal(promotionManifest.status, 'ALL_ACCEPTED_CANDIDATES_PROMOTED_TO_PJA_APPROVAL_ELIGIBILITY');
assert.equal(promotionManifest.reviewedCount, 6); assert.equal(promotionManifest.acceptedCount, 6); assert.equal(promotionManifest.promotedCount, 6);
assert.equal(promotionManifest.approvalRecorded, false); assert.equal(promotionManifest.publicationRecorded, false);
assert.equal(activation.humanEditorialReviewCount, 6); assert.equal(activation.humanAcceptedCount, 6); assert.equal(activation.candidatePromotionCount, 6);
assert.equal(activation.approvalCount, 0); assert.equal(activation.publicationCount, 0);

for (const nodeCode of VAP_W9_EXPECTED_NODE_CODES) {
  const q = reviewQueue.entries.find(item => item.nodeCode === nodeCode); assert(q);
  assert.equal(q.aiEditorialRecommendation.authority, 'AI_EDITORIAL_RECOMMENDATION_ONLY_NOT_HUMAN_REVIEW');
  assert.equal(q.aiEditorialRecommendation.recommendation, 'ACCEPT_RECOMMENDED_PENDING_HUMAN_CONFIRMATION');
  assert.equal(candidateRegistry.records.some(record => record.nodeCode === nodeCode && record.locale === 'zh-Hans'), false, `${nodeCode}:LEGACY_CANDIDATE_REGISTRY_MUST_REMAIN_UNPROMOTED`);
  const candidate = await readJson(`content/knowledge/production/candidates/zh-Hans/${nodeCode}/candidate.v1.json`);
  const review = await readJson(`content/knowledge/production/reviews/zh-Hans/${nodeCode}/review.v1.json`);
  const valid = validateHumanReview(review, candidate); assert.equal(valid.valid, true, `${nodeCode}:${JSON.stringify(valid.errors)}`);
  assert.equal(review.decision, 'accept'); assert.equal(review.reviewer.reviewerCode, 'TL'); assert.equal(review.authority.approval, 'not_approved'); assert.equal(review.authority.publication, 'not_published');
  const registryRecord = reviewRegistry.records.find(record => record.reviewCode === review.reviewCode); assert(registryRecord, `${nodeCode}:REVIEW_REGISTRY_RECORD_REQUIRED`); assert.equal(registryRecord.reviewDigest, review.reviewDigest);
  const promotion = await readJson(`content/production/visual-article/promotion/zh-Hans/${nodeCode}/promotion.v1.json`);
  assert.equal(promotion.reviewDecision, 'accept'); assert.equal(promotion.promotionState, 'promoted_to_pja_approval_eligibility');
  assert.equal(promotion.candidateAcceptanceIsApproval, false); assert.equal(promotion.approvalRecorded, false); assert.equal(promotion.publicationRecorded, false);
  const successorApproval = approvalRegistry.records.find(record => record.nodeCode === nodeCode && record.locale === 'zh-Hans');
  const w10Decision = w10DecisionByNode.get(nodeCode) ?? null;
  const w10Approved = Boolean(w10Decision
    && w10Decision.decisionState === 'human_decided'
    && w10Decision.decision === 'approve'
    && w10Decision.approverCode === 'TL'
    && w10Decision.approverAuthority === 'TL Human Approval Authority');
  if (successorApproval) {
    assert.equal(w10Approved, true, `${nodeCode}:APPROVAL_MUST_HAVE_W10_HUMAN_AUTHORITY`);
    assert.equal(successorApproval.decision, 'approve'); assert.equal(successorApproval.approverCode, 'TL');
    assert.equal(successorApproval.candidateCode, w10Decision.candidateCode); assert.equal(successorApproval.candidateDigest, w10Decision.candidateDigest);
    assert.equal(successorApproval.reviewCode, w10Decision.reviewCode); assert.equal(successorApproval.reviewDigest, w10Decision.reviewDigest);
    assert.equal(successorApproval.publication, 'not_published');
  } else assert.equal(w10Approved, false, `${nodeCode}:W10_APPROVAL_DECISION_REQUIRES_APPROVAL_RECORD`);
  const successorPublication = publicationRegistry.records.find(
    record => record.nodeCode === nodeCode && record.locale === 'zh-Hans'
  );
  if (successorPublication) {
    const successorAuthority = await resolveVapW11PublishedSuccessorAuthority(root, nodeCode);
    assert(successorAuthority?.humanPublicationAuthorized, `${nodeCode}:PUBLICATION_REQUIRES_W11_HUMAN_AUTHORITY`);
    assert.equal(successorAuthority.publicationRecorded, true, `${nodeCode}:SUCCESSOR_PUBLICATION_RECORD_REQUIRED`);
    assert.deepEqual(successorPublication, successorAuthority.record, `${nodeCode}:SUCCESSOR_PUBLICATION_REGISTRY_LINEAGE`);
  }
  assert.equal(await fileExists(`content/knowledge/production/reviews/zh-Hans/${nodeCode}/review.v1.json`), true);
}

// Non-accept decisions remain reviewable but cannot promote.
const mixedEnvelope = structuredClone(decisions);
const mixedNode = 'KN-B1-P2-009';
const mixedDecision = mixedEnvelope.entries.find(entry => entry.nodeCode === mixedNode);
mixedDecision.decision = 'changes_required'; mixedDecision.summary = 'Human fixture requires one editorial change before promotion.'; mixedDecision.findings = [{ category: 'boundary', severity: 'major', comment: 'Fixture finding.' }];
const mixedValidation = validateDecisionEnvelope(mixedEnvelope, reviewQueue, { requireAllDecided: true }); assert.equal(mixedValidation.valid, true, JSON.stringify(mixedValidation.errors));
const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'vap-w9-mixed-'));
await fs.mkdir(path.join(temp, 'content/knowledge/production/registry'), { recursive: true });
const baseReviewRegistry = { ...reviewRegistry, records: reviewRegistry.records.filter(record => !VAP_W9_EXPECTED_NODE_CODES.includes(record.nodeCode)) };
await fs.writeFile(path.join(temp, VAP_W9_PATHS.pjaReviewRegistry), serialize(baseReviewRegistry));
const mixed = await applyVapW9(root, mixedEnvelope, { apply: true, targetRoot: temp });
assert.equal(mixed.activation.humanEditorialReviewCount, 6); assert.equal(mixed.activation.humanAcceptedCount, 5); assert.equal(mixed.activation.candidatePromotionCount, 5);
assert.equal(await fs.access(path.join(temp, `content/production/visual-article/promotion/zh-Hans/${mixedNode}/promotion.v1.json`)).then(() => true, () => false), false);

// AI/System identity can never satisfy Human Review authority.
const invalid = structuredClone(decisions); invalid.entries[0].reviewerCode = 'ChatGPT'; invalid.entries[0].reviewerAuthority = 'AI'; invalid.entries[0].editorialActorRole = 'AI_EDITOR';
assert.equal(validateDecisionEnvelope(invalid, reviewQueue, { requireAllDecided: true }).valid, false);
const authorityBefore = await snapshotAuthorityDigests(root); const authorityAfter = await snapshotAuthorityDigests(root); assert.deepEqual(authorityAfter, authorityBefore);

const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
assert.equal(pkg.scripts['check:vap-w9'], 'node scripts/check-vap-w9-human-editorial-review-candidate-promotion.mjs');
assert.equal(pkg.scripts['vap:w9:apply'], 'node scripts/apply-vap-w9-human-editorial-review-candidate-promotion.mjs --apply');
console.log('✓ VAP-W9 Human Editorial Review & Candidate Promotion passed after explicit TL decisions.');
console.log('✓ 6/6 Candidates have independent TL Human Review = accept and 6/6 are promoted to PJA Approval Eligibility.');
console.log('✓ VAP-W9 itself does not create Approval; any successor Approval record must be independently bound to an explicit VAP-W10 TL Human Approval decision.');
console.log('✓ AI/System actors cannot satisfy Human Review authority; non-accept outcomes cannot promote.');
