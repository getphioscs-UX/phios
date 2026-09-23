import {ECR_V41_AUTHORITIES} from '../embodied-configuration/ecr-v41-authorities.generated.js';
const deck=ECR_V41_AUTHORITIES['content/ecr-phi-card/ecr-phi-card-deck-registry-v2.json'];
const slots=['CARRIER','EXPERIENCE','EXPRESSION','AGENCY','IDENTITY','FEEDBACK_CONTINUITY'];
export function projectEcrHumanRuntimeCards(ir){
 if(ir?.schemaVersion!=='PHI-OS-ECR-HUMAN-RUNTIME-CONFIGURATION-v4.1')throw Error('ECR_V41_IR_REQUIRED');
 // The six old deck groups are not these six runtime owners. Until an exact
 // semantic mapping is admitted, a position cannot inherit an arbitrary card.
 return {schemaVersion:'PHI-OS-ECR-PHI-CARD-SUCCESSOR-v4.1',cards:slots.map((slot,i)=>({position:i+1,slot,cardId:null,meaning:null,status:'UNKNOWN',unknownReason:'EXACT_RUNTIME_OWNER_TO_ACCEPTED_DECK_MAPPING_PENDING',sourceProjectionId:ir.configurationId})),predecessorDeckRef:deck.deckId,predecessorDeckCount:deck.fixedCardCount,semanticAuthorityReplaced:false,randomDraw:false,fullReportRemainsPrimary:true,customerProductionAdmitted:false};
}
