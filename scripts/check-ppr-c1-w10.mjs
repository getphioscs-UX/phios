import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {buildBaziMethodNativeReading} from '../functions/personal-professional-reading/bazi-method-native-reading-adapter.js';
import {buildBaziFullReading} from '../functions/api/bazi-full-reading.js';
import {buildBaziCustomerSafeStructureGraph} from '../functions/personal-professional-reading/bazi-customer-safe-graph-projection.js';
import {renderBaziCustomerSafeStructureGraph} from '../assets/customer-ui/js/surfaces/bazi-professional-reading.js';

const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const t=p=>fs.readFileSync(p,'utf8');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const baseline='b6fce24a1a4262e69aa01417e82267524f72fae6';
const contract=j('content/customer-experience-rebuild/ppr-c1/contracts/bazi-customer-safe-structure-graph-contract-v1.json');
const guard=j('content/customer-experience-rebuild/ppr-c1/contracts/bazi-w10-ppr-r2-shared-freeze-guard-v1.json');
const fixture=j('content/customer-experience-rebuild/ppr-c1/fixtures/bazi-customer-safe-graph-fixture-v1.json');
const acceptance=j('content/customer-experience-rebuild/ppr-c1/acceptance/ppr-c1-w10-engineering-acceptance-v1.json');
const roadmap=j('content/customer-experience-rebuild/ppr-c1/roadmap/ppr-c1-master-work-v4.json');
for(const x of [contract,guard,fixture,acceptance,roadmap])assert.equal(x.baselineCommit,baseline);
assert.equal(contract.status,'ENGINEERING_COMPLETE');
assert.equal(acceptance.status,'ENGINEERING_COMPLETE_PPR_R2_SHARED_LAYER_UNCHANGED');
assert.match(roadmap.status,/W0_W10_COMPLETE_W11_NEXT/);
assert.equal(roadmap.works.find(x=>x.work==='PPR-C1-W10').status,'ENGINEERING_COMPLETE');
assert.equal(roadmap.works.find(x=>x.work==='PPR-C1-W11').status,'NEXT');

for(const [path,digest] of Object.entries(guard.protectedFiles))assert.equal(sha(path),digest,`PPR-R2 shared freeze drift: ${path}`);

const natal=j('content/professional/bzr-full-production/fixtures/bazi-da-yun-integration-fixture-v1.json');
const temporal=j('content/professional/bzr-full-production/fixtures/bazi-liu-nian-interaction-fixture-v1.json').temporalProjection;
const explicitA=await buildBaziMethodNativeReading({canonicalProjection:natal,locale:'zh-Hans',temporalProjectionOverride:temporal});
const explicitB=await buildBaziMethodNativeReading({canonicalProjection:natal,locale:'zh-Hans',temporalProjectionOverride:temporal});
const noTarget=await buildBaziMethodNativeReading({canonicalProjection:natal,locale:'zh-Hans'});
for(const p of [explicitA,explicitB,noTarget]){assert.equal(p.methodId,'BZR');assert.equal(p.publicationDecision.customerPublishable,true);assert.equal(p.governance.customerSafeEvidenceGraphAuthorized,true);assert.equal(p.governance.sharedPersonalRealitySurfaceModified,false);}
const graph=explicitA.professionalModules.customerSafeGraph,graphB=explicitB.professionalModules.customerSafeGraph;
assert.deepEqual(graph,graphB,'customer-safe graph must be deterministic');
assert.equal(graph.schemaVersion,'PHI-OS-PPR-C1-BAZI-CUSTOMER-SAFE-STRUCTURE-GRAPH-v1.0.0');
assert.equal(graph.sourceGraphDigest.length,64);assert.equal(graph.sourceGraphDigest,explicitA.professionalModules.customerSafeGraph.sourceGraphDigest);
assert.equal(graph.summary.nodeCount,fixture.expected.customerNodeCount);
for(const key of ['sourceFindingCount','sourceEvidenceCount','sourceAuthorityCount','sourceUnknownCount','sourceCounterEvidenceCount'])assert.equal(graph.summary[key],fixture.expected[key]);
assert.deepEqual(new Set(graph.nodes.map(x=>x.nodeKey)),new Set(fixture.expected.requiredNodeKeys));
const node=key=>graph.nodes.find(x=>x.nodeKey===key);
assert.equal(node('FOUNDATION').trace.resolutionState,fixture.expected.foundationState);
assert.equal(node('RELATIONSHIPS').trace.resolutionState,fixture.expected.relationshipState);
assert.equal(node('PATTERN').trace.resolutionState,fixture.expected.patternState);
for(const key of ['SCHOOL_ZIPING','SCHOOL_TIYONG','SCHOOL_TIAOHOU'])assert.equal(node(key).trace.resolutionState,fixture.expected.schoolState);
assert.equal(node('DA_YUN').trace.resolutionState,fixture.expected.timingState);assert.equal(node('LIU_NIAN').trace.resolutionState,fixture.expected.timingState);
assert.equal(node('DA_YUN').availability,'CURRENT_CONTEXT_ESTABLISHED');assert.equal(node('LIU_NIAN').availability,'CURRENT_CONTEXT_ESTABLISHED');
const noTargetGraph=noTarget.professionalModules.customerSafeGraph;const noNode=key=>noTargetGraph.nodes.find(x=>x.nodeKey===key);assert.equal(noNode('DA_YUN').availability,'SEQUENCE_ONLY');assert.equal(noNode('LIU_NIAN').availability,'UNAVAILABLE');
for(const key of ['rawNodeIdsExposed','rawEdgeIdsExposed','rawEvidenceIdsExposed','rawAuthorityIdsExposed','rawUnknownIdsExposed','graphTopologyCreatesMeaning','graphTopologyImpliesProbability','readingSequenceImpliesCausality','schoolViewsMerged','unknownSuppressed','counterEvidenceSuppressed','eventPredictionCreated','goodBadScoreCreated','upstreamEvidenceGraphRecalculated','methodRuntimeRecalculated'])assert.equal(graph.boundaries[key],false,key);
const serialized=JSON.stringify(graph);for(const raw of ['BAZI-FINDING-','BAZI-EV-','BAZI-AUTH-','BAZI-UNK-','BAZI-EDGE-'])assert.equal(serialized.includes(raw),false,`raw graph id leaked into customer projection: ${raw}`);

