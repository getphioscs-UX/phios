import {sha256Stable,deepFreeze} from '../interpretation-runtime/mir7-utils.js';
import {validateCanonicalBirthInput} from '../method-client-delivery/canonical-birth-input-runtime.js';
import {calculateEcrSolarAnchor,resolveEcrCoordinateFromSolarLongitude} from './ecr-calculation-runtime.js';
import {ECR_CALCULATION_SPEC_RUNTIME} from './ecr-calculation-spec-runtime.js';
import {validateEcrCanonicalProjection} from './ecr-projection-validator.js';

export const ECR_CANONICAL_PROJECTION_SCHEMA='PHI-OS-CANONICAL-METHOD-PROJECTION-v1.0.0';
export const ECR_PUBLIC_METHOD_CODE='EMBODIED_CONFIGURATION_PROJECTION';
export const ECR_METHOD_VERSION='1.0.0';
const freeze=deepFreeze;
function fail(code){throw Object.assign(new Error(code),{code});}
function item(code,value,meta={}){return freeze({code,value,rawValue:null,meta:freeze(meta)});}
function structure(code,items){return freeze({code,items:freeze(items)});}

export async function buildEcrCanonicalProjectionFromAnchor({canonicalInput,anchor,requestId='ECR-LOCAL'}={}){
  const validation=validateCanonicalBirthInput(canonicalInput);if(!validation.valid)fail(`ECR_CANONICAL_INPUT_INVALID:${validation.reasonCodes.join(',')}`);
  if(canonicalInput.timeAccuracy!=='EXACT')fail('ECR_EXACT_BIRTH_TIME_REQUIRED');
  if(!anchor||!Number.isFinite(anchor.longitude)||!anchor.utcIso)fail('ECR_SOLAR_ANCHOR_REQUIRED');
  const resolved=resolveEcrCoordinateFromSolarLongitude(anchor.longitude);
  const structures=[
    structure('ECR_CONTEXT',[item(resolved.cosmologicalContext.contextId,resolved.cosmologicalContext.zodiacCode,{label:resolved.cosmologicalContext.label,labelZhHans:resolved.cosmologicalContext.labelZhHans})]),
    structure('ECR_GRAMMAR',[item(resolved.grammar.code,resolved.grammar.code,{label:resolved.grammar.label,labelZhHans:resolved.grammar.chineseLabel})]),
    structure('ECR_QUESTION',[item(resolved.question.questionId,resolved.question.questionId,{question:resolved.question.question,questionZhHans:resolved.question.questionZhHans})]),
    structure('ECR_CAPABILITIES',[item(resolved.capability.primary.id,'PRIMARY',{label:resolved.capability.primary.label,labelZhHans:resolved.capability.primary.bookZh||resolved.capability.primary.zh,priority:'PRIMARY'}),...resolved.capability.supporting.map(x=>item(x.id,'SUPPORTING',{label:x.label,labelZhHans:x.bookZh||x.zh,priority:'SUPPORTING'}))]),
    structure('ECR_DRIVER_PRIORITY',resolved.driverPriority.drivers.map(x=>item(x.driverId,x.baselineAffinity,{label:x.label,labelZhHans:x.labelZhHans,rank:x.rank,angularDistanceDegrees:x.angularDistanceDegrees,classification:resolved.driverPriority.classification}))),
    structure('ECR_MOTION',[item(resolved.motion.motionId,resolved.motion.motionId,{label:resolved.motion.label,labelZhHans:resolved.motion.labelZhHans,trigramRef:resolved.motion.trigramRef})]),
    structure('ECR_CONFIGURATION',[item(resolved.configuration.configurationId,resolved.configuration.configurationId,{hexagramRef:resolved.configuration.hexagramRef,kingWenNumber:resolved.configuration.kingWenNumber,upperTrigramRef:resolved.configuration.upperTrigramRef,lowerTrigramRef:resolved.configuration.lowerTrigramRef,environmentPriorityMotionId:resolved.configuration.environmentPriorityMotionId,embodiedResponseMotionId:resolved.configuration.embodiedResponseMotionId,rule:resolved.configuration.rule})]),
    structure('ECR_ACTIVATION',[item(resolved.activation.activationId,resolved.activation.activationId,{code:resolved.activation.code,label:resolved.activation.label,labelZhHans:resolved.activation.labelZhHans})])
  ];
  const calculation=freeze({status:'COMPLETE',deterministic:true,values:freeze([item('SOLAR_ANCHOR_LONGITUDE',resolved.anchorLongitude,{unit:'degree',referenceFrame:anchor.referenceFrame||'TROPICAL_ECLIPTIC_GEOCENTRIC'}),item('WITHIN_CONFIGURATION_RATIO',resolved.position.withinConfigurationRatio)]),coordinates:freeze({anchorLongitude:resolved.anchorLongitude,boundary:resolved.boundary,position:resolved.position}),structures:freeze(structures),cycles:freeze([]),positions:freeze([{code:'SUN',value:resolved.anchorLongitude,rawValue:null,meta:freeze({referenceFrame:anchor.referenceFrame||'TROPICAL_ECLIPTIC_GEOCENTRIC'})}])});
  const method=freeze({publicMethodCode:ECR_PUBLIC_METHOD_CODE,publicLabel:canonicalInput.locale==='zh-Hans'?'载体构型读取':'Embodied Configuration',publicLabels:freeze({en:'Embodied Configuration','zh-Hans':'载体构型读取'}),internalReference:freeze({opaqueId:'ECR-FIRST-PARTY',protected:false,rawIdentityExposed:true}),version:ECR_METHOD_VERSION,status:'PRODUCTION_CALCULATION',calculationMode:'DETERMINISTIC_FIRST_PARTY'});
  const projection=freeze({contract:'CANONICAL_METHOD_PROJECTION',status:'COMPLETE',clientRenderable:true,productionResult:true,coreSchemaExposed:false,unknownDisclosureRequired:false});
  const evidence=freeze([{type:'INPUT_SOURCE',status:'AVAILABLE',sourceCode:'MCD-3-CANONICAL-BIRTH-INPUT',reference:canonicalInput.inputVersion,version:canonicalInput.inputVersion,confidence:'HIGH'},{type:'CALCULATION_AUTHORITY',status:'AVAILABLE',sourceCode:'ECR_CALCULATION_SPEC',reference:'content/embodied-configuration/ecr-calculation-spec-v1.json',version:ECR_CALCULATION_SPEC_RUNTIME.schemaVersion,confidence:'HIGH'},{type:'ASTRONOMY_AUTHORITY',status:'AVAILABLE',sourceCode:anchor.engineCode||'TEST_ANCHOR',reference:anchor.referenceFrame||'TROPICAL_ECLIPTIC_GEOCENTRIC',version:anchor.engineVersion||'TEST',confidence:'HIGH'}]);
  const version=freeze({methodRegistryVersion:'ECR-1.0.0',runtimeVersion:'1.0.0',adapterVersion:anchor.engineVersion||'TEST',inputContractVersion:'MCD-3',projectionContractVersion:'1.0.0',calculationSpecVersion:ECR_CALCULATION_SPEC_RUNTIME.schemaVersion});
  const base={schemaVersion:ECR_CANONICAL_PROJECTION_SCHEMA,method,calculation,projection,unknown:freeze([]),evidence,version,execution:freeze({requestId,status:'EXECUTED',runtimeIdentity:'ECR_CANONICAL_PROJECTION_RUNTIME@1.0.0',executedAt:anchor.utcIso}),interpretation:freeze({included:false,principle:'CALCULATION_NOT_EQUAL_INTERPRETATION',meaningAuthorityCreated:false,realityReadingCreated:false,professionalJudgmentCreated:false})};
  const digest=await sha256Stable({method,calculation,version,evidence});const canonical=freeze({...base,projectionId:`CMP-ECR-${digest.slice(0,24).toUpperCase()}`});
  const checked=validateEcrCanonicalProjection(canonical);if(!checked.valid)fail(`ECR_CANONICAL_PROJECTION_INVALID:${checked.failures.join(',')}`);return canonical;
}

export async function executeEcrCanonicalProjection({canonicalInput,requestId='ECR-EXECUTE',astronomyModuleLoader}={}){
  const anchor=await calculateEcrSolarAnchor(canonicalInput,{astronomyModuleLoader});
  return buildEcrCanonicalProjectionFromAnchor({canonicalInput,anchor,requestId});
}

export default Object.freeze({buildEcrCanonicalProjectionFromAnchor,executeEcrCanonicalProjection});
