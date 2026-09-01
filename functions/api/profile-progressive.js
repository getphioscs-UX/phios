import instrument from '../../content/professional/profile/assessment/self-assessment-instrument-v2.json';
import providerRegistry from '../../content/professional/profile/registries/external-profile-provider-registry-v1.json';
import reasoningBank from '../../content/profile/academic/reasoning/original-reasoning-task-bank-v1.json';
import reasoningAuthority from '../../content/profile/academic/reasoning/reasoning-bank-authority-v1.json';
import quickSelection from '../../content/profile/ux/profile-quick-profile-selection-v1.json';
import reasoningReview from '../../content/profile/ux/profile-reasoning-review-set-v1.json';
import {
  PROFILE_CONTEXT_PURPOSE, SELF_ASSESSMENT_PURPOSE,
  normalizeExternalProfileInput, scoreSelfAssessment, buildSelfAssessmentProfileSignals,
  buildExternalProfileSignals, buildReasoningPerformanceSignals
} from '../profile/profile-foundation-runtime.js';
import { scoreOriginalReasoningTaskBank, renderReasoningPerformance } from '../profile/academic-bridge-runtime.js';
import { buildProgressiveProfileView } from '../profile/profile-progressive-ux-runtime.js';
import { PROFILE_PRODUCTION_AUTHORITY, resolveProfileExecution } from '../profile/profile-production-authority.js';

const H={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:H});
const previewFrom=context=>new URL(context.request.url).searchParams.get('preview')==='1';
const locale=v=>v==='zh-Hans'?'zh-Hans':'en';
const publicTask=item=>({taskId:item.taskId,family:item.family,difficultyTier:item.difficultyTier,prompt:item.prompt,options:item.options});
const selfItem=item=>({itemId:item.itemId,domainId:item.domainId,facetId:item.facetId,prompt:item.prompt,sensitive:item.sensitive===true,responseScale:item.responseScale});
function execution(context,body={}){return resolveProfileExecution({preview:previewFrom(context)||body?.preview===true});}
function denied(exec){return json({ok:false,error:'PROFILE_HUMAN_REVIEW_PENDING',authority:{status:PROFILE_PRODUCTION_AUTHORITY.status,customerPublicationAllowed:false,reviewPreviewAllowed:PROFILE_PRODUCTION_AUTHORITY.reviewPreviewAllowed},execution:exec},403);}
function errorResponse(error){return json({ok:false,error:error?.code||error?.message||'PROFILE_REQUEST_FAILED'},Number(error?.status)||422);}

export async function onRequestGet(context){
  const exec=execution(context); if(!exec.allowed)return denied(exec);
  const mode=String(new URL(context.request.url).searchParams.get('mode')||'QUICK_PROFILE').toUpperCase();
  const quickSet=new Set(quickSelection.itemIds);
  const reasoningSet=new Set(reasoningReview.taskIds);
  const common={ok:true,mode,execution:exec,authority:{status:PROFILE_PRODUCTION_AUTHORITY.status,customerPublicationAllowed:PROFILE_PRODUCTION_AUTHORITY.customerPublicationAllowed},governance:{optionalLane:true,automaticPersistence:false,noMasterScore:true,noDiagnosis:true}};
  if(mode==='QUICK_PROFILE')return json({...common,instrument:{instrumentCode:instrument.instrumentCode,instrumentVersion:instrument.instrumentVersion,responseScale:instrument.responseScale,items:instrument.items.filter(x=>quickSet.has(x.itemId)).map(selfItem),sensitiveConsentRequiredWhenAnswered:true}});
  if(mode==='FULL_SELF_ASSESSMENT')return json({...common,instrument:{instrumentCode:instrument.instrumentCode,instrumentVersion:instrument.instrumentVersion,responseScale:instrument.responseScale,items:instrument.items.map(selfItem),sensitiveConsentRequiredWhenAnswered:true}});
  if(mode==='REASONING_TASKS')return json({...common,taskBank:{taskBankId:reasoningBank.taskBankId,taskBankVersion:reasoningBank.taskBankVersion,normingState:reasoningAuthority.normingState,items:reasoningBank.items.filter(x=>reasoningSet.has(x.taskId)).map(publicTask),boundaries:['RAW_TASK_SAMPLE_ONLY','NOT_IQ','NOT_PERCENTILE','NOT_DIAGNOSIS']}});
  if(mode==='IMPORT_EXTERNAL_RESULT')return json({...common,providers:providerRegistry.providers.map(p=>({providerFamily:p.providerFamily,providerName:p.providerName,manualResultImportAllowed:p.manualResultImportAllowed,itemBankReproductionAllowed:p.itemBankReproductionAllowed,termsNotes:p.termsNotes}))});
  return json({ok:false,error:'PROFILE_MODE_NOT_ADMITTED'},400);
}

