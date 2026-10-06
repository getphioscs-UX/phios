import {BATCHES,LOCALES,POLICY,VERSIONS,FIELD,unitKey,digest} from './bazi-deep-manuscript-contract.js';
import {projectBaziBatchAuthority,buildPriorSectionSummary} from './bazi-deep-manuscript-batch-authority.js';
import {buildBaziManuscriptSchema} from './bazi-deep-manuscript-schema.js';
import {BAZI_DEEP_MANUSCRIPT_PROMPT} from './bazi-deep-manuscript-prompt.js';
import {planBaziDeepManuscriptOutputBudget,baziTokenCost,estimateBaziTokens} from './bazi-deep-manuscript-budget.js';
import {createBaziCheckpoint,assertCheckpointLineage,guardBaziPaidUnitRequest,unresolvedBaziUnits,commitBaziCompleteUnits,freezeBaziManuscript} from './bazi-deep-manuscript-checkpoint.js';
import {planBaziTechnicalRecovery,retryableBaziTransport,costTelemetry} from './bazi-deep-manuscript-recovery.js';
import {invokeBaziDeepManuscript} from './bazi-deep-manuscript-provider.js';
import {inspectBaziManuscriptResponse} from './bazi-deep-manuscript-completeness.js';
import {baziManuscriptCacheKey} from './bazi-deep-manuscript-cache.js';
export function assertBaziGenerationAdmission({mode,env,approval,order,pack,model,fixture=false}){
 if(!['EXPERIMENT','PRODUCTION'].includes(mode))throw Error('BDM_MODE_REQUIRED');
 if(fixture)return;
 if(env.REPORT_PROVIDER_LIVE_ALLOWED!=='true'||env.REPORT_ZERO_COST_REPLAY==='true')throw Error('REPORT_PROVIDER_LIVE_OPT_IN_REQUIRED');
 if(!model.pricingVerified||!model.constraintsVerified)throw Error('BDM_VERIFIED_PRICING_AND_CONSTRAINTS_REQUIRED');
 if(mode==='EXPERIMENT'&&(approval?.statement!=='APPROVE BAZI DEEP MANUSCRIPT R2 CONTROLLED 3-CALL EXPERIMENT'||approval.authorityDigest!==pack.digest))throw Error('BDM_CONTROLLED_EXPERIMENT_APPROVAL_REQUIRED');
 if(mode==='PRODUCTION'){
  if(approval?.statement!=='HUMAN ACCEPT BAZI DEEP MANUSCRIPT R2'||!approval.productionFrozen||awaitlessVersions(approval.versions)!==awaitlessVersions(VERSIONS))throw Error('BDM_PRODUCTION_FREEZE_REQUIRED');
  if(!order?.orderId||order.paymentConfirmed!==true||order.requiredInputsValid!==true||order.authorityReady!==true||order.subjectId!==pack.subject.subjectId||order.authorityDigest!==pack.digest)throw Error('BDM_PAID_VALID_ORDER_REQUIRED');
 }
}
function awaitlessVersions(v){return JSON.stringify(Object.entries(v||{}).sort());}
// Store contract: durable get/put + exclusive withLock + atomic putIfAbsent.
// Keep the whole generation inside a subject/candidate lease, including provider I/O.
export async function generateBaziDeepManuscript({mode='EXPERIMENT',env={},approval=null,order=null,pack,model,policy,history={},candidateId,experimentId=null,subjectId,store,invoke=invokeBaziDeepManuscript,fixture=false,controlledSequentialExperiment=false,now=()=>new Date().toISOString()}){
 if(controlledSequentialExperiment&&mode!=='EXPERIMENT')throw Error('BDM_CONTROLLED_SEQUENCE_EXPERIMENT_ONLY');
 if(fixture&&invoke===invokeBaziDeepManuscript)throw Error('BDM_FIXTURE_TRANSPORT_REQUIRED');
 assertBaziGenerationAdmission({mode,env,approval,order,pack,model,fixture});
 if(!store?.withLock||!store.put||!store.get||!store.putIfAbsent)throw Error('BDM_DURABLE_STORE_REQUIRED');
 const key=await baziManuscriptCacheKey({candidateId,subjectId,pack,model:model.modelId,orderId:order?.orderId||null,experimentId});
 return store.withLock(key,async()=>{
  const cached=await store.get(key);if(cached){const {digest:hash,...body}=cached;if(await digest(body)!==hash)throw Error('BDM_MANUSCRIPT_CACHE_INTEGRITY');return {snapshot:cached,cacheHit:true,providerCalls:0};}
  const checkpointKey=key+':CHECKPOINT';let cp=await store.get(checkpointKey)||createBaziCheckpoint({candidateId,orderId:order?.orderId,experimentId,subjectId,pack,model:model.modelId});assertCheckpointLineage(cp,pack);
  if(cp.orderId!==(order?.orderId||null)||cp.experimentId!==experimentId||cp.subjectId!==subjectId||cp.candidateId!==candidateId)throw Error('BDM_CHECKPOINT_SUBJECT_ORDER_MISMATCH');
  if(cp.model!==model.modelId)throw Error('BDM_CHECKPOINT_MODEL_MISMATCH');
  if(cp.inFlight)throw Error('BDM_INFLIGHT_RECONCILIATION_REQUIRED');
  const persist=()=>store.put(checkpointKey,cp);let sessionCalls=0;
  async function attempt({batchId,units,callType,authority,semanticAnchor=null}){
   guardBaziPaidUnitRequest(cp,units,callType!=='NORMAL');
   const priorSummary=callType==='NORMAL'?buildPriorSectionSummary(pack,batchId):'';
   const plan=planBaziDeepManuscriptOutputBudget({authority,priorSummary,units,history,model,policy,semanticAnchor});
   if(!plan.allowed)throw Error(plan.reason);
   const payload={authority,priorSummary,requestedUnits:units,...(semanticAnchor?{semanticAnchor}:{})};
   const request={model:model.modelId,systemPrompt:BAZI_DEEP_MANUSCRIPT_PROMPT,payload,schema:buildBaziManuscriptSchema(units),plan};
   const schemaDigest=await digest(request.schema),promptDigest=await digest(request.systemPrompt);
   const requestKey=await digest({candidateId,sequence:cp.ledger.length,units,callType});
   cp.inFlight={requestKey,units,callType,batchId,startedAt:now()};
   if(callType==='NORMAL')cp.batchesAttempted.push(batchId);
   if(callType==='STANDARD_RECOVERY')cp.standardRecoveryCallsUsed++;
   if(callType==='DELIVERY_RESCUE')cp.deliveryRescueCalls++;
   if(callType==='TRANSPORT_RETRY')cp.transportRetries++;
   await persist(); // reserve BEFORE request; process crash must not spend twice
   let response,error;try{sessionCalls++;response=await invoke({env,request});}catch(e){error=e;}
   const usage=response?.usage||error?.usage;const known=Number.isFinite(usage?.input_tokens)&&Number.isFinite(usage?.output_tokens);
   const inputTokens=known?usage.input_tokens:null,outputTokens=known?usage.output_tokens:null,cachedInputTokens=known?(usage.input_tokens_details?.cached_tokens||0):null;
   const cost=known?baziTokenCost(model,{inputTokens,cachedInputTokens,outputTokens}):null;
   const receipt={orderId:cp.orderId,experimentId:cp.experimentId,batchId,sectionIds:[...new Set(units.map(u=>u.sectionId))],units,callType,model:model.modelId,requestId:response?.requestId||error?.requestId||null,requestKey,promptDigest,schemaDigest,batchAuthorityDigest:await digest(authority),inputTokens,cachedInputTokens,outputTokens,reasoningTokens:usage?.output_tokens_details?.reasoning_tokens??null,completionStatus:response?.completionStatus||null,incompleteReason:response?.incompleteReason||null,technicalClassification:response?.finishReason==='max_output_tokens'?'TECHNICAL_TRUNCATION':null,visibleManuscriptTokenEstimate:response?.output?.sections?response.output.sections.reduce((n,s)=>n+estimateBaziTokens((s.zhHansManuscript||'')+(s.enManuscript||'')),0):null,visibleTokenEstimationMethod:'UTF8_BYTE_UPPER_BOUND',cost,usageStatus:known?'RECORDED':'UNKNOWN',finishReason:response?.finishReason||error?.code||error?.message||'TRANSPORT_FAILED',plannedCost:plan.estimatedCost,plannedOutputTokens:plan.plannedMaxOutputTokens,actualOutputTokens:outputTokens,outputUtilizationRatio:known?outputTokens/plan.plannedMaxOutputTokens:null,truncated:response?.finishReason==='max_output_tokens',checkpointedUnits:[],createdAt:now(),fixture};
   if(response){const inspected=inspectBaziManuscriptResponse(response,units);receipt.visibleManuscriptTokenEstimate=inspected.units.reduce((n,u)=>n+(u.manuscript?estimateBaziTokens(u.manuscript):0),0);receipt.technicalDefects=inspected.units.filter(u=>u.status!=='COMPLETE').map(({sectionId,locale,reason})=>({sectionId,locale,reason}));receipt.visibleManuscriptTokenEstimateScope='Complete checkpointable section/locale text only; partial unclosed strings excluded';await commitBaziCompleteUnits(cp,inspected,receipt);receipt.checkpointedUnits=inspected.units.filter(u=>u.status==='COMPLETE').map(u=>unitKey(u.sectionId,u.locale));receipt.sectionsCompleted=new Set(receipt.checkpointedUnits.map(k=>k.split('/')[0])).size;receipt.localesCompleted=receipt.checkpointedUnits.length;}
   cp.ledger.push(receipt);cp.costTelemetry=costTelemetry(cp.ledger.reduce((n,r)=>n+(r.cost||0),0),policy.costTiers);cp.unknownUsageCalls=cp.ledger.filter(r=>r.usageStatus==='UNKNOWN').length;
   if(error?.usageUnknown){cp.state='TRANSPORT_RECONCILIATION_PENDING';await persist();return {pause:true,error};}
   delete cp.inFlight;
   if(error&&retryableBaziTransport(error)&&controlledSequentialExperiment){cp.state='TECHNICAL_RECOVERY_PENDING';}
   if(error&&retryableBaziTransport(error)&&!controlledSequentialExperiment){cp.pendingTransport={batchId,units,authority,semanticAnchor};cp.notBefore=Date.parse(now())+POLICY.backoffMs[Math.min(cp.transportRetries,POLICY.backoffMs.length-1)];cp.state='TRANSPORT_RETRY_PENDING';}
   if(error&&!retryableBaziTransport(error))cp.state='PROVIDER_CONFIGURATION_PENDING';
   await persist();return {error,pause:!!error};
  }
  // Retries are separate scheduled transport attempts, with persisted backoff.
  if(cp.pendingTransport){
   if(Date.parse(now())<cp.notBefore)return {checkpoint:cp,state:'TRANSPORT_RETRY_PENDING',providerCalls:0};
   if(cp.transportRetries>=POLICY.transportRetryLimit){delete cp.pendingTransport;cp.state='DELIVERY_RESCUE';await persist();}
   else {const descriptor=cp.pendingTransport;delete cp.pendingTransport;const retried=await attempt({...descriptor,callType:'TRANSPORT_RETRY'});if(retried.pause)return {checkpoint:cp,state:cp.state,providerCalls:sessionCalls};}
  }
  // Preflight all 3 BEFORE the first paid request, never change normal topology.
  for(const b of BATCHES){const units=b.sectionIds.flatMap(sectionId=>LOCALES.map(locale=>({sectionId,locale})));const p=planBaziDeepManuscriptOutputBudget({authority:projectBaziBatchAuthority(pack,b.batchId),priorSummary:buildPriorSectionSummary(pack,b.batchId),units,history,model,policy});if(!p.allowed)throw Error(p.reason);}
  // This experiment's authorization requires technical repair before advancing.
  // The production scheduler and default engine policy retain their existing path.
  async function recoverControlledBatches(){
   const sectionIds=BATCHES.filter(b=>cp.batchesAttempted.includes(b.batchId)).flatMap(b=>b.sectionIds);
   while(unresolvedBaziUnits(cp).some(u=>sectionIds.includes(u.sectionId))){
    const recovery=planBaziTechnicalRecovery(cp,pack,{mode,sectionIds});
    if(recovery.approvalRequired){
     cp.state='EXPERIMENT_DELIVERY_RESCUE_REQUIRED';
     const section=recovery.units[0].sectionId,batchId=BATCHES.find(b=>b.sectionIds.includes(section)).batchId;
     cp.rescueEstimate=planBaziDeepManuscriptOutputBudget({authority:projectBaziBatchAuthority(pack,batchId,[section]),units:recovery.units,history,model,policy});
     await persist();return {checkpoint:cp,state:cp.state,providerCalls:sessionCalls};
    }
    cp.state='TARGETED_RECOVERY';const result=await attempt(recovery);
    if(result.pause)return {checkpoint:cp,state:cp.state,providerCalls:sessionCalls};
   }
   return null;
  }
  for(const b of BATCHES){
   if(controlledSequentialExperiment){const paused=await recoverControlledBatches();if(paused)return paused;}
   if(cp.batchesAttempted.includes(b.batchId))continue;
   const units=b.sectionIds.flatMap(sectionId=>LOCALES.map(locale=>({sectionId,locale})));guardBaziPaidUnitRequest(cp,units);
   cp.state='GENERATING_NORMAL';const result=await attempt({batchId:b.batchId,units,callType:'NORMAL',authority:projectBaziBatchAuthority(pack,b.batchId)});
   if(result.pause)return {checkpoint:cp,state:cp.state,providerCalls:sessionCalls};
   if(result.error&&!retryableBaziTransport(result.error)){cp.state='PROVIDER_CONFIGURATION_PENDING';await persist();return {checkpoint:cp,state:cp.state,providerCalls:sessionCalls};}
  }
  if(controlledSequentialExperiment){const paused=await recoverControlledBatches();if(paused)return paused;}
  // Bounded work per invocation: 2 standard recoveries + ONE rescue. A durable
  // scheduler resumes rescue after backoff; no unbounded in-request while loop.
  for(let i=0;i<POLICY.maxStandardRecoveryCalls+1&&unresolvedBaziUnits(cp).length;i++){
   const recovery=planBaziTechnicalRecovery(cp,pack,{mode});if(recovery.approvalRequired){cp.state='EXPERIMENT_RECOVERY_APPROVAL_PENDING';await persist();return {checkpoint:cp,state:cp.state,providerCalls:sessionCalls};}
   cp.state=recovery.callType==='DELIVERY_RESCUE'?'DELIVERY_RESCUE':'TARGETED_RECOVERY';const result=await attempt(recovery);
   if(result.pause)return {checkpoint:cp,state:cp.state,providerCalls:sessionCalls};
   if(result.error){cp.state=retryableBaziTransport(result.error)?'TRANSPORT_RETRY_PENDING':'PROVIDER_CONFIGURATION_PENDING';cp.nextAttemptAfterMs=POLICY.backoffMs[Math.min(cp.transportRetries,POLICY.backoffMs.length-1)];await persist();return {checkpoint:cp,state:cp.state,providerCalls:sessionCalls};}
   if(recovery.callType==='DELIVERY_RESCUE')break;
  }
  if(unresolvedBaziUnits(cp).length){cp.state='DELIVERY_RESCUE';cp.nextAttemptAfterMs=POLICY.backoffMs.at(-1);await persist();return {checkpoint:cp,state:cp.state,providerCalls:sessionCalls};}
  cp.state='MANUSCRIPT_COMPLETE';await persist();const snapshot=await freezeBaziManuscript(cp,pack);await store.putIfAbsent(key,snapshot);return {snapshot,checkpoint:cp,cacheHit:false,providerCalls:sessionCalls};
 });
}
