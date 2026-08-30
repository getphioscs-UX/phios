import {sha256Stable,stableStringify} from '../zi-wei-runtime/zwr-utils.js';

export const ZIWEI_CX_R1_PUBLICATION_ENVELOPE_SCHEMA='PHI-OS-ZIWEI-CX-R1-CURRENT-PUBLICATION-ENVELOPE-v1.0.0';
export const ZIWEI_CX_R1_CURRENT_PUBLICATION_AUTHORITY=Object.freeze({
  schemaVersion:'PHI-OS-ZIWEI-CX-R1-CURRENT-PUBLICATION-AUTHORITY-v1.0.0',
  work:'ZIWEI-CX-R1-W3',
  integrationBaselineCommit:'343773fd6fb61fbf1b37aa861537d7e8f091ec24',
  ziweiFullProductionSemanticBaselineCommit:'d16d757a477e2a9f7e3c7a38e4e5d044ce7e4aaf',
  status:'ACTIVE_CURRENT_PUBLICATION_AUTHORITY',
  publicationState:'CUSTOMER_PUBLISHABLE',
  sourceAuthority:Object.freeze({work:'ZIWEI-FP-W23',status:'FULL_PRODUCTION_ACTIVE',machineGate:'PASS_96_OF_96',humanGate:'PASS_24_OF_24_ACCEPT',runtimeUseAllowed:true,defaultCustomerCutover:true}),
  activatedProducts:Object.freeze({w18CustomerReport:true,w19InteractiveSurface:true,w20TopicReading:true}),
  preservedBoundaries:Object.freeze({fortunePrediction:false,guaranteedEventPrediction:false,goodBadScore:false,overallStrongWeakWinner:false,medicalDiagnosis:false,financialAdvice:false,relationshipCompatibilityScore:false,silentSchoolMerge:false}),
  historicalArtifactsMutated:false
});
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};
function fail(code){const e=new Error(code);e.code=code;throw e;}

export function buildZiweiCurrentPublicationEnvelope({report,interactiveSurface,topics,targetContext,sourceDigests,professionalTimingNavigation=null,chartProfessionalDensity=null,locale}={}){
  if(report?.schemaVersion!=='PHI-OS-ZIWEI-CUSTOMER-REPORT-v1.0.0')fail('ZIWEI_CX_R1_W3_W18_REPORT_REQUIRED');
  if(interactiveSurface?.schemaVersion!=='PHI-OS-ZIWEI-INTERACTIVE-CHART-SURFACE-v1.0.0')fail('ZIWEI_CX_R1_W3_W19_SURFACE_REQUIRED');
  if(topics?.schemaVersion!=='PHI-OS-ZIWEI-TOPIC-READING-v1.0.0')fail('ZIWEI_CX_R1_W3_W20_TOPICS_REQUIRED');
  if(targetContext?.schemaVersion!=='PHI-OS-ZIWEI-CX-R1-LIVE-TARGET-CONTEXT-v1.0.0')fail('ZIWEI_CX_R1_W3_TARGET_CONTEXT_REQUIRED');
  if(interactiveSurface.source?.customerReportDigest!==report.reportDigest)fail('ZIWEI_CX_R1_W3_W18_W19_LINEAGE_MISMATCH');
  if(topics.source?.customerReportDigest!==report.reportDigest||topics.source?.interactiveSurfaceDigest!==interactiveSurface.surfaceDigest)fail('ZIWEI_CX_R1_W3_W18_W19_W20_LINEAGE_MISMATCH');
  const snaps=[report,interactiveSurface,topics,targetContext].map(stableStringify);
  const l=locale||report.locale;
  if(l!==report.locale||l!==interactiveSurface.locale||l!==topics.locale)fail('ZIWEI_CX_R1_W3_LOCALE_MISMATCH');
  const authority=ZIWEI_CX_R1_CURRENT_PUBLICATION_AUTHORITY;
  const base={
    schemaVersion:ZIWEI_CX_R1_PUBLICATION_ENVELOPE_SCHEMA,
    work:'ZIWEI-CX-R1-W3',
    methodId:'ZWR',
    methodCode:'ZI_WEI_DOU_SHU',
    locale:l,
    state:'CUSTOMER_PUBLISHABLE',
    publicationState:'CUSTOMER_PUBLISHABLE',
    primaryProductType:'ZIWEI_FULL_PRODUCTION',
    report,
    interactiveSurface,
    topics,
    targetContext,
    professionalTimingNavigation,
    chartProfessionalDensity,
    currentAuthority:authority,
    sourceDigests:freeze({...sourceDigests}),
    governance:freeze({
      historicalW18BoundaryMutated:false,
      historicalW19BoundaryMutated:false,
      historicalW20BoundaryMutated:false,
      sourceW23FullProductionActive:true,
      machine96of96Accepted:true,
      human24of24Accepted:true,
      genericSmrOwnsCompleteZiweiReport:false,
      customerRendererMayCreateMeaning:false
    })
  };
  const envelopeDigest=sha256Stable({schemaVersion:base.schemaVersion,methodId:base.methodId,locale:base.locale,state:base.state,reportDigest:report.reportDigest,surfaceDigest:interactiveSurface.surfaceDigest,topicReadingDigest:topics.topicReadingDigest,targetContext,professionalTimingNavigationDigest:professionalTimingNavigation?.navigationDigest||null,chartProfessionalDensityDigest:chartProfessionalDensity?.densityDigest||null,sourceDigests:base.sourceDigests,currentAuthority:authority});
  if([report,interactiveSurface,topics,targetContext].map(stableStringify).some((x,i)=>x!==snaps[i]))fail('ZIWEI_CX_R1_W3_INPUT_MUTATION_FORBIDDEN');
  return freeze({...base,envelopeDigest});
}

export default Object.freeze({buildZiweiCurrentPublicationEnvelope,ZIWEI_CX_R1_CURRENT_PUBLICATION_AUTHORITY});
