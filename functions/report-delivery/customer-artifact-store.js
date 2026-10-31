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
  async pdfDerivative({artifact,version,authorize,render,allowCreate=false}){
   await verify(artifact);if(!/^[A-Z0-9-]{1,100}$/.test(version)||typeof authorize!=='function')throw Error('PDF_DERIVATIVE_SERVER_DEPENDENCIES_REQUIRED');
   await authorize();const objectKey='customer-artifacts/'+binding.reportId+'/'+artifact.artifactDigest+'/'+version+'.pdf',hash=async b=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),v=>v.toString(16).padStart(2,'0')).join('');
   const load=async()=>{const object=await env.PRIVATE_REPORTS.get(objectKey);if(!object)return null;if(object.size>128*1024*1024)throw Error('PDF_DERIVATIVE_SIZE_INVALID');const meta=object.customMetadata,bytes=new Uint8Array(await object.arrayBuffer());if(meta?.artifactDigest!==artifact.artifactDigest||meta?.htmlDigest!==artifact.htmlSnapshotOrRenderState.outputDigest||meta?.publicationDigest!==artifact.publicationIR.digest||meta?.derivativeVersion!==version||bytes.length>128*1024*1024||bytes.length<1000||new TextDecoder().decode(bytes.subarray(0,5))!=='%PDF-'||await hash(bytes)!==meta?.outputDigest)throw Error('PDF_DERIVATIVE_INTEGRITY_FAILED');return {bytes,outputDigest:meta.outputDigest};};
   const cached=await load();if(cached){await authorize();return {...cached,cacheHit:true,providerCalls:0};}
   if(!allowCreate)throw Object.assign(Error('PRIVATE_PDF_NOT_ISSUED'),{code:'PRIVATE_PDF_NOT_ISSUED',status:409});if(typeof render!=='function')throw Error('PDF_DERIVATIVE_RENDERER_REQUIRED');const bytes=await render();if(!(bytes instanceof Uint8Array)||bytes.length<1000||bytes.length>128*1024*1024||new TextDecoder().decode(bytes.subarray(0,5))!=='%PDF-')throw Error('PDF_DERIVATIVE_BYTES_INVALID');const outputDigest=await hash(bytes);await authorize();
   const written=await env.PRIVATE_REPORTS.put(objectKey,bytes,{sha256:Uint8Array.from(outputDigest.match(/../g),x=>parseInt(x,16)).buffer,onlyIf:new Headers({'If-None-Match':'*'}),httpMetadata:{contentType:'application/pdf',cacheControl:'private, no-store'},customMetadata:{artifactDigest:artifact.artifactDigest,htmlDigest:artifact.htmlSnapshotOrRenderState.outputDigest,publicationDigest:artifact.publicationIR.digest,derivativeVersion:version,outputDigest}});
   if(written){if(written.size!==bytes.length||written.customMetadata?.outputDigest!==outputDigest)throw Error('PDF_DERIVATIVE_STORAGE_ACK_INVALID');await authorize();return {bytes,outputDigest,cacheHit:false,providerCalls:0};}
   const stored=await load();if(!stored)throw Error('PDF_DERIVATIVE_STORAGE_FAILED');await authorize();return {...stored,cacheHit:false,providerCalls:0};
  }
 });
}
