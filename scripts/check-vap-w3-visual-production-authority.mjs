import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildVapW3Authority, stableJson, VAP_W3_AUTHORITY, VAP_W3_CONTRACT, VAP_W3_BASELINE } from './lib/visual-article-production/visual-production-authority-v1.mjs';

const root = process.cwd();
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const contract = readJson(VAP_W3_CONTRACT);
const actual = readJson(VAP_W3_AUTHORITY);
const expected = buildVapW3Authority(root);

assert.equal(contract.contractCode, 'PHI-OS-VAP-W3-VISUAL-PRODUCTION-AUTHORITY-v1');
assert.equal(contract.contractVersion, '1.0.0');
assert.equal(contract.implementationBaselineCommit, VAP_W3_BASELINE);
assert.equal(contract.executionPrinciples.authorizationDoesNotEqualRuntimeCompatibility, true);
assert.equal(contract.executionPrinciples.kppPrimaryDispatchMustNotBeRewrittenByDerivedVisualNeed, true);
assert.equal(contract.executionPrinciples.canonicalMeaningSelectionMustNotBeInvented, true);
assert.equal(contract.nextWork, 'VAP-W4_GOVERNED_BRIEF_ADAPTERS_AND_WAVE1_BRIEF_GENERATION');

assert.equal(stableJson(actual), stableJson(expected), 'VAP-W3 authority must rebuild deterministically from the bdd9adf baseline authorities.');
assert.equal(actual.status, 'VISUAL_PRODUCTION_AUTHORITY_FROZEN_READY_FOR_VAP_W4_ADAPTERS');
assert.equal(actual.dispatchMatrix.length, 4);
assert.deepEqual(actual.dispatchMatrix.map(x => [x.nodeCode, x.productionRole, x.primaryAuthority]), [
  ['KN-PREFACE-004', 'ARTICLE', 'PJA'],
  ['KN-B1-P1-003', 'FRAGMENT', 'PJA'],
  ['KN-B1-P4-003', 'FIGURE', 'CAR'],
  ['KN-B1-P4-004', 'MULTI_ASSET', 'CAR']
]);
for (const entry of actual.dispatchMatrix) {
  assert.equal(entry.kppDispatchConfirmed, true, `${entry.nodeCode} must preserve the frozen KPP dispatch.`);
  assert.equal(entry.directBriefExecutionReady, false, `${entry.nodeCode} must remain adapter-gated at VAP-W3.`);
  assert.equal(entry.candidateCreationAllowed, false, `${entry.nodeCode} candidate creation remains closed.`);
}
const preface = actual.dispatchMatrix.find(x => x.nodeCode === 'KN-PREFACE-004');
assert.equal(preface.existingPublication.mode, 'REUSE_EXISTING_PUBLISHED_ARTICLE');
assert.equal(preface.existingPublication.newArticleCandidateRequired, false);
assert.equal(preface.secondaryVisualNeed.changesKppPrimaryDispatch, false);
assert.equal(preface.secondaryVisualNeed.target, 'CAR');
assert.equal(preface.secondaryVisualNeed.meaningSelectionResolved, false);
assert.equal(preface.existingPublication.modernPublishedKnowledgeAuthorityRecords, 0);
assert.equal(preface.existingPublication.carArticleReferenceRecords, 0);

const fragment = actual.dispatchMatrix.find(x => x.nodeCode === 'KN-B1-P1-003');
assert.equal(fragment.primaryBriefAdapter, 'PJA_FRAGMENT_PRODUCTION_BRIEF_ADAPTER_REQUIRED');
assert.equal(fragment.standardPjaArticleDraftExporterAllowed, false);

for (const code of ['KN-B1-P4-003', 'KN-B1-P4-004']) {
  const entry = actual.dispatchMatrix.find(x => x.nodeCode === code);
  assert.equal(entry.primaryBriefAdapter, 'CAR_PREPUBLICATION_ASSET_BRIEF_ADAPTER_REQUIRED');
  assert.equal(entry.currentPublishedFragmentCount, 0);
  assert.equal(entry.carPublishedCoverageGateRequired, true);
  assert.ok(entry.meaningCandidates.length > 0);
  assert.equal(entry.meaningSelectionResolved, false);
}

assert.deepEqual(actual.gates, {
  actualProductionBriefGenerationAllowedByW3: false,
  candidateCreationAllowed: false,
  providerInvocationAllowed: false,
  networkCallAllowed: false,
  assetCandidateMaterializationAllowed: false,
  binaryAssetGenerationAllowed: false,
  cprProductionRecordCreationAllowed: false,
  publicationAllowed: false,
  vapW4Allowed: true
});
assert.equal(actual.compatibility.directBriefExecutionReady, false);
assert.equal(actual.compatibility.adapterImplementationRequired, true);
assert.equal(actual.compatibility.carProviderMode, 'disabled');
assert.equal(actual.compatibility.carProvidersEnabled, false);
assert.equal(actual.compatibility.carNetworkCallsEnabled, false);
assert.equal(actual.compatibility.cprProductionRecordCount, 0);
assert.deepEqual(actual.deferredFailClosedFindings, ['EN_LOCALE_CJK_CONTAMINATION', 'EN_HEADING_CJK_CONTAMINATION', 'EN_BODY_CJK_CONTAMINATION']);

const findingCodes = new Set(actual.findings.map(x => x.findingCode));
for (const required of [
  'VAP-W3-PJA-ARTICLE-RECONCILIATION-BRIEF-ADAPTER-REQUIRED',
  'VAP-W3-PJA-FRAGMENT-BRIEF-ADAPTER-REQUIRED',
  'VAP-W3-CAR-PREPUBLICATION-ASSET-BRIEF-ADAPTER-REQUIRED',
  'VAP-W3-PREFACE004-MODERN-PUBLISHED-AUTHORITY-REFERENCE-GAP',
  'VAP-W3-CAR-MEANING-SELECTION-GAP'
]) assert.ok(findingCodes.has(required), required);

const packageJson = readJson('package.json');
assert.equal(packageJson.scripts['build:vap-w3'], 'node scripts/build-vap-w3-visual-production-authority.mjs');
assert.equal(packageJson.scripts['check:vap-w3'], 'node scripts/check-vap-w3-visual-production-authority.mjs');
assert.ok(packageJson.scripts.postcheck.includes('npm run check:vap-w3'));
assert.ok(packageJson.scripts['check:wave1-production'].includes('npm run check:wave1-human-production-decision'));
assert.ok(packageJson.scripts['check:wave1-production'].includes('npm run check:wave1-production-authorized'));
assert.equal(packageJson.scripts['check:vap'], 'npm run check:vap-w0', 'Historical VAP aggregate identity remains frozen at W0.');

console.log('✓ VAP-W3 Visual Production Authority Contract passed.');
console.log('✓ KPP Wave 1 dispatch is frozen: PJA owns ARTICLE/FRAGMENT; CAR owns governed FIGURE/MULTI_ASSET production.');
console.log('✓ Existing PJA/CAR runtimes are authorization-compatible but not directly execution-ready for all four Wave 1 items; VAP-W4 adapters are required.');
console.log('✓ Candidate/provider/network/binary asset/CPR production/publication gates remain closed.');
console.log('✓ KN-PREFACE-004 keeps PJA primary ARTICLE reconciliation; its required Figure may enter CAR only as a derived secondary asset need after PJA reconciliation.');
console.log('✓ English locale contamination remains out of scope and fail-closed.');
