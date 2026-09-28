export const REPORT_SECTION_NARRATIVE_CONTRACT_VERSION='PHI-OS-REPORT-SECTION-NARRATIVE-CONTRACT-v1.0.0';
export const REPORT_SECTION_ROLES=Object.freeze(['STRUCTURE','MEANING','CONDITIONS','COUNTERWEIGHTS','OBSERVABLE_EXPRESSION','TIMING_RELEVANCE','NAVIGATION']);
const METHODS=new Set(['BZR','ZWR','AST','NUM','PROFILE','ECR','HD','CROSS']);
const OPTIONAL_TIMING=new Set(['NUM','PROFILE']);
function text(v){return String(v??'').trim();}
function list(v){return Array.isArray(v)?v:[];}
function fail(code,details={}){const e=new Error(code);e.code=code;e.details=details;throw e;}
export function createReportSectionNarrativeContract(input={}){
 const methodId=text(input.methodId).toUpperCase(),sectionKey=text(input.sectionKey);
 if(!METHODS.has(methodId)||!sectionKey)fail('RNT2_SECTION_ID_REQUIRED');
 const required=[...new Set(list(input.requiredClaimRoles).length?input.requiredClaimRoles:['STRUCTURE','MEANING','CONDITIONS','COUNTERWEIGHTS','OBSERVABLE_EXPRESSION','NAVIGATION'])];
 if(required.some(x=>!REPORT_SECTION_ROLES.includes(x)))fail('RNT2_SECTION_ROLE_INVALID',{required});
 const timingPolicy=text(input.timingPolicy)|| (OPTIONAL_TIMING.has(methodId)?'WHEN_AUTHORITY_PRESENT':'WHEN_AUTHORITY_PRESENT');
 const contract={
  schemaVersion:REPORT_SECTION_NARRATIVE_CONTRACT_VERSION,methodId,sectionKey,
  customerQuestion:text(input.customerQuestion),customerOutcome:text(input.customerOutcome),
  requiredClaimRoles:Object.freeze(required),optionalClaimRoles:Object.freeze(list(input.optionalClaimRoles).filter(x=>REPORT_SECTION_ROLES.includes(x))),
  timingPolicy,
  boundaryPolicy:text(input.boundaryPolicy)||'BOUNDARY_REQUIRED_WHEN_CLAIMS_REQUIRE_QUALIFICATION',
  realityBridgePolicy:text(input.realityBridgePolicy)||'OBSERVATION_QUESTIONS_ONLY_UNLESS_REALITY_SOURCE_ADMITTED',
  forbiddenInferenceClasses:Object.freeze([...new Set(list(input.forbiddenInferenceClasses).concat(['NEW_METHOD_FACT','NEW_LIFE_EVENT','GUARANTEED_FUTURE_EVENT','DIAGNOSIS','FINANCIAL_RECOMMENDATION','HIDDEN_STATE_INFERENCE']))]),
  depthTarget:Object.freeze({minimumMeaningfulUnits:Number(input.depthTarget?.minimumMeaningfulUnits||0),maximumMeaningfulUnits:Number(input.depthTarget?.maximumMeaningfulUnits||0),calibrationState:text(input.depthTarget?.calibrationState)||'OWNER_EXEMPLAR_REQUIRED'}),
  governance:Object.freeze({methodTruthOwner:false,rendererMeaningOwner:false,t2MayRecalculate:false,t2MayInventReality:false,humanAcceptanceRequired:true})
 };
 return Object.freeze(contract);
}
export function assertReportSectionNarrativeContract(contract){
 if(contract?.schemaVersion!==REPORT_SECTION_NARRATIVE_CONTRACT_VERSION)fail('RNT2_SECTION_CONTRACT_REQUIRED');
 if(!METHODS.has(contract.methodId)||!contract.sectionKey)fail('RNT2_SECTION_CONTRACT_INVALID');
 return contract;
}
export default Object.freeze({createReportSectionNarrativeContract,assertReportSectionNarrativeContract});
