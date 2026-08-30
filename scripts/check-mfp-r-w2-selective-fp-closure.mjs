import assert from 'node:assert/strict';
import {BASELINE,ROOT,readJson,list,assertCoreRefSet} from './mfp-r-support.mjs';
const r=readJson(`${ROOT}/method-full-production-gap-registry-v1.json`), c=readJson(`${ROOT}/mfp-r-w2-selective-fp-closure-v1.json`);
assert.equal(c.baselineCommit,BASELINE);assert.equal(c.workCode,'MFP-R-W2');assert.equal(c.governance.selectiveOnly,true);assert.equal(c.governance.closedRequiresProductionAdmission,true);
const impact=new Map(r.gaps.map(x=>[x.gapId,x.customerImpact]));assert.equal(c.closures.length,r.gaps.filter(x=>['BLOCKING','MATERIAL'].includes(x.customerImpact)).length);
for(const x of c.closures){assert.ok(['BLOCKING','MATERIAL'].includes(impact.get(x.gapId)));assert.ok(['OPEN','IN_PROGRESS','MACHINE_VERIFIED','HUMAN_ACCEPTED','PRODUCTION_ADMITTED','CLOSED'].includes(x.status));if(x.status==='CLOSED'){assert.ok(x.successorAuthorityRef);assert.ok(x.machineEvidence);assert.ok(x.humanEvidence);assert.ok(x.productionAdmissionRef);assert.ok(x.closedAt);assert.ok(list(x.regressionRefs).length>0)}if(x.status==='PRODUCTION_ADMITTED')assert.ok(x.productionAdmissionRef)}
assert.equal(c.closedNotProductBlocking.length,16);for(const x of c.closedNotProductBlocking)assert.equal(x.status,'CLOSED_NOT_PRODUCT_BLOCKING');assertCoreRefSet(c);
const open=c.closures.filter(x=>x.status!=='CLOSED');
console.log(`✓ MFP-R-W2 selective-closure governance passed: ${c.closedNotProductBlocking.length} benchmark tickets closed as not product-blocking; ${open.length} MATERIAL/BLOCKING gap remains truthfully open pending required successor evidence.`);
