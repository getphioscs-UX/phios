import {getMcd1MpaSuccessorDecision} from '../method-production-activation/mcd1-production-authority-successor-runtime.js';
import {validateMethodAdapterRegistration} from './adapter-registry-runtime.js';
import {validateCanonicalBirthInput,evaluateMethodInputReadiness} from './canonical-birth-input-runtime.js';
import {executeNumMcd4} from './executors/num-executor.js';
import {executeAstProductionMcd4} from './executors/ast-production-executor.js';
import {executeBzrProductionMcd4} from './executors/bzr-production-executor.js';
export const MCD4_EXECUTION_RESULT_SCHEMA_VERSION='PHI-OS-MCD-METHOD-EXECUTION-RESULT-v1.0.0';
export const MCD4_CURRENT_EXECUTION_SUCCESSOR_VERSION='1.0.0';
function uniq(xs){return Object.freeze([...new Set(xs.filter(Boolean))])}
export function evaluateMpaForMcd4(request){return getMcd1MpaSuccessorDecision(request.methodCode,request.methodVersion,request.capability)}
export async function executeMcd4CurrentRequest(request,{astronomyModuleLoader}={}){
  const decision=evaluateMpaForMcd4(request);
  if(!decision||decision.decision!=='ELIGIBLE'||decision.dispatchAllowed!==true){
    return Object.freeze({schemaVersion:MCD4_EXECUTION_RESULT_SCHEMA_VERSION,requestId:request.requestId||null,methodCode:request.methodCode||null,pluginCode:decision?.pluginCode||null,methodVersion:request.methodVersion||null,capability:request.capability||null,executionStatus:'BLOCKED_BY_MPA',mpaEvaluation:decision||null,inputEvaluation:null,partialExecution:null,reasonCodes:uniq([...(decision?.blockingReasons||[]),'MPA_PRODUCTION_EXECUTION_BLOCKED']),governance:Object.freeze({mpaEvaluatedBeforeInput:true,coreInvoked:false,hdrFailClosed:decision?.pluginCode==='HDR',canonicalProjectionCreated:false,interpretationCreated:false,professionalJudgmentCreated:false})});
  }
  const adapter=validateMethodAdapterRegistration(request.methodCode,request.methodVersion);
  const inputCheck=validateCanonicalBirthInput(request.canonicalInput);
  if(!inputCheck.valid){
    return Object.freeze({schemaVersion:MCD4_EXECUTION_RESULT_SCHEMA_VERSION,requestId:request.requestId,methodCode:request.methodCode,pluginCode:decision.pluginCode,methodVersion:request.methodVersion,capability:request.capability,executionStatus:'INPUT_BLOCKED',mpaEvaluation:decision,inputEvaluation:Object.freeze({state:'BLOCKED',canonicalInputValid:false,missingFields:Object.freeze([]),reasonCodes:inputCheck.reasonCodes}),partialExecution:null,reasonCodes:uniq(['MPA_ELIGIBLE',...inputCheck.reasonCodes]),governance:Object.freeze({mpaEvaluatedBeforeInput:true,coreInvoked:false,hdrFailClosed:false,canonicalProjectionCreated:false,interpretationCreated:false,professionalJudgmentCreated:false})});
  }
  const readiness=evaluateMethodInputReadiness(request.methodCode,request.canonicalInput,request.executionParameters||{});
  if(readiness.state==='BLOCKED'){
    return Object.freeze({schemaVersion:MCD4_EXECUTION_RESULT_SCHEMA_VERSION,requestId:request.requestId,methodCode:request.methodCode,pluginCode:decision.pluginCode,methodVersion:request.methodVersion,capability:request.capability,executionStatus:'INPUT_BLOCKED',mpaEvaluation:decision,inputEvaluation:Object.freeze({state:readiness.state,canonicalInputValid:true,missingFields:readiness.missingFields,reasonCodes:readiness.reasonCodes}),partialExecution:null,reasonCodes:uniq(['MPA_ELIGIBLE','CANONICAL_INPUT_VALID',...readiness.reasonCodes,...readiness.missingFields.map(x=>`MISSING_${x.replaceAll('.','_').toUpperCase()}`)]),governance:Object.freeze({mpaEvaluatedBeforeInput:true,coreInvoked:false,hdrFailClosed:false,canonicalProjectionCreated:false,interpretationCreated:false,professionalJudgmentCreated:false})});
  }
  let execution;
  if(decision.pluginCode==='NUM') execution=await executeNumMcd4({requestId:request.requestId,canonicalInput:request.canonicalInput,executionParameters:request.executionParameters||{}});
  else if(decision.pluginCode==='AST') execution=await executeAstProductionMcd4({requestId:request.requestId,canonicalInput:request.canonicalInput,executionParameters:request.executionParameters||{}},{astronomyModuleLoader});
  else if(decision.pluginCode==='BZR') execution=await executeBzrProductionMcd4({requestId:request.requestId,canonicalInput:request.canonicalInput,executionParameters:request.executionParameters||{}},{astronomyModuleLoader});
  else throw Object.assign(new Error('MCD4_EXECUTOR_NOT_REGISTERED'),{code:'MCD4_EXECUTOR_NOT_REGISTERED'});
  const projectionDeferred=request.capability==='PROJECTION';
  const partial=projectionDeferred||execution.deferredStages.length>0||!execution.coreExecutionPerformed;
  const reasonCodes=uniq(['MPA_ELIGIBLE','CANONICAL_INPUT_VALID',`ADAPTER_${adapter.pluginCode}_REGISTERED`,...readiness.reasonCodes,...execution.reasonCodes,projectionDeferred?'CANONICAL_PROJECTION_DEFERRED_TO_MCD5':null]);
  return Object.freeze({schemaVersion:MCD4_EXECUTION_RESULT_SCHEMA_VERSION,requestId:request.requestId,methodCode:request.methodCode,pluginCode:decision.pluginCode,methodVersion:request.methodVersion,capability:request.capability,executionStatus:partial?'PARTIAL_EXECUTION':'EXECUTED_BOUND_SCOPE',mpaEvaluation:decision,inputEvaluation:Object.freeze({state:readiness.state,canonicalInputValid:true,missingFields:readiness.missingFields,reasonCodes:readiness.reasonCodes}),partialExecution:Object.freeze({performed:true,coreExecutionPerformed:execution.coreExecutionPerformed,coreHistoricalExecutionMode:execution.coreHistoricalExecutionMode,executedStages:execution.executedStages,deferredStages:execution.deferredStages,coreResults:execution.coreResults}),reasonCodes,governance:Object.freeze({mpaEvaluatedBeforeInput:true,mpaEligibleBeforeExecution:true,coreHistoricalValidationModePreserved:true,mcdProductionUseAuthorized:true,currentPhysicalAdapterSuccessor:true,canonicalProjectionCreated:false,interpretationCreated:false,professionalJudgmentCreated:false,hdrFailClosed:false})});
}
export function toMcd4ApiProjection(result){
  if(!result?.partialExecution) return result;
  const {coreResults,...safePartial}=result.partialExecution;
  const coreResultRefs=(coreResults||[]).map(x=>Object.freeze({calculationId:x.calculationId,runtimeCode:x.runtimeCode,algorithmCode:x.algorithmCode,algorithmVersion:x.algorithmVersion,outputDigest:x.outputDigest}));
  return Object.freeze({...result,partialExecution:Object.freeze({...safePartial,coreResultRefs:Object.freeze(coreResultRefs),coreResultsSuppressedUntilMcd5:true})});
}
