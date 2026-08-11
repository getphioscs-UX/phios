import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildVapW4rReconciliation, stableJson, VAP_W4R_BASELINE, VAP_W4R_CONTRACT, VAP_W4R_OUTPUT } from './lib/visual-article-production/article-execution-eligibility-reconciliation-v1.mjs';

const root = process.cwd();
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const contract = readJson(VAP_W4R_CONTRACT);
const actual = readJson(VAP_W4R_OUTPUT);
const expected = buildVapW4rReconciliation(root);

assert.equal(contract.contractCode, 'PHI-OS-VAP-W4R-ARTICLE-EXECUTION-ELIGIBILITY-RECONCILIATION-v1');
assert.equal(contract.contractVersion, '1.0.0');
assert.equal(contract.implementationBaselineCommit, VAP_W4R_BASELINE);
assert.equal(contract.articleIntentRules.multiAssetCreatesIntentOnlyWhenRequiredOutputsContainArticle, true);
assert.equal(contract.supersession.historicalOutputRemainsImmutable, true);
assert.equal(contract.supersession.downstreamArticleExecutionDecisionMustUseW4R, true);
assert.equal(contract.preservedGovernance.c2ThesisBoundaryFailureCode, 'C2_THESIS_BOUNDARY_NOT_FROZEN');

assert.equal(stableJson(actual), stableJson(expected), 'VAP-W4R output must rebuild deterministically from VAP-W4 historical eligibility and VAP-W3 execution authority.');
assert.equal(actual.status, 'ARTICLE_INTENT_AND_EXECUTION_ELIGIBILITY_RECONCILED');
assert.equal(actual.summary.evaluatedNodeCount, 4);
assert.equal(actual.summary.historicalVapW4ArticleEligibleCount, 2);
assert.equal(actual.summary.articleIntentCount, 1);
assert.deepEqual(actual.summary.articleIntentNodeCodes, ['KN-PREFACE-004']);
assert.equal(actual.summary.newArticleExecutionEligibleCount, 0);
assert.deepEqual(actual.summary.newArticleExecutionEligibleNodeCodes, []);
assert.equal(actual.summary.existingArticleReconciliationCount, 1);
assert.deepEqual(actual.summary.historicalSemanticOverreachNodeCodes, ['KN-B1-P4-004']);
assert.equal(actual.summary.nonArticleOutputCount, 3);

const preface = actual.entries.find(entry => entry.nodeCode === 'KN-PREFACE-004');
assert.equal(preface.articleIntent, true);
assert.equal(preface.existingArticleReconciliation, true);
assert.equal(preface.articleExecutionEligible, false);
assert.equal(preface.articleExecutionStatus, 'EXISTING_ARTICLE_RECONCILIATION_ONLY');
assert.ok(preface.nonExecutionReasons.includes('EXISTING_ARTICLE_RECONCILIATION_NOT_NEW_ARTICLE'));
assert.ok(preface.nonExecutionReasons.includes('PJA_STANDARD_ARTICLE_EXPORTER_NOT_ALLOWED'));

const multi = actual.entries.find(entry => entry.nodeCode === 'KN-B1-P4-004');
assert.equal(multi.historicalVapW4ArticleProductionEligible, true);
assert.equal(multi.articleIntent, false);
assert.equal(multi.articleIntentReason, 'MULTI_ASSET_WITHOUT_ARTICLE_OUTPUT');
assert.equal(multi.articleExecutionEligible, false);
assert.equal(multi.articleExecutionStatus, 'NOT_AN_ARTICLE_OUTPUT');

for (const code of ['KN-B1-P1-003', 'KN-B1-P4-003']) {
  const entry = actual.entries.find(item => item.nodeCode === code);
  assert.equal(entry.articleIntent, false);
  assert.equal(entry.articleExecutionEligible, false);
  assert.equal(entry.articleExecutionStatus, 'NOT_AN_ARTICLE_OUTPUT');
}
for (const entry of actual.entries) {
  assert.equal(entry.governanceGatePassed, true, `${entry.nodeCode}: non-role governance gate`);
  assert.equal(entry.governanceGates.canonicalThesisFrozen, true, `${entry.nodeCode}: C2 thesis`);
  assert.equal(entry.governanceGates.boundaryFrozen, true, `${entry.nodeCode}: C2 boundary`);
}

const packageJson = readJson('package.json');
assert.equal(packageJson.scripts['build:vap-w4r'], 'node scripts/build-vap-w4r-article-execution-eligibility-reconciliation.mjs');
assert.equal(packageJson.scripts['check:vap-w4r'], 'node scripts/check-vap-w4r-article-execution-eligibility-reconciliation.mjs');
assert.ok(packageJson.scripts.postcheck.includes('npm run check:vap-w4r'));

console.log('✓ VAP-W4R Article Intent / Execution Eligibility Reconciliation passed.');
console.log('✓ Historical VAP-W4 remains immutable, but downstream execution semantics now use W4R.');
console.log('✓ Wave 1: 1 Article intent, 1 existing-Article reconciliation, 0 new-Article execution targets.');
console.log('✓ KN-B1-P4-004 MULTI_ASSET(FIGURE+DIAGRAM) is no longer misclassified as Article intent.');
console.log('✓ C2/C3/Human/frozen-plan/frozen-wave/dispatch/locale gates remain fail-closed.');
