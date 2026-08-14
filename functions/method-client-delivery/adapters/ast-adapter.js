import {createAstAstronomyRuntime,AST_ASTRONOMY_RUNTIME_CODE} from '../../core-method-runtime/ast-astronomy-runtime.js';
import {createAstPlanetRuntime,AST_PLANET_RUNTIME_CODE} from '../../core-method-runtime/ast-planet-runtime.js';
export const AST_MCD_ADAPTER_CODE='MCD_AST_ADAPTER';
export function probeAstAdapterBinding(){
  if(typeof createAstAstronomyRuntime!=='function'||typeof createAstPlanetRuntime!=='function') throw new Error('AST_CORE_RUNTIME_FACTORY_BINDING_INVALID');
  return Object.freeze({adapterCode:AST_MCD_ADAPTER_CODE,methodCode:'ASTROLOGY',pluginCode:'AST',registrationStatus:'REGISTERED_PRODUCTION_AUTHORIZED_BINDING',
    coreRuntimeCodes:Object.freeze([AST_ASTRONOMY_RUNTIME_CODE,AST_PLANET_RUNTIME_CODE]),coreFactoriesBound:true,customerCalculationActive:false});
}
export async function dispatchAstAdapter(){
  probeAstAdapterBinding();
  throw Object.assign(new Error('MCD_CANONICAL_INPUT_NOT_ESTABLISHED'),{code:'MCD_CANONICAL_INPUT_NOT_ESTABLISHED',nextWork:'MCD-3'});
}
