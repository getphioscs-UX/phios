import {personIdentity} from '../account/canonical-person-store.js';
import {openOwnedMethodReport} from '../account/method-report-delivery.js';
import {readReportQuestionHistory} from '../account/report-followup-store.js';
import {digest} from '../account/oidc-auth.js';
import {requireSameOrigin} from '../account/oidc-auth.js';
import {generateAccountReportQuestion,accountReportQuestionGenerationAvailable} from '../account/paid-report-question-generation.js';
import {commerceEnvironment} from '../commerce/commerce-environment.js';
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow'};
// QA history and gated answer generation; no production activation.
export async function onRequestGet(context){
 try{
  const ownerAccountId=personIdentity(context).userId;
  if(context.env.PHIOS_REPORT_FOLLOWUP_QA_ENABLED!=='true'||!['local','qa','preview'].includes(context.env.PHIOS_ENVIRONMENT))throw Object.assign(Error('FOLLOWUP_NOT_ADMITTED'),{status:403});
  const reportId=new URL(context.request.url).searchParams.get('reportId');
  // Reuse source owner for current person consent, entitlement and release checks.
  const {candidate}=await openOwnedMethodReport(context,reportId);
  const history=await readReportQuestionHistory(context.env,{ownerAccountId,reportId});
  const items=[];
  for(const row of history.rows){
   const q=await context.env.PRIVATE_REPORTS.get(row.question_object_key);if(!q)throw Error('HISTORY_OBJECT_UNAVAILABLE');
   const question=JSON.parse(await q.text());if(await digest(question.question)!==row.question_digest)throw Error('HISTORY_DIGEST_MISMATCH');
   let answer=null;
   if(row.history_state==='COMPLETE'){
    const a=await context.env.PRIVATE_REPORTS.get(row.answer_object_key);if(!a)throw Error('HISTORY_OBJECT_UNAVAILABLE');
    const raw=await a.text();if(await digest(raw)!==row.answer_digest)throw Error('HISTORY_DIGEST_MISMATCH');answer=JSON.parse(raw);
   }
   items.push({requestId:row.request_id,question:question.question,answer,sourceClass:row.source_class,sourceVersion:row.source_version,historyState:row.history_state,accessBasis:row.access_basis,createdAt:row.created_at,completedAt:row.completed_at});
  }
  const answerGenerationAdmitted=await accountReportQuestionGenerationAvailable(context,candidate,history.grant).catch(()=>false);
  const now=Math.floor(Date.now()/1000);
  const membership=await context.env.RUNTIME_DB.prepare(`SELECT 1 AS active FROM commerce_subscriptions s JOIN commerce_checkout_attempts o ON o.checkout_attempt_id=s.order_id WHERE s.customer_id=?1 AND o.customer_id=?1 AND o.environment=?2 AND o.product_id='COM-SUBSCRIPTION-MONTHLY' AND o.review_required=0 AND s.subscription_status IN ('ACTIVE','CANCEL_AT_PERIOD_END') AND s.paid_until>?3 AND s.current_period_end>?3 LIMIT 1`).bind(ownerAccountId,commerceEnvironment(context.env),now).first();
  return Response.json({ok:true,reportId,includedRemaining:history.includedRemaining,items,governance:{persisted:true,historyRequiresMembership:false,answerGenerationAdmitted,canAsk:history.includedRemaining>0||membership?.active===1,membershipActive:membership?.active===1}},{headers});
 }catch(e){return Response.json({ok:false,code:'REPORT_QUESTION_HISTORY_UNAVAILABLE'},{status:e.status||403,headers});}
}
export async function onRequestPost(context){
 try{
  personIdentity(context);
  requireSameOrigin(context.request);
  const reader=context.request.body?.getReader();if(!reader)throw Object.assign(Error('BODY_REQUIRED'),{status:400});
  let bytes=0,text='';const decoder=new TextDecoder();
  for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>12000){await reader.cancel();return Response.json({ok:false,code:'REQUEST_TOO_LARGE'},{status:413,headers});}text+=decoder.decode(value,{stream:true});}
  text+=decoder.decode();
  let body;try{body=JSON.parse(text)}catch{return Response.json({ok:false,code:'INVALID_JSON'},{status:400,headers});}
  const result=await generateAccountReportQuestion(context,body);
  return Response.json({ok:true,...result},{headers});
 }catch(error){
  const code=/^[A-Z0-9_]{1,100}$/.test(error.code||'')?error.code:'REPORT_QUESTION_UNAVAILABLE';
  return Response.json({ok:false,code},{status:error.status||409,headers});
 }
}
