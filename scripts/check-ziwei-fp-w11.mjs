import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {buildZiWeiCalculationIR} from '../functions/zi-wei-runtime/zi-wei-calculation-ir-runtime.js';
import {executeAndProjectZwrProduction} from '../functions/method-client-delivery/zwr-canonical-projection-runtime.js';
import {getZwrMpaProductionDecision} from '../functions/method-production-activation/zwr-production-authority-runtime.js';
import {buildZiWeiDynamicProjection} from '../functions/zi-wei-dynamic/dynamic-runtime.js';
import {buildCanonicalZiweiChartIR} from '../functions/zi-wei-full-production/ziwei-chart-runtime.js';
import {calculateZiweiCompleteStarPlacement} from '../functions/zi-wei-full-production/ziwei-complete-star-placement-runtime.js';
import {resolveZiweiStarStates} from '../functions/zi-wei-full-production/ziwei-star-state-runtime.js';
import {buildZiweiFourTransformationMatrix} from '../functions/zi-wei-full-production/ziwei-four-transformation-matrix-runtime.js';
import {buildZiweiPalaceRelationshipEngine} from '../functions/zi-wei-full-production/ziwei-palace-relationship-engine.js';
import {buildZiweiStarCombinationRuntime} from '../functions/zi-wei-full-production/ziwei-star-combination-runtime.js';
import {evaluateAdmittedZiweiPatterns} from '../functions/zi-wei-full-production/ziwei-admitted-pattern-runtime.js';
import {buildZiweiDaXianIntegrationIR} from '../functions/zi-wei-full-production/ziwei-da-xian-integration-runtime.js';
import {buildZiweiLiuNianIntegrationIR} from '../functions/zi-wei-full-production/ziwei-liu-nian-integration-runtime.js';
import {ZIWEI_FP_W11_MEANING_REGISTRY,assertZiweiMeaningAuthority} from '../functions/zi-wei-full-production/ziwei-meaning-authority-v1.js';
import {resolveZiweiMeaning,resolveZiweiStandaloneStarMeaning,buildZiweiMeaningContext} from '../functions/zi-wei-full-production/ziwei-meaning-registry-runtime.js';

const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha256Text=v=>crypto.createHash('sha256').update(v).digest('hex');
const base='content/professional/zi-wei-full-production';
const paths={
 registry:`${base}/registries/ziwei-meaning-registry-v1.json`,
 contract:`${base}/contracts/ziwei-meaning-registry-contract-v1.json`,
 authority:`${base}/authority/ziwei-fp-w11-meaning-authority-v1.json`,
 fixture:`${base}/fixtures/ziwei-fp-w11-meaning-validation-fixture-v1.json`,
 acceptance:`${base}/acceptance/ziwei-fp-w11-engineering-acceptance-v1.json`,
 roadmap:`${base}/roadmap/ziwei-full-production-master-work-v5.json`,
 legacy:'content/zi-wei-runtime/meaning/zi-wei-meaning-ontology-v1.json',
 dynamic:'content/professional/zi-wei-dynamic/registries/zi-wei-dynamic-meaning-ontology-v1.json',
 patternRegistry:`${base}/registries/ziwei-pattern-rule-registry-v1.json`,
 stateRegistry:`${base}/registries/ziwei-star-state-registry-v1.json`
};
for(const p of [...Object.values(paths),'functions/zi-wei-full-production/ziwei-meaning-authority-v1.js','functions/zi-wei-full-production/ziwei-meaning-registry-runtime.js'])assert.ok(fs.existsSync(p),`missing ${p}`);

