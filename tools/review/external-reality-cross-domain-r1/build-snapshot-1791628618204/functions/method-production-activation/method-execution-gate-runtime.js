import { getMethodProductionEligibility, isMethodProductionEligible, MethodProductionEligibilityError } from './production-eligibility-runtime.js';

export async function executeMethodWithProductionGate(request, dispatch) {
  if (!request || typeof request !== 'object') throw new TypeError('METHOD_EXECUTION_REQUEST_REQUIRED');
  if (typeof dispatch !== 'function') throw new TypeError('METHOD_RUNTIME_DISPATCH_REQUIRED');
  const eligible = isMethodProductionEligible(request.methodCode, request.methodVersion, request.capability);
  const decision = getMethodProductionEligibility(request.methodCode, request.methodVersion, request.capability);
  if (!eligible) throw new MethodProductionEligibilityError(decision);
  return dispatch(Object.freeze({...request}), decision);
}

