import instrument from '../../content/professional/profile/assessment/self-assessment-instrument-v2.json';
import providerRegistry from '../../content/professional/profile/registries/external-profile-provider-registry-v1.json';
import reasoningBank from '../../content/profile/academic/reasoning/original-reasoning-task-bank-v1.json';
import ipip50 from '../../content/profile/academic/ipip/ipip-big-five-50-v1.json';
import ipip120 from '../../content/profile/academic/ipip/ipip-neo-120-v1.json';
import financialInstrument from '../../content/profile/academic/financial/phi-financial-capability-instrument-v1.json';
import reasoningAuthority from '../../content/profile/academic/reasoning/reasoning-bank-authority-v1.json';
import quickSelection from '../../content/profile/ux/profile-quick-profile-selection-v1.json';
import reasoningReview from '../../content/profile/ux/profile-reasoning-review-set-v1.json';
import {
  PROFILE_CONTEXT_PURPOSE, SELF_ASSESSMENT_PURPOSE,
  normalizeExternalProfileInput, scoreSelfAssessment, buildSelfAssessmentProfileSignals,
  buildExternalProfileSignals, buildReasoningPerformanceSignals
} from '../profile/profile-foundation-runtime.js';
import {
  scoreOriginalReasoningTaskBank, renderReasoningPerformance, scoreIpipAssessment, scoreFinancialCapabilityAssessment, buildAcademicProfileSignalBundle,
  fetchOnetInterestProfilerQuestionSet, fetchOnetInterestProfilerResults,
  fetchOnetMatchingCareers, fetchOnetJobZones, fetchOnetCareerDetail,
  normalizeOnetInterestProfilerResult, normalizeOnetCareerDetail,
  buildOnetProfileSignals
} from '../profile/academic-bridge-runtime.js';
import { buildProgressiveProfileView } from '../profile/profile-progressive-ux-runtime.js';
import { PROFILE_PRODUCTION_AUTHORITY, resolveProfileExecution } from '../profile/profile-production-authority.js';

const H={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:H});
const previewFrom=context=>new URL(context.request.url).searchParams.get('preview')==='1';
const locale=v=>v==='zh-Hans'?'zh-Hans':'en';
const publicTask=item=>({taskId:item.taskId,family:item.family,difficultyTier:item.difficultyTier,prompt:item.prompt,options:item.options});
const selfItem=item=>({itemId:item.itemId,domainId:item.domainId,facetId:item.facetId,prompt:item.prompt,sensitive:item.sensitive===true,responseScale:item.responseScale});
const ipipItem=item=>({itemId:item.itemId,order:item.order,factorId:item.factorId??null,domainCode:item.domainCode??null,facetId:item.facetId??null,facetName:item.facetName??null,prompt:item.prompt,reverseKeyed:item.reverseKeyed===true,sensitive:item.sensitive===true,responseScale:item.responseScale});
const financialItem=item=>({itemId:item.itemId,section:item.section,sourceClass:item.sourceClass,prompt:item.prompt,response:item.response,sensitive:item.sensitive===true,options:Array.isArray(item.scoring?.options)?item.scoring.options:[]});
function execution(context,body={}){return resolveProfileExecution({preview:previewFrom(context)||body?.preview===true});}
function denied(exec){return json({ok:false,error:'PROFILE_HUMAN_REVIEW_PENDING',authority:{status:PROFILE_PRODUCTION_AUTHORITY.status,customerPublicationAllowed:false,reviewPreviewAllowed:PROFILE_PRODUCTION_AUTHORITY.reviewPreviewAllowed},execution:exec},403);}
function errorResponse(error){const code=error?.code||error?.message||'PROFILE_REQUEST_FAILED';const status=code==='PRF_ONET_PROVIDER_NOT_CONFIGURED'?503:Number(error?.status)||422;return json({ok:false,error:code},status);}
function onetKey(context){const key=String(context?.env?.ONET_WEB_SERVICES_API_KEY||'').trim();if(!key){const e=new Error('PRF_ONET_PROVIDER_NOT_CONFIGURED');e.code='PRF_ONET_PROVIDER_NOT_CONFIGURED';throw e;}return key;}
const onetAttribution='This application incorporates information from O*NET Web Services by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA). O*NET® is a trademark of USDOL/ETA.';