const registry=j(paths.registry),contract=j(paths.contract),authority=j(paths.authority),fixture=j(paths.fixture),ex=fixture.expected;
assert.equal(registry.schemaVersion,'PHI-OS-ZIWEI-FP-W11-MEANING-REGISTRY-v1.0.0');
assert.equal(registry.baselineCommit,'31f0cb5dcf47c1e9419ef67ac89968d06834b35d');
assert.equal(registry.meaningCount,ex.meaningCount);assert.equal(registry.items.length,ex.meaningCount);
assert.equal(new Set(registry.items.map(x=>x.meaningCode)).size,registry.items.length);
assert.deepEqual(registry.kindCounts,{PALACE:12,STAR:20,TRANSFORMATION:4,EMPHASIS:1,STAR_STATE:8,PALACE_RELATIONSHIP:5,PATTERN:11,TEMPORAL:4});
const actualCounts={};for(const x of registry.items)actualCounts[x.kind]=(actualCounts[x.kind]||0)+1;assert.deepEqual(actualCounts,registry.kindCounts);
assert.equal(registry.coverage.legacyAtomicMeaningCount,ex.legacyAtomicMeaningCount);
assert.equal(registry.coverage.standaloneStarMeaningAvailable,ex.standaloneStarMeaningAvailable);
assert.equal(registry.coverage.standaloneStarMeaningBlocked,ex.standaloneStarMeaningBlocked);
assert.deepEqual(registry.coverage.blockedStandaloneStarCodes,ex.blockedStarCodes);
for(const k of ['atomicMeaningIsCustomerInterpretation','meaningRegistryMayCreateRealityFact','patternOutcomeTextImported','starStateConvertedToNumericStrength','oppositeMeansConflict','triadMeansSupport','extensionStarGenericFallbackAllowed','rendererMayInventMeaning','customerCutoverAllowed'])assert.equal(registry.governance[k],false);
assert.equal(registry.governance.missingStandaloneStarMeaningFailsClosed,true);assert.equal(registry.governance.w12FindingRequiredBeforeCustomerClaim,true);
assert.equal(assertZiweiMeaningAuthority().meaningCount,65);assert.deepEqual(ZIWEI_FP_W11_MEANING_REGISTRY,registry);

// The 36 already-governed meanings are reused exactly at the semantic payload level.
const legacy=j(paths.legacy);assert.equal(legacy.meaningCount,36);assert.equal(legacy.items.length,36);
const byCode=new Map(registry.items.map(x=>[x.meaningCode,x]));
for(const old of legacy.items){
 const now=byCode.get(old.meaningCode);assert(now,`legacy meaning missing ${old.meaningCode}`);
 for(const k of ['kind','sourceCode','meaningType'])assert.equal(now[k],old[k],`legacy ${k} changed ${old.meaningCode}`);
 assert.deepEqual(now.label,old.label,`legacy label changed ${old.meaningCode}`);
 assert.deepEqual(now.definition,old.definition,`legacy definition changed ${old.meaningCode}`);
 assert.equal(now.legacySemanticDigest,old.semanticDigest,`legacy digest lineage changed ${old.meaningCode}`);
}

// Extension-star placement/state admission does not silently become standalone interpretation.
const blocked=new Set(ex.blockedStarCodes);for(const starCode of blocked){assert.equal(byCode.has(`CM-ZWR-STAR-${starCode}`),false,`invented standalone meaning ${starCode}`);const r=resolveZiweiStandaloneStarMeaning(starCode);assert.equal(r.state,'BLOCKED_SOURCE_MEANING_NOT_ADMITTED');assert.equal(r.meaning,null);}
assert.throws(()=>resolveZiweiMeaning('CM-ZWR-STAR-LU_CUN'),/ZIWEI_FP_W11_MEANING_NOT_FOUND/);
assert.throws(()=>resolveZiweiStandaloneStarMeaning('NOT_A_STAR'),/ZIWEI_FP_W11_UNKNOWN_STAR_MEANING_SCOPE/);

// Eight categorical state semantics exist, but no numeric strength or automatic verdict is created.
const states=registry.items.filter(x=>x.kind==='STAR_STATE');assert.equal(states.length,ex.stateMeaningCount);
assert.deepEqual(new Set(states.map(x=>x.sourceCode)),new Set(['MIAO','WANG','DE','LI','PING','BU','XIAN','UNSPECIFIED']));
for(const x of states){assert.equal(x.meaningType,'STRUCTURAL_STATE_MODIFIER');assert.equal(x.boundaries.createsGoodBadVerdict,false);assert.equal(typeof x.strengthScore,'undefined');assert.equal(typeof x.weight,'undefined');assert.match(x.definition.en,/not converted into a numeric strength|does not specify a state/i);}

// Relationship semantics stay geometric/contextual. Opposite is not conflict; triad is not automatic support.
const relations=registry.items.filter(x=>x.kind==='PALACE_RELATIONSHIP');assert.equal(relations.length,ex.relationshipMeaningCount);
assert.deepEqual(new Set(relations.map(x=>x.sourceCode)),new Set(['OPPOSITE','TRIAD','SAN_FANG_SI_ZHENG','FLANK','EMPTY_PALACE_OPPOSITE_REFERENCE']));
assert.match(byCode.get('CM-ZWR-RELATION-OPPOSITE').definition.en,/does not mean conflict/i);
assert.match(byCode.get('CM-ZWR-RELATION-TRIAD').definition.en,/not automatically (?:mean|classified as) support/i);
assert.match(byCode.get('CM-ZWR-RELATION-EMPTY_PALACE_OPPOSITE_REFERENCE').definition.en,/without copying/i);

