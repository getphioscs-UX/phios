import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  VAP_W10_EXPECTED_NODE_CODES,
  VAP_W10_PATHS,
  buildVapW10ApprovalQueue,
  buildPendingApprovalDecisionEnvelope,
  validateApprovalDecisionEnvelope,
  validateFrozenApprovalQueueLineage,
  validateProductionArticlePackage,
  applyVapW10
} from './lib/visual-article-production/human-approval-production-article-package-v1.mjs';
import { validateHumanApproval } from './lib/knowledge-production/human-approval-v1.mjs';
import { serialize } from './lib/knowledge-production/canonical-brief-v2.mjs';

const root = process.cwd();
const readJson = async rel => JSON.parse(await fs.readFile(path.join(root, rel), 'utf8'));
const fileExists = rel => fs.access(path.join(root, rel)).then(() => true, () => false);
const [contract, policy, decisionSchema, packageSchema, queue, decisions, packageManifest, activation, approvalContract, approvalRegistry, publicationRegistry] = await Promise.all([
  readJson('content/production/visual-article/contracts/vap-w10-human-approval-production-article-package-v1.json'),
  readJson('content/production/visual-article/policies/vap-w10-human-approval-production-article-package-policy-v1.json'),
  readJson('content/production/visual-article/schemas/vap-w10-human-approval-decisions-v1.schema.json'),
  readJson('content/production/visual-article/schemas/vap-w10-production-article-package-v1.schema.json'),
  readJson(VAP_W10_PATHS.approvalQueue), readJson(VAP_W10_PATHS.decisions), readJson(VAP_W10_PATHS.packageManifest), readJson(VAP_W10_PATHS.activation),
  readJson('content/knowledge/production/contracts/human-approval-contract.json'), readJson(VAP_W10_PATHS.pjaApprovalRegistry), readJson(VAP_W10_PATHS.pjaPublicationRegistry)
]);

assert.equal(contract.work, 'VAP-W10'); assert.equal(contract.implementationBaselineCommit, '57bccb6d6f9fc6aca054b4261e854f04758ec0e3');
assert.equal(contract.existingPjaRuntimeReuse.humanApprovalRuntime, 'scripts/lib/knowledge-production/human-approval-v1.mjs');
assert.equal(contract.existingPjaRuntimeReuse.secondHumanApprovalRuntimeAllowed, false);
assert.equal(contract.humanApprovalGate.oneIndependentDecisionPerNode, true); assert.equal(contract.humanApprovalGate.bulkEnvelopeIsNotBulkApprovalDecision, true);
assert.equal(contract.productionArticlePackage.createdOnlyForApprove, true); assert.equal(contract.productionArticlePackage.articleBodyMutationAllowed, false); assert.equal(contract.productionArticlePackage.packageIsPublication, false); assert.equal(contract.productionArticlePackage.publicProjectionAllowed, false);
assert(contract.prohibited.includes('fabricate_human_approval')); assert(contract.prohibited.includes('treat_human_editorial_accept_as_human_approval')); assert(contract.prohibited.includes('publish'));
assert.equal(policy.expectedCandidateCount, 6); assert.equal(policy.approvalAuthority, 'TL Human Approval Authority'); assert.equal(policy.bulkApprovalAllowed, false); assert.equal(policy.approvalEqualsPublication, false); assert.equal(policy.productionPackageEqualsPublication, false);
assert.equal(approvalContract.outputAuthority, 'approval_only'); assert.equal(approvalContract.boundaries.approvalDoesNotImplyPublication, true); assert.equal(approvalContract.boundaries.publicationRequiresSeparateRuntime, true); assert(approvalContract.prohibitedOperations.includes('publish'));
assert.equal(decisionSchema.properties.entries.minItems, 6); assert.equal(decisionSchema.properties.entries.maxItems, 6); assert.deepEqual(decisionSchema.properties.entries.items.properties.decision.enum, ['approve','decline','defer',null]);
assert.equal(packageSchema.properties.packageState.const, 'human_approved_not_published'); assert.equal(packageSchema.properties.articlePackageContract.const, 'PHI-OS-PJA-R4E-ARTICLE-PACKAGE-v2.0.0');

