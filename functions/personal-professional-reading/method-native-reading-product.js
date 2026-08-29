const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const x of Object.values(value))freeze(x)}return value};
const list=value=>Array.isArray(value)?value:[];
export const METHOD_NATIVE_CUSTOMER_READING_SCHEMA='PHI-OS-METHOD-NATIVE-CUSTOMER-READING-v1.0.0';
export const METHOD_NATIVE_PRODUCT_VERSION='PPR-C1-v1.0.0';

export function buildMethodNativeCustomerReading({methodId,productVersion=METHOD_NATIVE_PRODUCT_VERSION,summary,structuralModel=null,readingSections=[],temporalContext={},openVerdicts=[],evidence={},publicationDecision={},governance={}}={}){
 if(!['BZR','NUM','ZWR','AST','ECR'].includes(methodId))throw Object.assign(new Error('PPR_C1_METHOD_NATIVE_METHOD_ID_INVALID'),{code:'PPR_C1_METHOD_NATIVE_METHOD_ID_INVALID'});
 if(!summary||typeof summary!=='object')throw Object.assign(new Error('PPR_C1_METHOD_NATIVE_SUMMARY_REQUIRED'),{code:'PPR_C1_METHOD_NATIVE_SUMMARY_REQUIRED'});
 return freeze({
  schemaVersion:METHOD_NATIVE_CUSTOMER_READING_SCHEMA,
  methodId,productVersion,
  summary:freeze({...summary,keyPoints:list(summary.keyPoints)}),
  structuralModel:freeze(structuralModel),
  readingSections:freeze(list(readingSections)),
  temporalContext:freeze({...temporalContext}),
  openVerdicts:freeze(list(openVerdicts)),
  evidence:freeze({...evidence}),
  publicationDecision:freeze({...publicationDecision}),
  governance:freeze({
   createsSecondInterpretationRuntime:false,
   methodCalculationRebuilt:false,
   rendererCreatesMeaning:false,
   methodNativeSectionsRemainMethodOwned:true,
   publicationDecisionPreserved:true,
   ...governance
  })
 });
}

export default Object.freeze({METHOD_NATIVE_CUSTOMER_READING_SCHEMA,METHOD_NATIVE_PRODUCT_VERSION,buildMethodNativeCustomerReading});
