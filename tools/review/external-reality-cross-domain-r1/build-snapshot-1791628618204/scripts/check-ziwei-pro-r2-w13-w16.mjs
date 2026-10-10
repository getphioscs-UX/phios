import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildZiweiFullProductionCustomerRuntime} from '../functions/zi-wei-full-production/ziwei-full-production-customer-runtime.js';
import {adaptZiweiPersonalRealityProduct} from '../functions/personal-reality-product/adapters/ziwei-production-adapter.js';
import {buildZiweiW9W11RenderPlan} from '../assets/customer-ui/js/specialists/ziwei/ziwei-specialist-workspace.js';
import {ZIWEI_PRO_R2_AUTHORITY_V2} from '../functions/zi-wei-full-production/ziwei-professional-reading-r2-authority-v2.js';

const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const base='content/professional/zi-wei-professional-reading-r2';
const w13=j(`${base}/contracts/ziwei-pro-r2-w13-customer-ia-cleanup-contract-v1.json`);
const w14=j(`${base}/contracts/ziwei-pro-r2-w14-chart-professional-density-contract-v1.json`);
const w15=j(`${base}/campaign/ziwei-pro-r2-w15-professional-quality-campaign-v1.json`);
const w15a=j(`${base}/acceptance/ziwei-pro-r2-w15-machine-acceptance-v1.json`);
const w16c=j(`${base}/review/ziwei-pro-r2-w16-human-review-cases-v1.json`);
const w16t=j(`${base}/review/ziwei-pro-r2-w16-human-review-results-template-v1.json`);
const w16s=j(`${base}/acceptance/ziwei-pro-r2-w16-human-review-status-v1.json`);
const manifest=j(`${base}/manifest/ziwei-pro-r2-w13-w16-manifest-v1.json`);
const reviewHtml=fs.readFileSync(`${base}/review/ziwei-pro-r2-w16-human-review.html`,'utf8');

