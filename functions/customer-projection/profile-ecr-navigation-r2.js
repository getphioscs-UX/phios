import {profileEvidenceApi} from '../account/profile-evidence-store.js';
import {personIdentity} from '../account/canonical-person-store.js';
import {requireSameOrigin} from '../account/oidc-auth.js';
import {ecrReflectionContinuity} from '../ecr-phi-card/ecr-reflection-continuity-r2.js';
const fail=(code,status=422)=>{throw Object.assign(Error(code),{code,status});};
// Local session consumer. Source records are loaded by their existing encrypted
// Profile owner on every request. No dossier, claim or client package is trusted.
export async function consumeProfileEcrNavigationR2(context,selection,question){
 if(!selection)return null;
 if(context.env?.PHIOS_PERSONAL_EVIDENCE_LOCAL!=='true'||!['localhost','127.0.0.1','[::1]'].includes(new URL(context.request.url).hostname))fail('PROFILE_NAVIGATION_LOCAL_ONLY',403);
 personIdentity(context);requireSameOrigin(context.request);
 if(Object.keys(selection).some(k=>!['selected','expiresAt','ecrReflectionKeys'].includes(k)))fail('PROFILE_NAVIGATION_SELECTION_INVALID');
 const keys=selection.ecrReflectionKeys||[];
 if(!Array.isArray(keys)||keys.length>4||new Set(keys).size!==keys.length)fail('PROFILE_NAVIGATION_REFLECTION_SELECTION_INVALID');
 const request=new Request(new URL('/api/account-profile-evidence?lane=experiences',context.request.url),{method:'POST',headers:{'content-type':'application/json',origin:new URL(context.request.url).origin},body:JSON.stringify({action:'handoff',selected:selection.selected,consent:true,target:'NAVIGATION',purpose:question,purposeCode:'RUNTIME_CONTINUITY',expiresAt:selection.expiresAt})});
 const response=await profileEvidenceApi({...context,request}),body=await response.json();
 if(!response.ok)fail(body.code||'PROFILE_NAVIGATION_SOURCE_UNAVAILABLE',response.status);
 const comparisons=[];
 for(const key of keys){const saved=await ecrReflectionContinuity(context).read(key);if(!saved)fail('PROFILE_NAVIGATION_REFLECTION_UNAVAILABLE',409);comparisons.push({checkpointKey:key,comparison:saved.comparison,sourceClass:'USER_REFLECTION_NOT_MEASUREMENT',realityFact:false});}
 return {schemaVersion:'PHIOS-PROFILE-ECR-NAVIGATION-SESSION-R2-v1',receiverState:'CONSUMED_FOR_THIS_REQUEST',source:'PROFILE_ACCOUNT_OWNER',references:body.package.references,reflectionComparisons:comparisons,navigationContract:body.package.navigation,expiresAt:body.package.expiresAt,
  automaticPersistence:false,persisted:false,objectiveVerification:false,providerCalls:0,direction:null,historyReconstructed:false,
  nextReview:['Confirm the actual scope and outcome.','Keep counterexamples and changed conditions.','Choose the next observation; no direction is selected automatically.']};
}
