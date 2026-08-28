import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildZiWeiCalculationIR} from '../functions/zi-wei-runtime/zi-wei-calculation-ir-runtime.js';
import {executeAndProjectZwrProduction} from '../functions/method-client-delivery/zwr-canonical-projection-runtime.js';
import {getZwrMpaProductionDecision} from '../functions/method-production-activation/zwr-production-authority-runtime.js';
import {buildZiWeiDynamicProjection} from '../functions/zi-wei-dynamic/dynamic-runtime.js';
import {buildCanonicalZiweiChartIR} from '../functions/zi-wei-full-production/ziwei-chart-runtime.js';
import {calculateZiweiCompleteStarPlacement} from '../functions/zi-wei-full-production/ziwei-complete-star-placement-runtime.js';
import {resolveZiweiStarStates} from '../functions/zi-wei-full-production/ziwei-star-state-runtime.js';
import {ZIWEI_STAR_STATE_AUTHORITY_VERSION,ZIWEI_STAR_STATE_TABLE} from '../functions/zi-wei-full-production/ziwei-star-state-authority-v1.js';

const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const exists=p=>fs.existsSync(p);
const base='abab6b358bff574c65b9dfacc7985d5de564d674';
const files=[
 'content/professional/zi-wei-full-production/roadmap/ziwei-full-production-master-work-v1.json',
 'content/professional/zi-wei-full-production/authority/ziwei-fp-w0-current-authority-audit-v1.json',
 'content/professional/zi-wei-full-production/authority/ziwei-fp-w2-school-calculation-authority-v1.json',
 'content/professional/zi-wei-full-production/contracts/ziwei-canonical-chart-contract-v1.json',
 'content/professional/zi-wei-full-production/contracts/ziwei-star-placement-contract-v1.json',
 'content/professional/zi-wei-full-production/contracts/ziwei-star-state-contract-v1.json',
 'content/professional/zi-wei-full-production/registries/ziwei-star-state-registry-v1.json',
 'content/professional/zi-wei-full-production/acceptance/ziwei-fp-w0-w4-engineering-acceptance-v1.json',
 'functions/zi-wei-full-production/ziwei-structural-registry.js',
 'functions/zi-wei-full-production/ziwei-chart-runtime.js',
 'functions/zi-wei-full-production/ziwei-complete-star-placement-runtime.js',
 'functions/zi-wei-full-production/ziwei-star-state-runtime.js',
 'functions/zi-wei-full-production/ziwei-star-state-authority-v1.js'
];
for(const p of files)assert(exists(p),`missing ${p}`);

const master=j(files[0]);
assert.equal(master.baselineCommit,base);
assert.equal(master.works.find(x=>x.work==='ZIWEI-FP-W0').status,'COMPLETE');
assert.match(master.works.find(x=>x.work==='ZIWEI-FP-W4').status,/ENGINEERING_COMPLETE/);
assert.equal(master.works.find(x=>x.work==='ZIWEI-FP-W9').status,'EXISTING_ZWD_AUTHORITY_TO_BE_CONSUMED_NOT_REBUILT');
assert.equal(master.works.find(x=>x.work==='ZIWEI-FP-W10').status,'EXISTING_ZWD_AUTHORITY_TO_BE_CONSUMED_NOT_REBUILT');
for(const boundary of ['NO_SECOND_CANONICAL_METHOD_PROJECTION','NO_SILENT_SCHOOL_MIXING','NO_UNSPECIFIED_STAR_STATE_COERCED_TO_PING'])assert(master.hardBoundaries.includes(boundary));

