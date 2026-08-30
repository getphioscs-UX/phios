import assert from 'node:assert/strict';
import {BASELINE,ROOT,readJson,list,assertCoreRefSet} from './mfp-r-support.mjs';
const r=readJson(`${ROOT}/method-full-production-gap-registry-v1.json`), m=readJson(`${ROOT}/method-full-production-gap-work-map-v1.json`);
assert.equal(m.baselineCommit,BASELINE);assert.equal(m.workCode,'MFP-R-W1');assert.equal(m.status,'OWNER_MAP_COMPLETE');
assert.equal(m.mappings.length,r.gaps.length);assert.deepEqual(new Set(m.mappings.map(x=>x.gapId)),new Set(r.gaps.map(x=>x.gapId)));
for(const x of m.mappings){const g=r.gaps.find(y=>y.gapId===x.gapId);assert.equal(x.methodId,g.methodId);assert.match(x.ownerProgram,/FULL_PRODUCTION/);assert.ok(x.ownerWorkId);assert.ok(x.requiredSuccessorType);assert.equal(x.customerRegressionRequired,true);assert.ok(list(x.closureEvidenceRequired).length>=3);const s=JSON.stringify(x);assert.doesNotMatch(s,/personal-reality\.js|SMR paragraph|Cross rule|renderer special case/i)}
assert.deepEqual(m.requiredFlow,['method Full Production','production method result','adapter','customer product']);assert.equal(m.forbiddenCompensation.length,4);assertCoreRefSet(m);
console.log('✓ MFP-R-W1 owner map passed: every admitted gap returns to its method Full Production owner; PPR/SMR/Cross/renderer compensation is forbidden.');
