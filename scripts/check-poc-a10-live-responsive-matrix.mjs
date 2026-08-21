import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';

const CONTRACT_PATH = 'content/web-production/production-operational-closure/poc-a/contracts/poc-a10-live-responsive-matrix-contract-v1.json';
const EVIDENCE_PATH = 'content/web-production/production-operational-closure/poc-a/evidence/poc-a10-live-responsive-matrix-evidence-v1.json';
const ACCEPTANCE_PATH = 'content/web-production/production-operational-closure/poc-a/acceptance/poc-a10-live-responsive-matrix-acceptance-v1.json';
const READINESS_BOUNDARY_PATH = 'content/web-production/production-operational-closure/poc-a/audits/poc-a10-surface-readiness-boundary-v1.json';

const mode = process.argv.includes('--live') ? 'live' : 'repository';
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const readRaw = file => fs.readFile(file, 'utf8');
const readJson = async file => JSON.parse((await readRaw(file)).replace(/^\uFEFF/, ''));

const contractRaw = await readRaw(CONTRACT_PATH);
const contract = JSON.parse(contractRaw.replace(/^\uFEFF/, ''));
const readinessRaw = await readRaw(READINESS_BOUNDARY_PATH);
const readiness = JSON.parse(readinessRaw.replace(/^\uFEFF/, ''));

assert.equal(contract.schemaVersion, 'PHI-OS-POC-A10-LIVE-RESPONSIVE-MATRIX-CONTRACT-v1.0.0');
assert.equal(contract.work, 'POC-A10');
assert.match(contract.executionBaselineCommit, /^[0-9a-f]{40}$/);
assert.equal(contract.candidateBinding.mode, 'EXPLICIT_FULL_SHA_AT_LIVE_EXECUTION');
assert.equal(contract.candidateBinding.requires40CharacterSha, true);
assert.equal(contract.productionOrigin, 'https://phios-github.pages.dev');
assert.equal(contract.matrix.primaryCheckCount, 182);
assert.equal(contract.matrix.requiredStateCount, 182);
assert.deepEqual(contract.matrix.viewports, [360, 390, 430, 768, 1024, 1280, 1440]);
assert.deepEqual(contract.matrix.locales, ['en', 'zh-Hans']);
assert.deepEqual(contract.matrix.surfaceFamilies, [
  'Homepage', 'Library', 'Book', 'Article', 'Figure', 'Ask PHI OS', 'Academy', 'Journey',
  'Personal Runtime', 'Financial', 'Customer Workspace', 'Professional Workspace', 'Report'
]);
assert.deepEqual(contract.criteria, [
  'NO_HORIZONTAL_OVERFLOW',
  'NO_CLIPPED_NAVIGATION',
  'NO_BROKEN_GRID',
  'NO_UNREADABLE_CARDS',
  'NO_OVERLAPPING_TEXT',
  'NO_FIXED_WIDTH_DESKTOP_LEAKAGE',
  'NO_UNUSABLE_FORM_CONTROLS',
  'NO_VISUAL_ASSET_OVERFLOW',
  'NO_BROKEN_LOCALE_WRAPPING'
]);
assert.equal(contract.representativeSurfaces.length, 13);

assert.equal(readiness.schemaVersion, 'PHI-OS-POC-A10-SURFACE-READINESS-BOUNDARY-v1.0.0');
assert.equal(readiness.status, 'SURFACE_READINESS_BOUNDARY_RECORDED_NO_COMPLETION_PROMOTION');
assert.equal(readiness.surfaceReadinessSnapshot.length, 13);
assert.equal(readiness.predecessorAuthority.path, contract.authority.frontendSurfaceInventory.path);
assert.equal(readiness.predecessorAuthority.sha256, contract.authority.frontendSurfaceInventory.sha256);
assert.equal(readiness.predecessorAuthority.rewritten, false);
assert.equal(readiness.predecessorAuthority.routeFileExistenceNeverEqualsProduction, true);
assert.deepEqual(new Set(readiness.surfaceReadinessSnapshot.map(item => item.surfaceFamily)), new Set(contract.matrix.surfaceFamilies));
assert.ok(readiness.surfaceReadinessSnapshot.every(item => item.surfaceCompletionAcceptedByA10 === false));
assert.equal(readiness.interpretation.surfaceProductionStatesPromotedByA10, false);
assert.ok(readiness.interpretation.responsivePassDoesNotMean.includes('SURFACE_COMPLETE'));
assert.ok(readiness.interpretation.responsivePassDoesNotMean.includes('GLOBAL_PRODUCTION_ACCEPTED'));
assert.equal(readiness.authorityBoundary.responsiveAcceptanceMayBeEmitted, true);
for (const [key, value] of Object.entries(readiness.authorityBoundary)) {
  if (key !== 'responsiveAcceptanceMayBeEmitted') assert.equal(value, false, `readiness.${key}`);
}
assert.equal(contract.artifacts.runner, 'scripts/run-poc-a10-live-responsive-matrix.mjs');
assert.equal(contract.artifacts.checker, 'scripts/check-poc-a10-live-responsive-matrix.mjs');
assert.equal(contract.artifacts.evidence, EVIDENCE_PATH);
assert.equal(contract.artifacts.acceptance, ACCEPTANCE_PATH);
assert.equal(contract.artifacts.surfaceReadinessBoundary, READINESS_BOUNDARY_PATH);
assert.equal(contract.interpretationBoundary.responsiveAcceptanceEqualsPageCompletion, false);
assert.equal(contract.interpretationBoundary.responsiveAcceptanceEqualsSurfaceCompletion, false);
assert.equal(contract.interpretationBoundary.responsiveAcceptancePromotesProductionState, false);
assert.equal(contract.interpretationBoundary.a12HumanProductionDecisionRemainsSeparate, true);
await fs.access(contract.artifacts.runner);
await fs.access(contract.artifacts.checker);
assert.deepEqual(new Set(contract.representativeSurfaces.map(item => item.surfaceFamily)), new Set(contract.matrix.surfaceFamilies));

