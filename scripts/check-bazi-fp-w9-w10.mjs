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

const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const exists=p=>fs.existsSync(p);
const baseline='dd15cb928004dfc16768df9eeb4c2b0689a6f0a9';
const p={
 w9Contract:'content/professional/bzr-full-production/contracts/bazi-structural-finding-contract-v1.json',
 w9Registry:'content/professional/bzr-full-production/registries/bazi-structural-finding-type-registry-v1.json',
 w10Contract:'content/professional/bzr-full-production/contracts/bazi-interpretation-evidence-graph-contract-v1.json',
 fixture:'content/professional/bzr-full-production/fixtures/bazi-structural-finding-evidence-graph-fixture-v1.json',
 w9Acceptance:'content/professional/bzr-full-production/acceptance/bazi-fp-w9-engineering-acceptance-v1.json',
 w10Acceptance:'content/professional/bzr-full-production/acceptance/bazi-fp-w10-engineering-acceptance-v1.json',
 roadmap:'content/professional/bzr-full-production/roadmap/bazi-full-production-master-work-v1.4.json',
 patternRules:'content/interpretation/bazi/rulesets/bazi-pattern-ruleset-v2.json',
 ziRules:'content/interpretation/bazi/rulesets/bazi-zi-ping-month-command-use-ruleset-v2.json',
 tiRules:'content/interpretation/bazi/rulesets/bazi-di-tian-sui-ti-yong-ruleset-v2.json',
 thRules:'content/interpretation/bazi/rulesets/bazi-di-tian-sui-tiaohou-ruleset-v2.json',
 admission:'content/interpretation/bazi/registries/bazi-source-admission-registry-v1.3.json'
};
for(const x of Object.values(p))assert(exists(x),`missing ${x}`);
for(const f of [p.patternRules,p.ziRules,p.tiRules,p.thRules]){const r=j(f);assert.equal(r.active,true);assert.equal(r.status,'FROZEN_SOURCE_ADMITTED_DETAILED_V2');}
const admission=j(p.admission);assert.equal(admission.registryVersion,'1.3.0');assert.equal(admission.claimBatches.find(x=>x.batchId==='BZR-R1-CLAIM-BATCH-002').humanAdmittedClaims,20);

