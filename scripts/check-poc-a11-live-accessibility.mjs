import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';

const CONTRACT_PATH = 'content/web-production/production-operational-closure/poc-a/contracts/poc-a11-live-accessibility-contract-v1.json';
const EVIDENCE_PATH = 'content/web-production/production-operational-closure/poc-a/evidence/poc-a11-live-accessibility-evidence-v1.json';
const ACCEPTANCE_PATH = 'content/web-production/production-operational-closure/poc-a/acceptance/poc-a11-live-accessibility-acceptance-v1.json';

const mode = process.argv.includes('--live') ? 'live' : 'repository';

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

async function readRaw(file) {
  return fs.readFile(file, 'utf8');
}

async function readJson(file) {
  return JSON.parse((await readRaw(file)).replace(/^\uFEFF/, ''));
}

const contractRaw = await readRaw(CONTRACT_PATH);
const contract = JSON.parse(contractRaw.replace(/^\uFEFF/, ''));

assert.equal(contract.schemaVersion, 'PHI-OS-POC-A11-LIVE-ACCESSIBILITY-CONTRACT-v1.0.0');
assert.equal(contract.work, 'POC-A11');
assert.equal(contract.productionOrigin, 'https://phios-github.pages.dev');
assert.equal(contract.status, 'LIVE_BROWSER_ACCESSIBILITY_REVALIDATION_CONTRACTED_NOT_YET_ACCEPTED');
assert.deepEqual(contract.matrix.viewports, [360, 768, 1440]);
assert.deepEqual(contract.matrix.locales, ['en', 'zh-Hans']);
assert.deepEqual(contract.matrix.surfaceFamilies, [
  'Homepage', 'Library', 'Book', 'Article', 'Figure', 'Ask PHI OS', 'Academy', 'Journey',
  'Personal Runtime', 'Financial', 'Customer Workspace', 'Professional Workspace', 'Report'
]);
assert.equal(contract.matrix.requiredStateCount, 78);
assert.equal(contract.matrix.viewports.length * contract.matrix.locales.length * contract.matrix.surfaceFamilies.length, 78);
assert.deepEqual(contract.criteria, [
  'KEYBOARD_NAVIGATION',
  'VISIBLE_FOCUS',
  'SEMANTIC_LANDMARKS',
  'HEADING_HIERARCHY',
  'ALT',
  'FIGURE_CAPTION',
  'LONG_DESCRIPTION_WHERE_NEEDED',
  'CONTRAST',
  'REDUCED_MOTION',
  'TOUCH_TARGET',
  'FORM_LABELS',
  'ERROR_IDENTIFICATION',
  'ARIA_CURRENT',
  'ARIA_EXPANDED',
  'DIALOG_SEMANTICS',
  'SKIP_NAVIGATION',
  'VISUAL_INFORMATION_NOT_COLOR_ONLY',
  'VOLUME_IDENTITY_NOT_COLOR_ONLY',
  'UNKNOWN_WARNING_NOT_COLOR_ONLY',
  'INTERACTIVE_FIGURE_KEYBOARD_ACCESSIBILITY',
  'ASK_COMPOSER_KEYBOARD_ACCESSIBILITY',
  'ANSWER_EXPANDABLE_REGIONS_ACCESSIBLE'
]);
assert.deepEqual(contract.acceptanceGate.allowedCriterionOutcomes, ['PASS', 'NOT_APPLICABLE']);
assert.equal(contract.acceptanceGate.all78StatesMustPass, true);
assert.equal(contract.acceptanceGate.runnerStateErrorFails, true);
assert.equal(contract.execution.engine, 'CHROMIUM_CDP_SINGLE_RUNNER');
assert.equal(contract.execution.headlessRequired, true);
assert.equal(contract.execution.touchTargetMinimumCssPx, 24);
assert.equal(contract.execution.contrast.normalTextMinimum, 4.5);
assert.equal(contract.execution.contrast.largeTextMinimum, 3.0);
assert.equal(contract.execution.prefersReducedMotion, 'reduce');
assert.equal(contract.interpretationBoundary.machineBrowserAccessibilityAcceptanceOnly, true);
assert.equal(contract.interpretationBoundary.wcagConformanceCertification, false);
assert.equal(contract.interpretationBoundary.screenReaderHumanAcceptance, false);
assert.equal(contract.interpretationBoundary.assistiveTechnologyHumanAcceptance, false);
assert.equal(contract.interpretationBoundary.humanVisualContrastAcceptance, false);
assert.equal(contract.interpretationBoundary.pageCompletionAccepted, false);
assert.equal(contract.interpretationBoundary.surfaceCompletionAccepted, false);
assert.equal(contract.interpretationBoundary.productionStatePromoted, false);
assert.equal(contract.interpretationBoundary.a12HumanProductionDecisionRemainsSeparate, true);
assert.equal(contract.interpretationBoundary.globalProductionAccepted, false);
assert.equal(contract.artifacts.runner, 'scripts/run-poc-a11-live-accessibility.mjs');
assert.equal(contract.artifacts.checker, 'scripts/check-poc-a11-live-accessibility.mjs');
assert.equal(contract.artifacts.evidence, EVIDENCE_PATH);
assert.equal(contract.artifacts.acceptance, ACCEPTANCE_PATH);
await fs.access(contract.artifacts.runner);
await fs.access(contract.artifacts.checker);

