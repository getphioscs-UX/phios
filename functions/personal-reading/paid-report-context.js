import {commerceEnvironment} from '../commerce/commerce-environment.js';
import {createReportGenerationStore} from './report-generation-store.js';
import {createPaidProductCostAuthority} from './paid-product-cost-authority.js';
import {createPaidReportTransport} from './paid-report-transport.js';
// Server caller supplies identity from authentication and canonical report
// ownership. SQL verifies purchase, environment and order before any transport.
export async function createServerPaidReportContext({env,binding,request,model,validateProviderOutput}){
 if(env.REPORT_ACCESS_TIER==='FREE')throw Error('FREE_REPORT_PROVIDER_FORBIDDEN');
 const environment=commerceEnvironment(env);
 const row=await env.RUNTIME_DB.prepare(`SELECT p.purchase_id FROM commerce_purchases p
  JOIN commerce_checkout_attempts o ON o.checkout_attempt_id=p.checkout_attempt_id
  WHERE p.purchase_id=? AND p.customer_id=? AND o.customer_id=?
  AND o.checkout_attempt_id=? AND o.environment=? AND p.purchase_state='purchased'
  AND o.review_required=0 AND o.order_state IN ('PAID','FULFILLMENT_PENDING','FULFILLED')`).bind(binding.purchaseId,binding.ownerAccountId,binding.ownerAccountId,binding.orderId,environment).first();
 if(!row)throw Error('PAID_REPORT_ORDER_ENVIRONMENT_MISMATCH');
 const verified={...binding,environment,verifiedPayment:true};
 const productCostAuthority=await createPaidProductCostAuthority(env,verified);
 const store=await createReportGenerationStore(env,verified);
 const key='lifecycle';
 const transport=createPaidReportTransport({store,key,binding:verified,request,model,validateProviderOutput,productCostAuthority});
 return {transport,store,key,binding:verified};
}
