import assert from 'node:assert/strict';
import { BASELINE, readJson, readText, exists, routeFile } from './lib/web-production/wpr-integrity-v1.mjs';

const contract = readJson('content/web-production/contracts/wpr-pds-responsive-accessibility-integration-v1.json');
assert.equal(contract.baselineCommit, BASELINE);
assert.equal(contract.work, 'WPR-W27');
assert.equal(contract.status, 'ACTIVE_PDS_AUTHORITY_PRESERVED_PRODUCTION_REVALIDATION_REQUIRED');
assert.equal(contract.rules.wprCreatesBreakpointAuthority, false);
assert.equal(contract.rules.wprCreatesDesignTokenAuthority, false);
assert.deepEqual(contract.rules.productionRevalidationViewports, [360, 768, 1440]);
assert.deepEqual(contract.rules.locales, ['en', 'zh-Hans']);

const pds2 = readJson('content/registry/pds-w2-design-token-contract.json');
assert.deepEqual(pds2.responsiveContract.acceptanceViewportsPx, [360, 768, 1440]);
assert.equal(pds2.responsiveContract.cssBreakpoints.compactMax, '40rem');
assert.equal(pds2.responsiveContract.cssBreakpoints.contentMin, '48rem');
assert.equal(pds2.responsiveContract.cssBreakpoints.wideMin, '90rem');
assert.equal(pds2.accessibilityContract.reducedMotionRequired, true);
assert.equal(pds2.accessibilityContract.colorAloneMayExpressState, false);
const pds3 = readJson('content/registry/pds-w3-core-component-shell-contract.json');
assert.equal(pds3.componentContract.focus.mustRemainVisible, true);
assert.equal(pds3.interactionContract.skipLink.targetMustExist, true);
for (const mode of pds3.responsiveContract) assert.equal(mode.horizontalOverflowAllowed, false);
const pds10 = readJson('content/registry/pds-w10-full-site-acceptance.json');
assert.equal(pds10.status, 'implementation-complete-production-revalidation-required');
assert.deepEqual(pds10.scope.viewports, [360, 768, 1440]);
assert.equal(pds10.scope.keyboardOperationRequired, true);
assert.equal(pds10.scope.focusVisibilityRequired, true);
assert.equal(pds10.scope.horizontalPageScrollAllowed, false);

const cprResponsive = readJson('content/professional/canonical-presentation-runtime/contracts/cpr-responsive-presentation-runtime-v1.json');
assert.equal(cprResponsive.breakpointAuthority, 'PDS');
assert.equal(cprResponsive.rules.semanticOrderImmutable, true);
assert.equal(cprResponsive.rules.boundaryMayNotBeHidden, true);
assert.equal(cprResponsive.rules.unknownMayNotBeHidden, true);
const cprAccessibility = readJson('content/professional/canonical-presentation-runtime/contracts/cpr-accessibility-presentation-runtime-v1.json');
for (const requirement of ['ALT_TEXT', 'READING_ORDER', 'KEYBOARD_NAVIGATION', 'FOCUS_VISIBILITY', 'CONTRAST_REFERENCE']) {
  assert.ok(cprAccessibility.requirements.includes(requirement));
}
assert.equal(cprAccessibility.pdsAuthorityPreserved, true);

const integration = readJson('content/web-production/registries/wpr-pds-surface-integration-registry-v1.json');
assert.equal(integration.baselineCommit, BASELINE);
const covered = new Set(integration.entries.flatMap(entry => entry.surfaceCodes));
const web = readJson('content/web-production/registries/canonical-web-production-registry-v1.json');
for (const record of web.productionRecords) assert.ok(covered.has(record.surfaceCode), `WPR_W27_SURFACE_UNMAPPED:${record.surfaceCode}`);

const cx = readJson('content/customer-experience-rebuild/migration/px2-cx-p1-public-ia-successor-v1.json');
const cutover = readJson(cx.currentAuthority.priorityCutover);
assert.equal(cx.status, 'ACTIVE_CX_P1_PUBLIC_IA_SUCCESSOR');
const routes = readJson('content/web-production/registries/wpr-route-registry-v1.json');
const published = readJson('content/knowledge/public/published-articles.json');
const files = new Set();
for (const record of web.productionRecords) {
  const route = routes.entries.find(entry => entry.routeCode === record.routeCode)?.path;
  if (!route) continue;
  if (route === '/articles/:slug') {
    for (const href of new Set(published.records.map(entry => entry.href))) files.add(`articles/${href.split('/').pop()}.html`);
  } else {
    const file = routeFile(route);
    if (file) files.add(file);
  }
}

const cxPaths = new Set(cutover.surfaces.map(surface => surface.htmlPath));
for (const file of files) {
  assert.ok(exists(file), file);
  const html = readText(file);
  assert.match(html, /<meta\s+name=["']viewport["']/i, `VIEWPORT:${file}`);
  assert.match(html, /<main(?:\s|>)/i, `MAIN:${file}`);
  const hasHistoricalTokens = html.includes('/assets/css/tokens.css');
  const hasPx2Presentation = html.includes('/assets/css/phios-public-v2.css') &&
    html.includes('/assets/js/public-shell-v2.js') && html.includes('data-px2-surface=');
  const hasCxPresentation = html.includes('/assets/customer-ui/tokens.css') &&
    html.includes('/assets/customer-ui/js/shell.js') && html.includes('data-cx-surface=');
  assert.ok(hasHistoricalTokens || hasPx2Presentation || hasCxPresentation, `PDS_PX2_OR_CX_TOKENS:${file}`);
  if (cxPaths.has(file)) {
    assert.equal(hasCxPresentation, true, `CX_PRESENTATION:${file}`);
    assert.equal(html.includes('/assets/css/phios-public-v2.css'), false, `CX_LEGACY_CSS:${file}`);
  }
  for (const image of html.match(/<img\b[^>]*>/gi) ?? []) assert.match(image, /\balt\s*=/i, `ALT:${file}`);
}

const p1Css = readText('assets/customer-ui/surfaces/p1.css');
assert.ok(p1Css.includes('@media(max-width:900px)'));
assert.ok(p1Css.includes('@media(max-width:620px)'));
const motionCss = readText('assets/customer-ui/motion.css');
assert.match(motionCss, /prefers-reduced-motion:\s*reduce/);

const audit = readJson('content/web-production/audits/wpr-w27-pds-integration-audit-v1.json');
assert.equal(audit.pdsBaselineMutated, false);
assert.equal(audit.cprAuthorityMutated, false);
assert.equal(audit.futureNewRawBreakpointAuthorityAllowed, false);
assert.equal(audit.productionBrowserMatrixStillRequired, true);
assert.ok(audit.knownHistoricalWprRawBreakpointOccurrences.length >= 1);
const acceptance = readJson('content/web-production/acceptance/wpr-w27-pds-responsive-accessibility-acceptance-v1.json');
assert.equal(acceptance.baselineCommit, BASELINE);
assert.equal(acceptance.productionRevalidationRequired, true);
for (const value of Object.values(acceptance.nonActivation)) assert.equal(value, false);

console.log('✓ WPR-W27 current PDS / PX2 / CX-P1 Responsive and Accessibility Integration passed.');
console.log(`  ${files.size} production HTML projections remain mapped to frozen PDS/CPR authority; CX-P1 consumes its single design system and browser matrix revalidation remains explicit.`);
