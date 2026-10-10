import {getEcrCanonicalOntology} from './ecr-ontology-registry.js';
import {ECR_CALCULATION_SPEC_RUNTIME} from './ecr-calculation-spec-runtime.js';

const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};
const norm=x=>((Number(x)%360)+360)%360;
const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
const circularDistance=(a,b)=>{let d=Math.abs(norm(a)-norm(b));return d>180?360-d:d};
const pad=n=>String(n).padStart(2,'0');
function fail(code){throw Object.assign(new Error(code),{code});}
function exactBoundaryPosition(longitude,segmentDegrees){const pos=norm(longitude)%segmentDegrees;return Math.min(pos,segmentDegrees-pos);}
function sectorIndex(longitude,count){const size=360/count;const x=norm(longitude);return Math.min(count-1,Math.floor((x+1e-12)/size));}
function codeAt(prefix,index,width=0){const n=index+1;return `${prefix}${width?String(n).padStart(width,'0'):n}`;}
function byId(items,id,key){const found=(items||[]).find(x=>x?.[key]===id);if(!found)fail(`ECR_ONTOLOGY_ITEM_MISSING:${id}`);return found;}

export function canonicalBirthUtcIso(input){
  if(input?.timeAccuracy!=='EXACT'||!input?.birthDate||!input?.birthTime||!input?.timezone?.utcOffsetAtBirth)fail('ECR_EXACT_CANONICAL_BIRTH_INPUT_REQUIRED');
  const local=`${input.birthDate}T${input.birthTime}${input.timezone.utcOffsetAtBirth}`;
  const date=new Date(local);if(Number.isNaN(date.valueOf()))fail('ECR_CANONICAL_BIRTH_INSTANT_INVALID');
  return date.toISOString();
}

export async function calculateEcrSolarAnchor(input,{astronomyModuleLoader=()=>import('astronomy-engine')}={}){
  const utcIso=canonicalBirthUtcIso(input);const A=await astronomyModuleLoader();
  for(const name of ['GeoVector','Ecliptic'])if(typeof A?.[name]!=='function')fail(`ECR_ASTRONOMY_ENGINE_EXPORT_MISSING:${name}`);
  const body=A?.Body?.Sun??A?.Body?.SUN??'Sun';
  const vector=A.GeoVector(body,new Date(utcIso),true);const ecl=A.Ecliptic(vector);const longitude=norm(Number(ecl.elon));
  if(!Number.isFinite(longitude))fail('ECR_SOLAR_LONGITUDE_INVALID');
  return freeze({schemaVersion:'PHI-OS-ECR-SOLAR-ANCHOR-v1.0.0',utcIso,longitude:Number(longitude.toFixed(12)),referenceFrame:'TROPICAL_ECLIPTIC_GEOCENTRIC',engineCode:'ASTRONOMY_ENGINE_JS',engineVersion:'2.1.19',licenseCode:'MIT',providerUsed:false,aiUsed:false,interpretationCreated:false});
}

export function resolveEcrCoordinateFromSolarLongitude(solarLongitude){
  const ontology=getEcrCanonicalOntology(),spec=ECR_CALCULATION_SPEC_RUNTIME,x=norm(solarLongitude);
  const ccIndex=sectorIndex(x,12),gIndex=sectorIndex(x,16),qIndex=gIndex,mIndex=sectorIndex(x,8),hIndex=sectorIndex(x,64);
  const cc=ontology.ecrSpecific.cosmologicalContext[ccIndex];
  const grammarCode=ontology.coreTheory.grammarCodes[gIndex],grammar=ontology.coreTheory.grammars[grammarCode];
  const questionCode=codeAt('Q',qIndex),question=ontology.coreTheory.questions[questionCode];
  const capMap=spec.questionCapabilityMatrix[questionCode];if(!capMap)fail(`ECR_CAPABILITY_MAPPING_MISSING:${questionCode}`);
  const primaryCapability=byId(ontology.coreTheory.capabilities,capMap.primary,'id');
  const supportingCapabilities=(capMap.supporting||[]).map(id=>byId(ontology.coreTheory.capabilities,id,'id'));
  const motions=ontology.ecrSpecific.motions,motion=motions[mIndex],configuration=ontology.ecrSpecific.configurations[hIndex];
  const hSize=360/64,withinH=((x-hIndex*hSize)+hSize)%hSize,aIndex=Math.min(7,Math.floor((withinH+1e-12)/(hSize/8))),activation=ontology.ecrSpecific.activations[aIndex];
  const drivers=ontology.coreTheory.drivers.map((driver,index)=>{
    const start=index*30,end=start+30,center=start+15,distance=circularDistance(x,center),raw=1/(1+distance/30);
    return {driverId:driver.id,label:driver.label,labelZhHans:driver.zh,sectorStart:start,sectorEnd:end,sectorCenter:center,angularDistanceDegrees:Number(distance.toFixed(9)),rawAffinity:raw};
  }).sort((a,b)=>a.angularDistanceDegrees-b.angularDistanceDegrees||a.driverId.localeCompare(b.driverId));
  const total=drivers.reduce((s,d)=>s+d.rawAffinity,0);const rankedDrivers=drivers.map((d,i)=>freeze({...d,rank:i+1,baselineAffinity:Number((d.rawAffinity/total).toFixed(9)),rawAffinity:undefined}));
  const boundary={
    contextDistanceDegrees:Number(exactBoundaryPosition(x,30).toFixed(9)),grammarDistanceDegrees:Number(exactBoundaryPosition(x,22.5).toFixed(9)),motionDistanceDegrees:Number(exactBoundaryPosition(x,45).toFixed(9)),configurationDistanceDegrees:Number(exactBoundaryPosition(x,hSize).toFixed(9)),activationDistanceDegrees:Number(exactBoundaryPosition(withinH,hSize/8).toFixed(9))
  };
  return freeze({schemaVersion:'PHI-OS-ECR-COORDINATE-RESOLUTION-v1.0.0',anchorLongitude:Number(x.toFixed(12)),cosmologicalContext:cc,grammar:{code:grammarCode,label:grammar.label,chineseLabel:grammar.chineseLabel},question:{questionId:questionCode,question:question.question,questionZhHans:question.questionZhHans},capability:{primary:primaryCapability,supporting:supportingCapabilities},driverPriority:{classification:'BASELINE_AFFINITY_NOT_CURRENT_REALITY_PRIORITY',drivers:rankedDrivers},motion,configuration,activation,position:{contextIndex:ccIndex+1,grammarIndex:gIndex+1,questionIndex:qIndex+1,motionIndex:mIndex+1,configurationIndex:hIndex+1,activationIndex:aIndex+1,withinConfigurationDegrees:Number(withinH.toFixed(12)),withinConfigurationRatio:Number(clamp(withinH/hSize,0,1).toFixed(12))},boundary});
}

export default Object.freeze({canonicalBirthUtcIso,calculateEcrSolarAnchor,resolveEcrCoordinateFromSolarLongitude});
