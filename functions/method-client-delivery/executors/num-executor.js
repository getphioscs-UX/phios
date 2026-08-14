import {createNumBirthNumberRuntime,NUM_BIRTH_NUMBER_RUNTIME_CODE} from '../../core-method-runtime/num-birth-number-runtime.js';
import {createNumNumberStructureRuntime,NUM_NUMBER_STRUCTURE_RUNTIME_CODE} from '../../core-method-runtime/num-number-structure-runtime.js';
import {createNumCycleRuntime,NUM_CYCLE_RUNTIME_CODE} from '../../core-method-runtime/num-cycle-runtime.js';
import {toTransientSharedBirthRecord} from '../canonical-birth-input-runtime.js';
function asRecord(result,requestId){return Object.freeze({authority:'SHARED_DATA_AUTHORITY',status:'draft',methodOwner:null,pluginOwner:null,recordId:`SDA-MCD4-${requestId}-NUM-W1`,recordType:'NUM_BIRTH_NUMBER_RESULT',recordVersion:'1.0.0',payload:Object.freeze({...result.output,outputDigest:result.outputDigest})})}
export async function executeNumMcd4({requestId,canonicalInput,executionParameters={}}){
  const birthRuntime=createNumBirthNumberRuntime();
  const birth=await birthRuntime.calculate({calculationId:`${requestId}:NUM-W1`,runtimeCode:NUM_BIRTH_NUMBER_RUNTIME_CODE,executionMode:'validation',inputRecords:[toTransientSharedBirthRecord(canonicalInput,requestId)]});
  const birthRecord=asRecord(birth,requestId);
  const structureRuntime=createNumNumberStructureRuntime();
  const structure=await structureRuntime.calculate({calculationId:`${requestId}:NUM-W2`,runtimeCode:NUM_NUMBER_STRUCTURE_RUNTIME_CODE,executionMode:'validation',inputRecords:[birthRecord]});
  const coreResults=[birth,structure]; const executedStages=['NUM_BIRTH_NUMBER','NUM_NUMBER_STRUCTURE']; const deferredStages=[]; const reasons=['NUM_BIRTH_NUMBER_EXECUTED','NUM_NUMBER_STRUCTURE_EXECUTED'];
  const targetDate=typeof executionParameters.targetDate==='string'?executionParameters.targetDate.trim():'';
  if(targetDate){
    if(!canonicalInput.timezone?.iana||!canonicalInput.timezone?.utcOffsetAtBirth){reasons.push('NUM_CYCLE_TIMEZONE_CONTEXT_REQUIRED');deferredStages.push('NUM_CYCLE');}
    else {
      const cycleRuntime=createNumCycleRuntime();
      const cycle=await cycleRuntime.calculate({calculationId:`${requestId}:NUM-W3`,runtimeCode:NUM_CYCLE_RUNTIME_CODE,executionMode:'validation',targetDate,timezonePolicyCode:'MCD4_CANONICAL_BIRTH_TIMEZONE_CONTEXT',inputRecords:[birthRecord]});
      coreResults.push(cycle); executedStages.push('NUM_CYCLE'); reasons.push('NUM_CYCLE_EXECUTED');
    }
  }else{reasons.push('NUM_CYCLE_DEFERRED_TARGET_DATE_NOT_SUPPLIED');deferredStages.push('NUM_CYCLE');}
  return Object.freeze({coreExecutionPerformed:true,coreHistoricalExecutionMode:'validation',executedStages:Object.freeze(executedStages),deferredStages:Object.freeze(deferredStages),reasonCodes:Object.freeze(reasons),coreResults:Object.freeze(coreResults)});
}