export async function onRequestPost(context){
  let body;try{body=await context.request.json()}catch{return json({ok:false,error:'INVALID_JSON'},400)}
  const exec=execution(context,body); if(!exec.allowed)return denied(exec);
  const mode=String(body?.mode||'').toUpperCase(); const participantRef=String(body?.participantRef||'PERSON-A').trim(); const assessmentDate=String(body?.assessmentDate||'').trim(); const lang=locale(body?.locale);
  try{
    let signals=[],rawResult=null,reasoningView=null;
    if(mode==='QUICK_PROFILE'||mode==='FULL_SELF_ASSESSMENT'){
      const allowed=mode==='QUICK_PROFILE'?new Set(quickSelection.itemIds):null;
      const responses=allowed?Object.fromEntries(Object.entries(body.responses||{}).filter(([id])=>allowed.has(id))):body.responses||{};
      rawResult=scoreSelfAssessment({instrument,responses,participantRef,assessmentDate,customerConfirmed:body.customerConfirmed===true,consent:body.consent===true,sensitiveConsent:body.sensitiveConsent===true,purpose:SELF_ASSESSMENT_PURPOSE});
      signals=await buildSelfAssessmentProfileSignals(rawResult);
    } else if(mode==='REASONING_TASKS'){
      const allowed=new Set(reasoningReview.taskIds); const responses=Object.fromEntries(Object.entries(body.responses||{}).filter(([id])=>allowed.has(id)));
      rawResult=scoreOriginalReasoningTaskBank({bank:reasoningBank,bankAuthority:reasoningAuthority,responses,participantRef,assessmentDate});
      signals=await buildReasoningPerformanceSignals(rawResult.performance); reasoningView=renderReasoningPerformance(rawResult,{locale:lang});
    } else if(mode==='IMPORT_EXTERNAL_RESULT'){
      rawResult=normalizeExternalProfileInput({participantRef,providerFamily:body.providerFamily,providerName:body.providerName,resultLabel:body.resultLabel,resultDimensions:body.resultDimensions||{},assessmentDate:body.assessmentDate||null,resultPrecision:body.resultPrecision||'CONFIRMED',customerConfirmed:body.customerConfirmed===true,consent:body.consent===true,purpose:PROFILE_CONTEXT_PURPOSE,persistencePreference:'DO_NOT_SAVE',provenance:[{source:'CUSTOMER_ENTRY'}]},providerRegistry);
      signals=await buildExternalProfileSignals(rawResult);
    } else return json({ok:false,error:'PROFILE_MODE_NOT_ADMITTED'},400);
    const view=await buildProgressiveProfileView({mode,profileSignals:signals,participantRef,asOfDate:body.asOfDate||assessmentDate||null,locale:lang,customerPublishable:exec.customerPublishable,preview:exec.preview});
    return json({ok:true,mode,view,reasoningView,governance:{automaticPersistence:false,rawResultStored:false,sourceClassPreserved:true,customerPublishable:exec.customerPublishable,preview:exec.preview}});
  }catch(error){return errorResponse(error)}
}
