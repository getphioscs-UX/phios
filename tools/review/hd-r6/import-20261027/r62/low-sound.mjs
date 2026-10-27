// Read-only traditional classification adapter for this private review candidate.
// Does not add a chart field or change the calculator, Tone, or Cognition owner.
import {resolveActivationSubstructure,TONE_INDEX_TOLERANCE} from '../../../../../functions/method-runtime/personal-structure/substructure.js';
import {toneToOrientation} from '../../../../../functions/method-runtime/personal-structure/variable-adapter.js';
export const evidenceURL='https://jovianarchive.com/blogs/deeper-mechanics-system-theory/radical-transformation-is-it-correct-for-me-part-1-transforming-the-body-experience';
export function inspectLowSound(chart,{confirmationValid=false,toneBoundaryUncertain=false,referenceVerified=false}={}){
 const reasons=[],v=chart.variables?.fields?.designUpper;
 if(!confirmationValid)reasons.push('CONFIRMATION_REQUIRED');
 if(!referenceVerified)reasons.push('REFERENCE_NOT_VERIFIED');
 if(!v||v.status!=='CALCULATED_LOCAL_CANDIDATE'||v.role!=='DETERMINATION'||v.side!=='DESIGN'||v.oppositeAxisVerified!==true)reasons.push('DESIGN_DETERMINATION_AXIS_NOT_VERIFIED');
 if(!Number.isInteger(v?.tone)||v.tone<1||v.tone>6)reasons.push('TONE_MISSING_OR_INVALID');
 if(!['LEFT','RIGHT'].includes(v?.orientation))reasons.push('DIRECTION_MISSING');
 if(Number.isInteger(v?.tone)&&toneToOrientation(v.tone)!==v?.orientation)reasons.push('TONE_DIRECTION_CONFLICT');
 const samples=[];for(const body of ['SUN','EARTH']){const a=chart.activations?.filter(a=>a.layer==='DESIGN'&&a.bodyCode===body);if(a?.length!==1||!Number.isFinite(a[0].eclipticLongitude)){reasons.push('DESIGN_'+body+'_MISSING_OR_DUPLICATE');continue;}if(!v?.sourceBodies?.includes(body)||!v?.sourceActivationIds?.includes(a[0].activationId)||v?.instantUTC!==a[0].instantUTC)reasons.push('AXIS_PROVENANCE_CONFLICT');const s=resolveActivationSubstructure(a[0].eclipticLongitude);samples.push({body,color:s.color,tone:s.tone,calculationVersion:s.calculationVersion,boundarySnapApplied:s.boundarySnapApplied,distanceToToneBoundaryDegrees:s.offsets.tone.nearestBoundaryDegrees});if(s.color!==v?.color||s.tone!==v?.tone||s.parentCompatibility!=='MATCH')reasons.push('AXIS_CALCULATION_FIELD_CONFLICT');if(s.boundarySnapApplied||s.remainingToneFraction<=TONE_INDEX_TOLERANCE||1-s.remainingToneFraction<=TONE_INDEX_TOLERANCE)reasons.push('TONE_BOUNDARY_UNCERTAIN');}
 if(toneBoundaryUncertain)reasons.push('TONE_BOUNDARY_UNCERTAIN');
 const value=reasons.length?null:v.color===5&&v.orientation==='RIGHT'?'LOW':null;
 return {status:reasons.length?'BLOCKED':value==='LOW'?'PASS_LOCAL_TRADITIONAL_CLASSIFICATION':'NOT_LOW_SOUND',value,reasons:[...new Set(reasons)],inputs:{path:'chart.variables.fields.designUpper',color:v?.color??null,tone:v?.tone??null,orientation:v?.orientation??null},axisSamples:samples,reference:evidenceURL,mappingVersion:'HD-R62-READONLY-COLOR5-RIGHT-v1',calculationConfidence:'EXISTING_LOCAL_CALIBRATION_NOT_NEW_ASTRONOMICAL_PROOF',publicationEligible:false,cognition:null};
}