const rebuiltQueue = await buildVapW10ApprovalQueue(root);
const frozenQueueLineage = validateFrozenApprovalQueueLineage(queue, rebuiltQueue); assert.equal(frozenQueueLineage.valid, true, JSON.stringify(frozenQueueLineage.errors));
assert.equal(queue.entries.length, 6); assert.equal(queue.status, 'AWAITING_EXPLICIT_HUMAN_APPROVAL'); assert.equal(queue.approvalAuthority, 'TL Human Approval Authority'); assert.equal(queue.approvalIsPublication, false); assert.equal(queue.productionArticlePackageIsPublication, false);
const realHumanApprovalsApplied = decisions.entries.every(entry => entry.decisionState === 'human_decided' && entry.decision === 'approve' && entry.approverCode === 'TL' && entry.approverAuthority === 'TL Human Approval Authority');
const decisionValidation = validateApprovalDecisionEnvelope(decisions, queue, { requireAllDecided: realHumanApprovalsApplied }); assert.equal(decisionValidation.valid, true, JSON.stringify(decisionValidation.errors));

if (realHumanApprovalsApplied) {
  assert.equal(decisions.status, 'HUMAN_APPROVAL_DECISIONS_RECORDED');
  assert.equal(rebuiltQueue.status, 'HUMAN_APPROVALS_ALREADY_RECORDED');
  assert.equal(packageManifest.status, 'SIX_HUMAN_APPROVED_PRODUCTION_ARTICLE_PACKAGES_READY_FOR_PUBLICATION_GOVERNANCE');
  assert.equal(packageManifest.humanApprovalDecisionCount, 6); assert.equal(packageManifest.approvedCount, 6); assert.equal(packageManifest.productionArticlePackageCount, 6); assert.equal(packageManifest.publicationCount, 0);
  assert.equal(activation.status, packageManifest.status); assert.equal(activation.approvalEligibleCount, 6); assert.equal(activation.humanApprovalDecisionCount, 6); assert.equal(activation.humanApprovedCount, 6); assert.equal(activation.productionArticlePackageCount, 6); assert.equal(activation.publicationCount, 0);
  for (const nodeCode of VAP_W10_EXPECTED_NODE_CODES) {
    const frozen = queue.entries.find(item => item.nodeCode === nodeCode); const current = rebuiltQueue.entries.find(item => item.nodeCode === nodeCode); assert(frozen); assert(current);
    assert.equal(frozen.humanApprovalState, 'pending_human'); assert.equal(frozen.productionArticlePackageState, 'blocked_pending_human_approval');
    assert.equal(current.humanApprovalState, 'already_recorded'); assert.equal(current.productionArticlePackageState, 'package_build_required');
    const candidate = await readJson(`content/knowledge/production/candidates/zh-Hans/${nodeCode}/candidate.v1.json`); const review = await readJson(`content/knowledge/production/reviews/zh-Hans/${nodeCode}/review.v1.json`);
    const approval = await readJson(`content/knowledge/production/approvals/zh-Hans/${nodeCode}/approval.v1.json`); const approvalValid = validateHumanApproval(approval, candidate, review); assert.equal(approvalValid.valid, true, `${nodeCode}:${JSON.stringify(approvalValid.errors)}`); assert.equal(approval.decision, 'approve'); assert.equal(approval.approver.approverCode, 'TL'); assert.equal(approval.authority.publication, 'not_published');
    const approvalRecord = approvalRegistry.records.find(record => record.approvalCode === approval.approvalCode); assert(approvalRecord, `${nodeCode}:APPROVAL_REGISTRY_RECORD_REQUIRED`); assert.equal(approvalRecord.approvalDigest, approval.approvalDigest);
    const body = await fs.readFile(path.join(root, `content/production/visual-article/packages/zh-Hans/${nodeCode}/article.md`), 'utf8'); assert.equal(body, candidate.article.bodyMarkdown, `${nodeCode}:ARTICLE_BODY_MUST_BE_BYTE_EQUIVALENT_TO_CANDIDATE`);
    const productionPackage = await readJson(`content/production/visual-article/packages/zh-Hans/${nodeCode}/production-article-package.v1.json`); const packageValid = validateProductionArticlePackage(productionPackage, { candidate, review, approval, articleBody: body }); assert.equal(packageValid.valid, true, `${nodeCode}:${JSON.stringify(packageValid.errors)}`);
    assert.equal(productionPackage.authority.publicationRecorded, false); assert.equal(productionPackage.governance.publicProjectionAllowed, false);
    assert.equal(publicationRegistry.records.some(record => record.nodeCode === nodeCode && record.locale === 'zh-Hans'), false, `${nodeCode}:PUBLICATION_MUST_NOT_EXIST`);
  }
  const projected = await applyVapW10(root, decisions, { apply: false }); assert.equal(serialize(projected.packageManifest), serialize(packageManifest), 'VAP_W10_RESOLVED_PACKAGE_MANIFEST_NOT_DETERMINISTIC');
  assert.equal(projected.activation.humanApprovedCount, 6); assert.equal(projected.activation.productionArticlePackageCount, 6); assert.equal(projected.activation.publicationCount, 0);
} else {
  assert.equal(decisions.status, 'PENDING_HUMAN_APPROVAL'); assert(decisions.entries.every(entry => entry.decisionState === 'pending_human' && entry.decision === null && entry.approverCode === null));
  for (const nodeCode of VAP_W10_EXPECTED_NODE_CODES) {
    const q = queue.entries.find(item => item.nodeCode === nodeCode); assert(q); assert.equal(q.humanApprovalState, 'pending_human'); assert.equal(q.productionArticlePackageState, 'blocked_pending_human_approval');
    assert.equal(approvalRegistry.records.some(record => record.nodeCode === nodeCode && record.locale === 'zh-Hans'), false, `${nodeCode}:APPROVAL_MUST_NOT_BE_FABRICATED`);
    assert.equal(await fileExists(`content/production/visual-article/packages/zh-Hans/${nodeCode}/production-article-package.v1.json`), false, `${nodeCode}:PACKAGE_REQUIRES_HUMAN_APPROVAL`);
  }
  const required = validateApprovalDecisionEnvelope(decisions, queue, { requireAllDecided: true }); assert.equal(required.valid, false); assert.equal(required.errors.filter(error => error.code === 'VAP_W10_EXPLICIT_HUMAN_APPROVAL_REQUIRED').length, 6);
  await assert.rejects(() => applyVapW10(root, decisions, { apply: false }), /VAP_W10_HUMAN_APPROVAL_DECISIONS_INVALID/);
  assert.equal(packageManifest.status, 'AWAITING_EXPLICIT_HUMAN_APPROVAL'); assert.equal(packageManifest.humanApprovalDecisionCount, 0); assert.equal(packageManifest.productionArticlePackageCount, 0); assert.equal(packageManifest.publicationCount, 0);
  assert.equal(activation.status, 'AWAITING_EXPLICIT_HUMAN_APPROVAL'); assert.equal(activation.humanApprovalDecisionCount, 0); assert.equal(activation.humanApprovedCount, 0); assert.equal(activation.productionArticlePackageCount, 0); assert.equal(activation.publicationCount, 0);
}

