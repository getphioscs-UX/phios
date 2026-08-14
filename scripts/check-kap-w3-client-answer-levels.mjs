import assert from 'node:assert/strict';
import {BASELINE,ROOT,readJson} from './lib/knowledge-answer-projection/kap-foundation-v1.mjs';
const r=readJson(`${ROOT}/registries/kap-w3-client-answer-level-registry-v1.json`);
assert.equal(r.step,'KAP-W3'); assert.equal(r.baselineCommit,BASELINE); assert.equal(r.status,'FOUNDATION_REGISTRY_FROZEN_ROUTING_NOT_ACTIVATED');
assert.deepEqual(r.levels.map(x=>x.code),['ASK_PHIOS','GUIDED_READING','REALITY_JOURNEY']); assert.deepEqual(r.levels.map(x=>x.level),[1,2,3]);
const ask=r.levels[0],guided=r.levels[1],journey=r.levels[2]; assert.equal(ask.createsPersistentCase,false); assert.equal(ask.requiresRealityModel,false); assert.equal(guided.createsPersistentCase,false); assert.equal(journey.createsPersistentCase,true); assert.equal(journey.requiresRealityModel,true); assert.equal(journey.requiresExplicitEscalationConsent,true);
const personal=r.orthogonalCapabilities.find(x=>x.code==='PERSONAL_RUNTIME'); assert.ok(personal); assert.equal(personal.isKnowledgeAnswerLevel,false); assert.equal(personal.futureDeliveryAuthority,'MCD'); assert.equal(personal.kapFoundationActivates,false);
for(const [k,v] of Object.entries(r.routingInvariants)) assert.equal(v,true,`ROUTING_INVARIANT_FALSE:${k}`);
console.log('✓ KAP-W3 Client Answer Level Registry passed.');
