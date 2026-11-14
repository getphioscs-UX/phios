import {createCustomerArtifactStore} from '../report-delivery/customer-artifact-store.js';
import {createCustomerReportArtifact} from '../report-delivery/customer-report-artifact.js';
import {createReportGenerationStore} from '../personal-reading/report-generation-store.js';
import {personIdentity,loadCanonicalPersonSubject} from './canonical-person-store.js';
import {requireZiweiEntitlement} from '../report-delivery/ziwei-production-generation-v1.js';
import {commerceEnvironment} from '../commerce/commerce-environment.js';
import {methodPdfSHA} from '../report-delivery/method-pdf-transfer.js';
import {openAccountZiweiMaterial} from './ziwei-account-delivery.js';
import {assertZiweiFinalArtifact} from '../report-delivery/ziwei-final-artifact-contract.js';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
import {prepareZiweiPdfIssuanceR1,REPORT_PDF_RENDITION_VERSIONS} from '../report-delivery/report-pdf-issuance-port-r1.js';
export const ZWR_PDF_VERSION='ZWR-R13-PRIVATE-PDF-1';
const fail=code=>{throw Object.assign(Error(code),{code,status:409});};
async function bindingFor(context,candidate,reportId){
 // Final review PDFs remain local-only on reads as well as writes.
 assertZiweiPdfScope(context,candidate);
 const owner=personIdentity(context).userId,right=await requireZiweiEntitlement(context,candidate.locale,{purchaseId:candidate.purchaseId});
 if(owner!==candidate.customerId||right.purchase_id!==candidate.purchaseId)fail('REPORT_UNAVAILABLE');
 await loadCanonicalPersonSubject(context.env,owner,candidate.personId);
 const order=await context.env.RUNTIME_DB.prepare("SELECT checkout_attempt_id FROM commerce_purchases WHERE purchase_id=? AND customer_id=? AND purchase_state='purchased'").bind(candidate.purchaseId,owner).first();
 if(!order)fail('REPORT_UNAVAILABLE');
 return {environment:commerceEnvironment(context.env),ownerAccountId:owner,orderId:order.checkout_attempt_id,purchaseId:candidate.purchaseId,reportId,productId:'COM-REPORT-ZIWEI-FULL'};
}
// Review files have their own explicit local scope. No QA boolean grants customer release.
export function assertZiweiPdfScope(context,candidate){
 if(context.env.PHIOS_ENVIRONMENT==='local'&&context.env.STRIPE_ENVIRONMENT==='QA'&&context.env.PHIOS_LOCAL_ZWR_CURRENT_NATIVE_QA==='true'&&candidate.schemaVersion==='ZWR-VFR-R1-AUTO-DEEP-CANDIDATE-v3'&&candidate.productionAdmissionGranted===false&&candidate.paidReportBinding?.ownerAccountId===personIdentity(context).userId&&candidate.paidReportBinding?.purchaseId===candidate.purchaseId&&candidate.paidReportBinding?.productId==='COM-REPORT-ZIWEI-FULL'&&candidate.paidReportBinding?.reportId)return 'LOCAL_CURRENT_NATIVE_QA_NOT_CUSTOMER_RELEASE';
 if(context.env.PHIOS_ENVIRONMENT!=='local'||candidate.schemaVersion!=='ZWR-VFR-R1-ACCEPTED-RENDERER-FIXTURE-v1'||candidate.productionAdmissionGranted!==false)fail('ZWR_COMMERCIAL_WATERMARK_AND_P8_ADMISSION_REQUIRED');
 return 'LOCAL_SYNTHETIC_REFERENCE_ONLY';
}
export async function assertAccountZiweiFinalArtifact(context,{candidate,reportId,verification,pdfBytes,finalPublicationReceipt}){
 assertZiweiPdfScope(context,candidate);
 const binding=await bindingFor(context,candidate,reportId),right=await requireZiweiEntitlement(context,candidate.locale,{purchaseId:candidate.purchaseId});
 return assertZiweiFinalArtifact({candidate,verification,pdfBytes,receipt:finalPublicationReceipt,binding,entitlementId:right.entitlement_id});
}
export async function persistAccountZiweiPdf(context,{candidate,reportId,html,verification,pdfBytes,finalPublicationReceipt=null}){
 const scope=assertZiweiPdfScope(context,candidate),binding=await bindingFor(context,candidate,reportId),c=candidate.snapshot.semanticContent;
 const right=await requireZiweiEntitlement(context,candidate.locale,{purchaseId:candidate.purchaseId});
 const d=finalPublicationReceipt?await assertZiweiFinalArtifact({candidate,verification,pdfBytes,receipt:finalPublicationReceipt,binding,entitlementId:right.entitlement_id}):verification.pdfDerivative;
 if(!c.vfrR2PublicationBinding||!d||d.bytes!==pdfBytes?.length||d.outputDigest!==await methodPdfSHA(pdfBytes)||d.semanticSnapshotId!==candidate.snapshot.semanticSnapshotId||d.publicationDigest!==c.visualReportIr.publicationIrDigest||d.sourceHtmlDigest!==verification.outputDigest||d.pages!==(finalPublicationReceipt?finalPublicationReceipt.pageCount:verification.pageCount))fail('ZWR_PDF_SOURCE_BINDING_INVALID');
 const artifact=await createCustomerReportArtifact({reportArtifactId:reportId,customerId:candidate.customerId,personId:candidate.personId,methodCode:'ZWR',productCode:binding.productId,entitlementId:right.entitlement_id,inputDigest:candidate.snapshot.inputFingerprint,authorityPackVersion:c.vfrCompactAuthoringPackDigest,reportContentVersion:c.vfrDeepManuscriptDigest,rendererVersion:verification.rendererVersion,inputSnapshot:c.vfrInputSnapshot||{sourceRef:'ACCEPTED_REFERENCE_ONLY',subject:c.subject},calculationSnapshot:c.evidence,generatedSections:c.visualReportIr.sections,publicationIR:{...c.visualReportIr,digest:c.visualReportIr.publicationIrDigest},htmlSnapshotOrRenderState:{objectKey:`released-method/${reportId}/${verification.outputDigest}.html`,outputDigest:verification.outputDigest},pdfPolicy:'PERSISTED_PRIVATE_PDF_REQUIRED',reviewOnly:true,releaseAdmission:false,scope,...(finalPublicationReceipt?{finalPublicationReceipt}:{})});
 const store=await createCustomerArtifactStore(context.env,binding),state=await createReportGenerationStore(context.env,binding,{scope:'delivery'});
 const sourceVersion=finalPublicationReceipt?.version||ZWR_PDF_VERSION,priorRelease=await state.withLock('zwr-pdf-release',()=>state.get('zwr-pdf-release'));
 const legacy=await store.hasPdfDerivative({artifact,version:sourceVersion,outputDigest:d.outputDigest}),version=priorRelease?.version||(legacy?sourceVersion:REPORT_PDF_RENDITION_VERSIONS.ZWR);
 if(priorRelease&&(priorRelease.artifactDigest!==artifact.artifactDigest||![sourceVersion,REPORT_PDF_RENDITION_VERSIONS.ZWR].includes(version)))fail('ZWR_PDF_IMMUTABLE_RECEIPT_MISMATCH');
 const sourceReceipt=finalPublicationReceipt||{schemaVersion:'ZWR-VERIFIED-PDF-SOURCE-R1',version:sourceVersion,methodCode:'ZWR',ownerAccountId:binding.ownerAccountId,subjectId:candidate.personId,orderId:binding.orderId,purchaseId:binding.purchaseId,productId:binding.productId,entitlementId:right.entitlement_id,nativeSnapshotId:candidate.snapshot.semanticSnapshotId,inputFingerprint:candidate.snapshot.inputFingerprint,outputSHA256:d.outputDigest,bytes:d.bytes,pageCount:d.pages,publicationIRDigest:d.publicationDigest,sourceHtmlDigest:d.sourceHtmlDigest};
 const result=await store.pdfDerivative({artifact,version,allowCreate:true,authorize:()=>bindingFor(context,candidate,reportId),prepareIssuance:()=>prepareZiweiPdfIssuanceR1(context,{binding,candidate,artifact,verification,sourceReceipt,version}),render:async()=>pdfBytes});const saved=await store.save(artifact);
 if(version===sourceVersion){if(result.outputDigest!==d.outputDigest)fail('ZWR_PDF_IMMUTABLE_BYTES_MISMATCH');}
 else if(!result.renditionReceipt||result.renditionReceipt.sourceSHA256!==d.outputDigest||result.renditionReceipt.sourceReceiptDigest!==await sha256Stable(sourceReceipt))fail('ZWR_PDF_RENDITION_SOURCE_MISMATCH');
 const receipt={version,artifactDigest:artifact.artifactDigest,outputDigest:result.outputDigest,bytes:result.bytes.length,snapshotId:candidate.snapshot.semanticSnapshotId,publicationDigest:artifact.publicationIR.digest,sourceHtmlDigest:verification.outputDigest,scope,...(result.renditionReceipt?{sourceVersion,renditionReceiptDigest:await sha256Stable(result.renditionReceipt)}:{}),...(finalPublicationReceipt?{finalPublicationReceiptDigest:await sha256Stable(finalPublicationReceipt)}:{})};
 await state.withLock('zwr-pdf-release',async()=>{const prior=await state.get('zwr-pdf-release');if(prior&&JSON.stringify(prior)!==JSON.stringify(receipt))fail('ZWR_PDF_IMMUTABLE_RECEIPT_MISMATCH');await state.putIfAbsent('zwr-pdf-release',receipt);});return {receipt,cacheHit:saved.cacheHit&&result.cacheHit};
}
export async function accountZiweiPdfLink(context,material){
 if(!material.candidate.finalPublicationReceiptDigest&&!JSON.parse(material.row.verifier_receipt).pdfDerivative)return {};
 const {candidate,row}=material,binding=await bindingFor(context,candidate,row.report_id),store=await createCustomerArtifactStore(context.env,binding),state=await createReportGenerationStore(context.env,binding,{scope:'delivery'});
 let artifact;try{artifact=(await store.open()).artifact;}catch(e){if(e.message==='CUSTOMER_ARTIFACT_NOT_GENERATED')return {};throw e;}
 const receipt=await state.withLock('zwr-pdf-release',()=>state.get('zwr-pdf-release'));
 if(!receipt||receipt.artifactDigest!==artifact.artifactDigest||receipt.snapshotId!==candidate.snapshot.semanticSnapshotId||receipt.sourceHtmlDigest!==row.output_digest)return {};
 if(artifact.finalPublicationReceipt&&(receipt.finalPublicationReceiptDigest!==await sha256Stable(artifact.finalPublicationReceipt)||candidate.finalPublicationReceiptDigest!==receipt.finalPublicationReceiptDigest))return {};
 if(!await store.hasPdfDerivative({artifact,version:receipt.version,outputDigest:receipt.outputDigest}))return {};
 return {pdfDownloadUrl:'/api/account-method-reports?reportId='+encodeURIComponent(row.report_id)+'&format=pdf',pdfPublicationVersion:receipt.version,pdfDigest:receipt.outputDigest};
}
export async function downloadAccountZiweiPdf(context,reportId){
 const material=await openAccountZiweiMaterial(context,reportId),{candidate}=material,binding=await bindingFor(context,candidate,reportId),store=await createCustomerArtifactStore(context.env,binding),state=await createReportGenerationStore(context.env,binding,{scope:'delivery'}),{artifact}=await store.open(),receipt=await state.withLock('zwr-pdf-release',()=>state.get('zwr-pdf-release'));
 const right=await requireZiweiEntitlement(context,candidate.locale,{purchaseId:candidate.purchaseId});
 if(artifact.entitlementId!==right.entitlement_id||artifact.customerId!==binding.ownerAccountId)fail('REPORT_UNAVAILABLE');
 if(!receipt||receipt.artifactDigest!==artifact.artifactDigest||receipt.snapshotId!==candidate.snapshot.semanticSnapshotId||receipt.sourceHtmlDigest!==material.row.output_digest||receipt.publicationDigest!==candidate.snapshot.semanticContent.visualReportIr.publicationIrDigest||artifact.personId!==candidate.personId||artifact.methodCode!=='ZWR'||artifact.productCode!==binding.productId)fail('ZWR_PDF_IMMUTABLE_RECEIPT_MISMATCH');
 if(artifact.finalPublicationReceipt){
  const final=artifact.finalPublicationReceipt;
  if(receipt.renditionReceiptDigest){if(receipt.finalPublicationReceiptDigest!==await sha256Stable(final)||candidate.finalPublicationReceiptDigest!==receipt.finalPublicationReceiptDigest||receipt.sourceVersion!==final.version)fail('ZWR_FINAL_ARTIFACT_RECEIPT_MISMATCH');}
  else {if(receipt.finalPublicationReceiptDigest!==await sha256Stable(final)||candidate.finalPublicationReceiptDigest!==receipt.finalPublicationReceiptDigest||receipt.version!==final.version||receipt.outputDigest!==final.outputSHA256||receipt.bytes!==final.bytes)fail('ZWR_FINAL_ARTIFACT_RECEIPT_MISMATCH');}
  const verification=JSON.parse(material.row.verifier_receipt);
  await assertZiweiFinalArtifact({candidate,verification,receipt:final,binding,entitlementId:right.entitlement_id});
 }else if(candidate.finalPublicationReceiptDigest)fail('ZWR_FINAL_ARTIFACT_RECEIPT_REQUIRED');
 // No renderer callback: every download, including cold reopen, reads issued bytes.
 const result=await store.pdfDerivative({artifact,version:receipt.version,authorize:()=>bindingFor(context,candidate,reportId)});
 if(receipt.outputDigest!==result.outputDigest||receipt.bytes!==result.bytes.length)fail('ZWR_PDF_IMMUTABLE_RECEIPT_MISMATCH');
 if(receipt.renditionReceiptDigest&&(receipt.renditionReceiptDigest!==await sha256Stable(result.renditionReceipt)||result.renditionReceipt?.sourceVersion!==receipt.sourceVersion||artifact.finalPublicationReceipt&&result.renditionReceipt.sourceReceiptDigest!==await sha256Stable(artifact.finalPublicationReceipt)))fail('ZWR_PDF_RENDITION_RECEIPT_MISMATCH');
 return new Response(result.bytes,{headers:{'Content-Type':'application/pdf','Content-Length':String(result.bytes.length),'Content-Disposition':`attachment; filename="PHI-OS-Zi-Wei-${reportId.replace(/[^A-Za-z0-9_-]/g,'')}.pdf"`,'Cache-Control':'private, no-store','X-PHIOS-Output-Digest':result.outputDigest,'X-PHIOS-Release-Scope':receipt.scope,'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow'}});
}