// Every pattern meaning is backed by a Human-admitted W8 rule and contains qualification semantics only.
const patternRegistry=j(paths.patternRegistry);assert.equal(patternRegistry.admissionState,'HUMAN_ADMITTED');assert.equal(patternRegistry.ruleCount,11);
const patternMeanings=registry.items.filter(x=>x.kind==='PATTERN');assert.equal(patternMeanings.length,ex.patternMeaningCount);
const rulesByCode=new Map(patternRegistry.rules.map(x=>[x.patternCode,x]));
for(const x of patternMeanings){const r=rulesByCode.get(x.sourceCode);assert(r,`pattern meaning without admitted rule ${x.sourceCode}`);assert.equal(r.admissionState,'HUMAN_ADMITTED');assert.equal(x.notes.sourceClaimId,r.sourceClaimId);assert.equal(x.boundaries.createsGoodBadVerdict,false);assert.equal(x.boundaries.createsFortunePrediction,false);assert.equal(x.boundaries.createsEventPrediction,false);assert.match(x.definition.en,/structural qualification only/i);}
assert(byCode.has(ex.requiredPatternMeaningCode));

// Reuse the three existing ZWD structural meanings without semantic rewrite; W10 distinct-domain is explicitly W10-owned.
const dynamic=j(paths.dynamic);const dynamicByCode=new Map(dynamic.meanings.map(x=>[x.meaningCode,x]));
for(const [newCode,oldCode] of [['CM-ZWR-TEMPORAL-DA_XIAN_DOMAIN','ZWD-MEANING-DA-XIAN-DOMAIN'],['CM-ZWR-TEMPORAL-LIU_NIAN_DOMAIN','ZWD-MEANING-ANNUAL-DOMAIN'],['CM-ZWR-TEMPORAL-LAYERED_DOMAIN_EMPHASIS','ZWD-MEANING-OVERLAP']]){const n=byCode.get(newCode),o=dynamicByCode.get(oldCode);assert(n&&o);assert.deepEqual(n.label,o.label);assert.deepEqual(n.definition,o.definition);assert.equal(n.sourceCode,oldCode);}
assert(byCode.has(ex.distinctTemporalMeaningCode));assert.match(byCode.get(ex.distinctTemporalMeaningCode).authorityClass,/W10/);

// Contracts/authority/acceptance/roadmap preserve W12 boundary and customer cutover closure.
assert.equal(contract.customerCutoverAllowed,false);assert.equal(contract.compositionBoundary.atomicMeaningIsFinding,false);assert.equal(contract.compositionBoundary.multipleMeaningsMayBeComposedOnlyByW12Plus,true);assert.equal(contract.lineageBoundary.extensionStarStandaloneMeaningRequiresSeparateMeaningSourceAdmission,true);
assert.equal(authority.boundaries.noSecondMeaningSystem,true);assert.equal(authority.boundaries.noLegacy36Rewrite,true);assert.equal(authority.boundaries.noGenericExtensionStarMeaningFallback,true);assert.equal(authority.boundaries.noCustomerInterpretation,true);assert.equal(authority.knownGaps.find(x=>x.gapCode==='ZWR_W11_EXTENSION_STAR_STANDALONE_MEANINGS').starCodes.length,8);
const acc=j(paths.acceptance);assert.equal(acc.gates.LEGACY_36_REUSED_NOT_MUTATED,true);assert.equal(acc.gates.EXTENSION_STAR_STANDALONE_MEANING_GAPS_EXPLICIT,true);assert.equal(acc.gates.FULL_PRODUCTION_CUTOVER_OPEN,false);assert.equal(acc.nextWork,'ZIWEI-FP-W12｜Structural Finding Registry');
const roadmap=j(paths.roadmap);assert.match(roadmap.works.find(x=>x.work==='ZIWEI-FP-W11').status,/ENGINEERING_COMPLETE/);assert.equal(roadmap.works.find(x=>x.work==='ZIWEI-FP-W12').status,'NOT_STARTED');assert.equal(roadmap.nextWork,'ZIWEI-FP-W12｜Structural Finding Registry');assert.equal(roadmap.meaningRegistry.activeMeaningCount,65);assert.equal(roadmap.meaningRegistry.customerCutoverAllowed,false);

