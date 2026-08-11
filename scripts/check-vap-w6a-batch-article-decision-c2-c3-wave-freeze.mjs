import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  VAP_W6A_ACTIVATION,
  VAP_W6A_CONTRACT,
  VAP_W6A_ELIGIBILITY,
  VAP_W6A_EXECUTION_AUTHORITY,
  VAP_W6A_FROZEN_PLAN,
  VAP_W6A_FROZEN_WAVE,
  VAP_W6A_HUMAN_PRODUCTION_DECISION,
  buildVapW6aActivation,
  buildVapW6aExecutionEligibility,
  stableJson
} from './lib/visual-article-production/batch-article-decision-c2-c3-wave-freeze-v1.mjs';
import {
  VAP_W6A_BASELINE,
  VAP_W6A_DECISIONS,
  VAP_W6A_NODE_CODES,
  VAP_W6A_REVIEW,
  loadVapW6aHumanAuthority,
  proposalContentHash
} from './lib/visual-article-production/vap-w6a-authority-resolution-v1.mjs';

const root = process.cwd();
const read = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const present = relative => fs.existsSync(path.join(root, relative));

const contract = read(VAP_W6A_CONTRACT);
const review = read(VAP_W6A_REVIEW);
const decisions = read(VAP_W6A_DECISIONS);
const eligibility = read(VAP_W6A_ELIGIBILITY);
const activation = read(VAP_W6A_ACTIVATION);

assert.equal(contract.implementationBaselineCommit, VAP_W6A_BASELINE);
assert.equal(review.baselineCommit, VAP_W6A_BASELINE);
assert.equal(review.status, 'AWAITING_EXPLICIT_HUMAN_DECISIONS');
assert.equal(review.proposalAuthority, 'AI_EDITORIAL_RECOMMENDATION_ONLY');
assert.equal(review.entries.length, 6);
assert.deepEqual(review.entries.map(entry => entry.nodeCode), VAP_W6A_NODE_CODES);
assert.equal(decisions.status, 'PENDING_HUMAN');
assert.equal(decisions.bulkApprovalAllowed, false);
assert.equal(decisions.oneIndependentDecisionPerNode, true);
assert.equal(decisions.entries.length, 6);
for (let index = 0; index < 6; index += 1) {
  const proposal = review.entries[index];
  const decision = decisions.entries[index];
  assert.equal(proposal.nodeCode, decision.nodeCode);
  assert.equal(proposal.proposalContentHash, proposalContentHash(proposal.proposedContent));
  assert.equal(decision.proposalContentHash, proposal.proposalContentHash);
  assert.equal(proposal.approvalState, 'pending_human');
  assert.equal(proposal.promotionAllowed, false);
  assert.equal(proposal.humanDecision, null);
  assert.equal(proposal.manuscriptMappingReview.humanVerified, false);
  assert.equal(decision.decisionState, 'pending_human');
  assert.equal(decision.actor, null);
  assert.equal(decision.productionDecision, null);
  assert.equal(decision.c2FreezeDecision, null);
  assert.equal(decision.manuscriptMappingDecision, null);
}

const human = loadVapW6aHumanAuthority(root);
assert.equal(human.pendingNodeCodes.length, 6);
assert.equal(human.approvedNodeCodes.length, 0);
assert.equal(human.approvedEditorialByNode.size, 0);
assert.equal(human.approvedProductionByNode.size, 0);

assert.equal(eligibility.summary.selectedNodeCount, 6);
assert.equal(eligibility.summary.humanArticleApprovedCount, 0);
assert.equal(eligibility.summary.humanC2ApprovedCount, 0);
assert.equal(eligibility.summary.manuscriptMappingVerifiedCount, 0);
assert.equal(eligibility.summary.newArticleExecutionEligibleCount, 0);
assert.equal(activation.status, 'AWAITING_EXPLICIT_HUMAN_ARTICLE_AND_C2_DECISIONS');
assert.equal(activation.effectsByActivation.humanDecisionCreatedBySystem, false);
assert.equal(activation.effectsByActivation.candidateCreated, false);
assert.equal(activation.effectsByActivation.providerInvoked, false);
assert.equal(activation.effectsByActivation.publicationCreated, false);

const rebuiltEligibility = buildVapW6aExecutionEligibility(root);
const rebuiltActivation = buildVapW6aActivation(root, rebuiltEligibility);
assert.equal(stableJson(rebuiltEligibility), stableJson(eligibility));
assert.equal(stableJson(rebuiltActivation), stableJson(activation));

