export const HDR_PROJECTION_CONTRACT_STATUS='VALIDATION_ONLY_NOT_CLIENT_DISPATCHABLE';
const LABELS=Object.freeze({en:'Personal Runtime Projection','zh-Hans':'个人运行投射'});
const RESTRICTED_KEYS=new Set(['activations','channels','definedCenters','undefinedCenters','definitionCode','typeCode','humanDesignAuthorityCode','profile','bodyGraph']);
const RESTRICTED_PUBLIC_TERMS=['Human Design','人类图','HUMAN_DESIGN','HDR'];
function assertNoRawInternal(value,path='$'){
  if(!value||typeof value!=='object')return;
  for(const [key,child] of Object.entries(value)){if(RESTRICTED_KEYS.has(key))throw Object.assign(new Error(`HDR_RAW_INTERNAL_PROJECTION_FORBIDDEN:${path}.${key}`),{code:'HDR_RAW_INTERNAL_PROJECTION_FORBIDDEN'});assertNoRawInternal(child,`${path}.${key}`)}
}
export function validateHdrCanonicalNormalizationCandidate(candidate){
  assertNoRawInternal(candidate);
  if(candidate?.publicMethodCode!=='PERSONAL_RUNTIME_PROJECTION')throw Object.assign(new Error('HDR_PUBLIC_METHOD_CODE_INVALID'),{code:'HDR_PUBLIC_METHOD_CODE_INVALID'});
  const publicText=JSON.stringify({publicMethodCode:candidate.publicMethodCode,publicLabels:candidate.publicLabels});
  for(const term of RESTRICTED_PUBLIC_TERMS)if(publicText.includes(term))throw Object.assign(new Error('HDR_RESTRICTED_VOCABULARY_FORBIDDEN'),{code:'HDR_RESTRICTED_VOCABULARY_FORBIDDEN'});
  return Object.freeze({status:HDR_PROJECTION_CONTRACT_STATUS,publicMethodCode:'PERSONAL_RUNTIME_PROJECTION',publicLabels:LABELS,rawInternalSchemaAccepted:false,restrictedVocabularySuppressed:true,productionDispatchAllowed:false,productionCustomerResultAllowed:false});
}
export function assertHdrProductionProjectionForbidden(){throw Object.assign(new Error('MCD_HDR_PRODUCTION_CLIENT_PROJECTION_FORBIDDEN'),{code:'MCD_HDR_PRODUCTION_CLIENT_PROJECTION_FORBIDDEN'});}
