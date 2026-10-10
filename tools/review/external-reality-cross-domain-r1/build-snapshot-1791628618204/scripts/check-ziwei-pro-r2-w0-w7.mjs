import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildZiweiFullProductionCustomerRuntime} from '../functions/zi-wei-full-production/ziwei-full-production-customer-runtime.js';
import {adaptZiweiPersonalRealityProduct} from '../functions/personal-reality-product/adapters/ziwei-production-adapter.js';
import {resolveZiweiStandaloneStarMeaning} from '../functions/zi-wei-full-production/ziwei-meaning-registry-runtime.js';
import {STAR_ZH,BRANCH_ORDER} from '../functions/zi-wei-full-production/ziwei-structural-registry.js';
import {ZIWEI_PRO_R2_AUTHORITY,ZIWEI_PRO_R2_ACTIVE_STAR_CODES,ZIWEI_PRO_R2_HUMAN_GATED_STAR_CODES,ZIWEI_PRO_R2_STAR_PROFILES,ZIWEI_PRO_R2_COMBINATION_RULES,resolveZiweiProR2StateAuthority,buildZiweiProR2StateCensus} from '../functions/zi-wei-full-production/ziwei-professional-reading-r2-authority-v1.js';
import {composeZiweiProR2StarPalace,ZIWEI_PRO_R2_PRESENTATION_SCHEMA} from '../functions/zi-wei-full-production/ziwei-professional-reading-r2-runtime.js';
import {buildZiweiW9W11RenderPlan} from '../assets/customer-ui/js/specialists/ziwei/ziwei-specialist-workspace.js';

const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const census=j('content/professional/zi-wei-professional-reading-r2/audit/ziwei-pro-r2-w0-semantic-coverage-census-v1.json');
const w1=j('content/professional/zi-wei-professional-reading-r2/authority/ziwei-pro-r2-w1-star-state-authority-v1.json');
const w2=j('content/professional/zi-wei-professional-reading-r2/authority/ziwei-pro-r2-w2-eight-star-standalone-candidates-v1.json');
const w3=j('content/professional/zi-wei-professional-reading-r2/registries/ziwei-pro-r2-w3-28-star-professional-corpus-v1.json');
const w4=j('content/professional/zi-wei-professional-reading-r2/registries/ziwei-pro-r2-w4-star-palace-composition-v1.json');
const w5=j('content/professional/zi-wei-professional-reading-r2/registries/ziwei-pro-r2-w5-star-combination-composition-v1.json');
const w6=j('content/professional/zi-wei-professional-reading-r2/registries/ziwei-pro-r2-w6-four-transformation-professional-composition-v1.json');
const w7=j('content/professional/zi-wei-professional-reading-r2/contracts/ziwei-pro-r2-w7-network-empty-palace-protocol-v1.json');

assert.equal(census.baselineCommit,'ffb6e102bd3bccf02d2fb620df68561e98ba4b9f');
assert.equal(census.coverageStandard,'CUSTOMER_INTERPRETABLE_COMBINATION_COVERAGE_NOT_ATOMIC_MEANING_COUNT');
const state=buildZiweiProR2StateCensus();
assert.deepEqual({ADMITTED:state.ADMITTED,NOT_APPLICABLE:state.NOT_APPLICABLE,SOURCE_PENDING:state.SOURCE_PENDING,SCHOOL_VARIANT:state.SCHOOL_VARIANT},{ADMITTED:190,NOT_APPLICABLE:84,SOURCE_PENDING:62,SCHOOL_VARIANT:0});
assert.equal(state.totalCells,336);assert.equal(state.applicableCells,252);assert.equal(state.explicitApplicableCoveragePct,75.4);assert.equal(state.fullMatrixAdmittedPct,56.55);
assert.deepEqual(w1.counts,{ADMITTED:190,NOT_APPLICABLE:84,SOURCE_PENDING:62,SCHOOL_VARIANT:0});
for(const starCode of Object.keys(STAR_ZH))for(const branch of BRANCH_ORDER){const x=resolveZiweiProR2StateAuthority(starCode,branch);assert(['ADMITTED','NOT_APPLICABLE','SCHOOL_VARIANT','SOURCE_PENDING'].includes(x.status));assert.equal(x.customerVisible,x.status==='ADMITTED');if(x.status!=='ADMITTED'){assert.equal(x.stateCode,null);assert.equal(x.stateLabel,null);}}

