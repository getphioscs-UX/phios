import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildZiweiFullProductionCustomerRuntime} from '../functions/zi-wei-full-production/ziwei-full-production-customer-runtime.js';
import {adaptZiweiPersonalRealityProduct} from '../functions/personal-reality-product/adapters/ziwei-production-adapter.js';
import {buildZiweiW9W11RenderPlan} from '../assets/customer-ui/js/specialists/ziwei/ziwei-specialist-workspace.js';
import {ZIWEI_PROFESSIONAL_READING_V2_ACTIVE,ZIWEI_PROFESSIONAL_READING_V2_AUTHORITY} from '../functions/zi-wei-full-production/ziwei-professional-reading-v2-publication-authority.js';

const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const base='content/professional/zi-wei-professional-reading-r2';
const historical=j(`${base}/acceptance/ziwei-pro-r2-w16-human-review-status-v1.json`);
const results=j(`${base}/review/ziwei-pro-r2-w16-human-review-results-v1.json`);
const admission=j(`${base}/acceptance/ziwei-pro-r2-w16-human-admission-v2.json`);
const cutover=j(`${base}/acceptance/ziwei-pro-r2-w17-professional-reading-cutover-v1.json`);
const manifest=j(`${base}/manifest/ziwei-pro-r2-w16-w17-cutover-manifest-v1.json`);
const cases=j(`${base}/review/ziwei-pro-r2-w16-human-review-cases-v1.json`);

// Historical checkpoint remains historical truth; successor carries the accepted decision.
assert.equal(historical.status,'PENDING_0_OF_24');
assert.equal(historical.w17CutoverAllowed,false);
assert.equal(results.reviewStatus,'HUMAN_ACCEPTED_24_OF_24');
assert.equal(results.requiredAccepted,24);
assert.equal(results.acceptedCount,24);
assert.equal(results.pendingCount,0);
assert.equal(results.needsRevisionCount,0);
assert.equal(results.rejectedCount,0);
assert.equal(results.humanReviewWasMachineSubstituted,false);
assert.equal(results.humanAcceptanceEvidence?.numericRatingsSupplied,false);
assert.equal(results.items.length,24);
assert(results.items.every(x=>x.decision==='ACCEPT'));
assert(results.items.every(x=>Object.values(x.ratings||{}).every(v=>v===null)),'numeric ratings must remain unknown rather than fabricated');
assert.equal(new Set(results.items.map(x=>x.caseId)).size,24);
assert.deepEqual(new Set(results.items.map(x=>x.caseId)),new Set(cases.cases.map(x=>x.caseId)));

assert.equal(admission.status,'HUMAN_ACCEPTED_24_OF_24');
assert.equal(admission.accepted,24);
assert.equal(admission.pending,0);
assert.equal(admission.humanReviewWasMachineSubstituted,false);
assert.equal(admission.numericRatingsFabricated,false);
assert.equal(admission.productionAdmissionAllowed,true);
assert.equal(admission.w17CutoverAllowed,true);

assert.equal(cutover.status,'ZIWEI_PROFESSIONAL_READING_V2_ACTIVE');
assert.equal(cutover.publicationState,'CUSTOMER_PUBLISHED');
assert.equal(cutover.defaultCustomerAuthority,true);
assert.equal(cutover.gates.w15ProfessionalQualityMachine,'PASS_96_OF_96');
assert.equal(cutover.gates.w16ProfessionalUsefulnessHuman,'HUMAN_ACCEPTED_24_OF_24');
assert.equal(cutover.coverage.stars,'28/28');
assert.equal(cutover.coverage.starPalaceCompositions,'336/336');
assert.equal(cutover.w17CutoverAllowed,true);
assert.equal(cutover.historicalAuthoritiesRewritten,false);
assert.equal(manifest.stages.W16,'HUMAN_ACCEPTED_24_OF_24');
assert.equal(manifest.stages.W17,'ZIWEI_PROFESSIONAL_READING_V2_ACTIVE');
assert.equal(manifest.customerProduct.ziweiProfessionalReadingV2Active,true);
assert.equal(manifest.historicalPendingCheckpointPreserved,true);
assert.equal(manifest.machineSubstitutionForHumanReview,false);

assert.equal(ZIWEI_PROFESSIONAL_READING_V2_ACTIVE,true);
assert.equal(ZIWEI_PROFESSIONAL_READING_V2_AUTHORITY.status,'ZIWEI_PROFESSIONAL_READING_V2_ACTIVE');
assert.equal(ZIWEI_PROFESSIONAL_READING_V2_AUTHORITY.defaultCustomerAuthority,true);
assert.equal(ZIWEI_PROFESSIONAL_READING_V2_AUTHORITY.humanGate,'HUMAN_ACCEPTED_24_OF_24');
assert.equal(ZIWEI_PROFESSIONAL_READING_V2_AUTHORITY.w17CutoverAllowed,true);

