import {isEcrHumanAdmitted} from './ecr-semantic-composition-r2.js';
export function evaluateEcrV41ProductionBlockers({reviewPairs=[],semanticDepth=[],cardPolicy,topicReview,visualReview,deployedPreview}={}){
 const blockers=[];
 if(reviewPairs.length!==14||!reviewPairs.every(p=>(p.ownerDecision==='ACCEPT'||p.decision==='ACCEPT')&&p.reviewer&&p.reviewedAt))blockers.push('BILINGUAL_REVIEW_PAIRS');
 if(!semanticDepth.length||semanticDepth.some(s=>!s.customerSurfaceAllowed))blockers.push('COMPOSITIONAL_SEMANTIC_ADMISSION');
 const slots=['CARRIER','EXPERIENCE','EXPRESSION','AGENCY','IDENTITY','FEEDBACK_CONTINUITY'];
 if(!slots.every(slot=>(cardPolicy?.runtimeSlotEligibility||[]).some(r=>isEcrHumanAdmitted(r)&&r.selectionMode==='PRIMARY_OR_OVERLAY'&&r.runtimeSlots.includes(slot)&&r.requiredSemanticTags.length&&Number.isFinite(Number(r.priority?.tier)))))blockers.push('CARD_SLOT_ELIGIBILITY');
 const topicReady=topicReview?.status==='COMPLETE'||topicReview?.state==='COMPLETE'||topicReview?.operationalAdmission===true||isEcrHumanAdmitted(topicReview);
 if(!topicReady)blockers.push('TOPIC_PERSONAL_SELECTION');
 const visualReady=visualReview?.status==='ACCEPTED'||visualReview?.status==='PASS'||isEcrHumanAdmitted(visualReview);
 if(!visualReady)blockers.push('RENDERED_VISUAL_ACCEPTANCE');
 if(deployedPreview?.status!=='PASS'||!deployedPreview.evidenceRef)blockers.push('DEPLOYED_PREVIEW_E2E');
 return {
  scope:'ECR_V4.1_BASELINE_PRODUCT',
  blockers,
  nonBlockers:[{code:'ECR_V4_2_DYNAMIC_INFERENCE',status:'DEFERRED_TO_V4.2',disclosure:'V4.1 Current Reality is OBSERVATION + COMPARISON only; dynamic conclusions remain UNKNOWN'}],
  machineReady:blockers.length===0,
  customerProductionAdmitted:false,
  releaseDecisionRequired:true,
  driverBaseline:{activeD11:'EARTH',d11CalculationRule:'normalize360(SUN_LONGITUDE + 180)',chironOperationalIdentity:'REMOVED_FROM_V4_1'}
 };
}
