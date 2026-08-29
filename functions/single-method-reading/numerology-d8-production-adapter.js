const arr=value=>Array.isArray(value)?value:[];
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))freeze(item)}return value};
function fail(code){const e=new Error(code);e.code=code;throw e}
export function adaptNumIntegratedReadingEnvelope({numerologyEnvelope,locale='en'}={}){
 const n=numerologyEnvelope,ir=n?.integratedReading,chart=n?.chartModel;
 if(n?.methodId!=='NUM'||ir?.customerPublishable!==true||ir?.numD8State!=='NUM_D8_FULL_PRODUCTION_ACTIVE')fail('NUM_CX_W8_D8_ENVELOPE_REQUIRED');
 if(!chart?.priorityNarrative||chart?.readingIA?.presentation!=='CHART_FIRST')fail('NUM_CX_W8_CHART_FIRST_AUTHORITY_REQUIRED');
 return freeze({
  schemaVersion:'PHI-OS-SINGLE-METHOD-READING-PRODUCTION-v2.0.0',state:'PRODUCTION',methodId:'NUM',locale,
  readingAuthorityRef:n.sourceLineage?.meaningBundleCode||'NUM-D8',semanticDigest:n.readingDigest,
  readingIA:chart.readingIA,
  layout:freeze({schemaVersion:'PHI-OS-NUM-CX-SMR-LAYOUT-v1.0.0',presentation:'CHART_FIRST',primarySurface:'/perspectives/personal/',chartSpecVersion:chart.chartSpecVersion,blockOrder:arr(chart.readingIA.blocks).filter(x=>x.available).map(x=>x.blockId)}),
  numChartFirst:freeze({priorityNarrative:chart.priorityNarrative,chartModelRef:chart.schemaVersion,customerReadingRef:ir.schemaVersion}),
  technical:freeze({defaultCollapsed:true,sourceLineage:[n.sourceLineage?.meaningBundleCode,n.sourceLineage?.integratedReadingSchema].filter(Boolean),ruleLineage:['NUM-R18','NUM-D8','NUM-CX-W4-W9'],boundaryFlags:Object.entries(n.boundaries||{}).filter(([,v])=>v===false).map(([k])=>`BOUNDARY:${k}=false`),claimCount:arr(chart.priorityNarrative.items).length,themeCount:arr(chart.priorityNarrative.items).length,eligibleSectionRefs:arr(chart.readingIA.blocks).filter(x=>x.available).map(x=>x.blockId),suppressedDuplicateCount:chart.priorityNarrative.suppressedCount||0}),
  governance:freeze({productionAdmission:'NUM_D8_HUMAN_ADMITTED_PLUS_NUM_CX_W4_W9_PRESENTATION',humanReviewedProductComposition:true,liveCustomerIndividuallyHumanReviewed:false,rawProjectionCreatesCustomerConclusion:false,rendererCreatesMeaning:false,methodRuntimeRecalculated:false,crossMethodCompositionPerformed:false,webMobilePrintConsumeSameIA:true,technicalDefaultCollapsed:true,predecessorGenericNumSmrSuppressedOnPrimarySurface:true})
 })
}
export default Object.freeze({adaptNumIntegratedReadingEnvelope});
