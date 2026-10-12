import {reserveCreditTask,claimCreditTask,finishCreditTask,readCreditTask} from './continuity-credit-d1.js';
import {validateMembershipCandidate} from './membership-authority-pack.js';
// Server-owned workflow. No production provider adapter is wired in this candidate.
// invoke returns usage measured by the existing platform meter, never a browser cost.
export async function executeMembershipAsk({env,ownerAccountId,taskId,pack,mode,depth,budget,platformEnvelopeId,invoke,offlineReplay=false}){
 if(pack.accessBasis==='EXISTING_INCLUDED_REPORT_FOLLOWUP')return {state:'USE_EXISTING_INCLUDED_REPORT_BENEFIT',endpoint:pack.existingBenefitEndpoint,providerCalls:0};
 if(!(offlineReplay===true&&env.PHIOS_ENVIRONMENT==='local'))throw Object.assign(Error('MEMBERSHIP_PROVIDER_NOT_AUTHORIZED'),{code:'MEMBERSHIP_PROVIDER_NOT_AUTHORIZED',status:409});
 if(typeof invoke!=='function'||!pack.sources?.length||!pack.packDigest)throw Error('SERVER_SOURCE_PACK_REQUIRED');
 const reservation=await reserveCreditTask(env,{ownerAccountId,taskId,requestDigest:pack.questionDigest||pack.packDigest,contextDigest:pack.packDigest,mode,depth,...budget});
 if(!reservation.newReservation){const task=await readCreditTask(env,{ownerAccountId,taskId});return {state:task.state,answer:task.answer_json?JSON.parse(task.answer_json):null,providerCalls:0,replayed:true};}
 await claimCreditTask(env,{ownerAccountId,taskId});let response=null;
 try{
  response=await invoke(pack);
  // Offline injection may not claim a real model response or real provider receipt.
  if(response.receipt?.model!=='OFFLINE_STUB')throw Error('OFFLINE_RECEIPT_REQUIRED');
  const validation=await validateMembershipCandidate(response.answer,pack);
  if(!validation.ok||response.deliveryValidated!==true)throw Error('ANSWER_DELIVERY_VALIDATION_FAILED');
  // Existing task history owns cumulative exposure; no separate manuscript-copy store.
  // One RUNNING task per owner serializes this check with successful delivery.
  const refs=response.answer.claims.flatMap(c=>c.support||[]);
  for(const source of pack.sources.filter(s=>s.sourceClass!=='OWNED_REPORT_INTERPRETATION')){
   const current=refs.filter(r=>r.sourceSha256===source.sourceSha256).reduce((n,r)=>n+r.quote.length,0);
   const prior=await env.RUNTIME_DB.prepare(`SELECT COALESCE(SUM(length(json_extract(ref.value,'$.quote'))),0) AS exposed FROM continuity_ask_tasks t,json_each(t.answer_json,'$.claims') claim,json_each(claim.value,'$.support') ref WHERE t.owner_account_id=?1 AND t.state='COMPLETE' AND json_extract(ref.value,'$.sourceSha256')=?2`).bind(ownerAccountId,source.sourceSha256).first();
   if(prior.exposed+current>2000)throw Error('PRIVATE_SOURCE_CUMULATIVE_QUOTE_LIMIT');
  }
  await finishCreditTask(env,{ownerAccountId,taskId,delivered:true,actualMicroUSD:response.actualMicroUSD,answer:response.answer,platformEntry:{envelopeId:platformEnvelopeId,payload:response.receipt}});
  return {state:'COMPLETE',answer:response.answer,providerCalls:0,offlineStubCalls:1,semanticQuality:'NOT_A_REAL_MODEL_EVALUATION'};
 }catch(error){await finishCreditTask(env,{ownerAccountId,taskId,delivered:false,actualMicroUSD:response?.actualMicroUSD??null,platformEntry:{envelopeId:platformEnvelopeId,payload:response?.receipt||{model:'OFFLINE_STUB',usage:'UNKNOWN'}}});throw error;}
}
