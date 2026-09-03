import assert from 'node:assert/strict';
import fs from 'node:fs';

const base='content/customer-experience-rebuild';
const read=(p)=>JSON.parse(fs.readFileSync(p,'utf8'));
const R0_BASELINE='f6d31dafdc37dcf3d8f2ebd1236bfa500b7dc64c';

// R0 is a historical execution-start freeze. Later CX phases are allowed to change the
// working tree, so this checker validates the frozen artifacts and invariants directly.
// It MUST NOT rerun generate-cx-r0-r1-r1a-successor.mjs against the later working tree.
const baseline=read(`${base}/authority/cx-r-baseline-v3.json`);
const surfaces=read(`${base}/audits/surface-inventory-v3.json`);
const css=read(`${base}/audits/css-dependency-audit-v3.json`);
const js=read(`${base}/audits/js-dependency-audit-v3.json`);
const copy=read(`${base}/audits/customer-copy-audit-v2.json`);
const brand=read(`${base}/authority/customer-brand-asset-authority-v3.json`);
const assets=read(`${base}/audits/customer-asset-availability-v2.json`);
const projection=read(`${base}/registries/backend-customer-projection-map-v3.json`);
const noSecond=read(`${base}/contracts/cx-r-no-second-authority-contract-v2.json`);
const acceptance=read(`${base}/acceptance/cx-r0-acceptance-v2.json`);
const reconciliation=read(`${base}/acceptance/cx-r0-freeze-checker-reconciliation-v1.json`);

assert.equal(baseline.baselineCommit,R0_BASELINE);
assert.equal(baseline.sourceMirror.libraryFile,'test.zip');
assert.equal(baseline.rules.backendAuthorityUntouched,true);
assert.equal(baseline.rules.sourceChangedByW0,false);
for(const artifact of [surfaces,css,js,projection,noSecond,acceptance]) {
  if('baselineCommit' in artifact) assert.equal(artifact.baselineCommit,R0_BASELINE,'historical R0 artifact baseline drifted');
}
assert.equal(surfaces.status,'CURRENT_CUSTOMER_SURFACE_INVENTORY_RECONCILED');
assert.ok(surfaces.summary.customerHtmlCount>=100,'frozen customer surface inventory unexpectedly small');
assert.ok(surfaces.summary.cxSurfaceCount>=8,'frozen CX surface census unexpectedly small');
for(const route of ['/','/reality/','/perspectives/','/perspectives/personal/','/professional/financial/']) {
  assert.ok(surfaces.surfaces.some(x=>x.route===route),`frozen surface inventory missing ${route}`);
}
assert.equal(css.status,'CURRENT_CSS_DEPENDENCIES_RECONCILED');
assert.ok(css.summary.customerConsumedStylesheets>0);
assert.equal(js.status,'CURRENT_JS_COMPOSITION_RECONCILED');
assert.ok(js.summary.customerConsumedScripts>0);
assert.equal(copy.rules.newProductionCxMayShowInternalOrDeveloper,false);
assert.equal(brand.canonicalRule,'ONE_CANONICAL_LOGO_AUTHORITY_PER_PRODUCTION_CUSTOMER_PAGE');
assert.equal(assets.rules.silentBlankAllowed,false);
assert.equal(projection.rules.hardCodeAvailableForbidden,true);
assert.equal(noSecond.backendAuthorityUntouched,true);
for(const forbidden of ['calculate method','create meaning','decide knowledge truth','create reality state','make professional judgment','assemble canonical report','determine validation','create metric']) {
  assert.ok(noSecond.cxMustNot.includes(forbidden),`missing no-second-authority boundary: ${forbidden}`);
}
assert.deepEqual(acceptance.requiredExitStates,['CURRENT_SURFACE_INVENTORY_COMPLETE','LEGACY_DEPENDENCIES_MAPPED','NO_SECOND_AUTHORITY','READY_FOR_QUARANTINE']);

assert.equal(reconciliation.status,'HISTORICAL_R0_FREEZE_CHECK_SEPARATED_FROM_LIVE_WORKING_TREE_CENSUS');
assert.equal(reconciliation.resolution.r0SnapshotBaseline,R0_BASELINE);
assert.equal(reconciliation.resolution.r0ArtifactsRemainFrozen,true);
assert.equal(reconciliation.resolution.checkCxR0RegeneratesFromCurrentWorkingTree,false);
assert.equal(reconciliation.rules.phaseFreezeMayBeSilentlyRewritten,false);
assert.equal(reconciliation.rules.liveGuardCoverageRemoved,false);

console.log(`✓ CX-R0 historical freeze passed at f6d31da: ${surfaces.summary.customerHtmlCount} frozen customer HTML surfaces, ${css.summary.customerConsumedStylesheets} frozen stylesheet consumers, ${js.summary.customerConsumedScripts} frozen script consumers.`);
console.log('✓ CX-R0 checker no longer regenerates the R0 census from a later R3/R4 working tree; live R1 guards remain separate.');
console.log('✓ CX-R0 ACCEPTED: CURRENT_SURFACE_INVENTORY_COMPLETE · LEGACY_DEPENDENCIES_MAPPED · NO_SECOND_AUTHORITY · READY_FOR_QUARANTINE');
