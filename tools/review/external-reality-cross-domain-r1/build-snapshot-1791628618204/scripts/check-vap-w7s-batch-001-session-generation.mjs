import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const digest = source => `sha256:${crypto.createHash('sha256').update(source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'), 'utf8').digest('hex')}`;
const decisionsPath = 'content/production/visual-article/decisions/vap-w6a-batch-001-human-decisions-v1.json';
const reconciliationPath = 'content/production/visual-article/reconciliation/vap-w7s-batch-001-session-generation-v1.json';
const decisions = readJson(decisionsPath);
const reconciliation = readJson(reconciliationPath);

assert.equal(decisions.status, 'HUMAN_APPROVED');
assert.equal(decisions.entries.length, 6);
assert.equal(decisions.bulkApprovalAllowed, false);
assert.equal(decisions.oneIndependentDecisionPerNode, true);
for (const entry of decisions.entries) {
  assert.equal(entry.decisionState, 'human_approved', `${entry.nodeCode}: HUMAN_DECISION`);
  assert.equal(entry.productionDecision, 'approve_for_production', `${entry.nodeCode}: PRODUCTION_DECISION`);
  assert.equal(entry.productionRole, 'ARTICLE', `${entry.nodeCode}: ROLE`);
  assert.deepEqual(entry.requiredOutputs, ['ARTICLE'], `${entry.nodeCode}: OUTPUTS`);
  assert.equal(entry.dispatchTarget, 'PJA', `${entry.nodeCode}: DISPATCH`);
  assert.equal(entry.c2FreezeDecision, 'freeze_approved', `${entry.nodeCode}: C2`);
  assert.equal(entry.manuscriptMappingDecision, 'range_approved', `${entry.nodeCode}: MANUSCRIPT_MAPPING`);
  assert.equal(entry.productionActorRole, 'HUMAN_PRODUCTION_AUTHORITY');
  assert.equal(entry.editorialActorRole, 'HUMAN_EDITORIAL_AUTHORITY');
  assert.ok(entry.actor && !/^(AI|SYSTEM|CHATGPT|AUTOMATION)$/i.test(entry.actor));
}

assert.equal(reconciliation.status, 'SESSION_PROVIDER_CANDIDATES_STAGED_FOR_VAP_W8_VALIDATION');
assert.equal(reconciliation.candidateCount, 6);
assert.equal(reconciliation.provider.providerCode, 'openai_chatgpt_session');
assert.equal(reconciliation.provider.repositoryNetworkInvocation, false);
assert.equal(reconciliation.provider.existingVapW7NetworkProviderContractModified, false);
assert.equal(reconciliation.authorityBoundary.candidateAuthority, false);
assert.equal(reconciliation.authorityBoundary.humanReviewRequired, true);
assert.equal(reconciliation.authorityBoundary.automaticPjaImportAllowed, false);
assert.equal(reconciliation.authorityBoundary.publicationAllowed, false);

const decisionByNode = new Map(decisions.entries.map(entry => [entry.nodeCode, entry]));
for (const entry of reconciliation.entries) {
  const decision = decisionByNode.get(entry.nodeCode);
  assert.ok(decision, `${entry.nodeCode}: DECISION_MISSING`);
  assert.equal(entry.proposalContentHash, decision.proposalContentHash, `${entry.nodeCode}: PROPOSAL_HASH`);
  const candidateFile = path.join(root, entry.candidatePath);
  const generationFile = path.join(root, entry.generationRecordPath);
  assert.ok(fs.existsSync(candidateFile), `${entry.nodeCode}: CANDIDATE_MISSING`);
  assert.ok(fs.existsSync(generationFile), `${entry.nodeCode}: GENERATION_RECORD_MISSING`);
  const candidate = fs.readFileSync(candidateFile, 'utf8');
  assert.equal(digest(candidate), entry.candidateDigest, `${entry.nodeCode}: CANDIDATE_DIGEST`);
  assert.ok(candidate.startsWith(`# ${entry.titleZhHans}\n`), `${entry.nodeCode}: TITLE`);
  assert.ok(candidate.length >= 1200, `${entry.nodeCode}: CANDIDATE_TOO_SHORT`);
  assert.ok(!/<\s*(script|iframe|object|embed|style)\b/i.test(candidate), `${entry.nodeCode}: UNSAFE_HTML`);
  assert.ok(!/javascript\s*:/i.test(candidate), `${entry.nodeCode}: JAVASCRIPT_URL`);
  assert.ok(!/content\/knowledge\/|dist\/knowledge|sha256:|proposalContentHash|Human Production Decision/i.test(candidate), `${entry.nodeCode}: GOVERNANCE_LEAK`);
  const generation = readJson(entry.generationRecordPath);
  assert.equal(generation.candidateDigest, entry.candidateDigest);
  assert.equal(generation.candidateAuthority, false);
  assert.equal(generation.humanReviewRequired, true);
  assert.equal(generation.publicationAllowed, false);
  assert.equal(generation.repositoryNetworkCallMade, false);
  assert.equal(generation.controllingAuthority.proposalContentHash, decision.proposalContentHash);
}

console.log('✓ VAP-W7S Batch 001 governed session generation passed.');
console.log('✓ Six independent Human ARTICLE/C2/manuscript decisions are recorded.');
console.log('✓ Six zh-Hans Article candidates are staged and digest-bound to approved C2 proposals.');
console.log('✓ Session generation did not claim repository network execution or credential use.');
console.log('✓ Candidates remain non-authoritative, require Human review, and are not published/imported automatically.');
