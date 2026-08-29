import {buildZiWeiCalculationIR} from '../zi-wei-runtime/zi-wei-calculation-ir-runtime.js';
import {projectZiWeiCalculationIR} from '../zi-wei-runtime/zi-wei-canonical-projection-runtime.js';
import {loadZiWeiPolicy} from '../zi-wei-runtime/policy-gate.js';
import {sha256Stable} from '../zi-wei-runtime/zwr-utils.js';

const VERSION=Object.freeze({
  methodRegistryVersion:'METHOD_REGISTRY_V3',
  runtimeVersion:'ZWR-1.0.0',
  adapterVersion:'MCD-ZWR-1.0.0',
  inputContractVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0',
  projectionContractVersion:'ZWR-MCD-CANONICAL-PROJECTION-v1.0.0'
});
const LABELS=Object.freeze({en:'Zi Wei Structural Projection','zh-Hans':'紫微结构投射'});
const palaceByBranch=palaces=>new Map((palaces||[]).map(x=>[x.branch,x]));
function freeze(v){if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v;}
function assertRequest(request,decision){
  if(decision?.authorityOwner!=='MPA'||decision?.decision!=='ELIGIBLE'||decision?.dispatchAllowed!==true)throw Object.assign(new Error('ZWR_MCD_REQUIRES_MPA_ELIGIBLE_DECISION'),{code:'ZWR_MCD_REQUIRES_MPA_ELIGIBLE_DECISION'});
  if(request?.canonicalInput?.timeAccuracy!=='EXACT'||!request?.canonicalInput?.birthDate||!request?.canonicalInput?.birthTime||!request?.canonicalInput?.timezone?.iana||!request?.canonicalInput?.timezone?.utcOffsetAtBirth)throw Object.assign(new Error('ZWR_CANONICAL_INPUT_EXACT_TIME_TIMEZONE_REQUIRED'),{code:'ZWR_CANONICAL_INPUT_EXACT_TIME_TIMEZONE_REQUIRED'});
}
function structures(ir){
  const by=palaceByBranch(ir.palaceStructure.palaces);
  const palaces=ir.palaceStructure.palaces.map(x=>({code:x.palaceCode,value:x.branch,rawValue:null,meta:{stem:x.stem,isBodyPalace:x.isBodyPalace===true,isLifePalace:x.palaceCode==='LIFE'}}));
  const stars=[...ir.mainStars.stars,...ir.supportStars.stars].map(x=>({code:x.starCode,value:x.branch,rawValue:null,meta:{palaceCode:by.get(x.branch)?.palaceCode||null,starClass:ir.mainStars.stars.some(s=>s.starCode===x.starCode)?'MAIN':'SUPPORT',group:x.group||null,basis:x.basis||null}}));
  const trans=ir.transformations.transformations.map(x=>({code:x.transformationCode,value:x.targetStarCode,rawValue:null,meta:{targetStarCode:x.targetStarCode,branch:x.branch,palaceCode:by.get(x.branch)?.palaceCode||null,scope:x.scope,schoolLabel:x.schoolLabel}}));
  return Object.freeze([{code:'ZI_WEI_PALACES',items:Object.freeze(palaces)},{code:'ZI_WEI_STARS',items:Object.freeze(stars)},{code:'ZI_WEI_TRANSFORMATIONS',items:Object.freeze(trans)}].map(freeze));
}
function buildProjectionFromSourceIr({request,decision,policy,ir}){
  const internal=projectZiWeiCalculationIR(ir,{executionMode:'INTERNAL_VALIDATION'});
  const calc=Object.freeze({
    status:'COMPLETE',deterministic:true,
    values:Object.freeze([
      {code:'FIVE_ELEMENT_BUREAU',value:ir.palaceStructure.fiveElementBureau.code,rawValue:null,certainty:'DETERMINISTIC'},
      {code:'LIFE_PALACE',value:ir.palaceStructure.lifePalace.branch,rawValue:null,certainty:'DETERMINISTIC'},
      {code:'BODY_PALACE',value:ir.palaceStructure.bodyPalace.branch,rawValue:null,certainty:'DETERMINISTIC'}
    ]),
    coordinates:null,structures:structures(ir),cycles:Object.freeze([]),positions:Object.freeze([])
  });
  const method=Object.freeze({
    publicMethodCode:'ZI_WEI_PROJECTION',
    publicLabel:LABELS[request.canonicalInput.locale]||LABELS.en,
    publicLabels:LABELS,
    internalReference:Object.freeze({opaqueId:`ZWR-${ir.calculationDigest.slice(0,20)}`,protected:true,rawIdentityExposed:false}),
    version:'1.0.0',status:'PRODUCTION_BOUND_SCOPE',calculationMode:'NATAL_STRUCTURAL_V1'
  });
  const projection=Object.freeze({contract:'CANONICAL_METHOD_PROJECTION',status:'COMPLETE',clientRenderable:true,productionResult:true,coreSchemaExposed:false,unknownDisclosureRequired:false});
  const evidence=Object.freeze([
    {type:'RULE_SOURCE',status:'AVAILABLE',sourceCode:'ZI_WEI_CALCULATION_POLICY',reference:'content/professional/core-method-runtime/zi-wei-calculation-policy-v1.json',version:policy.authorityVersion,confidence:'HIGH'},
    {type:'CALCULATION_AUTHORITY',status:'AVAILABLE',sourceCode:'ZWR_W7_W13',reference:ir.calculationDigest,version:'0.1.0-candidate',confidence:'HIGH'},
    {type:'PRODUCTION_DISPATCH_AUTHORITY',status:'AVAILABLE',sourceCode:'MPA_ZWR',reference:decision.decision,version:'1.0.0',confidence:'HIGH'}
  ]);
  const base={
    schemaVersion:'PHI-OS-CANONICAL-METHOD-PROJECTION-v1.0.0',
    method,calculation:calc,projection,unknown:Object.freeze([]),evidence,version:VERSION,
    execution:Object.freeze({requestId:request.requestId,status:'EXECUTED_BOUND_SCOPE',mpaDecision:decision,runtimeIdentity:'ZI_WEI_RUNTIME',executedAt:new Date().toISOString()}),
    interpretation:Object.freeze({included:false,principle:'CALCULATION_NOT_EQUAL_INTERPRETATION',meaningAuthorityCreated:false,realityReadingCreated:false,professionalJudgmentCreated:false}),
    zwrLineage:Object.freeze({internalProjectionId:internal.projectionId,sourceCalculationDigest:ir.calculationDigest,scopeCode:ir.scopeCode,policyVersion:ir.policy.authorityVersion})
  };
  const projectionId=`ZWRP-${sha256Stable({method:method.publicMethodCode,calculation:calc,zwrLineage:base.zwrLineage,version:VERSION}).slice(0,24)}`;
  return freeze({schemaVersion:base.schemaVersion,projectionId,...base});
}

