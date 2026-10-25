import {createShortFragmentRequest,validateShortFragmentAnswer} from './membership-short-fragment-contract.js';
import {reserveCreditTask,claimCreditTask,finishCreditTask,readCreditTask} from './continuity-credit-d1.js';
import {personIdentity} from '../../account/canonical-person-store.js';
import {activeContinuitySubscription} from './continuity-quota-d1.js';
// Only an in-process operator may create this capability. No API accepts it.
// The experiment dispatcher must check its frozen owner grant before creation.
const grants=new WeakMap();
export async function prepareShortDeliveryRequest(pack,{depth='ORDINARY',confirmed=false}={}){
 if(depth==='DEEP'&&!confirmed||!['ORDINARY','DEEP'].includes(depth))throw Error('EXPLICIT_TASK_SCOPE_REQUIRED');
 const candidate=await createShortFragmentRequest(pack),body={model:depth==='ORDINARY'?'gpt-5.6-luna':'gpt-5.6-terra',store:false,max_output_tokens:1400,input:[{role:'system',content:'Use only supplied source evidence and exact pack-local IDs. Answer the actual question naturally. Preserve conditions, uncertainty and negation. Reviewed scope annotations restrict assertions; background is not a definition or causal proof. If a relation is not established, give the supported part and state the specific gap. Do not add editorial acceptance/workflow messages or language labels: the server displays source language. Comparison sides require their own definitions/conditions and an established comparison relationship; keyword recall is not support. Gaps apply only to THIS admitted source pack. Keep answer and limitations to at most 8 complete sentence units in total; do not drop needed qualifiers to fit, state a supported partial answer instead. Return the declared JSON schema with an internal statement-to-source map. Do not generate quotations, hashes or purchase recommendations.'},{role:'user',content:JSON.stringify(candidate.modelPayload)}]};
 return {body,serverBinding:candidate.serverBinding,maximumMicroUSD:shortDeliveryMaximum(body),automaticRetry:0,paidAuthorization:false};
}
export async function runMembershipDeliveryQA(context,input,{prepare,capability,...options}){
 const owner=personIdentity(context).userId;await activeContinuitySubscription(context.env,owner);
 if(!grants.has(capability)||context.env.PHIOS_ISOLATED_OPERATOR!==true||typeof prepare!=='function')throw Error('QA_DELIVERY_NOT_AUTHORIZED');
 // Actual gated retrieval is performed after membership authorization. The
 // operator-supplied preparer uses the existing API and nonserialized token.
 const prepared=await prepare(context,input);if(!prepared.pack?.sources?.length)return {state:'SOURCE_INSUFFICIENT',providerCalls:0};
 const request=await prepareShortDeliveryRequest(prepared.pack,{depth:options.depth,confirmed:options.confirmed});
 return executeShortMembershipDeliveryQA(context,{...options,pack:prepared.pack,body:request.body,capability});
}
export function createMembershipDeliveryQACapability(env,grant){
 if(env.PHIOS_ENVIRONMENT!=='local'||env.PHIOS_ISOLATED_OPERATOR!==true||grant.status!=='OWNER_AUTHORIZED'||!grant.requestManifestSha256||grant.automaticRetry!==0||!Number.isSafeInteger(grant.totalMicroUSD)||grant.totalMicroUSD<=0)throw Error('QA_DELIVERY_GRANT_REQUIRED');
 const token=Object.freeze({});grants.set(token,structuredClone(grant));return token;
}
export function shortDeliveryMaximum(body){
 const rates={'gpt-5.6-luna':[250,1200],'gpt-5.6-terra':[2500,12000]},p=rates[body.model];
 if(!p||!Number.isSafeInteger(body.max_output_tokens)||body.max_output_tokens<1||body.max_output_tokens>1400||body.tools?.length)throw Error('QA_REQUEST_NOT_ADMITTED');
 return Math.ceil(((new TextEncoder().encode(JSON.stringify(body)).length+512)*p[0]+body.max_output_tokens*p[1])/1000);
}
export function meterShortDeliveryUsage(model,usage){
 const rates={'gpt-5.6-luna':[200,20,50,1200],'gpt-5.6-terra':[2000,200,500,12000]},p=rates[model],input=usage?.input_tokens,cached=usage?.input_tokens_details?.cached_tokens,writes=usage?.input_tokens_details?.cache_write_tokens??usage?.input_tokens_details?.cache_creation_tokens,output=usage?.output_tokens;
 if(!p||![input,cached,writes,output].every(n=>Number.isSafeInteger(n)&&n>=0)||cached>input||writes>input-cached)throw Error('QA_ACTUAL_COST_UNKNOWN');
 const nano=(input-cached)*p[0]+cached*p[1]+writes*p[2]+output*p[3];
 return {model,inputTokens:input,cachedInputTokens:cached,cacheWriteTokens:writes,outputTokens:output,modelCostNanoUSD:nano,modelCostMicroUSD:Math.ceil(nano/1000),toolSearchCostMicroUSD:0};
}
export async function executeShortMembershipDeliveryQA(context,{taskId,pack,body,platformEnvelopeId,capability,invoke,assess,depth='ORDINARY',confirmed=false}){
 const ownerAccountId=personIdentity(context).userId;
 if(pack.accessBasis==='EXISTING_INCLUDED_REPORT_FOLLOWUP')return {state:'USE_EXISTING_INCLUDED_REPORT_BENEFIT',endpoint:pack.existingBenefitEndpoint,providerCalls:0};
 const grant=grants.get(capability);if(!grant||context.env.PHIOS_ENVIRONMENT!=='local'||context.env.PHIOS_ISOLATED_OPERATOR!==true)throw Error('QA_DELIVERY_NOT_AUTHORIZED');
 await activeContinuitySubscription(context.env,ownerAccountId);
 if(!pack.sources?.length||typeof invoke!=='function'||typeof assess!=='function')throw Error('QA_SOURCE_AND_ASSESSMENT_REQUIRED');
 if(depth==='ORDINARY'&&body.model!=='gpt-5.6-luna'||depth==='DEEP'&&(!confirmed||body.model!=='gpt-5.6-terra')||!['ORDINARY','DEEP'].includes(depth))throw Error('NO_SILENT_MODEL_ESCALATION');
 const candidate=await createShortFragmentRequest(pack),payload=JSON.parse(body.input[1].content);
 if(JSON.stringify(payload)!==JSON.stringify(candidate.modelPayload))throw Error('QA_REQUEST_SOURCE_PACK_CHANGED');
 const maximumMicroUSD=shortDeliveryMaximum(body);if(maximumMicroUSD>grant.totalMicroUSD)throw Error('QA_GRANT_BUDGET_INSUFFICIENT');
 const reservation=await reserveCreditTask(context.env,{ownerAccountId,taskId,requestDigest:await import('../../account/oidc-auth.js').then(m=>m.digest(JSON.stringify(body))),contextDigest:pack.packDigest,mode:'KNOWLEDGE',depth,confirmed,maximumMicroUSD,modelMicroUSD:maximumMicroUSD});
 if(!reservation.newReservation){const row=await readCreditTask(context.env,{ownerAccountId,taskId});return {state:row.state,answer:row.answer_json?JSON.parse(row.answer_json):null,replayed:true,providerCalls:0};}
 try{await claimCreditTask(context.env,{ownerAccountId,taskId});}catch(error){
  // No transport was invoked. Cancel only this owner's still-RESERVED task;
  // do not fabricate a provider receipt or disturb another RUNNING task.
  await context.env.RUNTIME_DB.batch([
   context.env.RUNTIME_DB.prepare("UPDATE continuity_ask_allocations SET charged_micro_usd=0 WHERE task_id=?1 AND EXISTS(SELECT 1 FROM continuity_ask_tasks WHERE task_id=?1 AND owner_account_id=?2 AND state='RESERVED')").bind(taskId,ownerAccountId),
   context.env.RUNTIME_DB.prepare("UPDATE continuity_ask_tasks SET state='FAILED',customer_charge_micro_usd=0,completed_at=?3 WHERE task_id=?1 AND owner_account_id=?2 AND state='RESERVED'").bind(taskId,ownerAccountId,new Date().toISOString())
  ]);throw error;
 }
 let meter=null;
 try{
  // Transport must enforce the platform-funded experiment grant too. This is
  // not the paid transport and performs no network I/O on its own.
  const response=await invoke(body,{taskId,grant,maximumMicroUSD});meter=meterShortDeliveryUsage(body.model,response.usage);
  if(meter.modelCostMicroUSD>maximumMicroUSD||response.status!=='completed')throw Error('QA_INCOMPLETE_OR_OVER_BUDGET');
  const answer=JSON.parse(response.text),identity=await validateShortFragmentAnswer(answer,candidate.serverBinding,{...candidate.serverBinding,locale:pack.locale}),semantic=await assess({answer,pack,binding:candidate.serverBinding});
  if(semantic.deliverable!==true)throw Error('QA_SEMANTIC_DELIVERY_REJECTED');
  // Natural text persists with immutable server binding. Full private excerpts
  // remain internal and are never copied into the customer response.
  const saved={locale:identity.locale,answer:identity.answer,limitations:identity.limitations,supportMap:answer.supportMap,sourceBinding:candidate.serverBinding,semanticAssessment:semantic};
  await finishCreditTask(context.env,{ownerAccountId,taskId,delivered:true,actualMicroUSD:meter.modelCostMicroUSD,answer:saved,platformEntry:{envelopeId:platformEnvelopeId,payload:{...meter,scope:'ISOLATED_SYNTHETIC_MEMBER_QA'}}});
  return {state:'COMPLETE',answer:saved,providerCalls:1,qaOnly:true};
 }catch(error){await finishCreditTask(context.env,{ownerAccountId,taskId,delivered:false,actualMicroUSD:meter?.modelCostMicroUSD??null,platformEntry:{envelopeId:platformEnvelopeId,payload:meter||{model:body.model,usage:'UNKNOWN'}}});throw error;}
}

// Audit-only provider reference, never a credential or a source authority.
export function providerRequestReference(value){return typeof value==='string'&&/^(resp|req)_[A-Za-z0-9_-]{1,190}$/.test(value)?value:null;}
