import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildCanonicalBaziChartIR} from '../functions/bzr-full-production/bazi-chart-runtime.js';
import {analyzeBaziStrengthSeasonal} from '../functions/bzr-full-production/bazi-strength-seasonal-runtime.js';
import {analyzeBaziRelationships} from '../functions/bzr-full-production/bazi-relationship-runtime.js';
import {analyzeBaziTenGods} from '../functions/bzr-full-production/bazi-ten-god-runtime.js';
import {analyzeBaziPatternCandidates} from '../functions/bzr-full-production/bazi-pattern-runtime.js';
import {analyzeBaziUsefulGodTiaohouViews} from '../functions/bzr-full-production/bazi-useful-god-tiaohou-runtime.js';
import {buildBaziDaYunStructuralIR} from '../functions/bzr-full-production/bazi-da-yun-runtime.js';
import {buildBaziLiuNianInteractionIR} from '../functions/bzr-full-production/bazi-liu-nian-interaction-runtime.js';
import {buildBaziStructuralFindingRegistry} from '../functions/bzr-full-production/bazi-structural-finding-runtime.js';
import {buildBaziInterpretationEvidenceGraph} from '../functions/bzr-full-production/bazi-interpretation-evidence-graph-runtime.js';
import {buildBaziCrossFindingComposition} from '../functions/bzr-full-production/bazi-cross-finding-composition-runtime.js';
import {resolveBaziCompositionUnit,resolveBaziContradictions} from '../functions/bzr-full-production/bazi-contradiction-resolver-runtime.js';
import {clusterSemanticCompositionUnits,buildBaziSemanticDedupIR} from '../functions/bzr-full-production/bazi-semantic-dedup-runtime.js';

const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const exists=p=>fs.existsSync(p);
const baseline='31f0cb5dcf47c1e9419ef67ac89968d06834b35d';
const p={
 w11Contract:'content/professional/bzr-full-production/contracts/bazi-cross-finding-composition-contract-v1.json',
 w11Registry:'content/professional/bzr-full-production/registries/bazi-cross-finding-composition-rule-registry-v1.json',
 w12Contract:'content/professional/bzr-full-production/contracts/bazi-contradiction-counter-evidence-resolution-contract-v1.json',
 w13Contract:'content/professional/bzr-full-production/contracts/bazi-semantic-dedup-contract-v1.json',
 fixture:'content/professional/bzr-full-production/fixtures/bazi-w11-w13-composition-fixture-v1.json',
 w11Acceptance:'content/professional/bzr-full-production/acceptance/bazi-fp-w11-engineering-acceptance-v1.json',
 w12Acceptance:'content/professional/bzr-full-production/acceptance/bazi-fp-w12-engineering-acceptance-v1.json',
 w13Acceptance:'content/professional/bzr-full-production/acceptance/bazi-fp-w13-engineering-acceptance-v1.json',
 roadmap:'content/professional/bzr-full-production/roadmap/bazi-full-production-master-work-v1.5.json',
 predecessorRoadmap:'content/professional/bzr-full-production/roadmap/bazi-full-production-master-work-v1.4.json',
 docs:'docs/bzr/BAZI-FP-W11-W13.md'
};
for(const x of Object.values(p))assert(exists(x),`missing ${x}`);
const w11c=j(p.w11Contract),w11r=j(p.w11Registry),w12c=j(p.w12Contract),w13c=j(p.w13Contract),fx=j(p.fixture),w11a=j(p.w11Acceptance),w12a=j(p.w12Acceptance),w13a=j(p.w13Acceptance),roadmap=j(p.roadmap),pre=j(p.predecessorRoadmap);
for(const x of [w11c,w11r,w12c,w13c,fx,w11a,w12a,w13a])assert.equal(x.baselineCommit,baseline);
assert.equal(w11c.rules.pillarPositionAloneNeverCreatesCompositionUnit,true);assert.equal(w11c.rules.patternCandidatesRemainOneAlternativeSetWithoutWinnerSelection,true);assert.equal(w11c.rules.eachSchoolViewGetsItsOwnCompositionUnit,true);assert.equal(w11c.rules.compositionMayNotResolveContradiction,true);
assert.equal(w11r.status,'FROZEN_ENGINEERING_REGISTRY');assert.equal(new Set(w11r.rules.map(r=>r.ruleId)).size,w11r.rules.length);assert.equal(w11r.boundaries.customerNarrativeCreated,false);
assert.equal(w12c.rules.explicitCounterEvidenceMustRemainAttached,true);assert.equal(w12c.rules.multiplePatternCandidatesMustRemainAlternativesUntilUpstreamPrimaryVerdict,true);assert.equal(w12c.rules.differentSchoolsAreParallelViewsNotMajorityVote,true);assert.equal(w12c.rules.unknownBoundaryMustNotBeConvertedToNegativeEvidence,true);
assert.equal(w13c.rules.fullExplanationMaxPerSemanticCluster,1);assert.equal(w13c.rules.differentSchoolCodesMustNeverDedupIntoOnePrimary,true);assert.equal(w13c.rules.differentTemporalContextsMustNeverDedupIntoOnePrimary,true);
assert.equal(w11a.status,'ENGINEERING_COMPLETE_CROSS_FINDING_COMPOSITION');assert.equal(w12a.status,'ENGINEERING_COMPLETE_CONTRADICTION_COUNTER_EVIDENCE_RESOLUTION');assert.equal(w13a.status,'ENGINEERING_COMPLETE_SEMANTIC_DEDUP');
assert.equal(roadmap.currentBaselineCommit,baseline);assert.equal(roadmap.predecessorRef,p.predecessorRoadmap);assert.match(roadmap.status,/W11_W13_ENGINEERING_COMPLETE_W14_NEXT/);assert.match(roadmap.works.find(w=>w.work==='BAZI-FP-W11').status,/ENGINEERING_COMPLETE/);assert.match(roadmap.works.find(w=>w.work==='BAZI-FP-W12').status,/ENGINEERING_COMPLETE/);assert.match(roadmap.works.find(w=>w.work==='BAZI-FP-W13').status,/ENGINEERING_COMPLETE/);assert.equal(roadmap.works.find(w=>w.work==='BAZI-FP-W14').status,'NEXT');assert.match(pre.status,/W9_W10_ENGINEERING_COMPLETE_W11_NEXT/);

