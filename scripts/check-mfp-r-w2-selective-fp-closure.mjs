import assert from 'node:assert/strict';
import {BASELINE,ROOT,readJson,list,assertCoreRefSet} from './mfp-r-support.mjs';
const r=readJson(`${ROOT}/method-full-production-gap-registry-v1.json`), c=readJson(`${ROOT}/mfp-r-w2-selective-fp-closure-v1.json`);
assert.equal(c.baselineCommit,BASELINE);assert.equal(c.closureBaselineCommit,'7c6126404fe8e257b44937a0149bf23c837c538f');assert.equal(c.workCode,'MFP-R-W2');assert.equal(c.status,'SELECTIVE_CLOSURE_COMPLETE');assert.equal(c.governance.selectiveOnly,true);assert.equal(c.governance.closedRequiresProductionAdmission,true);
const impact=new Map(r.gaps.map(x=>[x.gapId,x.customerImpact]));assert.equal(c.closures.length,r.gaps.filter(x=>['BLOCKING','MATERIAL'].includes(x.customerImpact)).length);
for(const x of c.closures){
 assert.ok(['BLOCKING','MATERIAL'].includes(impact.get(x.gapId)));assert.equal(x.status,'CLOSED');assert.ok(x.successorAuthorityRef);assert.ok(x.machineEvidence);assert.ok(x.humanEvidence);assert.ok(x.productionAdmissionRef);assert.ok(x.closedAt);assert.ok(list(x.regressionRefs).length>0);
 const human=readJson(x.humanEvidence), admission=readJson(x.productionAdmissionRef), machine=readJson(x.machineEvidence);
 assert.equal(machine.actual?.passed,240);assert.equal(machine.actual?.failed,0);assert.equal(human.status,'HUMAN_ACCEPTED');assert.equal(human.accepted,24);assert.equal(human.rejected,0);assert.equal(human.pending,0);assert.equal(admission.status,'PRODUCTION_ADMITTED');assert.equal(admission.productionAllowed,true);assert.equal(admission.customerRuntimeUseAllowed,true);assert.equal(admission.boundaries?.rendererMeaningCreated,false);
}
assert.equal(c.closedNotProductBlocking.length,16);for(const x of c.closedNotProductBlocking)assert.equal(x.status,'CLOSED_NOT_PRODUCT_BLOCKING');assertCoreRefSet(c);
const open=c.closures.filter(x=>x.status!=='CLOSED');assert.equal(open.length,0);
console.log('✓ MFP-R-W2 selective Full Production closure passed: AST-001 is 240/240 machine verified, 24/24 human accepted, PRODUCTION_ADMITTED and CLOSED; 16 stale benchmark tickets remain CLOSED_NOT_PRODUCT_BLOCKING.');
