import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  VAP_W8_ACTIVATION,
  VAP_W8_BASELINE,
  VAP_W8_BATCH,
  VAP_W8_CONTRACT,
  VAP_W8_IMPORT,
  VAP_W8_LOCALE,
  VAP_W8_POLICY,
  VAP_W8_SESSION,
  VAP_W8_VALIDATION,
  buildVapW8Activation,
  buildVapW8Plan,
  stableJson,
  textDigest,
  validationProjection
} from './lib/visual-article-production/candidate-validation-pja-import-v1.mjs';
import { importZhHansCandidate, validateZhHansCandidate } from './lib/knowledge-production/zh-hans-candidate-v1.mjs';

const root = process.cwd();
const read = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const readText = relative => fs.readFileSync(path.join(root, relative), 'utf8').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const sha256 = source => crypto.createHash('sha256').update(source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'), 'utf8').digest('hex');
const scalarDiffs = (actual, expected, at = '') => {
  if (Object.is(actual, expected)) return [];
  if (Array.isArray(actual) && Array.isArray(expected)) {
    return Array.from({ length: Math.max(actual.length, expected.length) }, (_, index) =>
      scalarDiffs(actual[index], expected[index], `${at}[${index}]`)
    ).flat();
  }
  if (actual && expected && typeof actual === 'object' && typeof expected === 'object') {
    return [...new Set([...Object.keys(actual), ...Object.keys(expected)])]
      .flatMap(key => scalarDiffs(actual[key], expected[key], at ? `${at}.${key}` : key));
  }
  return [{ path: at, actual, expected }];
};
const nodeCodes = ['KN-B1-P1-006', 'KN-B1-P2-001', 'KN-B1-P2-009', 'KN-B1-P3-005', 'KN-B1-P3-015', 'KN-B1-P4-006'];

const contract = read(VAP_W8_CONTRACT);
const policy = read(VAP_W8_POLICY);
const validation = read(VAP_W8_VALIDATION);
const importManifest = read(VAP_W8_IMPORT);
const activation = read(VAP_W8_ACTIVATION);
const session = read(VAP_W8_SESSION);

assert.equal(contract.contractCode, 'PHI-OS-VAP-W8-CANDIDATE-VALIDATION-PJA-IMPORT-v1');
assert.equal(contract.implementationBaselineCommit, VAP_W8_BASELINE);
assert.equal(contract.validationGate.anyBlockingFindingPreventsImport, true);
assert.equal(contract.validationGate.approvedC2ToPjaCanonicalBriefV2EquivalenceRequired, true);
assert.equal(contract.pjaImportBridge.existingPjaImporterMustBeReused, true);
assert.equal(contract.pjaImportBridge.secondPjaCandidateImporterForbidden, true);
assert.equal(contract.pjaImportBridge.generationBriefMayBeFalselyRelabeledAsCanonicalBriefV2, false);
assert.equal(contract.pjaImportBridge.providerWasNotClaimedToHaveUsedCanonicalBriefV2, true);
assert.equal(contract.authorityBoundary.providerCandidateAuthority, false);
assert.equal(contract.authorityBoundary.pjaImportedCandidateAuthority, 'candidate_only');
assert.equal(contract.authorityBoundary.humanEditorialReviewRequired, true);
assert.equal(contract.authorityBoundary.candidateImportEqualsHumanReview, false);
assert.equal(contract.authorityBoundary.candidateImportEqualsApproval, false);
assert.equal(contract.authorityBoundary.candidateImportEqualsPublication, false);
assert.equal(contract.authorityBoundary.canonicalKnowledgeMutationAllowed, false);
assert.equal(contract.authorityBoundary.publicationAllowed, false);

assert.equal(policy.expectedCandidateCount, 6);
assert.equal(policy.locale, VAP_W8_LOCALE);
assert.equal(policy.canonicalThesisBigramCoverageMinimum, 0.45);
assert.equal(policy.mustEstablishBigramCoverageMinimumPerStatement, 0.25);
assert.equal(policy.requiredDistinctionLexicalCoverageBlocking, false);
assert.equal(policy.externalFactIndicatorsBlocking, false);
assert.equal(policy.factualTruthAutomatedValidation, false);
assert.equal(policy.sourceTruthAutomatedValidation, false);
assert.equal(policy.candidateStateAfterImport, 'ready_for_human_review');
assert.equal(policy.candidateRegistryMutationAllowed, false);
assert.equal(policy.approvalRecordCreationAllowed, false);
assert.equal(policy.publicationAllowed, false);

const rebuiltPlan = await buildVapW8Plan(root);
const rebuiltValidation = validationProjection(rebuiltPlan);
const rebuiltActivation = await buildVapW8Activation(root);
const validationDiffs = scalarDiffs(rebuiltValidation, validation);
const activationDiffs = scalarDiffs(rebuiltActivation, activation);
if (validationDiffs.length || activationDiffs.length) {
  const reconciliation = read('content/production/visual-article/reconciliation/vap-w8-post-successor-determinism-v1.json');
  assert.equal(reconciliation.status, 'ACCEPTED_SUCCESSOR_COMPATIBILITY');
  assert.equal(
    sha256(readText(reconciliation.historicalAuthority.validation.path)),
    reconciliation.historicalAuthority.validation.sha256
  );
  assert.equal(
    sha256(readText(reconciliation.historicalAuthority.activation.path)),
    reconciliation.historicalAuthority.activation.sha256
  );
  assert.equal(sha256(stableJson(rebuiltValidation)), reconciliation.currentRebuild.validationSha256);
  assert.equal(sha256(stableJson(rebuiltActivation)), reconciliation.currentRebuild.activationSha256);
  assert.equal(validationDiffs.length, reconciliation.currentRebuild.allowedValidationScalarDifferenceCount);
  assert.equal(activationDiffs.length, reconciliation.currentRebuild.allowedActivationScalarDifferenceCount);
  assert(validationDiffs.every(diff =>
    /^entries\[\d+\]\.pjaImportBridge\.canonicalBriefDigest$/.test(diff.path) ||
    /^entries\[\d+\]\.pjaCandidate\.(candidateDigest|sourceBriefDigest)$/.test(diff.path)
  ));
  assert(activationDiffs.every(diff => /^entries\[\d+\]\.candidateDigest$/.test(diff.path)));
  for (const successor of reconciliation.successorAuthorities) {
    assert.equal(sha256(readText(successor.path)), successor.sha256, successor.path);
  }
  assert.equal(reconciliation.historicalAuthority.validation.rewritten, false);
  assert.equal(reconciliation.historicalAuthority.activation.rewritten, false);
  assert.equal(reconciliation.authorityBoundary.currentRebuildDigestMayReplaceHistoricalDigest, false);
} else {
  assert.equal(stableJson(rebuiltValidation), stableJson(validation), 'VAP-W8 validation projection must rebuild deterministically.');
  assert.equal(stableJson(rebuiltActivation), stableJson(activation), 'VAP-W8 activation must rebuild deterministically.');
}

assert.equal(validation.status, 'ALL_PROVIDER_CANDIDATES_VALID_FOR_PJA_IMPORT');
assert.equal(validation.batchCode, VAP_W8_BATCH);
assert.equal(validation.locale, VAP_W8_LOCALE);
assert.equal(validation.summary.providerCandidateCount, 6);
assert.equal(validation.summary.validationPassedCount, 6);
assert.equal(validation.summary.validationBlockedCount, 0);
assert.equal(validation.summary.pjaSchemaCompatibleCount, 6);
assert.equal(validation.summary.semanticHumanReviewRequiredCount, 6);
assert.equal(validation.summary.pjaImportPresentCount, 6);
assert.deepEqual(validation.entries.map(entry => entry.nodeCode), nodeCodes);

assert.equal(importManifest.status, 'PJA_CANDIDATE_IMPORT_COMPLETE');
assert.equal(importManifest.mode, 'apply');
assert.equal(importManifest.importedOrEquivalentCount, 6);
assert.ok([0, 6].includes(importManifest.newlyAppliedCount), 'W8 import manifest may represent the initial 6-file apply or an idempotent 0-new-file re-run.');
assert.equal(importManifest.candidateAuthority, false);
assert.equal(importManifest.humanReviewRequired, true);
assert.equal(importManifest.approvalRecorded, false);
assert.equal(importManifest.publicationRecorded, false);
assert.equal(importManifest.candidateRegistryMutated, false);
assert.equal(importManifest.canonicalRegistryMutated, false);

assert.equal(activation.status, 'BATCH_001_CANDIDATES_VALIDATED_AND_IMPORTED_AWAITING_HUMAN_EDITORIAL_REVIEW');
assert.equal(activation.validationPassedCount, 6);
assert.equal(activation.pjaImportedCount, 6);
assert.equal(activation.humanEditorialReviewCount, 0);
assert.equal(activation.editorialApprovalCount, 0);
assert.equal(activation.publicationCount, 0);
assert.equal(activation.nextWork, 'VAP-W9_HUMAN_EDITORIAL_REVIEW_AND_CANDIDATE_PROMOTION');

const sessionByNode = new Map(session.entries.map(entry => [entry.nodeCode, entry]));
const validationByNode = new Map(validation.entries.map(entry => [entry.nodeCode, entry]));
const rebuiltPlanByNode = new Map(rebuiltPlan.entries.map(entry => [entry.nodeCode, entry]));
const importByNode = new Map(importManifest.results.map(entry => [entry.nodeCode, entry]));
for (const nodeCode of nodeCodes) {
  const validated = validationByNode.get(nodeCode);
  const sessionEntry = sessionByNode.get(nodeCode);
  const imported = importByNode.get(nodeCode);
  assert(validated && sessionEntry && imported, `${nodeCode}: W8_LINEAGE_RECORD_MISSING`);
  assert.equal(validated.importEligible, true, `${nodeCode}: IMPORT_ELIGIBLE`);
  assert.deepEqual(validated.blockers, [], `${nodeCode}: VALIDATION_BLOCKERS`);
  assert.equal(validated.automatedValidation.integrityPassed, true, `${nodeCode}: INTEGRITY`);
  assert.equal(validated.automatedValidation.publicBodySafetyPassed, true, `${nodeCode}: PUBLIC_BODY_SAFETY`);
  assert.equal(validated.automatedValidation.titlePassed, true, `${nodeCode}: TITLE`);
  assert.ok(validated.automatedValidation.thesisCoverage >= policy.canonicalThesisBigramCoverageMinimum, `${nodeCode}: THESIS_COVERAGE`);
  for (const requirement of validated.automatedValidation.mustEstablishCoverage) {
    assert.ok(requirement.coverage >= policy.mustEstablishBigramCoverageMinimumPerStatement, `${nodeCode}: MUST_ESTABLISH_COVERAGE`);
  }
  assert.equal(validated.automatedValidation.semanticHumanReviewStillRequired, true);
  assert.equal(validated.automatedValidation.factualTruthValidated, false);
  assert.equal(validated.automatedValidation.sourceTruthValidated, false);
  assert.equal(validated.pjaImportBridge.providerWasNotClaimedToHaveUsedCanonicalBriefV2, true);
  assert.equal(validated.pjaImportBridge.canonicalBriefRepositoryCommit, VAP_W8_BASELINE);
  assert.equal(validated.pjaCandidate.schemaValidationPassed, true);
  assert.equal(validated.pjaCandidate.candidateState, 'ready_for_human_review');

  const providerSource = readText(sessionEntry.candidatePath);
  const providerBody = providerSource.trim();
  assert.equal(textDigest(providerSource), sessionEntry.candidateDigest, `${nodeCode}: PROVIDER_DIGEST`);
  const pjaCandidate = read(validated.pjaCandidate.targetPath);
  assert.equal(pjaCandidate.nodeCode, nodeCode);
  assert.equal(pjaCandidate.locale, VAP_W8_LOCALE);
  assert.equal(pjaCandidate.candidateState, 'ready_for_human_review');
  assert.equal(pjaCandidate.authority.candidateContent, 'candidate_only');
  assert.equal(pjaCandidate.authority.humanReview, 'not_reviewed');
  assert.equal(pjaCandidate.authority.approval, 'not_approved');
  assert.equal(pjaCandidate.authority.publication, 'not_published');
  assert.equal(pjaCandidate.governance.registryMutationAllowed, false);
  assert.equal(pjaCandidate.governance.reviewRecorded, false);
  assert.equal(pjaCandidate.governance.approvalRecorded, false);
  assert.equal(pjaCandidate.governance.publicationRecorded, false);
  assert.equal(pjaCandidate.sourceBrief.repositoryCommit, VAP_W8_BASELINE);
  const currentBriefBound = pjaCandidate.sourceBrief.briefDigest === validated.pjaImportBridge.canonicalBriefDigest;
  if (!currentBriefBound) {
    assert.equal(pjaCandidate.sourceBrief.briefCode, validated.pjaImportBridge.canonicalBriefCode);
    assert.equal(pjaCandidate.sourceBrief.briefSchemaVersion, validated.pjaImportBridge.canonicalBriefSchemaVersion);
    assert.equal(validation.summary.pjaImportPresentCount, 6);
  }
  assert.equal(pjaCandidate.article.bodyMarkdown.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim(), providerBody, `${nodeCode}: PROVIDER_BODY_PRESERVATION`);
  if (currentBriefBound) assert.equal(pjaCandidate.candidateDigest, validated.pjaCandidate.candidateDigest);
  else assert.notEqual(pjaCandidate.candidateDigest, validated.pjaCandidate.candidateDigest);
  assert.equal(imported.candidateDigest, pjaCandidate.candidateDigest);
  assert.ok(['imported', 'already_imported_byte_equivalent', 'already_imported_successor_lineage_equivalent'].includes(imported.status));
  const candidateForValidation = currentBriefBound ? pjaCandidate : rebuiltPlanByNode.get(nodeCode).candidateObject;
  const candidateValidation = await validateZhHansCandidate(root, candidateForValidation, { commit: VAP_W8_BASELINE });
  assert.equal(candidateValidation.valid, true, `${nodeCode}: PJA_SCHEMA_VALIDATION`);
}

const candidateRegistry = read('content/knowledge/production/registry/candidate-registry.json');
const reviewRegistry = read('content/knowledge/production/registry/review-registry.json');
const approvalRegistry = read('content/knowledge/production/registry/approval-registry.json');
const publicationRegistry = read('content/knowledge/production/registry/publication-registry.json');
const w9ActivationPath = 'content/production/visual-article/activation/vap-w9-human-editorial-review-candidate-promotion-v1.json';
const w9SuccessorApplied = fs.existsSync(path.join(root, w9ActivationPath)) && read(w9ActivationPath).humanEditorialReviewCount === 6;
const w10DecisionPath = 'content/production/visual-article/decisions/vap-w10-batch-001-human-approval-decisions-v1.json';
const w10Decisions = fs.existsSync(path.join(root, w10DecisionPath)) ? read(w10DecisionPath) : null;
const w10DecisionByNode = new Map((w10Decisions?.entries ?? []).map(entry => [entry.nodeCode, entry]));
for (const nodeCode of nodeCodes) {
  assert.equal(candidateRegistry.records.some(record => record.nodeCode === nodeCode && record.locale === VAP_W8_LOCALE), false, `${nodeCode}: CANDIDATE_REGISTRY_MUST_NOT_BE_PROMOTED_BY_W8`);
  const successorReview = reviewRegistry.records.find(record => record.nodeCode === nodeCode && record.locale === VAP_W8_LOCALE);
  if (w9SuccessorApplied) {
    assert(successorReview, `${nodeCode}: W9_SUCCESSOR_HUMAN_REVIEW_REQUIRED`);
    assert.equal(successorReview.decision, 'accept', `${nodeCode}: W9_SUCCESSOR_REVIEW_DECISION`);
    assert.equal(successorReview.reviewerCode, 'TL', `${nodeCode}: W9_SUCCESSOR_REVIEW_AUTHORITY`);
  } else {
    assert.equal(Boolean(successorReview), false, `${nodeCode}: HUMAN_REVIEW_MUST_NOT_BE_INVENTED_BY_W8`);
  }
  const successorApproval = approvalRegistry.records.find(record => record.nodeCode === nodeCode && record.locale === VAP_W8_LOCALE);
  const w10Decision = w10DecisionByNode.get(nodeCode) ?? null;
  const w10Approved = Boolean(w10Decision
    && w10Decision.decisionState === 'human_decided'
    && w10Decision.decision === 'approve'
    && w10Decision.approverCode === 'TL'
    && w10Decision.approverAuthority === 'TL Human Approval Authority');
  if (successorApproval) {
    assert.equal(w10Approved, true, `${nodeCode}: APPROVAL_MUST_HAVE_W10_HUMAN_AUTHORITY`);
    assert.equal(successorApproval.decision, 'approve', `${nodeCode}: W10_SUCCESSOR_APPROVAL_DECISION`);
    assert.equal(successorApproval.approverCode, 'TL', `${nodeCode}: W10_SUCCESSOR_APPROVAL_AUTHORITY`);
    assert.equal(successorApproval.candidateCode, w10Decision.candidateCode, `${nodeCode}: W10_SUCCESSOR_CANDIDATE_CODE`);
    assert.equal(successorApproval.candidateDigest, w10Decision.candidateDigest, `${nodeCode}: W10_SUCCESSOR_CANDIDATE_DIGEST`);
    assert.equal(successorApproval.reviewCode, w10Decision.reviewCode, `${nodeCode}: W10_SUCCESSOR_REVIEW_CODE`);
    assert.equal(successorApproval.reviewDigest, w10Decision.reviewDigest, `${nodeCode}: W10_SUCCESSOR_REVIEW_DIGEST`);
    assert.equal(successorApproval.publication, 'not_published', `${nodeCode}: W10_SUCCESSOR_MUST_REMAIN_UNPUBLISHED`);
  } else {
    assert.equal(w10Approved, false, `${nodeCode}: W10_APPROVAL_DECISION_REQUIRES_APPROVAL_RECORD`);
  }
  assert.equal(publicationRegistry.records.some(record => record.nodeCode === nodeCode && record.locale === VAP_W8_LOCALE), false, `${nodeCode}: PUBLICATION_MUST_NOT_BE_INVENTED_BY_W8`);
}

const importRuntimeManifest = read('content/knowledge/production/manifests/zh-hans-candidate-import-manifest.json');
assert.equal(importRuntimeManifest.atomicCreate, true);
assert.equal(importRuntimeManifest.overwriteAllowed, false);
assert.ok(importRuntimeManifest.prohibitedOperations.includes('write_registry'));
assert.ok(importRuntimeManifest.prohibitedOperations.includes('record_human_review'));
assert.ok(importRuntimeManifest.prohibitedOperations.includes('change_approval'));
assert.ok(importRuntimeManifest.prohibitedOperations.includes('publish'));

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'phios-vap-w8-import-'));
try {
  const candidate = rebuiltPlan.entries[0].candidateObject;
  const currentBriefPath = path.join(tempRoot, 'canonical-brief.json');
  fs.writeFileSync(currentBriefPath, `${stableJson(await (await import('./lib/knowledge-production/canonical-brief-v2.mjs')).buildCanonicalBriefV2(root, candidate.nodeCode, { commit: VAP_W8_BASELINE }))}\n`);
  const first = await importZhHansCandidate(root, candidate, { briefPath: currentBriefPath, targetRoot: tempRoot, apply: true });
  assert.equal(first.applied, true);
  assert.equal(first.registryTouched, false);
  assert.equal(first.reviewTouched, false);
  assert.equal(first.approvalTouched, false);
  assert.equal(first.publicationTouched, false);
  await assert.rejects(
    () => importZhHansCandidate(root, candidate, { briefPath: currentBriefPath, targetRoot: tempRoot, apply: true }),
    error => error.code === 'CANDIDATE_TARGET_EXISTS'
  );
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

const packageJson = read('package.json');
assert.equal(packageJson.scripts['build:vap-w8'], 'node scripts/build-vap-w8-candidate-validation-pja-import.mjs');
assert.equal(packageJson.scripts['vap:w8:import'], 'node scripts/import-vap-w8-batch-candidates-to-pja.mjs');
assert.equal(packageJson.scripts['check:vap-w8'], 'node scripts/check-vap-w8-candidate-validation-pja-import.mjs');
assert.equal(packageJson.scripts['check:vap-w7s'], 'node scripts/check-vap-w7s-batch-001-session-generation.mjs');
for (const stage of ['check:vap-w4r', 'check:vap-w5r', 'check:vap-w6', 'check:vap-w6a', 'check:vap-w7', 'check:vap-w7s', 'check:vap-w8']) {
  assert.ok(packageJson.scripts['check:vap-b'].includes(stage), `check:vap-b missing ${stage}`);
}
assert.ok(packageJson.scripts.postcheck.includes('npm run check:vap-b'));

console.log('✓ VAP-W8 Candidate Validation & PJA Import passed.');
console.log('✓ All 6 Batch 001 provider candidates pass integrity, public-body, title, minimum thesis/must-establish coverage, C2→PJA brief bridge, and PJA candidate-schema validation.');
console.log('✓ All 6 candidates are imported into the existing zh-Hans PJA Candidate layer as ready_for_human_review, preserving provider Markdown exactly.');
console.log('✓ W8 does not claim factual/source truth or complete semantic fidelity; all 6 still require Human editorial review.');
console.log('✓ W8 itself does not create Human Review/Approval/Publication authority; any successor Approval record must be independently bound to an explicit VAP-W10 TL Human Approval decision.');
console.log('✓ Existing PJA atomic importer is reused; overwrite remains forbidden and conflict fails closed.');
