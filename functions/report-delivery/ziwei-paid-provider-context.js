import {assertPaidReportWorkerFence} from './paid-report-worker-fence.js';
import {createServerPaidReportContext} from '../personal-reading/paid-report-context.js';
import {ZIWEI_R5_PAI_REGISTRY,ziweiR5PricingForInput} from '../personal-reading/narrative/ziwei-r5-provider-registry.js';
import {estimatePaiProviderCost} from '../_lib/pai-r1-economics.js';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
import {createReportGenerationStore} from '../personal-reading/report-generation-store.js';
import {createReportBudget} from '../personal-reading/report-generation-budget.js';
import {commerceEnvironment} from '../commerce/commerce-environment.js';
const fail=code=>{throw Object.assign(Error(code),{code,status:409});};
// Existing paid context / SQL cost envelope remain the only budget authorities.
// This factory carries the native candidate into each existing composer request.
export async function createZiweiPaidProviderContext({context,candidate,authorityDigest,semanticKey}){
 const fence=await assertPaidReportWorkerFence(context.env);
 if(!fence)fail('ZWR_PAID_WORKER_CONTEXT_REQUIRED');
 const job=await context.env.RUNTIME_DB.prepare('SELECT * FROM paid_report_jobs WHERE job_id=? AND owner_account_id=?').bind(fence.jobId,candidate.customerId).first();
 if(!job||job.method_code!=='ZWR'||job.product_id!=='COM-REPORT-ZIWEI-FULL'||job.purchase_id!==candidate.purchaseId||job.person_id!==candidate.personId)fail('ZWR_PAID_JOB_BINDING_MISMATCH');
 const frozen=JSON.parse(job.record_json);
 if(frozen.authorityDigest!==authorityDigest||frozen.personVersion!==candidate.personVersion)fail('ZWR_PAID_AUTHORITY_VERSION_MISMATCH');
 const binding=Object.freeze({ownerAccountId:candidate.customerId,purchaseId:job.purchase_id,orderId:job.order_id,productId:job.product_id,reportId:job.report_id,authorityDigest});
 // A semantic cache hit still needs its own paid lifecycle/followup ledger.
 // Initialize with zero requests; monetary reservations remain exclusively in
 // the existing transport and SQL ProductCostEnvelope.
 const right=await context.env.RUNTIME_DB.prepare("SELECT e.entitlement_id FROM commerce_purchases p JOIN commerce_checkout_attempts o ON o.checkout_attempt_id=p.checkout_attempt_id JOIN digital_entitlements e ON e.purchase_id=p.purchase_id WHERE p.purchase_id=? AND p.customer_id=? AND p.product_id=? AND p.purchase_state='purchased' AND o.checkout_attempt_id=? AND o.customer_id=p.customer_id AND o.environment=? AND o.order_state='FULFILLED' AND o.review_required=0 AND e.customer_id=p.customer_id AND e.product_id=p.product_id AND e.entitlement_status='active' AND (e.expires_at IS NULL OR e.expires_at>?)").bind(binding.purchaseId,binding.ownerAccountId,binding.productId,binding.orderId,commerceEnvironment(context.env),new Date().toISOString()).first();
 if(!right)fail('ZWR_PAID_PURCHASE_ENTITLEMENT_REQUIRED');
 const ledgerStore=await createReportGenerationStore(context.env,{...binding,environment:commerceEnvironment(context.env)});
 await ledgerStore.withLock('lifecycle',async()=>{const saved=await ledgerStore.get('lifecycle');if(saved){if(['ownerAccountId','orderId','reportId','productId','authorityDigest'].some(k=>saved[k]!==binding[k]))fail('ZWR_PAID_LEDGER_BINDING_MISMATCH');}else await ledgerStore.put('lifecycle',createReportBudget({...binding,verifiedPayment:true}));});
 const model=ZIWEI_R5_PAI_REGISTRY.models.find(m=>m.modelId==='gpt-5.6-sol');
 if(!model?.pricingVerified)fail('ZWR_PAID_VERIFIED_PRICING_REQUIRED');
 async function forRequest({phase,systemPrompt,userPayload,schema,schemaName,maxOutputTokens}){
  if(!['PRIMARY','REPAIR'].includes(phase)||typeof schemaName!=='string'||!/^zwr_vfr_(?:five_call_batch_\d+|targeted_repair_s\d+)$/.test(schemaName)||!Number.isSafeInteger(maxOutputTokens)||maxOutputTokens<1)fail('ZWR_PAID_REQUEST_SCOPE_INVALID');
  const payload={model:model.modelId,store:false,input:[{role:'system',content:String(systemPrompt)},{role:'user',content:JSON.stringify(userPayload)}],text:{format:{type:'json_schema',name:schemaName,strict:true,schema}},max_output_tokens:maxOutputTokens};
  // UTF-8 byte upper bound includes actual schema/prompt/envelope; no cached
  // input discount is assumed before usage. Reserve potential cache-write uplift.
  const inputBound=new TextEncoder().encode(JSON.stringify(payload)).length+1024;
  const rates=ziweiR5PricingForInput(model,inputBound);
  const projectedMaximumUsd=Number(estimatePaiProviderCost({...rates,inputPricePerMillion:rates.inputPricePerMillion*1.25},{inputTokens:inputBound,cachedInputTokens:0,outputTokens:maxOutputTokens}));
  const unitDigest=await sha256Stable({semanticKey,phase,schemaName,systemPrompt,userPayload,schema});
  const request={requestId:'ZWR:'+unitDigest,phase,projectedMaximumUsd,...(phase==='REPAIR'?{repairUnit:schemaName}:{})};
  const owned=await createServerPaidReportContext({env:context.env,binding,request,model:rates,validateProviderOutput:body=>{if(!body||!Array.isArray(body.output)&&typeof body.output_text!=='string')fail('ZWR_PAID_PROVIDER_OUTPUT_REQUIRED');}});
  return owned.transport;
 }
 return Object.freeze({binding,forRequest});
}