const audit=j(files[1]),status=cap=>audit.capabilities.find(x=>x.capability===cap)?.status;
assert.equal(status('TWELVE_PALACES'),'CALCULATED');
assert.equal(status('LIFE_BODY_PALACES'),'CALCULATED');
assert.equal(status('FIVE_ELEMENT_BUREAU'),'CALCULATED');
assert.equal(status('FOURTEEN_MAIN_STARS'),'CALCULATED');
assert.equal(status('SUPPORT_STARS'),'PARTIAL');
assert.equal(status('MALEFIC_AND_EXTENDED_STARS'),'ABSENT');
assert.equal(status('NATAL_FOUR_TRANSFORMATIONS'),'CALCULATED');
assert.equal(status('STAR_BRIGHTNESS_STATE'),'ABSENT');
assert.equal(status('DA_XIAN'),'CALCULATED');
assert.equal(status('LIU_NIAN'),'CALCULATED');
assert.equal(status('LIU_YUE'),'ABSENT');
assert.equal(status('PATTERN_CLASSIFICATION'),'ABSENT');
assert.equal(status('CUSTOMER_COMPOSITION'),'PARTIAL');
assert.equal(audit.successorDecision.predecessorsMutated,false);
assert.equal(audit.successorDecision.secondProjectionAuthorityCreated,false);

const currentPolicy=j('content/professional/core-method-runtime/zi-wei-calculation-policy-v1.json');
assert.equal(currentPolicy.status,'HUMAN_FROZEN');
const current=code=>currentPolicy.requiredPolicies.find(x=>x.policyCode===code)?.decision;
assert.equal(current('MAIN_STAR_SYSTEM').brightnessStateIncluded,false,'current frozen production must remain brightness-free');
assert.equal(current('AUXILIARY_STAR_SCOPE').included.length,6,'current frozen production support scope must remain six');
assert.deepEqual(current('TRANSFORMATION_SCOPE').table.REN,['TIAN_LIANG','ZI_WEI','ZUO_FU','WU_QU'],'current frozen Ren transformation row must not be silently rewritten');

const school=j(files[2]);
assert.equal(school.status,'ENGINEERING_FROZEN_PRODUCTION_SOURCE_ADMISSION_PENDING');
assert.equal(school.currentHumanFrozenAuthority.preserveExactly,true);
assert.equal(school.dynamicAuthority.reuseNotRebuild,true);
assert.equal(school.fullProductionEngineeringSuccessor.starPlacementExtension.newStars.length,8);
assert.equal(school.fullProductionEngineeringSuccessor.starPlacementExtension.productionEligible,false);
assert.equal(school.fullProductionEngineeringSuccessor.starState.productionEligible,false);
assert.equal(school.knownAuthorityConflict.code,'REN_HUA_KE_TARGET_CONFLICT');
assert.deepEqual(school.knownAuthorityConflict.currentFrozenProduction,['TIAN_LIANG','ZI_WEI','ZUO_FU','WU_QU']);
assert.deepEqual(school.knownAuthorityConflict.classicalWitnessVariant,['TIAN_LIANG','ZI_WEI','TIAN_FU','WU_QU']);
assert.equal(school.knownAuthorityConflict.action,'DO_NOT_CHANGE_CURRENT_FROZEN_PRODUCTION_TABLE');
assert.equal(school.mixingRules.noSilentFallbackAcrossSchools,true);