assert.equal(manifest.stages.W15,'MACHINE_VERIFIED_96_OF_96');assert.equal(manifest.stages.W16,'PENDING_0_OF_24');assert.equal(manifest.stages.W17,'BLOCKED_PENDING_W16_HUMAN_ACCEPTANCE');assert.equal(manifest.customerProduct.ziweiProfessionalReadingV2Active,false);
assert.equal(w13.status,'ENGINEERING_ACTIVE');assert.equal(w13.customerMainNavigation.length,7);assert.equal(w13.customerRules.evidenceBoundaryMainNavAllowed,false);assert.equal(w13.customerRules.campaignCountersMainSurfaceAllowed,false);
assert.equal(w14.status,'ENGINEERING_ACTIVE');assert.equal(w14.deferredAuthority.length,2);assert(w14.deferredAuthority.every(x=>x.status==='DEFERRED_NO_ADMITTED_CALCULATION_AUTHORITY'&&x.defaultCustomerSurface==='OMIT'));assert.equal(w14.boundaries.fabricateLifeMasterOrBodyMaster,false);
assert.equal(w15.status,'MACHINE_VERIFIED_96_OF_96');assert.equal(w15.summary.total,96);assert.equal(w15.summary.passed,96);assert.equal(w15.summary.failed,0);assert.equal(w15.summary.meaningfulPalaces,1152);assert.equal(w15.summary.meaningfulTopics,768);assert.equal(w15.summary.duplicatePalaceCompositions,0);assert.equal(w15.summary.structureOnlyFindings,0);assert.equal(w15.summary.forbiddenCustomerSurfaceHits,0);assert.equal(w15.summary.timingInterpretiveCases,96);assert.equal(w15.summary.w14DensityCases,96);assert(w15.cases.every(x=>x.passed));
assert.equal(w15a.status,'MACHINE_VERIFIED_96_OF_96');assert.equal(w15a.humanReviewSubstituted,false);assert.equal(w15a.w16HumanReviewAllowed,true);assert.equal(w15a.w17CutoverAllowed,false);
assert.equal(w16c.cases.length,24);assert.equal(new Set(w16c.cases.map(x=>x.lifeBranch)).size,12);assert.deepEqual(Object.fromEntries(['zh-Hans','en'].map(l=>[l,w16c.cases.filter(x=>x.input.locale===l).length])),{'zh-Hans':12,en:12});
assert.equal(w16t.reviewStatus,'PENDING_0_OF_24');assert.equal(w16t.acceptedCount,0);assert.equal(w16t.pendingCount,24);assert(w16t.items.every(x=>x.decision==='PENDING'));assert.equal(w16t.productionAdmissionAllowed,false);assert.equal(w16t.w17CutoverAllowed,false);
assert.equal(w16s.status,'PENDING_0_OF_24');assert.equal(w16s.machineCampaign,'PASS_96_OF_96');assert.equal(w16s.humanReviewWasMachineSubstituted,false);assert.equal(w16s.w17CutoverAllowed,false);
assert.match(reviewHtml,/看完是否知道这张盘在说什么/);for(const x of ['professionalDepth','comprehensibility','chartSpecificity','palaceDifferentiation','topicUsefulness','timingUsefulness','repetition','emptyLanguage'])assert(reviewHtml.includes(`data-rating="${x}"`));assert.match(reviewHtml,/PENDING/);assert(!/HUMAN_ACCEPTED_24_OF_24[^']*reviewStatus/.test(reviewHtml));
assert.equal(ZIWEI_PRO_R2_AUTHORITY_V2.w17CutoverAllowed,false);

function req(locale,birthDate,birthTime,sex,id){const consentRecordId=`CONSENT-${id}`;const canonicalInput={birthDate,birthTime,birthPlace:{displayName:'Hong Kong',countryCode:'HK',latitude:22.3193,longitude:114.1694},timezone:{iana:'Asia/Hong_Kong',utcOffsetAtBirth:'+08:00',source:'GOVERNED_RESOLUTION',confidence:'HIGH'},timeAccuracy:'EXACT',locale,consent:{recordId:consentRecordId,granted:true,purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',persistence:'NONE'},inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'};return {schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',methodCode:'ZI_WEI_DOU_SHU',methodVersion:'1.0.0',capability:'CALCULATION',purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',canonicalInput,executionParameters:{traditionalCalculationSex:sex},consentRecordId,requestId:`REQ-${id}`};}
const targetContext={targetDate:'2026-08-30',targetTime:'12:00',targetTimezone:{iana:'Asia/Kuala_Lumpur',utcOffsetAtTarget:'+08:00'},source:'EXPLICIT_REQUEST'};
for(const x of [{locale:'zh-Hans',birthDate:'1988-01-15',birthTime:'01:00:00',sex:'MALE',id:'ZH'},{locale:'en',birthDate:'1991-07-19',birthTime:'13:00:00',sex:'FEMALE',id:'EN'}]){
 const full=await buildZiweiFullProductionCustomerRuntime({executionRequest:req(x.locale,x.birthDate,x.birthTime,x.sex,x.id),targetContext,locale:x.locale});
 const product=adaptZiweiPersonalRealityProduct({publicationEnvelope:full.customerProduct,locale:x.locale});
 const pro=product.visuals.find(v=>v.type==='ZIWEI_PRO_R2_PROFESSIONAL_PRESENTATION')?.payload;assert(pro);
 const plan=buildZiweiW9W11RenderPlan(product),main=`${plan.navigationHtml}${plan.visualHtml}${plan.readingHtml}`;
 assert.match(plan.navigationHtml,/data-ziwei-pro-r2-w13-ia="reading-only"/);assert.equal((plan.navigationHtml.match(/data-ppr-r3-nav-target=/g)||[]).length,7);assert(!/(Evidence|证据与边界)/i.test(plan.navigationHtml));
 assert.match(plan.readingHtml,/data-ziwei-pro-r2-w13-w14="true"/);assert.match(plan.readingHtml,/data-ziwei-pro-r2-w13-w14-state="CUSTOMER_READING_ACTIVE"/);assert.match(plan.readingHtml,/data-ziwei-pro-r2-state="28_ACTIVE_W8_W12_COMPOSED"/);
 assert.equal((plan.visualHtml.match(/data-ziwei-pro-r2-palace=/g)||[]).length,12);assert.match(plan.readingHtml,/data-ziwei-pro-r2-w14-density="true"/);
 const d=pro.chartProfessionalDensity;assert.equal(d.palaces.length,12);assert(d.birth.date&&d.birth.time&&d.birth.timezone&&d.fiveElementBureau.label);assert(d.palaces.every(p=>p.stemBranchLabel&&p.daXianAgeRange));assert.equal(d.palaces.flatMap(p=>p.stars).length,28);assert.equal(d.deferredAuthorityFields.length,2);assert(d.deferredAuthorityFields.every(f=>f.customerVisible===false));
 assert.equal(pro.palaces.length,12);assert(pro.palaces.every(p=>Object.values(p.professionalUnit).every(v=>String(v||'').trim().length>=12)));assert.equal(new Set(pro.palaces.map(p=>p.professionalUnit.composition)).size,12);assert.equal(pro.topicsProfessional.length,8);assert(pro.topicsProfessional.every(t=>Object.values(t.sections).every(v=>String(v||'').trim().length>=12)));assert.equal(pro.timingProfessional.navigationWindow.years.length,6);
 for(const forbidden of ['未载明','Unspecified','Source pending','Reading Units','96/96','24/24','这项进入计算但尚未解释'])assert(!main.includes(forbidden),`main surface leaked ${forbidden}`);
 assert.match(plan.technicalHtml,/About this reading|关于这份读取/);assert.match(plan.technicalHtml,/Technical lineage/);assert.match(plan.technicalHtml,/Life Master|命主/);assert.match(plan.technicalHtml,/Body Master|身主/);
}
console.log('✓ ZIWEI-PRO-R2 W13–W16 professional customer product gate passed.');
console.log('  W13: customer IA is reading-only; technical governance is collapsed under About this reading.');
console.log('  W14: calculated chart density includes birth frame, bureau, 12 palace stems, 12 Da Xian age ranges, 28-star hierarchy and transformation layers; Life Master / Body Master remain omitted because no admitted calculation authority exists.');
console.log('  W15: professional-quality machine campaign passed 96/96 with 1152/1152 meaningful palace units, 768/768 meaningful topic readings, zero duplicate palace compositions, zero structure-only composition findings and six interpretive timing years per case.');
console.log('  W16 historical checkpoint: the original review-ready artifact remains 0/24 and is preserved unchanged.');
console.log('  Successor W16 Human admission + W17 cutover gate follows.');
await import('./check-ziwei-pro-r2-w16-w17.mjs');
