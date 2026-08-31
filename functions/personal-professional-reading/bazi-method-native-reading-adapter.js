import {sha256} from '../method-runtime/shared-calculation-runtime.js';
import {buildBzrTemporalProjection,BZR_TEMPORAL_PROJECTION_SCHEMA} from '../bzr-temporal/temporal-runtime.js';
import {buildBaziFullReading} from '../api/bazi-full-reading.js';
import {buildMethodNativeCustomerReading} from './method-native-reading-product.js';
import {buildBaziProfessionalSurfaceModules} from './bazi-professional-surface-projection.js';

const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const x of Object.values(value))freeze(x)}return value};
const clean=value=>String(value??'').trim();
const list=value=>Array.isArray(value)?value:[];
export const PPR_C1_BAZI_PRODUCT_VERSION='BAZI-FP-v1.0.0@PPR-C1-W12';

export function normalizeBaziTargetContext(value){
 const v=value&&typeof value==='object'?value:{};
 const targetDate=clean(v.targetDate),targetTime=clean(v.targetTime),iana=clean(v.targetTimezone?.iana||v.targetTimezone),offset=clean(v.targetTimezone?.utcOffsetAtTarget||v.utcOffsetAtTarget);
 const supplied=[targetDate,targetTime,iana,offset].filter(Boolean).length;
 if(supplied!==4)return freeze({state:'UNAVAILABLE',reasonCode:supplied?'PPR_C1_BAZI_TARGET_CONTEXT_INCOMPLETE':'PPR_C1_BAZI_TARGET_CONTEXT_NOT_SUPPLIED',targetContext:null});
 return freeze({state:'EXPLICIT',reasonCode:null,targetContext:{targetDate,targetTime:targetTime.length===5?`${targetTime}:00`:targetTime,targetTimezone:{iana,utcOffsetAtTarget:offset}}});
}

async function noTargetTemporalBoundary(canonicalProjection,reasonCode){
 const projectionId=`BZTP-PPR-NO-TARGET-${(await sha256({natalProjectionId:canonicalProjection.projectionId,reasonCode,version:'PPR-C1-W3'})).slice(0,20).toUpperCase()}`;
 return freeze({
  schemaVersion:BZR_TEMPORAL_PROJECTION_SCHEMA,
  capabilityCode:'BZR_TEMPORAL',capabilityVersion:'PPR-C1-NO-TARGET-BOUNDARY-v1.0.0',projectionId,
  sourceMethodCode:'BAZI',sourcePluginCode:'BZR',sourceNatalProjectionId:canonicalProjection.projectionId,
  targetContext:null,executionCompleteness:'PARTIAL',
  natal:{pillars:[]},
  currentLuckCycle:{status:'UNAVAILABLE',state:'NOT_CALCULATED',current:null,candidates:[],reasonCodes:[reasonCode]},
  annualContext:{status:'UNAVAILABLE',annualPillar:null,reasonCodes:[reasonCode]},relations:[],
  unknown:[{code:reasonCode,rendererMustDisplay:true}],
  evidence:[{type:'TARGET_CONTEXT_BOUNDARY',reference:'PPR-C1-W3',version:'1.0.0'}],
  boundaries:{natalRecalculated:false,tenGodsCreated:false,usefulGodCreated:false,patternClassificationCreated:false,fortunePredictionCreated:false,eventPredictionCreated:false,professionalJudgmentCreated:false,goodBadScoreCreated:false,methodVotingCreated:false},
  execution:{requestId:null,executedAt:null,productionAcceptedScope:true,noTemporalCalculationPerformed:true}
 });
}