assert.equal(ZIWEI_PRO_R2_ACTIVE_STAR_CODES.length,20);assert.equal(ZIWEI_PRO_R2_HUMAN_GATED_STAR_CODES.length,8);assert.equal(w2.items.length,8);assert.equal(w2.summary.humanAccepted,0);assert.equal(w2.summary.customerRuntimeAllowed,0);
for(const starCode of ZIWEI_PRO_R2_ACTIVE_STAR_CODES){assert.equal(ZIWEI_PRO_R2_STAR_PROFILES[starCode].customerRuntimeAllowed,true);assert.equal(resolveZiweiStandaloneStarMeaning(starCode).state,'AVAILABLE');}
for(const starCode of ZIWEI_PRO_R2_HUMAN_GATED_STAR_CODES){assert.equal(ZIWEI_PRO_R2_STAR_PROFILES[starCode].customerRuntimeAllowed,false);assert.equal(resolveZiweiStandaloneStarMeaning(starCode).state,'BLOCKED_SOURCE_MEANING_NOT_ADMITTED');const item=w2.items.find(x=>x.starCode===starCode);for(const k of ['structuralFunction','constructiveExpression','pressureExpression','contextDependency','whatItDoesNotEstablish'])assert(item?.[k]?.length>8,`${starCode} missing ${k}`);}
assert.equal(w3.items.length,28);assert.equal(w3.summary.dimensionCells,252);for(const item of w3.items)assert.equal(Object.keys(item.dimensions).length,9);
assert.equal(w4.customerReadyPairs,240);assert.equal(w4.totalPairs,336);assert.equal(w4.humanGatedPairs,96);assert.equal(w4.customerReadyPct,71.43);
for(const palace of ['LIFE','CAREER','SPOUSE','WEALTH','TRAVEL']){const x=composeZiweiProR2StarPalace('QI_SHA',palace,'zh-Hans');assert.equal(x.status,'CUSTOMER_READY');assert(x.paragraph.includes('七杀'));}
assert.equal(new Set(['LIFE','CAREER','SPOUSE','WEALTH','TRAVEL'].map(p=>composeZiweiProR2StarPalace('QI_SHA',p,'zh-Hans').paragraph)).size,5,'same star must land differently across palaces');
assert.equal(composeZiweiProR2StarPalace('QING_YANG','LIFE','zh-Hans').status,'HUMAN_GATED');
assert(w5.rules.some(x=>x.combinationId==='ZIWEI_TIANFU'&&x.customerRuntimeAllowed));assert(w5.rules.some(x=>x.combinationId==='WUQU_QISHA'&&x.customerRuntimeAllowed));const spl=w5.rules.find(x=>x.combinationId==='SHA_PO_LANG_INTERACTION');assert.equal(spl.patternQualificationCreated,false);assert.equal(w5.boundaries.shaPoLangPatternAutoQualification,false);
assert.equal(w6.currentTableTargetStarCoverage,'15/15 active standalone meanings');for(const x of ['禄 ≠ 必然赚钱','忌 ≠ 必然倒霉或受伤'])assert(w6.boundaries.includes(x));assert.equal(w7.borrowOppositePlacement,false);assert.equal(w7.borrowOppositeStandaloneMeaningAsOwn,false);assert.equal(w7.emptyPalaceProtocol.length,7);
assert.equal(ZIWEI_PRO_R2_AUTHORITY.w17CutoverAllowed,false,'W17 professional cutover must remain blocked before W2 Human admission');