for (const nodeCode of VAP_W6A_NODE_CODES) {
  const c2Index = read('content/knowledge/editorial/c2/canonical-thesis-boundary-index.json');
  const c3Index = read('content/knowledge/editorial/c3/universal-production-readiness-index.json');
  const c2 = c2Index.entries.find(entry => entry.nodeCode === nodeCode);
  const c3 = c3Index.entries.find(entry => entry.nodeCode === nodeCode);
  assert.equal(c2.status, 'human_review_required');
  assert.equal(c3.status, 'blocked_by_c2');
  assert.equal(c3.productionReady, false);
  assert.ok(eligibility.entries.find(entry => entry.nodeCode === nodeCode).nonExecutionReasons.includes('C2_THESIS_BOUNDARY_NOT_FROZEN'));
}

for (const relative of [VAP_W6A_HUMAN_PRODUCTION_DECISION, VAP_W6A_FROZEN_PLAN, VAP_W6A_FROZEN_WAVE, VAP_W6A_EXECUTION_AUTHORITY]) {
  assert.equal(present(relative), false, `Live pending authority must not materialize ${relative}`);
}

const approvedFixture = structuredClone(decisions);
approvedFixture.status = 'HUMAN_APPROVED';
approvedFixture.entries = approvedFixture.entries.map((entry, index) => ({
  ...entry,
  decisionState: 'human_approved',
  productionDecision: 'approve_for_production',
  productionRole: 'ARTICLE',
  requiredOutputs: ['ARTICLE'],
  dispatchTarget: 'PJA',
  c2FreezeDecision: 'freeze_approved',
  manuscriptMappingDecision: 'range_approved',
  actor: 'TL',
  productionActorRole: 'HUMAN_PRODUCTION_AUTHORITY',
  editorialActorRole: 'HUMAN_EDITORIAL_AUTHORITY',
  decidedAt: `2026-08-11T12:${String(30 + index).padStart(2, '0')}:00+08:00`,
  rationale: `Human reviewed and approved ${entry.nodeCode} Article production, C2 content and manuscript mapping range.`
}));
const approved = loadVapW6aHumanAuthority(root, { decisionOverride: approvedFixture });
assert.equal(approved.pendingNodeCodes.length, 0);
assert.equal(approved.approvedNodeCodes.length, 6);
assert.equal(approved.approvedEditorialByNode.size, 6);
assert.equal(approved.approvedProductionByNode.size, 6);
for (const entry of approved.approvedEditorialByNode.values()) {
  assert.equal(entry.approvalState, 'human_approved');
  assert.equal(entry.promotionAllowed, true);
  assert.equal(entry.manuscriptMappingReview.humanVerified, true);
  assert.equal(entry.humanDecision.actorRole, 'HUMAN_EDITORIAL_AUTHORITY');
}

const invalidActor = structuredClone(approvedFixture);
invalidActor.entries[0].actor = 'ChatGPT';
assert.throws(
  () => loadVapW6aHumanAuthority(root, { decisionOverride: invalidActor }),
  error => error.code === 'VAP_W6A_REAL_HUMAN_REQUIRED'
);

const packageJson = read('package.json');
assert.ok(packageJson.scripts['build:vap-w6a']?.includes('build-vap-w6a-batch-article-decision-c2-c3-wave-freeze.mjs'));
assert.ok(packageJson.scripts['vap:w6a:apply']?.includes('apply-vap-w6a-batch-article-decision-c2-c3-wave-freeze.mjs'));
assert.ok(packageJson.scripts['check:vap-w6a']?.includes('check-vap-w6a-batch-article-decision-c2-c3-wave-freeze.mjs'));
assert.ok(packageJson.scripts['check:vap-b']?.includes('check:vap-w6a'));
assert.ok(packageJson.scripts['check:vap-b']?.includes('check:vap-w7'));
assert.ok(packageJson.scripts.postcheck?.includes('check:vap-w6a'));
assert.ok(packageJson.scripts.postcheck?.includes('check:vap-w7'));

console.log('✓ VAP-W6A Batch Article Decision + C2/C3 Formation & Wave Freeze passed.');
console.log('✓ Live Batch 001 remains fail-closed: 6 pending Human decisions, 0 fabricated approvals, 0 frozen W6A Article execution targets.');
console.log('✓ Six exact C2 proposals are hash-bound to six independent Human decision slots.');
console.log('✓ Simulated real-Human happy path resolves all six approvals without persisting fake Human authority.');
console.log('✓ AI/System/ChatGPT cannot satisfy the Human Authority gate.');
console.log('✓ C2_THESIS_BOUNDARY_NOT_FROZEN remains active until explicit Human approval is recorded.');
