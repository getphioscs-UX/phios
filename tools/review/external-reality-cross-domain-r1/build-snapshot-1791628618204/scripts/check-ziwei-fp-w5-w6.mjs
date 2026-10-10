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
import {assertZiweiSourceAdmission} from '../functions/zi-wei-full-production/ziwei-source-admission-authority-v1.js';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
for(const p of [
 'content/professional/zi-wei-full-production/roadmap/ziwei-full-production-master-work-v2.json',
 'content/professional/zi-wei-full-production/authority/ziwei-fp-w5-four-transformation-authority-v1.json',
 'content/professional/zi-wei-full-production/authority/ziwei-fp-w6-palace-relationship-authority-v1.json',
 'content/professional/zi-wei-full-production/contracts/ziwei-four-transformation-matrix-contract-v1.json',
 'content/professional/zi-wei-full-production/contracts/ziwei-palace-relationship-engine-contract-v1.json',
 'content/professional/zi-wei-full-production/acceptance/ziwei-fp-w5-w6-engineering-acceptance-v1.json'
])assert.ok(fs.existsSync(p),`missing ${p}`);
const fixture=j('content/professional/zi-wei-full-production/fixtures/ziwei-fp-w5-w6-validation-fixture-v1.json');
assert.equal(assertZiweiSourceAdmission().admittedClaimCount,fixture.expected.humanAdmittedSourceClaims);
const w5auth=j('content/professional/zi-wei-full-production/authority/ziwei-fp-w5-four-transformation-authority-v1.json');
assert.equal(w5auth.layers.PALACE_STEM_FLYING.included,false);
assert.deepEqual(w5auth.renConflict.currentHumanFrozenRow,['TIAN_LIANG','ZI_WEI','ZUO_FU','WU_QU']);
assert.equal(w5auth.renConflict.silentOverrideAllowed,false);
const currentPolicy=j('content/professional/core-method-runtime/zi-wei-calculation-policy-v1.json');
assert.deepEqual(currentPolicy.requiredPolicies.find(x=>x.policyCode==='TRANSFORMATION_SCOPE').decision.table.REN,['TIAN_LIANG','ZI_WEI','ZUO_FU','WU_QU']);
const dynamicPolicy=j('content/professional/zi-wei-dynamic/authority/zi-wei-dynamic-policy-v2.json');
assert.equal(dynamicPolicy.status,'HUMAN_FROZEN');assert.deepEqual(dynamicPolicy.decisions.find(x=>x.policyCode==='DYNAMIC_FOUR_TRANSFORMATIONS_V1').decision.layersIncluded,['DA_XIAN','LIU_NIAN']);
const canonicalInput={birthDate:'2023-01-22',birthTime:'05:00:00',birthPlace:{displayName:'Hong Kong',countryCode:'HK',latitude:null,longitude:null},timezone:{iana:'Asia/Hong_Kong',utcOffsetAtBirth:'+08:00',source:'HUMAN_DECLARATION',confidence:'MEDIUM'},timeAccuracy:'EXACT',locale:'zh-Hans',consent:{recordId:'CONSENT-ZIWEI-FP-W56',granted:true,purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',persistence:'NONE'},inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'};
const sourceIR=buildZiWeiCalculationIR({birthDate:canonicalInput.birthDate,birthTime:canonicalInput.birthTime,timeAccuracy:canonicalInput.timeAccuracy,timezone:canonicalInput.timezone},{policy:currentPolicy,executionMode:'INTERNAL_VALIDATION'});
const decision=getZwrMpaProductionDecision('ZI_WEI_DOU_SHU','1.0.0','CALCULATION');assert.equal(decision.decision,'ELIGIBLE');
const request={schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',methodCode:'ZI_WEI_DOU_SHU',methodVersion:'1.0.0',capability:'CALCULATION',purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',canonicalInput,executionParameters:{},consentRecordId:'CONSENT-ZIWEI-FP-W56',requestId:'REQ-ZIWEI-FP-W56'};
const projection=await executeAndProjectZwrProduction(request,decision);
const dynamic=await buildZiWeiDynamicProjection({requestId:'REQ-ZIWEI-FP-W56-DYN',consentRecordId:'CONSENT-ZIWEI-FP-W56',canonicalInput,natalProjection:projection,targetContext:{targetDate:'2026-08-28',targetTime:'12:00:00',targetTimezone:{iana:'Asia/Kuala_Lumpur',utcOffsetAtTarget:'+08:00'}},executionParameters:{traditionalCalculationSex:'MALE'}});
const pSnap=JSON.stringify(projection),dSnap=JSON.stringify(dynamic),irSnap=JSON.stringify(sourceIR);
const chart=await buildCanonicalZiweiChartIR({canonicalProjection:projection,sourceCalculationIR:sourceIR,dynamicProjection:dynamic});
const placement=calculateZiweiCompleteStarPlacement({chart});
const states=resolveZiweiStarStates({placement});
const matrix1=buildZiweiFourTransformationMatrix({chart}),matrix2=buildZiweiFourTransformationMatrix({chart});
assert.equal(matrix1.matrixDigest,matrix2.matrixDigest);assert.equal(matrix1.allTransformations.length,fixture.expected.transformationCounts.ALL);
for(const layer of ['NATAL','DA_XIAN','LIU_NIAN']){const x=matrix1.layers.find(v=>v.layer===layer);assert.equal(x.state,'ACTIVE');assert.equal(x.transformations.length,fixture.expected.transformationCounts[layer]);assert.equal(new Set(x.transformations.map(v=>v.transformationCode)).size,4);}
assert.equal(matrix1.coverage.palaceStemFlying,false);assert.equal(matrix1.boundaries.palaceStemFlyingCreated,false);assert.equal(matrix1.boundaries.natalTransformationTableChanged,false);
const natalOnly=await buildCanonicalZiweiChartIR({canonicalProjection:projection,sourceCalculationIR:sourceIR});
const natalMatrix=buildZiweiFourTransformationMatrix({chart:natalOnly});assert.equal(natalMatrix.allTransformations.length,4);assert.equal(natalMatrix.layers.find(x=>x.layer==='DA_XIAN').state,'NOT_ATTACHED');assert.equal(natalMatrix.layers.find(x=>x.layer==='LIU_NIAN').state,'NOT_ATTACHED');
const rel1=buildZiweiPalaceRelationshipEngine({chart,placement,starStates:states,transformationMatrix:matrix1});
const rel2=buildZiweiPalaceRelationshipEngine({chart,placement,starStates:states,transformationMatrix:matrix1});
assert.equal(rel1.relationshipDigest,rel2.relationshipDigest);assert.equal(rel1.networks.length,fixture.expected.palaceRelationshipCounts.palaces);assert.equal(rel1.oppositePairs.length,fixture.expected.palaceRelationshipCounts.oppositePairs);assert.equal(rel1.trineGroups.length,fixture.expected.palaceRelationshipCounts.trineGroups);assert.equal(rel1.adjacencyPairs.length,fixture.expected.palaceRelationshipCounts.adjacencyPairs);
const life=rel1.networks.find(x=>x.target.palaceCode==='LIFE');assert(life);assert.equal(life.opposite.palaceCode,fixture.expected.lifePalace.opposite);assert.deepEqual(new Set(life.triadPalaces.map(x=>x.palaceCode)),new Set(fixture.expected.lifePalace.triads));assert.deepEqual(new Set([life.flankingPalaces.previous.palaceCode,life.flankingPalaces.next.palaceCode]),new Set(fixture.expected.lifePalace.flanks));assert.equal(life.sanFangSiZheng.length,4);
for(const n of rel1.networks){assert.equal(new Set(n.sanFangSiZheng.map(x=>x.palaceCode)).size,4);assert.equal(n.emptyPalace.borrowedStarPlacementCreated,false);assert.equal(n.emptyPalace.borrowedMeaningCreated,false);if(n.emptyPalace.isEmptyMainStarPalace)assert.equal(n.emptyPalace.borrowPolicy,'OPPOSITE_MAIN_STAR_REFERENCE_ONLY');}
assert.equal(rel1.emptyPalaces.length,fixture.expected.emptyMainStarPalaceCount);assert.equal(rel1.boundaries.flankPatternInterpreted,false);assert.equal(rel1.boundaries.interpretationCreated,false);assert.equal(rel1.boundaries.customerCutoverAllowed,false);
assert.equal(JSON.stringify(projection),pSnap);assert.equal(JSON.stringify(dynamic),dSnap);assert.equal(JSON.stringify(sourceIR),irSnap);
const acc=j('content/professional/zi-wei-full-production/acceptance/ziwei-fp-w5-w6-engineering-acceptance-v1.json');assert.equal(acc.gates.W5_PALACE_STEM_FLYING_REMAINS_DEFERRED,true);assert.equal(acc.gates.W6_TRIAD_AND_SAN_FANG_SI_ZHENG_IMPLEMENTED,true);assert.equal(acc.gates.FULL_PRODUCTION_CUTOVER_OPEN,false);
const master=j('content/professional/zi-wei-full-production/roadmap/ziwei-full-production-master-work-v2.json');assert.match(master.works.find(x=>x.work==='ZIWEI-FP-W5').status,/ENGINEERING_COMPLETE/);assert.match(master.works.find(x=>x.work==='ZIWEI-FP-W6').status,/ENGINEERING_COMPLETE/);assert.equal(master.nextWork,'ZIWEI-FP-W7｜Star Combination Runtime');
console.log('✓ ZIWEI-FP-W5/W6 deterministic engineering passed.');
console.log('  W5: 4 natal + 4 Da Xian + 4 Liu Nian transformations composed without recalculation; palace-stem flying remains deferred.');
console.log(`  W6: 12 palace networks, 6 opposite pairs, 4 trine groups, 12 flank networks and ${rel1.emptyPalaces.length} empty-main-star palace reference(s).`);
console.log('  Empty-palace borrowing is reference-only; W7/W8 pattern qualification and customer interpretation remain deferred.');
