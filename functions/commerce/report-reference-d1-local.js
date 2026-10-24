// Explicit local delivery candidate. No production route imports this module.
import {personIdentity} from '../account/canonical-person-store.js';
import {verifyCustomerReportArtifact} from '../report-delivery/customer-report-artifact.js';
import {reservationStatements,assertReservationIdentity,issuanceStatement,attachVerifiedPurchaseStatement} from './report-reference-candidate.js';
import {openAccountBaziMaterial} from '../account/bazi-account-delivery.js';
import {openFinancialReport} from '../financial/holistic-planning-product/factual-report-job.js';
const defaults=Object.freeze({
 'COM-REPORT-BAZI-FULL':(context,request)=>openAccountBaziMaterial(context,request.reportId),
 'COM-REPORT-FINANCIAL-FULL':(context,request)=>openFinancialReport(context,request.financialOpenRequest)
});
export function localReportReferenceStore(context,{clock=()=>new Date().toISOString(),owners=defaults}={}){
 const env=context.env;
 if(env?.PHIOS_ENVIRONMENT!=='local'||env.PHIOS_REPORT_REFERENCE_LOCAL!=='true'||env.PHIOS_REPORT_REFERENCE_DB_LOCAL!=='true'||env.STRIPE_ENVIRONMENT==='LIVE')throw Error('LOCAL_D1_REFERENCE_ONLY');
 const db=env.RUNTIME_DB,owner=personIdentity(context).userId;
 const read=key=>db.prepare('SELECT * FROM report_public_references WHERE environment=? AND emission_key=? AND owner_ref=?').bind('QA',key,owner).first();
 const run=s=>db.prepare(s.sql).bind(...s.params).run();
 async function reserve(input){
  const request={...input,environment:'QA',ownerRef:owner};if(input.environment==='LIVE'||input.ownerRef&&input.ownerRef!==owner)throw Error('REFERENCE_OWNER_OR_ENVIRONMENT_DENIED');
  await db.batch(reservationStatements(request).map(s=>db.prepare(s.sql).bind(...s.params)));
  return assertReservationIdentity(await read(input.emissionKey),request);
 }
 async function paidGrant(row){
  if(row.nature!=='PAID')return null;
  const grant=await db.prepare(`SELECT e.entitlement_id,p.purchase_id FROM digital_entitlements e JOIN commerce_purchases p ON p.purchase_id=e.purchase_id JOIN commerce_checkout_attempts o ON o.checkout_attempt_id=p.checkout_attempt_id WHERE p.purchase_id=? AND p.customer_id=? AND e.customer_id=? AND o.customer_id=? AND e.product_id=? AND e.entitlement_status='active' AND e.revoked_at IS NULL AND (e.expires_at IS NULL OR e.expires_at>?) AND p.purchase_state='purchased' AND p.revoked_at IS NULL AND p.refunded_amount_minor=0 AND o.environment='QA' AND o.review_required=0 AND o.order_state='FULFILLED'`).bind(row.purchase_id,owner,owner,owner,row.product_id,clock()).first();
  if(!grant)throw Error('CURRENT_PAID_GRANT_REQUIRED');return {confirmed:true,ownerRef:owner,purchaseId:grant.purchase_id,productId:row.product_id};
 }
 async function load(row,request){
  if(!owners[row.product_id])throw Error('DOMAIN_DELIVERY_OWNER_NOT_BOUND');
  const opened=await owners[row.product_id](context,request);const artifact=opened?.artifact;
  await verifyCustomerReportArtifact(artifact,{customerId:owner,reportArtifactId:request.reportId});
  if(artifact.productCode!==row.product_id||artifact.reportContentVersion!==request.version||artifact.inputDigest!==request.inputDigest)throw Error('DELIVERY_VERSION_OR_PRODUCT_MISMATCH');
  if(!artifact.generationCompletedAt||!Number.isFinite(Date.parse(artifact.generationCompletedAt)))throw Error('IMMUTABLE_GENERATION_DATE_REQUIRED');
  return {opened,artifact};
 }
 async function attach(key,identities){const row=await read(key);if(!row)throw Error('REFERENCE_UNAVAILABLE');await run(attachVerifiedPurchaseStatement(row,identities));const attached=await read(key);if(attached?.purchase_id!==identities.purchaseId||attached?.receipt_number!==identities.receiptNumber)throw Error('VERIFIED_PURCHASE_ATTACHMENT_REQUIRED');return attached;}
 async function syncExistingPayment(key){
  const row=await read(key);if(!row||row.nature!=='PAID')return row;
  const order=await db.prepare("SELECT order_state FROM commerce_checkout_attempts WHERE checkout_attempt_id=? AND customer_id=? AND environment='QA'").bind(row.order_id,owner).first();
  const purchase=row.purchase_id?await db.prepare('SELECT purchase_state,revoked_at,refunded_amount_minor FROM commerce_purchases WHERE purchase_id=? AND customer_id=? AND checkout_attempt_id=?').bind(row.purchase_id,owner,row.order_id).first():null;
  const reversed=purchase&&(purchase.purchase_state!=='purchased'||purchase.revoked_at||purchase.refunded_amount_minor>0);
  if(reversed||order?.order_state==='CANCELED')await db.prepare("UPDATE report_public_references SET reversed=CASE WHEN state='REPORT_ISSUED' THEN 1 ELSE reversed END,state=CASE WHEN state='REPORT_RESERVED' THEN 'VOID' ELSE state END WHERE environment='QA' AND emission_key=? AND owner_ref=?").bind(key,owner).run();
  return read(key);
 }
 async function issue(key,request){
  let row=await syncExistingPayment(key);if(!row||row.state==='VOID'||row.state==='EXPIRED'||row.reversed)throw Error('REFERENCE_NOT_ISSUABLE');
  const grant=await paidGrant(row),{artifact}=await load(row,request);
  if(row.state==='REPORT_ISSUED'){if(row.report_artifact_id!==artifact.reportArtifactId||row.source_digest!==artifact.inputDigest||row.saved_version!==request.version)throw Error('ISSUED_VERSION_IMMUTABLE');return row;}
  const statement=issuanceStatement(row,{artifact:{frozen:true,reportId:request.reportId,artifactId:artifact.reportArtifactId,version:request.version,sourceDigest:artifact.inputDigest,ownerRef:owner,productId:row.product_id},grant,issuedAt:artifact.generationCompletedAt});
  statement.sql+=" AND (nature!='PAID' OR EXISTS(SELECT 1 FROM digital_entitlements e WHERE e.purchase_id=report_public_references.purchase_id AND e.product_id=report_public_references.product_id AND e.customer_id=report_public_references.owner_ref AND e.entitlement_status='active' AND e.revoked_at IS NULL AND (e.expires_at IS NULL OR e.expires_at>?)))";statement.params.push(clock());await run(statement);
  row=await read(key);if(row?.state!=='REPORT_ISSUED')throw Error('REFERENCE_ISSUANCE_LOST_GRANT');return row;
 }
 async function reopen(key,request){const row=await syncExistingPayment(key);if(!row||row.state!=='REPORT_ISSUED'||row.reversed)throw Error('REFERENCE_UNAVAILABLE');await paidGrant(row);const {opened,artifact}=await load(row,request);if(row.report_artifact_id!==artifact.reportArtifactId||row.source_digest!==artifact.inputDigest||row.saved_version!==request.version)throw Error('DELIVERY_VERSION_OR_PRODUCT_MISMATCH');return {reference:row,opened};}
 async function registerPaidDelivery(request){
  // Called after existing domain release; all transaction identities come from
  // the owned canonical purchase, never a supplied receipt or invented order.
  const ids=await db.prepare("SELECT p.checkout_attempt_id,p.purchase_id,r.receipt_number FROM commerce_purchases p JOIN commerce_receipts r ON r.purchase_id=p.purchase_id JOIN commerce_checkout_attempts o ON o.checkout_attempt_id=p.checkout_attempt_id WHERE p.purchase_id=? AND p.customer_id=? AND o.customer_id=? AND o.environment='QA' AND p.purchase_state='purchased' AND p.revoked_at IS NULL AND p.refunded_amount_minor=0").bind(request.purchaseId,owner,owner).first();
  if(!ids)throw Error('EXISTING_OWNED_PURCHASE_REQUIRED');
  const {artifact}=await load({product_id:request.productId},request);
  const emissionKey=JSON.stringify(['owned-delivery-v1',owner,artifact.reportArtifactId,request.version]);
  await reserve({environment:'QA',emissionKey,productId:request.productId,year:new Date(artifact.generationCompletedAt).getUTCFullYear(),nature:'PAID',createdAt:artifact.generationCompletedAt,orderId:ids.checkout_attempt_id,purchaseId:ids.purchase_id,receiptNumber:ids.receipt_number,previousReference:request.previousReference||null});
  return issue(emissionKey,request);
 }
 return {reserve,attach,issue,reopen,read,syncExistingPayment,registerPaidDelivery};
}
