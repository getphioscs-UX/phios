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
import {evaluateAdmittedZiweiPatterns} from '../functions/zi-wei-full-production/ziwei-admitted-pattern-runtime.js';
import {buildZiweiDaXianIntegrationIR} from '../functions/zi-wei-full-production/ziwei-da-xian-integration-runtime.js';
import {buildZiweiLiuNianIntegrationIR} from '../functions/zi-wei-full-production/ziwei-liu-nian-integration-runtime.js';
import {buildZiweiMeaningContext} from '../functions/zi-wei-full-production/ziwei-meaning-registry-runtime.js';
import {buildZiweiStructuralFindingRegistry} from '../functions/zi-wei-full-production/ziwei-structural-finding-runtime.js';
import {buildZiweiInterpretationEvidenceGraph} from '../functions/zi-wei-full-production/ziwei-interpretation-evidence-graph-runtime.js';
import {buildZiweiCrossFindingComposition} from '../functions/zi-wei-full-production/ziwei-cross-finding-composition-runtime.js';
import {resolveZiweiContradictions} from '../functions/zi-wei-full-production/ziwei-contradiction-resolver-runtime.js';
import {buildZiweiSemanticDedupIR} from '../functions/zi-wei-full-production/ziwei-semantic-dedup-runtime.js';
import {buildZiweiReadingIR} from '../functions/zi-wei-full-production/ziwei-reading-ir-runtime.js';

const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const base='content/professional/zi-wei-full-production';
const baseline='f52b6a3c4f1d94e6bf707af47f34e8c7dfca8837';
const required=[
 `${base}/contracts/ziwei-reading-ir-contract-v1.json`,
 `${base}/registries/ziwei-reading-section-registry-v1.json`,
 `${base}/authority/ziwei-fp-w17-reading-ir-authority-v1.json`,
 `${base}/fixtures/ziwei-fp-w17-reading-ir-validation-fixture-v1.json`,
 `${base}/acceptance/ziwei-fp-w17-engineering-acceptance-v1.json`,
 `${base}/roadmap/ziwei-full-production-master-work-v7.json`,
 'functions/zi-wei-full-production/ziwei-reading-ir-runtime.js'
];
for(const p of required)assert.ok(fs.existsSync(p),`missing ${p}`);
const contract=j(required[0]),sectionRegistry=j(required[1]),authority=j(required[2]),fixture=j(required[3]),acceptance=j(required[4]),roadmap=j(required[5]),ex=fixture.expected;
for(const x of [contract,sectionRegistry,authority,fixture,acceptance,roadmap])assert.equal(x.baselineCommit,baseline);
assert.equal(contract.outputSchema,'PHI-OS-ZIWEI-FULL-READING-IR-v1.0.0');
assert.deepEqual(contract.requiredSections,['FOUNDATION','PALACES','PATTERNS','TIMING','OPEN_QUESTIONS','EVIDENCE']);
assert.equal(contract.renderOwnerPolicy.oneFullExplanationPerSemanticCluster,true);
assert.equal(contract.rules.readingIrMayNotCreateCustomerNarrative,true);
assert.equal(contract.customerCutoverAllowed,false);
assert.equal(sectionRegistry.sections.length,ex.sectionCount);
assert.equal(sectionRegistry.sections.find(x=>x.sectionCode==='PALACES').expectedPrimaryUnitCount,12);
assert.equal(authority.authority.ownsReadingIrAssembly,true);assert.equal(authority.authority.ownsCustomerNarrative,false);
assert.equal(acceptance.gates.FULL_PRODUCTION_CUTOVER_OPEN,false);
assert.equal(roadmap.works.find(x=>x.work==='ZIWEI-FP-W17').status,'ENGINEERING_COMPLETE_READING_IR_ASSEMBLED_FROM_DEDUPED_GOVERNED_OWNERS');
assert.equal(roadmap.nextWork,'ZIWEI-FP-W18｜Customer Report Composition');

