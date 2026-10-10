import assert from 'node:assert/strict';
import {ROOT,BASELINE,readJson,read} from './lib/knowledge-answer-projection/kap-answer-v1.mjs';
const c=readJson(`${ROOT}/contracts/kap-w14-ai-authority-boundary-v1.json`);
assert.equal(c.baselineCommit,BASELINE); assert.equal(c.phase3.providerInvocationEnabled,false); assert.equal(c.phase3.generativeModelUsedByAskPhios,false); assert.equal(c.phase3.deterministicDeliveryIndependent,true);
for(const item of ['CREATE_CANONICAL_KNOWLEDGE','INVENT_SOURCE','CREATE_REALITY_TRUTH','CREATE_METHOD_RESULT','CURE_INSUFFICIENT_COVERAGE']) assert.ok(c.aiMayNot.includes(item));
const runtime=read('functions/_lib/knowledge-answer-composition.js'); assert.equal(/fetch\s*\(|OpenAI|Workers AI|env\.[A-Z_]*AI|provider\.invoke/.test(runtime),false);
console.log('✓ KAP-W14 AI Authority Boundary passed.');
