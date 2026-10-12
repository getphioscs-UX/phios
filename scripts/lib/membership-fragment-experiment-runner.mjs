import {renderMembershipFragmentSupport} from '../../functions/personal-reading/continuity/membership-fragment-contract.js';
export function validateAndRenderFragmentExperimentOutput(answer,candidate){
 if(answer?.locale!==candidate.locale||!Array.isArray(answer.claims))throw Error('FRAGMENT_ANSWER_SCHEMA_INVALID');
 const rendered=answer.claims.map(claim=>{if(typeof claim.text!=='string'||!claim.text.trim()||claim.text.length>1000)throw Error('CLAIM_BODY_INVALID');
  if(candidate.locale==='en'&&/[\u3400-\u9fff]/u.test(claim.text))throw Error('EN_BODY_LANGUAGE_LEAK');
  if(claim.quote||claim.support||claim.sourceSha256)throw Error('MODEL_QUOTE_OR_IDENTITY_NOT_IN_FRAGMENT_CONTRACT');
  return {...claim,support:renderMembershipFragmentSupport(claim.supportFragmentIds,candidate.catalog)};
 });
 return {locale:answer.locale,claims:rendered,identityCheck:'PASS_THIS_PACK_FRAGMENT_ID',semanticAssessment:'NOT_VERIFIED_REQUIRES_ARGUMENT_AND_QUALIFIER_REVIEW',deliverable:false,privateExcerptExposure:'INTERNAL_EXPERIMENT_ONLY_NOT_PUBLIC_RESPONSE'};
}
// Offline invocation contract shared with a future explicitly authorized
// dispatcher. No provider transport is constructed here.
export async function runOfflineFragmentExperiment(request,candidate,offlineModel){
 if(request.paidAuthorization!==false||typeof offlineModel!=='function')throw Error('OFFLINE_EXPERIMENT_ONLY');
 const answer=await offlineModel(structuredClone(request.body));
 return {...validateAndRenderFragmentExperimentOutput(answer,candidate),modelInvocation:'OFFLINE_FIXTURE_NOT_MODEL_QUALITY',providerCalls:0,customerCreditsCharged:0};
}
