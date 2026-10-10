/** PHI OS ICH-W8 adapter: I Ching HEXAGRAM mapping through the existing Shared Projection Runtime. */
import {
  createSharedProjectionRuntime,
  SHARED_PROJECTION_RUNTIME_CODE
} from '../method-runtime/shared-projection-runtime.js';
import {
  ICHING_ALGORITHM_CODE,
  ICHING_METHOD_CODE,
  ICHING_PLUGIN_CODE,
  ICHING_RUNTIME_CODE
} from './iching-runtime.js';

export const ICHING_HEXAGRAM_MAPPER_CODE = 'ICHING_HEXAGRAM_MAPPER';
export const ICHING_HEXAGRAM_MAPPER_VERSION = '1.0.0';

function assertIChingCalculationResult(result) {
  if (!result || result.runtimeCode !== 'SHARED_CALCULATION_RUNTIME' ||
      result.methodCode !== ICHING_METHOD_CODE || result.pluginCode !== ICHING_PLUGIN_CODE ||
      result.algorithmCode !== ICHING_ALGORITHM_CODE || result.deterministic !== true ||
      result.providerUsed !== false || result.aiUsed !== false || result.projectionCreated !== false) {
    throw new TypeError('INVALID_ICHING_CALCULATION_RESULT_FOR_PROJECTION');
  }
  const output=result.output;
  if (!output || output.runtimeCode !== ICHING_RUNTIME_CODE || output.sourceNeutral !== true ||
      output.deterministic !== true || output.projectionCreated !== false || output.productionEligible !== false) {
    throw new TypeError('INVALID_ICHING_STRUCTURAL_OUTPUT_FOR_PROJECTION');
  }
}

export const ICHING_HEXAGRAM_MAPPER = Object.freeze({
  mapperCode:ICHING_HEXAGRAM_MAPPER_CODE,
  mapperVersion:ICHING_HEXAGRAM_MAPPER_VERSION,
  projectionType:'HEXAGRAM',
  async map(output) {
    if (!output || output.runtimeCode !== ICHING_RUNTIME_CODE) throw new TypeError('ICHING_HEXAGRAM_MAPPER_INPUT_INVALID');
    return Object.freeze({
      value:Object.freeze({
        type:'HEXAGRAM',
        primary:structuredClone(output.primary),
        changingLines:Object.freeze([...output.changingLines]),
        relating:structuredClone(output.relating)
      }),
      confidence:Object.freeze({level:'exact',score:1,basis:'deterministic_mapping'})
    });
  }
});

export function createIChingHexagramProjector() {
  const shared=createSharedProjectionRuntime({mappers:[ICHING_HEXAGRAM_MAPPER]});
  return Object.freeze({
    async project({calculationResult, projectionVersion='1.0.0'}={}) {
      assertIChingCalculationResult(calculationResult);
      return shared.project({
        runtimeCode:SHARED_PROJECTION_RUNTIME_CODE,
        methodCode:ICHING_METHOD_CODE,
        pluginCode:ICHING_PLUGIN_CODE,
        mapperCode:ICHING_HEXAGRAM_MAPPER_CODE,
        mapperVersion:ICHING_HEXAGRAM_MAPPER_VERSION,
        projectionType:'HEXAGRAM',
        projectionVersion,
        calculationResult
      });
    }
  });
}
