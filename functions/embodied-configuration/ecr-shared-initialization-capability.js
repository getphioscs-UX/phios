// Neutral capability adapter only. The existing AST and solar-arc owners calculate.
import {createHdrInternalAstronomyAdapter} from '../professional/hdr-internal/hdr-internal-astronomy-adapter.js';
import {createHdrDesignMomentRuntime,HDR_DESIGN_MOMENT_RUNTIME_CODE} from '../core-method-runtime/hdr-design-moment-runtime.js';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
export function createEcrSharedInitializationCapability(options={}){
 const astronomy=createHdrInternalAstronomyAdapter(options);
 const solver=createHdrDesignMomentRuntime({solarLongitudeAdapter:{adapterCode:'PHI_SHARED_SOLAR_ARC',adapterVersion:astronomy.adapterVersion,ephemerisVersion:astronomy.engineVersion,providerUsed:false,aiUsed:false,sunLongitudeAt:args=>astronomy.sunLongitudeAt(args)}});
 return Object.freeze({astronomy,async priorDesign(personality){
  const result=await solver.solve({calculationId:`ECR-DESIGN-${await sha256Stable(personality)}`,runtimeCode:HDR_DESIGN_MOMENT_RUNTIME_CODE,ephemerisVersion:astronomy.engineVersion,inputRecords:[{authority:'SHARED_DATA_AUTHORITY',status:'verified',methodOwner:null,pluginOwner:null,recordId:'ECR-BIRTH-ASTRONOMY',recordType:'HDR_PERSONALITY_ASTRONOMY',recordVersion:'1',payload:{utcIso:personality.utcIso,longitudes:personality.longitudes,deterministic:true,providerUsed:false,aiUsed:false,designMomentCreated:false,gateMappingCreated:false,bodyGraphCreated:false,projectionCreated:false,interpretationCreated:false,professionalConclusionCreated:false}}]});
  return {instantUTC:result.output.designUtcIso,solver:result.output.solver,sourceAuthority:HDR_DESIGN_MOMENT_RUNTIME_CODE,outputDigest:result.outputDigest,fixedDaySubtractionUsed:false};
 }});
}
