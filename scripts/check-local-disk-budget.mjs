import assert from 'node:assert/strict';
import { evaluateDiskBudget } from './lib/disk-space-guard.mjs';
assert.equal(evaluateDiskBudget({availableBytes:7,estimatedBytes:2,reserveBytes:5}).overridden,false);
assert.throws(()=>evaluateDiskBudget({availableBytes:6,estimatedBytes:2,reserveBytes:5}),/INSUFFICIENT_DISK_SPACE/);
assert.equal(evaluateDiskBudget({availableBytes:0,estimatedBytes:2,reserveBytes:5,override:true}).overridden,true);
for(const estimatedBytes of [-1,NaN,Infinity,0.5]) assert.throws(()=>evaluateDiskBudget({availableBytes:10,estimatedBytes,reserveBytes:5}),/INVALID_DISK_BUDGET/);
console.log('PASS disk budget: exact threshold, low-space rejection, explicit override, invalid estimates. No build or rendering.');
