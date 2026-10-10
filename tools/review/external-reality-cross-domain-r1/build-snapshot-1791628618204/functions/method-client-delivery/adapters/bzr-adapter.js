import {createBzrSolarCalendarRuntime,BZR_SOLAR_CALENDAR_RUNTIME_CODE} from '../../core-method-runtime/bzr-solar-calendar-runtime.js';
import {createBzrFourPillarsRuntime,BZR_FOUR_PILLARS_RUNTIME_CODE} from '../../core-method-runtime/bzr-four-pillars-runtime.js';
import {createBzrLuckCycleRuntime,BZR_LUCK_CYCLE_RUNTIME_CODE} from '../../core-method-runtime/bzr-luck-cycle-runtime.js';
import {createBzrProjectionNormalizationRuntime,BZR_PROJECTION_NORMALIZATION_RUNTIME_CODE} from '../../core-method-runtime/bzr-projection-normalization-runtime.js';
import {createBzrProjectionRuntime,BZR_PROJECTION_RUNTIME_CODE} from '../../core-method-runtime/bzr-projection-runtime.js';
export const BZR_MCD_ADAPTER_CODE='MCD_BZR_ADAPTER';
export function probeBzrAdapterBinding(){
  const factories=[createBzrSolarCalendarRuntime,createBzrFourPillarsRuntime,createBzrLuckCycleRuntime,createBzrProjectionNormalizationRuntime,createBzrProjectionRuntime];
  if(factories.some(x=>typeof x!=='function')) throw new Error('BZR_CORE_RUNTIME_FACTORY_BINDING_INVALID');
  return Object.freeze({adapterCode:BZR_MCD_ADAPTER_CODE,methodCode:'BAZI',pluginCode:'BZR',registrationStatus:'REGISTERED_PRODUCTION_AUTHORIZED_BINDING',
    coreRuntimeCodes:Object.freeze([BZR_SOLAR_CALENDAR_RUNTIME_CODE,BZR_FOUR_PILLARS_RUNTIME_CODE,BZR_LUCK_CYCLE_RUNTIME_CODE,BZR_PROJECTION_NORMALIZATION_RUNTIME_CODE,BZR_PROJECTION_RUNTIME_CODE]),coreFactoriesBound:true,customerCalculationActive:false});
}
export async function dispatchBzrAdapter(){
  probeBzrAdapterBinding();
  throw Object.assign(new Error('MCD_CANONICAL_INPUT_NOT_ESTABLISHED'),{code:'MCD_CANONICAL_INPUT_NOT_ESTABLISHED',nextWork:'MCD-3'});
}