const natal=j('content/professional/bzr-full-production/fixtures/bazi-da-yun-integration-fixture-v1.json');
const temporalFixture=j('content/professional/bzr-full-production/fixtures/bazi-liu-nian-interaction-fixture-v1.json');
async function upstream(temporalProjection){
 const chart=await buildCanonicalBaziChartIR({canonicalProjection:natal});
 const strengthSeasonal=await analyzeBaziStrengthSeasonal({chart});
 const relationships=await analyzeBaziRelationships({chart});
 const tenGods=await analyzeBaziTenGods({chart});
 const patterns=await analyzeBaziPatternCandidates({chart,tenGods,relationships});
 const usefulGodTiaohou=await analyzeBaziUsefulGodTiaohouViews({chart,strengthSeasonal,patterns});
 const daYunStructural=await buildBaziDaYunStructuralIR({chart,canonicalProjection:natal});
 const liuNianInteraction=await buildBaziLiuNianInteractionIR({chart,daYunStructural,temporalProjection});
 const structuralFindings=await buildBaziStructuralFindingRegistry({chart,strengthSeasonal,relationships,tenGods,patterns,usefulGodTiaohou,daYunStructural,liuNianInteraction});
 const evidenceGraph=await buildBaziInterpretationEvidenceGraph({structuralFindings});
 return {structuralFindings,evidenceGraph};
}
const up=await upstream(temporalFixture.temporalProjection);
const c1=await buildBaziCrossFindingComposition(up),c2=await buildBaziCrossFindingComposition(up);assert.equal(c1.compositionDigest,c2.compositionDigest);assert.equal(c1.schemaVersion,'PHI-OS-BAZI-CROSS-FINDING-COMPOSITION-IR-v1.0.0');assert.equal(c1.summary.compositionUnitCount,fx.expected.w11CompositionUnitCount);assert.equal(c1.summary.coveredFindingCount,fx.expected.w11CoveredFindingCount);assert.equal(c1.summary.schoolUnitCount,fx.expected.w11SchoolUnitCount);assert.equal(c1.summary.crossFindingUnitCount,fx.expected.w11CrossFindingUnitCount);assert.deepEqual(c1.summary.typeCounts,fx.expected.w11TypeCounts);assert.equal(new Set(c1.compositionUnits.flatMap(u=>u.findingRefs)).size,fx.expected.w9FindingCount);assert.equal(c1.compositionUnits.flatMap(u=>u.findingRefs).length,fx.expected.w9FindingCount);
const foundation=c1.compositionUnits.find(u=>u.compositionType==='NATAL_FOUNDATION');assert.equal(foundation.findingRefs.length,4);const patternSet=c1.compositionUnits.find(u=>u.compositionType==='PATTERN_CANDIDATE_SET');assert.equal(patternSet.findingRefs.length,fx.expected.patternAlternativeCount);const schoolUnits=c1.compositionUnits.filter(u=>u.compositionType==='SCHOOL_QUALIFIED_VIEW');assert.deepEqual(schoolUnits.map(u=>u.schoolCode).sort(),fx.expected.schoolCodes.slice().sort());const temporal=c1.compositionUnits.find(u=>u.compositionType==='CURRENT_TEMPORAL_STRUCTURE');assert.equal(temporal.findingRefs.length,3);assert(c1.compositionUnits.every(u=>u.boundaries.customerNarrativeCreated===false&&u.boundaries.contradictionResolved===false));assert.equal(c1.boundaries.crossSchoolMergeCreated,false);assert.equal(c1.boundaries.customerProductionEligible,false);

