import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { WAVE1_C3_CLOSURE, WAVE1_C3_CLOSURE_CONTRACT, WAVE1_C3_SCOPE, resolveWave1C3ReadinessClosure, validateWave1C3ReadinessClosure } from './lib/knowledge-readiness/wave1-c3-readiness-closure.mjs';

const root=process.cwd(),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const contract=read(WAVE1_C3_CLOSURE_CONTRACT),closure=read(WAVE1_C3_CLOSURE);
assert.equal(contract.status,'active');
assert.equal(contract.baselineCommit,'335ccbaed4e8210119e2935001e571790ec2fcd1');
assert.deepEqual(contract.scope,WAVE1_C3_SCOPE);
assert.equal(contract.authorityRules.humanProductionDecisionMayBeCreated,false);
assert.equal(contract.authorityRules.sourceClosureMayInventExternalEvidence,false);
assert.equal(contract.authorityRules.legacySupportingSourceMayBecomeCanonicalSource,false);
assert.equal(contract.figureDecisionRule.requiredFigureDoesNotCreateAsset,true);
assert.equal(contract.eligibilityRule.productionReadyBeforeHumanDecision,false);
assert.equal(closure.status,'NON_HUMAN_GATES_CLOSED_PENDING_HUMAN_PRODUCTION_DECISION');
assert.equal(closure.entries.length,4);
for(const code of WAVE1_C3_SCOPE){
  const resolved=resolveWave1C3ReadinessClosure(root,code);
  assert.equal(resolved.entry.nodeCode,code);
  assert.equal(resolved.c2HashValid,true);
  assert.equal(resolved.mappingItem.humanDecision,'APPROVED_FOR_C2_MAPPING_VERIFICATION');
  assert.equal(resolved.mappingItem.partHashMatched,true);
  assert.equal(resolved.entry.humanProductionApproval.status,'not_recorded');
  assert.equal(resolved.entry.exportability.status,'blocked_until_human_production_decision');
}
const preface=closure.entries.find(x=>x.nodeCode==='KN-PREFACE-004');
assert.equal(preface.figureDecision.status,'passed');
assert.equal(preface.figureDecision.decision,'REQUIRED_FOR_WAVE1_VISUAL_ARTICLE_RELEASE');
assert.equal(preface.figureDecision.existingPublishedArticleRemainsValid,true);
assert.equal(preface.figureDecision.assetBriefCreated,false);assert.equal(preface.figureDecision.assetCreated,false);assert.equal(preface.figureDecision.carExecutionAllowed,false);
for(const code of ['KN-B1-P1-003','KN-B1-P4-003','KN-B1-P4-004']){
  const entry=closure.entries.find(x=>x.nodeCode===code);
  assert.equal(entry.sourceSufficiency.status,'passed');
  assert.equal(entry.sourceSufficiency.decision,'SUFFICIENT_FOR_CANONICAL_CANDIDATE_PRODUCTION');
  assert.equal(entry.sourceSufficiency.candidateScope,'C2_INTERNAL_CANONICAL_FRAMEWORK_ONLY');
  assert.equal(entry.sourceSufficiency.externalResearchBlocksCanonicalCandidate,false);
  assert.equal(entry.sourceSufficiency.externalResearchBlocksUnsourcedExternalClaim,true);
  assert.equal(entry.sourceSufficiency.legacySupportingSourceIsCanonicalAuthority,false);
  assert.equal(entry.sourceSufficiency.publicationSourceReviewStillRequired,true);
  assert(entry.sourceSufficiency.unresolvedExternalResearch.length>0);
}
assert.equal(validateWave1C3ReadinessClosure(root).valid,true);
assert.equal(closure.effects.humanProductionDecisionCreated,false);assert.equal(closure.effects.productionPlanFrozen,false);assert.equal(closure.effects.productionWaveFrozen,false);
assert.equal(closure.effects.pjaCandidateCreated,false);assert.equal(closure.effects.carAssetBriefCreated,false);assert.equal(closure.effects.carAssetCreated,false);assert.equal(closure.effects.publicationCreated,false);
console.log('✓ C3-CL1～CL4 Wave 1 Production Readiness Closure passed.');
console.log('✓ KN-PREFACE-004 Figure Decision is closed for future visual release without creating CAR authority or invalidating the existing publication.');
console.log('✓ P1-003/P4-003/P4-004 Source Sufficiency is closed for C2-scoped canonical candidate production; unsourced external claims remain prohibited.');
console.log('✓ C3-CL1～CL4 itself created no Human Production Decision, exportability, dispatch, candidate, asset or publication authority; downstream Human-governed authorization may supersede it.');
