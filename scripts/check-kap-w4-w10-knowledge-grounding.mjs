import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {BASELINE,ROOT,readJson,sha256,assertFile,assertEvidence,fakeAssetsEnv} from './lib/knowledge-answer-projection/kap-grounding-v1.mjs';
import {runKapGroundingPipeline} from '../functions/_lib/knowledge-answer-grounding.js';
const pkg=readJson('package.json');
const aliases=['check:kap-w4','check:kap-w5','check:kap-w6','check:kap-w7','check:kap-w8','check:kap-w9','check:kap-w10'];
for(const alias of aliases) assert.ok(pkg.scripts[alias],`MISSING_SCRIPT:${alias}`);
const acceptance=readJson(`${ROOT}/acceptance/kap-w4-w10-knowledge-grounding-acceptance-v1.json`);
const freeze=readJson(`${ROOT}/freeze/kap-w4-w10-knowledge-grounding-freeze-v1.json`);
const currentSuccessor=readJson(`${ROOT}/reconciliation/kap-w4-w10-current-grounding-successor-v1.json`);
const relevanceSuccessor=readJson(`${ROOT}/reconciliation/kap-p1-question-source-relevance-successor-v1.json`);
const relevanceRuntime=new Map(relevanceSuccessor.runtimeSuccessors.map(item=>[item.path,item]));
assert.equal(acceptance.baselineCommit,BASELINE); assert.equal(acceptance.status,'ACCEPTED_QUESTION_TO_GROUNDING_PIPELINE_NO_ANSWER_COMPOSITION'); assert.equal(acceptance.nextPermittedWork,'KAP-W11_DETERMINISTIC_ANSWER_FIRST');
assert.equal(freeze.baselineCommit,BASELINE); assert.equal(freeze.status,'FROZEN_KNOWLEDGE_GROUNDING_RUNTIME_NO_ANSWER_COMPOSITION');
assert.equal(currentSuccessor.status,'ACTIVE_ADDITIVE_PUBLISHED_COVERAGE_SUCCESSOR');
assert.equal(relevanceSuccessor.status,'ACTIVE_ADDITIVE_QUESTION_SOURCE_RELEVANCE_SUCCESSOR');
assert.equal(relevanceSuccessor.authorityBoundary.questionSourceRelevancePolicyChanged,true);
for(const key of ['knowledgeAuthorityChanged','retrievalAuthorityChanged','answerAuthorityChanged','meaningAdmissionChanged','canonicalKnowledgeMutationAllowed','modelGapFillAllowed','historicalFreezeMutationAllowed']) assert.equal(relevanceSuccessor.authorityBoundary[key],false,`KAP_RELEVANCE_AUTHORITY_DRIFT:${key}`);
for(const item of relevanceSuccessor.runtimeSuccessors){ assertFile(item.path); assert.equal(sha256(item.path),item.currentSha256,`KAP_RELEVANCE_CURRENT_RUNTIME_DRIFT:${item.path}`); }
assert.equal(currentSuccessor.predecessor.sha256,freeze.predecessorEvidence.find(item=>item.path===currentSuccessor.predecessor.artifactPath).sha256);
assertFile(currentSuccessor.current.artifactPath); assert.equal(sha256(currentSuccessor.current.artifactPath),currentSuccessor.current.sha256);
const currentRelationships=readJson(currentSuccessor.current.artifactPath); assert.equal(currentRelationships.recordCount,currentSuccessor.current.recordCount); assert.equal(currentRelationships.records.length,currentSuccessor.current.recordCount);
for(const code of currentSuccessor.preservedRelationshipCodes){ const relationship=currentRelationships.records.find(item=>item.relationshipCode===code); assert.ok(relationship,`MISSING_PREDECESSOR_RELATIONSHIP:${code}`); assert.equal(relationship.targetPublished,true); }
for(const value of Object.values(currentSuccessor.authorityBoundary)) assert.equal(value,false);
const assertFrozenOrCurrentEvidence=item=>{ if(item.path===currentSuccessor.current.artifactPath){ assert.equal(item.sha256,currentSuccessor.predecessor.sha256); return; } const runtime=relevanceRuntime.get(item.path); if(runtime){ assert.equal(item.sha256,runtime.predecessorSha256,`KAP_RELEVANCE_PREDECESSOR_MISMATCH:${item.path}`); assert.equal(sha256(item.path),runtime.currentSha256,`KAP_RELEVANCE_CURRENT_RUNTIME_DRIFT:${item.path}`); return; } assertEvidence(item); };
for(const item of freeze.frozenOutputs) assertFrozenOrCurrentEvidence(item); for(const item of freeze.predecessorEvidence) assertFrozenOrCurrentEvidence(item);
for(const [key,value] of Object.entries(freeze.nonActivation)) assert.equal(value,false,`UNEXPECTED_ACTIVATION:${key}`);
for(const alias of aliases){ const cmd=pkg.scripts[alias]; const [exe,...args]=cmd.split(' '); assert.equal(exe,'node'); const run=spawnSync(process.execPath,args,{cwd:process.cwd(),encoding:'utf8'}); assert.equal(run.status,0,`${alias} failed\n${run.stdout}\n${run.stderr}`); process.stdout.write(run.stdout); }
const pipeline=await runKapGroundingPipeline({input:{question:'为什么人工智能是文明能力长期累积的结果',locale:'zh-Hans'},request:new Request('https://kap.local/ask'),env:fakeAssetsEnv()});
assert.equal(pipeline.phase,'KAP-W4-W10'); assert.equal(pipeline.answerCompositionPerformed,false); assert.equal(pipeline.intake.capability,'ASK_PHIOS'); assert.equal(pipeline.retrieval.ok,true); assert.equal(pipeline.retrieval.retrievalRequest.params.source,'hybrid'); assert.equal(pipeline.retrieval.upstreamGroundedAnswerConsumed,false); assert.equal(pipeline.groundingBundle.objectType,'KnowledgeGroundingBundle'); assert.ok(pipeline.groundingBundle.sources.length>0); assert.equal(pipeline.groundingBundle.governance.answerComposed,false); assert.equal(pipeline.coverageDecision.status,'STRONG_COVERAGE'); assert.equal(pipeline.coverageDecision.aiRequired,false); assert.equal(pipeline.coverageDecision.guidedReadingRequired,false); assert.equal(pipeline.coverageDecision.realityJourneyRequired,false);
assert.equal(pkg.scripts['check:kap-grounding'],'node scripts/check-kap-w4-w10-knowledge-grounding.mjs'); const kapSegments=String(pkg.scripts['check:kap']||'').split(' && '); const foundationIndex=kapSegments.indexOf('npm run check:kap-foundation'); const groundingIndex=kapSegments.indexOf('npm run check:kap-grounding'); assert.ok(foundationIndex>=0&&groundingIndex>foundationIndex);
console.log('✓ KAP Phase 2 W4-W10 Knowledge Grounding accepted and frozen.');
console.log('  ASK_PHIOS now resolves Question → KSAR retrieval → governed node/relationship grounding → coverage; Answer Composition remains deferred to KAP-W11.');
