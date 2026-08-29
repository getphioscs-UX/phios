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
import {composeZiweiCustomerReport} from '../functions/zi-wei-full-production/ziwei-customer-report-runtime.js';

const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const base='content/professional/zi-wei-full-production';
const baseline='0692037d3a3f522de9f0eb11d37f738df3a2bae6';
const required=[
 `${base}/contracts/ziwei-customer-report-contract-v1.json`,
 `${base}/registries/ziwei-customer-report-section-registry-v1.json`,
 `${base}/registries/ziwei-customer-report-composition-rule-registry-v1.json`,
 `${base}/authority/ziwei-fp-w18-customer-report-authority-v1.json`,
 `${base}/fixtures/ziwei-fp-w18-customer-report-validation-fixture-v1.json`,
 `${base}/acceptance/ziwei-fp-w18-engineering-acceptance-v1.json`,
 `${base}/roadmap/ziwei-full-production-master-work-v8.json`,
 'functions/zi-wei-full-production/ziwei-customer-report-runtime.js'
];
for(const p of required)assert.ok(fs.existsSync(p),`missing ${p}`);
const contract=j(required[0]),sectionRegistry=j(required[1]),ruleRegistry=j(required[2]),authority=j(required[3]),fixture=j(required[4]),acceptance=j(required[5]),roadmap=j(required[6]),ex=fixture.expected;
for(const x of [contract,sectionRegistry,ruleRegistry,authority,fixture,acceptance,roadmap])assert.equal(x.baselineCommit,baseline);
assert.equal(contract.outputSchema,ex.outputSchema);assert.deepEqual(contract.sectionOrder,['READING_FIRST','FOUNDATION','PALACES','PATTERNS','TIMING','OPEN_BOUNDARIES','WHY_THIS_READING']);
assert.equal(contract.compositionPolicy.onePalaceBlockPerW17PalaceSemanticCluster,true);assert.equal(contract.compositionPolicy.contextDerivativeCreatesSecondEssay,false);assert.equal(contract.compositionPolicy.customerTextMustHaveZeroExactDuplicates,true);assert.equal(contract.customerCutoverAllowed,false);
assert.equal(sectionRegistry.sections.length,ex.sectionCount);assert.equal(sectionRegistry.sections.find(x=>x.sectionCode==='PALACES').expectedBlockCount,12);assert.equal(sectionRegistry.sections.find(x=>x.sectionCode==='WHY_THIS_READING').defaultDisplay,'COLLAPSED');
assert.equal(ruleRegistry.rules.length,7);assert.equal(ruleRegistry.globalRules.oneFullExplanationPerSemanticCluster,true);assert.equal(ruleRegistry.globalRules.newMeaningCreated,false);
assert.equal(authority.authority.ownsCustomerNarrativeComposition,true);assert.equal(authority.authority.ownsMeaning,false);assert.equal(authority.humanAccepted,false);assert.equal(authority.customerCutoverAllowed,false);
assert.equal(acceptance.gates.HUMAN_ACCEPTED_CUSTOMER_PRODUCTION,false);assert.equal(acceptance.gates.FULL_PRODUCTION_CUTOVER_OPEN,false);assert.equal(roadmap.works.find(x=>x.work==='ZIWEI-FP-W18').status,'ENGINEERING_COMPLETE_DETERMINISTIC_CUSTOMER_REPORT_CANDIDATE');assert.equal(roadmap.nextWork,'ZIWEI-FP-W19｜12-Palace Interactive Chart Surface');

