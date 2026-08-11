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
assert.equal(review.proposalAuthority, 'AI_EDITORIAL_RECOMMENDATION_ONLY');
assert.equal(review.entries.length, 6);
assert.deepEqual(review.entries.map(entry => entry.nodeCode), VAP_W6A_NODE_CODES);
assert.equal(decisions.bulkApprovalAllowed, false);
assert.equal(decisions.oneIndependentDecisionPerNode, true);
assert.equal(decisions.entries.length, 6);

for (let index = 0; index < 6; index += 1) {
  const proposal = review.entries[index];
  const decision = decisions.entries[index];
  assert.equal(proposal.nodeCode, decision.nodeCode);
  assert.equal(proposal.proposalContentHash, proposalContentHash(proposal.proposedContent));
  assert.equal(decision.proposalContentHash, proposal.proposalContentHash);
  assert.equal(proposal.promotionAllowed, false, 'Review proposal itself must not become approval authority.');
}

const human = loadVapW6aHumanAuthority(root);
assert.equal(decisions.status, 'HUMAN_APPROVED');
assert.equal(human.pendingNodeCodes.length, 0);
assert.deepEqual(human.approvedNodeCodes, VAP_W6A_NODE_CODES);
assert.equal(human.approvedEditorialByNode.size, 6);
assert.equal(human.approvedProductionByNode.size, 6);
for (const decision of decisions.entries) {
  assert.equal(decision.decisionState, 'human_approved', `${decision.nodeCode}: HUMAN_DECISION`);
  assert.equal(decision.productionDecision, 'approve_for_production', `${decision.nodeCode}: PRODUCTION_DECISION`);
  assert.equal(decision.productionRole, 'ARTICLE', `${decision.nodeCode}: ROLE`);
  assert.deepEqual(decision.requiredOutputs, ['ARTICLE'], `${decision.nodeCode}: OUTPUTS`);
  assert.equal(decision.dispatchTarget, 'PJA', `${decision.nodeCode}: DISPATCH`);
  assert.equal(decision.c2FreezeDecision, 'freeze_approved', `${decision.nodeCode}: C2`);
  assert.equal(decision.manuscriptMappingDecision, 'range_approved', `${decision.nodeCode}: MANUSCRIPT_MAPPING`);
  assert.equal(decision.productionActorRole, 'HUMAN_PRODUCTION_AUTHORITY');
  assert.equal(decision.editorialActorRole, 'HUMAN_EDITORIAL_AUTHORITY');
  assert.ok(decision.actor && !/^(AI|SYSTEM|CHATGPT|AUTOMATION)$/i.test(decision.actor), `${decision.nodeCode}: REAL_HUMAN_REQUIRED`);
}

assert.equal(eligibility.summary.selectedNodeCount, 6);
assert.equal(eligibility.summary.humanArticleApprovedCount, 6);
assert.equal(eligibility.summary.humanC2ApprovedCount, 6);
assert.equal(eligibility.summary.manuscriptMappingVerifiedCount, 6);
assert.equal(eligibility.summary.c2FrozenCount, 6);
assert.equal(eligibility.summary.c3ProductionReadyCount, 6);
assert.equal(eligibility.summary.productionPlanFrozenCount, 6);
assert.equal(eligibility.summary.productionWaveFrozenCount, 6);
assert.equal(eligibility.summary.executionAuthorityValidCount, 6);
assert.equal(eligibility.summary.newArticleExecutionEligibleCount, 6);
assert.deepEqual(eligibility.summary.newArticleExecutionEligibleNodeCodes, VAP_W6A_NODE_CODES);
assert.equal(activation.status, 'ARTICLE_EXECUTION_FORMATION_ACTIVE');
assert.equal(activation.currentAuthority.pendingHumanNodeCount, 0);
assert.equal(activation.currentAuthority.humanApprovedNodeCount, 6);
assert.equal(activation.currentAuthority.newArticleExecutionEligibleCount, 6);
assert.equal(activation.effectsByActivation.humanDecisionCreatedBySystem, false);
assert.equal(activation.effectsByActivation.candidateCreated, false);
assert.equal(activation.effectsByActivation.providerInvoked, false);
assert.equal(activation.effectsByActivation.publicationCreated, false);

