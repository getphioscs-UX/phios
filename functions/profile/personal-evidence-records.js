// Compatible evidence extension. Scoring, identity, storage and permission remain upstream owners.
import {evaluateVisibility,evaluateDataPermission} from '../../scripts/lib/reality-data-governance/rdg-access-rights-v1.mjs';
import {createNavigationContract} from '../runtime/navigation/navigation-contract.js';
export const EXPERIENCE_SCHEMA='PHIOS-PROFILE-EXPERIENCE-v1';
export const CAPABILITIES=['PROCESS_IMPROVEMENT','DATA_ORGANIZATION','COORDINATION','PROJECT_EXECUTION','COMMUNICATION','LEARNING','ANALYTICAL_REASONING','OPERATIONAL_CONTROL','FINANCIAL_AWARENESS','SYSTEM_IMPLEMENTATION','PROBLEM_SOLVING','LEADERSHIP_MANAGEMENT'];
const ACTIVITY_CAPABILITY={DESIGNED_PROCESS:'PROCESS_IMPROVEMENT',ORGANIZED_DATA:'DATA_ORGANIZATION',COORDINATED_PEOPLE:'COORDINATION',DELIVERED_PROJECT:'PROJECT_EXECUTION',PREPARED_COST_DATA:'FINANCIAL_AWARENESS',IMPLEMENTED_SYSTEM:'SYSTEM_IMPLEMENTATION'};
const fields=['title','context','role','periodStart','periodEnd','responsibility','action','tools','people','outcome','measurableResult','sourceReference','reflection','unknowns','claim','claimDirection','capabilities','sourceType','language','activity'];
export const evidenceError=(code,status=422)=>Object.assign(new Error(code),{code,status});
const demand=(ok,code,status)=>{if(!ok)throw evidenceError(code,status);};
const text=(x,max=2000)=>{demand(typeof x==='string'&&x.length<=max,'EVIDENCE_TEXT_INVALID');return x.trim();};
function date(x){demand(/^\d{4}-\d{2}-\d{2}$/.test(x)&&new Date(x+'T00:00:00Z').toISOString().slice(0,10)===x,'EVIDENCE_DATE_INVALID');return x;}
export function normalizeExperience(input,{ownerId,recordId,version,now,previous=null}){
 demand(input&&typeof input==='object'&&!Array.isArray(input),'EVIDENCE_OBJECT_REQUIRED');
 demand(Object.keys(input).every(k=>fields.includes(k)),'EVIDENCE_UNKNOWN_FIELD');
 const v=Object.fromEntries(fields.filter(k=>k!=='capabilities').map(k=>[k,text(input[k]??'',k==='title'?160:2000)]));
 demand(v.title&&v.action&&v.responsibility&&v.unknowns,'EVIDENCE_REQUIRED_DETAILS');
 demand(['SELF_REPORTED','THIRD_PARTY_FEEDBACK','EXTERNAL_DOCUMENT'].includes(v.sourceType),'EVIDENCE_SOURCE_NOT_ADMITTED');
 demand(v.sourceType==='SELF_REPORTED'||v.sourceReference,'EVIDENCE_SOURCE_REFERENCE_REQUIRED');
 // A file reference or feedback is still a user-supplied account, never independently verified.
 demand(['en','zh-Hans'].includes(v.language),'EVIDENCE_LANGUAGE_INVALID');
 date(v.periodStart);if(v.periodEnd)date(v.periodEnd);
 demand(v.periodStart<=now.slice(0,10)&&(!v.periodEnd||(v.periodEnd>=v.periodStart&&v.periodEnd<=now.slice(0,10))),'EVIDENCE_PERIOD_INVALID');
 demand(['SUPPORTS','CHALLENGES','UNDECIDED'].includes(v.claimDirection),'EVIDENCE_CLAIM_DIRECTION_INVALID');
 demand(Array.isArray(input.capabilities)&&input.capabilities.length<=12&&input.capabilities.every(x=>CAPABILITIES.includes(x)),'EVIDENCE_CAPABILITY_INVALID');
 demand(!v.activity||Object.hasOwn(ACTIVITY_CAPABILITY,v.activity),'EVIDENCE_ACTIVITY_INVALID');
 const derived=v.activity?ACTIVITY_CAPABILITY[v.activity]:null;
 return {schemaVersion:EXPERIENCE_SCHEMA,recordId,ownerId,version,...v,capabilities:[...new Set([...input.capabilities,...(derived?[derived]:[])])],
  capabilityDerivation:derived?{capability:derived,basis:'STRUCTURED_USER_REPORTED_ACTIVITY',independentlyVerified:false}:null,
  recordedAt:now,observationDate:v.periodStart,observationPeriod:{start:v.periodStart,end:v.periodEnd||null},
  evidenceStatus:'RECORDED',verificationMethod:'NOT_INDEPENDENTLY_VERIFIED',interpretationStatus:'CANDIDATE_ONLY',
  privacyLevel:'SUBJECT_ONLY',sharingPermission:'EXPLICIT_PER_REQUEST',revocationStatus:'ACTIVE',
  provenance:[{source:'CUSTOMER_ENTRY',sourceReference:v.sourceReference||null,recordedAt:now}],
  supersedes:previous?{recordId:previous.recordId,version:previous.version}:null,
  correctionRelation:previous?'USER_CORRECTION':null, realityFact:false};
}
export function compareExperiences(a,b){
 const refs=[a,b].map(x=>({recordId:x.recordId,version:x.version}));
 if(!a.claim||a.claim!==b.claim)return {state:'NOT_COMPARABLE',refs,reason:'DIFFERENT_OR_MISSING_CLAIM',next:'Name the same specific claim before comparing.'};
 if(a.context!==b.context)return {state:'CONTEXT_DEPENDENT',refs,reason:'DIFFERENT_CONTEXT',next:'Check responsibilities, constraints and outcomes in each setting.'};
 if([a,b].some(x=>x.claimDirection==='UNDECIDED'||!x.outcome))return {state:'INSUFFICIENT_DATA',refs,reason:'OUTCOME_OR_DIRECTION_MISSING',next:'Record an observable outcome and counter-evidence.'};
 return {state:a.claimDirection===b.claimDirection?'CONSISTENT':'CONFLICTING',refs,reason:'CUSTOMER_REPORTED_SUPPORT_AND_COUNTER_EVIDENCE',next:'Confirm the actual scope, outcomes and voluntary feedback; no ability certification follows.'};
}
export function compareAssessmentVersions(a,b){
 const same=a.instrumentId&&a.instrumentId===b.instrumentId&&a.instrumentVersion&&a.instrumentVersion===b.instrumentVersion&&a.context===b.context;
 return {state:same?'COMPARABLE_SAME_INSTRUMENT':'NOT_COMPARABLE',scoreConversionAllowed:false,reason:same?'RAW_SCORE_CHANGE_ONLY_NOT_GROWTH_PROOF':'INSTRUMENT_VERSION_OR_CONTEXT_DIFFERS'};
}
export function describeExperience(record){
 return {did:{responsibility:record.responsibility,action:record.action,outcome:record.outcome},
  candidates:record.capabilities.map(capability=>({capability,basis:{recordId:record.recordId,version:record.version},status:record.capabilityDerivation?.capability===capability?'SYSTEM_DERIVED_FROM_SELF_REPORTED_ACTIVITY':'USER_SELECTED_CANDIDATE',certified:false})),
  limitations:[record.unknowns,record.measurableResult?'USER_REPORTED_RESULT_NOT_VERIFIED':'NO_MEASURED_OUTCOME','NO_INDEPENDENT_VERIFICATION'],
  nextValidation:'Confirm scope, measurable before/after outcomes, qualifications and voluntary feedback.',providerCalls:0};
}
export function projectExperienceHandoff(records,input,{ownerId,now}){
 demand(['ASK','FINANCIAL','WORLD','NAVIGATION','CONFIGURATION'].includes(input.target),'EVIDENCE_TARGET_INVALID');
 demand(input.consent===true&&typeof input.purpose==='string'&&input.purpose.trim().length>0&&input.purpose.length<=240,'EVIDENCE_HANDOFF_CONSENT_REQUIRED',403);
 demand(input.purposeCode==='RUNTIME_CONTINUITY','EVIDENCE_PURPOSE_NOT_ADMITTED',403);
 demand(Number.isFinite(Date.parse(input.expiresAt))&&Date.parse(input.expiresAt)>Date.parse(now)&&Date.parse(input.expiresAt)<=Date.parse(now)+600000,'EVIDENCE_HANDOFF_EXPIRED',403);
 const visibilityDecision=evaluateVisibility({visibilityScope:'SUBJECT_ONLY',actorReference:ownerId,subjectReference:records[0]?.ownerId});
 demand(evaluateDataPermission({actorReference:ownerId,subjectReference:records[0]?.ownerId,purposeCode:'RUNTIME_CONTINUITY',purposeAllowed:true,visibilityDecision,sensitivityClass:'SENSITIVE',consentValid:input.consent})==='ALLOW','EVIDENCE_PERMISSION_DENIED',403);
 const references=records.map(r=>{demand(r.ownerId===ownerId&&r.revocationStatus==='ACTIVE','EVIDENCE_ACCESS_DENIED',403);return {recordId:r.recordId,version:r.version,sourceType:r.sourceType,observationPeriod:r.observationPeriod,recordedAt:r.recordedAt,language:r.language,claim:r.claim,claimDirection:r.claimDirection,action:r.action,outcome:r.outcome,unknowns:r.unknowns,verificationMethod:r.verificationMethod,provenance:r.provenance,privacyLevel:r.privacyLevel,realityFact:false};});
 const navigation=input.target==='NAVIGATION'?createNavigationContract({runtimeEntityId:ownerId,currentPosition:{question:input.purpose},constraints:records.map(r=>r.unknowns),unknownReality:['Market, qualification and income continuity require separate evidence.'],availablePaths:[],reviewConditions:['Review actual outcomes before deciding.']}):null;
 return {target:input.target,purpose:input.purpose,expiresAt:input.expiresAt,references,navigation,automaticPersistence:false,targetMutation:false,
  receiverState:'REFERENCE_PACKAGE_ONLY',configuration:input.target==='CONFIGURATION'?{interpretation:null,observedEvidence:references,state:'NO_AUTHORIZED_CONFIGURATION',predictionValidated:false}:null,
  world:input.target==='WORLD'?{state:'WORLD_DATA_UNAVAILABLE',currentMarketClaim:null}:null,
  financial:input.target==='FINANCIAL'?{state:'CONTEXT_ONLY',cashflow:null,advice:false}:null,providerCalls:0};
}
