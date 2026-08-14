import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {BASELINE,ROOT,readJson,assertEvidence,fakeAssetsEnv} from './lib/knowledge-answer-projection/kap-grounding-v1.mjs';
import {runKapGroundingPipeline} from '../functions/_lib/knowledge-answer-grounding.js';
const pkg=readJson('package.json');
const aliases=['check:kap-w4','check:kap-w5','check:kap-w6','check:kap-w7','check:kap-w8','check:kap-w9','check:kap-w10'];
for(const alias of aliases) assert.ok(pkg.scripts[alias],`MISSING_SCRIPT:${alias}`);
const acceptance=readJson(`${ROOT}/acceptance/kap-w4-w10-knowledge-grounding-acceptance-v1.json`);
const freeze=readJson(`${ROOT}/freeze/kap-w4-w10-knowledge-grounding-freeze-v1.json`);
assert.equal(acceptance.baselineCommit,BASELINE); assert.equal(acceptance.status,'ACCEPTED_QUESTION_TO_GROUNDING_PIPELINE_NO_ANSWER_COMPOSITION'); assert.equal(acceptance.nextPermittedWork,'KAP-W11_DETERMINISTIC_ANSWER_FIRST');
assert.equal(freeze.baselineCommit,BASELINE); assert.equal(freeze.status,'FROZEN_KNOWLEDGE_GROUNDING_RUNTIME_NO_ANSWER_COMPOSITION');
for(const item of freeze.frozenOutputs) assertEvidence(item); for(const item of freeze.predecessorEvidence) assertEvidence(item);
for(const [key,value] of Object.entries(freeze.nonActivation)) assert.equal(value,false,`UNEXPECTED_ACTIVATION:${key}`);
for(const alias of aliases){ const cmd=pkg.scripts[alias]; const [exe,...args]=cmd.split(' '); assert.equal(exe,'node'); const run=spawnSync(process.execPath,args,{cwd:process.cwd(),encoding:'utf8'}); assert.equal(run.status,0,`${alias} failed\n${run.stdout}\n${run.stderr}`); process.stdout.write(run.stdout); }
const pipeline=await runKapGroundingPipeline({input:{question:'为什么人工智能是文明能力长期累积的结果',locale:'zh-Hans'},request:new Request('https://kap.local/ask'),env:fakeAssetsEnv()});
assert.equal(pipeline.phase,'KAP-W4-W10'); assert.equal(pipeline.answerCompositionPerformed,false); assert.equal(pipeline.intake.capability,'ASK_PHIOS'); assert.equal(pipeline.retrieval.ok,true); assert.equal(pipeline.retrieval.retrievalRequest.params.source,'hybrid'); assert.equal(pipeline.retrieval.upstreamGroundedAnswerConsumed,false); assert.equal(pipeline.groundingBundle.objectType,'KnowledgeGroundingBundle'); assert.ok(pipeline.groundingBundle.sources.length>0); assert.equal(pipeline.groundingBundle.governance.answerComposed,false); assert.equal(pipeline.coverageDecision.status,'STRONG_COVERAGE'); assert.equal(pipeline.coverageDecision.aiRequired,false); assert.equal(pipeline.coverageDecision.guidedReadingRequired,false); assert.equal(pipeline.coverageDecision.realityJourneyRequired,false);
assert.equal(pkg.scripts['check:kap-grounding'],'node scripts/check-kap-w4-w10-knowledge-grounding.mjs'); assert.equal(pkg.scripts['check:kap'],'npm run check:kap-foundation && npm run check:kap-grounding');
console.log('✓ KAP Phase 2 W4-W10 Knowledge Grounding accepted and frozen.');
console.log('  ASK_PHIOS now resolves Question → KSAR retrieval → governed node/relationship grounding → coverage; Answer Composition remains deferred to KAP-W11.');
