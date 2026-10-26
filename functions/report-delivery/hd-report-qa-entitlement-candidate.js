// Read-only local QA adapter over existing Commerce and immutable artifact owners.
// Not registered as a production delivery owner and never creates entitlements.
import {normalizeVerifiedSymbolicAccountIdentity} from '../symbolic-method-persistence/symbolic-account-identity-v1.js';
import {purchaseAccessByClaims} from '../commerce/book-commerce-store.js';
import {orderReportPresentation} from '../commerce/report-presentation.js';
import {requirePurchasedReportPresentation} from '../pws/commercial/report-successor-contract.js';
import {verifyCustomerReportArtifact} from './customer-report-artifact.js';
export async function requireHdQaArtifactEntitlement(context,artifact,requested){
 const env=context.env,identity=normalizeVerifiedSymbolicAccountIdentity(context.data?.symbolicAccountIdentity);
 if(!['local','qa'].includes(env?.PHIOS_ENVIRONMENT)||env?.STRIPE_ENVIRONMENT!=='QA'||!identity||artifact?.publicationIR?.qaFixture!==true)throw Error('HD_QA_ARTIFACT_SCOPE_REQUIRED');
 await verifyCustomerReportArtifact(artifact,{customerId:identity.userId,reportArtifactId:artifact.reportArtifactId});
 if(artifact.productCode!=='COM-REPORT-HD-FULL'||!artifact.purchaseId)throw Error('HD_REPORT_PURCHASE_BINDING_REQUIRED');
 const exact=await purchaseAccessByClaims(env,{entitlementId:artifact.entitlementId,purchaseId:artifact.purchaseId});
 const owned=await env.RUNTIME_DB.prepare(`SELECT e.customer_id AS entitlementOwner,p.customer_id AS purchaseOwner,o.customer_id AS orderOwner,o.context_json,o.environment,o.review_required,o.order_state FROM digital_entitlements e JOIN commerce_purchases p ON p.purchase_id=e.purchase_id JOIN commerce_checkout_attempts o ON o.checkout_attempt_id=p.checkout_attempt_id WHERE e.entitlement_id=? AND p.purchase_id=?`).bind(artifact.entitlementId,artifact.purchaseId).first();
 if(!exact||!owned||exact.product_id!==artifact.productCode||exact.purchase_state!=='purchased'||exact.entitlement_status!=='active'||exact.expires_at&&Date.parse(exact.expires_at)<=Date.now()||[owned.entitlementOwner,owned.purchaseOwner,owned.orderOwner].some(x=>x!==identity.userId)||owned.environment!=='QA'||owned.review_required!==0||!['FULFILLED','FULFILLMENT_PENDING'].includes(owned.order_state))throw Error('HD_REPORT_EXACT_ENTITLEMENT_REQUIRED');
 return requirePurchasedReportPresentation({...exact,reportPresentation:orderReportPresentation(owned)},requested);
}