function executionRequest({birthDate='2023-01-22',birthTime='05:00:00',locale='zh-Hans',id='STD'}={}){const consentRecordId=`CONSENT-ZIWEI-PRO-R2-${id}`;const canonicalInput={birthDate,birthTime,birthPlace:{displayName:'Hong Kong',countryCode:'HK',latitude:22.3193,longitude:114.1694},timezone:{iana:'Asia/Hong_Kong',utcOffsetAtBirth:'+08:00',source:'GOVERNED_RESOLUTION',confidence:'HIGH'},timeAccuracy:'EXACT',locale,consent:{recordId:consentRecordId,granted:true,purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',persistence:'NONE'},inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'};return {schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',methodCode:'ZI_WEI_DOU_SHU',methodVersion:'1.0.0',capability:'CALCULATION',purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',canonicalInput,executionParameters:{traditionalCalculationSex:'MALE'},consentRecordId,requestId:`REQ-ZIWEI-PRO-R2-${id}`};}
const targetContext={targetDate:'2026-08-30',targetTime:'12:00',targetTimezone:{iana:'Asia/Kuala_Lumpur',utcOffsetAtTarget:'+08:00'},source:'EXPLICIT_REQUEST'};
async function build(locale='zh-Hans'){const full=await buildZiweiFullProductionCustomerRuntime({executionRequest:executionRequest({locale}),targetContext,locale});const product=adaptZiweiPersonalRealityProduct({publicationEnvelope:full.customerProduct,locale});const pro=product.visuals.find(v=>v.type==='ZIWEI_PRO_R2_PROFESSIONAL_PRESENTATION')?.payload;return {full,product,pro,plan:buildZiweiW9W11RenderPlan(product)};}
const a=await build('zh-Hans');const b=await build('zh-Hans');
assert.equal(a.pro.schemaVersion,ZIWEI_PRO_R2_PRESENTATION_SCHEMA);assert.equal(a.pro.professionalDigest,b.pro.professionalDigest,'PRO-R2 projection must be deterministic');assert.equal(a.pro.palaces.length,12);assert.equal(a.pro.coverage.customerReadyStarPalacePairs,240);assert.equal(a.pro.coverage.humanGatedStandaloneStars,8);
for(const palace of a.pro.palaces){assert(palace.paragraphs.length>=3,`${palace.palaceCode} lacks professional interpretation density`);for(const star of palace.stars){assert.equal(star.stateCustomerVisible,star.stateAuthority==='ADMITTED');if(star.stateAuthority!=='ADMITTED')assert.equal(star.stateLabel,null);}if(palace.network.emptyMainStarPalace){assert(palace.network.paragraphs.some(x=>/空宫/.test(x)));assert(palace.network.paragraphs.some(x=>/不会被搬进本宫/.test(x)));}}
const visible=`${a.plan.navigationHtml}${a.plan.visualHtml}${a.plan.readingHtml}`;
for(const forbidden of ['未载明','Unspecified','独立星意尚未准入','Standalone meaning not admitted','解释空白','Source pending','SOURCE_PENDING','这项进入计算但尚未解释'])assert(!visible.includes(forbidden),`default customer HTML leaked ${forbidden}`);
assert.equal((a.plan.visualHtml.match(/data-ziwei-pro-r2-palace=/g)||[]).length,12);assert.match(a.plan.readingHtml,/data-ziwei-pro-r2-w0-w7="true"/);assert.match(a.plan.technicalHtml,/20 颗 standalone star|20 standalone stars/);assert.match(a.plan.technicalHtml,/8 颗 source-bound candidate|8 source-bound candidates/);
assert(a.pro.palaces.some(p=>p.transformations.length>0),'fixture must exercise professional four-transformation composition');for(const p of a.pro.palaces)for(const x of p.transformations){assert(!/一定赚钱|保证赚钱|一定倒霉|保证倒霉|guaranteed money|guaranteed misfortune/i.test(x.paragraph));}
assert(a.pro.palaces.some(p=>p.network.emptyMainStarPalace),'fixture must exercise empty-palace protocol');
assert.equal(a.product.lineage.ziweiProR2State,'ENGINEERING_ACTIVE_20_STARS_8_HUMAN_GATED');

console.log('✓ ZIWEI-PRO-R2 W0–W7 semantic production successor passed.');
console.log('  W0: customer-interpretable coverage reports 20/28 active standalone stars and 240/336 customer-ready star×palace pairs (71.43%), not the legacy “65 meanings”.');
console.log('  W1: 336 state cells = 190 ADMITTED / 84 NOT_APPLICABLE / 62 SOURCE_PENDING / 0 SCHOOL_VARIANT; default customer HTML has zero “未载明”.');
console.log('  W2: 8/8 source-bound standalone candidates exist, but Human admission remains 0/8 and customer runtime stays fail-closed for their meanings.');
console.log('  W3: 28 stars × 9 professional dimensions = 252 cells; 180 active + 72 Human-gated.');
console.log('  W4: 240/336 star×palace combinations are customer-ready; palace semantic landing is mechanically distinct.');
console.log('  W5: governed interaction rules compose real combinations; Sha-Po-Lang interaction does not auto-qualify a traditional pattern.');
console.log('  W6: current transformation targets are composition-ready 15/15 with no money/promotion/fame/misfortune guarantees.');
console.log('  W7: triad/opposite/flank/empty-palace interpretation protocol is active across 12/12 palace units; opposite stars remain reference-only.');
console.log('  W17 cutover remains blocked until the 8-case W2 Human semantic admission is explicitly accepted.');