const w9c=j(p.w9Contract),reg=j(p.w9Registry),w10c=j(p.w10Contract),fx=j(p.fixture),w9a=j(p.w9Acceptance),w10a=j(p.w10Acceptance),roadmap=j(p.roadmap);
assert.equal(w9c.baselineCommit,baseline);assert.equal(w9c.rules.oneFindingPerSemanticStructureInsteadOfOneParagraphPerPillar,true);assert.equal(w9c.rules.schoolQualifiedUseViewsMustRemainSeparate,true);assert.equal(w9c.rules.counterEvidenceResolutionOwnedByW12,true);
assert.equal(reg.baselineCommit,baseline);assert.equal(new Set(reg.types.map(x=>x.findingType)).size,reg.types.length);assert(reg.types.every(x=>x.customerOutcomeAuthority===false));assert.equal(reg.antiDuplicationRules.pillarPositionAloneIsNotFindingType,true);
assert.equal(w10c.baselineCommit,baseline);assert.equal(w10c.rules.everyFindingRequiresEvidenceEdge,true);assert.equal(w10c.rules.everyFindingRequiresAuthorityEdge,true);assert.equal(w10c.rules.graphMayNotResolveContradictions,true);assert.equal(w10c.rules.graphMayNotComposeNarrative,true);
assert.equal(w9a.status,'ENGINEERING_COMPLETE_STRUCTURAL_FINDING_REGISTRY');assert.equal(w9a.gates.CUSTOMER_INTERPRETATION_CREATED,false);assert.equal(w10a.status,'ENGINEERING_COMPLETE_INTERPRETATION_EVIDENCE_GRAPH');assert.equal(w10a.gates.NARRATIVE_COMPOSITION_CREATED,false);
assert.equal(roadmap.currentBaselineCommit,baseline);assert.match(roadmap.status,/W9_W10_ENGINEERING_COMPLETE_W11_NEXT/);assert.match(roadmap.works.find(x=>x.work==='BAZI-FP-W9').status,/ENGINEERING_COMPLETE/);assert.match(roadmap.works.find(x=>x.work==='BAZI-FP-W10').status,/ENGINEERING_COMPLETE/);assert.equal(roadmap.works.find(x=>x.work==='BAZI-FP-W11').status,'NEXT');

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
 return {chart,strengthSeasonal,relationships,tenGods,patterns,usefulGodTiaohou,daYunStructural,liuNianInteraction};
}
const inputs=await upstream(temporalFixture.temporalProjection);const f1=await buildBaziStructuralFindingRegistry(inputs);const f2=await buildBaziStructuralFindingRegistry(inputs);assert.equal(f1.findingDigest,f2.findingDigest);assert.equal(f1.schemaVersion,'PHI-OS-BAZI-STRUCTURAL-FINDING-COLLECTION-v1.0.0');assert.equal(f1.summary.findingCount,fx.expected.findingCount);assert.equal(f1.summary.evidenceCount,fx.expected.evidenceCount);assert.equal(f1.summary.authorityCount,fx.expected.authorityCount);assert.equal(f1.summary.unknownCount,fx.expected.unknownCount);assert.equal(f1.summary.stateCounts.ESTABLISHED,fx.expected.establishedFindingCount);assert.equal(f1.summary.stateCounts.CANDIDATE,fx.expected.candidateFindingCount);assert.equal(f1.summary.stateCounts.OPEN,fx.expected.openFindingCount);
assert.equal(new Set(f1.findings.map(x=>x.findingId)).size,f1.findings.length);assert.equal(new Set(f1.findings.map(x=>x.semanticDimension)).size,f1.findings.length);assert(!f1.findings.some(x=>['YEAR_PILLAR','MONTH_PILLAR','DAY_PILLAR','HOUR_PILLAR'].includes(x.findingType)));
const patterns=f1.findings.filter(x=>x.findingType==='PATTERN_CANDIDATE');assert.deepEqual(patterns.map(x=>x.metadata?.primaryPatternAssigned),[false,false,false]);assert.deepEqual(patterns.map(x=>x.state),['CANDIDATE','CANDIDATE','CANDIDATE']);assert.deepEqual(patterns.map(x=>x.semanticDimension.split(':').at(-1)).sort(),fx.expected.patternFamilies.slice().sort());assert(patterns.every(x=>x.unknownRefs.some(y=>y.includes('W5_PRIMARY_PATTERN_UNRESOLVED'))));
const schools=f1.findings.filter(x=>x.findingType==='SCHOOL_QUALIFIED_USE_CONTEXT');assert.equal(schools.length,3);assert.deepEqual(schools.map(x=>x.schoolCode).sort(),fx.expected.schoolCodes.slice().sort());assert(schools.every(x=>x.state==='OPEN'&&x.metadata.crossSchoolMergeCreated===false&&x.metadata.elementVerdictCreated===false));
const dy=f1.findings.find(x=>x.findingType==='DA_YUN_ACTIVATION');assert.equal(dy.metadata.cycleNumber,fx.expected.currentDaYunCycleNumber);const ln=f1.findings.find(x=>x.findingType==='LIU_NIAN_ACTIVATION');assert.equal(ln.metadata.year,fx.expected.liuNianYear);const cross=f1.findings.find(x=>x.findingType==='CROSS_LAYER_ACTIVATION');assert(cross);assert.equal(cross.metadata.spansThreeLayers,true);assert.equal(cross.metadata.transformationEstablished,false);const crossEv=f1.evidenceCatalog.find(x=>x.evidenceId===cross.evidenceRefs[0]);assert.deepEqual(crossEv.summary.members,fx.expected.crossLayerMembers);
assert.equal(f1.boundaries.findingIsNotCustomerInterpretation,true);assert.equal(f1.boundaries.patternPrimaryVerdictCreated,false);assert.equal(f1.boundaries.usefulGodElementVerdictCreated,false);assert.equal(f1.boundaries.tiaohouElementVerdictCreated,false);assert.equal(f1.boundaries.crossSchoolMergeCreated,false);assert.equal(f1.boundaries.counterEvidenceResolutionCreated,false);assert.equal(f1.boundaries.semanticDeduplicationCreated,false);assert.equal(f1.boundaries.goodBadScoreCreated,false);assert.equal(f1.boundaries.eventPredictionCreated,false);assert.equal(f1.boundaries.customerProductionEligible,false);

