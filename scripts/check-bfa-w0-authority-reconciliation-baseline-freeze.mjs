import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';

const root = process.cwd();
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const exists = (rel) => fs.existsSync(path.join(root, rel));
const digest = (rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, rel))).digest('hex');

const boundaryPath = 'content/production/bilingual-final-approval/contracts/bfa-authority-boundary-v1.json';
const mapPath = 'content/production/bilingual-final-approval/contracts/bfa-upstream-authority-map-v1.json';
const approvalPath = 'content/production/bilingual-final-approval/contracts/bfa-final-approval-authority-contract-v1.json';

for (const rel of [boundaryPath, mapPath, approvalPath]) assert.ok(exists(rel), `${rel} missing`);

const boundary = readJson(boundaryPath);
const authorityMap = readJson(mapPath);
const approval = readJson(approvalPath);

assert.equal(boundary.work, 'BFA-W0');
assert.equal(boundary.baselineCommit, 'dcfcc7685aa31c6af4a32e77022365a01847493b');
assert.equal(boundary.coreInvariant, 'SIMPLIFICATION_DOES_NOT_EQUAL_AUTHORITY_COLLAPSE');
assert.deepEqual(boundary.bfaOwns, ['FINAL_PUBLICATION_PACKAGE_REVIEW', 'FINAL_HUMAN_PUBLICATION_APPROVAL']);
for (const forbidden of [
  'CANONICAL_MEANING',
  'ARTICLE_GENERATION_AUTHORITY',
  'FIGURE_GENERATION_AUTHORITY',
  'CAR_APPROVAL_AUTHORITY',
  'CPR_PRESENTATION_AUTHORITY',
  'PUBLICATION_IMPLEMENTATION_AUTHORITY',
  'PJA_PUBLICATION_AUTHORITY',
  'PUBLISHED_KNOWLEDGE_AUTHORITY'
]) assert.ok(boundary.bfaDoesNotOwn.includes(forbidden), `BFA forbidden ownership missing: ${forbidden}`);

assert.equal(boundary.humanAuthority.authorityType, 'BILINGUAL_FINAL_PUBLICATION_APPROVAL');
assert.equal(boundary.humanAuthority.reviewerCode, 'TL');
assert.equal(boundary.humanAuthority.oneExplicitFinalDecisionRequired, true);
assert.equal(boundary.humanAuthority.automaticEvidenceMayCreateHumanApproval, false);
assert.equal(boundary.humanAuthority.automaticPassMayCreateHumanApproval, false);
assert.equal(boundary.humanAuthority.finalApprovalEqualsPublicationExecution, false);
assert.equal(boundary.humanAuthority.finalApprovalMustBindExactFinalPackageDigest, true);
assert.equal(boundary.successorScope.historicalBatchModel, 'BATCH-001');
assert.equal(boundary.successorScope.historicalModelRemainsValid, true);
assert.equal(boundary.successorScope.successorAppliesFrom, 'BATCH-002');
assert.equal(boundary.successorScope.fakeHumanDecisionSynthesisAllowed, false);
assert.equal(boundary.successorScope.authorityBridgeImplementationWork, 'BFA-W16');
assert.equal(boundary.baselineObservation.bfaMayRepairOrRebaseThisDrift, false);

assert.equal(authorityMap.work, 'BFA-W0');
assert.equal(authorityMap.baselineCommit, boundary.baselineCommit);
assert.ok(authorityMap.authorities.length >= 12, 'BFA upstream authority map incomplete');
for (const entry of authorityMap.authorities) {
  const rel = entry.contractPath || entry.freezePath || entry.registryPath;
  assert.ok(rel, `No source path for ${entry.authority}`);
  assert.ok(exists(rel), `Upstream authority source missing: ${rel}`);
  assert.match(entry.baselineSourceDigest, /^[a-f0-9]{64}$/, `Missing baseline source digest for ${entry.authority}`);
  assert.equal(digest(rel), entry.baselineSourceDigest, `Upstream authority source drifted: ${entry.authority}`);
  if (entry.contractRoot) assert.ok(exists(entry.contractRoot), `Contract root missing: ${entry.contractRoot}`);
  if (entry.schemaPath) assert.ok(exists(entry.schemaPath), `Schema path missing: ${entry.schemaPath}`);
  if (entry.freezePath) assert.ok(exists(entry.freezePath), `Freeze path missing: ${entry.freezePath}`);
}
assert.equal(authorityMap.freezeRules.bfaMayMutateReferencedContracts, false);
assert.equal(authorityMap.freezeRules.bfaMayInferMissingAuthority, false);
assert.equal(authorityMap.freezeRules.bfaMayConvertAutomaticEvidenceToHumanAuthority, false);
assert.equal(authorityMap.freezeRules.bfaMayConvertFinalApprovalDirectlyToPublishedKnowledge, false);
assert.equal(authorityMap.freezeRules.bfaMayConvertFinalApprovalDirectlyToCarApproval, false);
assert.equal(authorityMap.freezeRules.bfaMayConvertFinalApprovalDirectlyToCprAuthority, false);

