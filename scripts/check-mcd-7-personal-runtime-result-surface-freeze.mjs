import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

const freeze=j('content/professional/method-client-delivery/freeze/mcd-7-personal-runtime-result-surface-freeze-v1.json');
const predecessorPath='content/professional/method-client-delivery/reconciliation/mcd-7-personal-runtime-result-surface-current-successor-v1.json';
const successor=j('content/professional/method-client-delivery/reconciliation/mcd-7-personal-runtime-result-surface-current-successor-v2.json');
const predecessor=j(predecessorPath);
const wpr=j(successor.governedRuntimeSuccessor);
const pxr=j(successor.presentationSuccessor.contract);
const pxrRegistry=j(successor.presentationSuccessor.surfaceRegistry);
const pxrAcceptance=j(successor.presentationSuccessor.acceptance);

assert.equal(freeze.status,'FROZEN_CANONICAL_RESULT_SURFACE_HDR_NO_PRODUCTION_TAB');
assert.equal(successor.status,'ACTIVE_VERSIONED_SUCCESSOR_MCD7_RUNTIME_PRESERVED_PXR_PRESENTATION_ACTIVE');
assert.equal(successor.predecessor.path,predecessorPath);
assert.equal(sha(predecessorPath),successor.predecessor.sha256,'MCD-7 v1 successor historical evidence drift');
assert.equal(successor.predecessor.mutated,false);
assert.equal(predecessor.status,'ACTIVE_VERSIONED_SUCCESSOR_MCD7_FREEZE_PRESERVED_WPR21_CURRENT_SURFACE');
assert.equal(successor.predecessorFreeze,'content/professional/method-client-delivery/freeze/mcd-7-personal-runtime-result-surface-freeze-v1.json');

assert.equal(wpr.status,'ACTIVE_VERSIONED_SUCCESSOR_WPR21_PREDECESSOR_IMMUTABLE');
assert.equal(wpr.predecessor.mutated,false);
assert.equal(wpr.successor.surfaceCode,'MCD7_PERSONAL_RUNTIME_RESULTS');
assert.equal(wpr.successor.executionAuthority,'MPA');
assert.equal(wpr.successor.canonicalClientResult,'CanonicalMethodProjection');
assert.equal(wpr.successor.serverSubmissionRequiresExplicitProcessAction,true);
assert.equal(wpr.successor.browserStorageAllowed,false);
assert.equal(wpr.successor.serverPersistenceAllowed,false);
assert.equal(wpr.successor.interpretationIncluded,false);

assert.equal(sha(successor.presentationSuccessor.contract),successor.presentationSuccessor.contractSha256,'MCD-7 PXR presentation contract drift');
assert.equal(sha(successor.presentationSuccessor.surfaceRegistry),successor.presentationSuccessor.surfaceRegistrySha256,'MCD-7 PXR surface registry drift');
assert.equal(sha(successor.presentationSuccessor.acceptance),successor.presentationSuccessor.acceptanceSha256,'MCD-7 PXR acceptance drift');
assert.equal(pxr.status,'ACTIVE_PUBLIC_EXPERIENCE_SUCCESSOR');
assert.equal(pxr.principles.existingRuntimeAuthoritiesPreserved,true);
assert.equal(pxr.authorityBoundary.runtimeSemanticAuthorityChanged,false);
assert.equal(pxr.authorityBoundary.methodAuthorityChanged,false);
assert.equal(pxrAcceptance.gates.coreSurfaceRecomposition,true);
const personalSurface=pxrRegistry.surfaces.find(item=>item.surfaceCode==='PERSONAL_RUNTIME');
assert.ok(personalSurface,'MCD-7 PXR Personal Runtime presentation registration missing');
assert.ok(personalSurface.routes.includes('/personal-runtime'));
assert.ok(personalSurface.hideSelectors.includes('.pr-side'));

const predecessorTransitions=new Map(predecessor.artifacts.map(item=>[item.path,item]));
const transitions=new Map(successor.artifacts.map(item=>[item.path,item]));
for(const item of freeze.frozenOutputs){
  const transition=transitions.get(item.path);
  if(!transition){
    assert.equal(sha(item.path),item.sha256,`MCD-7 frozen predecessor drift: ${item.path}`);
    continue;
  }
  assert.equal(transition.predecessorSha256,item.sha256,`MCD-7 successor predecessor mismatch: ${item.path}`);
  const previous=predecessorTransitions.get(item.path);
  assert.ok(previous,`MCD-7 v2 artifact lacks v1 successor lineage: ${item.path}`);
  assert.equal(transition.previousSuccessorSha256,previous.currentSuccessorSha256,`MCD-7 v2 previous-successor mismatch: ${item.path}`);
  assert.equal(sha(item.path),transition.currentSuccessorSha256,`MCD-7 current successor drift: ${item.path}`);
}
for(const item of successor.artifacts)assert.ok(freeze.frozenOutputs.some(frozen=>frozen.path===item.path),`MCD-7 successor artifact lacks frozen predecessor: ${item.path}`);
for(const value of Object.values(successor.authorityBoundary))assert.equal(value,false);
assert.equal(freeze.authorityFreeze.dispatchOwner,'MPA');
assert.equal(freeze.authorityFreeze.clientResultContract,'CanonicalMethodProjection');
assert.equal(freeze.authorityFreeze.hdrProductionResultTabAllowed,false);
assert.equal(freeze.authorityFreeze.readingInterpretationAllowed,false);
console.log('✓ MCD-7 Personal Runtime Result Surface freeze + WPR-W21 runtime + PXR presentation successor passed.');
