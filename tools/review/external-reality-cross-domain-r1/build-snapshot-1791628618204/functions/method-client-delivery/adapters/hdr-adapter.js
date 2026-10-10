import {createHdrAstronomyRuntime,HDR_ASTRONOMY_RUNTIME_CODE} from '../../core-method-runtime/hdr-astronomy-runtime.js';
import {createHdrDesignMomentRuntime,HDR_DESIGN_MOMENT_RUNTIME_CODE} from '../../core-method-runtime/hdr-design-moment-runtime.js';
import {createHdrGateRuntime,HDR_GATE_RUNTIME_CODE} from '../../core-method-runtime/hdr-gate-runtime.js';
import {createHdrBodyGraphRuntime,HDR_BODYGRAPH_RUNTIME_CODE} from '../../core-method-runtime/hdr-bodygraph-runtime.js';
import {createHdrProjectionRuntime,HDR_PROJECTION_RUNTIME_CODE} from '../../core-method-runtime/hdr-projection-runtime.js';
export const HDR_MCD_ADAPTER_CODE='MCD_HDR_ADAPTER';
export function probeHdrAdapterRegistration(){
  const factories=[createHdrAstronomyRuntime,createHdrDesignMomentRuntime,createHdrGateRuntime,createHdrBodyGraphRuntime,createHdrProjectionRuntime];
  if(factories.some(x=>typeof x!=='function')) throw new Error('HDR_CORE_RUNTIME_FACTORY_BINDING_INVALID');
  return Object.freeze({adapterCode:HDR_MCD_ADAPTER_CODE,methodCode:'HUMAN_DESIGN',pluginCode:'HDR',registrationStatus:'REGISTERED_VALIDATION_ONLY',
    coreRuntimeCodes:Object.freeze([HDR_ASTRONOMY_RUNTIME_CODE,HDR_DESIGN_MOMENT_RUNTIME_CODE,HDR_GATE_RUNTIME_CODE,HDR_BODYGRAPH_RUNTIME_CODE,HDR_PROJECTION_RUNTIME_CODE]),
    coreFactoriesBound:true,validationRegistrationAllowed:true,productionInvocationAllowed:false,customerResultAllowed:false});
}
export async function dispatchHdrAdapter(){
  probeHdrAdapterRegistration();
  throw Object.assign(new Error('MCD_HDR_PRODUCTION_INVOCATION_FORBIDDEN'),{code:'MCD_HDR_PRODUCTION_INVOCATION_FORBIDDEN'});
}
