/** ICHI-DEPTH-W11 — publication projection successor for human-approved depth. */
import {createIChingProductPublicViewModel as createV1} from './iching-product-view-model-v1.js';

export const ICHING_PRODUCT_VIEW_MODEL_VERSION='2.0.0';
const clone=value=>structuredClone(value);
const arr=value=>Array.isArray(value)?value:[];
const INTERNAL_REVIEW_WARNINGS=[
  '候选解释尚未完成人工来源与双语审核，不得进入公共客户输出。',
  '候选逐爻解释尚未完成人工来源与双语审核，不得进入公共客户输出。',
  'This candidate has not completed human source and bilingual review and cannot enter public customer output.',
  'This line candidate has not completed human source and bilingual review and cannot enter public customer output.'
];
const internalWarning=value=>INTERNAL_REVIEW_WARNINGS.includes(String(value||'').trim());
function publishedContent(content={}){
  const copy=clone(content);
  if(Array.isArray(copy.misreadingWarnings)) copy.misreadingWarnings=copy.misreadingWarnings.filter(item=>!internalWarning(item));
  return Object.freeze(copy);
}
function projectUnit(unit){
  if(!unit) return null;
  return Object.freeze({
    interpretationId:unit.interpretationId,coordinate:unit.coordinate,scope:unit.scope,...(unit.linePosition?{linePosition:unit.linePosition}:{}),
    content:publishedContent(unit.content),provenance:clone(unit.provenance),humanApproved:true
  });
}
function depthProjection(supplement){
  if(!supplement) return Object.freeze({status:'NOT_BOUND',locale:null,hexagram:null,lines:Object.freeze([]),controlledUnavailable:null});
  if(supplement.status!=='AVAILABLE') return Object.freeze({status:supplement.status,locale:supplement.locale||null,hexagram:null,lines:Object.freeze([]),controlledUnavailable:clone(supplement.controlledUnavailable||null)});
  return Object.freeze({
    status:'AVAILABLE',locale:supplement.locale,hexagram:projectUnit(supplement.depth?.hexagram),lines:Object.freeze(arr(supplement.depth?.lines).map(projectUnit)),controlledUnavailable:null,
    publicationProjection:Object.freeze({internalCandidateReviewStatusWarningOmitted:true,substantiveBoundaryWarningsPreserved:true,newMeaningCreated:false})
  });
}

export function createIChingProductPublicViewModel(readingIr={},authorities={},depthSupplement=null){
  const base=createV1(readingIr,authorities);
  const depth=depthProjection(depthSupplement);
  const hierarchy=Object.freeze(base.hierarchy.map(layer=>layer.id==='SYMBOLIC_INTERPRETATION'
    ?Object.freeze({...layer,data:Object.freeze({...clone(layer.data),depthInterpretation:depth})})
    :layer));
  return Object.freeze({...base,
    schemaVersion:'PHI-OS-ICHING-PRODUCT-PUBLIC-VIEW-MODEL-v2.0.0',viewModelVersion:ICHING_PRODUCT_VIEW_MODEL_VERSION,hierarchy,
    ichingSurface:Object.freeze({...clone(base.ichingSurface),depthEditorial:Object.freeze({status:depth.status,locale:depth.locale,humanApproved:depth.status==='AVAILABLE'})}),
    production:Object.freeze({...clone(base.production),humanApprovedDepthBound:depth.status==='AVAILABLE',runAllowed:false,productionCapabilityPromoted:false})
  });
}
