import {ownedReportPresentation} from '../commerce/book-commerce-store.js';
import {assertPaidReportWorkerFence} from './paid-report-worker-fence.js';
// Existing purchase/entitlement owner. A job or issued file must never switch
// to a newer same-product purchase when its original right is revoked.
export async function ownedZiweiPurchase(context,owner,productId,{purchaseId=null}={}){
 const fence=await assertPaidReportWorkerFence(context.env);
 if(fence){
  const job=await context.env.RUNTIME_DB.prepare('SELECT purchase_id,product_id,method_code FROM paid_report_jobs WHERE job_id=? AND owner_account_id=?').bind(fence.jobId,owner).first();
  if(!job||job.product_id!==productId||job.method_code!=='ZWR'||purchaseId&&purchaseId!==job.purchase_id)throw Error('ZWR_JOB_PURCHASE_BINDING_MISMATCH');
  purchaseId=job.purchase_id;
 }
 return ownedReportPresentation(context.env,owner,productId,Date.now,{purchaseId});
}
