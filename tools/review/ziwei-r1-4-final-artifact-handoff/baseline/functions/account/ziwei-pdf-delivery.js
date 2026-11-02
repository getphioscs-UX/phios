import {createCustomerArtifactStore} from '../report-delivery/customer-artifact-store.js';
import {createCustomerReportArtifact} from '../report-delivery/customer-report-artifact.js';
import {createReportGenerationStore} from '../personal-reading/report-generation-store.js';
import {personIdentity,loadCanonicalPersonSubject} from './canonical-person-store.js';
import {requireZiweiEntitlement} from '../report-delivery/ziwei-production-generation-v1.js';
import {commerceEnvironment} from '../commerce/commerce-environment.js';
import {methodPdfSHA} from '../report-delivery/method-pdf-transfer.js';
import {openAccountZiweiMaterial} from './ziwei-account-delivery.js';
export const ZWR_PDF_VERSION='ZWR-R13-PRIVATE-PDF-1';
const fail=code=>{throw Object.assign(Error(code),{code,status:409});};
async function bindingFor(context,candidate,reportId){
 const owner=personIdentity(context).userId,right=await requireZiweiEntitlement(context,candidate.locale);
 if(owner!==candidate.customerId||right.purchase_id!==candidate.purchaseId)fail('REPORT_UNAVAILABLE');
 await loadCanonicalPersonSubject(context.env,owner,candidate.personId);
 const order=await context.env.RUNTIME_DB.prepare("SELECT checkout_attempt_id FROM commerce_purchases WHERE purchase_id=? AND customer_id=? AND purchase_state='purchased'").bind(candidate.purchaseId,owner).first();
 if(!order)fail('REPORT_UNAVAILABLE');
 return {environment:commerceEnvironment(context.env),ownerAccountId:owner,orderId:order.checkout_attempt_id,purchaseId:candidate.purchaseId,reportId,productId:'COM-REPORT-ZIWEI-FULL'};
}
// Review files have their own explicit local scope. No QA boolean grants customer release.
export function assertZiweiPdfScope(context,candidate){
 if(context.env.PHIOS_ENVIRONMENT!=='local'||candidate.schemaVersion!=='ZWR-VFR-R1-ACCEPTED-RENDERER-FIXTURE-v1'||candidate.productionAdmissionGranted!==false)fail('ZWR_COMMERCIAL_WATERMARK_AND_P8_ADMISSION_REQUIRED');
 return 'LOCAL_SYNTHETIC_REFERENCE_ONLY';
}
export async function persistAccountZiweiPdf(context,{candidate,reportId,html,verification,pdfBytes}){
 const scope=assertZiweiPdfScope(context,candidate),binding=await bindingFor(context,candidate,reportId),c=candidate.snapshot.semanticContent,d=verification.pdfDerivative;
 if(!c.vfrR2PublicationBinding||!d||d.bytes!==pdfBytes?.length||d.outputDigest!==await methodPdfSHA(pdfBytes)||d.semanticSnapshotId!==candidate.snapshot.semanticSnapshotId||d.publicationDigest!==c.visualReportIr.publicationIrDigest||d.sourceHtmlDigest!==verification.outputDigest||d.pages!==verification.pageCount)fail('ZWR_PDF_SOURCE_BINDING_INVALID');
 const right=await requireZiweiEntitlement(context,candidate.locale),artifact=await createCustomerReportArtifact({reportArtifactId:reportId,customerId:candidate.customerId,personId:candidate.personId,methodCode:'ZWR',productCode:binding.productId,entitlementId:right.entitlement_id,inputDigest:candidate.snapshot.inputFingerprint,authorityPackVersion:c.vfrCompactAuthoringPackDigest,reportContentVersion:c.vfrDeepManuscriptDigest,rendererVersion:verification.rendererVersion,inputSnapshot:c.vfrInputSnapshot||{sourceRef:'ACCEPTED_REFERENCE_ONLY',subject:c.subject},calculationSnapshot:c.evidence,generatedSections:c.visualReportIr.sections,publicationIR:{...c.visualReportIr,digest:c.visualReportIr.publicationIrDigest},htmlSnapshotOrRenderState:{objectKey:`released-method/${reportId}/${verification.outputDigest}.html`,outputDigest:verification.outputDigest},pdfPolicy:'PERSISTED_PRIVATE_PDF_REQUIRED',reviewOnly:true,releaseAdmission:false,scope});
 const store=await createCustomerArtifactStore(context.env,binding),state=await createReportGenerationStore(context.env,binding,{scope:'delivery'});
 const saved=await store.save(artifact),result=await store.pdfDerivative({artifact,version:ZWR_PDF_VERSION,allowCreate:true,authorize:()=>bindingFor(context,candidate,reportId),render:async()=>pdfBytes});
 if(result.outputDigest!==d.outputDigest)fail('ZWR_PDF_IMMUTABLE_BYTES_MISMATCH');
 const receipt={version:ZWR_PDF_VERSION,artifactDigest:artifact.artifactDigest,outputDigest:result.outputDigest,bytes:result.bytes.length,snapshotId:candidate.snapshot.semanticSnapshotId,publicationDigest:artifact.publicationIR.digest,sourceHtmlDigest:verification.outputDigest,scope};
 await state.withLock('zwr-pdf-release',async()=>{const prior=await state.get('zwr-pdf-release');if(prior&&JSON.stringify(prior)!==JSON.stringify(receipt))fail('ZWR_PDF_IMMUTABLE_RECEIPT_MISMATCH');await state.putIfAbsent('zwr-pdf-release',receipt);});return {receipt,cacheHit:saved.cacheHit&&result.cacheHit};
}
export async function downloadAccountZiweiPdf(context,reportId){
 const material=await openAccountZiweiMaterial(context,reportId),{candidate}=material,binding=await bindingFor(context,candidate,reportId),store=await createCustomerArtifactStore(context.env,binding),state=await createReportGenerationStore(context.env,binding,{scope:'delivery'}),{artifact}=await store.open(),receipt=await state.withLock('zwr-pdf-release',()=>state.get('zwr-pdf-release'));
 const right=await requireZiweiEntitlement(context,candidate.locale);
 if(artifact.entitlementId!==right.entitlement_id||artifact.customerId!==binding.ownerAccountId)fail('REPORT_UNAVAILABLE');
 if(!receipt||receipt.artifactDigest!==artifact.artifactDigest||receipt.snapshotId!==candidate.snapshot.semanticSnapshotId||receipt.sourceHtmlDigest!==material.row.output_digest||receipt.publicationDigest!==candidate.snapshot.semanticContent.visualReportIr.publicationIrDigest||artifact.personId!==candidate.personId||artifact.methodCode!=='ZWR'||artifact.productCode!==binding.productId)fail('ZWR_PDF_IMMUTABLE_RECEIPT_MISMATCH');
 // No renderer callback: every download, including cold reopen, reads issued bytes.
 const result=await store.pdfDerivative({artifact,version:receipt.version,authorize:()=>bindingFor(context,candidate,reportId)});
 if(receipt.outputDigest!==result.outputDigest||receipt.bytes!==result.bytes.length)fail('ZWR_PDF_IMMUTABLE_RECEIPT_MISMATCH');
 return new Response(result.bytes,{headers:{'Content-Type':'application/pdf','Content-Length':String(result.bytes.length),'Content-Disposition':`attachment; filename="PHI-OS-Zi-Wei-${reportId.replace(/[^A-Za-z0-9_-]/g,'')}.pdf"`,'Cache-Control':'private, no-store','X-PHIOS-Output-Digest':result.outputDigest,'X-PHIOS-Release-Scope':receipt.scope,'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow'}});
}
