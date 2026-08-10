import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const pre=read('content/knowledge/production-planning/activation/wave1-post-c2-c3-preflight-v1.json');
const human=read('content/knowledge/production-planning/registries/kpp-human-production-decision-registry-v1.json');
const plans=read('content/knowledge/production-planning/registries/kpp-production-plan-freeze-registry-v1.json');
const waves=read('content/knowledge/production-planning/registries/kpp-production-wave-registry-v2.json');
const pja=read('content/knowledge/production-planning/registries/kpp-pja-handoff-registry-v1.json');
const car=read('content/knowledge/production-planning/registries/kpp-car-handoff-registry-v1.json');
const expected=[['KN-PREFACE-004','ARTICLE','PJA'],['KN-B1-P1-003','FRAGMENT','PJA'],['KN-B1-P4-003','FIGURE','CAR'],['KN-B1-P4-004','MULTI_ASSET','CAR']];
assert.equal(pre.status,'BLOCKED_PENDING_C3_CLOSURE');
assert.equal(pre.baselineCommit,'6920c9efb164a6e29f7dcbd8575f7a54e9d28c2f');
assert.equal(pre.gateSnapshot.selectedItemCount,4);assert.equal(pre.gateSnapshot.c2FrozenCount,4);assert.equal(pre.gateSnapshot.productionReadyCount,0);assert.equal(pre.gateSnapshot.blockedCount,4);
assert.equal(pre.gateSnapshot.humanProductionDecisionAllowed,false);assert.equal(pre.gateSnapshot.productionPlanFreezeAllowed,false);assert.equal(pre.gateSnapshot.productionWaveFreezeAllowed,false);assert.equal(pre.gateSnapshot.dispatchAllowed,false);
for(const [code,role,target] of expected){
 const item=pre.selectedExecutionScope.find(x=>x.nodeCode===code);assert(item);assert.equal(item.productionRole,role);assert.equal(item.dispatchTarget,target);assert.equal(item.c2Status,'frozen');assert(item.c2FreezeRecord);assert.equal(item.c3Status,'production_blocked');assert.equal(item.productionReady,false);
 const assessment=read(item.c3AssessmentReference);assert.equal(assessment.nodeCode,code);assert.equal(assessment.gates.c2FrozenThesisBoundary.status,'passed');assert.equal(assessment.gates.editorialReview.status,'passed');assert.equal(assessment.gates.humanProductionApproval.status,'failed');assert.deepEqual(item.remainingBlocking,assessment.blocking);
}
assert.deepEqual(pre.requiredClosureSummary.figureDecisionClosure,['KN-PREFACE-004']);
assert.deepEqual(pre.requiredClosureSummary.sourceSufficiencyClosure,['KN-B1-P1-003','KN-B1-P4-003','KN-B1-P4-004']);
assert.equal(human.decisions.length,0);assert.equal(plans.plans.length,0);assert.equal(plans.revisions.length,0);assert.equal(waves.waves.length,0);assert.equal(pja.handoffs.length,0);assert.equal(car.handoffs.length,0);
console.log('✓ Wave 1 Post-C2 C3 Preflight passed.');
console.log('✓ 4/4 Wave 1 items are C2 frozen and Human-editorially approved, but 0/4 are C3 production ready.');
console.log('✓ KN-PREFACE-004 requires Figure Decision closure; P1-003/P4-003/P4-004 require Source Sufficiency closure.');
console.log('✓ Human Production Decision, Plan/Wave freeze and PJA/CAR dispatch remain correctly blocked.');
