import {createNumBirthNumberRuntime,NUM_BIRTH_NUMBER_RUNTIME_CODE} from '../../core-method-runtime/num-birth-number-runtime.js';
import {createNumNumberStructureRuntime,NUM_NUMBER_STRUCTURE_RUNTIME_CODE} from '../../core-method-runtime/num-number-structure-runtime.js';
import {createNumCycleRuntime,NUM_CYCLE_RUNTIME_CODE} from '../../core-method-runtime/num-cycle-runtime.js';
import {createNumProjectionRuntime,NUM_PROJECTION_RUNTIME_CODE} from '../../core-method-runtime/num-projection-runtime.js';
export const NUM_MCD_ADAPTER_CODE='MCD_NUM_ADAPTER';
export function probeNumAdapterBinding(){
  const factories=[createNumBirthNumberRuntime,createNumNumberStructureRuntime,createNumCycleRuntime,createNumProjectionRuntime];
  if(factories.some(x=>typeof x!=='function')) throw new Error('NUM_CORE_RUNTIME_FACTORY_BINDING_INVALID');
  return Object.freeze({adapterCode:NUM_MCD_ADAPTER_CODE,methodCode:'NUMEROLOGY',pluginCode:'NUM',registrationStatus:'REGISTERED_PRODUCTION_AUTHORIZED_BINDING',
    coreRuntimeCodes:Object.freeze([NUM_BIRTH_NUMBER_RUNTIME_CODE,NUM_NUMBER_STRUCTURE_RUNTIME_CODE,NUM_CYCLE_RUNTIME_CODE,NUM_PROJECTION_RUNTIME_CODE]),coreFactoriesBound:true,customerCalculationActive:false});
}
export async function dispatchNumAdapter(){
  probeNumAdapterBinding();
  throw Object.assign(new Error('MCD_CANONICAL_INPUT_NOT_ESTABLISHED'),{code:'MCD_CANONICAL_INPUT_NOT_ESTABLISHED',nextWork:'MCD-3'});
}
