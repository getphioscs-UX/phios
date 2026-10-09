import {createReportGenerationStore} from '../personal-reading/report-generation-store.js';
import {verifyCustomerReportArtifact} from './customer-report-artifact.js';
export async function persistCustomerArtifactInHeldStore(env,binding,state,artifact){
 await verifyCustomerReportArtifact(artifact,{customerId:binding.ownerAccountId,reportArtifactId:binding.reportId});
 const prior=await state.get('customer-artifact');
 if(prior){if(prior.artifactDigest!==artifact.artifactDigest)throw Error('IMMUTABLE_CUSTOMER_REPORT_REPLACEMENT_FORBIDDEN');const object=await env.PRIVATE_REPORTS.get(prior.objectKey);if(!object)throw Error('ARTIFACT_OBJECT_MISSING_REPAIR_REQUIRED');await verifyCustomerReportArtifact(JSON.parse(await object.text()),{customerId:binding.ownerAccountId,reportArtifactId:binding.reportId});return prior;}
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
  async open(){return state.withLock('customer-artifact',async()=>{const ref=await state.get('customer-artifact');if(!ref)throw Error('CUSTOMER_ARTIFACT_NOT_GENERATED');return {artifact:await read(ref),providerCalls:0};});}
 });
}
