import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {buildBaziMethodNativeReading} from '../functions/personal-professional-reading/bazi-method-native-reading-adapter.js';
const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const BASE='content/customer-experience-rebuild/ppr-c1';
const baseline='a06506cbbc9bf0bdd11ff1c740f7be65276d84d9';

const recon=json(`${BASE}/audit/ppr-c1-current-main-reconciliation-a06506c-v1.json`);
assert.equal(recon.baselineCommit,baseline);assert.equal(recon.status,'RECONCILED_BEFORE_W7_W9');assert.equal(recon.reconciliation.baziMethodNativeServerWiringRestored,true);assert.equal(recon.reconciliation.baziProfessionalClientWiringRestored,true);assert.equal(recon.reconciliation.ziweiCurrentCustomerRuntimePreserved,true);

const patternContract=json(`${BASE}/contracts/bazi-pattern-professional-surface-contract-v1.json`);
assert.equal(patternContract.status,'FROZEN_PRESENTATION_PROJECTION_CONTRACT');assert.deepEqual(patternContract.surfaceOrder,['PATTERN_CANDIDATE','SUPPORT','DEFEAT','RESCUE','UNRESOLVED']);assert.equal(patternContract.rules.rulesetPresenceDoesNotEqualCaseSpecificDefeat,true);assert.equal(patternContract.rules.rulesetPresenceDoesNotEqualCaseSpecificRescue,true);
const schoolRegistry=json(`${BASE}/registries/bazi-school-professional-reading-registry-v1.json`);assert.equal(schoolRegistry.schools.length,3);assert.equal(new Set(schoolRegistry.schools.map(x=>x.schoolCode)).size,3);assert.equal(schoolRegistry.rules.silentMergeAllowed,false);assert.equal(schoolRegistry.rules.singleUniversalUsefulGodOutputAllowed,false);
const temporalContract=json(`${BASE}/contracts/bazi-temporal-experience-contract-v1.json`);assert.equal(temporalContract.noTarget.fullDaYunTimelineReadable,true);assert.equal(temporalContract.noTarget.browserDateInferenceAllowed,false);assert.equal(temporalContract.noTarget.browserTimezoneInferenceAllowed,false);assert.equal(temporalContract.boundaries.combinationEqualsTransformation,false);assert.equal(temporalContract.boundaries.eventPredictionAllowed,false);

const natal=json('content/professional/bzr-full-production/fixtures/bazi-da-yun-integration-fixture-v1.json');
const temporal=json('content/professional/bzr-full-production/fixtures/bazi-liu-nian-interaction-fixture-v1.json').temporalProjection;
const noTarget=await buildBaziMethodNativeReading({canonicalProjection:natal,canonicalInput:{birthDate:'1989-11-15'},locale:'zh-Hans',targetContext:null});
const explicit=await buildBaziMethodNativeReading({canonicalProjection:natal,canonicalInput:{birthDate:'1989-11-15'},locale:'zh-Hans',temporalProjectionOverride:temporal});
for(const product of [noTarget,explicit]){assert.equal(product.methodId,'BZR');assert.equal(product.publicationDecision.customerPublishable,true);assert.equal(product.professionalModules.schemaVersion,'PHI-OS-PPR-C1-BAZI-PROFESSIONAL-SURFACE-MODULES-v1.0.0');assert.equal(product.professionalModules.boundaries.createsMeaning,false);assert.equal(product.professionalModules.boundaries.recalculatesBazi,false);}
const pattern=explicit.professionalModules.pattern;assert.equal(pattern.candidates.length,3);assert.equal(pattern.state,'ALTERNATIVES_OPEN');assert.equal(pattern.verdict.primaryPattern,null);assert(pattern.candidates.some(x=>x.visibleStemMatch===true));assert(pattern.candidates.some(x=>x.visibleStemMatch===false));for(const c of pattern.candidates){assert.equal(c.defeatEvaluation.state,'NOT_CASE_SPECIFICALLY_ESTABLISHED');assert.equal(c.rescueEvaluation.state,'NOT_CASE_SPECIFICALLY_ESTABLISHED');}assert.equal(pattern.boundaries.defeatInvented,false);assert.equal(pattern.boundaries.rescueInvented,false);
const schools=explicit.professionalModules.schools;assert.equal(schools.length,3);assert.deepEqual(new Set(schools.map(x=>x.schoolCode)),new Set(['ZI_PING_MONTH_COMMAND_USE_v1','DI_TIAN_SUI_TI_YONG_BALANCE_v1','DI_TIAN_SUI_CLIMATE_TIAOHOU_v1']));assert(schools.every(x=>x.resolutionState==='SCHOOL_VIEW_OPEN'));assert(schools.every(x=>x.customerText));
const nt=noTarget.professionalModules.timing,et=explicit.professionalModules.timing;assert.equal(nt.state,'UNAVAILABLE');assert.equal(nt.allDaYun.length,8);assert.equal(nt.currentDaYun,null);assert.equal(nt.annual,null);assert.equal(et.state,'EXPLICIT');assert.equal(et.allDaYun.length,8);assert.equal(et.currentDaYun.cycleNumber,4);assert.equal(et.annual.year,2054);assert(et.interactions.crossLayerGroups.some(x=>x.spansThreeLayers===true&&x.transformationEstablished===false));assert.equal(et.boundaries.currentDateInferred,false);assert.equal(et.boundaries.browserTimezoneInferred,false);assert.equal(et.boundaries.eventPredictionCreated,false);

