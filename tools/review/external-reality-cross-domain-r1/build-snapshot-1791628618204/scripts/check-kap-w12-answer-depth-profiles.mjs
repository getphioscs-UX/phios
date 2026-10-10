import assert from 'node:assert/strict';
import {ROOT,BASELINE,readJson} from './lib/knowledge-answer-projection/kap-answer-v1.mjs';
import {composeDeterministicKapAnswer,KAP_ANSWER_DEPTHS} from '../functions/_lib/knowledge-answer-composition.js';
const c=readJson(`${ROOT}/contracts/kap-w12-answer-depth-profile-contract-v1.json`); const r=readJson(`${ROOT}/registries/kap-w12-answer-depth-profile-registry-v1.json`);
const bundle=readJson(`${ROOT}/fixtures/knowledge-grounding-bundle.valid.json`); const coverage=readJson(`${ROOT}/fixtures/kap-coverage-decision.valid.json`);
assert.equal(c.baselineCommit,BASELINE); assert.deepEqual(KAP_ANSWER_DEPTHS,['QUICK','STANDARD','DEEP']); assert.deepEqual(r.profiles.map(x=>x.code),KAP_ANSWER_DEPTHS);
const now=new Date('2026-08-14T02:00:00Z'); const answers=KAP_ANSWER_DEPTHS.map(depth=>composeDeterministicKapAnswer({bundle,coverageDecision:coverage,depth,now}));
for(const a of answers){assert.equal(a.authorityClass,'QUESTION_SCOPED_NON_AUTHORITATIVE_PROJECTION'); assert.equal(a.generation.generativeModelUsed,false);}
assert.ok(answers[0].content.relatedKnowledge.length<=answers[1].content.relatedKnowledge.length); assert.ok(answers[1].content.relatedKnowledge.length<=answers[2].content.relatedKnowledge.length);
console.log('✓ KAP-W12 Answer Depth Profiles passed.');
