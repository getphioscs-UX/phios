import {renderMir4MethodProjection,renderMir4CrossMethodComposition,renderMir4PersonalStructureProjection} from './mir4-renderer-runtime.js';
export const MIR4_CLIENT_SURFACE_VERSION='MIR-4-CLIENT-RESULT-SURFACE-v1.0.0';
export const MIR4_CLIENT_TABS=Object.freeze(['overview','astrology','bazi','numeric','comparison','personal-structure','reading']);
const METHOD_TAB=Object.freeze({ASTROLOGY_PROJECTION:'astrology',BAZI_PROJECTION:'bazi',NUMEROLOGY_PROJECTION:'numeric'});
function safeUnavailable(code,reason){return Object.freeze({status:'UNAVAILABLE',code,reason});}
export function composeMir4ClientResultSurface({methodProjections=[],crossMethodComposition=null,personalStructureProjection=null,personalStructureReadiness=null,locale='en',validationMode=false}={}){
  const panels={}; const renderedMethods=[];
  for(const p of methodProjections){const tab=METHOD_TAB[p?.method?.publicMethodCode];if(!tab)continue;const rendered=renderMir4MethodProjection(p,{locale});panels[tab]=rendered;renderedMethods.push({tab,status:rendered.status,projectionId:p.projectionId});}
  panels.comparison=crossMethodComposition?renderMir4CrossMethodComposition(crossMethodComposition,{locale}):safeUnavailable('CROSS_METHOD_COMPOSITION_NOT_SUPPLIED','Renderer cannot create convergence/divergence classifications.');
  const coreReady=personalStructureReadiness?.currentFullCoreProductionReady===true;
  panels['personal-structure']=(!coreReady&&!validationMode)?safeUnavailable('PERSONAL_STRUCTURE_UPSTREAM_CAPABILITY_NOT_READY','Current upstream core capability is not fully ready; renderer does not bypass readiness.'):(personalStructureProjection?renderMir4PersonalStructureProjection(personalStructureProjection,{locale}):safeUnavailable('PERSONAL_STRUCTURE_PROJECTION_NOT_SUPPLIED','An upstream Personal Structure projection is required.'));
  panels.reading=Object.freeze({status:'HANDOFF_ONLY',calculationAllowed:false,interpretationAllowed:false,meaningAllowed:false,target:'MIR-8_GUIDED_READING',sourceProjectionRefs:renderedMethods.map(x=>x.projectionId)});
  panels.overview=Object.freeze({status:'COMPOSED',renderedMethods,comparisonStatus:panels.comparison.status,personalStructureStatus:panels['personal-structure'].status,readingStatus:panels.reading.status});
  return Object.freeze({schemaVersion:'PHI-OS-MIR-4-CLIENT-RESULT-SURFACE-v1.0.0',surfaceVersion:MIR4_CLIENT_SURFACE_VERSION,tabs:MIR4_CLIENT_TABS,panels:Object.freeze(panels),readingIsInterpretationRuntime:false,productionAuthorityCreated:false,calculationAuthorityCreated:false,projectionAuthorityCreated:false});
}
