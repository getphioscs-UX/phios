import {commerceEnvironment} from '../commerce/commerce-environment.js';
import {createReportGenerationStore} from './report-generation-store.js';
import {createPaidProductCostAuthority} from './paid-product-cost-authority.js';
import {createPaidReportTransport} from './paid-report-transport.js';
import {assertPaidReportWorkerFence} from '../report-delivery/paid-report-worker-fence.js';
// Server caller supplies identity from authentication and canonical report
// ownership. SQL verifies purchase, environment and order before any transport.
export async function createServerPaidReportContext({env,binding,request,model,validateProviderOutput}){
 if(request.phase!=='FOLLOWUP')await assertPaidReportWorkerFence(env);
 if(env.REPORT_ACCESS_TIER==='FREE')throw Error('FREE_REPORT_PROVIDER_FORBIDDEN');
 const environment=commerceEnvironment(env);
 const row=await env.RUNTIME_DB.prepare(`SELECT p.purchase_id FROM commerce_purchases p
  JOIN commerce_checkout_attempts o ON o.checkout_attempt_id=p.checkout_attempt_id
  WHERE p.purchase_id=? AND p.customer_id=? AND o.customer_id=?
  AND o.checkout_attempt_id=? AND o.environment=? AND p.purchase_state='purchased'
  AND o.review_required=0 AND o.order_state IN ('PAID','FULFILLMENT_PENDING','FULFILLED')`).bind(binding.purchaseId,binding.ownerAccountId,binding.ownerAccountId,binding.orderId,environment).first();
 if(!row)throw Error('PAID_REPORT_ORDER_ENVIRONMENT_MISMATCH');
 if(env.PHIOS_SHARED_PAID_REPORT_ENABLED==='true'){
  const job=await env.RUNTIME_DB.prepare("SELECT job_id,method_code,record_json,state FROM paid_report_jobs WHERE environment=? AND owner_account_id=? AND purchase_id=? AND product_id=?").bind(environment,binding.ownerAccountId,binding.purchaseId,binding.productId).first();
  if(!job||['REFUND_REQUIRED','REFUND_PENDING','REFUND_RECONCILIATION_REQUIRED','REFUNDED'].includes(job.state)||job.state==='DELIVERED'&&request.phase!=='FOLLOWUP')throw Error('PAID_REPORT_ACTIVE_JOB_REQUIRED');
  const state=JSON.parse(job.record_json);request={...request,jobId:job.job_id,methodCode:job.method_code,stage:request.phase,attempt:state.attempts,unitScope:request.repairUnit||request.requestId};
 }
 const verified={...binding,environment,verifiedPayment:true};
 const productCostAuthority=await createPaidProductCostAuthority(env,verified);
 const store=await createReportGenerationStore(env,verified);
 const key='lifecycle';
 const transport=createPaidReportTransport({store,key,binding:verified,request,model,validateProviderOutput,productCostAuthority});
 return {transport,store,key,binding:verified};
}
