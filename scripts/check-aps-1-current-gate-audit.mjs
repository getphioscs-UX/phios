import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const exists = (p) => fs.existsSync(path.join(root, p));

const BASELINE = '6932c8865c1a7d76ddaa2d402dc005dc370db788';
const BATCH = 'VAP-ARTICLE-BATCH-001';
const NODES = [
  'KN-B1-P1-006',
  'KN-B1-P2-001',
  'KN-B1-P2-009',
  'KN-B1-P3-005',
  'KN-B1-P3-015',
  'KN-B1-P4-006'
];

const contractPath = 'content/production/article-simplification/contracts/aps-1-current-gate-audit-contract-v1.json';
const auditPath = 'content/production/article-simplification/audits/aps-1-current-gate-audit-v1.json';
const eligibilityPath = 'content/production/visual-article/eligibility/vap-article-batch-001-execution-eligibility-v1.json';
const promotionPath = 'content/production/visual-article/promotion/vap-article-batch-001-candidate-promotion-v1.json';
const approvalPath = 'content/production/visual-article/decisions/vap-w10-batch-001-human-approval-decisions-v1.json';
const publicationDecisionPath = 'content/production/visual-article/decisions/vap-w11-batch-001-human-publication-decisions-v1.json';
const packageManifestPath = 'content/production/visual-article/packages/vap-article-batch-001-production-article-package-manifest-v1.json';
const publicationRegistryPath = 'content/knowledge/production/registry/publication-registry.json';

for (const p of [
  contractPath,
  auditPath,
  eligibilityPath,
  promotionPath,
  approvalPath,
  publicationDecisionPath,
  packageManifestPath,
  publicationRegistryPath,
  'content/production/car/contracts/car-production-activation-v1.json',
  'content/production/visual-article/contracts/vap-w20-canonical-article-visual-binding-v1.json',
  'content/production/visual-article/contracts/vap-w22-cpr-production-activation-v1.json',
  'scripts/check-published-article-format-reconciliation.mjs'
]) assert.equal(exists(p), true, `${p} must exist`);

const contract = readJson(contractPath);
const audit = readJson(auditPath);
assert.equal(contract.work, 'APS-1');
assert.equal(contract.status, 'ACTIVE_AUDIT_ONLY');
assert.equal(contract.baseline.commit, BASELINE);
assert.equal(contract.auditBoundary.auditOnly, true);
assert.equal(contract.auditBoundary.mayCreatePublicationAuthority, false);
assert.equal(contract.auditBoundary.mayAddArticleBatchCommand, false);
assert.equal(contract.auditBoundary.mayAddArticlePublishCommand, false);
assert.equal(audit.work, 'APS-1');
assert.equal(audit.status, 'CURRENT_GATE_AUDIT_COMPLETE');
assert.equal(audit.baselineCommit, BASELINE);
assert.equal(audit.currentGateChain.length, 24);
assert.equal(audit.commandAudit.articleBatchCommandPresentAtBaseline, false);
assert.equal(audit.commandAudit.articlePublishCommandPresentAtBaseline, false);
assert.equal(audit.aps1Conclusion.gateBypassRequiredForTargetExperience, false);
assert.equal(audit.aps1Conclusion.authorityModelCanBePreserved, true);

const eligibility = readJson(eligibilityPath);
assert.equal(eligibility.batchCode, BATCH);
assert.equal(eligibility.entries.length, 6);
for (const nodeCode of NODES) {
  const e = eligibility.entries.find((x) => x.nodeCode === nodeCode);
  assert.ok(e, `${nodeCode} must be present in W6A eligibility`);
  for (const key of [
    'articleIntent',
    'c2Frozen',
    'c3ProductionReady',
    'executionAuthorityValid',
    'humanEditorialC2Approved',
    'humanProductionDecisionApproved',
    'manuscriptMappingHumanVerified',
    'productionPlanFrozen',
    'productionWaveFrozen',
    'articleExecutionEligible'
  ]) assert.equal(e[key], true, `${nodeCode}.${key} must be true`);
}

