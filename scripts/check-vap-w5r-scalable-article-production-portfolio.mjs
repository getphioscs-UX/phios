import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildVapW5rPortfolio, stableJson, VAP_W5R_BASELINE, VAP_W5R_CONTRACT, VAP_W5R_OUTPUT } from './lib/visual-article-production/scalable-article-production-portfolio-v1.mjs';

const root = process.cwd();
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const contract = readJson(VAP_W5R_CONTRACT);
const actual = readJson(VAP_W5R_OUTPUT);
const expected = buildVapW5rPortfolio(root);

assert.equal(contract.contractCode, 'PHI-OS-VAP-W5R-SCALABLE-ARTICLE-PRODUCTION-PORTFOLIO-v1');
assert.equal(contract.contractVersion, '1.0.0');
assert.equal(contract.implementationBaselineCommit, VAP_W5R_BASELINE);
assert.equal(contract.existingRuntimeReuse.mustNotReimplementPjaScalablePortfolio, true);
assert.equal(contract.signalRules.planningSignalMayNotAutoAssignArticleRole, true);
assert.equal(contract.signalRules.frozenHumanProductionDecisionOverridesOlderPlanningSignals, true);
assert.equal(contract.invariants.canonicalNodeCountDoesNotEqualArticleCount, true);

assert.equal(stableJson(actual), stableJson(expected), 'VAP-W5R portfolio must rebuild deterministically from current Canonical/KPP/C3/Published authority and the existing PJA scalable portfolio runtime.');
assert.equal(actual.status, 'SCALABLE_ARTICLE_PRODUCTION_PORTFOLIO_ACTIVE');
assert.equal(actual.authority, 'DERIVED_PRODUCTION_PLANNING_PROJECTION_ONLY');
assert.equal(actual.summary.canonicalNodeCount, 716);
assert.equal(actual.existingPjaRuntimeReuse.existingPortfolioEntryCount, 716);
assert.equal(actual.existingPjaRuntimeReuse.secondCanonicalRegistryCreated, false);
assert.equal(actual.existingPjaRuntimeReuse.pjaRuntimeReimplementedByW5r, false);
assert.equal(actual.summary.publishedArticleNodeCount, 4);
assert.equal(actual.summary.publishedArticleLocaleRecordCount, 8);
assert.equal(actual.summary.frozenWave1ProductionDecisionCount, 4);
assert.equal(actual.summary.confirmedArticleIntentCount, 1);
assert.deepEqual(actual.summary.confirmedArticleIntentNodeCodes, ['KN-PREFACE-004']);
assert.equal(actual.summary.newArticleExecutionEligibleCount, 0);
assert.deepEqual(actual.summary.newArticleExecutionEligibleNodeCodes, []);
assert.equal(actual.summary.explicitArticleIntentPendingProductionCount, 0);
assert.equal(actual.summary.explicitNonArticleWaveOutputCount, 3);
assert.equal(actual.summary.articleDecisionRequiredHighSignalCount, 6);
assert.equal(actual.summary.articleDecisionRequiredCount, 703);
assert.equal(actual.summary.articlePlanningBacklogCount, 709);
assert.equal(actual.summary.blueprintArticleRequiredNowSignalCount, 10);
assert.equal(actual.summary.canonicalPrimaryAssetTypeArticleSignalCount, 716);
assert.equal(actual.summary.c3IndexedNodeCount, 78);
assert.equal(actual.summary.c3ProductionReadyNodeCount, 5);
assert.equal(actual.summary.c3NotAssessedNodeCount, 638);
assert.equal(actual.summary.maturePjaWaveMaximum, 24);
assert.equal(actual.executionPolicy.autoAssignArticleRole, false);
assert.equal(actual.executionPolicy.autoApproveArticle, false);
assert.equal(actual.executionPolicy.candidateCreationAllowed, false);
assert.equal(actual.executionPolicy.providerInvocationAllowed, false);
assert.equal(actual.executionPolicy.publicationAllowed, false);

const book1 = actual.bookSummary.find(entry => entry.bookCode === 'BOOK-1');
const book2 = actual.bookSummary.find(entry => entry.bookCode === 'BOOK-2');
const book3 = actual.bookSummary.find(entry => entry.bookCode === 'BOOK-3');
const book4 = actual.bookSummary.find(entry => entry.bookCode === 'BOOK-4');
assert.equal(book1.nodeCount, 65);
assert.equal(book1.publishedArticleNodeCount, 4);
assert.equal(book1.explicitNonArticleWaveOutputCount, 3);
assert.equal(book1.articleDecisionRequiredHighSignalCount, 6);
assert.equal(book1.articleDecisionRequiredCount, 52);
assert.equal(book1.c3ProductionReadyCount, 5);
assert.equal(book2.nodeCount, 266);
assert.equal(book3.nodeCount, 187);
assert.equal(book4.nodeCount, 198);

for (const code of ['KN-PREFACE-001', 'KN-PREFACE-004', 'KN-PREFACE-010', 'KN-PREFACE-013']) {
  const entry = actual.entries.find(item => item.nodeCode === code);
  assert.equal(entry.portfolioState, 'EXISTING_PUBLISHED_ARTICLE', `${code}: published state`);
  assert.equal(entry.publication.existingPublishedArticle, true, `${code}: published protection`);
  assert.equal(entry.publication.newCandidateRegenerationAllowedByPortfolio, false, `${code}: duplicate protection`);
}
const p4003 = actual.entries.find(entry => entry.nodeCode === 'KN-B1-P4-003');
assert.equal(p4003.planningSignals.blueprintArticleRequiredNow, true);
assert.equal(p4003.portfolioState, 'EXPLICIT_NON_ARTICLE_WAVE_OUTPUT');
assert.equal(p4003.productionDecision.productionRole, 'FIGURE');
const p4004 = actual.entries.find(entry => entry.nodeCode === 'KN-B1-P4-004');
assert.equal(p4004.portfolioState, 'EXPLICIT_NON_ARTICLE_WAVE_OUTPUT');
assert.equal(p4004.productionDecision.productionRole, 'MULTI_ASSET');
assert.equal(p4004.productionDecision.articleIntent, false);

const packageJson = readJson('package.json');
assert.equal(packageJson.scripts['build:vap-w5r'], 'node scripts/build-vap-w5r-scalable-article-production-portfolio.mjs');
assert.equal(packageJson.scripts['check:vap-w5r'], 'node scripts/check-vap-w5r-scalable-article-production-portfolio.mjs');
assert.ok(packageJson.scripts.postcheck.includes('npm run check:vap-w5r'));

console.log('✓ VAP-W5R Scalable Article Production Portfolio passed.');
console.log('✓ Existing PJA-W3R1 scalable portfolio runtime is reused; no second Canonical Registry or duplicate portfolio engine is created.');
console.log('✓ 716 Canonical Nodes are visible in one governed planning projection, but 716 Nodes are NOT auto-declared as 716 Articles.');
console.log('✓ Current portfolio: 4 published Article nodes protected, 3 explicit non-Article Wave 1 outputs, 6 high-signal Article decisions pending, 703 further Article decisions pending.');
console.log('✓ Article planning backlog = 709 nodes; current new-Article execution targets = 0 until KPP/C2/C3/Human/W4R gates are satisfied.');
console.log('✓ Existing mature PJA wave maximum remains 24; W5R does not auto-create waves, invoke providers, create Candidates, or publish.');
