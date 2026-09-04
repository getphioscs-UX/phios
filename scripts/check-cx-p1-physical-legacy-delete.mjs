import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));
const exists=p=>fs.existsSync(p);

const browser=json('content/customer-experience-rebuild/acceptance/p1-production-browser-acceptance-v1.json');
const plan=json('content/customer-experience-rebuild/migration/p1-legacy-delete-plan-v2.json');
const cut=json('content/customer-experience-rebuild/migration/priority-route-cutover-registry-v3.json');
const routes=json(cut.currentRouteAuthority);
const successor=json('content/customer-experience-rebuild/migration/px2-cx-p1-public-ia-successor-v3.json');
const acceptance=json('content/customer-experience-rebuild/acceptance/p1-physical-legacy-delete-acceptance-v1.json');
const redirects=read('_redirects');

assert.equal(browser.status,'HUMAN_ACCEPTED_BY_USER_CONFIRMATION');
assert.equal(browser.browserAcceptance,true);
assert.equal(browser.physicalLegacyDeleteAllowed,true);
assert.equal(plan.status,'PHYSICAL_LEGACY_PRESENTATION_DELETE_COMPLETE');
assert.equal(plan.physicalDeleteCount,7);
assert.equal(cut.status,'P1_ROUTE_CUTOVER_BROWSER_ACCEPTED_PHYSICAL_LEGACY_DELETE_COMPLETE');
assert.equal(cut.productionBrowserAcceptance.status,'HUMAN_ACCEPTED');
assert.equal(cut.physicalDelete.performed,true);
assert.equal(cut.physicalDelete.deletedPresentationCount,7);
assert.equal(routes.status,'P1_PRIORITY_ROUTES_ACTIVE_BROWSER_ACCEPTED_LEGACY_PRESENTATION_DELETED');
assert.equal(routes.authorityBoundary.physicalLegacyDeletePerformed,true);
assert.equal(routes.authorityBoundary.productionBrowserAcceptanceSatisfied,true);
assert.equal(successor.status,'ACTIVE_P1_BROWSER_ACCEPTED_PHYSICAL_LEGACY_DELETE_COMPLETE');
assert.equal(successor.currentAuthority.routeRegistry,cut.currentRouteAuthority);
assert.equal(successor.currentAuthority.priorityCutover,'content/customer-experience-rebuild/migration/priority-route-cutover-registry-v3.json');
assert.equal(successor.authorityBoundary.physicalLegacyDeletePerformed,true);
assert.equal(acceptance.status,'MACHINE_ACCEPTED_PHYSICAL_LEGACY_DELETE_COMPLETE');

for(const item of plan.candidates){
  assert.equal(exists(item.path),false,`legacy presentation still exists: ${item.path}`);
  for(const legacy of item.legacyRoutes){
    const surface=cut.surfaces.find(s=>s.surfaceId===item.surface || (item.surface==='ASK'&&s.surfaceId==='ASK'));
    assert.ok(surface,`missing P1 surface for ${item.path}`);
    assert.ok(redirects.includes(`${legacy} ${surface.canonicalPath} 308`),`compatibility redirect missing ${legacy} -> ${surface.canonicalPath}`);
  }
}

for(const surface of cut.surfaces){
  assert.ok(exists(surface.htmlPath),`canonical P1 surface missing: ${surface.htmlPath}`);
  const page=read(surface.htmlPath);
  assert.ok(page.includes(`/assets/customer-ui/js/shell.js`),`${surface.surfaceId} missing current CX shell`);
  assert.equal(page.includes('/assets/js/public-shell-v2.js'),false,`${surface.surfaceId} leaked retired PX2 shell`);
  assert.equal(page.includes('/assets/css/phios-public-v2.css'),false,`${surface.surfaceId} leaked retired PX2 CSS`);
  const route=routes.routes.find(r=>r.routeId===surface.surfaceId);
  assert.ok(route,`current route missing ${surface.surfaceId}`);
  assert.equal(route.canonicalPath,surface.canonicalPath);
  assert.equal(route.productionBrowserAccepted,true);
  assert.equal(route.physicalLegacyPresentationDeleted,true);
}

for(const protectedPath of ['functions','content/professional','content/financial','content/knowledge','content/reality','scripts']){
  assert.ok(exists(protectedPath),`protected authority/runtime path deleted: ${protectedPath}`);
}
for(const key of ['backendAuthorityDeleted','runtimeAuthorityDeleted','methodAuthorityDeleted','knowledgeAuthorityDeleted','financialAuthorityDeleted','realityAuthorityDeleted','reportAuthorityDeleted'])assert.equal(acceptance[key],false,key);

console.log('✓ P1 PHYSICAL LEGACY DELETE passed: 7 retired public presentation files are physically absent while all compatibility routes remain direct 308 redirects to the four canonical P1 surfaces.');
console.log('  Production browser acceptance is recorded from the user-confirmed phase transition; backend/runtime/Knowledge/Financial/Reality/Report authorities remain intact.');
console.log('✓ P1 EXIT: PHYSICAL_LEGACY_DELETE_COMPLETE · READY_FOR_POST_CUTOVER_HUMAN_PRODUCTION_TEST');