const rebuiltEligibility = buildVapW6aExecutionEligibility(root);
const rebuiltActivation = buildVapW6aActivation(root, rebuiltEligibility);
assert.equal(stableJson(rebuiltEligibility), stableJson(eligibility));
assert.equal(stableJson(rebuiltActivation), stableJson(activation));

const c2Index = read('content/knowledge/editorial/c2/canonical-thesis-boundary-index.json');
const c3Index = read('content/knowledge/editorial/c3/universal-production-readiness-index.json');
for (const nodeCode of VAP_W6A_NODE_CODES) {
  const c2 = c2Index.entries.find(entry => entry.nodeCode === nodeCode);
  const c3 = c3Index.entries.find(entry => entry.nodeCode === nodeCode);
  const execution = eligibility.entries.find(entry => entry.nodeCode === nodeCode);
  assert.equal(c2?.status, 'frozen', `${nodeCode}: C2_STATUS`);
  assert.equal(c2?.thesisState, 'frozen', `${nodeCode}: C2_THESIS`);
  assert.equal(c2?.boundaryState, 'frozen', `${nodeCode}: C2_BOUNDARY`);
  assert.equal(c3?.status, 'production_ready', `${nodeCode}: C3_STATUS`);
  assert.equal(c3?.productionReady, true, `${nodeCode}: C3_READY`);
  assert.equal(execution?.articleExecutionEligible, true, `${nodeCode}: EXECUTION_ELIGIBLE`);
  assert.deepEqual(execution?.nonExecutionReasons, [], `${nodeCode}: NO_BLOCKERS`);
}

for (const relative of [VAP_W6A_HUMAN_PRODUCTION_DECISION, VAP_W6A_FROZEN_PLAN, VAP_W6A_FROZEN_WAVE, VAP_W6A_EXECUTION_AUTHORITY]) {
  assert.equal(present(relative), true, `Approved authority must materialize ${relative}`);
}
assert.equal(read(VAP_W6A_HUMAN_PRODUCTION_DECISION).status, 'APPROVED_FOR_PRODUCTION');
assert.equal(read(VAP_W6A_FROZEN_PLAN).status, 'FROZEN');
assert.equal(read(VAP_W6A_FROZEN_WAVE).status, 'FROZEN');
assert.equal(read(VAP_W6A_EXECUTION_AUTHORITY).status, 'ACTIVE');

const invalidActor = structuredClone(decisions);
invalidActor.entries[0].actor = 'ChatGPT';
assert.throws(
  () => loadVapW6aHumanAuthority(root, { decisionOverride: invalidActor }),
  error => error.code === 'VAP_W6A_REAL_HUMAN_REQUIRED'
);

const invalidHash = structuredClone(decisions);
invalidHash.entries[0].proposalContentHash = 'sha256:' + '0'.repeat(64);
assert.throws(
  () => loadVapW6aHumanAuthority(root, { decisionOverride: invalidHash }),
  error => /HASH|CONTENT/i.test(error.code || error.message)
);

const packageJson = read('package.json');
assert.ok(packageJson.scripts['build:vap-w6a']?.includes('build-vap-w6a-batch-article-decision-c2-c3-wave-freeze.mjs'));
assert.ok(packageJson.scripts['vap:w6a:apply']?.includes('apply-vap-w6a-batch-article-decision-c2-c3-wave-freeze.mjs'));
assert.ok(packageJson.scripts['check:vap-w6a']?.includes('check-vap-w6a-batch-article-decision-c2-c3-wave-freeze.mjs'));
assert.ok(packageJson.scripts['check:vap-b']?.includes('check:vap-w6a'));
assert.ok(packageJson.scripts.postcheck?.includes('check:vap-b'));

console.log('✓ VAP-W6A Batch Article Decision + C2/C3 Formation & Wave Freeze passed.');
console.log('✓ Batch 001 records six independent real-Human ARTICLE/C2/manuscript approvals; no bulk approval authority was created.');
console.log('✓ All six nodes are C2 frozen, C3 production-ready, plan/wave frozen, execution-authorized and new-Article execution eligible.');
console.log('✓ Review proposals remain proposals; system/AI actors and proposal-hash drift cannot satisfy Human Authority.');
console.log('✓ W6A itself still creates no Provider candidate and no publication.');
