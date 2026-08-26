/**
 * ICHI-DEPTH-W11 — I Ching product composition successor.
 * Frozen structural/source v1 product Runtime remains untouched. This successor
 * adds only the admitted human-approved depth supplement.
 */
import {executeIChingProductRuntime as executeV1,buildIChingProductEvidence} from './iching-product-runtime-v1.js';
import {selectIChingDepthInterpretation,composeIChingDepthReadingSupplement} from '../interpretation-runtime/iching-depth-editorial-runtime-v2.js';
import {createIChingProductPublicViewModel} from '../symbolic-method-public-ux/iching-product-view-model-v2.js';

export const ICHING_PRODUCT_RUNTIME_CODE='ICHING_SYMBOLIC_REFLECTIVE_PRODUCT_RUNTIME';
export const ICHING_PRODUCT_RUNTIME_VERSION='2.0.0';
const LOCALES=new Set(['en','zh-Hans']);
const locale=value=>LOCALES.has(value)?value:'en';
function requireDepth(authorities){
  const corpus=authorities?.depthCorpus;
  if(corpus?.schemaVersion!=='PHI-OS-ICHI-DEPTH-ADMITTED-EDITORIAL-CORPUS-v2.0.0'||corpus?.coverage?.total!=='448/448'||corpus?.humanEditorialComplete!==true) throw new TypeError('ICHING_PRODUCT_HUMAN_APPROVED_DEPTH_448_REQUIRED');
  return corpus;
}

export async function executeIChingProductRuntime(request={},authorities={}){
  const depthCorpus=requireDepth(authorities);
  const base=await executeV1(request,authorities);
  const readingIr=base.readingIr;
  const selected=selectIChingDepthInterpretation({
    hexagramId:readingIr.structuralProjection.primary.hexagramId,
    changingLines:readingIr.structuralProjection.changingLines,
    locale:locale(request.locale),
    admittedCorpus:depthCorpus
  });
  const depthSupplement=composeIChingDepthReadingSupplement({readingIr,selection:selected});
  if(depthSupplement.status!=='AVAILABLE') throw new TypeError('ICHING_PRODUCT_DEPTH_CONTROLLED_UNAVAILABLE');
  const publicView=createIChingProductPublicViewModel(readingIr,authorities,depthSupplement);
  return Object.freeze({...base,
    runtimeVersion:ICHING_PRODUCT_RUNTIME_VERSION,depthSupplement,publicView,
    execution:Object.freeze({...structuredClone(base.execution),humanApprovedDepthOnly:true,candidateFallbackUsed:false,runtimeModelDepthGenerationUsed:false}),
    production:Object.freeze({...structuredClone(base.production),humanDepthEditorialReady:true,depthCoverage:'448/448',productionEligible:false,limitedProductionActivated:false})
  });
}
export {buildIChingProductEvidence};