const renderer=read('assets/customer-ui/js/surfaces/bazi-professional-reading.js');for(const name of ['renderBaziPatternSurface','renderBaziSchoolSurface','renderBaziTimingSurface'])assert.match(renderer,new RegExp(`export function ${name}`));for(const label of ['Support','支持','Defeat','败格','Rescue','救应','Unresolved','未决','THREE SCHOOLS','三套学派','NATAL × DA YUN × LIU NIAN','原局 × 大运 × 流年'])assert(renderer.includes(label),`missing renderer label ${label}`);assert.match(renderer,/Structure present ≠ transformation established|组合出现 ≠ 已经化成/);assert.doesNotMatch(renderer,/大吉|大凶|必发财|必结婚/);
const liveRenderer=read('assets/customer-ui/js/surfaces/single-method-reading.js');assert.match(liveRenderer,/renderBaziWholeChartFirst/);
const client=read('assets/customer-ui/js/surfaces/personal-reality.js');assert.match(client,/renderBaziPatternSurface/);assert.match(client,/renderBaziSchoolSurface/);assert.match(client,/renderBaziTimingSurface/);assert.match(client,/baziTemporalContext/);assert.match(client,/baziTargetSupplied>0&&baziTargetSupplied<4/);assert.doesNotMatch(client,/seedBaziTargetContext/);
// W9 established the four-field runtime boundary. The later frozen PPR-R3
// shared host intentionally does not expose that historical static form; a
// specialist successor is required before it can be presented again. Preserve
// both truths: the explicit runtime path above works, and this checker must not
// mutate or make a UI-cutover claim about the protected host.
const pagePath='perspectives/personal/index.html',page=read(pagePath);
const sharedFreeze=json(`${BASE}/contracts/bazi-ppr-r3-shared-freeze-guard-v1.json`);
assert.equal(sharedFreeze.status,'FROZEN_SHARED_SURFACE_UNCHANGED');
assert.equal(sha(pagePath),sharedFreeze.protectedFiles[pagePath]);
for(const field of ['baziTargetDate','baziTargetTime','baziTargetTimezoneIana','baziTargetUtcOffset'])assert.doesNotMatch(page,new RegExp(`name="${field}"`));
const api=read('functions/api/customer-personal-reality.js');assert.match(api,/methodNativeReading\.BZR=await buildBaziMethodNativeReading/);assert.match(api,/targetContext:body\?\.baziTemporalContext\|\|null/);assert.match(api,/buildZiweiFullProductionCustomerRuntime/,'current Zi Wei runtime must remain present');

const fixture=json(`${BASE}/fixtures/bazi-professional-w7-w9-fixture-v1.json`);assert.equal(fixture.expected.patternCandidateCount,pattern.candidates.length);assert.equal(fixture.expected.schoolViewCount,schools.length);assert.equal(fixture.expected.daYunCount,et.allDaYun.length);assert.equal(fixture.expected.currentDaYunCycleNumber,et.currentDaYun.cycleNumber);assert.equal(fixture.expected.annualYear,et.annual.year);
const acceptance=json(`${BASE}/acceptance/ppr-c1-w7-w9-engineering-acceptance-v1.json`);assert.equal(acceptance.status,'ENGINEERING_COMPLETE');assert.equal(acceptance.gates.W7_CASE_SPECIFIC_DEFEAT_OR_RESCUE_INVENTED,false);assert.equal(acceptance.gates.W8_SILENT_SCHOOL_MERGE_CREATED,false);assert.equal(acceptance.gates.W9_EVENT_OR_GOOD_BAD_VERDICT_CREATED,false);
const roadmap=json(`${BASE}/roadmap/ppr-c1-master-work-v3.json`);assert.equal(roadmap.status,'ACTIVE_W0_W9_COMPLETE_W10_NEXT');assert.equal(roadmap.works.find(x=>x.work==='PPR-C1-W10').status,'NEXT');
console.log('✓ PPR-C1 W7–W9 Pattern + three-school reading + Natal × Da Yun × Liu Nian customer timing passed.');
console.log(`  W7: ${pattern.candidates.length} pattern candidates; defeat/rescue remain case-specific fail-closed; primary pattern unresolved.`);
console.log(`  W8: ${schools.length} school-qualified views remain distinct.`);
console.log(`  W9: ${et.allDaYun.length} Da Yun cycles; explicit current cycle ${et.currentDaYun.cycleNumber}; annual ${et.annual.year}; ${et.interactions.crossLayerGroups.length} cross-layer group(s).`);
