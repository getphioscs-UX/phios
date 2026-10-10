import fs from 'node:fs';
import {createTarotRuntime,TAROT_RUNTIME_CODE} from '../../../functions/core-method-runtime/tarot-runtime.js';
import {createTarotCardProjector} from '../../../functions/core-method-runtime/tarot-card-projection-mapper.js';
import {tarotAuthorities,manualOne,manualThree} from './tarot-fixtures-v1.mjs';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
export const tariAuthorities=Object.freeze({
  ...tarotAuthorities,
  sourceRegistry:j('content/interpretation/tarot/registries/tarot-source-registry-v1.json'),
  perspectiveRegistry:j('content/interpretation/tarot/registries/tarot-interpretation-perspective-registry-v1.json'),
  symbolDimensionRegistry:j('content/interpretation/tarot/registries/tarot-symbol-dimension-registry-v1.json'),
  corpus:j('content/interpretation/tarot/corpus/tarot-minimum-source-bound-corpus-v1.json')
});
export async function projectOne(cardId='RWS-MAJOR-00',prefix='TARI-ONE'){
  const evidence=await manualOne(cardId,`${prefix}-SESSION`);
  const results=await createTarotRuntime(tarotAuthorities).calculateSpread({runtimeCode:TAROT_RUNTIME_CODE,calculationIdPrefix:`${prefix}-CALC`,evidence});
  const projections=await createTarotCardProjector().projectSpread({calculationResults:results,projectionVersion:'1.0.0'});
  return projections;
}
export async function projectThree(cardIds=['RWS-MAJOR-00','RWS-MAJOR-01','RWS-WANDS-ACE'],prefix='TARI-THREE'){
  const evidence=await manualThree(cardIds,`${prefix}-SESSION`);
  const results=await createTarotRuntime(tarotAuthorities).calculateSpread({runtimeCode:TAROT_RUNTIME_CODE,calculationIdPrefix:`${prefix}-CALC`,evidence});
  return createTarotCardProjector().projectSpread({calculationResults:results,projectionVersion:'1.0.0'});
}
