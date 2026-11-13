import {finalizeNewReportPdf} from './report-pdf-finalization-r1.js';
import {createReportGenerationStore} from '../personal-reading/report-generation-store.js';
import {verifyCustomerReportArtifact} from './customer-report-artifact.js';
export async function persistCustomerArtifactInHeldStore(env,binding,state,artifact){
 await verifyCustomerReportArtifact(artifact,{customerId:binding.ownerAccountId,reportArtifactId:binding.reportId});
 const prior=await state.get('customer-artifact');
 if(prior){if(prior.artifactDigest!==artifact.artifactDigest)throw Error('IMMUTABLE_CUSTOMER_REPORT_REPLACEMENT_FORBIDDEN');const object=await env.PRIVATE_REPORTS.get(prior.objectKey);if(!object)throw Error('ARTIFACT_OBJECT_MISSING_REPAIR_REQUIRED');const loaded=await verifyCustomerReportArtifact(JSON.parse(await object.text()),{customerId:binding.ownerAccountId,reportArtifactId:binding.reportId});if(loaded.artifactDigest!==prior.artifactDigest)throw Error('ARTIFACT_REFERENCE_DIGEST_MISMATCH');return prior;}
 const ref={objectKey:`customer-artifacts/${binding.reportId}/${artifact.artifactDigest}.json`,artifactDigest:artifact.artifactDigest};
 await env.PRIVATE_REPORTS.put(ref.objectKey,JSON.stringify(artifact),{httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});await state.putIfAbsent('customer-artifact',ref);return ref;
}
// Reuse the existing SQL state/exclusion owner and private object binding. This
// adapter creates no parallel table, report owner, entitlement or public route.
export async function createCustomerArtifactStore(env,binding){
 const state=await createReportGenerationStore(env,binding,{scope:'delivery'});
 if(!env.PRIVATE_REPORTS?.get||!env.PRIVATE_REPORTS?.put)throw Error('PRIVATE_ARTIFACT_STORAGE_REQUIRED');
 const verify=a=>verifyCustomerReportArtifact(a,{customerId:binding.ownerAccountId,reportArtifactId:binding.reportId});
 const read=async ref=>{const object=await env.PRIVATE_REPORTS.get(ref.objectKey);if(!object)throw Error('ARTIFACT_OBJECT_MISSING_REPAIR_REQUIRED');const artifact=await verify(JSON.parse(await object.text()));if(artifact.artifactDigest!==ref.artifactDigest)throw Error('ARTIFACT_REFERENCE_DIGEST_MISMATCH');return artifact;};
 return Object.freeze({
  async save(artifact){await verify(artifact);return state.withLock('customer-artifact',async()=>{const cacheHit=!!await state.get('customer-artifact'),ref=await persistCustomerArtifactInHeldStore(env,binding,state,artifact);return {artifact:await read(ref),cacheHit};});},
  async open(){return state.withLock('customer-artifact',async()=>{const ref=await state.get('customer-artifact');if(!ref)throw Error('CUSTOMER_ARTIFACT_NOT_GENERATED');return {artifact:await read(ref),providerCalls:0};});},
  async hasPdfDerivative({artifact,version,outputDigest}){await verify(artifact);if(!/^[A-Z0-9-]{1,100}$/.test(version))return false;const object=await env.PRIVATE_REPORTS.head?.('customer-artifacts/'+binding.reportId+'/'+artifact.artifactDigest+'/'+version+'.pdf');return !!object&&object.size>=1000&&object.size<=128*1024*1024&&object.customMetadata?.artifactDigest===artifact.artifactDigest&&object.customMetadata?.htmlDigest===artifact.htmlSnapshotOrRenderState.outputDigest&&object.customMetadata?.publicationDigest===artifact.publicationIR.digest&&object.customMetadata?.derivativeVersion===version&&(!outputDigest||object.customMetadata?.outputDigest===outputDigest);},
  // Same immutable artifact/private bucket owner; no new report table or identity.
  // Conditional R2 put makes concurrent derivatives converge on the first bytes.
  async pdfDerivative({artifact,version,authorize,render,allowCreate=false,prepareIssuance}){
   await verify(artifact);if(!/^[A-Z0-9-]{1,100}$/.test(version)||typeof authorize!=='function')throw Error('PDF_DERIVATIVE_SERVER_DEPENDENCIES_REQUIRED');
   await authorize();const objectKey='customer-artifacts/'+binding.reportId+'/'+artifact.artifactDigest+'/'+version+'.pdf',hash=async b=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),v=>v.toString(16).padStart(2,'0')).join('');
   const load=async()=>{
    const object=await env.PRIVATE_REPORTS.get(objectKey);if(!object)return null;if(object.size>128*1024*1024)throw Error('PDF_DERIVATIVE_SIZE_INVALID');
    const meta=object.customMetadata,bytes=new Uint8Array(await object.arrayBuffer());
    if(meta?.artifactDigest!==artifact.artifactDigest||meta?.htmlDigest!==artifact.htmlSnapshotOrRenderState.outputDigest||meta?.publicationDigest!==artifact.publicationIR.digest||meta?.derivativeVersion!==version||bytes.length>128*1024*1024||bytes.length<1000||new TextDecoder().decode(bytes.subarray(0,5))!=='%PDF-'||await hash(bytes)!==meta?.outputDigest)throw Error('PDF_DERIVATIVE_INTEGRITY_FAILED');
    let optimizationReceipt;
    if(meta.optimizationProfile){const proof=await env.PRIVATE_REPORTS.get(meta.optimizationReceiptKey);if(!proof)throw Error('PDF_OPTIMIZATION_RECEIPT_MISSING');const text=await proof.text();optimizationReceipt=JSON.parse(text);if(await hash(new TextEncoder().encode(text))!==meta.optimizationReceiptDigest||optimizationReceipt.outputSHA256!==meta.outputDigest||optimizationReceipt.profile!==meta.optimizationProfile||optimizationReceipt.inputSHA256!==meta.optimizationSourceSHA256)throw Error('PDF_OPTIMIZATION_RECEIPT_INVALID');}
    let rendition={};
    if(meta.renditionReceiptDigest){const object=await env.PRIVATE_REPORTS.get(meta.renditionReceiptKey);if(!object)throw Error('PDF_RENDITION_RECEIPT_MISSING');const text=await object.text();if(await hash(new TextEncoder().encode(text))!==meta.renditionReceiptDigest)throw Error('PDF_RENDITION_RECEIPT_INVALID');const {verifyStoredPdfRenditionR1}=await import('./report-pdf-issuance-port-r1.js');rendition=await verifyStoredPdfRenditionR1({proof:JSON.parse(text),optimizationReceipt,artifact,binding,version,bytes});}
    else if(['BZR-PRIVATE-PDF-OPT-R1','ZWR-R13-PRIVATE-PDF-OPT-R1'].includes(version))throw Error('PDF_RENDITION_RECEIPT_REQUIRED');
    return {bytes,outputDigest:meta.outputDigest,...(optimizationReceipt?{optimizationReceipt}:{}),...rendition};
   };
   const cached=await load();if(cached){await authorize();return {...cached,cacheHit:true,providerCalls:0};}
   if(!allowCreate)throw Object.assign(Error('PRIVATE_PDF_NOT_ISSUED'),{code:'PRIVATE_PDF_NOT_ISSUED',status:409});
   if(typeof render!=='function')throw Error('PDF_DERIVATIVE_RENDERER_REQUIRED');
   // Only a miss may require an invocation-held Job. Historical reads above do not.
   const port=typeof prepareIssuance==='function'?await prepareIssuance():null;
   if(['BZR','ZWR'].includes(artifact.methodCode)&&!port)throw Error('REPORT_PDF_VERSIONED_ISSUANCE_REQUIRED');
   const api=port?await import('./report-pdf-issuance-port-r1.js'):null;
   const beforeWrite=async()=>{await authorize();if(port)await api.assertReportPdfIssuanceR1(port,{binding,artifact,version});};
   await beforeWrite();const raw=await render();
   const finalized=port?await api.finalizeReportPdfIssuanceR1(port,{binding,artifact,version,bytes:raw,finalizer:env.REPORT_PDF_FINALIZER}):await finalizeNewReportPdf({bytes:raw,binding:{methodCode:artifact.methodCode,reportId:binding.reportId,jobId:binding.jobId,subjectId:artifact.personId,purchaseId:binding.purchaseId||binding.orderId,publicationDigest:artifact.publicationIR.digest||artifact.artifactDigest,publicationVersion:artifact.reportContentVersion,artifactDigest:artifact.artifactDigest},finalizer:env.REPORT_PDF_FINALIZER});
   const bytes=finalized.bytes;if(!(bytes instanceof Uint8Array)||bytes.length<1000||bytes.length>128*1024*1024||new TextDecoder().decode(bytes.subarray(0,5))!=='%PDF-')throw Error('PDF_DERIVATIVE_BYTES_INVALID');
   const outputDigest=await hash(bytes),optimizationText=JSON.stringify(finalized.receipt),optimizationReceiptDigest=await hash(new TextEncoder().encode(optimizationText)),optimizationReceiptKey=objectKey+'.'+outputDigest+'.optimization.json';
   const immutableText=async(key,text,expected,code)=>{await beforeWrite();await env.PRIVATE_REPORTS.put(key,text,{onlyIf:new Headers({'If-None-Match':'*'}),httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});const proof=await env.PRIVATE_REPORTS.get(key);if(!proof||await hash(new TextEncoder().encode(await proof.text()))!==expected)throw Error(code);};
   await immutableText(optimizationReceiptKey,optimizationText,optimizationReceiptDigest,'PDF_OPTIMIZATION_RECEIPT_CONFLICT');
   let renditionMeta={};
   if(finalized.issuanceProof){const text=JSON.stringify(finalized.issuanceProof),renditionReceiptDigest=await hash(new TextEncoder().encode(text)),renditionReceiptKey=objectKey+'.'+outputDigest+'.rendition.json';await immutableText(renditionReceiptKey,text,renditionReceiptDigest,'PDF_RENDITION_RECEIPT_CONFLICT');renditionMeta={renditionReceiptDigest,renditionReceiptKey};}
   await beforeWrite();const written=await env.PRIVATE_REPORTS.put(objectKey,bytes,{sha256:Uint8Array.from(outputDigest.match(/../g),x=>parseInt(x,16)).buffer,onlyIf:new Headers({'If-None-Match':'*'}),httpMetadata:{contentType:'application/pdf',cacheControl:'private, no-store'},customMetadata:{artifactDigest:artifact.artifactDigest,htmlDigest:artifact.htmlSnapshotOrRenderState.outputDigest,publicationDigest:artifact.publicationIR.digest,derivativeVersion:version,outputDigest,optimizationProfile:finalized.receipt.profile,optimizationSourceSHA256:finalized.receipt.inputSHA256,optimizationReceiptDigest,optimizationReceiptKey,...renditionMeta}});
   if(written&&(written.size!==bytes.length||written.customMetadata?.outputDigest!==outputDigest))throw Error('PDF_DERIVATIVE_STORAGE_ACK_INVALID');
   const stored=await load();if(!stored)throw Error('PDF_DERIVATIVE_STORAGE_FAILED');
   if(finalized.issuanceProof&&stored.renditionReceipt?.sourceReceiptDigest!==finalized.issuanceProof.receipt.sourceReceiptDigest)throw Error('PDF_RENDITION_CONCURRENT_SOURCE_CONFLICT');
   await beforeWrite();return {...stored,cacheHit:false,providerCalls:0};
  }
 });
}
