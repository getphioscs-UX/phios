/** ASTA-W4-W9 Production calculation successors. Calculation only: no meaning, no interpretation. */
import {createSharedCalculationRuntime,SHARED_CALCULATION_RUNTIME_CODE} from '../method-runtime/shared-calculation-runtime.js';
import {createAstronomyEngineLunarNodeAdapter,AST_TRUE_NODE_CONVENTION} from '../core-method-runtime/ast-lunar-node-adapter.js';
import {
 ASTA_HOUSE_SYSTEM_CODE,ASTA_ANGLE_POLICY_CODE,ASTA_NODE_POLICY_CODE,ASTA_ASPECT_SET_CODE,ASTA_ASPECT_POLICY_CODE,
 ASTA_PRECISION_POLICY_CODE,ASTA_ZODIAC_POLICY_CODE,ASTA_CORE_BODY_CODES,ASTA_ASPECT_POLICY
} from './ast-production-policy.js';

export const ASTA_NODE_ALGORITHM_CODE='AST_TRUE_LUNAR_NODE_PUBLIC_V1';
export const ASTA_ANGLE_HOUSE_ALGORITHM_CODE='AST_ANGLE_HOUSE_STRUCTURE_V1';
export const ASTA_ASPECT_ALGORITHM_CODE='AST_MAJOR_ASPECT_STRUCTURE_V1';
export const ASTA_RUNTIME_VERSION='1.0.0';
const RAD=Math.PI/180,DEG=180/Math.PI;
function norm(v){if(!Number.isFinite(v))throw new TypeError('ASTA_LONGITUDE_FINITE_REQUIRED');return Number((((v%360)+360)%360).toFixed(12));}
function obj(v,msg){if(!v||typeof v!=='object'||Array.isArray(v))throw new TypeError(msg);return v;}
function sharedRecord(id,type,payload){return Object.freeze({authority:'SHARED_DATA_AUTHORITY',status:'verified',methodOwner:null,pluginOwner:null,recordId:id,recordType:type,recordVersion:'1.0.0',payload:Object.freeze(structuredClone(payload))});}
function byType(records,type){return records.find(x=>x.recordType===type)?.payload||null;}
function jdFromUtc(utcIso){const ms=Date.parse(utcIso);if(!Number.isFinite(ms))throw new TypeError('ASTA_VALID_UTC_REQUIRED');return ms/86400000+2440587.5;}
function meanObliquity(jd){const t=(jd-2451545)/36525;return 23+26/60+(21.448-46.815*t-0.00059*t*t+0.001813*t*t*t)/3600;}
function gmst(jd){const t=(jd-2451545)/36525;return norm(280.46061837+360.98564736629*(jd-2451545)+0.000387933*t*t-(t*t*t)/38710000);}
function calculateAngles(utcIso,latitude,longitude){
 if(!Number.isFinite(latitude)||latitude<-90||latitude>90)throw new TypeError('ASTA_LATITUDE_INVALID');
 if(!Number.isFinite(longitude)||longitude<-180||longitude>180)throw new TypeError('ASTA_LONGITUDE_INVALID');
 const jd=jdFromUtc(utcIso),eps=meanObliquity(jd),lst=norm(gmst(jd)+longitude),th=lst*RAD,e=eps*RAD,phi=latitude*RAD;
 // Meeus horizon/ecliptic intersection, eastern solution.
 const ascRaw=Math.atan2(Math.cos(th),-(Math.sin(th)*Math.cos(e)+Math.tan(phi)*Math.sin(e)))*DEG;
 const asc=norm(ascRaw);
 // Ecliptic longitude whose right ascension is local sidereal time, same quadrant as RAMC.
 const mc=norm(Math.atan2(Math.sin(th)/Math.cos(e),Math.cos(th))*DEG);
 return Object.freeze({julianDayUtc:Number(jd.toFixed(9)),gmstDegrees:gmst(jd),localSiderealTimeDegrees:lst,meanObliquityDegrees:Number(eps.toFixed(12)),ascendantLongitude:asc,midheavenLongitude:mc,descendantLongitude:norm(asc+180),imumCoeliLongitude:norm(mc+180)});
}
function wholeSignCusps(asc){const first=Math.floor(norm(asc)/30)*30;return Object.freeze(Array.from({length:12},(_,i)=>Object.freeze({houseNumber:i+1,longitude:norm(first+i*30)})));}
function houseNumberFor(longitude,house1){return (Math.floor(norm(longitude-house1)/30)%12)+1;}
function placements(points,cusps){const h1=cusps[0].longitude;return Object.freeze(points.map(p=>Object.freeze({bodyCode:p.bodyCode,houseNumber:houseNumberFor(p.longitude,h1)})));}
function separation(a,b){let d=Math.abs(norm(a)-norm(b));if(d>180)d=360-d;return Number(d.toFixed(12));}
function aspectMatch(sep){const candidates=ASTA_ASPECT_POLICY.map(p=>({...p,orb:Number(Math.abs(sep-p.angleDegrees).toFixed(12))})).filter(x=>x.orb<=x.orbDegrees).sort((a,b)=>a.orb-b.orb||a.priority-b.priority);return candidates[0]||null;}

