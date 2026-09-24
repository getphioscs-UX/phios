import {ECR_V41_AUTHORITIES} from '../embodied-configuration/ecr-v41-authorities.generated.js';
import {isEcrHumanAdmitted} from '../embodied-configuration/ecr-semantic-composition-r2.js';
const deck=ECR_V41_AUTHORITIES['content/ecr-phi-card/ecr-phi-card-deck-registry-v2.json'];
const slots=['CARRIER','EXPERIENCE','EXPRESSION','AGENCY','IDENTITY','FEEDBACK_CONTINUITY'];
const policy=ECR_V41_AUTHORITIES['content/embodied-configuration/v4-1/semantic-admission-r2/card-eligibility.json'];
export function selectEcrRuntimeSlotCards(semanticDepth,eligibility,sourceDeck){
 const tags=new Set((semanticDepth||[]).filter(x=>x.customerSurfaceAllowed).flatMap(x=>x.semanticTags||[]));
 return slots.map((slot,i)=>{
  const candidates=eligibility.runtimeSlotEligibility.filter(r=>isEcrHumanAdmitted(r)&&r.runtimeSlots.includes(slot)&&r.requiredSemanticTags.length>0&&r.requiredSemanticTags.every(t=>tags.has(t))&&Number.isFinite(r.priority)&&sourceDeck.cards.some(c=>c.cardId===r.cardId&&c.groupId===r.predecessorGroup)).sort((a,b)=>a.priority-b.priority);
  const ambiguous=candidates.length>1&&candidates[0].priority===candidates[1].priority;
  const chosen=!ambiguous&&candidates[0],card=chosen&&sourceDeck.cards.find(c=>c.cardId===chosen.cardId);
  return {position:i+1,slot,cardId:card?.cardId||null,meaning:card?.canonicalCustomerMeaning||null,status:card?'ADMITTED_SELECTION':'UNKNOWN',unknownReason:card?null:ambiguous?'ADMITTED_ELIGIBILITY_PRIORITY_CONFLICT':'EXACT_RUNTIME_OWNER_TO_ACCEPTED_DECK_MAPPING_PENDING',predecessorGroup:card?.groupId||null};
 });
}
export function projectEcrHumanRuntimeCards(ir){
 if(ir?.schemaVersion!=='PHI-OS-ECR-HUMAN-RUNTIME-CONFIGURATION-v4.1')throw Error('ECR_V41_IR_REQUIRED');
 return {schemaVersion:'PHI-OS-ECR-PHI-CARD-SUCCESSOR-v4.1',cards:selectEcrRuntimeSlotCards(ir.semanticDepth,policy,deck).map(c=>({...c,sourceProjectionId:ir.configurationId})),predecessorDeckRef:deck.deckId,predecessorDeckCount:deck.fixedCardCount,taxonomy:deck.groups.map(g=>g.groupId),runtimeSlotRelation:'MANY_TO_MANY',outputPositionsAreTaxonomy:false,semanticAuthorityReplaced:false,randomDraw:false,fullReportRemainsPrimary:true,customerProductionAdmitted:false};
}