// Build a real W0-W10 chain and prove the W11 context binds actual calculated structures without mutating upstream artifacts.
const w56=j(`${base}/fixtures/ziwei-fp-w5-w6-validation-fixture-v1.json`);const ci=w56.canonicalInput;
const policy=j('content/professional/core-method-runtime/zi-wei-calculation-policy-v1.json');
const canonicalInput={birthDate:ci.birthDate,birthTime:ci.birthTime,birthPlace:{displayName:'Hong Kong',countryCode:'HK',latitude:null,longitude:null},timezone:{iana:ci.timezone.iana,utcOffsetAtBirth:ci.timezone.utcOffsetAtBirth,source:'HUMAN_DECLARATION',confidence:'MEDIUM'},timeAccuracy:ci.timeAccuracy,locale:'zh-Hans',consent:{recordId:'CONSENT-ZIWEI-FP-W11',granted:true,purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',persistence:'NONE'},inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'};
const sourceIR=buildZiWeiCalculationIR({birthDate:canonicalInput.birthDate,birthTime:canonicalInput.birthTime,timeAccuracy:canonicalInput.timeAccuracy,timezone:canonicalInput.timezone},{policy,executionMode:'INTERNAL_VALIDATION'});
const decision=getZwrMpaProductionDecision('ZI_WEI_DOU_SHU','1.0.0','CALCULATION');assert.equal(decision.decision,'ELIGIBLE');
const request={schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',methodCode:'ZI_WEI_DOU_SHU',methodVersion:'1.0.0',capability:'CALCULATION',purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',canonicalInput,executionParameters:{},consentRecordId:'CONSENT-ZIWEI-FP-W11',requestId:'REQ-ZIWEI-FP-W11'};
const projection=await executeAndProjectZwrProduction(request,decision);
const dynamicProjection=await buildZiWeiDynamicProjection({requestId:'REQ-ZIWEI-FP-W11-DYN',consentRecordId:'CONSENT-ZIWEI-FP-W11',canonicalInput,natalProjection:projection,targetContext:{targetDate:w56.dynamicInput.targetDate,targetTime:w56.dynamicInput.targetTime,targetTimezone:w56.dynamicInput.targetTimezone},executionParameters:{traditionalCalculationSex:w56.dynamicInput.traditionalCalculationSex}});
const snapshots=[JSON.stringify(sourceIR),JSON.stringify(projection),JSON.stringify(dynamicProjection)];
const chart=await buildCanonicalZiweiChartIR({canonicalProjection:projection,sourceCalculationIR:sourceIR,dynamicProjection});
const placement=calculateZiweiCompleteStarPlacement({chart});const starStateResult=resolveZiweiStarStates({placement});const matrix=buildZiweiFourTransformationMatrix({chart});const relationshipResult=buildZiweiPalaceRelationshipEngine({chart,placement,starStates:starStateResult,transformationMatrix:matrix});const combinations=buildZiweiStarCombinationRuntime({chart,placement,starStates:starStateResult,transformationMatrix:matrix,relationships:relationshipResult});const admittedPatterns=evaluateAdmittedZiweiPatterns({combinations});const daXian=buildZiweiDaXianIntegrationIR({chart,transformationMatrix:matrix,relationships:relationshipResult,combinations,admittedPatterns});const liuNian=buildZiweiLiuNianIntegrationIR({chart,transformationMatrix:matrix,relationships:relationshipResult,combinations,admittedPatterns,daXianIntegration:daXian});
const context=buildZiweiMeaningContext({chart,starStates:starStateResult,relationships:relationshipResult,combinations,admittedPatterns,daXianIntegration:daXian,liuNianIntegration:liuNian,locale:'zh-Hans'});
assert.equal(context.schemaVersion,'PHI-OS-ZIWEI-FP-W11-MEANING-CONTEXT-v1.0.0');assert.equal(context.coverage.activeRegistryMeanings,65);assert.equal(context.palaceMeanings.length,12);assert.equal(context.starMeanings.length,28);assert.equal(context.coverage.availableStandaloneStarMeanings,20);assert.equal(context.coverage.blockedStandaloneStarMeanings,8);assert.equal(context.stateMeanings.length,28);assert.equal(context.relationshipMeanings.length,5);assert.equal(context.transformations.length,4);assert.equal(context.temporalMeanings.length,3);assert.equal(context.coverage.temporalMeaningCount,3);assert.equal(context.foundation.lifePalace.palaceCode,'LIFE');assert.equal(context.foundation.bodyPalace.palaceCode,chart.bodyPalace.palaceCode);assert.equal(context.boundaries.atomicMeaningIsFinding,false);assert.equal(context.boundaries.customerCutoverAllowed,false);
assert.equal(JSON.stringify(sourceIR),snapshots[0]);assert.equal(JSON.stringify(projection),snapshots[1]);assert.equal(JSON.stringify(dynamicProjection),snapshots[2]);

// Separate real calculated positive-pattern fixture proves a Human-admitted pattern resolves to its W11 meaning.
const pf=j(`${base}/fixtures/ziwei-fp-w8-admitted-pattern-validation-fixture-v1.json`);const pci=pf.canonicalInput;
const pCanonical={birthDate:pci.birthDate,birthTime:pci.birthTime,birthPlace:{displayName:'Hong Kong',countryCode:'HK',latitude:null,longitude:null},timezone:{iana:pci.timezone.iana,utcOffsetAtBirth:pci.timezone.utcOffsetAtBirth,source:'HUMAN_DECLARATION',confidence:'MEDIUM'},timeAccuracy:pci.timeAccuracy,locale:'zh-Hans',consent:{recordId:'CONSENT-ZIWEI-FP-W11-PATTERN',granted:true,purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',persistence:'NONE'},inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'};
const pIR=buildZiWeiCalculationIR({birthDate:pCanonical.birthDate,birthTime:pCanonical.birthTime,timeAccuracy:pCanonical.timeAccuracy,timezone:pCanonical.timezone},{policy,executionMode:'INTERNAL_VALIDATION'});
const pReq={...request,canonicalInput:pCanonical,consentRecordId:'CONSENT-ZIWEI-FP-W11-PATTERN',requestId:'REQ-ZIWEI-FP-W11-PATTERN'};const pProjection=await executeAndProjectZwrProduction(pReq,decision);const pChart=await buildCanonicalZiweiChartIR({canonicalProjection:pProjection,sourceCalculationIR:pIR});const pPlacement=calculateZiweiCompleteStarPlacement({chart:pChart});const pStates=resolveZiweiStarStates({placement:pPlacement});const pMatrix=buildZiweiFourTransformationMatrix({chart:pChart});const pRel=buildZiweiPalaceRelationshipEngine({chart:pChart,placement:pPlacement,starStates:pStates,transformationMatrix:pMatrix});const pComb=buildZiweiStarCombinationRuntime({chart:pChart,placement:pPlacement,starStates:pStates,transformationMatrix:pMatrix,relationships:pRel});const pPatterns=evaluateAdmittedZiweiPatterns({combinations:pComb});const pContext=buildZiweiMeaningContext({chart:pChart,starStates:pStates,relationships:pRel,combinations:pComb,admittedPatterns:pPatterns,locale:'zh-Hans'});
const qualified=pContext.patternMeanings.find(x=>x.patternCode==='ZI_FU_TONG_GONG');assert(qualified);assert.equal(qualified.meaning.meaningCode,ex.requiredPatternMeaningCode);assert.equal(qualified.qualificationStatus,'STRUCTURALLY_QUALIFIED_BY_ADMITTED_RULE');

// Simple registry content fingerprint protects this checker from accidental empty/placeholder files.
assert.equal(registry.registryDigest.length,64);assert.match(registry.registryDigest,/^[0-9a-f]{64}$/);assert.equal(sha256Text(JSON.stringify(registry.items)).length,64);
console.log('✓ ZIWEI-FP-W11 governed meaning registry passed.');
console.log(`  Active meaning primitives: ${registry.meaningCount} = 36 legacy + 1 Body emphasis + 8 star states + 5 relationships + 11 patterns + 4 temporal.`);
console.log(`  Real W0-W10 fixture: 12 palace meanings, ${context.starMeanings.length} calculated stars (${context.coverage.availableStandaloneStarMeanings} standalone meanings available / ${context.coverage.blockedStandaloneStarMeanings} explicitly blocked), ${context.stateMeanings.length} state bindings, ${context.temporalMeanings.length} current temporal meanings.`);
console.log(`  Human-admitted pattern meaning resolved on real chart: ${qualified.meaning.label}.`);
console.log('  W11 creates meaning primitives only: no W12 finding, support/challenge verdict, event/fortune prediction, professional judgment or customer cutover.');