async function buildCase(ci,{consentId,requestId}={}){
 const policy=j('content/professional/core-method-runtime/zi-wei-calculation-policy-v1.json');
 const w56=j(`${base}/fixtures/ziwei-fp-w5-w6-validation-fixture-v1.json`);
 const canonicalInput={birthDate:ci.birthDate,birthTime:ci.birthTime,birthPlace:{displayName:'Hong Kong',countryCode:'HK',latitude:null,longitude:null},timezone:{iana:ci.timezone.iana,utcOffsetAtBirth:ci.timezone.utcOffsetAtBirth,source:'HUMAN_DECLARATION',confidence:'MEDIUM'},timeAccuracy:ci.timeAccuracy,locale:'zh-Hans',consent:{recordId:consentId,granted:true,purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',persistence:'NONE'},inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'};
 const sourceIR=buildZiWeiCalculationIR({birthDate:canonicalInput.birthDate,birthTime:canonicalInput.birthTime,timeAccuracy:canonicalInput.timeAccuracy,timezone:canonicalInput.timezone},{policy,executionMode:'INTERNAL_VALIDATION'});
 const decision=getZwrMpaProductionDecision('ZI_WEI_DOU_SHU','1.0.0','CALCULATION');assert.equal(decision.decision,'ELIGIBLE');
 const req={schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',methodCode:'ZI_WEI_DOU_SHU',methodVersion:'1.0.0',capability:'CALCULATION',purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',canonicalInput,executionParameters:{},consentRecordId:consentId,requestId};
 const projection=await executeAndProjectZwrProduction(req,decision);
 const dyn=await buildZiWeiDynamicProjection({requestId:`${requestId}-DYN`,consentRecordId:consentId,canonicalInput,natalProjection:projection,targetContext:{targetDate:w56.dynamicInput.targetDate,targetTime:w56.dynamicInput.targetTime,targetTimezone:w56.dynamicInput.targetTimezone},executionParameters:{traditionalCalculationSex:w56.dynamicInput.traditionalCalculationSex}});
 const upstream=[sourceIR,projection,dyn],snapshots=upstream.map(x=>JSON.stringify(x));
 const chart=await buildCanonicalZiweiChartIR({canonicalProjection:projection,sourceCalculationIR:sourceIR,dynamicProjection:dyn});
 const placement=calculateZiweiCompleteStarPlacement({chart});
 const states=resolveZiweiStarStates({placement});
 const matrix=buildZiweiFourTransformationMatrix({chart});
 const relationships=buildZiweiPalaceRelationshipEngine({chart,placement,starStates:states,transformationMatrix:matrix});
 const combinations=buildZiweiStarCombinationRuntime({chart,placement,starStates:states,transformationMatrix:matrix,relationships});
 const patterns=evaluateAdmittedZiweiPatterns({combinations});
 const da=buildZiweiDaXianIntegrationIR({chart,transformationMatrix:matrix,relationships,combinations,admittedPatterns:patterns});
 const ln=buildZiweiLiuNianIntegrationIR({chart,transformationMatrix:matrix,relationships,combinations,admittedPatterns:patterns,daXianIntegration:da});
 const meanings=buildZiweiMeaningContext({chart,starStates:states,relationships,combinations,admittedPatterns:patterns,daXianIntegration:da,liuNianIntegration:ln,locale:'zh-Hans'});
 const findings=await buildZiweiStructuralFindingRegistry({chart,relationships,combinations,admittedPatterns:patterns,daXianIntegration:da,liuNianIntegration:ln,meaningContext:meanings});
 const graph=buildZiweiInterpretationEvidenceGraph({structuralFindings:findings,meaningContext:meanings});
 const composition=await buildZiweiCrossFindingComposition({structuralFindings:findings,evidenceGraph:graph});
 const resolution=resolveZiweiContradictions({composition,structuralFindings:findings,evidenceGraph:graph});
 const dedup=buildZiweiSemanticDedupIR({composition,contradictionResolution:resolution});
 const reading=buildZiweiReadingIR({meaningContext:meanings,structuralFindings:findings,evidenceGraph:graph,composition,contradictionResolution:resolution,dedup,locale:'zh-Hans'});
 for(let i=0;i<upstream.length;i++)assert.equal(JSON.stringify(upstream[i]),snapshots[i],'W17 mutated upstream calculation/projection');
 return {patterns,meanings,findings,graph,composition,resolution,dedup,reading};
}

const w56=j(`${base}/fixtures/ziwei-fp-w5-w6-validation-fixture-v1.json`);
const a=await buildCase(w56.canonicalInput,{consentId:'CONSENT-ZIWEI-FP-W17',requestId:'REQ-ZIWEI-FP-W17'});
const r=a.reading;
assert.equal(r.schemaVersion,'PHI-OS-ZIWEI-FULL-READING-IR-v1.0.0');
assert.equal(r.sectionOrder.length,ex.sectionCount);assert.deepEqual(r.sectionOrder,['FOUNDATION','PALACES','PATTERNS','TIMING','OPEN_QUESTIONS','EVIDENCE']);
assert.equal(r.sections.palaces.items.length,ex.palaceCount);assert.equal(new Set(r.sections.palaces.items.map(x=>x.palaceCode)).size,12);
assert.ok(r.summary.readingUnitCount>=ex.minimumReadingUnitCount);assert.equal(r.summary.readingUnitCount,a.dedup.semanticClusters.length);assert.equal(r.summary.primaryExplanationCount,r.summary.readingUnitCount);
assert.ok(r.summary.contextDerivativeCount>=ex.minimumContextDerivativeCount);assert.equal(r.summary.unknownCount,ex.blockedStandaloneStarMeaningUnknowns);
assert.equal(r.boundaries.oneFullExplanationPerSemanticCluster,true);assert.equal(r.boundaries.customerNarrativeCreated,false);assert.equal(r.boundaries.customerCutoverAllowed,false);assert.equal(r.boundaries.overallStrongWeakWinnerCreated,false);
assert.equal(new Set(r.readingUnits.map(x=>x.semanticClusterId)).size,r.readingUnits.length);
for(const u of r.readingUnits){assert.equal(u.primary.renderMode,'PRIMARY_EXPLANATION');assert.ok(u.governedMeanings.length);assert.ok(u.evidenceItems.length);assert.ok(u.authorityItems.length);assert.equal(u.boundaries.customerNarrativeCreated,false);for(const d of u.contextDerivatives)assert.notEqual(d.renderDecision,'PRIMARY_EXPLANATION')}
for(const p of r.sections.palaces.items){assert.ok(p.readingUnitRef);assert.ok(Array.isArray(p.stars));assert.ok(p.relationshipContext.oppositePalaceCode);assert.equal(p.relationshipContext.oppositeMeansConflict,false);assert.equal(p.relationshipContext.triadMeansSupport,false)}
assert.equal(r.sections.openQuestions.items.length,ex.blockedStandaloneStarMeaningUnknowns);for(const u of r.sections.openQuestions.items)assert.match(u.code,/STANDALONE_STAR_MEANING_/);
assert.equal(r.sections.evidence.source.dedupDigest,a.dedup.dedupDigest);assert.equal(r.sections.evidence.source.graphDigest,a.graph.graphDigest);

const pf=j(`${base}/fixtures/ziwei-fp-w8-admitted-pattern-validation-fixture-v1.json`);
const b=await buildCase(pf.canonicalInput,{consentId:'CONSENT-ZIWEI-FP-W17-PATTERN',requestId:'REQ-ZIWEI-FP-W17-PATTERN'});
assert(b.patterns.traditionalPatterns.some(x=>x.patternCode===ex.patternPositiveCaseRequired));
assert(b.reading.sections.patterns.qualifiedPatternCodes.includes(ex.patternPositiveCaseRequired));
const pu=b.reading.readingUnits.find(x=>x.semanticKey==='ZWR:PATTERN:QUALIFIED_SET');assert(pu);assert(pu.governedMeanings.some(x=>x.meaningCode===`CM-ZWR-PATTERN-${ex.patternPositiveCaseRequired}`));assert.equal(pu.boundaries.eventPredictionCreated,false);

assert.throws(()=>buildZiweiReadingIR({meaningContext:a.meanings,structuralFindings:a.findings,evidenceGraph:a.graph,composition:a.composition,contradictionResolution:a.resolution,dedup:{...a.dedup,sourceResolutionDigest:'bad'},locale:'zh-Hans'}),/ZIWEI_FP_W17_REQUIRES_W16_DEDUP/);
console.log('✓ ZIWEI-FP-W17 Zi Wei Reading IR passed.');
console.log(`  ${r.summary.readingUnitCount} deduplicated reading units across ${r.summary.sectionCount} sections; ${r.summary.contextDerivativeCount} context derivatives attached without second full explanations.`);
console.log(`  Twelve-palace index: ${r.summary.palaceCount}/12; visible semantic unknowns: ${r.summary.unknownCount}; counterbalanced reading units: ${r.summary.counterbalancedReadingUnitCount}.`);
console.log(`  Positive-pattern fixture carries ${ex.patternPositiveCaseRequired} from W8 qualification through W17 governed meaning/evidence lineage.`);
console.log('  W17 creates no customer narrative, good/bad score, strong/weak winner, fortune/event prediction, or customer cutover; W18 report composition is next.');