export function canonicalUtcIso(input){
 const offset=input?.timezone?.utcOffsetAtBirth;
 if(!input?.birthDate||!input?.birthTime||typeof offset!=='string')throw Object.assign(new Error('AST_CANONICAL_UTC_CONTEXT_INCOMPLETE'),{code:'AST_CANONICAL_UTC_CONTEXT_INCOMPLETE'});
 const d=new Date(`${input.birthDate}T${input.birthTime}${offset}`);if(Number.isNaN(d.valueOf()))throw Object.assign(new Error('AST_CANONICAL_UTC_CONTEXT_INVALID'),{code:'AST_CANONICAL_UTC_CONTEXT_INVALID'});return d.toISOString();
}

export function createAstStructuralProductionRuntime({astronomyModuleLoader}={}){
 const nodeAdapter=createAstronomyEngineLunarNodeAdapter({moduleLoader:astronomyModuleLoader});
 const nodeAlgorithm=Object.freeze({algorithmCode:ASTA_NODE_ALGORITHM_CODE,algorithmVersion:'1.0.0',async calculate(records){const birth=byType(records,'ASTA_BIRTH_CONTEXT');obj(birth,'ASTA birth context required');const node=await nodeAdapter.calculateTrueNode(birth.utcIso);return Object.freeze({schemaVersion:'PHI-OS-ASTA-NODE-RESULT-v1.0.0',nodePolicyCode:ASTA_NODE_POLICY_CODE,nodeConvention:AST_TRUE_NODE_CONVENTION,referenceFrame:node.referenceFrame,observerMode:node.observerMode,positions:Object.freeze([{bodyCode:'NORTH_NODE',longitude:norm(node.northNodeLongitude),nodeType:'TRUE_NORTH_NODE'},{bodyCode:'SOUTH_NODE',longitude:norm(node.southNodeLongitude),nodeType:'TRUE_SOUTH_NODE'}]),deterministic:true,providerUsed:false,aiUsed:false,projectionCreated:false,meaningCreated:false});}});
 const houseAlgorithm=Object.freeze({algorithmCode:ASTA_ANGLE_HOUSE_ALGORITHM_CODE,algorithmVersion:'1.0.0',async calculate(records){const birth=byType(records,'ASTA_BIRTH_CONTEXT'),points=byType(records,'ASTA_PROJECTABLE_POINTS');obj(birth,'ASTA birth context required');obj(points,'ASTA points required');const angles=calculateAngles(birth.utcIso,birth.latitude,birth.longitude),cusps=wholeSignCusps(angles.ascendantLongitude),place=placements(points.positions,cusps);return Object.freeze({schemaVersion:'PHI-OS-ASTA-ANGLE-HOUSE-RESULT-v1.0.0',houseSystemCode:ASTA_HOUSE_SYSTEM_CODE,zodiacPolicyCode:ASTA_ZODIAC_POLICY_CODE,anglePolicyCode:ASTA_ANGLE_POLICY_CODE,precisionPolicyCode:ASTA_PRECISION_POLICY_CODE,angles,cusps,placements:place,deterministic:true,providerUsed:false,aiUsed:false,projectionCreated:false,meaningCreated:false});}});
 const aspectAlgorithm=Object.freeze({algorithmCode:ASTA_ASPECT_ALGORITHM_CODE,algorithmVersion:'1.0.0',async calculate(records){const points=byType(records,'ASTA_PROJECTABLE_POINTS');obj(points,'ASTA points required');const byCode=new Map(points.positions.filter(p=>ASTA_CORE_BODY_CODES.includes(p.bodyCode)).map(p=>[p.bodyCode,p]));const matches=[];for(let i=0;i<ASTA_CORE_BODY_CODES.length;i++)for(let j=i+1;j<ASTA_CORE_BODY_CODES.length;j++){const a=byCode.get(ASTA_CORE_BODY_CODES[i]),b=byCode.get(ASTA_CORE_BODY_CODES[j]);if(!a||!b)continue;const sep=separation(a.longitude,b.longitude),m=aspectMatch(sep);if(m)matches.push(Object.freeze({fromCode:a.bodyCode,toCode:b.bodyCode,aspectCode:m.aspectCode,exactAngleDegrees:m.angleDegrees,separationDegrees:sep,orbDegrees:m.orb,authorizedOrbDegrees:m.orbDegrees,applyingState:'UNDETERMINED'}));}return Object.freeze({schemaVersion:'PHI-OS-ASTA-ASPECT-RESULT-v1.0.0',aspectSetCode:ASTA_ASPECT_SET_CODE,aspectPolicyCode:ASTA_ASPECT_POLICY_CODE,bodyScope:'CORE_10_PLANETS_ONLY',applyingSeparatingPolicy:'NOT_COMPUTED_V1',aspects:Object.freeze(matches),deterministic:true,providerUsed:false,aiUsed:false,projectionCreated:false,meaningCreated:false});}});
 const shared=createSharedCalculationRuntime({algorithms:[nodeAlgorithm,houseAlgorithm,aspectAlgorithm]});
 return Object.freeze({
  async calculate({requestId,canonicalInput,planetBodies}){
   const utcIso=canonicalUtcIso(canonicalInput);const birth=sharedRecord(`SDA-${requestId}-ASTA-BIRTH`,'ASTA_BIRTH_CONTEXT',{utcIso,latitude:canonicalInput.birthPlace?.latitude,longitude:canonicalInput.birthPlace?.longitude});
   const node=await shared.execute({calculationId:`${requestId}-ASTA-NODE`,runtimeCode:SHARED_CALCULATION_RUNTIME_CODE,methodCode:'ASTROLOGY',pluginCode:'AST',algorithmCode:ASTA_NODE_ALGORITHM_CODE,algorithmVersion:'1.0.0',inputRecords:[birth],referenceVersions:{nodePolicyCode:ASTA_NODE_POLICY_CODE,nodeConvention:AST_TRUE_NODE_CONVENTION,engineCode:'ASTRONOMY_ENGINE_JS',engineVersion:'2.1.19'}});
   const nodePositions=node.output.positions;const pointPositions=[...planetBodies.map(p=>({bodyCode:p.bodyCode,longitude:p.longitude})),...nodePositions.map(p=>({bodyCode:p.bodyCode,longitude:p.longitude}))];const points=sharedRecord(`SDA-${requestId}-ASTA-POINTS`,'ASTA_PROJECTABLE_POINTS',{positions:pointPositions});
   const hasCoordinates=Number.isFinite(canonicalInput.birthPlace?.latitude)&&Number.isFinite(canonicalInput.birthPlace?.longitude);
   const house=hasCoordinates?await shared.execute({calculationId:`${requestId}-ASTA-HOUSE`,runtimeCode:SHARED_CALCULATION_RUNTIME_CODE,methodCode:'ASTROLOGY',pluginCode:'AST',algorithmCode:ASTA_ANGLE_HOUSE_ALGORITHM_CODE,algorithmVersion:'1.0.0',inputRecords:[birth,points],referenceVersions:{houseSystemCode:ASTA_HOUSE_SYSTEM_CODE,anglePolicyCode:ASTA_ANGLE_POLICY_CODE,zodiacPolicyCode:ASTA_ZODIAC_POLICY_CODE,precisionPolicyCode:ASTA_PRECISION_POLICY_CODE}}):null;
   const aspects=await shared.execute({calculationId:`${requestId}-ASTA-ASPECT`,runtimeCode:SHARED_CALCULATION_RUNTIME_CODE,methodCode:'ASTROLOGY',pluginCode:'AST',algorithmCode:ASTA_ASPECT_ALGORITHM_CODE,algorithmVersion:'1.0.0',inputRecords:[points],referenceVersions:{aspectSetCode:ASTA_ASPECT_SET_CODE,aspectPolicyCode:ASTA_ASPECT_POLICY_CODE,applyingSeparatingPolicy:'NOT_COMPUTED_V1'}});
   return Object.freeze({node,house,aspects,hasCoordinates,reasonCodes:Object.freeze(hasCoordinates?[]:['AST_HOUSES_ANGLES_NOT_CALCULATED_COORDINATES_REQUIRED'])});
  }
 });
}
