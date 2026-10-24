// Local QA candidate only. Not imported by checkout, webhooks or delivery owners.
import {commerceProduct} from '../pws/commercial/stripe-product-registry.js';
export const REPORT_REFERENCE_VERSION='REPORT-REFERENCE-LOCAL-R1';
export const REPORT_PRODUCT_METHODS=Object.freeze({'COM-REPORT-BAZI-FULL':'BZR','COM-REPORT-ZIWEI-FULL':'ZWR','COM-REPORT-ASTROLOGY-FULL':'AST','COM-REPORT-HD-FULL':'HD','COM-REPORT-ECR-FULL':'ECR','COM-REPORT-PROFILE-FULL':'PROFILE','COM-REPORT-NUMEROLOGY-FULL':'NUM','COM-REPORT-CROSS-FULL':'CROSS','COM-REPORT-FINANCIAL-FULL':'FIN','COM-WILL-WRITING':'WILL','COM-READING-TAROT-FULL':'TAROT','COM-READING-ICHING-FULL':'ICHING'});
export function reportMethod(productId){commerceProduct(productId);const code=REPORT_PRODUCT_METHODS[productId];if(!code)throw Error('REPORT_REFERENCE_PRODUCT_UNSUPPORTED');return code;}
export function assertReservationIdentity(row,input){
 if(!row||row.environment!==input.environment||row.product_id!==input.productId||row.owner_ref!==input.ownerRef||row.nature!==input.nature||row.order_id!==(input.orderId||null)||(input.purchaseId&&row.purchase_id!==input.purchaseId)||(input.receiptNumber&&row.receipt_number!==input.receiptNumber)||row.previous_reference!==(input.previousReference||null))throw Error('RESERVATION_REPLAY_IDENTITY_MISMATCH');
 return row;
}
export function reservationStatements(r){
 if(r.environment!=='QA')throw Error('LOCAL_CANDIDATE_QA_ONLY');
 const method=reportMethod(r.productId);if(!Number.isInteger(r.year)||r.year<2026||r.year>9999||!r.emissionKey||!r.ownerRef||!r.createdAt||!['PAID','FREE','DRAFT'].includes(r.nature))throw Error('REFERENCE_INPUT_INVALID');
 if(r.nature==='FREE'&&(r.orderId||r.purchaseId||r.receiptNumber))throw Error('FREE_CANNOT_HAVE_PAYMENT_REFERENCE');
 return [
  {sql:'INSERT OR IGNORE INTO report_reference_counters(environment,method,year,value) VALUES(?,?,?,0)',params:[r.environment,method,r.year]},
  {sql:'UPDATE report_reference_counters SET value=value+1 WHERE environment=? AND method=? AND year=? AND NOT EXISTS(SELECT 1 FROM report_public_references WHERE environment=? AND emission_key=?)',params:[r.environment,method,r.year,r.environment,r.emissionKey]},
  {sql:`INSERT INTO report_public_references(environment,emission_key,public_report_number,method,product_id,owner_ref,nature,state,order_id,purchase_id,receipt_number,created_at,previous_reference)
   SELECT ?,?,'PHI-QA-'||method||'-'||year||'-'||printf('%06d',value),method,?,?,?,'REPORT_RESERVED',?,?,?,?,?
   FROM report_reference_counters WHERE environment=? AND method=? AND year=? AND NOT EXISTS(SELECT 1 FROM report_public_references WHERE environment=? AND emission_key=?)`,params:[r.environment,r.emissionKey,r.productId,r.ownerRef,r.nature,r.orderId||null,r.purchaseId||null,r.receiptNumber||null,r.createdAt,r.previousReference||null,r.environment,method,r.year,r.environment,r.emissionKey]}
 ];
}
export function invoiceRequestDiff({strategy='ORDER',orderReference,reservedReportNumber,bundle=false,mode='payment'}){
 if(!orderReference||!/^ord_[A-Za-z0-9]+$/.test(orderReference))throw Error('CANONICAL_ORDER_REFERENCE_REQUIRED');
 if(!['ORDER','REPORT_RESERVED'].includes(strategy))throw Error('INVOICE_STRATEGY_INVALID');
 if(mode!=='payment')return {};
 if(strategy==='REPORT_RESERVED'&&!bundle&&!/^PHI-QA-[A-Z]+-\d{4}-\d{6,}$/.test(reservedReportNumber||''))throw Error('QA_RESERVED_REPORT_REFERENCE_REQUIRED');
 const report=strategy==='REPORT_RESERVED'&&!bundle;
 return {'invoice_creation[enabled]':'true','invoice_creation[invoice_data][custom_fields][0][name]':report?'PHI OS Report Reference':'PHI OS Order Reference','invoice_creation[invoice_data][custom_fields][0][value]':report?reservedReportNumber:orderReference,'invoice_creation[invoice_data][metadata][order_id]':orderReference,...(report?{'invoice_creation[invoice_data][metadata][report_reference]':reservedReportNumber}:{})};
}
export function issuanceStatement(record,{artifact,grant,issuedAt}){
 if(record.environment!=='QA'||record.state!=='REPORT_RESERVED'||!artifact?.frozen||!artifact.reportId||!artifact.artifactId||!artifact.version||!artifact.sourceDigest||artifact.ownerRef!==record.owner_ref||artifact.productId!==record.product_id||!issuedAt)throw Error('ISSUANCE_FROZEN_OWNED_ARTIFACT_REQUIRED');
 if(record.nature==='PAID'&&(!grant?.confirmed||grant.revoked||grant.ownerRef!==record.owner_ref||grant.purchaseId!==record.purchase_id||grant.productId!==record.product_id))throw Error('ISSUANCE_CONFIRMED_PAID_GRANT_REQUIRED');
 return {sql:`UPDATE report_public_references SET state='REPORT_ISSUED',report_id=?,report_artifact_id=?,saved_version=?,source_digest=?,issued_at=? WHERE environment='QA' AND emission_key=? AND state='REPORT_RESERVED' AND (nature!='PAID' OR EXISTS(SELECT 1 FROM commerce_purchases p JOIN commerce_receipts r ON r.purchase_id=p.purchase_id WHERE r.receipt_number=report_public_references.receipt_number AND p.purchase_id=report_public_references.purchase_id AND p.checkout_attempt_id=report_public_references.order_id AND p.customer_id=report_public_references.owner_ref AND p.purchase_state='purchased' AND p.revoked_at IS NULL AND p.refunded_amount_minor=0))`,params:[artifact.reportId,artifact.artifactId,artifact.version,artifact.sourceDigest,issuedAt,record.emission_key]};
}
export function attachVerifiedPurchaseStatement(record,{purchaseId,receiptNumber}){
 if(record.environment!=='QA'||record.state!=='REPORT_RESERVED'||record.nature!=='PAID'||!purchaseId||!receiptNumber)throw Error('QA_RESERVED_PAID_BINDING_REQUIRED');
 return {sql:`UPDATE report_public_references SET purchase_id=?,receipt_number=? WHERE environment='QA' AND emission_key=? AND state='REPORT_RESERVED' AND (purchase_id IS NULL OR purchase_id=?) AND (receipt_number IS NULL OR receipt_number=?) AND EXISTS(SELECT 1 FROM commerce_purchases p JOIN commerce_receipts r ON r.purchase_id=p.purchase_id WHERE p.purchase_id=? AND r.receipt_number=? AND p.checkout_attempt_id=report_public_references.order_id AND p.customer_id=report_public_references.owner_ref AND p.purchase_state='purchased' AND p.revoked_at IS NULL AND p.refunded_amount_minor=0)`,params:[purchaseId,receiptNumber,record.emission_key,purchaseId,receiptNumber,purchaseId,receiptNumber]};
}
export function reconcileMockInvoice({verifiedWebhook,invoice,order,session}){
 if(!verifiedWebhook||invoice.livemode!==false||session.livemode!==false||order.environment!=='QA')throw Error('QA_VERIFIED_EVENT_REQUIRED');
 if(invoice.metadata?.order_id!==order.orderId||session.metadata?.order_id!==order.orderId||session.invoice!==invoice.id||invoice.customer!==session.customer||invoice.currency!==order.currency||invoice.amount_paid!==order.amountMinor||session.amount_total!==order.amountMinor||invoice.status!=='paid'||session.payment_status!=='paid')throw Error('INVOICE_ORDER_MISMATCH');
 return Object.freeze({stripeInvoiceId:invoice.id,stripeInvoiceNumber:invoice.number??null,phiosOrderReference:order.orderId,phiosReportNumber:null,fulfillment:'UNCHANGED_CHECKOUT_OWNER_ONLY',grantsCreated:0});
}