const authorityRaw = {};
for (const [key, ref] of Object.entries(contract.authority)) {
  assert.ok(ref.path, `A11 authority ${key} missing path`);
  const raw = await readRaw(ref.path);
  authorityRaw[key] = raw;
  assert.equal(sha256(raw), ref.sha256, `A11 authority digest drift: ${key}`);
  assert.equal(ref.rewritten, false, `A11 predecessor authority must remain frozen: ${key}`);
}

const h14 = JSON.parse(authorityRaw.bfrH14AccessibilityCriteria.replace(/^\uFEFF/, ''));
assert.equal(h14.schemaVersion, contract.authority.bfrH14AccessibilityCriteria.schemaVersion);
assert.equal(h14.status, 'ACCESSIBILITY_SOURCE_AUDIT_ACCEPTED_PRODUCTION_BROWSER_REVALIDATION_REQUIRED');
assert.deepEqual(h14.criteria.map(item => item.code), contract.criteria);
assert.ok(h14.criteria.every(item => item.required === true));
assert.ok(h14.criteria.every(item => item.productionBrowserEvidence === 'REVALIDATION_REQUIRED'));
assert.equal(h14.pdsAccessibilityAuthorityPreserved, true);
assert.equal(h14.newAccessibilityAuthorityCreated, false);
assert.equal(h14.productionBrowserRevalidationRequired, true);

const wpr = JSON.parse(authorityRaw.wprPdsAccessibilityIntegration.replace(/^\uFEFF/, ''));
assert.deepEqual(wpr.rules.productionRevalidationViewports, contract.matrix.viewports);
assert.deepEqual(wpr.rules.locales, contract.matrix.locales);
assert.equal(wpr.rules.wprCreatesBreakpointAuthority, false);
assert.equal(wpr.rules.wprCreatesDesignTokenAuthority, false);
assert.ok(wpr.accessibilityRequirements.includes('KEYBOARD_NAVIGATION'));
assert.ok(wpr.accessibilityRequirements.includes('FOCUS_VISIBILITY'));
assert.ok(wpr.accessibilityRequirements.includes('CONTRAST_REFERENCE'));

const pds2 = JSON.parse(authorityRaw.pdsDesignTokenContract.replace(/^\uFEFF/, ''));
assert.deepEqual(pds2.responsiveContract.acceptanceViewportsPx, contract.matrix.viewports);
assert.equal(pds2.accessibilityContract.reducedMotionRequired, true);
assert.equal(pds2.accessibilityContract.colorAloneMayExpressState, false);

const pds3 = JSON.parse(authorityRaw.pdsComponentShellContract.replace(/^\uFEFF/, ''));
assert.equal(pds3.componentContract.focus.mustRemainVisible, true);
assert.equal(pds3.interactionContract.skipLink.targetMustExist, true);

const pds10 = JSON.parse(authorityRaw.pdsFullSiteAcceptance.replace(/^\uFEFF/, ''));
assert.deepEqual(pds10.scope.viewports, contract.matrix.viewports);
assert.equal(pds10.scope.keyboardOperationRequired, true);
assert.equal(pds10.scope.focusVisibilityRequired, true);

const cpr = JSON.parse(authorityRaw.cprAccessibilityRuntime.replace(/^\uFEFF/, ''));
for (const code of ['ALT_TEXT','READING_ORDER','KEYBOARD_NAVIGATION','FOCUS_VISIBILITY','CONTRAST_REFERENCE']) assert.ok(cpr.requirements.includes(code));
assert.equal(cpr.pdsAuthorityPreserved, true);

