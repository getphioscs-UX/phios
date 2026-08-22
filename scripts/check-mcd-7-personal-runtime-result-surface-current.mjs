import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

const successor=json('content/professional/method-client-delivery/reconciliation/mcd-7-personal-runtime-result-surface-current-successor-v3.json');
const predecessor=json(successor.predecessor.path);
const freeze=json(successor.historicalFreeze.path);
const html=read(successor.semanticSurfaceContract.path);

assert.equal(successor.status,'ACTIVE_CURRENT_CONTRACT_GUARDED_PRESENTATION_DECOUPLED');
assert.equal(sha(successor.predecessor.path),successor.predecessor.sha256,'MCD7_CURRENT_V2_HISTORICAL_EVIDENCE_DRIFT');
assert.equal(successor.predecessor.mutated,false);
assert.equal(predecessor.status,'ACTIVE_VERSIONED_SUCCESSOR_MCD7_RUNTIME_PRESERVED_PXR_PRESENTATION_ACTIVE');
assert.equal(sha(successor.historicalFreeze.path),successor.historicalFreeze.sha256,'MCD7_HISTORICAL_FREEZE_EVIDENCE_DRIFT');
assert.equal(successor.historicalFreeze.mutated,false);
assert.equal(freeze.status,'FROZEN_CANONICAL_RESULT_SURFACE_HDR_NO_PRODUCTION_TAB');

assert.equal(successor.currentPolicy.wholeHtmlFingerprintRequired,false);
assert.equal(successor.currentPolicy.wholeCssFingerprintRequired,false);
assert.equal(successor.currentPolicy.presentationMayEvolve,true);
assert.equal(successor.currentPolicy.runtimeJsExactFingerprintRequired,true);
assert.equal(successor.currentPolicy.contractRegistryAcceptanceExactFingerprintRequired,true);
for(const artifact of successor.exactAuthorityArtifacts){
  assert.equal(sha(artifact.path),artifact.sha256,`MCD7_CURRENT_AUTHORITY_DRIFT:${artifact.path}`);
}

assert.match(html,/data-page=["']personal-runtime["']/,'MCD7_CURRENT_PAGE_IDENTITY_MISSING');
assert.match(html,/data-wpr-production-surface=["']MCD7_PERSONAL_RUNTIME_RESULTS["']/,'MCD7_CURRENT_WPR_SURFACE_MISSING');
for(const step of successor.semanticSurfaceContract.requiredFlowSteps){
  assert.match(html,new RegExp(`data-flow-step=["']${step}["']`),`MCD7_CURRENT_FLOW_STEP_MISSING:${step}`);
}
for(const id of successor.semanticSurfaceContract.requiredIds){
  assert.match(html,new RegExp(`id=["']${id}["']`),`MCD7_CURRENT_ID_MISSING:${id}`);
}
for(const hook of successor.semanticSurfaceContract.requiredHooks){
  assert.match(html,new RegExp(`${hook}(?:=["'][^"']*["'])?`),`MCD7_CURRENT_HOOK_MISSING:${hook}`);
}
const tabs=[...html.matchAll(/data-tab=["']([^"']+)["']/g)].map(match=>match[1]);
assert.deepEqual(tabs,successor.semanticSurfaceContract.requiredTabs,'MCD7_CURRENT_RESULT_TAB_SET_OR_ORDER_DRIFT');
assert.equal(tabs.includes('production'),false,'MCD7_CURRENT_PRODUCTION_TAB_FORBIDDEN');
for(const result of successor.semanticSurfaceContract.requiredResultHooks){
  assert.match(html,new RegExp(`data-mcd7-result=["']${result}["']`),`MCD7_CURRENT_RESULT_HOOK_MISSING:${result}`);
}
for(const marker of successor.semanticSurfaceContract.requiredI18nMarkers){
  assert.match(html,new RegExp(`data-i18n=["']${marker.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}["']`),`MCD7_CURRENT_I18N_BOUNDARY_MISSING:${marker}`);
}
for(const forbidden of successor.semanticSurfaceContract.forbiddenPublicResultTerms){
  assert.equal(html.includes(forbidden),false,`MCD7_CURRENT_RESTRICTED_RESULT_LEAK:${forbidden}`);
}
assert.match(html,/data-pxr-hidden=["']true["'][^>]*aria-hidden=["']true["'][^>]*hidden|hidden[^>]*data-pxr-hidden=["']true["']/,'MCD7_CURRENT_TECHNICAL_BOUNDARY_NOT_HIDDEN');

const wpr=json('content/web-production/successors/wpr-w21-mcd7-personal-runtime-result-surface-successor-v1.json');
assert.equal(wpr.successor.executionAuthority,'MPA');
assert.equal(wpr.successor.canonicalClientResult,'CanonicalMethodProjection');
assert.equal(wpr.successor.serverSubmissionRequiresExplicitProcessAction,true);
assert.equal(wpr.successor.browserStorageAllowed,false);
assert.equal(wpr.successor.serverPersistenceAllowed,false);
assert.equal(wpr.successor.interpretationIncluded,false);
assert.equal(freeze.authorityFreeze.dispatchOwner,'MPA');
assert.equal(freeze.authorityFreeze.clientResultContract,'CanonicalMethodProjection');
assert.equal(freeze.authorityFreeze.hdrProductionResultTabAllowed,false);
assert.equal(freeze.authorityFreeze.readingInterpretationAllowed,false);
for(const value of Object.values(successor.authorityBoundary)) assert.equal(value,false);

console.log('✓ MCD-7 current result-surface contract passed.');
console.log('  Personal Runtime presentation is fingerprint-decoupled; MPA dispatch, CanonicalMethodProjection, five-tab result contract, consent and restricted-result boundaries remain fail-closed.');
