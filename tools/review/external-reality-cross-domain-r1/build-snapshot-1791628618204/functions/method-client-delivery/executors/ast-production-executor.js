import {createAstAstronomyRuntime,AST_ASTRONOMY_RUNTIME_CODE} from '../../core-method-runtime/ast-astronomy-runtime.js';
import {createAstPlanetRuntime,AST_PLANET_RUNTIME_CODE} from '../../core-method-runtime/ast-planet-runtime.js';
import {createAstronomyEngineProductionAdapters} from '../production-adapters/astronomy-engine-production-adapter.js';
const BODY_CODES=Object.freeze(['SUN','MOON','MERCURY','VENUS','MARS','JUPITER','SATURN','URANUS','NEPTUNE','PLUTO']);
function record(id,type,payload){return Object.freeze({authority:'SHARED_DATA_AUTHORITY',status:'verified',methodOwner:null,pluginOwner:null,recordId:id,recordType:type,recordVersion:'1.0.0',payload:Object.freeze(payload)});}
function utcIso(input){const offset=input.timezone?.utcOffsetAtBirth;if(!input.birthDate||!input.birthTime||!offset)throw Object.assign(new Error('AST_CANONICAL_UTC_CONTEXT_INCOMPLETE'),{code:'AST_CANONICAL_UTC_CONTEXT_INCOMPLETE'});const d=new Date(`${input.birthDate}T${input.birthTime}${offset}`);if(Number.isNaN(d.valueOf()))throw Object.assign(new Error('AST_CANONICAL_UTC_CONTEXT_INVALID'),{code:'AST_CANONICAL_UTC_CONTEXT_INVALID'});return d.toISOString();}
export async function executeAstProductionMcd4({requestId,canonicalInput},{astronomyModuleLoader}={}){
  const adapters=createAstronomyEngineProductionAdapters({astronomyModuleLoader});
  const moment=record(`SDA-${requestId}-AST-MOMENT`,'NORMALIZED_BIRTH_MOMENT',{utcIso:utcIso(canonicalInput),timeScale:'UTC',uncertain:false});
  const astronomy=createAstAstronomyRuntime({astronomyAdapter:adapters.astronomyAdapter});
  const a=await astronomy.calculate({calculationId:`${requestId}-AST-W1`,runtimeCode:AST_ASTRONOMY_RUNTIME_CODE,executionMode:'validation',observerMode:'GEOCENTRIC',timeScale:'TT',referenceFrame:'ECLIPTIC_OF_DATE',inputRecords:[moment],referenceVersions:{mcdProductionAuthority:'MPA',productionAdapterBinding:'MCD_AST_PRODUCTION_SUCCESSOR_V1'}});
  const astronomyRecord=record(`SDA-${requestId}-AST-CONTEXT`,'AST_ASTRONOMY_CONTEXT',{...a.output,outputDigest:a.outputDigest});
  const planets=createAstPlanetRuntime({planetEphemerisAdapter:adapters.planetEphemerisAdapter});
  const p=await planets.calculate({calculationId:`${requestId}-AST-W2`,runtimeCode:AST_PLANET_RUNTIME_CODE,executionMode:'validation',planetSetCode:'PHI_OS_AST_PLANET_SET_CORE_10_V1',nodePolicyCode:'PHI_OS_AST_NODE_NONE_V1',retrogradePolicyCode:'PHI_OS_AST_LONGITUDE_SPEED_RETROGRADE_V1',precisionPolicyCode:'PHI_OS_AST_DECIMAL_12_V1',bodyCodes:[...BODY_CODES],inputRecords:[astronomyRecord],referenceVersions:{zodiacPolicyCode:'PHI_OS_AST_TROPICAL_ZODIAC_V1',normalizationPolicyCode:'PHI_OS_AST_LONGITUDE_0_360_V1',mcdProductionAuthority:'MPA',productionAdapterBinding:'MCD_AST_PRODUCTION_SUCCESSOR_V1'}});
  return Object.freeze({coreExecutionPerformed:true,coreHistoricalExecutionMode:'validation',executedStages:Object.freeze(['AST_ASTRONOMY_CONTEXT','AST_PLANET_EPHEMERIS_CORE_10']),deferredStages:Object.freeze([]),reasonCodes:Object.freeze(['AST_CORE_10_PRODUCTION_ADAPTER_EXECUTED','AST_HOUSES_ASPECTS_NODES_OUT_OF_SCOPE']),coreResults:Object.freeze([a,p])});
}
