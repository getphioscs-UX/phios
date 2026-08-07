import assert from 'node:assert/strict';
import {createNumNumberStructureRuntime,NUM_NUMBER_STRUCTURE_RUNTIME_CODE}
from '../functions/core-method-runtime/num-number-structure-runtime.js';
const record={authority:'SHARED_DATA_AUTHORITY',status:'verified',methodOwner:null,pluginOwner:null,
recordId:'NUM-W1-001',recordType:'NUM_BIRTH_NUMBER_RESULT',recordVersion:'1.0.0',
payload:{runtimeCode:'NUM_BIRTH_NUMBER_RUNTIME',runtimeVersion:'1.0.0',
outputDigest:'a'.repeat(64),executionMode:'validation',birthDate:'1989-11-15',
numbers:{
lifePath:{rawValue:35,reductionSteps:[35,8],reducedValue:8,masterNumberPreserved:false},
birthdayNumber:{rawValue:15,reductionSteps:[15,6],reducedValue:6,masterNumberPreserved:false},
attitudeNumber:{rawValue:26,reductionSteps:[26,8],reducedValue:8,masterNumberPreserved:false},
birthYearNumber:{rawValue:27,reductionSteps:[27,9],reducedValue:9,masterNumberPreserved:false},
birthMonthNumber:{rawValue:11,reductionSteps:[11],reducedValue:11,masterNumberPreserved:true},
birthDayNumber:{rawValue:15,reductionSteps:[15,6],reducedValue:6,masterNumberPreserved:false}},
numberFactsCreated:true,structureCreated:false,projectionCreated:false,productionEligible:false}};
const runtime=createNumNumberStructureRuntime();
const request={calculationId:'NUM-STRUCT-001',runtimeCode:NUM_NUMBER_STRUCTURE_RUNTIME_CODE,
executionMode:'validation',inputRecords:[record]};
const a=await runtime.calculate(request); const b=await runtime.calculate(request);
assert.equal(a.output.numberFacts.length,6);
assert.equal(a.output.digitFrequency.length,9);
assert.equal(a.output.digitFrequency.find(x=>x.digit===1).occurrenceCount,4);
assert.equal(a.output.masterNumberState.find(x=>x.number===11).present,true);
assert.equal(a.output.digitFrequency.every(x=>x.absenceMeansDeficit===false),true);
assert.equal(a.output.projectionCreated,false);
assert.equal(a.outputDigest,b.outputDigest);
console.log('✓ NUM-W2 Number Structure Runtime passed.');
console.log('  Stable number facts, digit frequency and master-number state are normalized without identity meaning.');
