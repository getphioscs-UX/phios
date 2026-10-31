import {SMR_SUPPORTED_METHODS,SMR_VERSIONS} from './smr-registry-v1.js';

const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))freeze(item)}return value};

export const SINGLE_METHOD_READING_ELIGIBILITY=freeze({
  schemaVersion:'PHI-OS-SINGLE-METHOD-READING-ELIGIBILITY-v1.0.0',
  requiredMethodState:'READY_TO_READ',
  requiredAcceptanceBasis:'ADMITTED_COMPOSITION_RULESET',
  contractVersion:SMR_VERSIONS.contract,
  rawStructureFallback:false
});

export function resolveSingleMethodReadingEligibility({methodResult,acceptedInterpretationResult}={}){
  const reasons=[];
  if(!SMR_SUPPORTED_METHODS.includes(methodResult?.methodId))reasons.push('SMR_METHOD_NOT_SUPPORTED');
  if(methodResult?.state!=='READY_TO_READ')reasons.push('SMR_ACCEPTED_METHOD_RESULT_REQUIRED');
  if(methodResult?.technical?.acceptanceBasis!=='ADMITTED_COMPOSITION_RULESET')reasons.push('SMR_ADMITTED_COMPOSITION_RULESET_REQUIRED');
  if(acceptedInterpretationResult?.resultStatus!=='CUSTOMER_PUBLISHABLE')reasons.push('SMR_CUSTOMER_PUBLISHABLE_INTERPRETATION_REQUIRED');
  if(acceptedInterpretationResult?.acceptanceBasis!=='ADMITTED_COMPOSITION_RULESET')reasons.push('SMR_INTERPRETATION_ACCEPTANCE_BASIS_INVALID');
  if(!Array.isArray(acceptedInterpretationResult?.interpretationUnits)||!acceptedInterpretationResult.interpretationUnits.length)reasons.push('SMR_INTERPRETATION_UNITS_REQUIRED');
  if(acceptedInterpretationResult?.methodId&&acceptedInterpretationResult.methodId!==methodResult?.methodId)reasons.push('SMR_METHOD_MISMATCH');
  return freeze({eligible:reasons.length===0,state:reasons.length?'SINGLE_METHOD_READING_NOT_READY':'ELIGIBLE',reasons,boundary:{rawProjectionFallback:false,meaningCreated:false}});
}

export function assertSingleMethodReadingEligibility(input){
  const result=resolveSingleMethodReadingEligibility(input);
  if(!result.eligible)throw Object.assign(new Error('SINGLE_METHOD_READING_NOT_READY'),{code:'SINGLE_METHOD_READING_NOT_READY',reasons:result.reasons});
  return result;
}