const g1=await buildBaziInterpretationEvidenceGraph({structuralFindings:f1});const g2=await buildBaziInterpretationEvidenceGraph({structuralFindings:f1});assert.equal(g1.graphDigest,g2.graphDigest);assert.equal(g1.summary.nodeCount,fx.expected.graphNodeCount);assert.equal(g1.summary.edgeCount,fx.expected.graphEdgeCount);assert.equal(g1.summary.nodeTypeCounts.FINDING,fx.expected.findingNodeCount);assert.equal(g1.summary.nodeTypeCounts.EVIDENCE,fx.expected.evidenceNodeCount);assert.equal(g1.summary.nodeTypeCounts.AUTHORITY,fx.expected.authorityNodeCount);assert.equal(g1.summary.nodeTypeCounts.UNKNOWN,fx.expected.unknownNodeCount);assert.equal(g1.summary.orphanFindingCount,0);const nodeIds=new Set(g1.nodes.map(x=>x.nodeId));assert(g1.edges.every(x=>nodeIds.has(x.from)&&nodeIds.has(x.to)));for(const f of f1.findings){const incoming=g1.edges.filter(x=>x.to===f.findingId);assert(incoming.some(x=>x.type==='SUPPORTS'||x.type==='QUALIFIES'));assert(incoming.some(x=>x.type==='GOVERNS'));}assert.equal(g1.boundaries.graphCreatesFinding,false);assert.equal(g1.boundaries.graphCreatesMeaning,false);assert.equal(g1.boundaries.graphResolvesContradiction,false);assert.equal(g1.boundaries.graphPerformsComposition,false);assert.equal(g1.boundaries.graphPerformsSemanticDeduplication,false);assert.equal(g1.boundaries.customerProductionEligible,false);

const transition=structuredClone(temporalFixture.temporalProjection);transition.projectionId='BZTP-BAZI-FP-W9-W10-TRANSITION';transition.currentLuckCycle={status:'PARTIAL',state:'TRANSITION_DAY',current:null,candidates:[{cycleNumber:3,pillar:{stemCode:'JI',branchCode:'SI'}},{cycleNumber:4,pillar:{stemCode:'GENG',branchCode:'WU'}}],reasonCodes:['BZT_LUCK_TRANSITION_DAY_CIVIL_DATE_PRECISION']};const ti=await upstream(transition);const tf=await buildBaziStructuralFindingRegistry(ti);const tdy=tf.findings.find(x=>x.findingType==='DA_YUN_ACTIVATION');assert.equal(tdy.state,'PARTIAL');assert(tdy.unknownRefs.length>0);const tg=await buildBaziInterpretationEvidenceGraph({structuralFindings:tf});assert(tg.edges.some(x=>x.type==='BOUNDS'&&x.to===tdy.findingId));

console.log('✓ BAZI-FP-W9/W10 structural findings + interpretation evidence graph passed.');
console.log(`  W9: ${f1.summary.findingCount} chart-level findings from W1-W8; pillar position is evidence, not a repeated finding type.`);
console.log(`  W9: ${patterns.length} pattern candidates remain candidates; ${schools.length} school-qualified W6 views remain separate/open; current Da Yun and Liu Nian activations are structural only.`);
console.log(`  W10: ${g1.summary.nodeCount} nodes / ${g1.summary.edgeCount} edges; every finding has evidence + authority lineage and unknown boundaries remain visible.`);
console.log('  No customer interpretation, outcome scoring, cross-school merge, contradiction resolution, semantic deduplication or event prediction is created at W9/W10.');