const r1=await resolveBaziContradictions({composition:c1,...up}),r2=await resolveBaziContradictions({composition:c1,...up});assert.equal(r1.resolutionDigest,r2.resolutionDigest);assert.deepEqual(r1.summary.stateCounts,fx.expected.w12StateCounts);assert.equal(r1.summary.counterEvidenceRefCount,fx.expected.w12CounterEvidenceRefCount);assert.equal(r1.summary.unknownBoundResolutionCount,fx.expected.w12UnknownBoundResolutionCount);assert.equal(r1.summary.alternativeSetCount,fx.expected.w12AlternativeSetCount);assert.equal(r1.summary.openSchoolViewCount,fx.expected.w12OpenSchoolViewCount);assert.equal(r1.resolutions.find(r=>r.compositionRef===patternSet.compositionId).state,'ALTERNATIVES_OPEN');assert.equal(r1.resolutions.filter(r=>r.state==='SCHOOL_VIEW_OPEN').length,3);assert.equal(r1.resolutions.find(r=>r.compositionRef===temporal.compositionId).state,'QUALIFIED');assert(r1.resolutions.find(r=>r.compositionRef===temporal.compositionId).qualifierCodes.includes('CROSS_LAYER_TRANSFORMATION_NOT_ESTABLISHED'));assert.equal(r1.boundaries.patternWinnerInvented,false);assert.equal(r1.boundaries.schoolWinnerInvented,false);assert.equal(r1.boundaries.counterEvidenceDeleted,false);
const syntheticCounterUnit=structuredClone(c1.compositionUnits.find(u=>u.compositionType==='NATAL_RELATIONSHIP_STRUCTURE'));syntheticCounterUnit.counterEvidenceRefs=['SYNTHETIC-COUNTER-EVIDENCE'];const syntheticCounterResolution=resolveBaziCompositionUnit({unit:syntheticCounterUnit,findings:up.structuralFindings.findings,graph:up.evidenceGraph,unknownCatalog:up.structuralFindings.unknownCatalog});assert.equal(syntheticCounterResolution.state,'COUNTERBALANCED');assert.deepEqual(syntheticCounterResolution.counterEvidenceRefs,['SYNTHETIC-COUNTER-EVIDENCE']);assert.equal(syntheticCounterResolution.directives.deleteCounterEvidenceAllowed,false);

