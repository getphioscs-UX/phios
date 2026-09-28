import {ECR_V41_AUTHORITIES} from '../embodied-configuration/ecr-v41-authorities.generated.js';
import {isEcrHumanAdmitted} from '../embodied-configuration/ecr-semantic-composition-r2.js';
const deck=ECR_V41_AUTHORITIES['content/ecr-phi-card/ecr-phi-card-deck-registry-v2.json'];
const assets=ECR_V41_AUTHORITIES['content/ecr-phi-card/ecr-phi-card-asset-registry-v1.json'];
const slots=['CARRIER','EXPERIENCE','EXPRESSION','AGENCY','IDENTITY','FEEDBACK_CONTINUITY'];
const policy=ECR_V41_AUTHORITIES['content/embodied-configuration/v4-1/semantic-admission-r2/card-eligibility.json'];

const tier=r=>Number(r?.priority?.tier);
const optionalMatches=(r,tags)=>(r.optionalSemanticTags||[]).filter(t=>tags.has(t)).length;
const specificity=r=>(r.requiredSemanticTags||[]).length;
const score=(r,tags)=>[tier(r),optionalMatches(r,tags),specificity(r)];
const compareScore=(a,b)=>a.every((v,i)=>v===b[i]);

export function selectEcrRuntimeSlotCards(semanticDepth,eligibility,sourceDeck){
 const tags=new Set((semanticDepth||[]).filter(x=>x.customerSurfaceAllowed).flatMap(x=>x.semanticTags||[]));
 return slots.map((slot,i)=>{
  const candidates=eligibility.runtimeSlotEligibility
   .filter(r=>isEcrHumanAdmitted(r)
    &&r.selectionMode==='PRIMARY_OR_OVERLAY'
    &&r.runtimeSlots.includes(slot)
    &&(r.requiredSemanticTags||[]).length>0
    &&r.requiredSemanticTags.every(t=>tags.has(t))
    &&Number.isFinite(tier(r))
    &&sourceDeck.cards.some(c=>c.cardId===r.cardId&&c.groupId===r.predecessorGroup))
   .map(r=>({record:r,score:score(r,tags)}))
   .sort((a,b)=>b.score[0]-a.score[0]||b.score[1]-a.score[1]||b.score[2]-a.score[2]||a.record.cardId.localeCompare(b.record.cardId));
  const ambiguous=candidates.length>1&&compareScore(candidates[0].score,candidates[1].score);
  const chosen=!ambiguous&&candidates[0]?.record;
  const card=chosen&&sourceDeck.cards.find(c=>c.cardId===chosen.cardId);
  return {
   position:i+1,slot,
   cardId:card?.cardId||null,
   title:card?.title||null,
   subtitle:card?.subtitle||null,
   oneLineInsight:card?.oneLineInsight||null,
   meaning:card?.canonicalCustomerMeaning||null,
   assetRef:card?.assetRef||null,
   asset:card?assets?.assets?.find(a=>a.cardId===card.cardId)||null:null,
   status:card?'ADMITTED_SELECTION':'UNKNOWN',
   unknownReason:card?null:ambiguous?'ADMITTED_ELIGIBILITY_PRIORITY_CONFLICT':'NO_ADMITTED_CARD_MATCH',
   predecessorGroup:card?.groupId||null,
   selectionEvidence:chosen?{requiredSemanticTags:chosen.requiredSemanticTags,optionalSemanticTags:chosen.optionalSemanticTags,priority:chosen.priority}:null
  };
 });
}

export function projectEcrHumanRuntimeCards(ir){
 if(ir?.schemaVersion!=='PHI-OS-ECR-HUMAN-RUNTIME-CONFIGURATION-v4.1')throw Error('ECR_V41_IR_REQUIRED');
 return {
  schemaVersion:'PHI-OS-ECR-PHI-CARD-SUCCESSOR-v4.1',
  cards:selectEcrRuntimeSlotCards(ir.semanticDepth,policy,deck).map(c=>({...c,sourceProjectionId:ir.configurationId})),
  predecessorDeckRef:deck.deckId,
  predecessorDeckCount:deck.fixedCardCount,
  taxonomy:deck.groups.map(g=>g.groupId),
  runtimeSlotRelation:'MANY_TO_MANY',
  outputPositionsAreTaxonomy:false,
  semanticAuthorityReplaced:false,
  randomDraw:false,
  fullReportRemainsPrimary:true,
  customerProductionAdmitted:false
 };
}
