import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildVapW6Activation,
  buildVapW6BatchSelection,
  buildVapW6ExportPlan,
  stableJson,
  VAP_W6_ACTIVATION,
  VAP_W6_BASELINE,
  VAP_W6_BATCH,
  VAP_W6_CONTRACT,
  VAP_W6_POLICY,
  VAP_W6_SCHEMA
} from './lib/visual-article-production/batch-article-selection-production-brief-export-v1.mjs';

const root = process.cwd();
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const sha = source => crypto.createHash('sha256').update(source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'), 'utf8').digest('hex');

const contract = readJson(VAP_W6_CONTRACT);
const policy = readJson(VAP_W6_POLICY);
const schema = readJson(VAP_W6_SCHEMA);
const actualBatch = readJson(VAP_W6_BATCH);
const actualActivation = readJson(VAP_W6_ACTIVATION);
const expectedBatch = buildVapW6BatchSelection(root);
const expectedActivation = buildVapW6Activation(root, expectedBatch);

assert.equal(contract.contractCode, 'PHI-OS-VAP-W6-BATCH-ARTICLE-SELECTION-PRODUCTION-BRIEF-EXPORT-v1');
assert.equal(contract.contractVersion, '1.0.0');
assert.equal(contract.implementationBaselineCommit, VAP_W6_BASELINE);
assert.equal(contract.selectionBoundary.selectionIsRecommendationOnly, true);
assert.equal(contract.selectionBoundary.selectionIsNotHumanProductionDecision, true);
assert.equal(contract.selectionBoundary.generalBacklogAutoFillForbiddenByDefault, true);
assert.equal(contract.selectionBoundary.maximumBatchSizeInheritedFromPjaMatureWave, 24);
assert.equal(contract.productionBriefExportBoundary.existingSingleNodeExporterMustBeReused, true);
assert.equal(contract.productionBriefExportBoundary.perNodeW4rNewArticleExecutionEligibilityRequired, true);
assert.equal(contract.preservedGovernance.c2ThesisBoundaryFailureCode, 'C2_THESIS_BOUNDARY_NOT_FROZEN');
assert.equal(contract.preservedGovernance.candidateCreationAllowed, false);
assert.equal(contract.preservedGovernance.providerInvocationAllowed, false);
assert.equal(contract.preservedGovernance.publicationAllowed, false);

assert.equal(policy.authority, 'DECISION_SUPPORT_ONLY');
assert.equal(policy.maximumBatchSize, 24);
assert.equal(policy.generalBacklogAutoFill, false);
assert.deepEqual(policy.preferredPortfolioStatesInOrder, ['EXPLICIT_ARTICLE_INTENT', 'ARTICLE_DECISION_REQUIRED_HIGH_SIGNAL']);
assert.ok(policy.excludedPortfolioStates.includes('EXISTING_PUBLISHED_ARTICLE'));
assert.ok(policy.excludedPortfolioStates.includes('EXPLICIT_NON_ARTICLE_WAVE_OUTPUT'));

assert.equal(stableJson(actualBatch), stableJson(expectedBatch), 'VAP-W6 batch selection must rebuild deterministically from VAP-W5R/W4R/locale/PJA wave authority.');
assert.equal(stableJson(actualActivation), stableJson(expectedActivation), 'VAP-W6 activation must rebuild deterministically.');

assert.equal(schema.properties.schemaVersion.const, 'PHI-OS-VAP-W6-BATCH-ARTICLE-SELECTION-v1.0.0');
assert.equal(schema.properties.selectionAuthority.const, 'DERIVED_RECOMMENDATION_ONLY');
assert.equal(schema.properties.entries.maxItems, 24);
assert.equal(schema.properties.entries.items.properties.humanProductionDecisionRequired.type, 'boolean');

const expectedCodes = [
  'KN-B1-P1-006',
  'KN-B1-P2-001',
  'KN-B1-P2-009',
  'KN-B1-P3-005',
  'KN-B1-P3-015',
  'KN-B1-P4-006'
];
assert.equal(actualBatch.status, 'GOVERNED_ARTICLE_REVIEW_COHORT_WITH_EXPORTABLE_NODES');
assert.equal(actualBatch.selectionAuthority, 'DERIVED_RECOMMENDATION_ONLY');
assert.equal(actualBatch.selection.maximumBatchSize, 24);
assert.equal(actualBatch.selection.generalBacklogAutoFill, false);
assert.equal(actualBatch.selection.defaultLocale, 'zh-Hans');
assert.deepEqual(actualBatch.selection.selectedNodeCodes, expectedCodes);
assert.equal(actualBatch.summary.portfolioArticlePlanningBacklogCount, 709);
assert.equal(actualBatch.summary.preferredSignalCandidateCount, 6);
assert.equal(actualBatch.summary.selectedNodeCount, 6);
assert.equal(actualBatch.summary.generalBacklogNotAutoSelectedCount, 703);
assert.equal(actualBatch.summary.localeReadyForDefaultBriefCount, 6);
assert.equal(actualBatch.summary.c2BlockedCount, 0);
assert.equal(actualBatch.summary.humanProductionDecisionRequiredCount, 0);
assert.equal(actualBatch.summary.w4rExecutionEligibilityNotEstablishedCount, 0);
assert.equal(actualBatch.summary.productionBriefExportReadyCount, 6);
assert.deepEqual(actualBatch.summary.productionBriefExportReadyNodeCodes, expectedCodes);
assert.equal(actualBatch.summary.currentBriefExportCount, 0);
assert.equal(actualBatch.entries.length <= 24, true);
assert.equal(actualBatch.humanDecisionRequest.required, false);
assert.equal(actualBatch.humanDecisionRequest.requiredNodeCount, 0);
assert.equal(actualBatch.humanDecisionRequest.bulkApprovalAllowed, false);
assert.equal(actualBatch.humanDecisionRequest.selectionItselfDoesNotApproveArticleProduction, true);

for (const entry of actualBatch.entries) {
  assert.equal(entry.portfolioState, 'EXPLICIT_ARTICLE_INTENT', `${entry.nodeCode}: selected cohort now carries frozen W6A Article intent.`);
  assert.equal(entry.selectionStatus, 'SELECTED_FOR_GOVERNED_ARTICLE_DECISION_REVIEW');
  assert.equal(entry.selectionReason, 'EXPLICIT_ARTICLE_INTENT_PRIORITY');
  assert.equal(entry.humanProductionDecisionRequired, false);
  assert.equal(entry.articleEligibility.articleRoleAutoAssigned, false);
  assert.equal(entry.articleEligibility.status, 'SATISFIED_BY_FROZEN_HUMAN_ARTICLE_DECISION');
  assert.equal(entry.readiness.productionReady, true);
  assert.deepEqual(entry.readiness.blocking, []);
  assert.equal(entry.locale.requestedLocale, 'zh-Hans');
  assert.equal(entry.locale.readyForBrief, true);
  assert.equal(entry.executionEligibility.evaluatedByW6a, true);
  assert.equal(entry.executionEligibility.authoritySource, 'VAP-W6A');
  assert.equal(entry.executionEligibility.newArticleExecutionEligible, true);
  assert.deepEqual(entry.executionEligibility.nonExecutionReasons, []);
  assert.equal(entry.productionBriefExport.ready, true);
  assert.equal(entry.productionBriefExport.status, 'READY_FOR_EXISTING_PJA_EXPORTER');
  assert.deepEqual(entry.productionBriefExport.blockers, []);
}

assert.equal(actualBatch.entries.some(entry => entry.portfolioState === 'EXISTING_PUBLISHED_ARTICLE'), false);
assert.equal(actualBatch.entries.some(entry => entry.portfolioState === 'EXPLICIT_NON_ARTICLE_WAVE_OUTPUT'), false);
assert.equal(actualBatch.invariants.generalBacklogAutoFilled, false);
assert.equal(actualBatch.invariants.publishedArticleRegenerationAllowed, false);
assert.equal(actualBatch.invariants.c2ThesisBoundaryFailureCode, 'C2_THESIS_BOUNDARY_NOT_FROZEN');
assert.equal(actualBatch.invariants.existingPjaExporterReimplemented, false);
assert.equal(actualBatch.invariants.w6aSuccessorExecutionEligibilityMaySatisfyBriefExport, true);
assert.equal(actualBatch.invariants.candidateCreationAllowed, false);
assert.equal(actualBatch.invariants.providerInvocationAllowed, false);
assert.equal(actualBatch.invariants.publicationAllowed, false);

assert.equal(actualActivation.status, 'BATCH_SELECTION_AND_EXISTING_PJA_EXPORT_ORCHESTRATION_ACTIVE');
assert.equal(actualActivation.currentBatch.selectedNodeCount, 6);
assert.equal(actualActivation.currentBatch.productionBriefExportReadyCount, 6);
assert.equal(actualActivation.currentBatch.currentBriefExportCount, 0);
assert.equal(actualActivation.currentBatch.currentStatus, 'PARTIAL_OR_FULL_EXPORT_AVAILABLE');
assert.equal(actualActivation.existingPjaRuntimeReuse.exporterPath, 'scripts/export-knowledge-production-brief.mjs');
assert.equal(actualActivation.existingPjaRuntimeReuse.singleNodeExporterReimplemented, false);
assert.equal(actualActivation.existingPjaRuntimeReuse.wrapperAuthority, 'ORCHESTRATION_ONLY');
for (const [key, value] of Object.entries(actualActivation.effects)) assert.equal(value, false, `Activation effect must remain false: ${key}`);

const zhPlan = buildVapW6ExportPlan(root, actualBatch, 'zh-Hans');
assert.equal(zhPlan.selectedNodeCount, 6);
assert.deepEqual(zhPlan.exportReadyNodeCodes, expectedCodes);
assert.deepEqual(zhPlan.blockedNodeCodes, []);
for (const entry of zhPlan.entries) { assert.equal(entry.exportReady, true); assert.equal(entry.executionEligibilitySource, 'VAP-W6A'); assert.deepEqual(entry.blockers, []); }

const enPlan = buildVapW6ExportPlan(root, actualBatch, 'en');
assert.deepEqual(enPlan.exportReadyNodeCodes, []);
for (const entry of enPlan.entries) {
  assert.ok(entry.blockers.includes('LOCALE_BRIEF_READINESS_NOT_PASSED'));
  assert.ok(entry.blockers.includes('W4R_NEW_ARTICLE_EXECUTION_ELIGIBILITY_NOT_ESTABLISHED'));
}

const w5Activation = readJson('content/production/visual-article/activation/vap-w5-pja-production-brief-export-v1.json');
const exporterSource = fs.readFileSync(path.join(root, 'scripts/export-knowledge-production-brief.mjs'), 'utf8');
assert.equal(`sha256:${sha(exporterSource)}`, w5Activation.sourceDigests['scripts/export-knowledge-production-brief.mjs'], 'Existing PJA exporter must remain byte-equivalent to the W5 accepted exporter.');

const packageJson = readJson('package.json');
assert.equal(packageJson.scripts['build:vap-w6'], 'node scripts/build-vap-w6-batch-article-selection-production-brief-export.mjs');
assert.equal(packageJson.scripts['vap:batch:export-briefs'], 'node scripts/export-vap-w6-batch-production-briefs.mjs');
assert.equal(packageJson.scripts['check:vap-w6'], 'node scripts/check-vap-w6-batch-article-selection-production-brief-export.mjs');
assert.ok(packageJson.scripts['check:vap-b'].includes('npm run check:vap-w6'));
assert.ok(packageJson.scripts.postcheck.includes('npm run check:vap-b') || packageJson.scripts.postcheck.includes('npm run check:vap-w6'));

console.log('✓ VAP-W6 Batch Article Selection & Production Brief Export passed.');
console.log('✓ The same 6-node bounded Book 1 cohort remains selected; mature PJA batch maximum remains 24.');
console.log('✓ VAP-W6 does not invent Article/Human authority; it now consumes the already-frozen W6A successor authority for the selected cohort.');
console.log('✓ All 6 selected nodes are zh-Hans locale-ready and brief-export eligible through W6A; activation itself still generates 0 briefs because export remains an explicit command.');
console.log('✓ Existing PJA single-node production-brief exporter is reused byte-for-byte; VAP-W6 adds orchestration only.');
console.log('✓ Batch exporter is fail-closed: it accepts per-locale W6A successor execution eligibility or historical W4R eligibility and skips blocked nodes.');
