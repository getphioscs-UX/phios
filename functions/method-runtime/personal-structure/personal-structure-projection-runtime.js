/** MIR-3 PHI OS Personal Structure canonical projection using SHARED_PROJECTION_RUNTIME only. */
import {createSharedProjectionRuntime,SHARED_PROJECTION_RUNTIME_CODE} from '../shared-projection-runtime.js';
const exact=value=>Object.freeze({value,confidence:Object.freeze({level:'exact',score:1,basis:'deterministic_mapping'})});
const mappers=[
  {mapperCode:'PHI_OS_PS_GATE_PROJECTION',mapperVersion:'1.0.0',projectionType:'GATE',map:o=>exact({activations:o.activations,unknownAllowed:true})},
  {mapperCode:'PHI_OS_PS_CHANNEL_PROJECTION',mapperVersion:'1.0.0',projectionType:'CHANNEL',map:o=>exact({connections:o.activatedChannels,hangingGates:o.hangingGates})},
  {mapperCode:'PHI_OS_PS_CENTER_PROJECTION',mapperVersion:'1.0.0',projectionType:'CENTER',map:o=>exact({definedCenters:o.definedCenters,undefinedCenters:o.undefinedCenters,connectedComponents:o.connectedComponents,typeCode:o.typeCode,projectorSubtype:o.projectorSubtype,definition:o.definition})},
  {mapperCode:'PHI_OS_PS_AUTHORITY_PROJECTION',mapperVersion:'1.0.0',projectionType:'AUTHORITY',map:o=>exact({authorityCode:o.authorityCode,typeCode:o.typeCode})},
  {mapperCode:'PHI_OS_PS_PROFILE_PROJECTION',mapperVersion:'1.0.0',projectionType:'PROFILE',map:o=>exact({profile:o.profile,incarnationConfiguration:o.incarnation,legacyTitleIncluded:false})}
].map(Object.freeze);
const shared=createSharedProjectionRuntime({mappers});
export async function projectPersonalStructure(calculationResult,{projectionVersion='PHI-OS-PERSONAL-STRUCTURE-PROJECTION-v1.0.0'}={}){const out=[];for(const m of mappers)out.push(await shared.project({runtimeCode:SHARED_PROJECTION_RUNTIME_CODE,methodCode:'PHI_OS_PERSONAL_STRUCTURE',pluginCode:'PERSONAL_STRUCTURE',mapperCode:m.mapperCode,mapperVersion:m.mapperVersion,projectionType:m.projectionType,projectionVersion,calculationResult}));return Object.freeze({schemaVersion:'PHI-OS-PERSONAL-STRUCTURE-PROJECTION-BUNDLE-v1.0.0',publicVocabulary:'PHI_OS_ONLY',sourceCalculationId:calculationResult.calculationId,projections:Object.freeze(out),interpretationIncluded:false,meaningAuthorityCreated:false,legacyBrandedSurface:false});}
