import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {buildEcrTopicProjection} from '../functions/embodied-configuration/ecr-topic-projection-runtime.js';
import {ECR_TOPIC_DEPLOYMENT_AUTHORITY_META,TOPICS as DEPLOY_TOPICS,MATRIX as DEPLOY_MATRIX,ACCESS as DEPLOY_ACCESS,ATOMIC as DEPLOY_ATOMIC} from '../functions/embodied-configuration/ecr-topic-deployment-authority.js';

const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha256=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const taxonomy=readJson('content/embodied-configuration/ecr-topic-r1/contracts/ecr-topic-taxonomy-contract-v1.json');
const boundary=readJson('content/embodied-configuration/ecr-topic-r1/contracts/ecr-topic-boundary-contract-v1.json');
const narrative=readJson('content/embodied-configuration/ecr-topic-r1/contracts/ecr-topic-narrative-contract-v1.json');
const access=readJson('content/embodied-configuration/ecr-topic-r1/contracts/ecr-topic-access-contract-v1.json');
const registry=readJson('content/embodied-configuration/ecr-topic-r1/registries/ecr-topic-registry-v1.json');
const matrix=readJson('content/embodied-configuration/ecr-topic-r1/registries/ecr-topic-semantic-owner-matrix-v1.json');
const census=readJson('content/embodied-configuration/ecr-topic-r1/evidence/ecr-topic-r1-w0-semantic-owner-census-v1.json');
const human=readJson('content/embodied-configuration/ecr-topic-r1/acceptance/ecr-topic-r1-w18-human-review-v1.json');
const admission=readJson('content/embodied-configuration/ecr-topic-r1/acceptance/ecr-topic-r1-w19-production-admission-v1.json');
const renderer=fs.readFileSync('assets/customer-ui/js/specialists/ecr/mandala-renderer.js','utf8');
const css=fs.readFileSync('assets/customer-ui/surfaces/ecr-specialist.css','utf8');
const runtimeSource=fs.readFileSync('functions/embodied-configuration/ecr-topic-projection-runtime.js','utf8');
const atomic=readJson('content/embodied-configuration/meaning/ecr-atomic-meaning-registry-v1.json');

assert.equal(runtimeSource.includes("from 'node:fs'"),false,'ECR Topic runtime must not import node:fs in Cloudflare Pages Functions');
assert.equal(runtimeSource.includes("from 'node:path'"),false,'ECR Topic runtime must not import node:path in Cloudflare Pages Functions');
assert.equal(runtimeSource.includes('fileURLToPath(import.meta.url)'),false,'ECR Topic runtime must not derive filesystem paths from import.meta.url in Cloudflare Pages Functions');
assert.deepEqual(DEPLOY_TOPICS,registry);
assert.deepEqual(DEPLOY_MATRIX,matrix);
assert.deepEqual(DEPLOY_ACCESS,access);
assert.deepEqual(DEPLOY_ATOMIC,atomic);
for(const source of ECR_TOPIC_DEPLOYMENT_AUTHORITY_META.generatedFrom){assert.equal(sha256(source.path),source.sha256,`deployment authority source drift: ${source.path}`);}

const topicIds=['CAREER','RELATIONSHIP','RESOURCES','FAMILY','SELF_DIRECTION','TIMING_CHANGE'];
assert.deepEqual(taxonomy.topics.map(x=>x.topicId),topicIds);
assert.equal(boundary.rule,'INTERSECTION_ONLY');
assert.deepEqual(boundary.eligibleLayers,['G','Q','R','D','M','A']);
assert.deepEqual(boundary.contextOnlyLayers,['CC','H']);
assert.equal(boundary.driverSelection.maxRankIncluded,3);
assert.equal(census.status,'CENSUS_COMPLETE');
assert.deepEqual(census.topicEligible,{G:16,Q:16,R:9,D:12,M:8,A:8});
assert.equal(narrative.rules.onlyMatchedCurrentOwnersMayBeDescribed,true);
assert.equal(access.defaultProductionState,'FREE_PREVIEW');
assert.equal(access.states.FREE_PREVIEW.mayExposeFullNarrative,false);
assert.equal(access.states.PAID.mayExposeFullNarrative,true);
for(const id of topicIds){assert.ok(matrix.topics[id],`missing topic matrix ${id}`);assert.ok(registry.topics.some(x=>x.topicId===id),`missing topic definition ${id}`);}