const promotion = readJson(promotionPath);
assert.equal(promotion.entries.length, 6);
for (const nodeCode of NODES) {
  const e = promotion.entries.find((x) => x.nodeCode === nodeCode);
  assert.ok(e, `${nodeCode} promotion record missing`);
  assert.equal(e.reviewDecision, 'accept');
  assert.equal(e.promotionEligible, true);
}

const approvals = readJson(approvalPath);
assert.equal(approvals.entries.length, 6);
for (const nodeCode of NODES) {
  const e = approvals.entries.find((x) => x.nodeCode === nodeCode);
  assert.ok(e, `${nodeCode} approval decision missing`);
  assert.equal(e.decisionState, 'human_decided');
  assert.equal(e.decision, 'approve');
  assert.equal(e.approverCode, 'TL');
}

const packageManifest = readJson(packageManifestPath);
assert.equal(packageManifest.entries.length, 6);
assert.equal(packageManifest.entries.filter((x) => x.productionArticlePackageCreated === true).length, 6);

const publicationDecisions = readJson(publicationDecisionPath);
assert.equal(publicationDecisions.entries.length, 6);
assert.equal(publicationDecisions.entries.filter((x) => x.decision === 'publish').length, 0);
assert.equal(publicationDecisions.entries.filter((x) => x.decisionState === 'pending_human').length, 6);

const publicationRegistry = readJson(publicationRegistryPath);
const batchPublicationRecords = publicationRegistry.records.filter(
  (x) => NODES.includes(x.nodeCode) && x.locale === 'zh-Hans'
);
assert.equal(batchPublicationRecords.length, 0, 'Batch 001 must have no publication records at APS-1 baseline');

const snapshot = audit.referenceBatchSnapshot;
assert.deepEqual(snapshot.nodeCodes, NODES);
assert.equal(snapshot.selectedCount, 6);
assert.equal(snapshot.c2FrozenCount, 6);
assert.equal(snapshot.c3ProductionReadyCount, 6);
assert.equal(snapshot.humanProductionApprovedCount, 6);
assert.equal(snapshot.executionAuthorityValidCount, 6);
assert.equal(snapshot.humanEditorialAcceptedCount, 6);
assert.equal(snapshot.humanApprovalApprovedCount, 6);
assert.equal(snapshot.productionArticlePackageCount, 6);
assert.equal(snapshot.humanPublicationDecisionCount, 0);
assert.equal(snapshot.publicationRecordCount, 0);
assert.equal(snapshot.currentBlockingGate, 'HUMAN_PUBLICATION_DECISION');

const pkg = readJson('package.json');
const aps3SuccessorPresent = exists('content/production/article-simplification/contracts/aps-3-batch-orchestrator-contract-v1.json');
if (aps3SuccessorPresent) {
  assert.equal(pkg.scripts?.['article:batch'], 'node scripts/article-batch.mjs', 'APS-3 successor may expose article:batch without changing the APS-1 baseline audit');
} else {
  assert.equal(Boolean(pkg.scripts?.['article:batch']), false, 'APS-1 baseline must not prematurely expose article:batch');
}
assert.equal(Boolean(pkg.scripts?.['article:publish']), false, 'APS-1/APS-3 must not prematurely expose article:publish');

console.log('✓ APS-1 Current Gate Audit passed.');
console.log('✓ Baseline 6932c88 preserves the existing authority model and standardized published-article presentation.');
console.log('✓ Batch 001: 6/6 upstream-ready, 6/6 Human-reviewed, 6/6 Human-approved, 0/6 Human Publication Decisions.');
console.log('✓ 24 current gates/transitions are inventoried and classified without mutating any authority.');
console.log('✓ APS can simplify operator choreography without bypassing Canonical, Human, Publication, CAR, CPR or release authority.');
console.log('→ Next: APS-2 Single Readiness Contract.');