function req(input,id){
 const consentRecordId=`CONSENT-W17-${id}`;
 const canonicalInput={birthDate:input.birthDate,birthTime:input.birthTime,birthPlace:{displayName:'Hong Kong',countryCode:'HK',latitude:22.3193,longitude:114.1694},timezone:{iana:'Asia/Hong_Kong',utcOffsetAtBirth:'+08:00',source:'GOVERNED_RESOLUTION',confidence:'HIGH'},timeAccuracy:'EXACT',locale:input.locale,consent:{recordId:consentRecordId,granted:true,purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',persistence:'NONE'},inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'};
 return {schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',methodCode:'ZI_WEI_DOU_SHU',methodVersion:'1.0.0',capability:'CALCULATION',purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',canonicalInput,executionParameters:{traditionalCalculationSex:input.traditionalCalculationSex},consentRecordId,requestId:`REQ-W17-${id}`};
}
const targetContext={targetDate:'2026-08-30',targetTime:'12:00',targetTimezone:{iana:'Asia/Kuala_Lumpur',utcOffsetAtTarget:'+08:00'},source:'EXPLICIT_REQUEST'};
let live=0,palaces=0,topics=0,timingYears=0;
for(const c of cases.cases){
 const full=await buildZiweiFullProductionCustomerRuntime({executionRequest:req(c.input,c.caseId),targetContext,locale:c.input.locale});
 const product=adaptZiweiPersonalRealityProduct({publicationEnvelope:full.customerProduct,locale:c.input.locale});
 assert.equal(product.state,'CUSTOMER_PUBLISHABLE');
 assert.equal(product.publication.professionalReadingVersion,'ZIWEI_PROFESSIONAL_READING_V2');
 assert.equal(product.publication.professionalReadingStatus,'ZIWEI_PROFESSIONAL_READING_V2_ACTIVE');
 assert.equal(product.publication.professionalReadingHumanAdmission,'24/24');
 assert.equal(product.publication.professionalReadingMachineAdmission,'96/96');
 assert.equal(product.lineage.ziweiProR2State,'ZIWEI_PROFESSIONAL_READING_V2_ACTIVE');
 assert.equal(product.lineage.ziweiProR2W16ProfessionalUsefulnessHumanReview,'HUMAN_ACCEPTED_24_OF_24');
 assert.equal(product.lineage.ziweiProR2W17ProfessionalCutoverAllowed,true);
 assert.equal(product.lineage.ziweiProR2AuthorityRef,ZIWEI_PROFESSIONAL_READING_V2_AUTHORITY.cutoverAuthorityRef);
 assert(product.specialistRenderer.capabilities.includes('ZIWEI_PRO_R2_W17_PROFESSIONAL_READING_CUTOVER'));
 const pro=product.visuals.find(v=>v.type==='ZIWEI_PRO_R2_PROFESSIONAL_PRESENTATION')?.payload;
 assert(pro);
 assert.equal(pro.palaces.length,12);
 assert.equal(pro.topicsProfessional.length,8);
 assert.equal(pro.timingProfessional.navigationWindow.years.length,6);
 const plan=buildZiweiW9W11RenderPlan(product);
 const main=`${plan.navigationHtml}${plan.visualHtml}${plan.readingHtml}`;
 assert.match(plan.navigationHtml,/data-ziwei-pro-r2-w13-ia="reading-only"/);
 assert.match(plan.readingHtml,/data-ziwei-pro-r2-w13-w14-state="CUSTOMER_READING_ACTIVE"/);
 for(const forbidden of ['未载明','Unspecified','Source pending','Reading Units','96/96','24/24','这项进入计算但尚未解释'])assert(!main.includes(forbidden),`customer surface leaked ${forbidden}`);
 live++;palaces+=pro.palaces.length;topics+=pro.topicsProfessional.length;timingYears+=pro.timingProfessional.navigationWindow.years.length;
}
assert.equal(live,24);assert.equal(palaces,288);assert.equal(topics,192);assert.equal(timingYears,144);
console.log('✓ ZIWEI-PRO-R2 W16 Human admission + W17 Professional Reading Cutover passed.');
console.log('  Human usefulness review: 24/24 ACCEPT; machine substitution=false; numeric ratings remain unasserted rather than fabricated.');
console.log('  ZIWEI_PROFESSIONAL_READING_V2_ACTIVE=true and CUSTOMER_PUBLISHED on the canonical Personal Reality route.');
console.log('  24/24 accepted review cases replayed through the live product adapter: 288 palace units, 192 topic readings, 144 timing-navigation years.');
