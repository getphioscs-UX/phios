import fs from 'node:fs';
import assert from 'node:assert/strict';

const BASE='ba3ac00864644f7ac7861df59ce8c35db7ebad97';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const rec=read('content/professional/method-full-production-recovery/mfp-r-w0-w4-ba3ac00-successor-reconciliation-v1.json');
const w0=read('content/professional/method-full-production-recovery/method-full-production-gap-registry-v1.json');
const w1=read('content/professional/method-full-production-recovery/method-full-production-gap-work-map-v1.json');
const w2=read('content/professional/method-full-production-recovery/mfp-r-w2-selective-fp-closure-v1.json');
const w3=read('content/professional/method-full-production-recovery/mfp-r-r2-regeneration-regression-v1.json');
const w4=read('content/professional/method-full-production-recovery/method-r2-pre-current-reality-freeze-v1.json');

assert.equal(rec.baselineCommit,BASE);
assert.equal(rec.status,'REPLAYED_ON_CURRENT_MAIN_NO_NEW_BLOCKING_OR_MATERIAL_GAPS');
assert.equal(rec.replay.result,'PASS');
assert.equal(rec.replay.w0.benchmarkGapCandidateCount,17);
assert.equal(rec.replay.w0.admittedMethodGapCount,1);
assert.equal(rec.replay.w0.closedNotProductBlockingCount,16);
assert.equal(rec.replay.w0.speculativeGapCount,0);
assert.equal(rec.replay.w1.allAdmittedGapsHaveFullProductionOwner,true);
assert.equal(rec.replay.w1.pprCompensationAllowed,false);
assert.equal(rec.replay.w1.rendererMeaningCompensationAllowed,false);
assert.deepEqual(rec.replay.w2.closedGapRefs,['MFP-R-AST-001']);
assert.equal(rec.replay.w2.newSelectiveClosureRequired,false);
assert.equal(rec.replay.w3.astRegenerationRegression,'IMPROVED');
assert.equal(rec.replay.w3.repeatedParagraphCount,0);
assert.equal(rec.replay.w4.allMethodsCustomerPublishable,true);
assert.equal(rec.replay.w4.crossCustomerPublishable,true);
assert.deepEqual(rec.replay.w4.unresolvedBlockingOrMaterialGaps,[]);
assert.equal(rec.replay.w4.currentRealityEntryAllowed,true);
assert.equal(rec.successorDecision.reopenMethodFullProduction,false);
assert.equal(rec.successorDecision.currentRealityMayProceed,true);

assert.equal(w0.status,'GAP_HARVEST_COMPLETE');
assert.equal(w0.harvest.benchmarkGapCandidateCount,17);
assert.equal(w0.harvest.admittedMethodGapCount,1);
assert.equal(w0.gaps.find(x=>x.gapId==='MFP-R-AST-001')?.status,'CLOSED');
assert.ok(w1);
assert.ok(w2);
assert.ok(w3);
assert.equal(w4.status,'PRE_CURRENT_REALITY_FROZEN');
assert.equal(w4.currentRealityEntryAllowed,true);
assert.deepEqual(w4.unresolvedBlockingOrMaterialGaps,[]);
for(const id of ['AST','BZR','ZWR','NUM','ECR']){
  assert.equal(w4.methods[id]?.state,'CUSTOMER_PUBLISHABLE',`${id} must remain customer-publishable`);
  assert.deepEqual(w4.methods[id]?.blockingGapRefs,[],`${id} must not have a blocking gap`);
}
assert.equal(w4.cross?.state,'CUSTOMER_PUBLISHABLE');

console.log('✓ MFP-R W0–W4 current-main successor reconciliation passed.');
console.log('  Historical recovery authority remains immutable; ba3ac00 replay has no new BLOCKING/MATERIAL method gap.');
console.log('  Current Reality entry remains allowed.');
