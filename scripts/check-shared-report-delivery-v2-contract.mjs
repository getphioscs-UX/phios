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
const preserved=json('docs/reports/delivery-r4/accepted-source-output-preservation-v1.json');
const digest=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
assert.equal(preserved.status,'ENGINEERING_EVIDENCE_PRESERVATION');
assert.equal(preserved.predecessor.path,'docs/reports/delivery-r4/ACCEPTED-SOURCE-BASELINE.json');
assert.equal(digest(preserved.predecessor.path),preserved.predecessor.sha256);
for(const key of ['historicalBaselineRewritten','currentFailurePromotedToPass','productionAdmissionGranted'])assert.equal(preserved[key],false);
assert.deepEqual(preserved.entries.map(e=>e.path),['docs/acceptance/bazi-paid-report/deep-manuscript-r2/FINAL-CLOSURE-CHECK-all.json']);
for(const [path,hash] of Object.entries(protectedBaseline.files)){
 // Owner Override retires only this generated review HTML, not its Human decision.
 if(path==='tools/review/ZWR-VFR-R1-HUMAN-REVIEW.html'){assertCurrentZwrAcceptedPublication({retiredReviewHash:hash});continue;}
 const entry=preserved.entries.find(e=>e.path===path);
 if(entry){assert.equal(entry.sha256,hash);assert.equal(entry.historicalPath,'docs/reports/delivery-r4/history/FINAL-CLOSURE-CHECK-all.accepted-baseline.json');}
 assert.equal(digest(entry?.historicalPath||path),hash,'Accepted/historical source changed: '+path);
}
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

export function assertCurrentZwrAcceptedPublication({read=json,digestFile=digest,retiredReviewHash}={}){
 const humanPath='docs/reports/ziwei/vfr-r1/HUMAN-DECISION.json',cutoverPath='docs/reports/ziwei/vfr-r1/PRODUCTION-CUTOVER.json';
 const human=read(humanPath),cutover=read(cutoverPath),delta=read('docs/reports/delivery-r4/ZIWEI-METHOD-DELIVERY-DELTA-v1.json');
 assert.equal(human.decision,'ACCEPT','ZWR_CURRENT_HUMAN_ACCEPTANCE_REQUIRED');
 assert.equal(human.reviewHtmlSha256,retiredReviewHash,'ZWR_RETIRED_REVIEW_IDENTITY');
 assert.equal(cutover.reviewHtmlSha256,retiredReviewHash);
 assert.equal(digestFile(humanPath),cutover.humanDecisionSha256,'ZWR_HUMAN_DECISION_BINDING');
 assert.equal(delta.contentAcceptanceExisting,true);assert.equal(delta.contentAcceptanceDigest,cutover.humanDecisionSha256);
 assert.equal(delta.nativeOwnerRef,cutoverPath);assert.equal(delta.nativeOwnerSha256,digestFile(cutoverPath));
 assert.equal(human.publicationIrSha256,digestFile('docs/reports/ziwei/vfr-r1/DEEP-PUBLICATION-IR.json'),'ZWR_ACCEPTED_PUBLICATION_IR_BINDING');
 assert.equal(human.publicationIrDigest,cutover.publicationIrDigest);
 assert.equal(read('docs/reports/ziwei/vfr-r1/PAGE-PLAN.json').length,human.physicalPageCount);
 assert.equal(read('docs/reports/ziwei/vfr-r1/PUBLICATION-FIT-PLAN.json').pageCount,human.physicalPageCount);
 assert.equal(read('docs/reports/ziwei/vfr-r1/DIAGRAM-DATA.json').diagramCount,human.deterministicDiagramCount);
 assert.match(human.scope,/candidate only; no authority expansion; production cutover separately gated/);
 assert.equal(cutover.providerCallsDuringProductionPublication,0);assert.equal(cutover.semanticAiReviewCalls,0);
 assert.equal(delta.sharedDeliveryAuthorityEligible,false,'ZWR_CURRENT_LIVE_DELIVERY_STILL_BLOCKED');
 assert.equal(delta.realAccountReleasePass,false);assert.equal(delta.deployedRendererPass,false);assert.equal(delta.differentSessionReopenPass,false);
 assert.equal(read('content/reports/method-report-delivery-delta-registry-v1.json').sharedFinalLiveE2EAllowed,false);
 return true;
}
