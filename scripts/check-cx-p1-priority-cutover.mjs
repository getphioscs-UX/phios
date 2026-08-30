import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = relativePath => fs.readFileSync(relativePath, 'utf8');
const json = relativePath => JSON.parse(read(relativePath));
const cutover = json('content/customer-experience-rebuild/migration/priority-route-cutover-registry-v1.json');
const successor = json('content/customer-experience-rebuild/migration/px2-cx-p1-public-ia-successor-v1.json');
const routes = json(successor.currentAuthority.routeRegistry);
const redirects = read('_redirects');

assert.equal(cutover.status, 'CODE_CUTOVER_COMPLETE_PRODUCTION_BROWSER_ACCEPTANCE_PENDING');
assert.equal(successor.status, 'ACTIVE_CX_P1_PUBLIC_IA_SUCCESSOR');
assert.equal(cutover.surfaces.length, 4);
assert.deepEqual(cutover.codeAcceptance, {
  legacyStylesheetsOnP1: 0,
  legacyShellImportsOnP1: 0,
  hardCodedPhiOnP1: 0,
  legacyAskRouteEntriesOnP1: 0,
  canonicalRedirectsInstalled: true
});
assert.equal(cutover.productionHumanAcceptance.required, true);
assert.equal(cutover.productionHumanAcceptance.status, 'PENDING_DEPLOYMENT');
assert.equal(cutover.productionHumanAcceptance.matrix.length, 8);
assert.equal(cutover.physicalDelete.status, 'BLOCKED_UNTIL_PRODUCTION_BROWSER_ACCEPTANCE');
assert.equal(cutover.physicalDelete.mandatoryAfterAcceptance, true);

for (const surface of cutover.surfaces) {
  assert.equal(surface.shell, 'ONE_GLOBAL_CUSTOMER_SHELL');
  assert.equal(successor.priorityCanonicalDestinations[surface.surfaceId], surface.canonicalPath);
  const route = routes.routes.find(entry => entry.routeId === surface.surfaceId);
  assert.equal(route?.canonicalPath, surface.canonicalPath, surface.surfaceId);
  const html = read(surface.htmlPath);
  for (const marker of [
    `data-cx-surface="${surface.surfaceId}"`, `href="${surface.canonicalPath}"`,
    '/assets/customer-ui/tokens.css', '/assets/customer-ui/surfaces/p1.css',
    '/assets/customer-ui/js/shell.js', 'data-cx-header', 'data-cx-footer'
  ]) assert.ok(html.includes(marker), `${surface.surfaceId}: ${marker}`);
  assert.equal(html.includes('/assets/css/phios-public-v2.css'), false, `${surface.surfaceId}: legacy CSS`);
  assert.equal(html.includes('/assets/js/public-shell-v2.js'), false, `${surface.surfaceId}: legacy shell`);
  assert.equal(html.includes('data-px2-surface'), false, `${surface.surfaceId}: legacy PX2 surface`);
  assert.equal(html.includes('puxr-'), false, `${surface.surfaceId}: legacy selector`);
  // Φ is also the governed ECR/PHI Configuration method monogram. Permit only
  // that exact method-card use; any remaining raw glyph is still treated as a
  // hard-coded global brand mark because the page chrome must use the CX shell.
  const withoutEcrMethodMonogram=html.replaceAll('<span class="cx-method-monogram" aria-hidden="true">Φ</span>','');
  assert.equal(withoutEcrMethodMonogram.includes('>Φ<'), false, `${surface.surfaceId}: hard-coded brand mark`);
  for (const legacy of surface.legacyRoutes) assert.ok(redirects.includes(`${legacy} ${surface.canonicalPath} 308`), `missing redirect ${legacy}`);
}

for (const [work, expected] of [
  ['cx-r10-acceptance-v1.json', 'MY_REALITY_CX_CODE_ACTIVE_BROWSER_PENDING'],
  ['cx-r12-acceptance-v1.json', 'PERSONAL_REALITY_CX_CODE_ACTIVE_BROWSER_PENDING'],
  ['cx-r13-acceptance-v1.json', 'FINANCIAL_REALITY_CX_CODE_ACTIVE_BROWSER_PENDING'],
  ['cx-r9-acceptance-v1.json', 'ASK_CX_CODE_ACTIVE_BROWSER_PENDING']
]) assert.equal(json(`content/customer-experience-rebuild/acceptance/${work}`).status, expected);

const navigation = read(successor.currentAuthority.navigationRuntime);
for (const legacy of ['/knowledge-search', '/my-reality', '/reality-dashboard', '/personal-runtime', '/financial-reality']) {
  assert.equal(navigation.includes(legacy), false, `current CX navigation retained ${legacy}`);
}
for (const api of ['customer-my-reality.js', 'customer-personal-reality.js', 'customer-financial-reality.js', 'customer-ask.js', 'customer-reality-handoff.js']) {
  assert.ok(fs.existsSync(`functions/api/${api}`), api);
}
assert.equal(successor.legacyRoutePolicy.legacyRoutesMayRemainInCurrentCxNavigation, false);
assert.equal(successor.legacyRoutePolicy.legacyRoutesMayRemainAsRedirectAliases, true);
assert.equal(successor.authorityBoundary.backendAuthorityCreated, false);
assert.equal(successor.authorityBoundary.methodAuthorityCreated, false);
assert.equal(successor.authorityBoundary.knowledgeAuthorityCreated, false);

console.log('✓ CX-P1 priority cutover passed: My Reality, Personal Reality, Financial Reality and Ask use one clean-room CX shell with canonical 308 compatibility routes.');
console.log('  Production human acceptance and legacy physical deletion remain correctly pending deployment/browser acceptance.');
