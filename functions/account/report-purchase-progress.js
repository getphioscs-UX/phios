// Read-only projection of native orders. It does not create a report, entitlement,
// generation job or publication status. Fulfilled purchase is not report release.
import {customerReportStatus,requireSharedPaidReportLocal} from '../report-delivery/paid-report-readiness.js';
export async function listOwnedReportPurchaseProgress(env,owner){
 if(!owner||!env?.RUNTIME_DB?.prepare)throw Object.assign(Error('REPORT_STORAGE_UNAVAILABLE'),{status:503});
 const rows=(await env.RUNTIME_DB.prepare("SELECT o.checkout_attempt_id AS orderId,o.product_id AS productId,o.order_state AS orderState,o.review_required AS reviewRequired FROM commerce_checkout_attempts o JOIN commerce_products p ON p.product_id=o.product_id WHERE o.customer_id=? AND p.category='REPORT' ORDER BY o.created_at DESC LIMIT 100").bind(owner).all()).results||[];
 const jobs=env.PHIOS_SHARED_PAID_REPORT_ENABLED==='true'?(requireSharedPaidReportLocal(env),(await env.RUNTIME_DB.prepare('SELECT order_id,record_json FROM paid_report_jobs WHERE owner_account_id=? ORDER BY created_at DESC LIMIT 100').bind(owner).all()).results):[];
 return rows.map(r=>{const job=jobs.find(j=>j.order_id===r.orderId);return {orderId:r.orderId,productId:r.productId,state:r.reviewRequired?'SUPPORT_REQUIRED':['PENDING','CHECKOUT_CREATED','PAYMENT_PROCESSING','PAYMENT_FAILED','CANCELED','REFUNDED','PARTIALLY_REFUNDED'].includes(r.orderState)?r.orderState:'RELEASE_PENDING',purchaseState:r.orderState,releaseAsserted:false,downloadAllowed:false,...(job?{delivery:customerReportStatus(JSON.parse(job.record_json))}:{})};});
}
