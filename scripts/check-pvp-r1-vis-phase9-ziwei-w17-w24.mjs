import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const checks=[
 'scripts/check-pvp-r1-vis-w17-ziwei-customer-density.mjs','scripts/check-pvp-r1-vis-w18-ziwei-authority-scope.mjs','scripts/check-pvp-r1-vis-w19-ziwei-twelve-palace.mjs','scripts/check-pvp-r1-vis-w20-ziwei-priority-map.mjs','scripts/check-pvp-r1-vis-w21-ziwei-four-transformations.mjs','scripts/check-pvp-r1-vis-w22-ziwei-timing-timeline.mjs','scripts/check-pvp-r1-vis-w23-ziwei-topic-map.mjs','scripts/check-pvp-r1-vis-w24-ziwei-experience-states.mjs'
];
for(const checker of checks){const r=spawnSync(process.execPath,[checker],{cwd:process.cwd(),stdio:'inherit'});assert.equal(r.status,0,checker);}
const rec=read('content/integrated-master-work/phase9/p9-current-reconciliation-v1.json');
const acc=read('content/product-visual-platform-r1/acceptance/successors/phase9/pvp-r1-vis-ziwei-w17-w24-current-acceptance-v1.json');
const freeze=read('content/product-visual-platform-r1/freeze/pvp-r1-vis-ziwei-w17-w24-phase9-freeze-v1.json');
assert.equal(rec.status,'CURRENT_ZIWEI_SUCCESSOR_RECONCILED_W17_W24_VERIFIED');assert.equal(rec.phase9ExitComplete,true);assert.equal(rec.phase10Authorized,true);assert.equal(rec.nextWorkStep,'PHASE10_AST_BZR_NUM_PVP_W25_W28');
for(const x of rec.authoritySnapshot)assert.equal(sha(x.path),x.sha256,`authority snapshot drift ${x.path}`);
assert.equal(rec.boundaries.newZiweiCalculationRuntimeCreated,false);assert.equal(rec.boundaries.ziweiCalculationChanged,false);assert.equal(rec.boundaries.ziweiMeaningChanged,false);assert.equal(rec.boundaries.newZiweiTruthAuthorityCreated,false);assert.equal(rec.boundaries.fakeNumericScoringCreated,false);assert.equal(rec.boundaries.eventPredictionCreated,false);assert.equal(rec.boundaries.paidCommerceActivatedByPvp,false);assert.equal(rec.boundaries.productionPriceCreatedByPvp,false);assert.equal(rec.boundaries.phase10WorkExecutedByThisReconciliation,false);
assert.equal(acc.status,'MACHINE_ACCEPTED_CURRENT_ZIWEI_W17_W24');assert.ok(Object.values(acc.checks).every(Boolean));assert.equal(acc.phase10Authorized,true);
assert.equal(freeze.status,'PVP_R1_VIS_ZIWEI_W17_W24_PHASE9_FROZEN');assert.equal(freeze.frozenExit.phase10Authorized,true);assert.equal(freeze.preservedBoundaries.pvpRole,'PROJECTION_ONLY');assert.equal(freeze.preservedBoundaries.phase10ExecutedByThisFreeze,false);
console.log('✓ PHASE 9 ZV-R3 / PVP W17–W24 current verification passed and frozen.');
console.log('  Existing Zi Wei truth is reused; MFIG-051–058 carry projection identity only; Phase 10 AST/BZR/NUM is authorized but not executed.');