// Reconcile the existing authority facts rather than replacing them.
const pjaReview = readJson('content/knowledge/production/contracts/human-review-contract.json');
const pjaApproval = readJson('content/knowledge/production/contracts/human-approval-contract.json');
const pjaPublication = readJson('content/knowledge/production/contracts/publication-contract.json');
const publishedKnowledge = readJson('content/knowledge/production/contracts/published-knowledge-authority-v1.json');
const aps6 = readJson('content/production/article-simplification/contracts/aps-6-human-decision-bridge-contract-v1.json');
const aps7 = readJson('content/production/article-simplification/contracts/aps-7-one-command-publication-contract-v1.json');
const abl4 = readJson('content/production/article-simplification/bilingual/contracts/abl-4-bilingual-human-review-contract-v1.json');
const abl5 = readJson('content/production/article-simplification/bilingual/contracts/abl-5-same-route-publication-contract-v1.json');
const vapL10n = readJson('content/production/visual-article/l10n/contracts/vap-l10n-r1-r5-english-successor-v1.json');
const apsL10n = readJson('content/production/article-simplification/contracts/aps-l10n-same-route-locale-release-contract-v1.json');

assert.equal(pjaReview.boundaries.reviewDoesNotImplyApproval, true);
assert.equal(pjaReview.boundaries.reviewDoesNotImplyPublication, true);
assert.equal(pjaApproval.boundaries.approvalDoesNotImplyPublication, true);
assert.equal(pjaPublication.boundaries.approvalDoesNotImplyPublication, true);
assert.equal(pjaPublication.boundaries.publicationDoesNotImplyPublicRuntimeProjection, true);
assert.equal(publishedKnowledge.policy.publicationPackageEqualsPublicProjection, false);
assert.equal(aps6.bridge.bulkPublicationAuthorityAllowed, false);
assert.equal(aps6.governance.aps6MayInferPublish, false);
assert.equal(aps7.governance.articlePublishMayInferHumanDecision, false);
assert.equal(aps7.governance.publicationDoesNotEqualCarAuthority, true);
assert.equal(aps7.governance.publicationDoesNotEqualCprAuthority, true);
assert.equal(abl4.rules.englishReviewMustBeExplicit, true);
assert.equal(abl4.rules.englishApprovalMustFollowAcceptedEnglishReview, true);
assert.equal(abl4.rules.englishPublicationDecisionMustFollowApprovedEnglishArticle, true);
assert.equal(abl5.rules.explicitTlEnglishPublicationDecisionRequired, true);
assert.equal(vapL10n.authorityBoundaries.carOwnsFigurePublication, true);
assert.equal(vapL10n.authorityBoundaries.cprOwnsPresentation, true);
assert.equal(vapL10n.authorityBoundaries.runtimeChoosesLocale, true);
assert.equal(apsL10n.sameRouteRules.onePhysicalHtmlRouteRequired, true);
assert.equal(apsL10n.projectionAuthority.apsRole, 'orchestrate_existing_authorities_without_absorbing_them');

assert.equal(approval.work, 'BFA-W0');
assert.equal(approval.status, 'CONTRACT_ONLY_NO_DECISION_CREATED');
assert.equal(approval.authorityType, 'BILINGUAL_FINAL_PUBLICATION_APPROVAL');
assert.equal(approval.authorityOwner, 'TL');
assert.deepEqual(approval.allowedDecisions, ['approve_for_publication', 'revise', 'defer', 'do_not_publish']);
assert.equal(approval.boundaries.automaticEvidenceEqualsHumanApproval, false);
assert.equal(approval.boundaries.automaticPassEqualsHumanApproval, false);
assert.equal(approval.boundaries.carApprovalEqualsBfaFinalApproval, false);
assert.equal(approval.boundaries.bfaFinalApprovalEqualsPublicationExecution, false);
assert.equal(approval.downstreamTransitionContract.implementedAt, 'BFA-W16');
assert.equal(approval.downstreamTransitionContract.mayProduceMultipleHumanDecisions, false);
assert.equal(approval.downstreamTransitionContract.transitionRecordsAreHumanEvidence, false);
assert.equal(approval.staleness.exactDigestBindingRequired, true);
assert.equal(approval.staleness.changedPackageInvalidatesPriorApproval, true);

console.log('✓ BFA-W0 Authority Reconciliation & Baseline Freeze passed.');
console.log('✓ Canonical Knowledge, PJA, CAR, CPR, Published Knowledge and Publication Runtime remain separate authorities.');
console.log('✓ BATCH-001 APS/ABL Human authority remains historical and reproducible; BATCH-002+ is successor-scoped only.');
console.log('✓ BFA owns only Complete Package final review + TL Final Publication Approval; it creates no second PJA/CAR/CPR/Publication authority.');
console.log('✓ One explicit TL Final Approval may later govern multiple BFA-W16 transitions, but no fake Review/Approval/Publication Human decisions are synthesized.');
console.log('⚠ Pre-existing CPR public-assets freeze drift is recorded as upstream-only and is not repaired or rebased by BFA.');
