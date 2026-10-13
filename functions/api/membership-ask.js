import {executeProductionKnowledge,productionKnowledgeReady} from '../personal-reading/continuity/membership-production-dispatcher.js';
import {personIdentity} from '../account/canonical-person-store.js';
import {requireSameOrigin} from '../account/oidc-auth.js';
import {activeContinuitySubscription} from '../personal-reading/continuity/continuity-quota-d1.js';
import {readCreditBalance,readCreditTask} from '../personal-reading/continuity/continuity-credit-d1.js';
import {buildMembershipAuthorityPack} from '../personal-reading/continuity/membership-authority-pack.js';
import {prepareKnowledgeMembershipAsk} from '../personal-reading/continuity/membership-knowledge-service.js';
import {buildNavigationMembershipPack} from '../personal-reading/continuity/membership-navigation-pack.js';
import {buildOwnedMaterialMembershipPack} from '../personal-reading/continuity/membership-owned-material-adapter.js';
import {approvedCrossLocaleSearch} from '../knowledge-runtime/approved-terminology-context.js';
import {answerOutcome} from '../personal-reading/continuity/membership-answer-outcome.js';
import {offlineAutomaticDeliveryAvailable,executeOfflineAutomaticDelivery} from '../personal-reading/continuity/membership-auto-delivery-candidate.js';
import {requireMembershipStorage} from '../personal-reading/continuity/membership-storage-contract.js';
const headers={'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff'};
function customerProjection(answer,state){
 if(!answer?.answer)return answer;
 return {locale:answer.locale,answer:answer.answer,limitations:answer.limitations||'',supportMap:answer.supportMap,answerCompleteness:answerOutcome(answer,state),sourceBinding:{packDigest:answer.sourceBinding?.packDigest,bindings:(answer.sourceBinding?.bindings||[]).map(({text,excerpt,...b})=>b)}};
}
export async function onRequest(context){
 try{
  // No client flag can activate this candidate or a provider adapter.
  if(context.env.PHIOS_MEMBERSHIP_ASK_CREDIT_ENABLED!=='true')return Response.json({ok:false,code:'MEMBERSHIP_ASK_NOT_ACTIVATED'},{status:503,headers});
  const owner=personIdentity(context).userId;await requireMembershipStorage(context.env);
  if(context.request.method==='GET'){
   const taskId=new URL(context.request.url).searchParams.get('taskId');
   if(taskId){const row=await readCreditTask(context.env,{ownerAccountId:owner,taskId}),answer=row.answer_json?JSON.parse(row.answer_json):null;
    // Public re-open never emits private source-pack text or operator notes.
    const customerAnswer=customerProjection(answer,row.state);
    const sourceId=new URL(context.request.url).searchParams.get('sourceId');
    if(sourceId){const source=customerAnswer?.sourceBinding?.bindings.find(b=>b.shortId===sourceId);if(!source)return Response.json({ok:false,code:'SAVED_SOURCE_NOT_FOUND',providerCalls:0},{status:404,headers});return Response.json({ok:true,source,sourceState:'SAVED_PERMISSION_BOUND_REFERENCE_NOT_FULL_TEXT',providerCalls:0},{headers});}
    return Response.json({ok:true,task:{taskId:row.task_id,state:row.state,answerCompleteness:answerOutcome(answer,row.state),customerChargeMicroUSD:row.customer_charge_micro_usd,answer:customerAnswer}},{headers});}
   return Response.json({ok:true,balance:await readCreditBalance(context.env,owner),executionAvailable:offlineAutomaticDeliveryAvailable(context.env)||productionKnowledgeReady(context.env),executionScope:offlineAutomaticDeliveryAvailable(context.env)?'OFFLINE_REPLAY_ONLY':productionKnowledgeReady(context.env)?'KNOWLEDGE_ONLY':'CLOSED'},{headers});
  }
  if(context.request.method!=='POST')return Response.json({ok:false,code:'METHOD_NOT_ALLOWED'},{status:405,headers});
  requireSameOrigin(context.request);await activeContinuitySubscription(context.env,owner);
  const raw=await context.request.text();if(raw.length>5000)return Response.json({ok:false,code:'INPUT_TOO_LARGE'},{status:413,headers});const body=JSON.parse(raw);
  if(body.action==='EXECUTE'){
   if(body.mode!=='KNOWLEDGE'||body.depth&&body.depth!=='ORDINARY'||typeof body.question!=='string'||!body.question.trim()||body.question.length>2000||!['zh-Hans','en'].includes(body.locale||'zh-Hans')||typeof body.taskId!=='string'||!/^[-A-Za-z0-9_]{8,160}$/.test(body.taskId))return Response.json({ok:false,code:'ASK_TASK_INPUT_INVALID',providerCalls:0},{status:400,headers});
   if(!offlineAutomaticDeliveryAvailable(context.env)){if(body.confirmed!==true)return Response.json({ok:false,code:'TASK_BUDGET_CONFIRMATION_REQUIRED',providerCalls:0},{status:400,headers});const result=await executeProductionKnowledge(context,{taskId:body.taskId,question:body.question,locale:body.locale||'zh-Hans',bookCode:body.bookCode||''});return Response.json({ok:true,...result,answer:customerProjection(result.answer,result.executionState)},{headers});}
   if(body.mode!=='KNOWLEDGE'||body.depth&&body.depth!=='ORDINARY'||typeof body.taskId!=='string'||!/^[-A-Za-z0-9_]{8,160}$/.test(body.taskId))return Response.json({ok:false,code:'OFFLINE_TASK_SCOPE_INVALID',providerCalls:0},{status:400,headers});
   const result=await executeOfflineAutomaticDelivery(context,{taskId:body.taskId,question:body.question,locale:body.locale||'zh-Hans',bookCode:body.bookCode||''},async(ctx,input)=>prepareKnowledgeMembershipAsk(ctx,input));
   return Response.json({ok:true,...result,answer:customerProjection(result.answer,result.executionState)},{headers});
  }
  if(body.action!=='PREVIEW')return Response.json({ok:false,code:'MODEL_EXECUTION_NOT_AUTHORIZED',providerCalls:0},{status:409,headers});
  if(body.mode==='OWNED_MATERIAL'){
   const pack=await buildOwnedMaterialMembershipPack(context,{family:body.family,objectId:body.objectId,question:body.question,locale:body.locale||'zh-Hans',processingConsent:body.processingConsent,expectedSourceVersion:body.expectedSourceVersion});
   return Response.json({ok:true,pack:{...pack,sources:pack.sources.map(({text,...source})=>source)},providerCalls:0,creditsReserved:0,modelAnswerQuality:'NOT_RUN'},{headers});
  }
  if(body.mode==='NAVIGATION'){
   const pack=await buildNavigationMembershipPack(context,{navigationRecordId:body.navigationRecordId,question:body.question,locale:body.locale||'zh-Hans'});
   return Response.json({ok:true,pack:{...pack,sources:pack.sources.map(({text,...s})=>s)},providerCalls:0,creditsReserved:0,modelAnswerQuality:'NOT_RUN'},{headers});
  }
  if(body.mode!=='KNOWLEDGE')return Response.json({ok:false,code:'ASK_MODE_NOT_ADMITTED',providerCalls:0},{status:400,headers});
  // Invoke existing source permission/version gates. Never forward client QA flags.
  const outputLocale=body.locale||'zh-Hans',search=outputLocale==='en'?approvedCrossLocaleSearch(body.question||'','en','zh-Hans'):{retrievalQuery:body.question||'',aliases:[]};
  // Membership language policy permits Chinese evidence for an English candidate.
  // The public deterministic API's existing English boundary is unchanged.
  const url=new URL('/api/knowledge-access',context.request.url);url.search=new URLSearchParams({q:search.retrievalQuery,locale:'zh-Hans',bookCode:body.bookCode||'',source:'manuscript'}).toString();
  const prepared=await prepareKnowledgeMembershipAsk(context,{question:body.question,locale:outputLocale,bookCode:body.bookCode||''});
  const pack=prepared.pack;pack.retrievalLanguagePolicy={sourceLocale:'zh-Hans',answerLocale:outputLocale,approvedSearchAliases:search.aliases,englishManuscriptAccepted:false};
  // Customer preview exposes identities and budgets, not the private request context.
  const publicPack={...pack,sources:pack.sources.map(({text,...source})=>({...source,sourceTextIncludedInServerRequest:true}))};
  return Response.json({ok:true,pack:publicPack,providerCalls:0,creditsReserved:0,modelAnswerQuality:'NOT_RUN'},{headers});
 }catch(error){return Response.json({ok:false,code:error.code||'MEMBERSHIP_ASK_UNAVAILABLE',providerCalls:0},{status:error.status||400,headers});}
}
