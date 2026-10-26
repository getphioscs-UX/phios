/** R3 local-only arrow derivation; never replaces customer-confirmed external values. */
import {toneToOrientation} from './variable-adapter.js';
import {resolveActivationSubstructure,SUBSTRUCTURE_VERSION} from './substructure.js';
const AXES=Object.freeze([
 ['designUpper','DESIGN','SUN','EARTH','DETERMINATION'],
 ['designLower','DESIGN','NORTH_NODE','SOUTH_NODE','ENVIRONMENT'],
 ['personalityUpper','PERSONALITY','SUN','EARTH','MOTIVATION'],
 ['personalityLower','PERSONALITY','NORTH_NODE','SOUTH_NODE','PERSPECTIVE']
]);
export function orientationFromTone(tone){
 const orientation=toneToOrientation(tone);
 if(orientation==='UNKNOWN')throw new TypeError('VARIABLE_TONE_INVALID');
 return orientation;
}
export function encodeVariableDirections({designUpper,designLower,personalityUpper,personalityLower}){
 const d=[designUpper,designLower,personalityUpper,personalityLower];
 if(d.some(x=>!['LEFT','RIGHT'].includes(x)))throw new TypeError('VARIABLE_DIRECTION_INVALID');
 const short=x=>x==='LEFT'?'L':'R';
 return `P${short(personalityUpper)}${short(personalityLower)} D${short(designUpper)}${short(designLower)}`;
}
export function decodeVariableDirections(code){
 const m=/^P([LR])([LR]) D([LR])([LR])$/.exec(code);
 if(!m)throw new TypeError('VARIABLE_CODE_INVALID');
 const long=x=>x==='L'?'LEFT':'RIGHT';
 return Object.freeze({personalityUpper:long(m[1]),personalityLower:long(m[2]),designUpper:long(m[3]),designLower:long(m[4])});
}
export function deriveCalibrationVariables(activations){
 const fields={};
 for(const [slot,side,primary,opposite,role]of AXES){
  const sideInstants=new Set(activations.filter(x=>x.layer===side&&x.status==='CALCULATED').map(x=>x.instantUTC));
  if(sideInstants.size!==1||!Number.isFinite(Date.parse([...sideInstants][0]))){fields[slot]={status:'UNKNOWN',reason:'SIDE_INSTANT_MISSING_OR_CONFLICTING',role};continue;}
  const a=activations.filter(x=>x.layer===side&&x.bodyCode===primary&&x.status==='CALCULATED');
  const b=activations.filter(x=>x.layer===side&&x.bodyCode===opposite&&x.status==='CALCULATED');
  if(a.length!==1||b.length!==1){fields[slot]={status:'UNKNOWN',reason:'AXIS_MISSING_OR_DUPLICATE',role};continue;}
  const x=a[0],y=b[0],s=resolveActivationSubstructure(x.eclipticLongitude),t=resolveActivationSubstructure(y.eclipticLongitude);
  if(primary==='NORTH_NODE'&&(x.lineage?.nodeConvention!=='TRUE_NODE.V1'||y.lineage?.nodeConvention!=='TRUE_NODE.V1')){fields[slot]={status:'UNKNOWN',reason:'NODE_CONVENTION_NOT_VALIDATED_FOR_THIS_COHORT',role};continue;}
  const separation=((x.eclipticLongitude-y.eclipticLongitude)%360+360)%360;
  if(x.instantUTC!==y.instantUTC||Math.abs(separation-180)>1e-8||s.color==null||s.tone==null||s.color!==t.color||s.tone!==t.tone){fields[slot]={status:'UNKNOWN',reason:'AXIS_OPPOSITION_OR_SUBSTRUCTURE_CONFLICT',role};continue;}
  fields[slot]=Object.freeze({status:'CALCULATED_LOCAL_CANDIDATE',role,side,sourceBodies:[primary,opposite],
   instantUTC:x.instantUTC,sourceActivationIds:[x.activationId,y.activationId],color:s.color,tone:s.tone,
   orientation:orientationFromTone(s.tone),oppositeAxisVerified:true,theme:null,cognition:null,
   interpretationStatus:'REQUIRES_APPROVED_MAPPING_AND_SCOPE',provenance:'INTERNAL_CALIBRATION_NOT_EXTERNAL_CHART',publicationEligible:false});
 }
 const complete=Object.values(fields).every(x=>x.status==='CALCULATED_LOCAL_CANDIDATE');
 return Object.freeze({calculationVersion:SUBSTRUCTURE_VERSION,scope:'LOCAL_CALIBRATION_ONLY',fields:Object.freeze(fields),
  variableCode:complete?encodeVariableDirections(Object.fromEntries(Object.entries(fields).map(([k,v])=>[k,v.orientation]))):null,
  codeOrdering:'PERSONALITY_UPPER_LOWER_THEN_DESIGN_UPPER_LOWER',
  codeExternalReferenceValidation:'OFFICIAL_PERSONALITY_DESIGN_ORDER_PLUS_R3_AXIS_CONTRACT_R2_HAS_ARROWS_NOT_PRINTED_CODE',
  codeSourceRef:'https://jovianarchive.com/blogs/deeper-mechanics-system-theory/leftness-rightness-and-variable-in-human-design',publicationEligible:false});
}
