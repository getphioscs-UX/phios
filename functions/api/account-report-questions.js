import {personIdentity} from '../account/canonical-person-store.js';
import {openAccountZiweiMaterial} from '../account/ziwei-account-delivery.js';
import {readReportQuestionHistory} from '../account/report-followup-store.js';
import {digest} from '../account/oidc-auth.js';
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow'};
// Read-only candidate endpoint. Production and answer generation are not admitted.
export async function onRequestGet(context){
 try{
  const ownerAccountId=personIdentity(context).userId;
  if(context.env.PHIOS_REPORT_FOLLOWUP_QA_ENABLED!=='true'||!['local','qa','preview'].includes(context.env.PHIOS_ENVIRONMENT))throw Object.assign(Error('FOLLOWUP_NOT_ADMITTED'),{status:403});
  const reportId=new URL(context.request.url).searchParams.get('reportId');
  // Reuse source owner for current person consent, entitlement and release checks.
  await openAccountZiweiMaterial(context,reportId);
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
  return Response.json({ok:true,reportId,includedRemaining:history.includedRemaining,items,governance:{persisted:true,historyRequiresMembership:false,answerGenerationAdmitted:false}},{headers});
 }catch(e){return Response.json({ok:false,code:'REPORT_QUESTION_HISTORY_UNAVAILABLE'},{status:e.status||403,headers});}
}
