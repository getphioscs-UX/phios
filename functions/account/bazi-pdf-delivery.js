import {openAccountBaziMaterial} from './bazi-account-delivery.js';
import {createCustomerArtifactStore} from '../report-delivery/customer-artifact-store.js';
import {personIdentity,loadCanonicalPersonSubject} from './canonical-person-store.js';
import {commerceEnvironment} from '../commerce/commerce-environment.js';
import {prepareBaziPdfIssuanceR1,REPORT_PDF_RENDITION_VERSIONS} from '../report-delivery/report-pdf-issuance-port-r1.js';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
export const BAZI_PDF_DERIVATIVE_VERSION='BZR-PRIVATE-PDF-DERIVATIVE-1';
const fail=(code,status=409)=>{throw Object.assign(Error(code),{code,status});};
const hash=async b=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),v=>v.toString(16).padStart(2,'0')).join('');
async function authorizeSource(context,binding,artifact){
 const owner=personIdentity(context).userId;
 if(!binding||binding.ownerAccountId!==owner||binding.reportId!==artifact.reportArtifactId||binding.productId!=='COM-REPORT-BAZI-FULL'||artifact.customerId!==owner||artifact.methodCode!=='BZR'||artifact.productCode!==binding.productId)fail('REPORT_UNAVAILABLE',404);
 await loadCanonicalPersonSubject(context.env,owner,artifact.personId);
 const right=await context.env.RUNTIME_DB.prepare("SELECT e.entitlement_id FROM commerce_purchases p JOIN digital_entitlements e ON e.purchase_id=p.purchase_id JOIN commerce_checkout_attempts o ON o.checkout_attempt_id=p.checkout_attempt_id WHERE p.purchase_id=? AND p.customer_id=? AND p.product_id=? AND p.purchase_state='purchased' AND e.entitlement_id=? AND e.customer_id=p.customer_id AND e.product_id=p.product_id AND e.entitlement_status='active' AND (e.expires_at IS NULL OR e.expires_at>?) AND o.customer_id=p.customer_id AND o.order_state='FULFILLED' AND o.review_required=0 AND o.environment=?").bind(binding.purchaseId,owner,binding.productId,artifact.entitlementId,new Date().toISOString(),commerceEnvironment(context.env)).first();
 if(!right)fail('REPORT_UNAVAILABLE',404);
}
async function repairFromFrozenPublication(context,artifact){
 if(!context.env.METHOD_REPORT_RENDERER?.fetch)fail('REPORT_PDF_RENDERER_UNAVAILABLE',503);
 const response=await context.env.METHOD_REPORT_RENDERER.fetch(new Request('https://method-report-renderer.internal/pdf',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({method:'BZR',publication:artifact.publicationIR,expectedHtmlDigest:artifact.htmlSnapshotOrRenderState.outputDigest})}));
 if(!response.ok||!response.headers.get('content-type')?.startsWith('application/pdf')||response.headers.get('x-phios-html-digest')!==artifact.htmlSnapshotOrRenderState.outputDigest||response.headers.get('x-phios-publication-digest')!==artifact.publicationIR.digest)fail('REPORT_PDF_RENDER_VERIFICATION_REQUIRED',503);
 const reader=response.body?.getReader();if(!reader)fail('REPORT_PDF_RENDER_FAILED',503);const chunks=[];let size=0;
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>128*1024*1024){await reader.cancel();fail('REPORT_PDF_SIZE_INVALID',503);}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return bytes;
}
// Called only by the existing generation/recovery owner, never by a download.
// A successful first render supplies its original bytes; no second render occurs.
export async function persistAccountBaziPdf(context,{binding,artifact,pdfBytes,verification}={}){
 if(!artifact||!binding)fail('REPORT_PDF_MATERIAL_REQUIRED');await authorizeSource(context,binding,artifact);const store=await createCustomerArtifactStore(context.env,binding);
 const legacy=await store.hasPdfDerivative({artifact,version:BAZI_PDF_DERIVATIVE_VERSION}),version=legacy?BAZI_PDF_DERIVATIVE_VERSION:REPORT_PDF_RENDITION_VERSIONS.BZR;
 const prepareIssuance=async()=>{const d=verification?.pdfDerivative;if(verification?.passed!==true||verification.outputDigest!==artifact.htmlSnapshotOrRenderState.outputDigest||verification.publicationDigest!==artifact.publicationIR.digest||d?.pages!==48)fail('REPORT_PDF_VERIFIED_SOURCE_RECEIPT_REQUIRED');return prepareBaziPdfIssuanceR1(context,{binding,artifact,version,sourceReceipt:{schemaVersion:'BZR-FROZEN-PDF-SOURCE-R1',version:BAZI_PDF_DERIVATIVE_VERSION,methodCode:'BZR',ownerAccountId:binding.ownerAccountId,subjectId:artifact.personId,orderId:binding.orderId,purchaseId:binding.purchaseId,productId:binding.productId,outputSHA256:d.outputDigest,bytes:d.bytes,pageCount:d.pages,publicationIRDigest:artifact.publicationIR.digest,sourceHtmlDigest:verification.outputDigest}});};
 const result=await store.pdfDerivative({artifact,version,allowCreate:true,authorize:()=>authorizeSource(context,binding,artifact),prepareIssuance,render:async()=>{
  if(!pdfBytes)return repairFromFrozenPublication(context,artifact);
  if(verification?.outputDigest!==artifact.htmlSnapshotOrRenderState.outputDigest||verification.publicationDigest!==artifact.publicationIR.digest||verification.pdfDerivative?.pages!==48||verification.pdfDerivative.bytes!==pdfBytes.length||verification.pdfDerivative.outputDigest!==await hash(pdfBytes))fail('REPORT_PDF_SOURCE_BINDING_INVALID');
  return pdfBytes;
 }});
 return {persisted:true,outputDigest:result.outputDigest,bytes:result.bytes.length,artifactDigest:artifact.artifactDigest,sourceHtmlDigest:artifact.htmlSnapshotOrRenderState.outputDigest,publicationDigest:artifact.publicationIR.digest,derivativeVersion:version,optimization:result.renditionReceipt?result.optimizationReceipt.profile:'NONE_UNOPTIMIZED_VERIFIED_RENDER',...(result.renditionReceipt?{renditionReceiptDigest:await sha256Stable(result.renditionReceipt)}:{}),cacheHit:result.cacheHit};
}
export async function hasAccountBaziPdf(context,material){
 if(!material.artifact||!material.candidate.paidReportBinding)return false;
 const store=await createCustomerArtifactStore(context.env,material.candidate.paidReportBinding);
 return store.hasPdfDerivative({artifact:material.artifact,version:material.pdfRef?.derivativeVersion||BAZI_PDF_DERIVATIVE_VERSION,outputDigest:material.pdfRef?.outputDigest});
}
export async function downloadAccountBaziPdf(context,reportId){
 const material=await openAccountBaziMaterial(context,reportId),artifact=material.artifact,binding=material.candidate.paidReportBinding;
 if(!artifact||!binding)fail('REPORT_PDF_MATERIAL_REQUIRED');
 const store=await createCustomerArtifactStore(context.env,binding);
 // Intentionally no renderer callback: missing/corrupt issued files fail safely.
 const result=await store.pdfDerivative({artifact,version:material.pdfRef?.derivativeVersion||BAZI_PDF_DERIVATIVE_VERSION,authorize:()=>authorizeSource(context,binding,artifact)});
 if(material.pdfRef?.renditionReceiptDigest&&material.pdfRef.renditionReceiptDigest!==await sha256Stable(result.renditionReceipt))fail('REPORT_PDF_RENDITION_RECEIPT_MISMATCH');
 if(artifact.pdfPolicy==='PERSISTED_PRIVATE_PDF_REQUIRED'&&!material.pdfRef)fail('REPORT_PDF_RELEASE_RECEIPT_REQUIRED');
 if(material.pdfRef&&(material.pdfRef.outputDigest!==result.outputDigest||material.pdfRef.bytes!==result.bytes.length||material.pdfRef.artifactDigest!==artifact.artifactDigest||material.pdfRef.publicationDigest!==artifact.publicationIR.digest||material.pdfRef.sourceHtmlDigest!==artifact.htmlSnapshotOrRenderState.outputDigest))fail('REPORT_PDF_IMMUTABLE_RECEIPT_MISMATCH');
 return new Response(result.bytes,{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="PHI-OS-BaZi-${reportId.replace(/[^A-Za-z0-9_-]/g,'')}.pdf"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow','X-PHIOS-Output-Digest':result.outputDigest}});
}

export async function baziPdfRendererReady(context){try{const response=await context.env.METHOD_REPORT_RENDERER?.fetch(new Request('https://method-report-renderer.internal/health'));if(!response?.ok)return false;const receipt=await response.json();return receipt.ok===true&&receipt.pdfTransferProtocol==='BZR-PDF-MULTIPART-1';}catch{return false;}}
