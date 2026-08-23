/** PHI OS TAR-W6/W7 structural Tarot runtime. Selection is already persisted; calculation never redraws. */
import { createSharedCalculationRuntime, SHARED_CALCULATION_RUNTIME_CODE, sha256 } from '../method-runtime/shared-calculation-runtime.js';
import { TAROT_METHOD_CODE, TAROT_PLUGIN_CODE, TAROT_RUNTIME_VERSION, validateTarotEvidenceBundle } from './tarot-selection-runtime.js';

export const TAROT_RUNTIME_CODE = 'TAROT_RUNTIME';
export const TAROT_ALGORITHM_CODE = 'TAROT_CARD_STRUCTURAL_LOOKUP';
export const TAROT_ALGORITHM_VERSION = '1.0.0';

function object(value,message){if(!value||typeof value!=='object'||Array.isArray(value))throw new TypeError(message);}

export function createTarotRuntime(config) {
  const cardById=new Map(config.cardRegistry.entries.map(x=>[x.cardId,x]));
  const algorithm=Object.freeze({
    algorithmCode:TAROT_ALGORITHM_CODE,
    algorithmVersion:TAROT_ALGORITHM_VERSION,
    async calculate(records, context) {
      const record=records.find(x=>x.recordType === 'TAROT_DRAW_EVIDENCE_BUNDLE');
      if (!record) throw new TypeError('TAROT_DRAW_EVIDENCE_BUNDLE_REQUIRED');
      const normalized=await validateTarotEvidenceBundle(record.payload,config);
      const drawIndex=context.referenceVersions.drawIndex;
      if (!Number.isInteger(drawIndex) || drawIndex < 1 || drawIndex > normalized.draws.length) throw new TypeError('TAROT_DRAW_INDEX_INVALID');
      const draw=normalized.draws[drawIndex-1], card=cardById.get(draw.cardId);
      if (!card) throw new TypeError(`UNKNOWN_TAROT_CARD_ID:${draw.cardId}`);
      return Object.freeze({
        schemaVersion:'PHI-OS-TAROT-CARD-CALCULATION-OUTPUT-v1.0.0',runtimeCode:TAROT_RUNTIME_CODE,runtimeVersion:TAROT_RUNTIME_VERSION,methodCode:TAROT_METHOD_CODE,pluginCode:TAROT_PLUGIN_CODE,
        deck:Object.freeze({deckId:normalized.deck.deckId,deckVersion:normalized.deck.deckVersion}),
        card:Object.freeze({cardId:card.cardId,cardIdentity:card.cardIdentity,arcana:card.arcana,suit:card.suit,rank:card.rank,number:card.number,rankOrder:card.rankOrder,canonicalTitle:card.canonicalTitle}),
        orientation:draw.orientation,
        position:Object.freeze({spreadId:normalized.spread.spreadId,spreadVersion:normalized.spread.spreadVersion,positionId:draw.position.positionId,order:draw.position.order,label:draw.position.label}),
        drawIndex,
        trace:Object.freeze({inputMode:normalized.inputMode,selectionMode:normalized.selectionMode,deckVersion:normalized.deck.deckVersion,eligibleCardCount:normalized.eligibleCards.length,drawOrder:Object.freeze(normalized.draws.map(x=>x.cardId)),orientationResult:Object.freeze(normalized.draws.map(x=>x.orientation)),spreadPosition:Object.freeze({positionId:draw.position.positionId,order:draw.position.order}),cardIdentity:card.cardIdentity,redrawInsideCalculation:false}),
        deterministic:true,sourceNeutral:true,projectionCreated:false,interpretationCreated:false,productionEligible:false
      });
    }
  });
  const shared=createSharedCalculationRuntime({algorithms:[algorithm]});
  return Object.freeze({
    runtimeCode:TAROT_RUNTIME_CODE,runtimeVersion:TAROT_RUNTIME_VERSION,
    async calculateSpread(request={}) {
      object(request,'TAROT_CALCULATION_REQUEST_REQUIRED');
      if (request.runtimeCode !== TAROT_RUNTIME_CODE) throw new TypeError('INVALID_TAROT_RUNTIME_CODE');
      if (typeof request.calculationIdPrefix !== 'string' || !request.calculationIdPrefix) throw new TypeError('TAROT_CALCULATION_ID_PREFIX_REQUIRED');
      const normalized=await validateTarotEvidenceBundle(request.evidence,config);
      const evidenceDigest=await sha256(request.evidence);
      const bridgeRecord=Object.freeze({recordId:`SDA-TAR-${evidenceDigest.slice(0,24).toUpperCase()}`,recordType:'TAROT_DRAW_EVIDENCE_BUNDLE',recordVersion:'1.0.0',authority:'SHARED_DATA_AUTHORITY',status:'draft',methodOwner:null,pluginOwner:null,payload:request.evidence});
      const results=[];
      for (let drawIndex=1;drawIndex<=normalized.draws.length;drawIndex++) {
        results.push(await shared.execute({calculationId:`${request.calculationIdPrefix}-${drawIndex}`,runtimeCode:SHARED_CALCULATION_RUNTIME_CODE,methodCode:TAROT_METHOD_CODE,pluginCode:TAROT_PLUGIN_CODE,algorithmCode:TAROT_ALGORITHM_CODE,algorithmVersion:TAROT_ALGORITHM_VERSION,inputRecords:[bridgeRecord],referenceVersions:Object.freeze({executionMode:'structural_validation',tarotRuntimeVersion:TAROT_RUNTIME_VERSION,deckId:normalized.deck.deckId,deckVersion:normalized.deck.deckVersion,spreadId:normalized.spread.spreadId,spreadVersion:normalized.spread.spreadVersion,orientationPolicyVersion:'1.0.0',drawIndex,projectionVersion:normalized.projectionVersion,productionEligible:false})}));
      }
      return Object.freeze(results);
    }
  });
}
