import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import {normalizeVerifiedSymbolicAccountIdentity,symbolicPersistenceProviderState} from '../functions/symbolic-method-persistence/symbolic-account-identity-v1.js';

const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const sha=path=>crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const successor=read('content/interpretation/iching/reconciliation/iching-persistence-current-successor-v2.json');
assert.equal(successor.baselineCommit,'90f87b962cc0f9a77996d2bb6deca5bfa38a1634');
assert.equal(sha(successor.historicalAcceptance.path),successor.historicalAcceptance.sha256);
assert.equal(successor.historicalAcceptance.preserved,true);
assert.equal(sha(successor.sharedContextEvolutionAuthority.path),successor.sharedContextEvolutionAuthority.sha256);
assert.equal(successor.sharedContextEvolutionAuthority.preserved,true);
for(const item of Object.values(successor.currentArtifacts)) assert.equal(sha(item.path),item.sha256,`current persistence drift: ${item.path}`);

const context=fs.readFileSync(successor.currentArtifacts.sharedContextApi.path,'utf8');
assert.match(context,/METHODS=new Set\(\['I_CHING','TAROT'\]\)/);
assert.match(context,/symbolicPersistenceProviderState\(context\)/);
assert.match(context,/verifiedIdentityBound:persistence\.verifiedIdentityBound/);
assert.match(context,/persistenceProviderBound:persistence\.d1Bound/);
assert.match(context,/automaticPersistence:false/);
assert.equal(normalizeVerifiedSymbolicAccountIdentity({userId:'request-user',providerId:'request-provider'}),null);
assert.equal(symbolicPersistenceProviderState({env:{},data:{symbolicAccountIdentity:{userId:'u',providerId:'p',verified:true,authenticated:true}}}).providerReady,false);
for(const [key,value] of Object.entries(successor.accepted)) assert.equal(value,key==='automaticPersistenceCreated'?false:true);
for(const value of Object.values(successor.productionBoundary)) assert.equal(value,false);

console.log('✓ ICH-PROD-W18 current persistence reconciliation passed.');
console.log('  Tarot J0 shared-context evolution is consumed without rewriting I Ching W15 evidence; verified live provider activation remains closed.');