const d1=await buildBaziSemanticDedupIR({composition:c1,contradictionResolution:r1}),d2=await buildBaziSemanticDedupIR({composition:c1,contradictionResolution:r1});assert.equal(d1.dedupDigest,d2.dedupDigest);assert.equal(d1.summary.semanticClusterCount,fx.expected.w13SemanticClusterCount);assert.equal(d1.summary.primaryExplanationCount,fx.expected.w13PrimaryExplanationCount);assert.equal(d1.summary.contextDerivativeCount,fx.expected.w13ContextDerivativeCount);assert.equal(d1.summary.referenceOnlyCount,fx.expected.w13ReferenceOnlyCount);assert(d1.semanticClusters.every(c=>c.fullExplanationCount===1));assert.equal(new Set(d1.decisions.map(d=>d.compositionRef)).size,c1.compositionUnits.length);assert.equal(d1.boundaries.crossSchoolMergeCreated,false);assert.equal(d1.boundaries.customerNarrativeCreated,false);
const baseUnit=c1.compositionUnits.find(u=>u.compositionType==='NATAL_RELATIONSHIP_STRUCTURE');const exactDup=structuredClone(baseUnit);exactDup.compositionId=`${baseUnit.compositionId}-DUP`;const exactClusters=clusterSemanticCompositionUnits([baseUnit,exactDup]);assert.equal(exactClusters.semanticClusters.length,1);assert.equal(exactClusters.decisions.filter(d=>d.decision==='PRIMARY_EXPLANATION').length,1);assert.equal(exactClusters.decisions.filter(d=>d.decision==='REFERENCE_ONLY').length,1);
const richerDup=structuredClone(baseUnit);richerDup.compositionId=`${baseUnit.compositionId}-RICHER`;richerDup.evidenceRefs=['SYNTHETIC-NEW-EVIDENCE'];const derivativeClusters=clusterSemanticCompositionUnits([baseUnit,richerDup]);assert.equal(derivativeClusters.semanticClusters.length,1);assert.equal(derivativeClusters.decisions.filter(d=>d.decision==='PRIMARY_EXPLANATION').length,1);assert.equal(derivativeClusters.decisions.filter(d=>d.decision==='CONTEXT_DERIVATIVE').length,1);
const schoolA=structuredClone(schoolUnits[0]),schoolB=structuredClone(schoolUnits[1]);schoolB.semanticKey=schoolA.semanticKey;const schoolClusters=clusterSemanticCompositionUnits([schoolA,schoolB]);assert.equal(schoolClusters.semanticClusters.length,2);
const timeA=structuredClone(temporal),timeB=structuredClone(temporal);timeB.compositionId=`${temporal.compositionId}-OTHER-TIME`;timeB.temporalContext={...timeB.temporalContext,targetDate:'2054-10-16'};const timeClusters=clusterSemanticCompositionUnits([timeA,timeB]);assert.equal(timeClusters.semanticClusters.length,2);

const transition=structuredClone(temporalFixture.temporalProjection);transition.projectionId='BZTP-BAZI-FP-W11-W13-TRANSITION';transition.currentLuckCycle={status:'PARTIAL',state:'TRANSITION_DAY',current:null,candidates:[{cycleNumber:3,pillar:{stemCode:'JI',branchCode:'SI'}},{cycleNumber:4,pillar:{stemCode:'GENG',branchCode:'WU'}}],reasonCodes:['BZT_LUCK_TRANSITION_DAY_CIVIL_DATE_PRECISION']};const tup=await upstream(transition);const tc=await buildBaziCrossFindingComposition(tup);const tr=await resolveBaziContradictions({composition:tc,...tup});const temporalResolution=tr.resolutions.find(r=>r.semanticKey==='BAZI:COMPOSITION:CURRENT_TEMPORAL_STRUCTURE');assert(['PARTIAL','BOUNDED_BY_UNKNOWN'].includes(temporalResolution.state));assert(temporalResolution.unknownRefs.length>0);const td=await buildBaziSemanticDedupIR({composition:tc,contradictionResolution:tr});assert(td.decisions.some(d=>d.resolutionState===temporalResolution.state&&d.unknownRefs.length>0));

console.log('✓ BAZI-FP-W11–W13 composition + contradiction + semantic dedup passed.');
console.log(`  W11: ${c1.summary.coveredFindingCount} W9 findings -> ${c1.summary.compositionUnitCount} composition units; pattern alternatives stay together and ${c1.summary.schoolUnitCount} schools stay separate.`);
console.log(`  W12: ${r1.summary.resolutionCount} units classified without deletion; states ${JSON.stringify(r1.summary.stateCounts)}; explicit synthetic counter-evidence is preserved as COUNTERBALANCED.`);
console.log(`  W13: ${d1.summary.semanticClusterCount} semantic clusters / ${d1.summary.primaryExplanationCount} primary render owners; exact duplicate and new-information derivative negative cases passed.`);
console.log('  No customer narrative, winner-by-majority school merge, hidden verdict, good/bad scoring or event prediction is created; W14 Reading IR is next.');
