export const RRP_MEANING_ENVELOPE_SCHEMA='PHI-OS-RUNTIME-READING-MEANING-ENVELOPE-v1.0.0';
function fail(code){const e=new Error(code);e.code=code;throw e;}
function freeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const v of Object.values(value))freeze(v)}return value;}
export function consumeCanonicalMeaningForRuntimeReading({bundle,localeProjection}={}){
  if(bundle?.status!=='PRODUCTION'||bundle?.activationState!=='PRODUCTION_ACTIVE')fail('RRP_PRODUCTION_MEANING_BUNDLE_REQUIRED');
  if(localeProjection?.sourceBundleDigest!==bundle.bundleDigest)fail('RRP_MEANING_LOCALE_LINEAGE_MISMATCH');
  const statements=localeProjection.items.map((item,index)=>freeze({statementId:`CMP-${bundle.bundleCode}-${String(index+1).padStart(3,'0')}`,statementType:'CANONICAL_MEANING',semanticCode:item.meaningCode,contentCanonical:item.definition,sourceType:'CANONICAL_MEANING',sourceReferences:[`CMP:${bundle.bundleCode}`,`MCD5:${item.sourceProjectionRef.projectionId}`],meaningReferences:[`CMP:${item.meaningId}@${item.meaningVersion}`],limitationReferences:[],evidenceLevel:'CANONICAL_GOVERNED',confidenceState:'GOVERNED',unknownState:'NONE',mappingReference:item.mappingLineage.mappingCode}));
  return freeze({schemaVersion:RRP_MEANING_ENVELOPE_SCHEMA,sourceBundleCode:bundle.bundleCode,sourceBundleDigest:bundle.bundleDigest,sourceProjectionId:bundle.sourceProjection.projectionId,methodCode:bundle.sourceProjection.methodCode,publicMethodCode:bundle.sourceProjection.publicMethodCode,locale:localeProjection.locale,statements,boundaries:{recalculated:false,meaningInvented:false,interpretationCreated:false,professionalJudgmentCreated:false,navigationCreated:false}});
}
export default Object.freeze({consumeCanonicalMeaningForRuntimeReading});