export async function onRequestGet(context){
  const exec=execution(context); if(!exec.allowed)return denied(exec);
  const url=new URL(context.request.url); const mode=String(url.searchParams.get('mode')||'QUICK_PROFILE').toUpperCase();
  const quickSet=new Set(quickSelection.itemIds); const reasoningSet=new Set(reasoningReview.taskIds);
  const common={ok:true,mode,execution:exec,authority:{status:PROFILE_PRODUCTION_AUTHORITY.status,customerPublicationAllowed:PROFILE_PRODUCTION_AUTHORITY.customerPublicationAllowed},governance:{optionalLane:true,automaticPersistence:false,noMasterScore:true,noDiagnosis:true}};
  try{
    if(mode==='QUICK_PROFILE')return json({...common,instrument:{instrumentCode:instrument.instrumentCode,instrumentVersion:instrument.instrumentVersion,responseScale:instrument.responseScale,items:instrument.items.filter(x=>quickSet.has(x.itemId)).map(selfItem),sensitiveConsentRequiredWhenAnswered:true}});
    if(mode==='FULL_SELF_ASSESSMENT')return json({...common,instrument:{instrumentCode:instrument.instrumentCode,instrumentVersion:instrument.instrumentVersion,responseScale:instrument.responseScale,items:instrument.items.map(selfItem),sensitiveConsentRequiredWhenAnswered:true}});
    if(mode==='REASONING_TASKS')return json({...common,taskBank:{taskBankId:reasoningBank.taskBankId,taskBankVersion:reasoningBank.taskBankVersion,normingState:reasoningAuthority.normingState,items:reasoningBank.items.filter(x=>reasoningSet.has(x.taskId)).map(publicTask),boundaries:['RAW_TASK_SAMPLE_ONLY','NOT_IQ','NOT_PERCENTILE','NOT_DIAGNOSIS']}});
    if(mode==='IMPORT_EXTERNAL_RESULT')return json({...common,providers:providerRegistry.providers.map(p=>({providerFamily:p.providerFamily,providerName:p.providerName,manualResultImportAllowed:p.manualResultImportAllowed,itemBankReproductionAllowed:p.itemBankReproductionAllowed,termsNotes:p.termsNotes}))});
    if(mode==='BIG_FIVE'){const form=String(url.searchParams.get('form')||'IPIP_BIG_FIVE_50').toUpperCase();const source=form==='IPIP_NEO_120'?ipip120:form==='IPIP_BIG_FIVE_50'?ipip50:null;if(!source)return json({ok:false,error:'PROFILE_BIG_FIVE_FORM_NOT_ADMITTED'},400);return json({...common,form,instrument:{instrumentId:source.instrumentId,instrumentVersion:source.instrumentVersion,responseScale:source.responseScale,items:source.items.map(ipipItem),factors:source.factors||null,domains:source.domains||null,facets:source.facets||null},boundaries:['STANDARDIZED_SELF_REPORT','FIRST_PARTY_KEYED_SCORING','NOT_NORMED','NOT_PERCENTILE','NOT_DIAGNOSIS','NO_SYMBOLIC_VALIDATION_TRANSFER']});}
    if(mode==='FINANCIAL_CAPABILITY')return json({...common,instrument:{instrumentId:financialInstrument.instrumentId,instrumentVersion:financialInstrument.instrumentVersion,responseScales:financialInstrument.responseScales,items:financialInstrument.items.map(financialItem),adaptationDisclosure:financialInstrument.adaptationDisclosure},boundaries:['MEASURED_TASK_PERFORMANCE_AND_STANDARDIZED_SELF_REPORT_SEPARATE','ADAPTED_SCORED','NOT_OFFICIAL_OECD_SCORE','NOT_NORMED','NOT_FINANCIAL_ADVICE']});
    if(mode==='CAREER_INTERESTS'){
      const apiKey=onetKey(context); const careerCode=String(url.searchParams.get('careerCode')||'').trim();
      if(careerCode){const detail=normalizeOnetCareerDetail(await fetchOnetCareerDetail({apiKey,code:careerCode}));return json({...common,careerDetail:detail,attribution:onetAttribution});}
      const form=String(url.searchParams.get('form')||'MINI_30').toUpperCase();
      const [questionSet,jobZonesRaw]=await Promise.all([fetchOnetInterestProfilerQuestionSet({apiKey,form}),fetchOnetJobZones({apiKey})]);
      const jobZones=(Array.isArray(jobZonesRaw)?jobZonesRaw:(jobZonesRaw.job_zone||jobZonesRaw.job_zones||[])).map(x=>({code:Number(x.code),title:String(x.title||'')})).filter(x=>Number.isInteger(x.code));
      return json({...common,provider:'O_NET_WEB_SERVICES_V2',form,questionSet,jobZones,attribution:onetAttribution,boundaries:['STANDARDIZED_SELF_REPORT_INTEREST','EXTERNALLY_SCORED','NOT_ABILITY_SCORE','NOT_JOB_FIT_GUARANTEE','NO_EMPLOYMENT_DECISION_AUTHORITY','NO_AUTOMATIC_PERSISTENCE']});
    }
    return json({ok:false,error:'PROFILE_MODE_NOT_ADMITTED'},400);
  }catch(error){return errorResponse(error)}
}