const a10 = JSON.parse(authorityRaw.a10RepresentativeSurfaceContract.replace(/^\uFEFF/, ''));
assert.deepEqual(a10.matrix.surfaceFamilies, contract.matrix.surfaceFamilies);
assert.equal(a10.representativeSurfaces.length, 13);
assert.deepEqual(new Set(a10.representativeSurfaces.map(item => item.surfaceFamily)), new Set(contract.matrix.surfaceFamilies));

const a10Acceptance = JSON.parse(authorityRaw.a10AcceptancePrerequisite.replace(/^\uFEFF/, ''));
assert.equal(contract.authority.a10AcceptancePrerequisite.requiredAccepted, true);
assert.equal(a10Acceptance.accepted, true);
assert.equal(a10Acceptance.status, 'LIVE_RESPONSIVE_182_STATE_MATRIX_ACCEPTED_MACHINE_BROWSER_SCOPE');
assert.equal(a10Acceptance.evidence.executedStateCount, 182);
assert.equal(a10Acceptance.evidence.passedStateCount, 182);
assert.equal(a10Acceptance.evidence.failedStateCount, 0);

const readiness = JSON.parse(authorityRaw.surfaceReadinessBoundary.replace(/^\uFEFF/, ''));
assert.equal(readiness.status, 'SURFACE_READINESS_BOUNDARY_RECORDED_NO_COMPLETION_PROMOTION');
assert.equal(readiness.surfaceReadinessSnapshot.length, 13);
assert.ok(readiness.surfaceReadinessSnapshot.every(item => item.surfaceCompletionAcceptedByA10 === false));
assert.equal(readiness.interpretation.surfaceProductionStatesPromotedByA10, false);

if (mode === 'repository') {
  console.log('✓ POC-A11 repository accessibility contract passed.');
  console.log('  78-state browser scope preserved: 3 PDS viewports × 2 locales × 13 accepted A10 representative surface families.');
  console.log('  All 22 frozen BFR-H14 criteria are bound without rewriting H14/PDS/CPR authority.');
  console.log('  Machine-browser accessibility acceptance cannot promote page/surface completion or claim WCAG/human AT acceptance.');
  process.exit(0);
}

const evidenceRaw = await readRaw(EVIDENCE_PATH);
const evidence = JSON.parse(evidenceRaw.replace(/^\uFEFF/, ''));
const acceptance = await readJson(ACCEPTANCE_PATH);

assert.equal(evidence.schemaVersion, 'PHI-OS-POC-A11-LIVE-ACCESSIBILITY-EVIDENCE-v1.0.0');
assert.equal(evidence.work, 'POC-A11');
assert.equal(evidence.status, 'LIVE_BROWSER_ACCESSIBILITY_REVALIDATION_PASSED');
assert.match(evidence.candidateCommit, /^[0-9a-f]{40}$/);
assert.equal(evidence.productionOrigin, contract.productionOrigin);
assert.equal(evidence.browser.headless, true, 'Canonical A11 acceptance requires headless reproducible browser run');
assert.equal(evidence.browser.protocol, 'CHROME_DEVTOOLS_PROTOCOL');
assert.equal(evidence.browser.emulatedMedia.prefersReducedMotion, 'reduce');
assert.equal(evidence.authorityDigests.contract, sha256(contractRaw));
for (const [key, raw] of Object.entries(authorityRaw)) assert.equal(evidence.authorityDigests[key], sha256(raw), `Evidence authority digest: ${key}`);
assert.equal(evidence.matrix.requiredStateCount, 78);
assert.equal(evidence.matrix.executedStateCount, 78);
assert.equal(evidence.matrix.passedStateCount, 78);
assert.equal(evidence.matrix.failedStateCount, 0);
assert.deepEqual(evidence.matrix.viewports, contract.matrix.viewports);
assert.deepEqual(evidence.matrix.locales, contract.matrix.locales);
assert.deepEqual(evidence.matrix.surfaceFamilies, contract.matrix.surfaceFamilies);
assert.deepEqual(evidence.criteriaCodes, contract.criteria);
assert.deepEqual(evidence.allowedCriterionOutcomes, contract.acceptanceGate.allowedCriterionOutcomes);
assert.equal(evidence.results.length, 78);

