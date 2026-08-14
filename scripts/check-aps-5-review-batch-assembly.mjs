import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildReviewBatch, buildHumanDecisionInput, reviewBatchPath, humanDecisionsPath, APS5_BASELINE, APS5_CONTRACT, APS5_ALLOWED_PUBLICATION_DECISIONS } from './lib/article-simplification/review-batch-assembler-v1.mjs';

const root = process.cwd();
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const orchestrationPath = 'content/production/article-simplification/batches/BATCH-001/candidate-orchestration.v1.json';
const orchestration = readJson(orchestrationPath);
const contract = readJson(APS5_CONTRACT);
const reviewPath = reviewBatchPath('BATCH-001');
const decisionsPath = humanDecisionsPath('BATCH-001');
assert.equal(contract.work, 'APS-5');
assert.equal(contract.status, 'ACTIVE');
assert.equal(contract.baselineCommit, APS5_BASELINE);
assert.deepEqual(contract.humanDecisionInputBoundary.allowedPublicationDecisions, APS5_ALLOWED_PUBLICATION_DECISIONS);
assert.equal(orchestration.status, 'PRIMARY_CANDIDATES_RESOLVED_FOR_APS_5_REVIEW_BATCH');
assert.ok(fs.existsSync(path.join(root, reviewPath)), `${reviewPath} must exist after article:batch`);
assert.ok(fs.existsSync(path.join(root, decisionsPath)), `${decisionsPath} must exist after article:batch`);

const stored = readJson(reviewPath);
const current = buildReviewBatch(root, orchestration, { createdAt: stored.createdAt });
assert.equal(stored.schemaVersion, 'PHI-OS-APS-5-REVIEW-BATCH-v1.0.0');
assert.equal(stored.work, 'APS-5');
assert.equal(stored.status, 'AWAITING_TL_PUBLICATION_DECISIONS');
assert.equal(stored.implementationBaselineCommit, APS5_BASELINE);
assert.equal(stored.sourceOrchestration.orchestrationDigest, orchestration.orchestrationDigest);
assert.equal(stored.reviewBatchDigest, current.reviewBatchDigest);
assert.equal(stored.summary.activeReviewEntryCount, 6);
assert.equal(stored.summary.excludedLocaleLaneCount, 6);
assert.equal(stored.summary.reusedAcceptedReviewCount, 6);
assert.equal(stored.summary.reusedApprovedApprovalCount, 6);
assert.equal(stored.summary.validProductionArticlePackageCount, 6);
assert.equal(stored.summary.pendingReviewDecisionCount, 0);
assert.equal(stored.summary.pendingApprovalDecisionCount, 0);
assert.equal(stored.summary.pendingPublicationDecisionCount, 6);
assert.equal(stored.summary.existingPublicationAuthorityCount, 0);
assert.equal(stored.governance.reviewBatchAuthority, false);
assert.equal(stored.governance.reviewBatchEqualsBulkApproval, false);
assert.equal(stored.governance.humanPublicationDecisionMayBeInferred, false);
assert.equal(stored.governance.publicationCreated, false);

