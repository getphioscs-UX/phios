import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const text=p=>fs.readFileSync(p,'utf8');
const historical='scripts/check-p1-browser-r1-blocker-repair.mjs';
const historicalRun=spawnSync(process.execPath,['--no-warnings',historical],{cwd:process.cwd(),encoding:'utf8'});
assert.equal(historicalRun.status,0,`${historical}\n${historicalRun.stdout}\n${historicalRun.stderr}`);

const acceptance=read('content/customer-experience-rebuild/acceptance/p1-production-browser-acceptance-v1.json');
const cutover=read('content/customer-experience-rebuild/migration/priority-route-cutover-registry-v3.json');
const routes=read('content/customer-experience-rebuild/authority/canonical-customer-route-registry-v5.json');
const deletePlan=read('content/customer-experience-rebuild/migration/p1-legacy-delete-plan-v2.json');
const brand=read('content/customer-experience-rebuild/authority/customer-brand-asset-authority-v4.json');
const blocker=read('content/customer-experience-rebuild/acceptance/p1-browser-r1-blocker-repair-acceptance-v1.json');
const shell=text('assets/customer-ui/js/shell.js');

assert.equal(blocker.status,'CODE_REPAIRED_PRODUCTION_BROWSER_RECHECK_REQUIRED','historical blocker-repair evidence drift');
assert.equal(acceptance.status,'HUMAN_ACCEPTED_BY_USER_CONFIRMATION');
assert.equal(acceptance.browserAcceptance,true);
assert.equal(acceptance.physicalLegacyDeleteAllowed,true);
assert.equal(acceptance.individualMatrixAssertionsInvented,false,'browser acceptance evidence must not invent per-cell observations');
assert.equal(cutover.productionBrowserAcceptance.status,'HUMAN_ACCEPTED');
assert.equal(cutover.physicalDelete.status,'COMPLETE');
assert.equal(cutover.physicalDelete.performed,true);
assert.equal(deletePlan.status,'PHYSICAL_LEGACY_PRESENTATION_DELETE_COMPLETE');
assert.equal(routes.status,'P1_PRIORITY_ROUTES_ACTIVE_BROWSER_ACCEPTED_LEGACY_PRESENTATION_DELETED');
assert.equal(routes.authorityBoundary.productionBrowserAcceptanceSatisfied,true);
assert.equal(brand.currentConsumers.publicHeaderLight,'LOGO-009');
assert.match(shell,/data-cx-asset="LOGO-009"/);
assert.match(shell,/installAskDrawerNavigation/);
assert.match(shell,/location\.assign\(destination\(q\)\)/);
for(const surface of cutover.surfaces){
  assert.ok(fs.existsSync(surface.htmlPath),`browser-accepted canonical P1 surface missing: ${surface.htmlPath}`);
  const page=text(surface.htmlPath);
  assert.match(page,/\/assets\/customer-ui\/js\/shell\.js/);
  assert.doesNotMatch(page,/\/assets\/js\/public-shell-v2\.js/);
}
console.log('✓ P1 production browser acceptance current gate passed: the user-confirmed browser phase transition is recorded without inventing per-matrix observations.');
console.log('  Browser R1 repairs remain intact; current P1 route authority records HUMAN_ACCEPTED and permits the completed physical legacy deletion.');