const universe={
 G:Array.from({length:16},(_,i)=>`G${i+1}`),Q:Array.from({length:16},(_,i)=>`Q${i+1}`),R:Array.from({length:9},(_,i)=>`R${i+1}`),D:Array.from({length:12},(_,i)=>`D${i+1}`),M:Array.from({length:8},(_,i)=>`M${i+1}`),A:Array.from({length:8},(_,i)=>`A${i+1}`)
};
const first=(xs,allow=true)=>allow?xs[0]:null;
const complement=(layer,allowed)=>universe[layer].find(x=>!allowed.includes(x))||universe[layer][0];
function mandalaFor(topicId,mode,index){
 const m=matrix.topics[topicId], matching=layer=>m[layer]||[], non=layer=>complement(layer,matching(layer));
 let g=non('G'),q=non('Q'),r=non('R'),d1=non('D'),d2=universe.D.find(x=>x!==d1&&!matching('D').includes(x))||non('D'),d3=universe.D.find(x=>x!==d1&&x!==d2&&!matching('D').includes(x))||non('D'),motion=non('M'),a=non('A');
 if(mode==='PRIMARY'){q=first(m.Q)||q;r=first(m.R)||r;d1=first(m.D)||d1;}
 if(mode==='SUPPORTING'){g=first(m.G)||g;q=first(m.Q)||q;}
 if(mode==='BACKGROUND'){g=first(m.G)||g;}
 if(topicId==='TIMING_CHANGE'){
   motion=universe.M[index%universe.M.length];a=universe.A[index%universe.A.length];
   if(mode==='PRIMARY'){r=first(m.R)||r;q=first(m.Q)||q;}
   if(mode==='SUPPORTING'){g=first(m.G)||g;}
   if(mode==='BACKGROUND'){g=non('G');q=non('Q');r=non('R');d1=non('D');}
 }
 return {schemaVersion:'PHI-OS-ECR-CUSTOMER-MANDALA-PROJECTION-v1.0.0',projectionId:`BENCH-${topicId}-${mode}-${index}`,selected:{grammarId:g,questionId:q,primaryCapabilityId:r,supportingCapabilityIds:[],driverPriority:[{driverId:d1,rank:1},{driverId:d2,rank:2},{driverId:d3,rank:3}],motionId:motion,activationId:a}};
}
let total=0;
for(const topicId of topicIds){
  const modes=topicId==='TIMING_CHANGE'?['PRIMARY','PRIMARY','PRIMARY','PRIMARY','SUPPORTING','SUPPORTING','SUPPORTING','SUPPORTING','BACKGROUND','BACKGROUND','BACKGROUND','BACKGROUND']:['PRIMARY','PRIMARY','PRIMARY','SUPPORTING','SUPPORTING','SUPPORTING','BACKGROUND','BACKGROUND','BACKGROUND','LIMITED','LIMITED','LIMITED'];
  modes.forEach((mode,index)=>{
    const mandala=mandalaFor(topicId,mode,index),free=buildEcrTopicProjection(mandala,{topicIds:[topicId],accessState:'FREE_PREVIEW'}).topics[0],paid=buildEcrTopicProjection(mandala,{topicIds:[topicId],accessState:'PAID'}).topics[0];
    const selected=new Set([mandala.selected.grammarId,mandala.selected.questionId,mandala.selected.primaryCapabilityId,...mandala.selected.supportingCapabilityIds,...mandala.selected.driverPriority.filter(x=>x.rank<=3).map(x=>x.driverId),mandala.selected.motionId,mandala.selected.activationId]);
    for(const nodeId of free.nodeIds)assert.ok(selected.has(nodeId),`${topicId} free projection added non-selected owner ${nodeId}`);
    for(const owner of paid.matchedOwners)assert.ok(selected.has(owner.nodeId),`${topicId} paid projection added non-selected owner ${owner.nodeId}`);
    assert.ok(free.nodeIds.length<=4,`${topicId} free preview leaks too many nodes`);
    assert.equal('matchedOwners' in free,false,`${topicId} free preview leaked full owners`);
    assert.equal('narrative' in free,false,`${topicId} free preview leaked narrative`);
    assert.equal('realityQuestion' in free,false,`${topicId} free preview leaked Reality question`);
    assert.ok(Array.isArray(paid.matchedOwners));assert.ok(paid.narrative);assert.ok(paid.realityQuestion);
    if(mode==='LIMITED')assert.equal(free.classification,'LIMITED',`${topicId} expected LIMITED`);
    if(mode==='PRIMARY')assert.equal(free.classification,'PRIMARY',`${topicId} expected PRIMARY`);
    total++;
  });
}
assert.equal(total,72);
assert.ok(renderer.includes('data-ecr-topic-lens-state="READY"'));
assert.ok(renderer.includes('data-topic-classification'));
assert.ok(renderer.includes('A topic lens only emphasizes ECR owners already present in this configuration.'));
assert.ok(css.includes('ECR-TOPIC-R1 governed topic projection'));
assert.equal(human.status,'HUMAN_ACCEPTED');
assert.equal(human.requiredCases,72);
assert.equal(human.humanAccepted,true);
assert.equal(human.acceptedCases,72);
assert.equal(admission.status,'PRODUCTION_ADMITTED');
assert.equal(admission.productionAdmitted,true);
assert.equal(admission.productionWiringAllowed,true);
const assembly=fs.readFileSync('functions/personal-reality-product/product-assembly.js','utf8');
assert.ok(assembly.includes("buildEcrTopicProjection(mandalaProjection,{locale,accessState:'FREE_PREVIEW'})"));
console.log('✓ ECR-TOPIC-R1 W0–W19 production admission gate passed');
console.log('  W0–W16 implemented: governed topic taxonomy, owner matrix, intersection-only runtime, Mandala lens, Free/Paid boundary.');
console.log('  W17 benchmark: 72/72 machine cases passed (6 topics × 12).');
console.log('  W18 human acceptance recorded 72/72; W19 PRODUCTION_ADMITTED with Free Preview default and Paid entitlement gate.');
