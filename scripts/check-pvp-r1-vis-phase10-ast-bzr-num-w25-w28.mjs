import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
for(const script of ['scripts/check-pvp-r1-vis-w25-ast-snapshot.mjs','scripts/check-pvp-r1-vis-w26-bzr-snapshot.mjs','scripts/check-pvp-r1-vis-w27-num-snapshot.mjs','scripts/check-pvp-r1-vis-w28-paid-depth-projection.mjs']){
 const r=spawnSync(process.execPath,[script],{stdio:'inherit',cwd:process.cwd(),env:process.env}); assert.equal(r.status,0,`${script} failed`);
}
const rec=j('content/integrated-master-work/phase10/p10-current-reconciliation-v1.json');
const acc=j('content/product-visual-platform-r1/acceptance/successors/phase10/pvp-r1-vis-ast-bzr-num-w25-w28-current-acceptance-v1.json');
const freeze=j('content/product-visual-platform-r1/freeze/pvp-r1-vis-ast-bzr-num-w25-w28-phase10-freeze-v1.json');
const contract=j('content/product-visual-platform-r1/method-snapshots/pvp-r1-vis-w25-w28-method-snapshot-contract-v1.json');
assert.equal(rec.status,'CURRENT_AST_BZR_NUM_SUCCESSORS_RECONCILED_W25_W28_VERIFIED');
assert.equal(rec.phase10ExitComplete,true); assert.equal(rec.phase11Authorized,true); assert.equal(rec.boundaries.visualProjectionOnly,true);
assert.equal(rec.boundaries.newAstCalculationRuntimeCreated,false);assert.equal(rec.boundaries.newBzrCalculationRuntimeCreated,false);assert.equal(rec.boundaries.newNumCalculationRuntimeCreated,false);assert.equal(rec.boundaries.newMfigScopeCreated,false);assert.equal(rec.boundaries.paidCommerceActivatedByPvp,false);assert.equal(rec.boundaries.existingProfessionalReadingRetroactivelyLocked,false);
for(const x of rec.authoritySnapshot){assert.equal(sha(x.path),x.sha256,`authority snapshot drift ${x.path}`)}
assert.equal(acc.status,'MACHINE_ACCEPTED_CURRENT_AST_BZR_NUM_W25_W28'); assert.equal(acc.phase11Authorized,true); assert.equal(acc.phase11Executed,false);
for(const v of Object.values(acc.checks))assert.equal(v,true,'aggregate acceptance check false');
assert.equal(freeze.status,'PVP_R1_VIS_AST_BZR_NUM_W25_W28_PHASE10_FROZEN');assert.equal(freeze.frozenExit.phase11Authorized,true);assert.equal(freeze.preservedBoundaries.phase11ExecutedByThisFreeze,false);
assert.equal(contract.paidDepthPolicy.defaultState,'FREE');assert.equal(contract.paidDepthPolicy.serverEntitlementRequired,true);assert.equal(contract.paidDepthPolicy.existingProfessionalReadingRetroactivelyLocked,false);assert.equal(contract.authorityBoundary.phase11NotExecuted,true);
console.log('✓ PVP Phase 10 AST/BZR/NUM W25–W28 passed: method-native snapshots are source-only, existing MFIG/MCD authority is reused, paid visual depth fails closed, and Phase 11 is authorized but not executed.');