function baziEnvelope({report,readingIR,publicationDecision,temporalProjection,temporalState}){
 const open=report.sections.find(x=>x.code==='OPEN');
 const technical=report.technicalEvidence||{};
 return buildMethodNativeCustomerReading({
  methodId:'BZR',productVersion:PPR_C1_BAZI_PRODUCT_VERSION,
  summary:{title:report.title,subtitle:report.subtitle,boundary:report.boundary,keyPoints:report.keyPoints,reportDigest:report.reportDigest},
  structuralModel:{pillars:report.pillars,daYunTimeline:report.daYunTimeline},
  readingSections:report.sections,
  temporalContext:{state:temporalState,targetContext:temporalProjection.targetContext||null,projectionId:temporalProjection.projectionId,executionCompleteness:temporalProjection.executionCompleteness,unknownCodes:list(temporalProjection.unknown).map(x=>x.code).filter(Boolean)},
  openVerdicts:list(open?.items),
  evidence:{evidenceCount:technical.evidenceCount??null,authorityCount:technical.authorityCount??null,reportDigest:report.reportDigest,sourceNatalProjectionId:temporalProjection.sourceNatalProjectionId},
  publicationDecision,
  professionalModules:buildBaziProfessionalSurfaceModules({readingIR,report,temporalState}),
  governance:{
   sourceProduct:'BAZI-FP-v1.0.0',sourceReportSchema:report.schemaVersion,
   temporalAuthority:temporalState==='EXPLICIT'?'BZR_TEMPORAL_RUNTIME_V2':'PPR_C1_NO_TARGET_BOUNDARY_ONLY',
   natalProjectionReused:true,natalRecalculatedForTemporal:false,legacyComposeBzrConsumed:false,professionalStructureSurfaceAuthorized:true,wholeChartFirstIaAuthorized:true,customerSurfaceLanguagePurgeAuthorized:true,professionalReadingIaV2Authorized:true,fiveElementVisualProjectionAuthorized:true,tenGodProfessionalCompositionAuthorized:true,dayMasterStrengthProfessionalCompositionAuthorized:true,relationshipPillarInteractionProfessionalCompositionAuthorized:true,patternProfessionalReadingAuthorized:true,wholeChartPriorityEngineAuthorized:true,professionalTopicReadingAuthorized:true,daYunLiuNianProfessionalTimelineAuthorized:true,customerNarrativeComposerAuthorized:true,realityBridgeAuthorized:true,sourcesTechnicalRelocationAuthorized:true,marketGradeCustomerCutoverCandidateAuthorized:true,marketGradeCustomerCutoverActive:false,patternProfessionalSurfaceAuthorized:true,threeSchoolProfessionalSurfaceAuthorized:true,temporalExperienceAuthorized:true,customerSafeEvidenceGraphAuthorized:true,realityComparisonRebuildAuthorized:true,pprR3SpecialistNavigationAuthorized:true,
   noTargetDoesNotInferCurrentDate:true,noTargetDoesNotInferBrowserTimezone:true,
   fortunePredictionCreated:false,eventCertaintyCreated:false,silentSchoolMergeCreated:false,sharedPersonalRealitySurfaceModified:false,customerDefaultSurface:'BAZI_PROFESSIONAL_READING',governanceSurfaceDefault:false,technicalSurfaceOnDemand:true
  }
 });
}

export async function buildBaziMethodNativeReading({canonicalProjection,canonicalInput,baseExecution,locale='en',targetContext=null,temporalProjectionOverride=null}={}){
 if(canonicalProjection?.method?.publicMethodCode!=='BAZI_PROJECTION')throw Object.assign(new Error('PPR_C1_BAZI_CANONICAL_PROJECTION_REQUIRED'),{code:'PPR_C1_BAZI_CANONICAL_PROJECTION_REQUIRED'});
 const target=normalizeBaziTargetContext(targetContext);
 let temporalProjection,temporalState;
 if(temporalProjectionOverride){
  if(temporalProjectionOverride.schemaVersion!==BZR_TEMPORAL_PROJECTION_SCHEMA||temporalProjectionOverride.sourceNatalProjectionId!==canonicalProjection.projectionId)throw Object.assign(new Error('PPR_C1_BAZI_TEMPORAL_OVERRIDE_LINEAGE_INVALID'),{code:'PPR_C1_BAZI_TEMPORAL_OVERRIDE_LINEAGE_INVALID'});
  temporalProjection=temporalProjectionOverride;temporalState=temporalProjection.targetContext?'EXPLICIT':'UNAVAILABLE';
 }else if(target.state==='EXPLICIT'){
  if(!baseExecution)throw Object.assign(new Error('PPR_C1_BAZI_SINGLE_EXECUTION_EVIDENCE_REQUIRED'),{code:'PPR_C1_BAZI_SINGLE_EXECUTION_EVIDENCE_REQUIRED'});
  temporalProjection=await buildBzrTemporalProjection({requestId:`PPR-C1-BZR-${canonicalProjection.projectionId}`,canonicalInput,targetContext:target.targetContext,natalProjection:canonicalProjection,baseExecution});
  temporalState='EXPLICIT';
 }else{
  temporalProjection=await noTargetTemporalBoundary(canonicalProjection,target.reasonCode);temporalState='UNAVAILABLE';
 }
 const result=await buildBaziFullReading({schemaVersion:'PHI-OS-BAZI-FULL-READING-REQUEST-v1.0.0',canonicalProjection,temporalProjection,locale:locale==='zh-Hans'?'zh-Hans':'en'});
 if(result.publicationDecision?.customerPublishable!==true)throw Object.assign(new Error('PPR_C1_BAZI_FULL_PRODUCTION_NOT_CUSTOMER_PUBLISHABLE'),{code:'PPR_C1_BAZI_FULL_PRODUCTION_NOT_CUSTOMER_PUBLISHABLE'});
 return baziEnvelope({report:result.report,readingIR:result.readingIR,publicationDecision:result.publicationDecision,temporalProjection,temporalState});
}

export default Object.freeze({PPR_C1_BAZI_PRODUCT_VERSION,normalizeBaziTargetContext,buildBaziMethodNativeReading});
