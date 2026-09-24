import fs from 'node:fs';import assert from 'node:assert/strict';
import {sha256Stable} from '../functions/interpretation-runtime/mir7-utils.js';
const read=p=>JSON.parse(fs.readFileSync(p)),base='content/embodied-configuration/v4-1/admission/';
const pkg=read('docs/ecr-human-runtime-v4-1/semantic-review-pairs.json');
assert.equal(pkg.pairs.length,14);assert.equal(pkg.candidateCount,28);
const original=read('content/embodied-configuration/v4-1/review/human-review-cases-v1.json');
for(const p of pkg.pairs){
 assert.equal(p.decision,'PENDING');assert.equal(p.en.sectionId,p.zhHans.sectionId);
 assert.equal(await sha256Stable(p.en),p.contentDigests.en);assert.equal(await sha256Stable(p.zhHans),p.contentDigests.zhHans);
 for(const [locale,key] of [['en','en'],['zh-Hans','zhHans']])assert.equal(original.candidates.find(c=>c.locale===locale&&c.sectionId===p.sectionId).contentDigest,p.contentDigests[key]);
 assert(Array.isArray(p.sourceFigureRefs));assert(Array.isArray(p.sourceSemanticRefs));assert(Array.isArray(p.customerClaimList));
}
const cards=read(base+'ecr-phi-card-runtime-slot-candidates-v1.json');
assert.equal(cards.cards.length,48);assert.equal(new Set(cards.cards.map(c=>c.cardId)).size,48);
assert(cards.cards.every(c=>c.candidateRuntimeSlot===null&&c.humanDecision==='PENDING'));assert.equal(cards.automaticSelectionAllowed,false);
const topics=read(base+'ecr-topic-geometry-migration-v1.json'),matrix=read(topics.source);
assert.equal(topics.mappings.length,Object.values(matrix.topics).flatMap(x=>Object.values(x).flat()).length);
assert(topics.mappings.every(m=>['GEOMETRY_DEPENDENT_MAPPING','UNRESOLVED','SEMANTIC_IDENTITY_INDEPENDENT_OF_GEOMETRY'].includes(m.classification)));
assert.equal(topics.customerEnabled,false);
assert.equal(read(base+'ecr-current-reality-dynamic-candidates-v1.json').customerDynamicStateAllowed,false);
assert.equal(read(base+'ecr-semantic-runtime-owner-admission-v1.json').customerMeaningAllowed,false);
console.log(`PASS V4.1A workspace: 28 digest-bound candidates, 48 unassigned cards, ${topics.mappings.length} topic relations; no fabricated admission.`);
