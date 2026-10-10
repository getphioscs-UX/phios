/** Runtime projection of the frozen MPA-owned MCD-1 authority successor. MCD-2 may consume it but cannot grant authority. */
export const MPA_MCD1_SUCCESSOR_RUNTIME_VERSION = '1.0.0';

const METHODS = Object.freeze([
  Object.freeze({methodCode:'ASTROLOGY',pluginCode:'AST',methodVersion:'0.1.0',state:'PRODUCTION_AUTHORITY_GRANTED_FOR_BOUND_SCOPE',productionEligible:true,dispatchAllowed:true,dispatchableCapabilities:Object.freeze(['CALCULATION','PROJECTION'])}),
  Object.freeze({methodCode:'BAZI',pluginCode:'BZR',methodVersion:'0.1.0',state:'PRODUCTION_AUTHORITY_GRANTED_FOR_BOUND_SCOPE',productionEligible:true,dispatchAllowed:true,dispatchableCapabilities:Object.freeze(['CALCULATION','PROJECTION'])}),
  Object.freeze({methodCode:'NUMEROLOGY',pluginCode:'NUM',methodVersion:'0.1.0-candidate',state:'PRODUCTION_AUTHORITY_GRANTED_FOR_BOUND_SCOPE',productionEligible:true,dispatchAllowed:true,dispatchableCapabilities:Object.freeze(['CALCULATION','PROJECTION'])}),
  Object.freeze({methodCode:'HUMAN_DESIGN',pluginCode:'HDR',methodVersion:'1.0.0',state:'BLOCKED',productionEligible:false,dispatchAllowed:false,dispatchableCapabilities:Object.freeze([]),executionMode:'validation_only'})
]);

function clean(value){return typeof value==='string'?value.trim():'';}
export function getMcd1MpaSuccessorMethod(methodCode, methodVersion){
  const code=clean(methodCode), version=clean(methodVersion);
  return METHODS.find(item=>item.methodCode===code && item.methodVersion===version) || null;
}
export function getMcd1MpaSuccessorDecision(methodCode, methodVersion, capability){
  const method=getMcd1MpaSuccessorMethod(methodCode,methodVersion);
  const cap=clean(capability).toUpperCase();
  if(!method) return null;
  const allowed=method.productionEligible===true && method.dispatchAllowed===true && method.dispatchableCapabilities.includes(cap);
  return Object.freeze({
    authorityOwner:'MPA', authoritySource:'MPA_MCD_1_PRODUCTION_AUTHORITY_SUCCESSOR',
    methodCode:method.methodCode, pluginCode:method.pluginCode, methodVersion:method.methodVersion,
    capability:cap, state:method.state, decision:allowed?'ELIGIBLE':'BLOCKED',
    productionEligible:method.productionEligible, dispatchAllowed:allowed,
    blockingReasons:Object.freeze(allowed?[]:(method.pluginCode==='HDR'
      ? ['HDR_RESTRICTED_BOUNDARY_BLOCKED','PRODUCTION_INVOCATION_FORBIDDEN']
      : ['CAPABILITY_NOT_DISPATCHABLE_BY_MPA_SUCCESSOR']))
  });
}
export function isMcd1MpaSuccessorEligible(methodCode, methodVersion, capability){
  return getMcd1MpaSuccessorDecision(methodCode,methodVersion,capability)?.decision==='ELIGIBLE';
}
export const MPA_MCD1_SUCCESSOR_METHODS = METHODS;
