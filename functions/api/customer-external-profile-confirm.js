import {confirmExternalProfile} from '../external-profile/external-profile-confirmation.js';
import {buildCanonicalHumanDesignExternalChart} from '../external-profile/human-design-canonical-chart.js';
import {buildHumanDesignExternalReadingIr} from '../external-profile/human-design-reading-runtime.js';
import {composeHumanDesignRealityBridge} from '../external-profile/human-design-reality-composition.js';
import {HD_EXTERNAL_PRODUCTION} from '../external-profile/human-design-external-authority.js';
import {buildHumanDesignR3ProfessionalProduct} from '../external-profile/human-design-r3-professional-runtime.js';
import {HD_R3_PRODUCTION_AUTHORITY} from '../external-profile/human-design-r3-production-authority.js';

const H={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:H});

export async function onRequestPost(context){
  let body;try{body=await context.request.json()}catch{return json({ok:false,error:'EXTERNAL_PROFILE_CONFIRMATION_JSON_REQUIRED'},400)}
  if(body?.consent!==true)return json({ok:false,error:'EXTERNAL_PROFILE_CONFIRMATION_CONSENT_REQUIRED'},403);
  try{
    const confirmedExternalProfile=confirmExternalProfile({confirmationDraft:body.confirmationDraft,edits:body.edits||{},structureEdits:body.structureEdits||{}});
    const canonicalHumanDesignChart=buildCanonicalHumanDesignExternalChart(confirmedExternalProfile);
    const customerPublishable=HD_EXTERNAL_PRODUCTION.customerReadingPublicationAllowed===true&&HD_EXTERNAL_PRODUCTION.humanReviewAccepted===true;
    const humanDesignReading=customerPublishable?buildHumanDesignExternalReadingIr(canonicalHumanDesignChart,{locale:body.locale==='zh-Hans'?'zh-Hans':'en',intent:body.intent||''}):null;
    const humanDesignRealityComposition=humanDesignReading?composeHumanDesignRealityBridge(humanDesignReading):null;
    const r3Publishable=HD_R3_PRODUCTION_AUTHORITY.customerPublicationAllowed===true&&HD_R3_PRODUCTION_AUTHORITY.humanAccepted===true;
    const humanDesignProfessionalReading=r3Publishable?buildHumanDesignR3ProfessionalProduct(canonicalHumanDesignChart,{locale:body.locale==='zh-Hans'?'zh-Hans':'en',intent:body.intent||''}):null;
    return json({
      ok:true,
      confirmedExternalProfile,
      canonicalHumanDesignChart,
      humanDesignReading,
      humanDesignRealityComposition,
      humanDesignProfessionalReading,
      readingAvailability:{
        state:r3Publishable?'CUSTOMER_PUBLISHED':customerPublishable?'CUSTOMER_PUBLISHED':'HUMAN_REVIEW_PENDING',
        activeCustomerReadingVersion:r3Publishable?'HD_PRO_R3':customerPublishable?'HD_PRO_R2':null,
        machineCandidateAvailable:HD_EXTERNAL_PRODUCTION.readingCandidateMachineExecutable,
        humanReviewRequired:HD_EXTERNAL_PRODUCTION.humanReviewRequired,
        humanReviewAccepted:r3Publishable?HD_R3_PRODUCTION_AUTHORITY.humanAccepted:HD_EXTERNAL_PRODUCTION.humanReviewAccepted,
        r3HumanReviewAccepted:HD_R3_PRODUCTION_AUTHORITY.humanAccepted,
        r3MachineVerified:HD_R3_PRODUCTION_AUTHORITY.machineVerified,
        r3BenchmarkPassed:HD_R3_PRODUCTION_AUTHORITY.benchmarkPassedCases===12,
        r2FallbackAvailable:HD_R3_PRODUCTION_AUTHORITY.r2FallbackAvailable,
        customerPublishable:r3Publishable||customerPublishable,
        publicationClass:r3Publishable?'HD_PRO_R3_HUMAN_ACCEPTED_PROFESSIONAL_READING':customerPublishable?'HUMAN_ACCEPTED_EXTERNAL_CHART_READING':'NOT_PUBLISHED',
        boundary:r3Publishable?'This professional Human Design reading passed the R3 96-case machine campaign, 12-case benchmark and new 24/24 human review. The chart remains customer-supplied external authority; PHI OS does not claim Human Design calculation authority.':customerPublishable?'This Human Design reading is admitted from the R2 24/24 human-reviewed external-chart reading campaign. The chart remains customer-supplied external authority; PHI OS does not claim Human Design calculation authority.':'The confirmed external chart can be used as customer-supplied context. Interpretive reading publication remains gated by Human Design review admission.'
      },
      privacy:{saved:false,runtimeMemoryWritten:false}
    });
  }catch(error){return json({ok:false,error:error?.message||'EXTERNAL_PROFILE_CONFIRMATION_FAILED'},422)}
}