const full=await buildBaziFullReading({schemaVersion:'PHI-OS-BAZI-FULL-READING-REQUEST-v1.0.0',canonicalProjection:natal,temporalProjection:temporal,locale:'zh-Hans'});
const synthetic=JSON.parse(JSON.stringify(full.readingIR));synthetic.renderOwners.find(x=>x.compositionType==='PATTERN_CANDIDATE_SET').counterEvidenceRefs=['SYNTHETIC_INTERNAL_COUNTER_REF'];const counterGraph=buildBaziCustomerSafeStructureGraph({readingIR:synthetic,temporalState:'EXPLICIT'});assert.equal(counterGraph.nodes.find(x=>x.nodeKey==='PATTERN').trace.counterEvidenceCount,1);assert.equal(JSON.stringify(counterGraph).includes('SYNTHETIC_INTERNAL_COUNTER_REF'),false);

globalThis.document={documentElement:{lang:'zh-Hans'},querySelector:()=>null,createElement:()=>({dataset:{}}),head:{appendChild(){}}};
const html=renderBaziCustomerSafeStructureGraph(explicitA);delete globalThis.document;
assert(html.includes('data-ppr-bazi-customer-safe-graph="true"'));
for(const text of ['命局基础','结构关系','格局','子平月令','滴天髓体用','寒暖燥湿','大运','流年','仍待确认'])assert(html.includes(text),`missing customer graph label: ${text}`);
for(const raw of ['BAZI-FINDING-','BAZI-EV-','BAZI-AUTH-','BAZI-UNK-','BAZI-EDGE-'])assert.equal(html.includes(raw),false,`raw graph id leaked into customer html: ${raw}`);
assert(html.includes(graph.sourceGraphDigest),'collapsed lineage should preserve upstream W10 graph digest');
const renderer=t('assets/customer-ui/js/surfaces/bazi-professional-reading.js'),css=t('assets/customer-ui/surfaces/bazi-professional-reading.css'),projection=t('functions/personal-professional-reading/bazi-customer-safe-graph-projection.js');
assert(renderer.includes("/assets/customer-ui/surfaces/bazi-professional-reading.css"));assert(renderer.includes('installBaziCustomerSafeGraphTab'));assert(renderer.includes('renderBaziCustomerSafeStructureGraph'));assert(renderer.includes('queueMicrotask'));assert(projection.includes("projectionBasis:'W14_RETAINED_FINDING_EVIDENCE_AUTHORITY_UNKNOWN_REFS_PLUS_W10_GRAPH_DIGEST'"));
for(const token of ['.cx-bazi-customer-safe-graph','.cx-bazi-graph-spine','.cx-bazi-graph-branches','@media(max-width:900px)','@media(max-width:620px)','writing-mode:horizontal-tb'])assert(css.includes(token),`missing specialist graph CSS token: ${token}`);

console.log('✓ PPR-C1-W10 BaZi Evidence Graph → Customer-Safe Structure Graph passed.');
console.log(`  Customer projection: ${graph.summary.nodeCount} nodes; source trace ${graph.summary.sourceFindingCount} findings / ${graph.summary.sourceEvidenceCount} evidence / ${graph.summary.sourceAuthorityCount} authorities / ${graph.summary.sourceUnknownCount} open boundaries.`);
console.log('  Customer HTML exposes no raw Finding/Evidence/Authority/Unknown/Edge IDs; three schools remain separate; Da Yun and Liu Nian stay distinct timing layers.');
console.log(`  PPR-R2 shared freeze guard: ${Object.keys(guard.protectedFiles).length} protected shared files byte-stable.`);
