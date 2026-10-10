import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const checks=[
  'scripts/check-pvp-r1-vis-w10-ecr-mandala-visual-census.mjs',
  'scripts/check-pvp-r1-vis-w11-ecr-mandala-hierarchy.mjs',
  'scripts/check-pvp-r1-vis-w12-ecr-mandala-selected-path.mjs',
  'scripts/check-pvp-r1-vis-w13-ecr-mandala-semantic-zoom.mjs',
  'scripts/check-pvp-r1-vis-w14-ecr-mandala-free-paid.mjs',
  'scripts/check-pvp-r1-vis-w15-ecr-mandala-topic-lens.mjs',
  'scripts/check-pvp-r1-vis-w16-ecr-mandala-mobile-fullscreen.mjs'
];
for(const checker of checks){
  const r=spawnSync(process.execPath,[checker],{cwd:process.cwd(),stdio:'inherit'});
  assert.equal(r.status,0,checker);
}
const p8=read('content/integrated-master-work/phase8/p8-current-reconciliation-v1.json');
const acc=read('content/product-visual-platform-r1/acceptance/successors/phase8/pvp-r1-vis-ecr-w10-w16-current-acceptance-v1.json');
const freeze=read('content/product-visual-platform-r1/freeze/pvp-r1-vis-ecr-w10-w16-phase8-freeze-v1.json');
assert.equal(p8.status,'CURRENT_ECR_SUCCESSOR_RECONCILED_W10_W16_VERIFIED');
assert.equal(p8.phase8ExitComplete,true);
assert.equal(p8.phase9Authorized,true);
assert.equal(p8.nextWorkStep,'PHASE9_ZV_R3_PVP_W17_W24');
assert.equal(p8.boundaries.newEcrTruthCreated,false);
assert.equal(p8.boundaries.ecrCalculationChanged,false);
assert.equal(p8.boundaries.ecrMeaningChanged,false);
assert.equal(p8.boundaries.duplicateMandalaCreated,false);
assert.equal(p8.boundaries.paidCommerceActivatedByPvp,false);
assert.equal(p8.boundaries.productionPriceCreatedByPvp,false);
assert.equal(p8.boundaries.phase9WorkExecutedByThisReconciliation,false);
assert.equal(acc.status,'MACHINE_ACCEPTED_CURRENT_ECR_W10_W16');
assert.ok(Object.values(acc.checks).every(Boolean));
assert.equal(freeze.status,'PVP_R1_VIS_ECR_W10_W16_PHASE8_FROZEN');
assert.equal(freeze.frozenExit.phase9Authorized,true);
assert.equal(freeze.preservedBoundaries.singleExistingMandalaReused,true);
assert.equal(freeze.preservedBoundaries.paidCommerceActivationPerformed,false);
assert.equal(freeze.preservedBoundaries.phase9ExecutedByThisFreeze,false);
console.log('✓ PHASE 8 ECR W10–W16 current verification passed and frozen.');
console.log('  One existing 8-layer / 145-node Mandala is reused; W12–W16 are accepted; Phase 9 Zi Wei is authorized but not executed.');
