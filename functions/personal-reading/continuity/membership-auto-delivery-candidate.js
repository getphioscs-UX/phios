import {isProductionKnowledgeCapability} from './membership-production-gate.js';
import {prepareShortDeliveryRequest,meterShortDeliveryUsage,shortDeliveryMaximum,providerRequestReference} from './membership-short-delivery-qa.js';
import {validateShortFragmentAnswer} from './membership-short-fragment-contract.js';
import {inspectShortAnswerRisks} from './membership-source-coverage.js';
import {reserveCreditTask,claimCreditTask,finishCreditTask,readCreditTask} from './continuity-credit-d1.js';
import {activeContinuitySubscription} from './continuity-quota-d1.js';
import {personIdentity} from '../../account/canonical-person-store.js';
import {digest} from '../../account/oidc-auth.js';
import {createZeroCallOutcomeCapability,saveZeroCallOutcome} from './membership-zero-call-outcome.js';
const capabilities=new WeakSet();
const offlineTransports=new WeakMap();
// QA service seam only. No environment string, request flag or client-owned
// payload registers a transport. Production registration remains impossible.
export function registerOfflineAutomaticDelivery(env,{invoke,platformEnvelopeId}){
 const capability=createAutomaticDeliveryCandidateCapability(env);
 if(typeof invoke!=='function'||!platformEnvelopeId)throw Error('OFFLINE_TRANSPORT_BINDING_REQUIRED');
 offlineTransports.set(env,{invoke,platformEnvelopeId,capability});
}
export function offlineAutomaticDeliveryAvailable(env){return env.PHIOS_ENVIRONMENT==='local'&&env.PHIOS_ISOLATED_OPERATOR===true&&offlineTransports.has(env);}
export async function executeOfflineAutomaticDelivery(context,input,prepare){
 if(!offlineAutomaticDeliveryAvailable(context.env))throw Error('MODEL_EXECUTION_NOT_AUTHORIZED');
 const transport=offlineTransports.get(context.env),platformEnvelopeId=typeof transport.platformEnvelopeId==='function'?await transport.platformEnvelopeId(personIdentity(context).userId):transport.platformEnvelopeId;
 const result=await runAutomaticDeliveryCandidate(context,input,{...transport,platformEnvelopeId,prepare,evidenceKind:'OFFLINE_ENGINEERING_REPLAY'});
 return {...result,taskId:input.taskId,offlineAdapterInvocations:result.providerCalls,providerCalls:0,validation:'OFFLINE_SERVICE_FIXTURE_NOT_NEW_MODEL_EVIDENCE'};
}
// This candidate has no production route or network adapter. Only an isolated
// server operator can bind the offline transport. Client flags never enable it.
export function createAutomaticDeliveryCandidateCapability(env){
 if(env.PHIOS_ENVIRONMENT!=='local'||env.PHIOS_ISOLATED_OPERATOR!==true)throw Error('ISOLATED_CANDIDATE_ONLY');const c=Object.freeze({});capabilities.add(c);return c;
}
import {createReviewDocument,decideUnitReview,COMPACT_REVIEW_CONTRACT,REVIEW_TASK_LIMITS,reviewCapacity} from './membership-review-contract-v2.js';
export async function prepareAutomaticReview(answer,pack,binding){
 const document=await createReviewDocument(answer,binding),capacity=reviewCapacity(document);
 return {model:'gpt-5.6-luna',store:false,reasoning:{effort:'none'},max_output_tokens:capacity.maxOutputTokens,input:[{role:'system',content:'Evaluate ONLY THIS admitted source pack. Read the complete answer AND limitations and check EVERY server body unit independently. Check unlisted support-map prose, negation, qualifiers, attribution, both comparison sides and unsupported inference. Return ONLY JSON {contract:COMPACT_BODY_REVIEW_V3,scopeId:provided ID,verdict:DELIVER|REJECT,answerCompleteness:COMPLETE|PARTIAL|SOURCE_INSUFFICIENT|FAILED,substantiveAnsweredUnitIds:[U1],checks:[{unitId:U1,sourceIds:[S1],assessment:SUPPORTED|UNSUPPORTED|UNCERTAIN}],issues:[{unitId:U1,kind:short_error_code,reason:brief_reason_max_120_chars}],missingScope:brief_string}. Every U ID exactly once, including limitations. Do not repeat unit text or reasons for supported checks. IDs are pack-local. DELIVER requires every unit SUPPORTED and issues empty. Any unsupported attribution, inference or weakened qualification requires REJECT. PARTIAL permits only a substantively supported answer disclosing its missing scope, NEVER an erroneous sentence. SOURCE_INSUFFICIENT means no substantive supported answer; do not use it for format/truncation/contract failures. Missing scope refers ONLY to THIS admitted source pack, not whole books. Do not repair or rewrite the answer.'},{role:'user',content:JSON.stringify({question:pack.question,locale:pack.locale,answer,document,capacity,sources:binding.bindings.map(f=>({id:f.shortId,text:f.text})),reviewedScope:inspectShortAnswerRisks(answer,binding).coverage})}]};
}
export function reviewDecision(answer,binding,review,document){if(review?.contract!==COMPACT_REVIEW_CONTRACT)throw Error('REVIEW_CONTRACT_VERSION_INVALID');return decideUnitReview(answer,binding,document,review);}
export async function runAutomaticDeliveryCandidate(context,input,{capability,prepare,invoke,platformEnvelopeId,reviewModel='gpt-5.6-luna',evidenceKind='ISOLATED_PROVIDER_EXECUTION'}){
 if(!isProductionKnowledgeCapability(context.env,capability)&&(!capabilities.has(capability)||context.env.PHIOS_ENVIRONMENT!=='local'||context.env.PHIOS_ISOLATED_OPERATOR!==true))throw Error('CANDIDATE_NOT_AUTHORIZED');
 const owner=personIdentity(context).userId;await activeContinuitySubscription(context.env,owner);
 if(reviewModel!=='gpt-5.6-luna')throw Error('REVIEW_MODEL_NOT_ADMITTED');
 const {pack,errors=[]}=await prepare(context,input);if(!pack.sources?.length)return saveZeroCallOutcome(context,{taskId:input.taskId,pack,retrievalErrors:errors},{capability:isProductionKnowledgeCapability(context.env,capability)?capability:createZeroCallOutcomeCapability(context.env)});
 const r=await prepareShortDeliveryRequest(pack,{depth:'ORDINARY'});
 // Worst-case review input includes the maximum generated answer bytes. The
 // reserve covers both calls and cache writes; no hidden repair or retry.
 const reviewTemplate=await prepareAutomaticReview({locale:pack.locale,answer:'Capacity placeholder.',supportMap:[]},pack,r.serverBinding);
 // Reserve the complete serialized answer plus its unit projection before the
 // first call. Admission limits are enforced again before the second call.
 const baseBytes=new TextEncoder().encode(JSON.stringify(reviewTemplate)).length;
 const reviewInputByteLimit=baseBytes+3*REVIEW_TASK_LIMITS.maxAnswerBytes+4096;
 const reviewMaximum=Math.ceil(((reviewInputByteLimit+512)*250+REVIEW_TASK_LIMITS.maxOutputTokens*1200)/1000),maximum=r.maximumMicroUSD+reviewMaximum;if(maximum>50000)throw Error('ORDINARY_TOTAL_BUDGET_INSUFFICIENT');
 const requestDigest=await digest(JSON.stringify({input,packDigest:pack.packDigest,body:r.body,reviewPolicy:reviewTemplate.input[0].content})),taskId=input.taskId;
 const reservation=await reserveCreditTask(context.env,{ownerAccountId:owner,taskId,requestDigest,contextDigest:pack.packDigest,mode:'KNOWLEDGE',depth:'ORDINARY',maximumMicroUSD:maximum,modelMicroUSD:maximum});
 if(!reservation.newReservation){const row=await readCreditTask(context.env,{ownerAccountId:owner,taskId}),answer=row.answer_json?JSON.parse(row.answer_json):null;return {executionState:row.state,deliverable:answer?.deliverable??!!answer?.answer,answerCompleteness:answer?.answerCompleteness||(row.state==='COMPLETE'||row.state==='FAILED'?'FAILED':null),answer,replayed:true,providerCalls:0};}
 try{await claimCreditTask(context.env,{ownerAccountId:owner,taskId});}catch(error){await context.env.RUNTIME_DB.batch([
 context.env.RUNTIME_DB.prepare("UPDATE continuity_ask_allocations SET charged_micro_usd=0 WHERE task_id=?1 AND EXISTS(SELECT 1 FROM continuity_ask_tasks WHERE task_id=?1 AND owner_account_id=?2 AND state='RESERVED')").bind(taskId,owner),
 context.env.RUNTIME_DB.prepare("UPDATE continuity_ask_tasks SET state='FAILED',customer_charge_micro_usd=0 WHERE task_id=?1 AND owner_account_id=?2 AND state='RESERVED'").bind(taskId,owner)
 ]);throw error;}let nano=0,known=true,calls=0;const receipts=[];
 const call=async(body,bound)=>{calls++;known=false;const response=await invoke(body,{maximumMicroUSD:bound,taskId,callIndex:calls});const meter=meterShortDeliveryUsage(body.model,response.usage);nano+=meter.modelCostNanoUSD;known=true;receipts.push({...meter,providerRequestId:providerRequestReference(response.providerRequestId),operationType:calls===1?'ANSWER':'REVIEW'});if(meter.modelCostMicroUSD>bound||response.status!=='completed')throw Error('INCOMPLETE_OR_OVER_BUDGET_NO_RETRY');return JSON.parse(response.text);};
 try{const answer=await call(r.body,r.maximumMicroUSD);await validateShortFragmentAnswer(answer,r.serverBinding,{...r.serverBinding,locale:pack.locale});
 if(new TextEncoder().encode(JSON.stringify(answer)).length>REVIEW_TASK_LIMITS.maxAnswerBytes)throw Error('ANSWER_EXCEEDS_REVIEW_ADMISSION');
 const reviewBody=await prepareAutomaticReview(answer,pack,r.serverBinding);if(new TextEncoder().encode(JSON.stringify(reviewBody)).length>reviewInputByteLimit||shortDeliveryMaximum(reviewBody)>reviewMaximum)throw Error('REVIEW_INPUT_EXCEEDS_RESERVE');
 const review=await call(reviewBody,reviewMaximum),assessment=reviewDecision(answer,r.serverBinding,review,JSON.parse(reviewBody.input[1].content).document);
 if(!assessment.deliverable){const outcome={executionState:'COMPLETE',deliverable:false,answerCompleteness:assessment.answerCompleteness,reasonCode:'AUTOMATIC_REVIEW_REJECTED'};await finishCreditTask(context.env,{ownerAccountId:owner,taskId,delivered:false,completionOutcome:outcome,actualMicroUSD:Math.ceil(nano/1000),platformEntry:{envelopeId:platformEnvelopeId,payload:{evidenceKind,receipts,totalCostNanoUSD:nano,providerCalls:evidenceKind==='OFFLINE_ENGINEERING_REPLAY'?0:calls,adapterInvocations:calls,outcome}}});return {...outcome,providerCalls:calls,customerChargeMicroUSD:0};}
 const saved={...answer,executionState:'COMPLETE',deliverable:true,answerCompleteness:assessment.answerCompleteness,sourceBinding:r.serverBinding,automaticReview:assessment};
 await finishCreditTask(context.env,{ownerAccountId:owner,taskId,delivered:true,actualMicroUSD:Math.ceil(nano/1000),answer:saved,platformEntry:{envelopeId:platformEnvelopeId,payload:{scope:'OFFLINE_AUTOMATIC_DELIVERY_CANDIDATE',evidenceKind,receipts,totalCostNanoUSD:nano,providerCalls:evidenceKind==='OFFLINE_ENGINEERING_REPLAY'?0:calls,adapterInvocations:calls,semanticGuarantee:false}}});
 return {executionState:'COMPLETE',deliverable:true,answerCompleteness:saved.answerCompleteness,answer:saved,providerCalls:calls};
 }catch(error){await finishCreditTask(context.env,{ownerAccountId:owner,taskId,delivered:false,actualMicroUSD:known?Math.ceil(nano/1000):null,platformEntry:{envelopeId:platformEnvelopeId,payload:{evidenceKind,receipts,knownActualCostNanoUSD:nano,unmeteredCall:!known,providerCalls:evidenceKind==='OFFLINE_ENGINEERING_REPLAY'?0:calls,adapterInvocations:calls}}});return {executionState:known?'FAILED':'RECONCILIATION',answerCompleteness:'FAILED',providerCalls:calls,error:error.message,failureClass:'TECHNICAL_OR_CONTRACT_FAILURE',customerChargeMicroUSD:0};}
}
