import assert from 'node:assert/strict';
import {ROOT,BASELINE,readJson,read} from './lib/knowledge-answer-projection/kap-answer-v1.mjs';
import {projectKapUnknownBoundary,composeKapAnswerProjection} from '../functions/_lib/knowledge-answer-composition.js';
const c=readJson(`${ROOT}/contracts/kap-w17-answer-unknown-boundary-contract-v1.json`); const bundle=readJson(`${ROOT}/fixtures/knowledge-grounding-bundle.valid.json`); const coverage=readJson(`${ROOT}/fixtures/kap-coverage-decision.valid.json`);
assert.equal(c.baselineCommit,BASELINE); assert.equal(c.rules.unknownMustNotBeFilledByAi,true); assert.equal(c.rules.guidedReadingRoutingActivated,false); assert.equal(c.productionOutcome,'ASK_PHIOS_INDEPENDENTLY_DELIVERABLE');
const boundary=projectKapUnknownBoundary({bundle,coverageDecision:coverage,locale:'zh-Hans'}); assert.equal(boundary.knowledgeStatus,'KNOWN_WITH_DECLARED_BOUNDARIES'); assert.ok(boundary.unknowns.length>0); assert.equal(boundary.guidedReadingRoutingActivated,false);
const response=composeKapAnswerProjection({bundle,coverageDecision:coverage,depth:'STANDARD',now:new Date('2026-08-14T02:00:00Z')}); assert.equal(response.production.independentlyDeliverable,true); assert.equal(response.production.requiresMcd,false); assert.equal(response.production.requiresGuidedReading,false); assert.equal(response.production.requiresRealityJourney,false);
const page=read('knowledge-search.html'); const client=read('assets/js/pages/knowledge-search.js'); const api=read('functions/api/ask-phios.js'); assert.ok(page.includes('Ask PHI OS')); assert.ok(client.includes("askPhios")); assert.ok(api.includes('runAskPhiosPipeline'));
console.log('✓ KAP-W17 Unknown Boundary + Ask PHI OS independent delivery passed.');
