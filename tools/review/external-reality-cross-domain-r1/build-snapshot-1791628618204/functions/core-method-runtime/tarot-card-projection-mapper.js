/** PHI OS TAR-W9: CARD mapper through the existing Shared Projection Runtime. */
import { createSharedProjectionRuntime, SHARED_PROJECTION_RUNTIME_CODE } from '../method-runtime/shared-projection-runtime.js';
import { TAROT_ALGORITHM_CODE, TAROT_RUNTIME_CODE } from './tarot-runtime.js';
import { TAROT_METHOD_CODE, TAROT_PLUGIN_CODE } from './tarot-selection-runtime.js';

export const TAROT_CARD_MAPPER_CODE='TAROT_CARD_MAPPER';
export const TAROT_CARD_MAPPER_VERSION='1.0.0';

function assertTarotCalculationResult(result) {
  if (!result || result.runtimeCode !== 'SHARED_CALCULATION_RUNTIME' || result.methodCode !== TAROT_METHOD_CODE || result.pluginCode !== TAROT_PLUGIN_CODE || result.algorithmCode !== TAROT_ALGORITHM_CODE || result.deterministic !== true || result.providerUsed !== false || result.aiUsed !== false || result.projectionCreated !== false) throw new TypeError('INVALID_TAROT_CALCULATION_RESULT_FOR_PROJECTION');
  const o=result.output;
  if (!o || o.runtimeCode !== TAROT_RUNTIME_CODE || o.sourceNeutral !== true || o.deterministic !== true || o.projectionCreated !== false || o.productionEligible !== false || !o.deck?.deckId || !o.deck?.deckVersion || !o.card?.cardIdentity || o.orientation !== 'UPRIGHT' || !o.position?.positionId) throw new TypeError('INVALID_TAROT_STRUCTURAL_OUTPUT_FOR_PROJECTION');
}

export const TAROT_CARD_MAPPER=Object.freeze({
  mapperCode:TAROT_CARD_MAPPER_CODE,mapperVersion:TAROT_CARD_MAPPER_VERSION,projectionType:'CARD',
  async map(output) {
    if (!output || output.runtimeCode !== TAROT_RUNTIME_CODE) throw new TypeError('TAROT_CARD_MAPPER_INPUT_INVALID');
    return Object.freeze({value:Object.freeze({type:'CARD',deck:structuredClone(output.deck),card:structuredClone(output.card),orientation:output.orientation,position:structuredClone(output.position)}),confidence:Object.freeze({level:'exact',score:1,basis:'deterministic_mapping'})});
  }
});

export function createTarotCardProjector() {
  const shared=createSharedProjectionRuntime({mappers:[TAROT_CARD_MAPPER]});
  return Object.freeze({
    async project({calculationResult,projectionVersion='1.0.0'}={}) {
      assertTarotCalculationResult(calculationResult);
      return shared.project({runtimeCode:SHARED_PROJECTION_RUNTIME_CODE,methodCode:TAROT_METHOD_CODE,pluginCode:TAROT_PLUGIN_CODE,mapperCode:TAROT_CARD_MAPPER_CODE,mapperVersion:TAROT_CARD_MAPPER_VERSION,projectionType:'CARD',projectionVersion,calculationResult});
    },
    async projectSpread({calculationResults,projectionVersion='1.0.0'}={}) {
      if (!Array.isArray(calculationResults) || ![1,3].includes(calculationResults.length)) throw new TypeError('TAROT_SPREAD_CALCULATION_RESULTS_REQUIRED');
      return Object.freeze(await Promise.all(calculationResults.map(calculationResult=>this.project({calculationResult,projectionVersion}))));
    }
  });
}
