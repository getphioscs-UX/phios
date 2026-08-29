import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {METHODS,diversityCases,buildDiversityCase} from './smr-diversity-support.mjs';
import {CROSS_PRODUCTION_ADMISSION,maybeBuildProductionCombinedReading} from '../functions/runtime-reading/cross-reading-production.js';

for(const script of ['scripts/check-cross-r2-w21-w23.mjs','scripts/check-cross-w24-machine-campaign.mjs','scripts/check-cross-w25-human.mjs'])execFileSync(process.execPath,[script],{stdio:'inherit'});
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const a=j('content/customer-experience-rebuild/r12r4b/cross/acceptance/cross-w26-final-production-admission-v1.json');
const x=j('content/customer-experience-rebuild/r12r4b/cross/acceptance/cross-w26-production-cutover-acceptance-v1.json');
const g=j('content/customer-experience-rebuild/r12r4b/cross/governance/cross-production-governance-v1.json');
const c=j('content/customer-experience-rebuild/r12r4b/cross/contracts/cross-final-production-admission-contract-v1.json');
assert.equal(a.status,'PRODUCTION_ACCEPTED');assert.equal(a.productionAllowed,true);assert.equal(a.customerCrossCutoverAllowed,true);assert.equal(a.currentApiMutationApplied,true);assert.equal(a.combinedReadingState,'PRODUCTION');assert.equal(a.blocker,null);
assert.equal(x.status,'PRODUCTION_CUTOVER_ACCEPTED');assert.equal(x.productionAllowed,true);assert.equal(x.customerCrossCutoverAllowed,true);assert.equal(x.liveCustomerIndividuallyHumanReviewed,false);
assert.equal(g.status,'PRODUCTION_GOVERNANCE_ACTIVE');assert.equal(g.surface.crossCustomerCutoverCurrentlyAllowed,true);assert.equal(g.surface.combinedReadingState,'PRODUCTION');assert.equal(g.surface.currentRealityIntegrationActivated,false);
assert.equal(c.publicationRules.minimumDistinctMethodsPerCrossClaim,2);for(const k of ['smrProseBackfeedAllowed','rawSymbolCrossAuthorityAllowed','rawProjectionCrossConclusionAllowed','methodVotingAllowed','percentageCompatibilityAllowed','systemsProveLanguageAllowed','automaticConflictWinnerAllowed','rendererMayCreateMeaning'])assert.equal(c.publicationRules[k],false,k);
assert.equal(CROSS_PRODUCTION_ADMISSION.productionAllowed,true);assert.equal(CROSS_PRODUCTION_ADMISSION.customerCrossCutoverAllowed,true);assert.equal(CROSS_PRODUCTION_ADMISSION.humanAcceptance,'36_OF_36');

const built={};for(const methodId of METHODS)built[methodId]=await buildDiversityCase(methodId,diversityCases[methodId][0]);
const intent={intentId:'OPEN',prompt:'Final Cross production cutover validation.'};
for(const methodIds of [['AST','BZR'],['AST','BZR','ZWR','NUM','ECR']]){
  const acceptedMethodReadings=methodIds.map(id=>built[id].methodResult);
  const first=await maybeBuildProductionCombinedReading({acceptedMethodReadings,customerIntent:intent});
  const second=await maybeBuildProductionCombinedReading({acceptedMethodReadings,customerIntent:intent});
  assert.equal(first.schemaVersion,'PHI-OS-CROSS-METHOD-RUNTIME-READING-IR-v2.0.0');assert.equal(first.state,'PRODUCTION');assert.equal(first.publicationState,'CUSTOMER_PUBLISHABLE_CROSS_READING');assert.equal(first.productionAdmissionRef,a.contractRef?CROSS_PRODUCTION_ADMISSION.productionAdmissionRef:CROSS_PRODUCTION_ADMISSION.productionAdmissionRef);assert.equal(first.boundaries.customerCutoverActivated,true);assert.equal(first.boundaries.currentRealityIntegrationActivated,false);assert.equal(first.boundaries.smrProseConsumed,false);assert.equal(first.technical.unmappedClaimRefs.length,0);assert.equal(first.releaseDigest,second.releaseDigest);assert(first.claims.length>0);
  for(const claim of first.claims){assert(claim.methodRefs.length>=2);assert.equal(new Set(claim.methodRefs).size,claim.methodRefs.length);assert.equal(claim.boundary.methodAgreementIsNotProof,true);assert.equal(claim.boundary.percentageMatchCreated,false);assert.equal(claim.boundary.methodWinnerSelected,false);assert.equal(claim.lineage.currentRealityRefs.length,0);assert.doesNotMatch(`${claim.headline} ${claim.narrative}`,/\b\d{1,3}%\b|systems? prove|majority|\b\d\s*(?:out of|of)\s*5\b/i)}
}
assert.equal(await maybeBuildProductionCombinedReading({acceptedMethodReadings:[built.AST.methodResult],customerIntent:intent}),null);
await assert.rejects(()=>maybeBuildProductionCombinedReading({acceptedMethodReadings:[built.AST.methodResult,built.AST.methodResult],customerIntent:intent}),e=>e?.code==='CROSS_PRODUCTION_DUPLICATE_METHOD');

const api=fs.readFileSync('functions/api/customer-personal-reality.js','utf8');
assert.match(api,/runtime-reading\/cross-reading-production\.js/);assert.match(api,/maybeBuildProductionCombinedReading/);assert.match(api,/selected\.length>=2&&selected\.length<=5/);assert.match(api,/buildReadingView\(\{methods:readingMethods,selectedCount:selected\.length,calculationCount:projections\.length,locale,combinedReading\}\)/);assert.match(api,/combinedReading:combinedReady\?combinedReading/);
const ui=fs.readFileSync('assets/customer-ui/js/surfaces/personal-reality.js','utf8');assert.match(ui,/view\?\.reading\?\.combinedReading/);assert.match(ui,/PHI-OS-CROSS-METHOD-RUNTIME-READING-IR-v2\.0\.0/);assert.match(ui,/combined\.claims/);assert.doesNotMatch(ui,/results\.length!==4/);
const pkg=j('package.json');assert.match(pkg.scripts.check,/check:cross-final-production-admission/);assert.doesNotMatch(pkg.scripts.check,/check:cross-r2-w24-w26-pre-admission/);
console.log('✓ R2-W26 Cross final production gate passed: W24 64/64 machine + W25 36/36 human; 2–5 method production builder deterministic; customer combinedReading API + governed renderer cutover active; Current Reality remains separately gated.');
