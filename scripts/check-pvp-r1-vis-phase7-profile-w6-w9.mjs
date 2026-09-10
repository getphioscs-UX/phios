import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const checks=[
  'scripts/check-pvp-r1-vis-w6-profile-output-authority-current.mjs',
  'scripts/check-profile-ppr-customer-output-successor.mjs',
  'scripts/check-profile-ppr-all-pfig-visual-authority.mjs',
  'scripts/check-pvp-r1-vis-w7-profile-projection-ir.mjs',
  'scripts/check-pvp-r1-vis-w8-profile-visual-current.mjs',
  'scripts/check-pvp-r1-vis-w9-profile-free-paid.mjs'
];
for(const checker of checks){const r=spawnSync(process.execPath,[checker],{cwd:process.cwd(),stdio:'inherit'});assert.equal(r.status,0,checker);}
const acc=read('content/product-visual-platform-r1/acceptance/successors/phase7/pvp-r1-vis-profile-w6-w9-current-acceptance-v1.json');
const freeze=read('content/product-visual-platform-r1/freeze/pvp-r1-vis-profile-w6-w9-phase7-freeze-v1.json');
const p7=read('content/integrated-master-work/phase7/p7-current-reconciliation-v1.json');
assert.equal(acc.status,'MACHINE_ACCEPTED_CURRENT_PROFILE_W6_W9');
assert.ok(Object.values(acc.checks).every(Boolean));
assert.equal(freeze.status,'PVP_R1_VIS_PROFILE_W6_W9_PHASE7_FROZEN');
assert.equal(freeze.frozenExit.phase8Authorized,true);
assert.equal(freeze.preservedBoundaries.profilePaidCommerceActivationPerformed,false);
assert.equal(p7.phase7ExitComplete,true);
assert.equal(p7.phase8Authorized,true);
assert.equal(p7.boundaries.phase8WorkExecutedByThisReconciliation,false);
console.log('✓ PHASE 7 Profile W6–W9 current verification passed and frozen.');
console.log('  W6 authority, W7 9/9 IR, W8 current MVP wrapper and W9 Free/Paid depth are verified; Phase 8 ECR is authorized but not executed.');