const matrixRaw = await readRaw(contract.authority.responsiveMatrix.path);
const criteriaRaw = await readRaw(contract.authority.responsiveCriteria.path);
const inventoryRaw = await readRaw(contract.authority.frontendSurfaceInventory.path);
const matrix = JSON.parse(matrixRaw.replace(/^\uFEFF/, ''));
const criteria = JSON.parse(criteriaRaw.replace(/^\uFEFF/, ''));

assert.equal(sha256(matrixRaw), contract.authority.responsiveMatrix.sha256, 'A10 matrix authority digest drift');
assert.equal(sha256(criteriaRaw), contract.authority.responsiveCriteria.sha256, 'A10 responsive criteria digest drift');
assert.equal(sha256(inventoryRaw), contract.authority.frontendSurfaceInventory.sha256, 'A10 frontend inventory digest drift');
assert.equal(matrix.primaryCheckCount, 182);
assert.equal(matrix.matrix.length, 182);
assert.deepEqual(matrix.viewports, contract.matrix.viewports);
assert.deepEqual(matrix.locales, contract.matrix.locales);
assert.deepEqual(matrix.surfaceFamilies, contract.matrix.surfaceFamilies);
assert.deepEqual(criteria.criteria.map(item => item.code), contract.criteria);
assert.ok(matrix.matrix.every(item => item.productionBrowserState === 'REVALIDATION_REQUIRED'), 'Historical BFR matrix must remain frozen/revalidation-required');
assert.equal(contract.authorityBoundary.browserRevalidationOnly, true);
for (const [key, value] of Object.entries(contract.authorityBoundary)) {
  if (key !== 'browserRevalidationOnly') assert.equal(value, false, key);
}

if (mode === 'repository') {
  console.log('✓ POC-A10 repository contract passed.');
  console.log('  182-state authority preserved: 7 viewports × 2 locales × 13 surface families.');
  console.log('  Historical BFR matrix remains REVALIDATION_REQUIRED; no browser evidence is invented.');
  process.exit(0);
}

const evidenceRaw = await readRaw(EVIDENCE_PATH);
const evidence = JSON.parse(evidenceRaw.replace(/^\uFEFF/, ''));
const acceptance = await readJson(ACCEPTANCE_PATH);

assert.equal(evidence.schemaVersion, 'PHI-OS-POC-A10-LIVE-RESPONSIVE-MATRIX-EVIDENCE-v1.0.0');
assert.equal(evidence.status, 'LIVE_BROWSER_REVALIDATION_PASSED');
assert.match(evidence.candidateCommit, /^[0-9a-f]{40}$/);
assert.equal(evidence.productionOrigin, contract.productionOrigin);
assert.equal(evidence.browser.headless, true, 'Canonical A10 acceptance requires headless reproducible run');
assert.equal(evidence.authorityDigests.contract, sha256(contractRaw));
assert.equal(evidence.authorityDigests.responsiveMatrix, sha256(matrixRaw));
assert.equal(evidence.authorityDigests.responsiveCriteria, sha256(criteriaRaw));
assert.equal(evidence.authorityDigests.frontendSurfaceInventory, sha256(inventoryRaw));
assert.equal(evidence.matrix.requiredStateCount, 182);
assert.equal(evidence.matrix.executedStateCount, 182);
assert.equal(evidence.matrix.passedStateCount, 182);
assert.equal(evidence.matrix.failedStateCount, 0);
assert.equal(evidence.results.length, 182);
assert.deepEqual(evidence.criteriaCodes, contract.criteria);

