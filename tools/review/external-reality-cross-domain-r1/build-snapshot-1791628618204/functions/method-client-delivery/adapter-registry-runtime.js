import {probeAstAdapterBinding,dispatchAstAdapter} from './adapters/ast-adapter.js';
import {probeBzrAdapterBinding,dispatchBzrAdapter} from './adapters/bzr-adapter.js';
import {probeNumAdapterBinding,dispatchNumAdapter} from './adapters/num-adapter.js';
import {probeHdrAdapterRegistration,dispatchHdrAdapter} from './adapters/hdr-adapter.js';

const ADAPTERS=Object.freeze([
  Object.freeze({methodCode:'ASTROLOGY',pluginCode:'AST',methodVersion:'0.1.0',probe:probeAstAdapterBinding,dispatch:dispatchAstAdapter,productionBinding:true,validationOnly:false}),
  Object.freeze({methodCode:'BAZI',pluginCode:'BZR',methodVersion:'0.1.0',probe:probeBzrAdapterBinding,dispatch:dispatchBzrAdapter,productionBinding:true,validationOnly:false}),
  Object.freeze({methodCode:'NUMEROLOGY',pluginCode:'NUM',methodVersion:'0.1.0-candidate',probe:probeNumAdapterBinding,dispatch:dispatchNumAdapter,productionBinding:true,validationOnly:false}),
  Object.freeze({methodCode:'HUMAN_DESIGN',pluginCode:'HDR',methodVersion:'1.0.0',probe:probeHdrAdapterRegistration,dispatch:dispatchHdrAdapter,productionBinding:false,validationOnly:true})
]);
function clean(v){return typeof v==='string'?v.trim():'';}
export function resolveCanonicalMethodAdapter(methodCode,methodVersion){
  const code=clean(methodCode),version=clean(methodVersion);
  return ADAPTERS.find(x=>x.methodCode===code && x.methodVersion===version) || null;
}
export function validateMethodAdapterRegistration(methodCode,methodVersion){
  const adapter=resolveCanonicalMethodAdapter(methodCode,methodVersion);
  if(!adapter) throw Object.assign(new Error('METHOD_RUNTIME_ADAPTER_NOT_REGISTERED'),{code:'METHOD_RUNTIME_ADAPTER_NOT_REGISTERED'});
  return adapter.probe();
}
export async function dispatchMethodThroughCanonicalAdapter(request,decision){
  const adapter=resolveCanonicalMethodAdapter(request?.methodCode,request?.methodVersion);
  if(!adapter) throw Object.assign(new Error('METHOD_RUNTIME_ADAPTER_NOT_REGISTERED'),{code:'METHOD_RUNTIME_ADAPTER_NOT_REGISTERED'});
  if(decision?.authorityOwner!=='MPA' || decision?.decision!=='ELIGIBLE' || decision?.dispatchAllowed!==true){
    throw Object.assign(new Error('MCD_ADAPTER_REQUIRES_MPA_ELIGIBLE_DECISION'),{code:'MCD_ADAPTER_REQUIRES_MPA_ELIGIBLE_DECISION'});
  }
  if(adapter.validationOnly || adapter.productionBinding!==true){
    throw Object.assign(new Error('MCD_HDR_PRODUCTION_INVOCATION_FORBIDDEN'),{code:'MCD_HDR_PRODUCTION_INVOCATION_FORBIDDEN'});
  }
  return adapter.dispatch(Object.freeze({...request}),decision);
}
export const CANONICAL_METHOD_ADAPTERS=ADAPTERS;
