import {isEcrHumanAdmitted} from './ecr-semantic-composition-r2.js';
export function evaluateEcrV41ProductionBlockers({reviewPairs=[],semanticDepth=[],cardPolicy,topicReview,visualReview,deployedPreview}={}){
 const blockers=[];
 if(reviewPairs.length!==14||!reviewPairs.every(p=>p.decision==='ACCEPT'&&p.reviewer&&p.reviewedAt&&p.pairDigest))blockers.push('BILINGUAL_REVIEW_PAIRS');
 if(!semanticDepth.length||semanticDepth.some(s=>!s.customerSurfaceAllowed))blockers.push('COMPOSITIONAL_SEMANTIC_ADMISSION');
 const slots=['CARRIER','EXPERIENCE','EXPRESSION','AGENCY','IDENTITY','FEEDBACK_CONTINUITY'];
 if(!slots.every(slot=>(cardPolicy?.runtimeSlotEligibility||[]).some(r=>isEcrHumanAdmitted(r)&&r.runtimeSlots.includes(slot)&&r.requiredSemanticTags.length&&Number.isFinite(r.priority))))blockers.push('CARD_SLOT_ELIGIBILITY');
 if(!isEcrHumanAdmitted(topicReview))blockers.push('TOPIC_PERSONAL_SELECTION');
 if(!isEcrHumanAdmitted(visualReview))blockers.push('RENDERED_VISUAL_ACCEPTANCE');
 if(deployedPreview?.status!=='PASS'||!deployedPreview.evidenceRef)blockers.push('DEPLOYED_PREVIEW_E2E');
 return {scope:'ECR_V4.1_BASELINE_PRODUCT',blockers,nonBlockers:[
  {code:'CHIRON_PROVIDER',status:'BLOCKED_PROVIDER_DECISION',disclosure:'D11 UNKNOWN; partial driver capability permitted'},
  {code:'CHIRON_R1_INTERPRETATION',status:'OUTSIDE_V4.1_BASELINE'},
  {code:'ECR_V4_2_DYNAMIC_INFERENCE',status:'DEFERRED_TO_V4.2',disclosure:'V4.1 Current Reality is OBSERVATION + COMPARISON only; dynamic conclusions remain UNKNOWN'}
 ],machineReady:blockers.length===0,customerProductionAdmitted:false,releaseDecisionRequired:true};
}