const makeApproveEnvelope = () => {
  const envelope = structuredClone(buildPendingApprovalDecisionEnvelope(queue)); envelope.status = 'HUMAN_APPROVAL_DECISIONS_RECORDED';
  for (const entry of envelope.entries) { entry.decisionState = 'human_decided'; entry.decision = 'approve'; entry.approverCode = 'TL'; entry.approverAuthority = 'TL Human Approval Authority'; entry.approvedAt = '2026-08-11T08:25:00.000Z'; entry.summary = 'Fixture: accepted Candidate is independently approved for governed Production Article Package handoff.'; }
  return envelope;
};
const approvedEnvelope = makeApproveEnvelope(); const approvedValidation = validateApprovalDecisionEnvelope(approvedEnvelope, queue, { requireAllDecided: true }); assert.equal(approvedValidation.valid, true, JSON.stringify(approvedValidation.errors));
const fixtureApprovalRegistry = { ...approvalRegistry, records: approvalRegistry.records.filter(record => !(VAP_W10_EXPECTED_NODE_CODES.includes(record.nodeCode) && record.locale === 'zh-Hans')) };
const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'vap-w10-approve-')); await fs.mkdir(path.join(temp, 'content/knowledge/production/registry'), { recursive: true }); await fs.writeFile(path.join(temp, VAP_W10_PATHS.pjaApprovalRegistry), serialize(fixtureApprovalRegistry));
const applied = await applyVapW10(root, approvedEnvelope, { apply: true, targetRoot: temp }); assert.equal(applied.activation.humanApprovalDecisionCount, 6); assert.equal(applied.activation.humanApprovedCount, 6); assert.equal(applied.activation.productionArticlePackageCount, 6); assert.equal(applied.activation.publicationCount, 0); assert.equal(applied.packageManifest.status, 'SIX_HUMAN_APPROVED_PRODUCTION_ARTICLE_PACKAGES_READY_FOR_PUBLICATION_GOVERNANCE');
const tempApprovalRegistry = JSON.parse(await fs.readFile(path.join(temp, VAP_W10_PATHS.pjaApprovalRegistry), 'utf8')); assert.equal(tempApprovalRegistry.records.length, fixtureApprovalRegistry.records.length + 6);
for (const nodeCode of VAP_W10_EXPECTED_NODE_CODES) {
  const candidate = await readJson(`content/knowledge/production/candidates/zh-Hans/${nodeCode}/candidate.v1.json`); const review = await readJson(`content/knowledge/production/reviews/zh-Hans/${nodeCode}/review.v1.json`);
  const approval = JSON.parse(await fs.readFile(path.join(temp, `content/knowledge/production/approvals/zh-Hans/${nodeCode}/approval.v1.json`), 'utf8')); const approvalValid = validateHumanApproval(approval, candidate, review); assert.equal(approvalValid.valid, true, `${nodeCode}:${JSON.stringify(approvalValid.errors)}`); assert.equal(approval.decision, 'approve'); assert.equal(approval.authority.publication, 'not_published');
  const body = await fs.readFile(path.join(temp, `content/production/visual-article/packages/zh-Hans/${nodeCode}/article.md`), 'utf8'); assert.equal(body, candidate.article.bodyMarkdown, `${nodeCode}:ARTICLE_BODY_MUST_BE_BYTE_EQUIVALENT_TO_CANDIDATE`);
  const productionPackage = JSON.parse(await fs.readFile(path.join(temp, `content/production/visual-article/packages/zh-Hans/${nodeCode}/production-article-package.v1.json`), 'utf8')); const packageValid = validateProductionArticlePackage(productionPackage, { candidate, review, approval, articleBody: body }); assert.equal(packageValid.valid, true, `${nodeCode}:${JSON.stringify(packageValid.errors)}`); assert.equal(productionPackage.binding.publicationBookCode, 'BOOK-1'); assert.equal(productionPackage.binding.publicationPartCode, `P${nodeCode.match(/-P(\d+)-/)[1]}`); assert.equal(productionPackage.authority.publicationRecorded, false); assert.equal(productionPackage.governance.publicProjectionAllowed, false);
}

