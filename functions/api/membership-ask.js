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
const headers={'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff'};
export async function onRequest(context){
 try{
  // No client flag can activate this candidate or a provider adapter.
  if(context.env.PHIOS_MEMBERSHIP_ASK_CREDIT_ENABLED!=='true')return Response.json({ok:false,code:'MEMBERSHIP_ASK_NOT_ACTIVATED'},{status:503,headers});
  const owner=personIdentity(context).userId;
  if(context.request.method==='GET'){
   const taskId=new URL(context.request.url).searchParams.get('taskId');
   if(taskId){const row=await readCreditTask(context.env,{ownerAccountId:owner,taskId}),answer=row.answer_json?JSON.parse(row.answer_json):null;
    // Public re-open never emits private source-pack text or operator notes.
    const customerAnswer=answer?.answer?{locale:answer.locale,answer:answer.answer,limitations:answer.limitations||'',supportMap:answer.supportMap,sourceBinding:{packDigest:answer.sourceBinding?.packDigest,bindings:(answer.sourceBinding?.bindings||[]).map(({text,excerpt,...b})=>b)}}:answer;
    if(customerAnswer?.answer)customerAnswer.answerCompleteness=answerOutcome(answer,row.state);
    return Response.json({ok:true,task:{taskId:row.task_id,state:row.state,answerCompleteness:answerOutcome(answer,row.state),customerChargeMicroUSD:row.customer_charge_micro_usd,answer:customerAnswer}},{headers});}
   return Response.json({ok:true,balance:await readCreditBalance(context.env,owner)},{headers});
  }
  if(context.request.method!=='POST')return Response.json({ok:false,code:'METHOD_NOT_ALLOWED'},{status:405,headers});
  requireSameOrigin(context.request);await activeContinuitySubscription(context.env,owner);
  const raw=await context.request.text();if(raw.length>5000)return Response.json({ok:false,code:'INPUT_TOO_LARGE'},{status:413,headers});const body=JSON.parse(raw);
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