const expectedKeys = new Set();
for (const family of contract.matrix.surfaceFamilies) {
  for (const locale of contract.matrix.locales) {
    for (const viewport of contract.matrix.viewports) expectedKeys.add(`${family}|${locale}|${viewport}`);
  }
}
const actualKeys = new Set();
for (const state of evidence.results) {
  const key = `${state.surfaceFamily}|${state.locale}|${state.viewport}`;
  assert.ok(expectedKeys.has(key), `Unexpected A11 state: ${key}`);
  assert.ok(!actualKeys.has(key), `Duplicate A11 state: ${key}`);
  actualKeys.add(key);
  assert.equal(state.result, 'PASS', key);
  assert.equal(state.selectorResolved, true, `${key}: representative selector`);
  if (state.responseStatus !== null) assert.equal(state.responseStatus, 200, `${key}: document HTTP status`);
  assert.equal(state.readyState, 'complete', `${key}: document ready state`);
  assert.equal(state.documentLang, state.locale, `${key}: document language`);
  assert.deepEqual(Object.keys(state.criteria), contract.criteria, `${key}: criterion identity/order`);
  for (const code of contract.criteria) {
    const criterion = state.criteria[code];
    assert.ok(contract.acceptanceGate.allowedCriterionOutcomes.includes(criterion.status), `${key}: ${code} status ${criterion.status}`);
    assert.equal(criterion.pass, true, `${key}: ${code}`);
  }
}
assert.deepEqual(actualKeys, expectedKeys);

for (const family of contract.matrix.surfaceFamilies) {
  assert.equal(evidence.summaryBySurfaceFamily[family].total, 6, `${family}: total`);
  assert.equal(evidence.summaryBySurfaceFamily[family].passed, 6, `${family}: passed`);
  assert.equal(evidence.summaryBySurfaceFamily[family].failed, 0, `${family}: failed`);
}
for (const code of contract.criteria) {
  const summary = evidence.summaryByCriterion[code];
  assert.equal(summary.pass + summary.notApplicable + summary.fail, 78, `${code}: summary total`);
  assert.equal(summary.fail, 0, `${code}: failure count`);
}

assert.equal(evidence.interpretationBoundary.machineBrowserAccessibilityAcceptanceOnly, true);
for (const key of ['wcagConformanceCertification','screenReaderHumanAcceptance','assistiveTechnologyHumanAcceptance','humanVisualContrastAcceptance','pageCompletionAccepted','surfaceCompletionAccepted','contentCompletionAccepted','featureCompletionAccepted','productionStatePromoted','deploymentShaAccepted','customDomainAccepted','globalProductionAccepted']) {
  assert.equal(evidence.interpretationBoundary[key], false, `evidence boundary ${key}`);
}

assert.equal(acceptance.schemaVersion, 'PHI-OS-POC-A11-LIVE-ACCESSIBILITY-ACCEPTANCE-v1.0.0');
assert.equal(acceptance.work, 'POC-A11');
assert.equal(acceptance.status, 'LIVE_ACCESSIBILITY_78_STATE_MATRIX_ACCEPTED_MACHINE_BROWSER_SCOPE');
assert.equal(acceptance.accepted, true);
assert.equal(acceptance.candidateCommit, evidence.candidateCommit);
assert.equal(acceptance.productionOrigin, contract.productionOrigin);
assert.equal(acceptance.evidence.path, EVIDENCE_PATH);
assert.equal(acceptance.evidence.sha256, sha256(evidenceRaw));
assert.equal(acceptance.evidence.executedStateCount, 78);
assert.equal(acceptance.evidence.passedStateCount, 78);
assert.equal(acceptance.evidence.failedStateCount, 0);
assert.deepEqual(acceptance.criteria.bfrH14RequiredCriteria, contract.criteria);
assert.deepEqual(acceptance.criteria.allowedOutcomes, contract.acceptanceGate.allowedCriterionOutcomes);
assert.equal(acceptance.criteria.allStatesAccepted, true);
assert.equal(acceptance.historicalAuthority.bfrH14Rewritten, false);
assert.equal(acceptance.historicalAuthority.pdsAccessibilityAuthorityRewritten, false);
assert.equal(acceptance.historicalAuthority.cprAccessibilityAuthorityRewritten, false);
assert.equal(acceptance.historicalAuthority.a10AcceptanceRewritten, false);
assert.equal(acceptance.historicalAuthority.surfaceReadinessBoundaryRewritten, false);
assert.deepEqual(acceptance.interpretationBoundary, contract.interpretationBoundary);

console.log('✓ POC-A11 live accessibility acceptance passed.');
console.log('  78/78 browser states accepted across all 22 BFR-H14 criteria with explicit NOT_APPLICABLE handling for conditional criteria.');
console.log('  Scope is machine-browser accessibility revalidation only; no WCAG certification, human screen-reader/AT acceptance, page completion, or production promotion is claimed.');
