import {personIdentity} from '../account/canonical-person-store.js';
import {commerceEnvironment} from '../commerce/commerce-environment.js';
import {PAID_REPORT_METHODS} from './paid-report-method-registry.js';
import {paidReportStateStore} from './paid-report-state-store.js';
import {PAID_REPORT_POLICY,TERMINAL_PAID_STATES,paidReportError,classifyReportFailure} from './paid-report-policy.js';
import {requireSharedPaidReportLocal,customerReportStatus} from './paid-report-readiness.js';
import {runPaidReportRefund} from './paid-report-refund.js';
import {digest} from '../account/oidc-auth.js';
export async function ensureVerifiedPaidReportJob(env,order,{registry=PAID_REPORT_METHODS,clock=Date.now}={}){
 requireSharedPaidReportLocal(env);const store=paidReportStateStore(env,clock),db=store.db,intentId=JSON.parse(order.context_json||'{}').reportIntentId;
 if(!intentId)return null;const r=await store.readiness(intentId,order.customer_id),adapter=registry[r?.methodCode];
 if(!r||!adapter?.p8Admitted||r.productId!==order.product_id||r.state!=='READY_TO_PAY')throw paidReportError('PAYMENT_READINESS_BINDING_REQUIRED');
 const p=await db.prepare("SELECT p.* FROM commerce_purchases p JOIN digital_entitlements e ON e.purchase_id=p.purchase_id JOIN commerce_checkout_attempts o ON o.checkout_attempt_id=p.checkout_attempt_id WHERE p.checkout_attempt_id=? AND p.customer_id=? AND p.product_id=? AND p.purchase_state='purchased' AND e.entitlement_status='active' AND e.product_id=p.product_id AND e.customer_id=p.customer_id AND o.order_state='FULFILLED' AND o.review_required=0 AND o.environment=?").bind(order.checkout_attempt_id,order.customer_id,order.product_id,commerceEnvironment(env)).first();
 if(!p)throw paidReportError('VERIFIED_PURCHASE_REQUIRED');const presentation=JSON.parse(order.context_json).reportPresentation;
 if(presentation?.reportLocale!==r.presentation.reportLocale||presentation?.reportLanguageMode!==r.presentation.reportLanguageMode)throw paidReportError('PURCHASE_PRESENTATION_MISMATCH');
 const id=await digest([commerceEnvironment(env),p.purchase_id,r.methodCode,r.personId].join('\0'));
 const j={jobId:id,environment:commerceEnvironment(env),ownerAccountId:r.ownerAccountId,purchaseId:p.purchase_id,orderId:order.checkout_attempt_id,productId:r.productId,methodCode:r.methodCode,personId:r.personId,personVersion:r.personVersion,inputDigest:r.inputDigest,readinessId:r.readinessId,presentation:r.presentation,authorityDigest:r.authorityDigest,reportId:id,state:'DELIVERY_JOB_CREATED',stageIndex:0,attempts:0,rescueUsed:false,createdAt:clock(),updatedAt:clock(),dueAt:clock()+PAID_REPORT_POLICY.jobStartGrace};
 return store.insertJob(j);
}
export function sharedPaidReportCore(context,{registry=PAID_REPORT_METHODS,clock=Date.now,refundTransport,crashAfter,observe=()=>{}}={}){
 requireSharedPaidReportLocal(context.env);const owner=personIdentity(context).userId,store=paidReportStateStore(context.env,clock);
 const methods=['prepare','generate','validate','compile','render','release'],states=['DELIVERY_JOB_CREATED','GENERATING','VALIDATING_OUTPUT','COMPILING_PUBLICATION','RENDERING','RENDERING'];
 const event=(name,j)=>observe({event:name,jobId:j.jobId,methodCode:j.methodCode,productId:j.productId});
 async function owned(id){const j=await store.job(id,owner);if(!j)throw paidReportError('REPORT_JOB_UNAVAILABLE',404);return j;}
 async function execute(id){let j=await owned(id),adapter=registry[j.methodCode];if(!adapter?.p8Admitted)throw paidReportError('METHOD_DELIVERY_ADAPTER_NOT_ADMITTED');if(TERMINAL_PAID_STATES.includes(j.state)){if(j.state==='DELIVERED')await adapter.verifyDelivered(context,j,j.output);return j;}j=await store.claim(j);
  try{
   const existing=await adapter.reconcile(context,j);
   if(existing){await adapter.verifyDelivered(context,j,existing);j=await store.update(j,{state:'DELIVERED',output:existing,reportId:existing.reportId,dueAt:clock()});await store.resolveIncidents(j);event('DELIVERED',j);return j;}
   if(/^REFUND/.test(j.state)){j=await runPaidReportRefund({store,job:j,adapter,context,transport:refundTransport});return j;}
   if(j.state==='PROVIDER_RECONCILIATION_REQUIRED'){await store.incident(j,'PROVIDER_UNKNOWN','PROVIDER_RECONCILIATION_REQUIRED');if(clock()-j.createdAt>=PAID_REPORT_POLICY.maxLifecycleAge)j=await store.update(j,{state:'REFUND_REQUIRED',dueAt:clock()});else j=await store.update(j,{dueAt:clock()+PAID_REPORT_POLICY.recoveryLease});return j;}
   if(clock()-j.createdAt>=PAID_REPORT_POLICY.maxLifecycleAge){j=await store.update(j,{state:'REFUND_REQUIRED',dueAt:clock()});return j;}
   if(j.inFlightStage==='generate'){
    const recovered=await adapter.recoverCheckpoint?.(context,j,'generate');
    if(recovered)j=await store.update(j,{output:recovered,stageIndex:2,inFlightStage:null});
    else{await store.incident(j,'PROVIDER_UNKNOWN','PROVIDER_OUTCOME_UNCERTAIN');j=await store.update(j,{state:'PROVIDER_RECONCILIATION_REQUIRED',dueAt:clock()+PAID_REPORT_POLICY.recoveryLease});return j;}
   }
   if(j.state==='AUTOMATIC_RECOVERY'||j.state==='DELIVERY_RESCUE')j=await store.update(j,{state:states[j.stageIndex],dueAt:clock()+PAID_REPORT_POLICY.generationLease});
   for(let i=j.stageIndex;i<methods.length;i++){
    if(j.state!==states[i])j=await store.update(j,{state:states[i]});event(i===1?'GENERATION_STARTED':i===4?'RENDER_STARTED':'DELIVERY_CHECKPOINT',j);
    j=await store.update(j,{inFlightStage:methods[i]});
    const output=await adapter[methods[i]](context,j,j.output);
    // Lifecycle SQL carries references only. Content/authority remain in existing
    // method and immutable artifact stores, never duplicated in generic job rows.
    if(!output||Object.keys(output).some(k=>!['personId','locale','reportId','artifactRef','snapshotDigest','outputDigest','checkpointRef'].includes(k)))throw paidReportError('ADAPTER_OPAQUE_OUTPUT_REQUIRED');
    // Method owner outputs are saved before advancing. A retry reuses the saved
    // result rather than repeating successful provider/renderer stages.
    j=await store.update(j,{output,stageIndex:i+1,inFlightStage:null,dueAt:clock()+PAID_REPORT_POLICY.generationLease});
    if(typeof crashAfter==='function')await crashAfter(methods[i],j);
    if(crashAfter===methods[i])throw Object.assign(Error('QA_PROCESS_CRASH'),{qaCrash:true});
   }
   await adapter.verifyDelivered(context,j,j.output);j=await store.update(j,{state:'DELIVERED',reportId:j.output.reportId,dueAt:clock()});await store.resolveIncidents(j);event('DELIVERED',j);return j;
  }catch(error){if(error.qaCrash)throw error;const f=classifyReportFailure(error);await store.incident(j,f.class,f.code);event('DELIVERY_FAILURE',j);
   if(/^REFUND/.test(j.state)){j=await store.update(j,{lastFailure:f,dueAt:clock()+PAID_REPORT_POLICY.refundLease});return j;}
   if(f.class==='PROVIDER_UNKNOWN')j=await store.update(j,{state:'PROVIDER_RECONCILIATION_REQUIRED',lastFailure:f,dueAt:clock()+PAID_REPORT_POLICY.recoveryLease});
   else if(!f.retry||adapter.recoveryEligible?.(f,j)===false)j=await store.update(j,{state:'REFUND_REQUIRED',lastFailure:f,dueAt:clock()});
   else if(j.attempts<adapter.recoveryPolicy.maximumAttempts)j=await store.update(j,{state:'AUTOMATIC_RECOVERY',inFlightStage:null,attempts:j.attempts+1,lastFailure:f,dueAt:clock()+PAID_REPORT_POLICY.recoveryLease});
   else if(adapter.recoveryPolicy.rescue&&!j.rescueUsed)j=await store.update(j,{state:'DELIVERY_RESCUE',inFlightStage:null,rescueUsed:true,lastFailure:f,dueAt:clock()+PAID_REPORT_POLICY.rescueLease});
   else j=await store.update(j,{state:'REFUND_REQUIRED',lastFailure:f,dueAt:clock()});return j;
  }finally{await store.unclaim(j);}
 }
 return {store,work:execute,async status(id){return customerReportStatus(await owned(id));},async scanDueJobs(){return (await store.due()).filter(j=>j.ownerAccountId===owner);},async claimDueJob(id){return store.claim(await owned(id));},async reconcileJob(id){return execute(id);},async advanceOrEscalate(){const out=[];for(const j of await this.scanDueJobs())out.push(await execute(j.jobId));await store.pruneReadiness();return out;}};
}
