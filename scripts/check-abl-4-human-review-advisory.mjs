import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
const stable = value => `${JSON.stringify(value, null, 2)}\n`;
const digest = value => crypto.createHash('sha256').update(stable(value)).digest('hex');
const batchDir = 'content/production/article-simplification/bilingual/BATCH-001';
const advisory = read(`${batchDir}/abl-4-human-review-advisory-v1.json`);
const reviewBatch = read(`${batchDir}/bilingual-review-batch.v1.json`);
const human = read(`${batchDir}/english-human-decisions.v1.json`);

assert.equal(advisory.work, 'ABL-4');
assert.equal(advisory.batchCode, 'BATCH-001');
assert.equal(advisory.repositoryBaseline, 'fe24201c6634ddff32ef5b067f6bce4db14c3cf0');
assert.equal(advisory.sourceReviewBatch.reviewBatchDigest, reviewBatch.reviewBatchDigest);
assert.equal(advisory.status, 'AWAITING_TL_DECISION_AFTER_ADVISORY_REVIEW');
assert.equal(advisory.entryCount, 6);
assert.equal(advisory.summary.bodyPassCount, 6);
assert.equal(advisory.summary.titleRevisionRecommendedCount, 6);
assert.equal(advisory.summary.humanAuthorityCreatedCount, 0);
assert.equal(advisory.governance.advisoryOnly, true);
assert.equal(advisory.governance.recommendationEqualsHumanReviewDecision, false);
assert.equal(advisory.governance.recommendationEqualsApproval, false);
assert.equal(advisory.governance.recommendationEqualsPublicationDecision, false);
assert.equal(advisory.governance.sameRouteSlugMayChange, false);
assert.equal(advisory.governance.zhHansHumanAuthorityInherited, false);

const copy = structuredClone(advisory); delete copy.advisoryDigest;
assert.equal(advisory.advisoryDigest, digest(copy));

const reviewMap = new Map(reviewBatch.entries.map(entry => [entry.nodeCode, entry]));
for (const entry of advisory.entries) {
  const source = reviewMap.get(entry.nodeCode);
  assert.ok(source, entry.nodeCode);
  assert.equal(entry.locale, 'en');
  assert.equal(entry.candidateCode, source.candidate.candidateCode);
  assert.equal(entry.candidateDigest, source.candidate.candidateDigest);
  assert.equal(entry.sameRouteSlug, source.sameRouteSlug);
  assert.equal(entry.bodyAssessment, 'PASS');
  assert.equal(entry.canonicalBoundaryAssessment, 'PASS');
  assert.equal(entry.safetyBoundaryAssessment, 'PASS');
  assert.equal(entry.recommendedHumanReviewDecision, 'changes_required');
  assert.equal(entry.changeClass, 'TITLE_ONLY');
  assert.notEqual(entry.proposedTitle, entry.currentTitle);
  assert.ok(entry.proposedTitle.endsWith('?'));
}
const p2 = advisory.entries.find(x => x.nodeCode === 'KN-B1-P2-001');
assert.ok(p2);
assert.match(p2.currentTitle, /Experiencable/);
assert.doesNotMatch(p2.proposedTitle, /Experiencable/);
assert.match(p2.proposedTitle, /Experienceable/);

// Advisory review must not impersonate TL or create Human authority.
for (const entry of human.entries) {
  for (const key of ['reviewDecision','reviewerCode','reviewedAt','reviewSummary','approvalDecision','approverCode','approvedAt','approvalSummary','publicationDecision','publisherCode','decidedAt','publicationSummary']) {
    assert.equal(entry[key], null, `${entry.nodeCode}:${key}`);
  }
  assert.deepEqual(entry.reviewFindings, []);
  assert.deepEqual(entry.approvalConditions, []);
}

console.log('✓ ABL-4 Human Review Advisory Pack passed.');
console.log('✓ 6/6 English bodies pass Canonical / terminology / safety boundary review; 6/6 public titles require title-only editorial revision.');
console.log('✓ Advisory recommendations are digest-bound to current English Candidates and create 0 TL Review / Approval / Publication authority.');
console.log('→ Await explicit TL acceptance or revision of the six proposed titles before recording ABL-4 Human authority.');
