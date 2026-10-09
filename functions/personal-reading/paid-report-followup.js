import {reserveReportQuestion,completeReportQuestion,failReportQuestion,readReportQuestionHistory} from '../account/report-followup-store.js';
import {createServerPaidReportContext} from './paid-report-context.js';
import {digest} from '../account/oidc-auth.js';
// Reuse the existing immutable four-answer history and the report's cost pool.
// Membership questions beyond four require their separate membership authority;
// this adapter is intentionally only for the purchased report's four answers.
export async function generatePaidReportFollowup({env,binding,request,question,consentVersion,model,invoke,validateAnswer}){
 if(request.phase!=='FOLLOWUP'||typeof invoke!=='function'||typeof validateAnswer!=='function')throw Error('PAID_FOLLOWUP_BINDING_REQUIRED');
 const history=await readReportQuestionHistory(env,{ownerAccountId:binding.ownerAccountId,reportId:binding.reportId});
 if(history.grant.purchase_id!==binding.purchaseId||history.grant.product_id!==binding.productId)throw Error('PAID_FOLLOWUP_REPORT_MISMATCH');
 let answer;
 const context=await createServerPaidReportContext({env,binding,request,model,validateProviderOutput:async body=>{answer=await validateAnswer(body,{question,grant:history.grant});if(!answer||typeof answer!=='object')throw Error('FOLLOWUP_ANSWER_INVALID');}});
 const prior=history.rows.find(r=>r.request_id===request.requestId);
 if(!prior&&history.includedRemaining<=0)throw Error('REPORT_FOUR_FOLLOWUPS_EXHAUSTED');
 const reservation=await reserveReportQuestion(env,{ownerAccountId:binding.ownerAccountId,reportId:binding.reportId,requestId:request.requestId,question,consentVersion});
 if(reservation.row.access_basis!=='INCLUDED_REPORT_QUESTION')throw Error('PAID_FOLLOWUP_MEMBERSHIP_AUTHORITY_REQUIRED');
 if(reservation.row.history_state==='COMPLETE'){
  const object=await env.PRIVATE_REPORTS.get(reservation.row.answer_object_key);
  if(!object)throw Error('PAID_FOLLOWUP_SAVED_ANSWER_MISSING');
  const raw=await object.text();
  if(await digest(raw)!==reservation.row.answer_digest)throw Error('PAID_FOLLOWUP_SAVED_ANSWER_INTEGRITY');
  return {answer:JSON.parse(raw),cacheHit:true,providerCalls:0};
 }
 if(!reservation.newReservation)throw Error('PAID_FOLLOWUP_RECONCILIATION_REQUIRED');
 try{
  const response=await context.transport.invokeBudgeted(invoke);
  // On a reconciled replay the transport uses its cached provider result.
  if(!answer)answer=await validateAnswer(await response.json(),{question,grant:history.grant});
  await completeReportQuestion(env,{ownerAccountId:binding.ownerAccountId,requestId:request.requestId,answer});
  return {answer,cacheHit:false,providerCalls:1};
 }catch(error){await failReportQuestion(env,{ownerAccountId:binding.ownerAccountId,requestId:request.requestId});throw error;}
}
