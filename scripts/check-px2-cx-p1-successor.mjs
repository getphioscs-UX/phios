import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';

const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const text=path=>fs.readFileSync(path,'utf8');
const historical='scripts/check-px2-stage16-successor.mjs';
const historicalResult=spawnSync(process.execPath,['--no-warnings',historical],{cwd:process.cwd(),encoding:'utf8'});
assert.equal(historicalResult.status,0,`${historical}\n${historicalResult.stdout}\n${historicalResult.stderr}`);
process.stdout.write(historicalResult.stdout);

const successor=read('content/customer-experience-rebuild/migration/px2-cx-p1-public-ia-successor-v1.json');
const predecessor=read(successor.predecessor.path);
const routes=read(successor.currentAuthority.routeRegistry);
const spine=read(successor.currentAuthority.customerSpine);
const cutover=read(successor.currentAuthority.priorityCutover);
const redirects=text('_redirects');
const navigation=text(successor.currentAuthority.navigationRuntime);
const navigationModule=await import(pathToFileURL(path.resolve(successor.currentAuthority.navigationRuntime)).href);
const navigationAuthority=navigationModule.CX_NAVIGATION;
const shell=text(successor.currentAuthority.shellRuntime);
const locale=text('assets/customer-ui/js/locale.js');
const personalCss=text('assets/customer-ui/surfaces/personal-reality.css');

assert.equal(successor.status,'ACTIVE_CX_P1_PUBLIC_IA_SUCCESSOR');
assert.equal(predecessor.status,successor.predecessor.status);
assert.equal(successor.predecessor.mutated,false);
assert.deepEqual(successor.currentPrimaryNavigation,routes.primaryNavigation);
assert.deepEqual(successor.currentUtilities,routes.utilities);
assert.deepEqual(spine.sequence,['UNDERSTAND','READ','CHOOSE','ACT','OBSERVE','REVIEW','CONTINUE']);
assert.equal(cutover.status,'CODE_CUTOVER_COMPLETE_PRODUCTION_BROWSER_ACCEPTANCE_PENDING');
assert.equal(successor.legacyRoutePolicy.stage16SemanticsPreserved,true);
assert.equal(successor.legacyRoutePolicy.legacyRoutesMayRemainInCurrentCxNavigation,false);
assert.equal(successor.authorityBoundary.backendAuthorityCreated,false);
assert.equal(successor.authorityBoundary.methodAuthorityCreated,false);
assert.equal(successor.authorityBoundary.knowledgeAuthorityCreated,false);

for(const [routeId,canonicalPath] of Object.entries(successor.priorityCanonicalDestinations)){
  const route=routes.routes.find(item=>item.routeId===routeId);
  assert.ok(route,`missing current route ${routeId}`);
  assert.equal(route.canonicalPath,canonicalPath);
}
for(const surface of cutover.surfaces){
  assert.ok(fs.existsSync(surface.htmlPath),`missing P1 surface ${surface.htmlPath}`);
  const page=text(surface.htmlPath);
  assert.ok(page.includes('/assets/customer-ui/js/shell.js'),`${surface.surfaceId} missing CX shell`);
  assert.ok(page.includes('data-cx-header'),`${surface.surfaceId} missing CX header mount`);
  assert.ok(page.includes('data-cx-footer'),`${surface.surfaceId} missing CX footer mount`);
  assert.equal(page.includes('/assets/js/public-shell-v2.js'),false,`${surface.surfaceId} retained Stage16 shell`);
  for(const legacy of surface.legacyRoutes){
    assert.ok(redirects.includes(`${legacy} ${surface.canonicalPath} 308`),`missing redirect ${legacy}`);
  }
}
assert.ok(navigationAuthority&&Array.isArray(navigationAuthority.primary)&&Array.isArray(navigationAuthority.utilities),'current CX navigation module does not export the expected semantic authority');
for(const item of routes.primaryNavigation){
  const route=routes.routes.find(candidate=>candidate.routeId===item);
  assert.ok(route);
  const navItem=navigationAuthority.primary.find(candidate=>candidate.id===item);
  assert.ok(navItem,`current navigation authority missing primary item ${item}`);
  assert.equal(navItem.href,route.canonicalPath,`current navigation authority route mismatch for ${item}`);
}
for(const item of routes.utilities.filter(value=>value!=='LOCALE')){
  assert.ok(navigationAuthority.utilities.some(candidate=>candidate.id===item),`current navigation authority missing utility ${item}`);
}
assert.equal(navigation.includes('/personal-runtime'),false);
assert.equal(navigation.includes('/financial-reality'),false);
assert.equal(navigation.includes('/my-reality'),false);
assert.equal(shell.includes('public-shell-v2'),false);
assert.equal(shell.includes('Φ'),false);

// PRE-R20 shared-file reconciliation: preserve both the R5 shell locale contract and the later cross-perspective projection.
for(const token of ['localizeCrossPerspectiveClaims','MutationObserver','readStorage','writeStorage']){
  assert.ok(locale.includes(token),`PRE-R20 locale reconciliation missing ${token}`);
}
assert.match(locale,/writeStorage\(KEY,next\)/,'PRE-R20 locale reconciliation lost the CX locale storage write');
assert.match(locale,/writeStorage\('phiOSLocale',next\)/,'PRE-R20 locale reconciliation lost the predecessor locale compatibility write');
assert.match(personalCss,/\.cx-personal \.cx-place-confirmed\[hidden\][^{]*\{display:none!important\}/s,'PRE-R20 Personal Reality hidden-state hotfix missing');
assert.match(personalCss,/\.cx-personal \[data-cx-asset-fallback\]\[hidden\][^{]*\{display:none!important\}/s,'PRE-R20 Personal Reality asset fallback hotfix missing');
assert.match(personalCss,/\.cx-personal \.cx-bazi-school-surface[\s\S]*?display:none!important/,'PRE-R20 Personal Reality BaZi customer-surface suppression missing');

const home=text('index.html');
for(const compatibilityHref of ['/personal-runtime','/financial-reality','/my-reality']){
  assert.ok(home.includes(`href="${compatibilityHref}"`),`Stage16 home compatibility route missing ${compatibilityHref}`);
}
assert.equal(cutover.productionHumanAcceptance.status,'PENDING_DEPLOYMENT');
assert.equal(cutover.physicalDelete.status,'BLOCKED_UNTIL_PRODUCTION_BROWSER_ACCEPTANCE');

console.log('✓ PX2 → Stage16 → CX-P1 current public IA successor passed.');
console.log('  Current navigation is validated from the exported semantic CX_NAVIGATION authority, not whitespace-sensitive source formatting.');
console.log('  PRE-R20 shared-file reconciliation passed: locale keeps safe dual-key persistence plus dynamic cross-perspective localization; Personal Reality keeps the parallel customer-surface hotfix.');
console.log('  Stage16 homepage compatibility routes resolve through server redirects to four CX-cutover surfaces; production browser acceptance remains pending.');
