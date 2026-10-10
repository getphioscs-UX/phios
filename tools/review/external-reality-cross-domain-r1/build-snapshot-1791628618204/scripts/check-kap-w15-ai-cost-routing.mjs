import assert from 'node:assert/strict';
import {ROOT,BASELINE,readJson} from './lib/knowledge-answer-projection/kap-answer-v1.mjs';
import {routeKapAiCost} from '../functions/_lib/knowledge-answer-composition.js';
const c=readJson(`${ROOT}/contracts/kap-w15-ai-cost-routing-contract-v1.json`); const r=readJson(`${ROOT}/registries/kap-w15-ai-cost-routing-registry-v1.json`);
assert.equal(c.baselineCommit,BASELINE); assert.equal(r.tiers[0].code,'TIER_0_DETERMINISTIC'); assert.equal(r.tiers[0].productionActive,true); assert.equal(r.tiers[0].paidProvider,false);
for(const tier of r.tiers.slice(1)){assert.equal(tier.productionActive,false); assert.equal(tier.providerCallLimit,0);}
for(const status of ['AI_NOT_REQUIRED','AI_OPTIONAL','AI_RECOMMENDED']){const route=routeKapAiCost({eligibility:{status}}); assert.equal(route.activeTier,'TIER_0_DETERMINISTIC'); assert.equal(route.providerInvoked,false); assert.equal(route.paidProviderRequired,false); assert.equal(route.answerMayStillBeDelivered,true);}
console.log('✓ KAP-W15 AI Cost Routing passed.');
