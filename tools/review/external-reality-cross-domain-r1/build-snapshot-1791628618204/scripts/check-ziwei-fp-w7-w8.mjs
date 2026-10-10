import assert from 'node:assert/strict';
import fs from 'node:fs';
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
import {evaluateZiweiPatterns} from '../functions/zi-wei-full-production/ziwei-pattern-runtime.js';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
for(const p of [
 'content/professional/zi-wei-full-production/roadmap/ziwei-full-production-master-work-v3.json',
 'content/professional/zi-wei-full-production/authority/ziwei-fp-w7-star-combination-authority-v1.json',
 'content/professional/zi-wei-full-production/authority/ziwei-fp-w8-pattern-authority-v1.json',
 'content/professional/zi-wei-full-production/contracts/ziwei-star-combination-contract-v1.json',
 'content/professional/zi-wei-full-production/contracts/ziwei-pattern-runtime-contract-v1.json',
 'content/professional/zi-wei-full-production/source-admission/contracts/ziwei-source-claim-contract-v2.json',
 'content/professional/zi-wei-full-production/source-admission/claims/ziwei-source-claim-batch-002-patterns-v1.json',
 'content/professional/zi-wei-full-production/source-admission/review/ziwei-source-claim-batch-002-patterns-human-review-v1.json',
 'content/professional/zi-wei-full-production/source-admission/registries/ziwei-source-registry-v2.json',
 'content/professional/zi-wei-full-production/source-admission/authority/ziwei-source-admission-strategy-v3.json',
 'content/professional/zi-wei-full-production/acceptance/ziwei-fp-w7-w8-engineering-acceptance-v1.json',
 'docs/ziwei/review/ZIWEI-SOURCE-CLAIM-BATCH-002-PATTERNS-review.html',
 'docs/ziwei/ZIWEI-FP-W7-W8.md'
])assert.ok(fs.existsSync(p),`missing ${p}`);
const fixture=j('content/professional/zi-wei-full-production/fixtures/ziwei-fp-w7-w8-validation-fixture-v1.json');
const w56=j('content/professional/zi-wei-full-production/fixtures/ziwei-fp-w5-w6-validation-fixture-v1.json');
const claims=j('content/professional/zi-wei-full-production/source-admission/claims/ziwei-source-claim-batch-002-patterns-v1.json');
assert.equal(claims.claims.length,fixture.expected.patternSourceClaimsPending);
assert.equal(new Set(claims.claims.map(x=>x.claimId)).size,claims.claims.length);
assert.equal(new Set(claims.claims.map(x=>x.normalizedPayload.patternCode)).size,claims.claims.length);
for(const c of claims.claims){assert.equal(c.work,'ZIWEI-FP-W8');assert.equal(c.authorityComponent,'PATTERN_RUNTIME');assert.equal(c.claimType,'PATTERN_QUALIFICATION_RULE');assert.equal(c.reviewState,'EXTRACTED_PENDING_HUMAN_REVIEW');assert.equal(c.runtimeUseAllowed,false);assert.ok(c.locator.witnessUrl.startsWith('https://zh.wikisource.org/'));assert.ok(c.normalizedPayload.alternatives.length>=1);}
const review=j('content/professional/zi-wei-full-production/source-admission/review/ziwei-source-claim-batch-002-patterns-human-review-v1.json');assert.deepEqual(new Set(review.decisions),new Set(claims.claims.map(x=>x.claimId)));
const reviewHtml=fs.readFileSync('docs/ziwei/review/ZIWEI-SOURCE-CLAIM-BATCH-002-PATTERNS-review.html','utf8');for(const c of claims.claims)assert.ok(reviewHtml.includes(c.claimId));assert.ok(reviewHtml.includes('ziwei-source-claim-batch-002-patterns-human-review-result.json'));
const currentPolicy=j('content/professional/core-method-runtime/zi-wei-calculation-policy-v1.json');
const canonicalInput={birthDate:w56.canonicalInput.birthDate,birthTime:w56.canonicalInput.birthTime,birthPlace:{displayName:'Hong Kong',countryCode:'HK',latitude:null,longitude:null},timezone:{iana:w56.canonicalInput.timezone.iana,utcOffsetAtBirth:w56.canonicalInput.timezone.utcOffsetAtBirth,source:'HUMAN_DECLARATION',confidence:'MEDIUM'},timeAccuracy:w56.canonicalInput.timeAccuracy,locale:'zh-Hans',consent:{recordId:'CONSENT-ZIWEI-FP-W78',granted:true,purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',persistence:'NONE'},inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'};
const sourceIR=buildZiWeiCalculationIR({birthDate:canonicalInput.birthDate,birthTime:canonicalInput.birthTime,timeAccuracy:canonicalInput.timeAccuracy,timezone:canonicalInput.timezone},{policy:currentPolicy,executionMode:'INTERNAL_VALIDATION'});
const decision=getZwrMpaProductionDecision('ZI_WEI_DOU_SHU','1.0.0','CALCULATION');assert.equal(decision.decision,'ELIGIBLE');
const request={schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',methodCode:'ZI_WEI_DOU_SHU',methodVersion:'1.0.0',capability:'CALCULATION',purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',canonicalInput,executionParameters:{},consentRecordId:'CONSENT-ZIWEI-FP-W78',requestId:'REQ-ZIWEI-FP-W78'};
const projection=await executeAndProjectZwrProduction(request,decision);
const dynamic=await buildZiWeiDynamicProjection({requestId:'REQ-ZIWEI-FP-W78-DYN',consentRecordId:'CONSENT-ZIWEI-FP-W78',canonicalInput,natalProjection:projection,targetContext:{targetDate:w56.dynamicInput.targetDate,targetTime:w56.dynamicInput.targetTime,targetTimezone:w56.dynamicInput.targetTimezone},executionParameters:{traditionalCalculationSex:w56.dynamicInput.traditionalCalculationSex}});
const snapshots=[JSON.stringify(projection),JSON.stringify(dynamic),JSON.stringify(sourceIR)];
const chart=await buildCanonicalZiweiChartIR({canonicalProjection:projection,sourceCalculationIR:sourceIR,dynamicProjection:dynamic});
const placement=calculateZiweiCompleteStarPlacement({chart});const states=resolveZiweiStarStates({placement});const matrix=buildZiweiFourTransformationMatrix({chart});const rel=buildZiweiPalaceRelationshipEngine({chart,placement,starStates:states,transformationMatrix:matrix});
const comb1=buildZiweiStarCombinationRuntime({chart,placement,starStates:states,transformationMatrix:matrix,relationships:rel});
const comb2=buildZiweiStarCombinationRuntime({chart,placement,starStates:states,transformationMatrix:matrix,relationships:rel});
assert.equal(comb1.combinationDigest,comb2.combinationDigest);assert.equal(comb1.coverage.stars,fixture.expected.totalStars);assert.equal(comb1.palaceCombinations.length,fixture.expected.palaces);assert.equal(comb1.networks.length,12);assert.equal(comb1.samePalacePairs.length,fixture.expected.samePalacePairs);assert.equal(comb1.networkPairs.length,fixture.expected.networkRelatedPairs);assert.equal(comb1.boundaries.traditionalPatternQualified,false);assert.equal(comb1.boundaries.customerCutoverAllowed,false);
for(const p of comb1.palaceCombinations)assert.equal(p.samePalacePairs.length,p.starCount*(p.starCount-1)/2);
const noRules1=evaluateZiweiPatterns({combinations:comb1}),noRules2=evaluateZiweiPatterns({combinations:comb1});assert.equal(noRules1.patternDigest,noRules2.patternDigest);assert.equal(noRules1.ruleState,'NO_ADMITTED_TRADITIONAL_RULESET');assert.equal(noRules1.traditionalPatterns.length,fixture.expected.traditionalRulesActive);assert.equal(noRules1.structuralCandidates.length,fixture.expected.structuralCandidates);assert.equal(noRules1.boundaries.structuralCandidateIsTraditionalPattern,false);
assert.throws(()=>evaluateZiweiPatterns({combinations:comb1,patternRuleRegistry:{admissionState:'PENDING_HUMAN_REVIEW',rules:claims.claims.map(x=>x.normalizedPayload)}}),/ZIWEI_FP_W8_PATTERN_RULES_NOT_ADMITTED/);
const testRegistry={schemaVersion:'TEST',admissionState:'TEST_ONLY',sourceBatchId:'ZIWEI-W8-TEST-ONLY',rules:[
 {patternCode:'TEST_ZI_PO_SAME',labelZh:'测试：紫破同宫',ruleVersion:'test',sourceClaimId:'TEST',alternatives:[{predicates:[{type:'SAME_PALACE_STARS',starCodes:['ZI_WEI','PO_JUN']}]}]},
 {patternCode:'TEST_LIFE_FLANK',labelZh:'测试：命宫夹星',ruleVersion:'test',sourceClaimId:'TEST',alternatives:[{predicates:[{type:'FLANK_STARS_AROUND_PALACE',palaceCode:'LIFE',starCodes:['TAI_YANG','TIAN_JI'],unordered:true}]}]},
 {patternCode:'TEST_STATE',labelZh:'测试：紫微庙',ruleVersion:'test',sourceClaimId:'TEST',alternatives:[{predicates:[{type:'STAR_STATE_IN',starCode:'ZI_WEI',stateCodes:['MIAO']}]}]}
]};
const matched=evaluateZiweiPatterns({combinations:comb1,patternRuleRegistry:testRegistry,executionMode:'INTERNAL_VALIDATION'});assert.deepEqual(new Set(matched.traditionalPatterns.map(x=>x.patternCode)),new Set(['TEST_ZI_PO_SAME','TEST_LIFE_FLANK','TEST_STATE']));assert.equal(matched.ruleState,'TEST_ONLY_RULESET_ACTIVE');
const candidateDryRun=evaluateZiweiPatterns({combinations:comb1,patternRuleRegistry:{admissionState:'TEST_ONLY',sourceBatchId:claims.batchId,rules:claims.claims.map(x=>({...x.normalizedPayload,sourceClaimId:x.claimId}))},executionMode:'INTERNAL_VALIDATION'});assert.equal(candidateDryRun.coverage.activeRuleCount,claims.claims.length);
assert.equal(JSON.stringify(projection),snapshots[0]);assert.equal(JSON.stringify(dynamic),snapshots[1]);assert.equal(JSON.stringify(sourceIR),snapshots[2]);
const acc=j('content/professional/zi-wei-full-production/acceptance/ziwei-fp-w7-w8-engineering-acceptance-v1.json');assert.equal(acc.gates.W7_28_STAR_COMBINATION_BINDING,true);assert.equal(acc.gates.W8_TRADITIONAL_RULES_ACTIVE,false);assert.equal(acc.gates.FULL_PRODUCTION_CUTOVER_OPEN,false);
const master=j('content/professional/zi-wei-full-production/roadmap/ziwei-full-production-master-work-v3.json');assert.match(master.works.find(x=>x.work==='ZIWEI-FP-W7').status,/ENGINEERING_COMPLETE/);assert.match(master.works.find(x=>x.work==='ZIWEI-FP-W8').status,/MATCHER_ENGINEERING_COMPLETE/);assert.match(master.nextWork,/Source-Claim Admission Batch 002/);
console.log('✓ ZIWEI-FP-W7/W8 engineering passed.');
console.log(`  W7: ${comb1.coverage.stars} stars; ${comb1.samePalacePairs.length} same-palace pairs; ${comb1.networkPairs.length} network-related pairs; 12 palace combination networks.`);
console.log(`  W8: registry-driven matcher passed with ${noRules1.structuralCandidates.length} non-traditional structural candidates; 11 traditional pattern source claims remain fail-closed pending Human review.`);
console.log('  Pending pattern claims cannot execute; no outcome meaning, numeric strength, fortune conclusion or customer cutover was created.');
