import fs from 'node:fs';
import assert from 'node:assert/strict';
import {sha256Stable} from '../functions/interpretation-runtime/mir7-utils.js';
import {buildRelationshipBrief,RELATIONSHIP_ROLES,RELATIONSHIP_DIMENSIONS} from '../functions/personal-reading/narrative/bazi-s06-market-reading.js';

const read=p=>JSON.parse(fs.readFileSync(p));
const source=read('docs/guided-report-successor-r2/bazi-source.json');

for(const [folder,section] of [
 ['s02-market-v1','S02_PERSONALITY'],
 ['s03-market-v1','S03_LIFE_STRUCTURE'],
 ['s04-csd-v4','S04_CAREER'],
 ['s05-market-v1','S05_WEALTH']
]){
 const receipt=read(`docs/acceptance/report-narrative-t2-r1/bazi/${folder}/OWNER-ACCEPTANCE.json`);
 assert.equal(receipt.sectionKey,section);
 assert.equal(receipt.decision,'ACCEPT');
 assert.equal(receipt.productionActivated,false);
 assert.equal(receipt.locales['zh-Hans'].decision,'ACCEPT');
 assert.equal(receipt.locales.en.decision,'ACCEPT');
 const {acceptanceDigest,...seed}=receipt;
 assert.equal(await sha256Stable(seed),acceptanceDigest);
}

const en=await buildRelationshipBrief({...source,locale:'en'});
const zh=await buildRelationshipBrief({...source,locale:'zh-Hans'});
assert(en.relationshipNarrativeIR.eligibility.eligible,JSON.stringify(en.relationshipNarrativeIR.eligibility));
assert.deepEqual(en.claims,zh.claims);
assert.equal(en.sourceSemanticDigest,zh.sourceSemanticDigest);
assert.deepEqual(en.requiredClaimRoles,RELATIONSHIP_ROLES);
assert(en.marketContract.dimensions.every(x=>RELATIONSHIP_DIMENSIONS.includes(x)));
assert.equal(en.sectionKey,'S06_RELATIONSHIP');
assert.equal(en.marketDomain,'RELATIONSHIP');
assert.equal(Object.entries(en.authorityFacts).find(([k])=>k.endsWith('/leadGroup'))[1].groupCode,'OFFICER');
assert(en.claims.every(c=>c.claimId.startsWith('S06:MARKET1:')));
assert(en.marketContract.dimensions.includes('RELATIONSHIP_NOT_PARTNER_PREDICTION'));
assert(en.marketContract.dimensions.includes('DAY_PILLAR_RELATION_TRACE'));
assert(en.marketContract.dimensions.includes('NO_MARRIAGE_EVENT_PREDICTION'));
const {briefSemanticDigest,...seed}=en;
assert.equal(await sha256Stable(seed),briefSemanticDigest);

const rels=en.authorityFacts['professionalModules/relationships/items'];
assert(Array.isArray(rels)&&rels.some(r=>Array.isArray(r.positions)&&r.positions.includes('DAY')),'S06 needs at least one natal relationship involving DAY position in the current fixture');
assert(!en.claims.some(c=>/离婚|第三者|婚期|soulmate|divorce|affair|marriage date/i.test(c.text)),'S06 content plans must not turn structure into relationship-event claims');

const broken=structuredClone(source);
broken.reading.professionalModules.professionalTopics.topics=broken.reading.professionalModules.professionalTopics.topics.filter(x=>x.topicCode!=='RELATIONSHIPS');
const ineligible=await buildRelationshipBrief({...broken,locale:'en'});
assert.equal(ineligible.relationshipNarrativeIR.eligibility.eligible,false);
assert(ineligible.relationshipNarrativeIR.eligibility.reasons.includes('RELATIONSHIPS_TOPIC_REQUIRED'));

console.log('PASS: S02-S05 owner gates are bound; S06 relationship brief is deterministic, bilingual-parity stable, source-bound and blocks partner/marriage-event prediction. No provider call.');
