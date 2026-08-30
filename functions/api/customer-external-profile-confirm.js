import {confirmExternalProfile} from '../external-profile/external-profile-confirmation.js';
import {buildCanonicalHumanDesignExternalChart} from '../external-profile/human-design-canonical-chart.js';
import {HD_EXTERNAL_PRODUCTION} from '../external-profile/human-design-external-authority.js';

const H={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:H});

export async function onRequestPost(context){
  let body;try{body=await context.request.json()}catch{return json({ok:false,error:'EXTERNAL_PROFILE_CONFIRMATION_JSON_REQUIRED'},400)}
  if(body?.consent!==true)return json({ok:false,error:'EXTERNAL_PROFILE_CONFIRMATION_CONSENT_REQUIRED'},403);
  try{
    const confirmedExternalProfile=confirmExternalProfile({confirmationDraft:body.confirmationDraft,edits:body.edits||{},structureEdits:body.structureEdits||{}});
    const canonicalHumanDesignChart=buildCanonicalHumanDesignExternalChart(confirmedExternalProfile);
    return json({
      ok:true,
      confirmedExternalProfile,
      canonicalHumanDesignChart,
      readingAvailability:{
        state:HD_EXTERNAL_PRODUCTION.customerReadingPublicationAllowed?'CUSTOMER_READING_AVAILABLE':'HUMAN_REVIEW_PENDING',
        machineCandidateAvailable:HD_EXTERNAL_PRODUCTION.readingCandidateMachineExecutable,
        humanReviewRequired:HD_EXTERNAL_PRODUCTION.humanReviewRequired,
        humanReviewAccepted:HD_EXTERNAL_PRODUCTION.humanReviewAccepted,
        customerPublishable:HD_EXTERNAL_PRODUCTION.customerReadingPublicationAllowed,
        boundary:'The confirmed external chart can be used as customer-supplied context. Interpretive reading publication remains gated by Human Design review admission.'
      },
      privacy:{saved:false,runtimeMemoryWritten:false}
    });
  }catch(error){return json({ok:false,error:error?.message||'EXTERNAL_PROFILE_CONFIRMATION_FAILED'},422)}
}