const expectedNodes = ['KN-B1-P1-006','KN-B1-P2-001','KN-B1-P2-009','KN-B1-P3-005','KN-B1-P3-015','KN-B1-P4-006'];
assert.deepEqual(stored.entries.map(entry => entry.nodeCode), expectedNodes);
for (const entry of stored.entries) {
  assert.equal(entry.locale, 'zh-Hans');
  assert.equal(entry.candidate.candidateAuthority, false);
  assert.equal(entry.existingAuthority.review.accepted, true);
  assert.equal(entry.existingAuthority.approval.approved, true);
  assert.equal(entry.existingAuthority.publication.published, false);
  assert.equal(entry.productionArticlePackage.valid, true);
  assert.equal(entry.productionArticlePackage.packageState, 'human_approved_not_published');
  assert.equal(entry.requiredHumanDecisions.review, 'REUSED_EXISTING_ACCEPTED_TL_REVIEW');
  assert.equal(entry.requiredHumanDecisions.approval, 'REUSED_EXISTING_TL_APPROVAL');
  assert.equal(entry.requiredHumanDecisions.publication, 'EXPLICIT_TL_PUBLICATION_DECISION_REQUIRED');
  assert.deepEqual(entry.unresolvedDecisionFields, ['publicationDecision','publisherCode','decidedAt','summary']);
  assert.deepEqual(entry.apsL10nHandoff.sequenceAfterExplicitPublication, ['LOCALE_ARTICLE_AUTHORITY','CAR','CPR','VISUAL_ARTICLE','SAME_ROUTE_LOCALE_RELEASE']);
}
for (const excluded of stored.excludedLocaleLanes) {
  assert.equal(excluded.locale, 'en');
  assert.equal(excluded.state, 'BLOCKED_LOCALE_AUTHORITY_DISCOVERY');
  assert.ok(excluded.blockers.includes('LOCALE_DISCOVERY_REQUIRED'));
  assert.ok(excluded.blockers.includes('CANDIDATE_NOT_PRESENT'));
}

const decisions = readJson(decisionsPath);
assert.equal(decisions.schemaVersion, 'PHI-OS-APS-5-HUMAN-DECISION-INPUT-v1.0.0');
assert.equal(decisions.work, 'APS-5');
assert.equal(decisions.batchCode, 'BATCH-001');
assert.equal(decisions.sourceReviewBatchDigest, stored.reviewBatchDigest);
assert.equal(decisions.bulkApprovalAuthorityCreated, false);
assert.equal(decisions.publicationAuthorityCreated, false);
assert.deepEqual(decisions.allowedPublicationDecisions, APS5_ALLOWED_PUBLICATION_DECISIONS);
assert.equal(decisions.entries.length, 6);
for (const decision of decisions.entries) {
  const entry = stored.entries.find(item => item.nodeCode === decision.nodeCode && item.locale === decision.locale);
  assert.ok(entry);
  assert.equal(decision.candidateDigest, entry.candidate.candidateDigest);
  assert.equal(decision.reviewDecision, 'accept');
  assert.equal(decision.approvalDecision, 'approve');
  if (decision.publicationDecision !== null) assert.ok(APS5_ALLOWED_PUBLICATION_DECISIONS.includes(decision.publicationDecision));
  assert.ok(['pending_human','human_decided','existing_authority_reused'].includes(decision.decisionState));
}
const initialTemplate = buildHumanDecisionInput(stored);
if (decisions.status === 'PENDING_HUMAN' && decisions.entries.every(entry => entry.decisionState === 'pending_human')) {
  assert.deepEqual(decisions, initialTemplate);
}

const packageJson = readJson('package.json');
assert.equal(packageJson.scripts['check:aps-5'], 'node scripts/check-aps-5-review-batch-assembly.mjs');
assert.match(packageJson.scripts['check:aps'], /check:aps-5/);
const articleBatchSource = fs.readFileSync(path.join(root, 'scripts/article-batch.mjs'), 'utf8');
assert.match(articleBatchSource, /writeReviewBatch/);
assert.match(articleBatchSource, /APS-5 Review Batch Assembly/);

console.log('✓ APS-5 Review Batch Assembly passed.');
console.log('✓ BATCH-001 now exposes one human-facing batch with 6 zh-Hans entries; all exact digest-bound TL Review + Approval authority is reused.');
console.log('✓ Only Human Publication Decision remains unresolved for the 6 current entries; review-batch and human-decisions files create no authority by themselves.');
console.log('✓ All 6 English lanes remain excluded and fail closed until independent English Candidate + locale identity/authority exist.');
console.log('→ Next: APS-6 validates explicit per-node Human decisions and bridges them to governed publication authority without inventing decisions.');
