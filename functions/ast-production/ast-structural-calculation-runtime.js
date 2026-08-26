/** ASTA-W4-W9 Production calculation successors. Calculation only: no meaning, no interpretation. */
import {createSharedCalculationRuntime,SHARED_CALCULATION_RUNTIME_CODE} from '../method-runtime/shared-calculation-runtime.js';
import {createAstronomyEngineLunarNodeAdapter,AST_TRUE_NODE_CONVENTION} from '../core-method-runtime/ast-lunar-node-adapter.js';
import {
 ASTA_ANGLE_POLICY_CODE,ASTA_NODE_POLICY_CODE,ASTA_ASPECT_SET_CODE,ASTA_ASPECT_POLICY_CODE,
 ASTA_PRECISION_POLICY_CODE,ASTA_ZODIAC_POLICY_CODE,ASTA_CORE_BODY_CODES,ASTA_ASPECT_POLICY,
 ASTA_DEFAULT_HOUSE_SYSTEM_CODE,ASTA_HOUSE_SYSTEM_PLACIDUS,ASTA_HOUSE_SYSTEM_WHOLE_SIGN,getAstHouseSystemPolicy
} from './ast-production-policy.js';

export const ASTA_NODE_ALGORITHM_CODE='AST_TRUE_LUNAR_NODE_PUBLIC_V1';
export const ASTA_ANGLE_HOUSE_ALGORITHM_CODE='AST_ANGLE_HOUSE_STRUCTURE_V2';
export const ASTA_ASPECT_ALGORITHM_CODE='AST_MAJOR_ASPECT_STRUCTURE_V1';
export const ASTA_RUNTIME_VERSION='1.1.0';
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
 const ascRaw=Math.atan2(Math.cos(th),-(Math.sin(th)*Math.cos(e)+Math.tan(phi)*Math.sin(e)))*DEG;
 const asc=norm(ascRaw);
 const mc=norm(Math.atan2(Math.sin(th)/Math.cos(e),Math.cos(th))*DEG);
 return Object.freeze({julianDayUtc:Number(jd.toFixed(9)),gmstDegrees:gmst(jd),localSiderealTimeDegrees:lst,meanObliquityDegrees:Number(eps.toFixed(12)),ascendantLongitude:asc,midheavenLongitude:mc,descendantLongitude:norm(asc+180),imumCoeliLongitude:norm(mc+180)});
}
function wholeSignCusps(asc){const first=Math.floor(norm(asc)/30)*30;return Object.freeze(Array.from({length:12},(_,i)=>Object.freeze({houseNumber:i+1,longitude:norm(first+i*30)})));}
function signedDelta(a,b){let d=norm(a-b);if(d>180)d-=360;return d;}
function raToEclipticLongitude(raDegrees,epsDegrees){const ra=raDegrees*RAD,eps=epsDegrees*RAD;return norm(Math.atan2(Math.sin(ra),Math.cos(ra)*Math.cos(eps))*DEG);}
function placidusIntermediateCusp({houseNumber,armc,latitude,obliquity}){
 const phi=latitude*RAD,eps=obliquity*RAD;
 const config={11:{initial:30,divisor:3,upper:true},12:{initial:60,divisor:1.5,upper:true},2:{initial:120,divisor:1.5,upper:false},3:{initial:150,divisor:3,upper:false}}[houseNumber];
 if(!config)throw new TypeError('ASTA_PLACIDUS_INTERMEDIATE_HOUSE_INVALID');
 let ra=norm(armc+config.initial);
 for(let i=0;i<64;i++){
   const r=ra*RAD;
   let arg=(config.upper?-1:1)*Math.sin(r)*Math.tan(eps)*Math.tan(phi);
   if(arg>1+1e-12||arg<-1-1e-12)throw Object.assign(new Error('ASTA_PLACIDUS_UNDEFINED_AT_LATITUDE'),{code:'ASTA_PLACIDUS_UNDEFINED_AT_LATITUDE'});
   arg=Math.max(-1,Math.min(1,arg));
   const arc=Math.acos(arg)*DEG/config.divisor;
   const next=norm((config.upper?armc:armc+180)+(config.upper?arc:-arc));
   if(Math.abs(signedDelta(next,ra))<1e-10){ra=next;break;}
   ra=next;
   if(i===63)throw Object.assign(new Error('ASTA_PLACIDUS_ITERATION_DID_NOT_CONVERGE'),{code:'ASTA_PLACIDUS_ITERATION_DID_NOT_CONVERGE'});
 }
 return raToEclipticLongitude(ra,obliquity);
}
export function placidusCusps(angles,latitude){
 if(Math.abs(latitude)>=66.5625)throw Object.assign(new Error('ASTA_PLACIDUS_POLAR_LIMIT'),{code:'ASTA_PLACIDUS_POLAR_LIMIT'});
 const armc=angles.localSiderealTimeDegrees,eps=angles.meanObliquityDegrees;
 const c=Array(12).fill(null);
 c[0]=angles.ascendantLongitude;c[3]=angles.imumCoeliLongitude;c[6]=angles.descendantLongitude;c[9]=angles.midheavenLongitude;
 c[10]=placidusIntermediateCusp({houseNumber:11,armc,latitude,obliquity:eps});
 c[11]=placidusIntermediateCusp({houseNumber:12,armc,latitude,obliquity:eps});
 c[1]=placidusIntermediateCusp({houseNumber:2,armc,latitude,obliquity:eps});
 c[2]=placidusIntermediateCusp({houseNumber:3,armc,latitude,obliquity:eps});
 c[4]=norm(c[10]+180);c[5]=norm(c[11]+180);c[7]=norm(c[1]+180);c[8]=norm(c[2]+180);
 return Object.freeze(c.map((longitude,i)=>Object.freeze({houseNumber:i+1,longitude:norm(longitude)})));
}
export function houseNumberFromCusps(longitude,cusps){
 const lon=norm(longitude);
 for(let i=0;i<12;i++){
   const start=norm(cusps[i].longitude),end=norm(cusps[(i+1)%12].longitude),span=norm(end-start),offset=norm(lon-start);
   if(offset<span||Math.abs(offset-span)<1e-10&&i===11)return i+1;
 }
 return 12;
}
function placements(points,cusps){return Object.freeze(points.map(p=>Object.freeze({bodyCode:p.bodyCode,houseNumber:houseNumberFromCusps(p.longitude,cusps)})));}
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
 const houseAlgorithm=Object.freeze({algorithmCode:ASTA_ANGLE_HOUSE_ALGORITHM_CODE,algorithmVersion:'2.0.0',async calculate(records,context){const birth=byType(records,'ASTA_BIRTH_CONTEXT'),points=byType(records,'ASTA_PROJECTABLE_POINTS');obj(birth,'ASTA birth context required');obj(points,'ASTA points required');const requested=context?.referenceVersions?.houseSystemCode||ASTA_DEFAULT_HOUSE_SYSTEM_CODE;const policy=getAstHouseSystemPolicy(requested);const angles=calculateAngles(birth.utcIso,birth.latitude,birth.longitude);const cusps=policy.code===ASTA_HOUSE_SYSTEM_PLACIDUS?placidusCusps(angles,birth.latitude):wholeSignCusps(angles.ascendantLongitude);const place=placements(points.positions,cusps);return Object.freeze({schemaVersion:'PHI-OS-ASTA-ANGLE-HOUSE-RESULT-v2.0.0',houseSystemCode:policy.code,houseSystemFamily:policy.family,zodiacPolicyCode:ASTA_ZODIAC_POLICY_CODE,anglePolicyCode:ASTA_ANGLE_POLICY_CODE,precisionPolicyCode:ASTA_PRECISION_POLICY_CODE,angles,cusps,placements:place,deterministic:true,providerUsed:false,aiUsed:false,projectionCreated:false,meaningCreated:false});}});
 const aspectAlgorithm=Object.freeze({algorithmCode:ASTA_ASPECT_ALGORITHM_CODE,algorithmVersion:'1.0.0',async calculate(records){const points=byType(records,'ASTA_PROJECTABLE_POINTS');obj(points,'ASTA points required');const byCode=new Map(points.positions.filter(p=>ASTA_CORE_BODY_CODES.includes(p.bodyCode)).map(p=>[p.bodyCode,p]));const matches=[];for(let i=0;i<ASTA_CORE_BODY_CODES.length;i++)for(let j=i+1;j<ASTA_CORE_BODY_CODES.length;j++){const a=byCode.get(ASTA_CORE_BODY_CODES[i]),b=byCode.get(ASTA_CORE_BODY_CODES[j]);if(!a||!b)continue;const sep=separation(a.longitude,b.longitude),m=aspectMatch(sep);if(m)matches.push(Object.freeze({fromCode:a.bodyCode,toCode:b.bodyCode,aspectCode:m.aspectCode,exactAngleDegrees:m.angleDegrees,separationDegrees:sep,orbDegrees:m.orb,authorizedOrbDegrees:m.orbDegrees,applyingState:'UNDETERMINED'}));}return Object.freeze({schemaVersion:'PHI-OS-ASTA-ASPECT-RESULT-v1.0.0',aspectSetCode:ASTA_ASPECT_SET_CODE,aspectPolicyCode:ASTA_ASPECT_POLICY_CODE,bodyScope:'CORE_10_PLANETS_ONLY',applyingSeparatingPolicy:'NOT_COMPUTED_V1',aspects:Object.freeze(matches),deterministic:true,providerUsed:false,aiUsed:false,projectionCreated:false,meaningCreated:false});}});
 const shared=createSharedCalculationRuntime({algorithms:[nodeAlgorithm,houseAlgorithm,aspectAlgorithm]});
 return Object.freeze({
  async calculate({requestId,canonicalInput,planetBodies,houseSystemCode=ASTA_DEFAULT_HOUSE_SYSTEM_CODE}){
   const utcIso=canonicalUtcIso(canonicalInput);const birth=sharedRecord(`SDA-${requestId}-ASTA-BIRTH`,'ASTA_BIRTH_CONTEXT',{utcIso,latitude:canonicalInput.birthPlace?.latitude,longitude:canonicalInput.birthPlace?.longitude});
   const node=await shared.execute({calculationId:`${requestId}-ASTA-NODE`,runtimeCode:SHARED_CALCULATION_RUNTIME_CODE,methodCode:'ASTROLOGY',pluginCode:'AST',algorithmCode:ASTA_NODE_ALGORITHM_CODE,algorithmVersion:'1.0.0',inputRecords:[birth],referenceVersions:{nodePolicyCode:ASTA_NODE_POLICY_CODE,nodeConvention:AST_TRUE_NODE_CONVENTION,engineCode:'ASTRONOMY_ENGINE_JS',engineVersion:'2.1.19'}});
   const nodePositions=node.output.positions;const pointPositions=[...planetBodies.map(p=>({bodyCode:p.bodyCode,longitude:p.longitude})),...nodePositions.map(p=>({bodyCode:p.bodyCode,longitude:p.longitude}))];const points=sharedRecord(`SDA-${requestId}-ASTA-POINTS`,'ASTA_PROJECTABLE_POINTS',{positions:pointPositions});
   const hasCoordinates=Number.isFinite(canonicalInput.birthPlace?.latitude)&&Number.isFinite(canonicalInput.birthPlace?.longitude);
   const exactBirthTime=canonicalInput.timeAccuracy==='EXACT';
   const houseEligible=hasCoordinates&&exactBirthTime;
   const policy=getAstHouseSystemPolicy(houseSystemCode);
   let house=null;const reasonCodes=[];
   if(houseEligible){
     try{house=await shared.execute({calculationId:`${requestId}-ASTA-HOUSE`,runtimeCode:SHARED_CALCULATION_RUNTIME_CODE,methodCode:'ASTROLOGY',pluginCode:'AST',algorithmCode:ASTA_ANGLE_HOUSE_ALGORITHM_CODE,algorithmVersion:'2.0.0',inputRecords:[birth,points],referenceVersions:{houseSystemCode:policy.code,anglePolicyCode:ASTA_ANGLE_POLICY_CODE,zodiacPolicyCode:ASTA_ZODIAC_POLICY_CODE,precisionPolicyCode:ASTA_PRECISION_POLICY_CODE}})}catch(error){if(error?.code==='ASTA_PLACIDUS_POLAR_LIMIT'||error?.code==='ASTA_PLACIDUS_UNDEFINED_AT_LATITUDE')reasonCodes.push(error.code);else throw error;}
   }else reasonCodes.push(!hasCoordinates?'AST_HOUSES_ANGLES_NOT_CALCULATED_COORDINATES_REQUIRED':'AST_HOUSES_ANGLES_NOT_CALCULATED_EXACT_TIME_REQUIRED');
   const aspects=await shared.execute({calculationId:`${requestId}-ASTA-ASPECT`,runtimeCode:SHARED_CALCULATION_RUNTIME_CODE,methodCode:'ASTROLOGY',pluginCode:'AST',algorithmCode:ASTA_ASPECT_ALGORITHM_CODE,algorithmVersion:'1.0.0',inputRecords:[points],referenceVersions:{aspectSetCode:ASTA_ASPECT_SET_CODE,aspectPolicyCode:ASTA_ASPECT_POLICY_CODE,applyingSeparatingPolicy:'NOT_COMPUTED_V1'}});
   return Object.freeze({node,house,aspects,houseSystemCode:policy.code,hasCoordinates,exactBirthTime,houseEligible:house!==null,reasonCodes:Object.freeze(reasonCodes)});
  }
 });
}
