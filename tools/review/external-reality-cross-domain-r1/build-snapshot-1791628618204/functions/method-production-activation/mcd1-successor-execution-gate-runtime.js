import {MethodProductionEligibilityError} from './production-eligibility-runtime.js';
import {getMcd1MpaSuccessorDecision} from './mcd1-production-authority-successor-runtime.js';

/**
 * Versioned MPA successor execution gate consumed by MCD-2.
 * It projects the already-granted MPA MCD-1 successor; it does not mutate W26/W27.
 */
export async function executeMethodWithProductionGate(request,dispatch){
  if(!request||typeof request!=='object') throw new TypeError('METHOD_EXECUTION_REQUEST_REQUIRED');
  if(typeof dispatch!=='function') throw new TypeError('METHOD_RUNTIME_DISPATCH_REQUIRED');
  const decision=getMcd1MpaSuccessorDecision(request.methodCode,request.methodVersion,request.capability);
  if(!decision||decision.decision!=='ELIGIBLE'||decision.dispatchAllowed!==true) throw new MethodProductionEligibilityError(decision);
  return dispatch(Object.freeze({...request}),decision);
}
