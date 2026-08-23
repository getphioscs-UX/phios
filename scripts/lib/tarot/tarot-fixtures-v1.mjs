import fs from 'node:fs';
import { createTarotSelectionRuntime, TAROT_DECK_ID, TAROT_DECK_VERSION, TAROT_ORIENTATION_POLICY_ID, TAROT_ORIENTATION_POLICY_VERSION } from '../../../functions/core-method-runtime/tarot-selection-runtime.js';

const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
export const tarotAuthorities=Object.freeze({
  deckContract:j('content/professional/core-method-runtime/tarot-deck-contract-v1.json'),
  cardRegistry:j('content/professional/core-method-runtime/tarot-card-registry-v1.json'),
  spreadRegistry:j('content/professional/core-method-runtime/tarot-spread-registry-v1.json'),
  orientationPolicy:j('content/professional/core-method-runtime/tarot-orientation-policy-v1.json')
});

export const selectionRuntime=createTarotSelectionRuntime(tarotAuthorities);
const base={deckId:TAROT_DECK_ID,deckVersion:TAROT_DECK_VERSION,orientationPolicyId:TAROT_ORIENTATION_POLICY_ID,orientationPolicyVersion:TAROT_ORIENTATION_POLICY_VERSION,spreadVersion:'1.0.0',projectionVersion:'1.0.0',timestamp:'2026-08-23T08:00:00.000Z'};

export function manualOne(cardId='RWS-MAJOR-00',sessionId='TAR-MANUAL-ONE') {
  return selectionRuntime.select({...base,inputMode:'MANUAL_SELECTION',sessionId,spreadId:'ONE_CARD',selectedCardIds:[cardId]});
}
export function manualThree(cardIds=['RWS-MAJOR-00','RWS-WANDS-ACE','RWS-CUPS-KING'],sessionId='TAR-MANUAL-THREE') {
  return selectionRuntime.select({...base,inputMode:'MANUAL_SELECTION',sessionId,spreadId:'THREE_CARD',selectedCardIds:cardIds});
}
export function systemRandomThree({seed='tarot-seed-v1',digest='aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',sessionId='TAR-RANDOM-THREE',replayToken='tarot-replay-v1'}={}) {
  return selectionRuntime.select({...base,inputMode:'SYSTEM_RANDOM',sessionId,spreadId:'THREE_CARD',seed,entropyEvidence:{source:'TEST_EXTERNAL_ENTROPY',digest},replayToken});
}