// Decline/defer may record a Human Approval decision but cannot create a Production Article Package.
const mixed = makeApproveEnvelope(); const declinedNode = 'KN-B1-P2-009'; mixed.entries.find(entry => entry.nodeCode === declinedNode).decision = 'decline'; mixed.entries.find(entry => entry.nodeCode === declinedNode).summary = 'Fixture decline.';
const tempMixed = await fs.mkdtemp(path.join(os.tmpdir(), 'vap-w10-mixed-')); await fs.mkdir(path.join(tempMixed, 'content/knowledge/production/registry'), { recursive: true }); await fs.writeFile(path.join(tempMixed, VAP_W10_PATHS.pjaApprovalRegistry), serialize(fixtureApprovalRegistry));
const mixedApplied = await applyVapW10(root, mixed, { apply: true, targetRoot: tempMixed }); assert.equal(mixedApplied.activation.humanApprovedCount, 5); assert.equal(mixedApplied.activation.productionArticlePackageCount, 5); assert.equal(await fs.access(path.join(tempMixed, `content/production/visual-article/packages/zh-Hans/${declinedNode}/production-article-package.v1.json`)).then(() => true, () => false), false);

// AI/System cannot satisfy TL Human Approval authority.
const invalid = makeApproveEnvelope(); invalid.entries[0].approverCode = 'ChatGPT'; invalid.entries[0].approverAuthority = 'AI'; assert.equal(validateApprovalDecisionEnvelope(invalid, queue, { requireAllDecided: true }).valid, false);
const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8')); assert.equal(pkg.scripts['build:vap-w10'], 'node scripts/build-vap-w10-human-approval-production-article-package.mjs'); assert.equal(pkg.scripts['vap:w10:apply'], 'node scripts/apply-vap-w10-human-approval-production-article-package.mjs --apply'); assert.equal(pkg.scripts['check:vap-w10'], 'node scripts/check-vap-w10-human-approval-production-article-package.mjs'); assert(pkg.scripts['check:vap-b'].endsWith('&& npm run check:vap-w10'));

console.log('✓ VAP-W10 Human Approval & Production Article Package passed.');
console.log(realHumanApprovalsApplied ? '✓ Real Batch 001 has 6/6 independent TL Human Approvals and 6/6 immutable Production Article Packages.' : '✓ Real Batch 001 has 6/6 accepted Human Reviews promoted to Approval Eligibility, with 0 Human Approvals and 0 Production Article Packages until explicit TL approval.');
console.log('✓ Existing PJA Human Approval Runtime is reused; Human Editorial acceptance is not treated as Human Approval.');
console.log('✓ Positive fixture proves 6 explicit TL approve decisions create 6 valid PJA Approval packages and 6 immutable Production Article Packages.');
console.log('✓ Production Article Package body is byte-equivalent to the Human-reviewed Candidate and carries PJA-R4E Article Package v2 publication binding.');
console.log('✓ Approval and Production Article Package remain non-publication authority; Publication Registry and public projection are untouched.');