const canonicalInput={birthDate:'2023-01-22',birthTime:'05:00:00',birthPlace:{displayName:'Hong Kong',countryCode:'HK',latitude:null,longitude:null},timezone:{iana:'Asia/Hong_Kong',utcOffsetAtBirth:'+08:00',source:'HUMAN_DECLARATION',confidence:'MEDIUM'},timeAccuracy:'EXACT',locale:'zh-Hans',consent:{recordId:'CONSENT-ZIWEI-FP',granted:true,purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',persistence:'NONE'},inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'};
const calcInput={birthDate:canonicalInput.birthDate,birthTime:canonicalInput.birthTime,timeAccuracy:canonicalInput.timeAccuracy,timezone:canonicalInput.timezone};
const sourceIR=buildZiWeiCalculationIR(calcInput,{policy:currentPolicy,executionMode:'INTERNAL_VALIDATION'});
const decision=getZwrMpaProductionDecision('ZI_WEI_DOU_SHU','1.0.0','CALCULATION');
assert.equal(decision.decision,'ELIGIBLE');
const request={schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',methodCode:'ZI_WEI_DOU_SHU',methodVersion:'1.0.0',capability:'CALCULATION',purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',canonicalInput,executionParameters:{},consentRecordId:'CONSENT-ZIWEI-FP',requestId:'REQ-ZIWEI-FP-W1'};
const productionProjection=await executeAndProjectZwrProduction(request,decision);
assert.equal(productionProjection.method.publicMethodCode,'ZI_WEI_PROJECTION');
assert.equal(productionProjection.calculation.structures.find(x=>x.code==='ZI_WEI_STARS').items.length,20);

const dynamic=await buildZiWeiDynamicProjection({requestId:'REQ-ZIWEI-FP-DYN',consentRecordId:'CONSENT-ZIWEI-FP',canonicalInput,natalProjection:productionProjection,targetContext:{targetDate:'2026-08-28',targetTime:'12:00:00',targetTimezone:{iana:'Asia/Kuala_Lumpur',utcOffsetAtTarget:'+08:00'}},executionParameters:{traditionalCalculationSex:'MALE'}});
assert.equal(dynamic.sourceNatalProjectionId,productionProjection.projectionId);
const projectionSnapshot=JSON.stringify(productionProjection),irSnapshot=JSON.stringify(sourceIR),dynamicSnapshot=JSON.stringify(dynamic);
const chart1=await buildCanonicalZiweiChartIR({canonicalProjection:productionProjection,sourceCalculationIR:sourceIR,dynamicProjection:dynamic});
const chart2=await buildCanonicalZiweiChartIR({canonicalProjection:productionProjection,sourceCalculationIR:sourceIR,dynamicProjection:dynamic});
assert.equal(chart1.chartDigest,chart2.chartDigest);
assert.equal(JSON.stringify(productionProjection),projectionSnapshot,'W1 mutated source projection');
assert.equal(JSON.stringify(sourceIR),irSnapshot,'W1 mutated source calculation IR');
assert.equal(JSON.stringify(dynamic),dynamicSnapshot,'W1 mutated dynamic projection');
assert.equal(chart1.palaces.length,12);assert.equal(chart1.stars.length,20);assert.equal(chart1.transformations.length,4);
assert.equal(chart1.lifePalace.branch,'HAI');assert.equal(chart1.lifePalace.zh,'命宫');assert.equal(chart1.bodyPalace.branch,'SI');
assert.equal(chart1.fiveElementBureau.code,'WATER_2');assert.equal(chart1.fiveElementBureau.zh,'水二局');
assert.equal(chart1.birthAuthority.birthYear.stem,'GUI');assert.equal(chart1.birthAuthority.birthYear.branch,'MAO');assert.equal(chart1.birthAuthority.birthHour.code,'MAO');
assert.equal(chart1.palaces.find(x=>x.palaceCode==='SPOUSE').zh,'夫妻宫');
assert.equal(chart1.stars.find(x=>x.starCode==='ZI_WEI').zh,'紫微');
assert.equal(chart1.timeLayers.availability,'ATTACHED_CALCULATED');assert.equal(chart1.timeLayers.dynamicProjectionId,dynamic.projectionId);
assert.equal(chart1.boundaries.secondProjectionAuthorityCreated,false);assert.equal(chart1.boundaries.natalRecalculated,false);assert.equal(chart1.boundaries.productionEligible,false);

const placement1=calculateZiweiCompleteStarPlacement({chart:chart1});
const placement2=calculateZiweiCompleteStarPlacement({chart:chart1});
assert.equal(placement1.placementDigest,placement2.placementDigest);
assert.equal(placement1.currentProductionStarCount,20);assert.equal(placement1.extensionStarCount,8);assert.equal(placement1.totalStarCount,28);
assert.equal(new Set(placement1.allStars.map(x=>x.starCode)).size,28);
const ext=Object.fromEntries(placement1.extensionStars.map(x=>[x.starCode,x]));
assert.equal(ext.LU_CUN.branch,'ZI');assert.equal(ext.QING_YANG.branch,'CHOU');assert.equal(ext.TUO_LUO.branch,'HAI');
assert.equal(ext.HUO_XING.branch,'ZI');assert.equal(ext.LING_XING.branch,'CHOU');assert.equal(ext.DI_KONG.branch,'SHEN');assert.equal(ext.DI_JIE.branch,'YIN');assert.equal(ext.TIAN_MA.branch,'SI');
assert(placement1.extensionStars.every(x=>x.sourceAdmissionState==='PENDING_HUMAN_ADMISSION'&&x.productionEligible===false));
assert.equal(placement1.boundaries.currentProductionStarScopeChanged,false);assert.equal(placement1.boundaries.productionEligible,false);

const stateRegistry=j(files[6]);
assert.equal(stateRegistry.authorityVersion,'ZIWEI_STAR_STATE_CLASSICAL_WITNESS_V1');
assert.equal(ZIWEI_STAR_STATE_AUTHORITY_VERSION,stateRegistry.authorityVersion);
assert.deepEqual(ZIWEI_STAR_STATE_TABLE,stateRegistry.states,'executable star-state authority mirror drifted from reviewable JSON registry');
assert.equal(stateRegistry.normalizationRules.missingCell,'UNSPECIFIED');
assert.equal(stateRegistry.normalizationRules.missingCellNeverCoercedToPing,true);
assert.equal(stateRegistry.vocabulary.length,8);
for(const code of ['MIAO','WANG','DE','LI','PING','BU','XIAN','UNSPECIFIED'])assert(stateRegistry.vocabulary.some(x=>x.stateCode===code));
const states1=resolveZiweiStarStates({placement:placement1}),states2=resolveZiweiStarStates({placement:placement1});
assert.equal(states1.stateDigest,states2.stateDigest);assert.equal(states1.stars.length,28);
const state=code=>states1.stars.find(x=>x.starCode===code)?.state;
assert.equal(state('ZI_WEI').stateCode,'MIAO');
assert.equal(state('TIAN_JI').stateCode,'MIAO');
assert.equal(state('TIAN_TONG').stateCode,'WANG');
assert.equal(state('LIAN_ZHEN').stateCode,'XIAN');
assert.equal(state('TIAN_FU').stateCode,'DE');
assert.equal(state('TAI_YIN').stateCode,'XIAN');
assert.equal(state('LU_CUN').stateCode,'MIAO');
assert.equal(state('QING_YANG').stateCode,'MIAO');
assert.equal(state('TUO_LUO').stateCode,'XIAN');
assert.equal(state('HUO_XING').stateCode,'XIAN');
assert.equal(state('LING_XING').stateCode,'DE');
assert.equal(state('TAI_YANG').stateCode,'UNSPECIFIED','source-unspecified state must fail closed rather than become PING');
assert.equal(state('TIAN_MA').stateCode,'UNSPECIFIED');
assert.equal(states1.coverage.unspecifiedIsNotPing,true);assert(states1.coverage.unclassifiedAtThisChart>0);
assert(states1.stars.every(x=>x.strengthScore===null&&x.goodBadConclusion===null));
assert.equal(states1.boundaries.numericStrengthScoreCreated,false);assert.equal(states1.boundaries.productionEligible,false);

const acceptance=j(files[7]);
assert.equal(acceptance.status,'ACCEPTED_ENGINEERING_FOUNDATION_PRODUCTION_CUTOVER_BLOCKED');
for(const gate of ['CURRENT_AUTHORITY_AUDITED','CANONICAL_CHART_IR_IMPLEMENTED','SCHOOL_COMPONENT_AUTHORITY_EXPLICIT','PLATFORM_BASELINE_28_STAR_ENGINEERING_RUNTIME_IMPLEMENTED','STAR_STATE_VERSIONED_RUNTIME_IMPLEMENTED'])assert.equal(acceptance.gates[gate],true,gate);
for(const gate of ['NEW_RULE_SOURCE_CLAIMS_HUMAN_ADMITTED','CURRENT_PRODUCTION_STAR_SCOPE_CHANGED','CUSTOMER_INTERPRETATION_CHANGED','CUSTOMER_SURFACE_CHANGED','PRODUCTION_GATE_OPEN'])assert.equal(acceptance.gates[gate],false,gate);

console.log('✓ ZIWEI-FP-W0–W4 engineering foundation passed.');
console.log('  W0 audit + W1 derived canonical chart + W2 component authority + W3 28-star engineering placement + W4 source-explicit star states are deterministic.');
console.log('  Existing 20-star production projection, Human-frozen transformation table and ZWD dynamic authority remain unchanged.');
console.log('  New eight-star and star-state rules remain production-blocked until source claims are human-admitted; UNSPECIFIED states are never guessed as PING.');
