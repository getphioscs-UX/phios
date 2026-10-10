import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { WAVE1_C3_HUMAN_APPROVAL, WAVE1_HUMAN_DECISION, WAVE1_SCOPE, canonicalSha256, resolveWave1HumanProductionDecision } from './lib/knowledge-production-planning/wave1-production-authorization.mjs';
const root=process.cwd(), read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const decision=read(WAVE1_HUMAN_DECISION), approval=read(WAVE1_C3_HUMAN_APPROVAL);
const expected=[['KN-PREFACE-004','ARTICLE','PJA'],['KN-B1-P1-003','FRAGMENT','PJA'],['KN-B1-P4-003','FIGURE','CAR'],['KN-B1-P4-004','MULTI_ASSET','CAR']];
assert.equal(decision.status,'APPROVED_FOR_PRODUCTION');assert.equal(decision.actor,'TL');assert.equal(decision.actorRole,'HUMAN_PRODUCTION_AUTHORITY');assert.equal(decision.timestamp,'2026-08-10T19:46:00+08:00');
assert.equal(decision.decisionStatement,'Wave 1 四项全部 approve_for_production。');assert.equal(decision.entries.length,4);assert.equal(new Set(decision.entries.map(x=>x.nodeCode)).size,4);
assert.equal(decision.decisionDigest,canonicalSha256(Object.fromEntries(Object.entries(decision).filter(([k])=>k!=='decisionDigest'))));
for(const [code,role,target] of expected){
  const resolved=resolveWave1HumanProductionDecision(root,code);assert(resolved?.approved);assert.equal(resolved.entry.productionRole,role);assert.equal(resolved.entry.dispatchTarget,target);assert.equal(resolved.entry.decision,'approve_for_production');
  const c2=read(`content/knowledge/editorial/c2/frozen/${code.toLowerCase()}.json`);assert.equal(resolved.entry.c2ContentHash,c2.contentHash);
  const nodeDecision=read(resolved.entry.decisionRecord);
  assert.equal(nodeDecision.nodeCode,code);assert.equal(nodeDecision.productionRole,role);assert.equal(nodeDecision.dispatchTarget,target);assert.equal(nodeDecision.decision,'approve_for_production');
  assert.equal(nodeDecision.actor,'TL');assert.equal(nodeDecision.actorRole,'HUMAN_PRODUCTION_AUTHORITY');assert.equal(nodeDecision.timestamp,decision.timestamp);assert.equal(nodeDecision.c2ContentHash,c2.contentHash);
  assert.deepEqual(nodeDecision.requiredOutputs,resolved.entry.requiredOutputs);assert.equal(nodeDecision.priority,resolved.entry.priority);assert.equal(nodeDecision.waveCode,resolved.entry.waveCode);
  const nodeDigest=canonicalSha256(Object.fromEntries(Object.entries(nodeDecision).filter(([k])=>k!=='decisionDigest')));assert.equal(nodeDecision.decisionDigest,nodeDigest);assert.equal(resolved.entry.decisionRecordDigest,nodeDigest);
  assert(nodeDecision.supportingEvidence.includes(resolved.entry.eligibilityReference));assert(nodeDecision.supportingEvidence.includes(resolved.entry.c3AssessmentReference));
  const assessment=read(resolved.entry.c3AssessmentReference);assert.equal(assessment.status,'production_ready');assert.equal(assessment.productionReady,true);assert.equal(assessment.gates.humanProductionApproval.status,'passed');assert.equal(assessment.gates.exportability.status,'passed');assert.equal(assessment.exportability,'allowed');assert.deepEqual(assessment.blocking,[]);
  assert.equal(assessment.authority.humanProductionDecisionRecord,WAVE1_HUMAN_DECISION);assert.equal(assessment.authority.humanProductionDecisionDigest,decision.decisionDigest);assert.equal(assessment.authority.humanProductionApproved,true);
}
assert.deepEqual(WAVE1_SCOPE,expected.map(x=>x[0]));
assert.equal(approval.status,'APPROVED');assert.equal(approval.approvedBy,'TL');assert.equal(approval.approverRole,'HUMAN_PRODUCTION_AUTHORITY');assert.equal(approval.humanDecisionDigest,decision.decisionDigest);assert.equal(approval.entries.length,4);
for(const p of ['content/knowledge/production-planning/registries/kpp-human-production-decision-registry-v1.json','content/knowledge/production-planning/registries/kpp-production-plan-freeze-registry-v1.json','content/knowledge/production-planning/registries/kpp-production-wave-registry-v2.json']){const doc=read(p);assert.equal(doc.status,'validation_only');}
assert.equal(read('content/knowledge/production-planning/registries/kpp-human-production-decision-registry-v1.json').decisions.length,0);
console.log('✓ Wave 1 KPP-W25 Human Production Decision passed.');
console.log('✓ TL approved 4/4 items for production; each decision is bound to C2 contentHash and the prior Human Decision eligibility authority.');
console.log('✓ C3 Human Production Approval and Exportability now pass for all four Wave 1 items; productionReady = true without creating candidates or publication.');
