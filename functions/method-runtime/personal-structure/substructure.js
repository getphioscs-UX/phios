/** R3 local calibration extension. Existing Gate/Line and ephemeris remain owners. */
import {resolveGateLine} from './gate-line.js';
import {GATE_SEQUENCE,gateWheelAngleToEclipticLongitude} from './gate-wheel.js';
export const SUBSTRUCTURE_VERSION='HD-ECR-SUBSTRUCTURE-R3-v1';
export const SUBDIVISION_COUNTS=Object.freeze({gate:64,line:384,color:2304,tone:13824,base:69120});
export const SUBDIVISION_WIDTHS=Object.freeze(Object.fromEntries(Object.entries(SUBDIVISION_COUNTS).map(([k,n])=>[k,360/n])));
// Floating-point representation tolerance, not astronomical accuracy or a time offset.
export const TONE_INDEX_TOLERANCE=16*Number.EPSILON*360*(13824/360);
export function substructureCellLongitude(index,fraction=.5){
 if(!Number.isInteger(index)||index<0||index>=13824||!Number.isFinite(fraction)||fraction<0||fraction>=1)throw new TypeError('SUBSTRUCTURE_CELL_INVALID');
 return gateWheelAngleToEclipticLongitude((index+fraction)*SUBDIVISION_WIDTHS.tone);
}
export function resolveActivationSubstructure(longitude,metadata={}){
 const legacy=resolveGateLine(longitude);
 let continuous=legacy.gateWheelAngle*(13824/360);
 const nearest=Math.round(continuous),snapped=Math.abs(continuous-nearest)<=TONE_INDEX_TOLERANCE;
 if(snapped)continuous=nearest;
 if(continuous===13824)continuous=0;
 const toneIndex=Math.floor(continuous),gateIndex=Math.floor(toneIndex/216);
 const sharedLine=Math.floor(toneIndex/36)%6+1,color=Math.floor(toneIndex/6)%6+1,tone=toneIndex%6+1;
 const compatible=GATE_SEQUENCE[gateIndex]===legacy.gate&&sharedLine===legacy.line;
 const fraction=continuous-toneIndex;
 const offsets={};
 for(const [level,count]of Object.entries(SUBDIVISION_COUNTS).filter(([k])=>k!=='base')){
  const position=continuous/(13824/count),part=position-Math.floor(position),width=360/count;
  offsets[level]={fraction:part,degrees:part*width,nearestBoundaryDegrees:Math.min(part,1-part)*width};
 }
 return Object.freeze({calculationVersion:SUBSTRUCTURE_VERSION,scope:'LOCAL_CALIBRATION_ONLY',
  sourceLongitude:longitude,ephemeris:metadata.ephemeris??null,coordinateSystem:metadata.coordinateSystem??null,
  wheelPositionDegrees:legacy.gateWheelAngle,continuousTonePosition:continuous,toneIndex,
  gate:legacy.gate,line:legacy.line,color:compatible?color:null,tone:compatible?tone:null,base:null,
  diagnosticCandidate:Object.freeze({gate:GATE_SEQUENCE[gateIndex],line:sharedLine,color,tone}),
  parentCompatibility:compatible?'MATCH':'CONFLICT_WITH_LEGACY_GATE_LINE',
  intervalConvention:'[start,end)',boundarySnapApplied:snapped,boundaryToleranceToneUnits:TONE_INDEX_TOLERANCE,
  remainingToneFraction:fraction,offsets:Object.freeze(offsets),precision:'UNVERIFIED',
  precisionMeaning:'Deterministic subdivision only; external astronomical agreement is separately evaluated.',
  publicationEligible:false,baseValidation:'NOT_IMPLEMENTED_NOT_INFERRED'});
}
