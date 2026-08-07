import assert from 'node:assert/strict';
import {createNumCycleRuntime,NUM_CYCLE_RUNTIME_CODE}
from '../functions/core-method-runtime/num-cycle-runtime.js';
const record={authority:'SHARED_DATA_AUTHORITY',status:'verified',methodOwner:null,pluginOwner:null,
recordId:'NUM-W1-001',recordType:'NUM_BIRTH_NUMBER_RESULT',recordVersion:'1.0.0',
payload:{runtimeCode:'NUM_BIRTH_NUMBER_RUNTIME',runtimeVersion:'1.0.0',
outputDigest:'a'.repeat(64),birthDate:'1989-11-15',numberFactsCreated:true,
numbers:{lifePath:{reducedValue:8}}}};
const runtime=createNumCycleRuntime();
const request={calculationId:'NUM-CYCLE-001',runtimeCode:NUM_CYCLE_RUNTIME_CODE,
executionMode:'validation',targetDate:'2026-08-07',
timezonePolicyCode:'USER_LOCAL_CALENDAR_DATE_V1',inputRecords:[record]};
const a=await runtime.calculate(request); const b=await runtime.calculate(request);
assert.equal(a.output.calendarCycles.personalYear.reducedValue,9);
assert.equal(a.output.calendarCycles.personalMonth.reducedValue,8);
assert.equal(a.output.calendarCycles.personalDay.reducedValue,6);
assert.equal(a.output.lifeStageCycles.pinnacleCycles.length,4);
assert.equal(a.output.lifeStageCycles.challengeCycles.length,4);
assert.equal(a.output.futureEventPredicted,false);
assert.equal(a.output.projectionCreated,false);
assert.equal(a.outputDigest,b.outputDigest);
await assert.rejects(()=>runtime.calculate({...request,executionMode:'production'}),
/NUM_CYCLE_PRODUCTION_EXECUTION_FORBIDDEN/);
console.log('✓ NUM-W3 Cycle Runtime passed.');
console.log('  Explicit target date → deterministic personal cycles and governed life-stage cycles.');
console.log('  Numeric cycles do not predict events or create Reality conclusions.');