async function buildCase(ci,{consentId,requestId,locale='zh-Hans'}={}){
 const policy=j('content/professional/core-method-runtime/zi-wei-calculation-policy-v1.json');
 const w56=j(`${base}/fixtures/ziwei-fp-w5-w6-validation-fixture-v1.json`);
 const canonicalInput={birthDate:ci.birthDate,birthTime:ci.birthTime,birthPlace:{displayName:'Hong Kong',countryCode:'HK',latitude:null,longitude:null},timezone:{iana:ci.timezone.iana,utcOffsetAtBirth:ci.timezone.utcOffsetAtBirth,source:'HUMAN_DECLARATION',confidence:'MEDIUM'},timeAccuracy:ci.timeAccuracy,locale,consent:{recordId:consentId,granted:true,purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',persistence:'NONE'},inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'};
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
 const meanings=buildZiweiMeaningContext({chart,starStates:states,relationships,combinations,admittedPatterns:patterns,daXianIntegration:da,liuNianIntegration:ln,locale});
 const findings=await buildZiweiStructuralFindingRegistry({chart,relationships,combinations,admittedPatterns:patterns,daXianIntegration:da,liuNianIntegration:ln,meaningContext:meanings});
 const graph=buildZiweiInterpretationEvidenceGraph({structuralFindings:findings,meaningContext:meanings});
 const composition=await buildZiweiCrossFindingComposition({structuralFindings:findings,evidenceGraph:graph});
 const resolution=resolveZiweiContradictions({composition,structuralFindings:findings,evidenceGraph:graph});
 const dedup=buildZiweiSemanticDedupIR({composition,contradictionResolution:resolution});
 const reading=buildZiweiReadingIR({meaningContext:meanings,structuralFindings:findings,evidenceGraph:graph,composition,contradictionResolution:resolution,dedup,locale});
 const readingSnap=JSON.stringify(reading);const report=composeZiweiCustomerReport({readingIR:reading,locale});
 assert.equal(JSON.stringify(reading),readingSnap,'W18 mutated W17 Reading IR');for(let i=0;i<upstream.length;i++)assert.equal(JSON.stringify(upstream[i]),snapshots[i],'W18 mutated upstream calculation/projection');
 return {patterns,reading,report};
}

function customerStrings(report){const out=[report.title,report.subtitle,report.boundary,...report.readingFirst.paragraphs];for(const s of report.sections){if(s.methodNote)out.push(s.methodNote);if(s.emptyCopy)out.push(s.emptyCopy);if(s.customerSummary)out.push(s.customerSummary);for(const x of s.items||[]){out.push(x.title,x.openBoundary,x.customerCopy,...(x.paragraphs||[]),x.networkContext?.summary)}}return out.filter(Boolean)}
function assertNoInternalCodesInDefaultCopy(report){for(const x of customerStrings(report)){assert(!/CM-ZWR-|ZWR-(?:READING|FINDING|EV|AUTH|COMP|RESOLUTION|SEMCLUSTER)-/.test(x),`internal code leaked into customer copy: ${x}`)}}

const w56=j(`${base}/fixtures/ziwei-fp-w5-w6-validation-fixture-v1.json`);
const a=await buildCase(w56.canonicalInput,{consentId:'CONSENT-ZIWEI-FP-W18',requestId:'REQ-ZIWEI-FP-W18',locale:'zh-Hans'});const r=a.report;
assert.equal(r.schemaVersion,ex.outputSchema);assert.equal(r.publicationState,'CUSTOMER_REPORT_CANDIDATE_ENGINEERING_NOT_HUMAN_ACCEPTED');assert.equal(r.sections.length,ex.sectionCount);assert.equal(r.summary.palaceBlockCount,ex.palaceBlockCount);assert.equal(r.summary.timingBlockCount,ex.timingBlockCount);assert.equal(r.summary.openBoundaryCount,ex.blockedStandaloneStarMeaningUnknowns);assert.equal(r.summary.duplicateCustomerTextCount,ex.exactCustomerTextDuplicateCount);assert.ok(r.summary.structuralFocusPalaceCodes.length>=ex.minimumStructuralFocusPalaceCount);assert.ok(r.summary.counterbalancedBlockCount>=ex.minimumCounterbalancedBlockCount);
assert.equal(r.source.readingDigest,a.reading.readingDigest);assert.equal(r.technicalEvidence.defaultDisplay,'COLLAPSED');assert.equal(r.boundaries.newMeaningCreated,false);assert.equal(r.boundaries.unadmittedStarGenericMeaningCreated,false);assert.equal(r.boundaries.palaceNetworkSecondEssayCreated,false);assert.equal(r.boundaries.patternOutcomePredictionCreated,false);assert.equal(r.boundaries.timingEventPredictionCreated,false);assert.equal(r.boundaries.goodBadScoreCreated,false);assert.equal(r.boundaries.overallStrongWeakWinnerCreated,false);assert.equal(r.boundaries.humanAcceptedCustomerProduction,ex.humanAccepted);assert.equal(r.boundaries.customerCutoverAllowed,ex.customerCutoverAllowed);
const palaceSection=r.sections.find(x=>x.sectionCode==='PALACES');assert.equal(palaceSection.items.length,12);assert.equal(new Set(palaceSection.items.map(x=>x.palaceCode)).size,12);for(const p of palaceSection.items){assert.ok(p.readingUnitRef);assert.ok(p.paragraphs.length>=1);assert.ok(p.networkContext?.summary);assert.ok(p.why?.evidenceRefs.length);assert.ok(p.why?.meaningRefs.length);assert.equal(p.networkContext.summary.split('三方：').length<=2,true)}
assert.equal(palaceSection.items.filter(x=>x.openBoundary).length,6);assert.equal(r.sections.find(x=>x.sectionCode==='OPEN_BOUNDARIES').items.length,8);assertNoInternalCodesInDefaultCopy(r);
const allText=customerStrings(r);assert.equal(allText.length-new Set(allText).size,0,'customer exact text duplicate drift');
const report2=composeZiweiCustomerReport({readingIR:a.reading,locale:'zh-Hans'});assert.equal(report2.reportDigest,r.reportDigest,'W18 deterministic report digest drift');

const en=await buildCase(w56.canonicalInput,{consentId:'CONSENT-ZIWEI-FP-W18-EN',requestId:'REQ-ZIWEI-FP-W18-EN',locale:'en'});assert.equal(en.report.locale,'en');assert.equal(en.report.summary.palaceBlockCount,12);assert.match(en.report.boundary,/interpretive report/i);assertNoInternalCodesInDefaultCopy(en.report);

const pf=j(`${base}/fixtures/ziwei-fp-w8-admitted-pattern-validation-fixture-v1.json`);const b=await buildCase(pf.canonicalInput,{consentId:'CONSENT-ZIWEI-FP-W18-PATTERN',requestId:'REQ-ZIWEI-FP-W18-PATTERN',locale:'zh-Hans'});assert(b.patterns.traditionalPatterns.some(x=>x.patternCode===ex.patternPositiveCaseRequired));const ps=b.report.sections.find(x=>x.sectionCode==='PATTERNS');assert(ps.items.some(x=>x.patternCode===ex.patternPositiveCaseRequired));const ptext=ps.items.find(x=>x.patternCode===ex.patternPositiveCaseRequired).paragraphs.join(' ');assert.match(ptext,/紫微.*天府/);assert.doesNotMatch(ptext,/必然|保证|一定发生/);assert.equal(b.report.boundaries.patternOutcomePredictionCreated,false);

assert.throws(()=>composeZiweiCustomerReport({readingIR:{...a.reading,boundaries:{...a.reading.boundaries,customerNarrativeCreated:true}},locale:'zh-Hans'}),/ZIWEI_FP_W18_REQUIRES_W17_DEDUPED_NON_NARRATIVE_INPUT/);
assert.throws(()=>composeZiweiCustomerReport({readingIR:a.reading,locale:'en'}),/ZIWEI_FP_W18_LOCALE_MUST_MATCH_W17_READING_IR/);
console.log('✓ ZIWEI-FP-W18 deterministic Customer Report Composition passed.');
console.log(`  ${r.summary.palaceBlockCount}/12 palace blocks; ${r.summary.timingBlockCount} timing blocks; ${r.summary.openBoundaryCount} visible meaning gaps; exact duplicate customer texts ${r.summary.duplicateCustomerTextCount}.`);
console.log(`  Structural read-first focus spans ${r.summary.structuralFocusPalaceCodes.length} unique palaces; counterbalanced blocks ${r.summary.counterbalancedBlockCount}; technical evidence remains collapsed by default.`);
console.log(`  Positive-pattern fixture carries ${ex.patternPositiveCaseRequired} into customer copy as structural qualification only.`);
console.log('  W18 creates customer narrative but no new calculation, meaning, good/bad score, overall strong/weak winner, fortune/event prediction, Human acceptance, or customer cutover.');
