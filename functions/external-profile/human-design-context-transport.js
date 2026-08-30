import crypto from 'node:crypto';
import {EXTERNAL_PROFILE_CONFIRMED_VERSION} from './external-profile-confirmation.js';
import {buildCanonicalHumanDesignExternalChart} from './human-design-canonical-chart.js';
import {buildHumanDesignExternalReadingIr} from './human-design-reading-runtime.js';
import {composeHumanDesignRealityBridge} from './human-design-reality-composition.js';
import {HD_EXTERNAL_PRODUCTION} from './human-design-external-authority.js';

export const HD_CONFIRMED_CONTEXT_TRANSPORT_VERSION='PHI-OS-ECR-R3-CONFIRMED-HD-CONTEXT-TRANSPORT-v1.0.0';

const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child)}return value};
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])])):value;
const digest=value=>crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
const fail=code=>{const error=new TypeError(code);error.code=code;throw error};

function assertProfileDigest(profile){
  if(typeof profile?.profileDigest!=='string'||!/^[a-f0-9]{64}$/i.test(profile.profileDigest))fail('HD_CONTEXT_PROFILE_DIGEST_REQUIRED');
  const {profileDigest,...seed}=profile;
  if(digest(seed)!==profileDigest)fail('HD_CONTEXT_PROFILE_DIGEST_MISMATCH');
}

export function normalizeConfirmedHumanDesignContextProfile(profile){
  if(!profile||typeof profile!=='object'||Array.isArray(profile))fail('HD_CONTEXT_CONFIRMED_PROFILE_REQUIRED');
  if(profile.schemaVersion!==EXTERNAL_PROFILE_CONFIRMED_VERSION)fail('HD_CONTEXT_CONFIRMED_PROFILE_SCHEMA_REQUIRED');
  if(profile.methodId!=='XPF'||profile.profileFamily!=='HUMAN_DESIGN'||profile.authorityClass!=='CUSTOMER_SUPPLIED_EXTERNAL_CONTEXT')fail('HD_CONTEXT_EXTERNAL_AUTHORITY_REQUIRED');
  if(typeof profile.intakeId!=='string'||!profile.intakeId.trim())fail('HD_CONTEXT_INTAKE_ID_REQUIRED');
  if(profile.provenance?.customerConfirmed!==true||profile.provenance?.phiosCalculated!==false)fail('HD_CONTEXT_CUSTOMER_CONFIRMATION_REQUIRED');
  if(profile.boundary?.canonicalMethodProjection!==false||profile.boundary?.calculatedMethodConsensusEligible!==false||profile.boundary?.persisted!==false)fail('HD_CONTEXT_AUTHORITY_BOUNDARY_REQUIRED');
  const records=Array.isArray(profile.records)?profile.records:[];
  if(!records.length)fail('HD_CONTEXT_CONFIRMED_RECORD_REQUIRED');
  const seen=new Set();
  for(const record of records){
    if(!record||typeof record!=='object'||!record.field||record.value==null||record.customerConfirmed!==true||record.phiosCalculated!==false)fail('HD_CONTEXT_RECORD_BOUNDARY_REQUIRED');
    if(seen.has(record.field))fail('HD_CONTEXT_DUPLICATE_FIELD');
    seen.add(record.field);
  }
  assertProfileDigest(profile);
  return freeze(profile);
}

function readingAvailability(customerPublishable){
  return freeze({
    state:customerPublishable?'CUSTOMER_PUBLISHED':'HUMAN_REVIEW_PENDING',
    machineCandidateAvailable:HD_EXTERNAL_PRODUCTION.readingCandidateMachineExecutable===true,
    humanReviewRequired:HD_EXTERNAL_PRODUCTION.humanReviewRequired===true,
    humanReviewAccepted:HD_EXTERNAL_PRODUCTION.humanReviewAccepted===true,
    customerPublishable,
    publicationClass:customerPublishable?'HUMAN_ACCEPTED_EXTERNAL_CHART_READING':'NOT_PUBLISHED',
    authorityClass:'CUSTOMER_SUPPLIED_EXTERNAL_CONTEXT'
  });
}

export function buildConfirmedHumanDesignContextTransport(confirmedExternalProfile,{locale='en',intent='',generatedAt=new Date().toISOString()}={}){
  const profile=normalizeConfirmedHumanDesignContextProfile(confirmedExternalProfile);
  const normalizedLocale=locale==='zh-Hans'?'zh-Hans':'en';
  const transportedAt=new Date(generatedAt).toISOString();
  const canonicalHumanDesignChart=buildCanonicalHumanDesignExternalChart(profile,{generatedAt:transportedAt});
  const customerPublishable=HD_EXTERNAL_PRODUCTION.customerReadingPublicationAllowed===true&&HD_EXTERNAL_PRODUCTION.humanReviewAccepted===true;
  const humanDesignReading=customerPublishable?buildHumanDesignExternalReadingIr(canonicalHumanDesignChart,{locale:normalizedLocale,intent}):null;
  const humanDesignRealityComposition=humanDesignReading?composeHumanDesignRealityBridge(humanDesignReading,{locale:normalizedLocale}):null;
  const lineage=freeze({
    profileDigest:profile.profileDigest,
    chartDigest:canonicalHumanDesignChart.chartDigest,
    readingDigest:humanDesignReading?.readingDigest||null,
    compositionDigest:humanDesignRealityComposition?.compositionDigest||null
  });
  const boundary=freeze({
    customerConfirmedProfileRequired:true,
    rawUploadTransported:false,
    unconfirmedExtractionAccepted:false,
    confirmedProfileEchoed:false,
    clientDerivedChartTrusted:false,
    serverRebuiltCanonicalChart:true,
    phiosHumanDesignCalculationAuthorityCreated:false,
    automaticHumanDesignCalculationUsed:false,
    hdrPublicExecutionUsed:false,
    xpfCountsTowardMethodAgreement:false,
    ecrHumanDesignComparisonComposed:false,
    comparisonIrCreated:false,
    currentRealityEvidenceCreated:false,
    persisted:false,
    runtimeMemoryWritten:false
  });
  const seed={
    schemaVersion:HD_CONFIRMED_CONTEXT_TRANSPORT_VERSION,
    contextType:'CONFIRMED_HUMAN_DESIGN_EXTERNAL_CONTEXT',
    profileFamily:'HUMAN_DESIGN',
    authorityClass:'CUSTOMER_SUPPLIED_EXTERNAL_CONTEXT',
    sourceProfileDigest:profile.profileDigest,
    intakeId:profile.intakeId,
    transportedAt,
    locale:normalizedLocale,
    canonicalHumanDesignChart,
    readingAvailability:readingAvailability(customerPublishable),
    humanDesignReading,
    humanDesignRealityComposition,
    lineage,
    boundary
  };
  return freeze({...seed,transportDigest:digest(seed)});
}

export default Object.freeze({
  HD_CONFIRMED_CONTEXT_TRANSPORT_VERSION,
  normalizeConfirmedHumanDesignContextProfile,
  buildConfirmedHumanDesignContextTransport
});