export async function onRequestPost(context){
  let body;try{body=await context.request.json()}catch{return json({ok:false,error:'INVALID_JSON'},400)}
  const exec=execution(context,body); if(!exec.allowed)return denied(exec);
  const mode=String(body?.mode||'').toUpperCase(); const participantRef=String(body?.participantRef||'PERSON-A').trim(); const assessmentDate=String(body?.assessmentDate||'').trim(); const lang=locale(body?.locale);
  try{
    let signals=[],rawResult=null,reasoningView=null,careerExploration=null,profileSummary=null,financialSummary=null;
    if(mode==='QUICK_PROFILE'||mode==='FULL_SELF_ASSESSMENT'){
      const allowed=mode==='QUICK_PROFILE'?new Set(quickSelection.itemIds):null;
      const responses=allowed?Object.fromEntries(Object.entries(body.responses||{}).filter(([id])=>allowed.has(id))):body.responses||{};
      rawResult=scoreSelfAssessment({instrument,responses,participantRef,assessmentDate,customerConfirmed:body.customerConfirmed===true,consent:body.consent===true,sensitiveConsent:body.sensitiveConsent===true,purpose:SELF_ASSESSMENT_PURPOSE});
      signals=await buildSelfAssessmentProfileSignals(rawResult);
    } else if(mode==='REASONING_TASKS'){
      const allowed=new Set(reasoningReview.taskIds); const responses=Object.fromEntries(Object.entries(body.responses||{}).filter(([id])=>allowed.has(id)));
      rawResult=scoreOriginalReasoningTaskBank({bank:reasoningBank,bankAuthority:reasoningAuthority,responses,participantRef,assessmentDate});
      signals=await buildReasoningPerformanceSignals(rawResult.performance); reasoningView=renderReasoningPerformance(rawResult,{locale:lang});
    } else if(mode==='BIG_FIVE'){
      const form=String(body.form||'IPIP_BIG_FIVE_50').toUpperCase();const source=form==='IPIP_NEO_120'?ipip120:form==='IPIP_BIG_FIVE_50'?ipip50:null;if(!source)return json({ok:false,error:'PROFILE_BIG_FIVE_FORM_NOT_ADMITTED'},400);
      rawResult=await scoreIpipAssessment({instrument:source,responses:body.responses||{},participantRef,assessmentDate,consent:body.consent===true,sensitiveConsent:body.sensitiveConsent===true,customerConfirmed:body.customerConfirmed===true});
      signals=(await buildAcademicProfileSignalBundle({ipipResult:rawResult})).signals;profileSummary={instrumentId:rawResult.instrumentId,instrumentVersion:rawResult.instrumentVersion,responseCompleteness:rawResult.responseCompleteness,scores:rawResult.scores,normingState:rawResult.normingState,scoringState:rawResult.scoringState};
    } else if(mode==='FINANCIAL_CAPABILITY'){
      rawResult=await scoreFinancialCapabilityAssessment({instrument:financialInstrument,responses:body.responses||{},participantRef,assessmentDate,consent:body.consent===true,customerConfirmed:body.customerConfirmed===true});
      signals=(await buildAcademicProfileSignalBundle({financialResult:rawResult})).signals;financialSummary={instrumentId:rawResult.instrumentId,instrumentVersion:rawResult.instrumentVersion,sections:rawResult.sections,sourceClasses:rawResult.sourceClasses,adaptationDisclosure:rawResult.adaptationDisclosure,normingState:rawResult.normingState,scoringState:rawResult.scoringState};
    } else if(mode==='IMPORT_EXTERNAL_RESULT'){
      rawResult=normalizeExternalProfileInput({participantRef,providerFamily:body.providerFamily,providerName:body.providerName,resultLabel:body.resultLabel,resultDimensions:body.resultDimensions||{},assessmentDate:body.assessmentDate||null,resultPrecision:body.resultPrecision||'CONFIRMED',customerConfirmed:body.customerConfirmed===true,consent:body.consent===true,purpose:PROFILE_CONTEXT_PURPOSE,persistencePreference:'DO_NOT_SAVE',provenance:[{source:'CUSTOMER_ENTRY'}]},providerRegistry);
      signals=await buildExternalProfileSignals(rawResult);
    } else if(mode==='CAREER_INTERESTS'){
      if(body.consent!==true){const e=new Error('PRF_ONET_EXPLICIT_CONSENT_REQUIRED');e.code='PRF_ONET_EXPLICIT_CONSENT_REQUIRED';throw e;}
      const apiKey=onetKey(context); const form=String(body.form||'MINI_30').toUpperCase(); const answers=body.answers; const zone=body.zone===null||body.zone===undefined||body.zone===''?null:Number(body.zone);
      const [providerResult,careers,jobZones]=await Promise.all([
        fetchOnetInterestProfilerResults({apiKey,answers}),
        fetchOnetMatchingCareers({apiKey,answers,zone,start:1,end:24}),
        fetchOnetJobZones({apiKey})
      ]);
      rawResult=await normalizeOnetInterestProfilerResult({participantRef,assessmentDate,form,providerResult,careers,jobZones,selectedJobZone:zone,customerConfirmed:body.customerConfirmed===true});
      signals=await buildOnetProfileSignals(rawResult);
      careerExploration={provider:rawResult.provider,form:rawResult.form,itemCount:rawResult.itemCount,interests:rawResult.interests,interestRanking:rawResult.interestRanking,careers:rawResult.careers,jobZones:rawResult.jobZones,selectedJobZone:rawResult.selectedJobZone,attribution:rawResult.attribution,boundaries:['INTEREST_EXPLORATION_ONLY','PROVIDER_RAW_FIT_PRESERVED','NOT_JOB_FIT_GUARANTEE','NO_EMPLOYMENT_DECISION_AUTHORITY']};
    } else return json({ok:false,error:'PROFILE_MODE_NOT_ADMITTED'},400);
    const view=await buildProgressiveProfileView({mode,profileSignals:signals,participantRef,asOfDate:body.asOfDate||assessmentDate||null,locale:lang,customerPublishable:exec.customerPublishable,preview:exec.preview});
    return json({ok:true,mode,view,reasoningView,careerExploration,profileSummary,financialSummary,governance:{automaticPersistence:false,rawResultStored:false,rawAnswersReturned:false,sourceClassPreserved:true,customerPublishable:exec.customerPublishable,preview:exec.preview}});
  }catch(error){return errorResponse(error)}
}