/**
 * Trusted production entry for callers that must continue from the exact same
 * calculation IR used to create the canonical projection. The calculation IR
 * is built once, projected once, and returned only to trusted internal callers.
 */
export async function executeAndProjectZwrProductionWithSource(request,decision){
  assertRequest(request,decision);
  const policy=loadZiWeiPolicy();
  const sourceCalculationIR=buildZiWeiCalculationIR(request.canonicalInput,{policy,executionMode:'INTERNAL_VALIDATION'});
  const canonicalProjection=buildProjectionFromSourceIr({request,decision,policy,ir:sourceCalculationIR});
  if(canonicalProjection.zwrLineage.sourceCalculationDigest!==sourceCalculationIR.calculationDigest)throw Object.assign(new Error('ZWR_SOURCE_IR_PROJECTION_LINEAGE_MISMATCH'),{code:'ZWR_SOURCE_IR_PROJECTION_LINEAGE_MISMATCH'});
  return freeze({canonicalProjection,sourceCalculationIR,reuse:Object.freeze({sourceCalculationBuiltOnce:true,canonicalProjectionConsumesSameSourceCalculationIR:true,secondNatalCalculationPerformed:false})});
}

export async function executeAndProjectZwrProduction(request,decision){
  const result=await executeAndProjectZwrProductionWithSource(request,decision);
  return result.canonicalProjection;
}
