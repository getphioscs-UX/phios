// R4.1 local candidate. Reuses the shared HD/ECR owners; never grants publication.
import {createHash} from 'node:crypto';
import {createEcrSharedInitializationCapability} from '../embodied-configuration/ecr-shared-initialization-capability.js';
import {calculatePersonalStructure} from '../method-runtime/personal-structure/personal-structure-runtime.js';
import {deriveCalibrationVariables} from '../method-runtime/personal-structure/variable-calibration.js';
import {validateCanonicalBirthInput,evaluateMethodInputReadiness} from '../method-client-delivery/canonical-birth-input-runtime.js';
import {TYPE_RULES} from './hd-intake-reconciliation.js';

export const HD_CHART_CONFIRMATION_VERSION='HD-CHART-CONFIRMATION-R4.1-LOCAL-v1';
export const HD_CALCULATION_PUBLICATION_GATES=Object.freeze({
  gateLineReference:'PARTIAL_779_OF_780',colorReference:'PASS_120_OF_120',
  toneReference:'PARTIAL_117_OF_120',variableReference:'PASS_120_OF_120',
  calculatedInterpretation:'NOT_ADMITTED',criticalRights:'REVIEW_REQUIRED',
  reportAutomation:'NOT_VERIFIED',publicationAllowed:false
});
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const record=(type,payload)=>({authority:'SHARED_DATA_AUTHORITY',status:'verified',methodOwner:null,pluginOwner:null,recordId:'HD-R41-'+type,recordType:type,recordVersion:HD_CHART_CONFIRMATION_VERSION,payload});
const typeNames={GENERATOR:'Generator',MANIFESTING_GENERATOR:'Manifesting Generator',PROJECTOR:'Projector',MANIFESTOR:'Manifestor',REFLECTOR:'Reflector'};

export async function calculateInternalChartPreview(input){
  const valid=validateCanonicalBirthInput(input),ready=evaluateMethodInputReadiness('HUMAN_DESIGN',input||{});
  if(!valid.valid||ready.state!=='READY'||input.timeAccuracy!=='EXACT'||input.consent?.granted!==true||input.consent?.hdrInternalValidation!==true)throw new TypeError('HD_EXACT_CONSENTED_BIRTH_INPUT_REQUIRED');
  const utc=new Date(`${input.birthDate}T${input.birthTime}${input.timezone.utcOffsetAtBirth}`).toISOString();
  const cap=createEcrSharedInitializationCapability(),personality=await cap.astronomy.calculateLongitudesAt(utc),moment=await cap.priorDesign(personality),design=await cap.astronomy.calculateLongitudesAt(moment.instantUTC);
  const result=await calculatePersonalStructure({calculationId:'HD-R41-'+hash(input),nodeConvention:personality.nodeConvention,substructureCalibration:true,inputRecords:[
    record('CANONICAL_BIRTH_INPUT',input),record('PERSONALITY_ASTRONOMY',personality),record('DESIGN_ASTRONOMY',design),record('DESIGN_MOMENT',{designMomentRef:moment.outputDigest,designInstantUTC:moment.instantUTC,solarArcDeg:88,fixedDaySubtractionUsed:false}),record('CONSENT',{valid:true})
  ]});
  const output=result.output,variables=deriveCalibrationVariables(output.activations),type=typeNames[output.typeCode]||null;
  const chart={type,typeCode:output.typeCode,strategy:type?TYPE_RULES[type]?.[0]??null:null,authority:output.authorityCode,profile:output.profile,definition:output.definition,incarnationCross:{...output.incarnation,namedCross:null,nameStatus:'NOT_LICENSED_OR_ADMITTED'},variables,definedCenters:output.definedCenters,undefinedCenters:output.undefinedCenters,channels:output.activatedChannels,activations:output.activations};
  const inputIdentity={birthDate:input.birthDate,birthTime:input.birthTime,birthPlace:input.birthPlace,timezone:input.timezone,timeAccuracy:input.timeAccuracy};
  const chartDigest=hash({version:HD_CHART_CONFIRMATION_VERSION,inputIdentity,chart});
  const missing=['type','strategy','authority','profile','definition'].filter(k=>!chart[k]);
  if(!variables.variableCode)missing.push('variables');
  if(!chart.profile?.profileCode&&!missing.includes('profile'))missing.push('profile');
  if(chart.definition?.definitionCode==='UNSUPPORTED_DEFINITION'&&!missing.includes('definition'))missing.push('definition');
  if(!chart.incarnationCross.configurationCode)missing.push('incarnationCross');
  if(chart.activations.length!==26||chart.activations.some(a=>a.status!=='CALCULATED'||!Number.isFinite(a.eclipticLongitude)||!Number.isInteger(a.gate)||a.gate<1||a.gate>64||!Number.isInteger(a.line)||a.line<1||a.line>6))missing.push('completeActivations');
  return {version:HD_CHART_CONFIRMATION_VERSION,source:'PHIOS_INTERNAL_HD_ECR_CALCULATION',chartDigest,inputIdentity,instantUTC:utc,designInstantUTC:moment.instantUTC,chart,requiredMissing:missing,eligibility:{...HD_CALCULATION_PUBLICATION_GATES,missing,publicationAllowed:false},customerConfirmed:false,pdfExtractionCalls:0,providerCalls:0,persisted:false,referenceAttachment:{supported:false,uploaded:false,retention:'NONE',deletion:'No attachment is accepted or stored in this candidate'},boundary:'Customer confirmation acknowledges the displayed input and preview only; it does not establish precision, licensing or report eligibility.'};
}

export function acknowledgeInternalPreview(preview,{chartDigest,confirmed}={}){
  if(!preview||chartDigest!==preview.chartDigest)throw new TypeError('HD_PREVIEW_CHANGED_RECALCULATE');
  if(confirmed!==true)throw new TypeError('HD_CUSTOMER_CONFIRMATION_REQUIRED');
  return {...preview,customerConfirmed:true,confirmationScope:'INPUT_AND_PREVIEW_ONLY',eligibility:{...preview.eligibility,publicationAllowed:false},reportGenerationAllowed:false};
}