const expectedKeys = new Set();
for (const family of contract.matrix.surfaceFamilies) {
  for (const locale of contract.matrix.locales) {
    for (const viewport of contract.matrix.viewports) {
      expectedKeys.add(`${family}|${locale}|${viewport}`);
    }
  }
}
const actualKeys = new Set();
for (const state of evidence.results) {
  const key = `${state.surfaceFamily}|${state.locale}|${state.viewport}`;
  assert.ok(expectedKeys.has(key), `Unexpected A10 state: ${key}`);
  assert.ok(!actualKeys.has(key), `Duplicate A10 state: ${key}`);
  actualKeys.add(key);
  assert.equal(state.result, 'PASS', key);
  assert.equal(state.selectorResolved, true, `${key}: representative selector`);
  if (state.responseStatus !== null) assert.equal(state.responseStatus, 200, `${key}: document HTTP status`);
  assert.equal(state.readyState, 'complete', `${key}: document ready state`);
  assert.equal(state.documentLang, state.locale, `${key}: locale`);
  assert.deepEqual(Object.keys(state.criteria), contract.criteria, `${key}: criteria order/identity`);
  for (const code of contract.criteria) assert.equal(state.criteria[code].pass, true, `${key}: ${code}`);
}
assert.deepEqual(actualKeys, expectedKeys);
for (const family of contract.matrix.surfaceFamilies) {
  assert.equal(evidence.summaryBySurfaceFamily[family].total, 14, `${family}: total`);
  assert.equal(evidence.summaryBySurfaceFamily[family].passed, 14, `${family}: passed`);
  assert.equal(evidence.summaryBySurfaceFamily[family].failed, 0, `${family}: failed`);
}
assert.equal(evidence.authorityBoundary.browserRevalidationOnly, true);
for (const [key, value] of Object.entries(evidence.authorityBoundary)) {
  if (!['browserRevalidationOnly', 'screenshotsAreSupplementalOnly'].includes(key)) assert.equal(value, false, key);
}
assert.equal(evidence.authorityBoundary.screenshotsAreSupplementalOnly, true);
assert.equal(evidence.authorityBoundary.pageCompletionAccepted, false);
assert.equal(evidence.authorityBoundary.surfaceCompletionAccepted, false);
assert.equal(evidence.authorityBoundary.productionStatePromoted, false);

assert.equal(acceptance.schemaVersion, 'PHI-OS-POC-A10-LIVE-RESPONSIVE-MATRIX-ACCEPTANCE-v1.0.0');
assert.equal(acceptance.status, 'LIVE_RESPONSIVE_182_STATE_MATRIX_ACCEPTED_MACHINE_BROWSER_SCOPE');
assert.equal(acceptance.accepted, true);
assert.equal(acceptance.candidateCommit, evidence.candidateCommit);
assert.equal(acceptance.productionOrigin, contract.productionOrigin);
assert.equal(acceptance.evidence.path, EVIDENCE_PATH);
assert.equal(acceptance.evidence.sha256, sha256(evidenceRaw));
assert.equal(acceptance.evidence.executedStateCount, 182);
assert.equal(acceptance.evidence.passedStateCount, 182);
assert.equal(acceptance.evidence.failedStateCount, 0);
assert.deepEqual(acceptance.criteria.requiredPerState, contract.criteria);
assert.equal(acceptance.criteria.allCriteriaPassedPerState, true);
assert.equal(acceptance.historicalAuthority.responsiveMatrixRewritten, false);
assert.equal(acceptance.historicalAuthority.responsiveCriteriaRewritten, false);
assert.equal(acceptance.authorityBoundary.machineBrowserResponsiveAcceptanceOnly, true);
assert.equal(acceptance.authorityBoundary.pageCompletionAccepted, false);
assert.equal(acceptance.authorityBoundary.surfaceCompletionAccepted, false);
assert.equal(acceptance.authorityBoundary.productionStatePromoted, false);
for (const [key, value] of Object.entries(acceptance.authorityBoundary)) {
  if (key !== 'machineBrowserResponsiveAcceptanceOnly') assert.equal(value, false, key);
}

console.log('✓ POC-A10 live responsive matrix acceptance passed.');
console.log('  182/182 browser states passed all 9 BFR-H13 responsive criteria.');
console.log('  Historical BFR authority was preserved; A11 accessibility remains separate.');
