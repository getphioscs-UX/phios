import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {assertMethodPresentationMode} from '../functions/report-delivery/method-render-contract.js';
const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const contract=json('content/reports/shared-report-delivery-e2e-contract-v2.json');
assert.equal(contract.reusePolicy.fullSharedInfrastructureProofRequiredOnce,true);
assert.equal(contract.reusePolicy.repeatedPerMethodFullE2E,false);
assert.equal(contract.liveProofContract.automaticExecution,false);
for(const field of ['methodDeltaRegistryRef','sessionContract','rendererReceiptContract','sharedInfrastructureRequirements','methodDeltaRequirements','rendererContract','materialContract','libraryContract','reopenContract','accessIsolationContract','liveProofContract','reusePolicy','privacy'])assert(contract[field]);
for(const item of ['SECOND_ACCOUNT_DENIAL','NO_RENDERER_REGENERATION_ON_REOPEN','NO_PROVIDER_REGENERATION_ON_REOPEN','METHOD_GENERATION_PASS'])assert(contract.sharedInfrastructureRequirements.includes(item));
assert.equal(contract.liveProofContract.openReleasedMayProveGenerationRelease,false);
for(const field of ['generationReleaseProven','releasedMaterialProven','reopenProven'])assert(contract.liveProofContract.requiredProofFields.includes(field));
const serialized=JSON.stringify(contract);for(const forbidden of ['gpt-5.6-sol','ZIWEI-PROFESSIONAL-SYNTHESIS-R5','rendererPageCount','naturalSections'])assert(!serialized.includes(forbidden));
const registry=json('content/reports/method-report-delivery-delta-registry-v1.json');
assert.equal(registry.repeatedPerMethodFullE2E,false);
assert.equal(registry.methods.at(-1).methodCode,'CROSS');
const profiles=json('content/reports/method-publication-profiles-v1.json').profiles;
assert.equal(new Set(profiles.map(p=>p.methodId)).size,profiles.length);
for(const profile of profiles){
 for(const path of profile.sourceAuthorityRefs)assert(fs.existsSync(path));
 assert(Array.isArray(profile.unresolvedFields));
 if(profile.unresolvedFields.length)assert.equal(profile.status,'PROFILE_GATE_OPEN');
}
for(const method of ['PROFILE','FINANCIAL','WILL']){
 assert.deepEqual(profiles.find(x=>x.methodId===method).allowedModes,['BILINGUAL']);
 assertMethodPresentationMode(method,'BILINGUAL');
 for(const mode of ['EN','ZH_HANS'])assert.throws(()=>assertMethodPresentationMode(method,mode));
}
const protectedBaseline=json('docs/reports/delivery-r4/ACCEPTED-SOURCE-BASELINE.json');
for(const [path,hash] of Object.entries(protectedBaseline.files))assert.equal(createHash('sha256').update(fs.readFileSync(path)).digest('hex'),hash,'Accepted/historical source changed: '+path);
for(const entry of registry.methods){
 const delta=json(entry.receiptRef);
 assert.equal(delta.methodCode,entry.methodCode);assert.equal(delta.fullSharedE2ERepeated,false);
 for(const field of ['publicationProviderRule','rerenderProviderRule','reopenProviderRule'])assert.equal(delta[field],0);
 if(delta.status!=='PASS')assert(delta.blockers.length);
}
const proof=fs.readFileSync('functions/api/shared-report-e2e-proof.js','utf8');
assert(!proof.includes('assertR5'));assert(!proof.includes('pageCount!==39'));assert(!proof.includes('firstAuthenticatedSessionId'));
assert(proof.includes('firstAuthenticatedSessionHash'));assert(proof.includes('account-isolation'));
assert(proof.indexOf("if(body.action==='finalize')")<proof.indexOf('sharedDeliveryAuthorityEligible:true'));
for(const token of ['SHARED_E2E_REQUIRED_LIVE_PHASES_INCOMPLETE','SHARED_E2E_RENDERER_STABILITY_REQUIRED','SHARED_E2E_ALL_TARGET_METHOD_DELTAS_REQUIRED','SHARED_E2E_CROSS_ACCOUNT_SUBJECT_LEAK'])assert(proof.includes(token));
if(registry.methods.some(x=>x.status!=='PASS'))assert.equal(registry.sharedFinalLiveE2EAllowed,false);
console.log('PASS shared delivery v2 readiness/contracts: native profiles indexed; unresolved gates explicit; protected sources unchanged; no final live authority granted. Provider calls=0.');
