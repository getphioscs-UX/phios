import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

const freeze=j('content/professional/method-client-delivery/freeze/mcd-7-personal-runtime-result-surface-freeze-v1.json');
const successor=j('content/professional/method-client-delivery/reconciliation/mcd-7-personal-runtime-result-surface-current-successor-v1.json');
const wpr=j(successor.governedSuccessor);

assert.equal(freeze.status,'FROZEN_CANONICAL_RESULT_SURFACE_HDR_NO_PRODUCTION_TAB');
assert.equal(successor.status,'ACTIVE_VERSIONED_SUCCESSOR_MCD7_FREEZE_PRESERVED_WPR21_CURRENT_SURFACE');
assert.equal(successor.predecessorFreeze,'content/professional/method-client-delivery/freeze/mcd-7-personal-runtime-result-surface-freeze-v1.json');
assert.equal(wpr.status,'ACTIVE_VERSIONED_SUCCESSOR_WPR21_PREDECESSOR_IMMUTABLE');
assert.equal(wpr.predecessor.mutated,false);
assert.equal(wpr.successor.surfaceCode,'MCD7_PERSONAL_RUNTIME_RESULTS');
assert.equal(wpr.successor.executionAuthority,'MPA');

const transitions=new Map(successor.artifacts.map(item=>[item.path,item]));
for(const item of freeze.frozenOutputs){
  const transition=transitions.get(item.path);
  if(!transition){
    assert.equal(sha(item.path),item.sha256,`MCD-7 frozen predecessor drift: ${item.path}`);
    continue;
  }
  assert.equal(transition.predecessorSha256,item.sha256,`MCD-7 successor predecessor mismatch: ${item.path}`);
  assert.equal(sha(item.path),transition.currentSuccessorSha256,`MCD-7 current successor drift: ${item.path}`);
}
for(const item of successor.artifacts)assert.ok(freeze.frozenOutputs.some(frozen=>frozen.path===item.path),`MCD-7 successor artifact lacks frozen predecessor: ${item.path}`);
for(const value of Object.values(successor.authorityBoundary))assert.equal(value,false);
assert.equal(freeze.authorityFreeze.dispatchOwner,'MPA');
assert.equal(freeze.authorityFreeze.clientResultContract,'CanonicalMethodProjection');
assert.equal(freeze.authorityFreeze.hdrProductionResultTabAllowed,false);
assert.equal(freeze.authorityFreeze.readingInterpretationAllowed,false);
console.log('✓ MCD-7 Personal Runtime Result Surface freeze + current WPR-W21 successor passed.');
