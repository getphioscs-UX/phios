import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));
const exists=p=>fs.existsSync(p);
const cut=json('content/customer-experience-rebuild/migration/priority-route-cutover-registry-v2.json');
const routes=json(cut.currentRouteAuthority);
const successor=json('content/customer-experience-rebuild/migration/px2-cx-p1-public-ia-successor-v2.json');
const redirects=read('_redirects');
const shell=read('assets/customer-ui/js/shell.js');

assert.equal(cut.status,'P1_ROUTE_CUTOVER_COMPLETE_PRODUCTION_BROWSER_ACCEPTANCE_PENDING');
assert.equal(cut.surfaces.length,4);
assert.equal(routes.status,'P1_PRIORITY_ROUTE_CUTOVER_ACTIVE_BROWSER_ACCEPTANCE_PENDING');
assert.equal(routes.authorityBoundary.routeCutoverPerformedByP1,true);
assert.equal(routes.authorityBoundary.physicalLegacyDeletePerformed,false);
assert.equal(successor.status,'ACTIVE_P1_ROUTE_CUTOVER_SUCCESSOR_BROWSER_ACCEPTANCE_PENDING');
assert.equal(successor.currentAuthority.routeRegistry,cut.currentRouteAuthority);
assert.equal(successor.currentAuthority.priorityCutover,'content/customer-experience-rebuild/migration/priority-route-cutover-registry-v2.json');
assert.equal(successor.priorityCanonicalDestinations.ASK,'/knowledge/ask/');

const expectedReplacementStatus={
  MY_REALITY:'MY_REALITY_WORKSPACE_REPLACEMENT_ACCEPTED_BROWSER_PENDING',
  PERSONAL_REALITY:'ACCEPTED_PERSONAL_REALITY_CURRENT_MAIN_SUCCESSOR',
  FINANCIAL_REALITY:'ACCEPTED_FINANCIAL_REALITY_CURRENT_MAIN_SUCCESSOR',
  ASK:'MACHINE_VERIFIED_32_OF_32'
};
for(const surface of cut.surfaces){
  assert.ok(exists(surface.htmlPath),`missing P1 successor ${surface.htmlPath}`);
  const route=routes.routes.find(r=>r.routeId===surface.surfaceId);
  assert.ok(route,`missing P1 route ${surface.surfaceId}`);
  assert.equal(route.canonicalPath,surface.canonicalPath,surface.surfaceId);
  assert.equal(route.currentOperationalPath,surface.canonicalPath,surface.surfaceId);
  assert.equal(route.successorPresentationAccepted,true,surface.surfaceId);
  assert.equal(route.routeCutoverPerformedByP1,true,surface.surfaceId);
  const html=read(surface.htmlPath);
  for(const marker of [`data-cx-surface="${surface.dataCxSurface}"`,`href="${surface.canonicalPath}"`,'/assets/customer-ui/js/shell.js','data-cx-header','data-cx-footer']) assert.ok(html.includes(marker),`${surface.surfaceId}: ${marker}`);
  for(const forbidden of ['/assets/css/phios-public-v2.css','/assets/js/public-shell-v2.js','data-puxr-header','data-puxr-footer','data-px2-surface']) assert.equal(html.includes(forbidden),false,`${surface.surfaceId}: legacy ${forbidden}`);
  const replacement=json(surface.replacementAcceptance);
  assert.equal(replacement.status,expectedReplacementStatus[surface.surfaceId],`${surface.surfaceId}: replacement status`);
  for(const legacy of surface.legacyRoutes) assert.ok(redirects.includes(`${legacy} ${surface.canonicalPath} 308`),`missing direct 308 ${legacy} -> ${surface.canonicalPath}`);
}

// Ask cutover: the compatibility URL owns no active UI/runtime and every shared shell entry points to canonical Contextual Ask.
for(const token of ['action="/knowledge/ask/" method="get"','href="/knowledge/ask/"',"footerLink('/knowledge/ask/'"]) assert.ok(shell.includes(token),`shared shell Ask cutover missing ${token}`);
assert.equal(/action="\/ask(?:"|\/)/.test(shell),false,'shared shell still submits to Ask compatibility alias');
assert.equal(/href="\/ask(?:"|\/)/.test(shell),false,'shared shell still links to Ask compatibility alias');
const compat=read('ask.html');
assert.ok(compat.includes('data-cx-compatibility="ASK"'));
assert.ok(compat.includes('href="/knowledge/ask/"'));
for(const forbidden of ['data-cx-ask-form','data-cx-contextual-ask-form','/assets/customer-ui/js/surfaces/ask.js','/assets/customer-ui/js/surfaces/contextual-ask.js','/api/customer-ask','/api/customer-contextual-ask']) assert.equal(compat.includes(forbidden),false,`ask.html remains active UI authority: ${forbidden}`);

// No active P1 or shared CX source should point at the compatibility Ask URL.
const activeFiles=['reality/index.html','perspectives/personal/index.html','professional/financial/index.html','knowledge/ask/index.html','assets/customer-ui/js/shell.js'];
for(const rel of activeFiles){const text=read(rel);assert.equal(/(?:href|action)="\/ask(?:"|\/)/.test(text),false,`${rel} links to compatibility /ask`);}

assert.equal(cut.codeAcceptance.legacyStylesheetsOnP1,0);
assert.equal(cut.codeAcceptance.legacyShellImportsOnP1,0);
assert.equal(cut.codeAcceptance.legacyAskUiAuthorityAtCompatibilityPath,0);
assert.equal(cut.productionBrowserAcceptance.required,true);
assert.equal(cut.productionBrowserAcceptance.status,'PENDING_PRODUCTION_BROWSER_ACCEPTANCE');
assert.equal(cut.productionBrowserAcceptance.matrix.length,8);
assert.equal(cut.physicalDelete.status,'BLOCKED_UNTIL_PRODUCTION_BROWSER_ACCEPTANCE');
assert.equal(cut.physicalDelete.performed,false);
for(const [k,v] of Object.entries(cut.authorityBoundary)) if(k.endsWith('AuthorityCreated')) assert.equal(v,false,k);

console.log('✓ P1 ROUTE CUTOVER passed: four priority routes now use successor customer surfaces and current route authority v4.');
console.log('  Ask PHI OS is canonical at /knowledge/ask/; /ask, /ask.html and knowledge-search aliases are direct 308 compatibility routes only.');
console.log('  Production browser acceptance remains pending; physical legacy deletion is still blocked.');
