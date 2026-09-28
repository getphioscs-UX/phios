import {buildEcrHumanRuntime} from '../functions/embodied-configuration/ecr-canonical-projection-runtime-v2.js';
import fs from 'node:fs';import assert from 'node:assert/strict';import {projectEcrHumanRuntimeCards} from '../functions/ecr-phi-card/ecr-human-runtime-cards-v4-1.js';
const ir=await buildEcrHumanRuntime({canonicalInput:JSON.parse(fs.readFileSync('content/embodied-configuration/v4-1/acceptance/birth-fixtures-v1.json')).cases[0].canonicalInput}),cards=projectEcrHumanRuntimeCards(ir);
assert.deepEqual(cards.cards.map(c=>c.slot),['CARRIER','EXPERIENCE','EXPRESSION','AGENCY','IDENTITY','FEEDBACK_CONTINUITY']);
assert.equal(cards.predecessorDeckCount,48);assert.equal(cards.randomDraw,false);assert.equal(cards.fullReportRemainsPrimary,true);
assert(cards.cards.every(c=>['ADMITTED_SELECTION','UNKNOWN'].includes(c.status)));
for(const c of cards.cards.filter(c=>c.status==='ADMITTED_SELECTION')){assert(c.cardId);assert(c.asset?.objectKey);assert(c.selectionEvidence?.priority?.tier);}
assert.deepEqual(cards,projectEcrHumanRuntimeCards(ir));
console.log('PASS V4.1 W13: six deterministic governed slots; admitted cards use W8 tags/priority and unresolved ties fail closed to UNKNOWN.');
