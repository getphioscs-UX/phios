import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));

const contract=json('content/reports/shared-report-delivery-e2e-contract-v1.json');
assert.equal(contract.status,'READY_FOR_LIVE_QA_PROOF');
assert.equal(contract.sourceRequirements.compositionVersion,'ZIWEI-PROFESSIONAL-SYNTHESIS-R5');
assert.equal(contract.sourceRequirements.composerOwner,'REPORT-PRO-COMPOSER-R1');
assert.equal(contract.sourceRequirements.model,'gpt-5.6-sol');
assert.equal(contract.sourceRequirements.rendererPageCount,39);
assert.equal(contract.reusePolicy.fullSharedInfrastructureProofRequiredOnce,true);
assert.equal(contract.reusePolicy.repeatedPerMethodFullE2E,false);

const binding=read('functions/report-delivery/ziwei-canonical-person-binding.js');
assert.match(binding,/generateZiweiProfessionalSynthesisR5Candidate/);
assert.doesNotMatch(binding,/generateZiweiNaturalComposerR4Candidate/);

const r5=read('functions/personal-reading/narrative/ziwei-professional-synthesis-r5.js');
assert.match(r5,/composeReferenceGovernedDraftR1/);
assert.match(r5,/REPORT-PRO-COMPOSER-R1/);
assert.match(r5,/referenceGoverned:true/);

const gate=read('functions/report-delivery/ziwei-professional-synthesis-r5-generation.js');
for(const token of ["referenceGoverned!==true","referenceId!=='ZIWEI-PROFESSIONAL-SYNTHESIS-R5'","composerOwner!=='REPORT-PRO-COMPOSER-R1'","model!=='gpt-5.6-sol'"])assert.ok(gate.includes(token),token);

const renderer=read('workers/method-report-renderer/index.js');
assert.match(renderer,/'ZIWEI-PROFESSIONAL-SYNTHESIS-R5':39/);
assert.match(renderer,/expectedPageCount/);

const material=read('functions/account/ziwei-controlled-report-material.js');
assert.match(material,/semanticContent\?\.report\?\.totalPages/);
assert.doesNotMatch(material,/pageCount!==33/);

const proof=read('functions/api/shared-report-e2e-proof.js');
for(const token of [
 "generate-release-open","reopen","authenticate(context)","firstAuthenticatedSessionId",
 "SHARED_E2E_NEW_LOGIN_SESSION_REQUIRED","sameImmutableSnapshot:true",
 "sameImmutableRenderedMaterial:true","noProviderRegenerationOnReopen:true",
 "sharedDeliveryAuthorityEligible:true","accountLibraryVisible:true"
])assert.ok(proof.includes(token),token);
assert.match(proof,/compositionVersion!=='ZIWEI-PROFESSIONAL-SYNTHESIS-R5'/);
assert.match(proof,/model!=='gpt-5\.6-sol'/);
assert.match(proof,/rendererPageCount:receipt\.pageCount/);

const state=json('docs/reports/SHARED-REPORT-E2E-REFERENCE-v1.json');
assert.equal(state.finalSharedAuthorityState,'PENDING_LIVE_TWO_SESSION_PASS');
assert.equal(state.liveProofEndpoint,'/api/shared-report-e2e-proof');

console.log('PASS Shared Report Delivery E2E readiness: Zi Wei R5 is wired through REPORT-PRO-COMPOSER-R1, 39-page private rendering, release/account material, and a two-auth-session immutable reopen proof. Final shared authority remains pending the live QA two-session PASS.');
