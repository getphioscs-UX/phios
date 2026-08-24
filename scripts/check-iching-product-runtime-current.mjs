import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import {onRequestGet as getSymbolicContext} from '../functions/api/symbolic-method-context.js';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const successor=read('content/interpretation/iching/reconciliation/iching-product-runtime-checker-successor-v2.json');
const v1=read(successor.successorOf);
const freeze=read(successor.historicalFreeze.path);
const acceptance=read('content/interpretation/iching/acceptance/iching-product-runtime-source-acceptance-v1.json');
const campaign=read('content/production/symbolic-method/human-review/iching-human-review-campaign-v1.json');
const pcm=read('content/governance/production-capability-matrix/registries/production-capability-registry-v6.json');
const catalog=read('content/web-production/px2/registries/public-method-catalog-v2.json');

assert.equal(successor.baselineCommit,'40cb9e71450ebb817998cde8222225cd941c0aa0');
assert.equal(successor.predecessor.preserved,true);assert.equal(sha(successor.predecessor.path),successor.predecessor.sha256);
assert.equal(successor.historicalFreeze.preserved,true);assert.equal(sha(successor.historicalFreeze.path),successor.historicalFreeze.sha256);
assert.equal(successor.sharedApiEvolution.sourceReadyForBoth,true);assert.equal(successor.sharedApiEvolution.separateExecutionAuthority,true);assert.equal(successor.sharedApiEvolution.productionAuthorityChanged,false);assert.equal(sha(successor.sharedApiEvolution.path),successor.sharedApiEvolution.sha256);
assert.equal(v1.status,'CURRENT_CHECKER_RECONCILED_SOURCE_RUNTIME_COMPLETE_ACTIVATION_NOT_GRANTED');
assert.equal(freeze.status,'I_CHING_PRODUCT_RUNTIME_SOURCE_FROZEN_ACTIVATION_EVIDENCE_PENDING');
assert.equal(acceptance.status,'ACCEPTED_SOURCE_RUNTIME_COMPLETE_PRODUCTION_ACTIVATION_NOT_GRANTED');
assert.equal(campaign.sessions.length,24);assert.equal(campaign.sessions.filter(x=>x.humanReviewed===true).length,0);

for(const method of ['I_CHING','TAROT']){
 const response=await getSymbolicContext({request:new Request(`https://example.test/api/symbolic-method-context?method=${method}`),data:{ckaAccess:{accountState:'GUEST',retentionPolicyAccepted:false}},env:{}});const body=await response.json();assert.equal(body.ok,true);assert.equal(body.productRuntime.sourceReady,true);assert.equal(body.productRuntime.structuralRuntimeFrozen,true);assert.equal(body.productRuntime.interpretationSourceBound,true);assert.equal(body.productRuntime.automaticPersistence,false);assert.equal(body.production.runAllowed,false);
}
const ich=pcm.capabilities.find(x=>x.methodRuntime?.methodCode==='I_CHING');assert.ok(ich);assert.notEqual(ich.capabilityAvailability,'AVAILABLE');assert.equal(ich.userExecutable,false);assert.equal(ich.productionAccepted,false);
const publicIch=catalog.methods.find(x=>x.methodCode==='I_CHING');assert.ok(publicIch);assert.equal(publicIch.runAllowed,false);
for(const key of ['verifiedPersistenceIdentity','liveBrowserAcceptance','liveProductionShaAlignment','publicRunAllowed','limitedProductionActivated','productionCapabilityPromoted'])assert.equal(successor.productionBoundary[key],false);

console.log('✓ I Ching current product checker v2 passed.');
console.log('  Shared context source-readiness is aligned with Tarot persistence without granting either method client-side execution authority.');
console.log('  I Ching source Runtime remains complete; 0/24 human review, persistence identity, live browser and live SHA still block activation.');
