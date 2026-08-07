import assert from 'node:assert/strict';
import {createNumBirthNumberRuntime,NUM_BIRTH_NUMBER_RUNTIME_CODE}
from '../functions/core-method-runtime/num-birth-number-runtime.js';
const birth={authority:'SHARED_DATA_AUTHORITY',status:'verified',methodOwner:null,pluginOwner:null,
recordId:'BIRTH-001',recordType:'BIRTH_RECORD',recordVersion:'1.0.0',
payload:{birthDate:'1989-11-15'}};
const runtime=createNumBirthNumberRuntime();
const request={calculationId:'NUM-BIRTH-001',runtimeCode:NUM_BIRTH_NUMBER_RUNTIME_CODE,
executionMode:'validation',inputRecords:[birth]};
const a=await runtime.calculate(request); const b=await runtime.calculate(request);
assert.equal(a.output.numbers.lifePath.reducedValue,8);
assert.equal(a.output.numbers.birthdayNumber.reducedValue,6);
assert.equal(a.output.numbers.attitudeNumber.reducedValue,8);
assert.equal(a.output.numberFactsCreated,true);
assert.equal(a.output.projectionCreated,false);
assert.equal(a.output.identityFactCreated,false);
assert.equal(a.outputDigest,b.outputDigest);
await assert.rejects(()=>runtime.calculate({...request,executionMode:'production'}),
/NUM_BIRTH_NUMBER_PRODUCTION_EXECUTION_FORBIDDEN/);
await assert.rejects(()=>runtime.calculate({...request,name:'Teresa'}),/NUM-W1 boundary forbidden/);
console.log('✓ NUM-W1 Birth Number Runtime passed.');
console.log('  1989-11-15 → Life Path 8, Birthday 6, Attitude 8 with stable reduction lineage.');
