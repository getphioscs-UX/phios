import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const text=p=>fs.readFileSync(p,'utf8');
const deletePlanPath='content/customer-experience-rebuild/migration/p1-legacy-delete-plan-v2.json';
const p1Deleted=fs.existsSync(deletePlanPath)&&read(deletePlanPath).status==='PHYSICAL_LEGACY_PRESENTATION_DELETE_COMPLETE';
const historical='scripts/check-px2-stage16-successor.mjs';

// Stage16 remains historical evidence. Before the P1 physical deletion it can still
// execute against its original presentation files. After deletion, current PX2
// acceptance must use the versioned P1 successor instead of resurrecting retired UI.
if(!p1Deleted){
  const historicalResult=spawnSync(process.execPath,['--no-warnings',historical],{cwd:process.cwd(),encoding:'utf8'});
  assert.equal(historicalResult.status,0,`${historical}\n${historicalResult.stdout}\n${historicalResult.stderr}`);
  process.stdout.write(historicalResult.stdout);
}else{
  assert.ok(fs.existsSync(historical),'historical Stage16 checker evidence missing');
  assert.ok(fs.existsSync('content/web-production/px2/successors/px2-stage16-public-ia-successor-v2.json'),'historical Stage16 successor evidence missing');
}

const successorPath=p1Deleted
  ?'content/customer-experience-rebuild/migration/px2-cx-p1-public-ia-successor-v3.json'
  :'content/customer-experience-rebuild/migration/px2-cx-p1-public-ia-successor-v2.json';
const successor=read(successorPath);
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

assert.equal(successor.status,p1Deleted?'ACTIVE_P1_BROWSER_ACCEPTED_PHYSICAL_LEGACY_DELETE_COMPLETE':'ACTIVE_P1_ROUTE_CUTOVER_SUCCESSOR_BROWSER_ACCEPTANCE_PENDING');
assert.equal(predecessor.status,successor.predecessor.status);
assert.equal(successor.predecessor.mutated,false);
assert.deepEqual(successor.currentPrimaryNavigation,routes.primaryNavigation);
assert.deepEqual(successor.currentUtilities,routes.utilities);
assert.deepEqual(spine.sequence,['UNDERSTAND','READ','CHOOSE','ACT','OBSERVE','REVIEW','CONTINUE']);
assert.equal(cutover.status,p1Deleted?'P1_ROUTE_CUTOVER_BROWSER_ACCEPTED_PHYSICAL_LEGACY_DELETE_COMPLETE':'P1_ROUTE_CUTOVER_COMPLETE_PRODUCTION_BROWSER_ACCEPTANCE_PENDING');
assert.equal(successor.legacyRoutePolicy.stage16SemanticsPreserved,true);
assert.equal(successor.legacyRoutePolicy.legacyRoutesMayRemainInCurrentCxNavigation,false);
assert.equal(successor.authorityBoundary.backendAuthorityCreated,false);
assert.equal(successor.authorityBoundary.methodAuthorityCreated,false);
assert.equal(successor.authorityBoundary.knowledgeAuthorityCreated,false);
assert.equal(successor.authorityBoundary.physicalLegacyDeletePerformed,p1Deleted);

for(const [routeId,canonicalPath] of Object.entries(successor.priorityCanonicalDestinations)){
  const route=routes.routes.find(item=>item.routeId===routeId);
  assert.ok(route,`missing current route ${routeId}`);
  assert.equal(route.canonicalPath,canonicalPath);
  if(p1Deleted){assert.equal(route.productionBrowserAccepted,true);assert.equal(route.physicalLegacyPresentationDeleted,true);}
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
if(p1Deleted){
  const deletePlan=read(successor.currentAuthority.legacyDeletePlan);
  assert.equal(deletePlan.physicalDeleteCount,7);
  for(const candidate of deletePlan.candidates) assert.equal(fs.existsSync(candidate.path),false,`retired P1 presentation still exists: ${candidate.path}`);
}
assert.ok(navigationAuthority&&Array.isArray(navigationAuthority.primary)&&Array.isArray(navigationAuthority.utilities),'current CX navigation module does not export the expected semantic authority');
for(const item of routes.primaryNavigation){
  const route=routes.routes.find(candidate=>candidate.routeId===item);assert.ok(route);
  const navItem=navigationAuthority.primary.find(candidate=>candidate.id===item);assert.ok(navItem,`current navigation authority missing primary item ${item}`);
  assert.equal(navItem.href,route.canonicalPath,`current navigation authority route mismatch for ${item}`);
}
for(const item of routes.utilities.filter(value=>value!=='LOCALE')) assert.ok(navigationAuthority.utilities.some(candidate=>candidate.id===item),`current navigation authority missing utility ${item}`);
assert.equal(navigation.includes('/personal-runtime'),false);
assert.equal(navigation.includes('/financial-reality'),false);
assert.equal(navigation.includes('/my-reality'),false);
assert.equal(shell.includes('public-shell-v2'),false);
assert.equal(shell.includes('Φ'),false);

for(const token of ['localizeCrossPerspectiveClaims','MutationObserver','readStorage','writeStorage']) assert.ok(locale.includes(token),`PRE-R20 locale reconciliation missing ${token}`);
assert.match(locale,/writeStorage\(KEY,next\)/,'PRE-R20 locale reconciliation lost the CX locale storage write');
assert.match(locale,/writeStorage\('phiOSLocale',next\)/,'PRE-R20 locale reconciliation lost the predecessor locale compatibility write');
assert.match(personalCss,/\.cx-personal \.cx-place-confirmed\[hidden\][^{]*\{display:none!important\}/s,'PRE-R20 Personal Reality hidden-state hotfix missing');
assert.match(personalCss,/\.cx-personal \[data-cx-asset-fallback\]\[hidden\][^{]*\{display:none!important\}/s,'PRE-R20 Personal Reality asset fallback hotfix missing');
assert.match(personalCss,/\.cx-personal \.cx-bazi-school-surface[\s\S]*?display:none!important/,'PRE-R20 Personal Reality BaZi customer-surface suppression missing');

if(p1Deleted){
  assert.equal(cutover.productionBrowserAcceptance.status,'HUMAN_ACCEPTED');
  assert.equal(cutover.physicalDelete.status,'COMPLETE');
  assert.equal(cutover.physicalDelete.performed,true);
}else{
  const home=text('index.html');
  for(const compatibilityHref of ['/personal-runtime','/financial-reality','/my-reality']) assert.ok(home.includes(`href="${compatibilityHref}"`),`Stage16 home compatibility route missing ${compatibilityHref}`);
  assert.equal(cutover.productionBrowserAcceptance.status,'PENDING_PRODUCTION_BROWSER_ACCEPTANCE');
  assert.equal(cutover.physicalDelete.status,'BLOCKED_UNTIL_PRODUCTION_BROWSER_ACCEPTANCE');
}

console.log('✓ PX2 → Stage16 → CX-P1 current public IA successor passed.');
console.log('  Current navigation is validated from the exported semantic CX_NAVIGATION authority, not whitespace-sensitive source formatting.');
console.log('  PRE-R20 shared-file reconciliation passed: locale keeps safe dual-key persistence plus dynamic cross-perspective localization; Personal Reality keeps the parallel customer-surface hotfix.');
console.log(p1Deleted?'  P1 browser acceptance is recorded and seven retired presentation files are physically deleted; Stage16 remains historical evidence only.':'  P1 current route authority is active for four priority surfaces; Ask is canonical at /knowledge/ask/ while compatibility aliases remain 308 redirects; browser acceptance remains pending.');
