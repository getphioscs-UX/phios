/** PHI OS Tarot FULL_PRODUCTION presentation wrapper. Frozen v1 calculation/IR behavior remains unchanged. */
import {executeTarotProductRuntime as executeV1,TAROT_PRODUCTION_RUNTIME_VERSION as BASE_VERSION} from './tarot-product-runtime-v1.js';
export const TAROT_PRODUCTION_RUNTIME_VERSION='1.0.1';
export async function executeTarotProductRuntime(request={},authorities={}){
  const result=await executeV1(request,authorities); const publicView=structuredClone(result.publicView);
  publicView.production={...publicView.production,state:'FULL_PRODUCTION',runAllowed:true,fullProduction:true,limitedProductionActivated:false,productionCapabilityPromoted:true};
  return Object.freeze({...result,runtimeVersion:TAROT_PRODUCTION_RUNTIME_VERSION,publicView:Object.freeze(publicView),production:Object.freeze({...result.production,state:'FULL_PRODUCTION',runAllowed:true,fullProduction:true,limitedProductionActivated:false,authorityScope:'RELEASE',baseRuntimeVersion:BASE_VERSION})});
}
