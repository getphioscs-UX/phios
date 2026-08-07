import assert from 'node:assert/strict';
import {createNumProjectionRuntime,NUM_PROJECTION_RUNTIME_CODE}
from '../functions/core-method-runtime/num-projection-runtime.js';
const base=(id,algo,digest,output)=>({calculationId:id,runtimeCode:'SHARED_CALCULATION_RUNTIME',
runtimeVersion:'1.0.0',methodCode:'NUMEROLOGY',pluginCode:'NUM',algorithmCode:algo,
algorithmVersion:'1.0.0',inputDigest:'1'.repeat(64),outputDigest:digest,output,
deterministic:true,providerUsed:false,aiUsed:false,projectionCreated:false,
interpretationCreated:false,professionalConclusionCreated:false});
const bd='a'.repeat(64),sd='b'.repeat(64),cd='c'.repeat(64);
const birth=base('B','NUM_BIRTH_NUMBER_CALCULATION',bd,{runtimeCode:'NUM_BIRTH_NUMBER_RUNTIME',
numberFactsCreated:true,birthDate:'1989-11-15',numbers:{lifePath:{reducedValue:8}},productionEligible:false});
const structure=base('S','NUM_NUMBER_STRUCTURE_NORMALIZATION',sd,{runtimeCode:'NUM_NUMBER_STRUCTURE_RUNTIME',
structureCreated:true,birthDate:'1989-11-15',numberFacts:[],digitFrequency:[],masterNumberState:[],compoundNumbers:[],
lineage:{birthNumberOutputDigest:bd},productionEligible:false});
const cycle=base('C','NUM_DATE_AND_LIFE_STAGE_CYCLES',cd,{runtimeCode:'NUM_CYCLE_RUNTIME',
cycleCreated:true,birthDate:'1989-11-15',targetDate:'2026-08-07',timezonePolicyCode:'USER_LOCAL_CALENDAR_DATE_V1',
calendarCycles:{},lifeStageCycles:{},lineage:{birthNumberOutputDigest:bd},productionEligible:false});
const runtime=createNumProjectionRuntime();
const req={runtimeCode:NUM_PROJECTION_RUNTIME_CODE,executionMode:'validation',projectionVersion:'1.0.0',
birthNumberCalculationResult:birth,numberStructureCalculationResult:structure,cycleCalculationResult:cycle};
const a=await runtime.project(req),b=await runtime.project(req);
assert.deepEqual(a.projections.map(x=>x.projectionType),['NUMBER','NUMBER_STRUCTURE','NUMBER_CYCLE']);
assert.deepEqual(a.projections.map(x=>x.projectionCode),b.projections.map(x=>x.projectionCode));
assert.equal(a.productionEligible,false); assert.equal(a.meaningCreated,false);
await assert.rejects(()=>runtime.project({...req,executionMode:'production'}),/NUM_PROJECTION_PRODUCTION_EXECUTION_FORBIDDEN/);
console.log('✓ NUM-W4 Projection Runtime passed.');
console.log('  NUMBER / NUMBER_STRUCTURE / NUMBER_CYCLE use a versioned numeric projection extension.');
