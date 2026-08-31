import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {assertPprCurrentSharedOwner} from './lib/ppr-current-shared-owner.mjs';

const ROOT='content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3';
const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const map=readJson(`${ROOT}/audit/HD-PRO-R3-W0-current-owner-map.json`);
const protectedFiles=readJson(`${ROOT}/audit/HD-PRO-R3-W0-protected-files.json`);
const publish=readJson('content/professional/personal-reality/r5/authority/ppr-r5-hd-pro-r2-customer-published-successor-v1.json');
const r2Cutover=readJson('content/customer-experience-rebuild/hd-pro-r2/hd-w10-production-cutover-v1.json');
const hdrFreeze=readJson('content/professional/core-method-runtime/hdr-production-freeze-v1.json');
const hdrBoundary=readJson('content/professional/method-production-activation/registries/mpa-hdr-boundary-readiness-v1.json');

assert.equal(map.schemaVersion,'PHI-OS-HD-PRO-R3-W0-CURRENT-OWNER-MAP-v1.0.0');
assert.equal(map.baselineCommit,'dae24c1dd8de49a6c238ddffb8d52b388e8da10d');
assert.equal(map.status,'OWNER_FROZEN_R3_SHADOW');
assert.deepEqual(map.freezeRules,['NO_SECOND_HD_REGISTRY','NO_SECOND_CUSTOMER_RENDERER','NO_SECOND_READING_ENGINE','NO_PARALLEL_HUMAN_DESIGN_TREE']);
assert.equal(map.hardBoundaries.phiosHumanDesignBirthCalculationAuthority,false);
assert.equal(map.hardBoundaries.externalConfirmedChartAuthority,true);
assert.equal(map.hardBoundaries.importedReportEqualsPhiosCalculatedChart,false);
assert.equal(map.hardBoundaries.atomicMeaningEqualsCustomerReading,false);
assert.equal(map.hardBoundaries.automaticVariableOrPHSCalculationAllowed,false);
assert.equal(map.hardBoundaries.r2HumanReviewMayAutoAdmitR3Semantics,false);

const reconciliationPaths=[`${ROOT}/audit/HD-PRO-R3-W4-current-owner-reconciliation-v1.json`,`${ROOT}/audit/HD-PRO-R3-W11-current-owner-reconciliation-v1.json`];
const reconciliations=reconciliationPaths.filter(path=>fs.existsSync(path)).map(readJson);
const reconciledByRole=new Map();
for(const reconciliation of reconciliations){
  assert(['PHI-OS-HD-PRO-R3-W4-CURRENT-OWNER-RECONCILIATION-v1.0.0','PHI-OS-HD-PRO-R3-W11-CURRENT-OWNER-RECONCILIATION-v1.0.0'].includes(reconciliation.schemaVersion),'Unknown HD owner-reconciliation schema');
  assert.equal(reconciliation.status,'SAME_OWNER_PATH_DRIFT_RECONCILED_NO_HD_OWNER_FORK');
  assert.equal(reconciliation.policy.historicalW0FreezeRewritten,false);
  assert.equal(reconciliation.policy.secondCustomerRendererCreated,false);
  assert.equal(reconciliation.policy.secondCustomerRouteCreated,false);
  for(const record of reconciliation.reconciledOwners||[])reconciledByRole.set(record.role,record);
}
const sharedCurrentOwners=new Set(['customerRendererOwner','customerRouteOwner']);
for(const [role,record] of Object.entries(map.owners)){
  assert.equal(fs.existsSync(record.path),true,`${role} owner missing: ${record.path}`);
  const currentSha=sha(record.path);
  if(record.sha256!==currentSha){
    if(sharedCurrentOwners.has(role)){
      const successor=assertPprCurrentSharedOwner(record.path,{historicalDigest:record.sha256,label:`HD-PRO-R3 ${role}`});
      assert.equal(successor.currentSha256,currentSha,`${role} current shared-owner registry digest mismatch`);
      continue;
    }
    const reconciled=reconciledByRole.get(role);
    assert(reconciled,`${role} owner drifted after W0 freeze without successor reconciliation`);
    assert.equal(reconciled.path,record.path,`${role} owner path changed during reconciliation`);
    assert.equal(reconciled.w0FrozenSha256,record.sha256,`${role} reconciliation lost W0 frozen digest`);
    assert.equal(reconciled.currentMainSha256,currentSha,`${role} reconciliation digest does not match current main`);
    assert.equal(reconciled.ownerPathChanged,false,`${role} must remain the same canonical owner path`);
  }
}
for(const item of protectedFiles.protectedFiles){
  assert.equal(fs.existsSync(item.path),true,`protected HD file missing: ${item.path}`);
  assert.equal(item.sha256,sha(item.path),`protected HD file mutated: ${item.path}`);
}
assert.equal(protectedFiles.mutationPolicy,'SUCCESSOR_ONLY_NO_HISTORICAL_REWRITE');
assert.equal(publish.status,'HD_PRO_R2_CUSTOMER_PUBLISHED_SUCCESSOR_ACTIVE');
assert.equal(publish.cutover.customerPublicationState,'CUSTOMER_PUBLISHED');
assert.equal(publish.humanAdmission.status,'HUMAN_ACCEPTED_24_OF_24');
assert.equal(r2Cutover.cutover.customerInterpretiveReading,'CUSTOMER_PUBLISHED');
assert.equal(r2Cutover.cutover.realityComposition,'CUSTOMER_PUBLISHED');
assert.equal(hdrFreeze.productionStatus,'blocked');
assert.equal(hdrFreeze.executionMode,'validation_only');
assert.equal(hdrBoundary.productionExecutionAllowed,false);
assert.equal(hdrBoundary.publicMethodExecutionAllowed,false);
assert.equal(map.r3SuccessorPolicy.r2RuntimeMustRemainDefaultUntilR3HumanAccepted,true);
assert.equal(map.r3SuccessorPolicy.r3DefaultPublicationState,'SHADOW_CANDIDATE');

const pkg=readJson('package.json');
assert.equal(pkg.scripts['check:hd-pro-r3:w0'],'node scripts/check-hd-pro-r3-w0-current-authority.mjs');
assert.equal(pkg.scripts['check:hd-pro-r3'],'node scripts/check-hd-pro-r3.mjs');

console.log('✓ HD-PRO-R3-W0 Current Authority & Owner Freeze passed.');
console.log('  R2 remains CUSTOMER_PUBLISHED; R3 is SHADOW_CANDIDATE; no Human Design calculation authority was created.');
