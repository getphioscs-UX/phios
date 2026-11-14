import {openAccountBaziMaterial} from './bazi-account-delivery.js';
import {personIdentity} from './canonical-person-store.js';
import {createReportGenerationStore} from '../personal-reading/report-generation-store.js';
import {paidReportStateStore} from '../report-delivery/paid-report-state-store.js';
import {createCustomerReportArtifact,verifyCustomerReportArtifact} from '../report-delivery/customer-report-artifact.js';
import {finalizeNewReportPdf} from '../report-delivery/report-pdf-finalization-r1.js';
import {digest} from '../personal-reading/deep-manuscript/bazi-deep-manuscript-contract.js';
const fail=code=>{throw Object.assign(Error(code),{code,status:409});};
const hash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
const prefix='BZR_PUBLICATION_REVISION:';
export const baziPublicationRevisionEnabled=c=>c.env.PHIOS_ENVIRONMENT==='local'&&c.env.STRIPE_ENVIRONMENT==='QA'&&c.env.PHIOS_LOCAL_BZR_PUBLICATION_REVISION_QA==='true';
const gate=c=>{if(!baziPublicationRevisionEnabled(c))fail('BZR_REVISION_LOCAL_REVIEW_ONLY');};
async function source(context,reportId){
 gate(context);const original=await openAccountBaziMaterial(context,reportId),binding=original.candidate.paidReportBinding;
 if(!binding||binding.ownerAccountId!==personIdentity(context).userId||binding.reportId!==reportId||!original.artifact)fail('BZR_REVISION_ORIGINAL_REQUIRED');
 const state=await createReportGenerationStore(context.env,binding,{scope:'delivery'});
 return {original,binding,state};
}
async function immutable(context,key,bytes){
 const expected=await hash(bytes),prior=await context.env.PRIVATE_REPORTS.get(key);
 if(!prior)await context.env.PRIVATE_REPORTS.put(key,bytes,{onlyIf:new Headers({'If-None-Match':'*'}),httpMetadata:{cacheControl:'private, no-store'}});
 const stored=await context.env.PRIVATE_REPORTS.get(key);if(!stored||await hash(await stored.arrayBuffer())!==expected)fail('BZR_REVISION_IMMUTABLE_OBJECT_CONFLICT');
 return {objectKey:key,sha256:expected,bytes:bytes.length};
}
async function bytes(context,ref){
 const o=await context.env.PRIVATE_REPORTS.get(ref.objectKey);if(!o)fail('BZR_REVISION_FILE_MISSING');const b=new Uint8Array(await o.arrayBuffer());
 if(b.length!==ref.bytes||await hash(b)!==ref.sha256)fail('BZR_REVISION_FILE_INTEGRITY');return b;
}
// Local Owner registration only. No browser POST, new purchase/job, Provider or
// renderer. Reuses the original SQL namespace, lock, private objects and codec.
// This does NOT weaken the existing formal Job-fenced issuance port.
export async function registerBaziPublicationRevision(context,{reportId,jobId,publication,html,pdfBytes,verification}){
 const {original,binding,state}=await source(context,reportId),job=await paidReportStateStore(context.env).job(jobId,binding.ownerAccountId);
 if(!job||job.state!=='DELIVERED'||job.methodCode!=='BZR'||['ownerAccountId','orderId','purchaseId','productId'].some(k=>job[k]!==binding[k])||job.personId!==original.artifact.personId||job.personVersion!==original.artifact.personVersion||job.inputDigest!==original.artifact.inputDigest||job.authorityDigest!==binding.authorityDigest)fail('BZR_REVISION_JOB_BINDING');
 const {digest:revisionId,...body}=publication;
 if(!/^[a-f0-9]{64}$/.test(revisionId)||await digest(body)!==revisionId||await digest(publication.manuscript)!==await digest(original.artifact.publicationIR.manuscript)||await digest(publication.authority)!==await digest(original.artifact.publicationIR.authority))fail('BZR_REVISION_SOURCE_CHANGED');
 if(verification?.passed!==true||verification.publicationDigest!==revisionId||verification.outputDigest!==await hash(new TextEncoder().encode(html))||verification.pdfDerivative?.pages!==48||verification.pdfDerivative.bytes!==pdfBytes?.length||verification.pdfDerivative.outputDigest!==await hash(pdfBytes))fail('BZR_REVISION_VERIFIED_PDF_REQUIRED');
 const restored=structuredClone(publication),baseline=structuredClone(original.artifact.publicationIR);delete restored.digest;delete baseline.digest;
 for(const id of ['D02','D04']){const i=restored.technical.diagrams.findIndex(x=>x.id===id);restored.technical.diagrams[i]=baseline.technical.diagrams.find(x=>x.id===id);}
 if(await digest(restored)!==await digest(baseline))fail('BZR_REVISION_ONLY_ACCEPTED_DIAGRAM_DELTA_ALLOWED');
 const key=prefix+revisionId;
 return state.withLock(key,async()=>{
  const indexKey='BZR_PUBLICATION_REVISION_INDEX';const index=await state.get(indexKey)||[];const indexRevision=async()=>{if(!index.includes(revisionId))await state.put(indexKey,[...index,revisionId]);};const prior=await state.get(key);if(prior){await openBaziPublicationRevision(context,reportId,revisionId);if(prior.verification.outputDigest!==verification.outputDigest||prior.raw.sha256!==await hash(pdfBytes)||prior.raw.bytes!==pdfBytes.length)fail('BZR_REVISION_ID_CONTENT_CONFLICT');await indexRevision();return {revisionId,cacheHit:true,providerCalls:0,rendererCalls:0};}
  const artifact=await createCustomerReportArtifact({...original.artifact,publicationIR:publication,htmlSnapshotOrRenderState:{objectKey:`released-method/${reportId}/revisions/${revisionId}.html`,outputDigest:verification.outputDigest},publicationRevision:{revisionId,predecessorArtifactDigest:original.artifact.artifactDigest,scope:'LOCAL_QA_NOT_CUSTOMER_ACCEPTED'}});
  const base=`customer-artifacts/${reportId}/publication-revisions/${revisionId}`;
  const htmlRef=await immutable(context,artifact.htmlSnapshotOrRenderState.objectKey,new TextEncoder().encode(html));
  const raw=await immutable(context,base+'/source.pdf',pdfBytes);
  const stageKey=key+':OPTIMIZED';let stage=await state.get(stageKey);
  if(!stage){
   const finalized=await finalizeNewReportPdf({bytes:pdfBytes,binding:{...binding,methodCode:'BZR',jobId,subjectId:artifact.personId,publicationDigest:revisionId,publicationVersion:artifact.reportContentVersion,artifactDigest:artifact.artifactDigest},finalizer:context.env.REPORT_PDF_FINALIZER});
   const optimized=await immutable(context,base+'/optimized.pdf',finalized.bytes);
   stage={optimized,optimizationReceipt:finalized.receipt};await state.putIfAbsent(stageKey,stage);
  }else await bytes(context,stage.optimized);
  const artifactRef=await immutable(context,base+'/artifact.json',new TextEncoder().encode(JSON.stringify(artifact)));
  const record={schemaVersion:'BZR_LOCAL_PUBLICATION_REVISION_1',revisionId,reportId,jobId,binding,personId:artifact.personId,personVersion:artifact.personVersion,inputDigest:artifact.inputDigest,predecessorArtifactDigest:original.artifact.artifactDigest,artifactRef,htmlRef,raw,optimized:stage.optimized,optimizationReceipt:stage.optimizationReceipt,verification,scope:'LOCAL_QA_NOT_CUSTOMER_ACCEPTED'};
  await source(context,reportId);await state.putIfAbsent(key,{...record,recordDigest:await digest(record)});await indexRevision();
  return {revisionId,cacheHit:false,providerCalls:0,rendererCalls:0};
 });
}
export async function openBaziPublicationRevision(context,reportId,revisionId){
 if(!/^[a-f0-9]{64}$/.test(revisionId))fail('BZR_REVISION_ID_REQUIRED');const {original,binding,state}=await source(context,reportId),r=await state.inspectState(prefix+revisionId);if(!r)fail('BZR_REVISION_NOT_FOUND');
 const {recordDigest,...record}=r;if(await digest(record)!==recordDigest||r.reportId!==reportId||r.revisionId!==revisionId||await digest(r.binding)!==await digest(binding)||r.personId!==original.artifact.personId||r.inputDigest!==original.artifact.inputDigest||r.predecessorArtifactDigest!==original.artifact.artifactDigest)fail('BZR_REVISION_IDENTITY_MISMATCH');
 const artifact=await verifyCustomerReportArtifact(JSON.parse(new TextDecoder().decode(await bytes(context,r.artifactRef))),{customerId:binding.ownerAccountId,reportArtifactId:reportId});
 if(artifact.publicationIR.digest!==revisionId||artifact.personId!==r.personId||artifact.htmlSnapshotOrRenderState.outputDigest!==r.verification.outputDigest||artifact.publicationRevision.predecessorArtifactDigest!==r.predecessorArtifactDigest)fail('BZR_REVISION_ARTIFACT_MISMATCH');
 const html=new TextDecoder().decode(await bytes(context,r.htmlRef));if(await hash(new TextEncoder().encode(html))!==r.verification.outputDigest)fail('BZR_REVISION_HTML_MISMATCH');return {record:r,artifact,html};
}
export async function downloadBaziPublicationRevision(context,reportId,revisionId,rendition='optimized'){
 if(!['source','optimized'].includes(rendition))fail('BZR_REVISION_RENDITION_REQUIRED');const {record:r}=await openBaziPublicationRevision(context,reportId,revisionId),b=await bytes(context,rendition==='source'?r.raw:r.optimized);
 return new Response(b,{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="PHI-OS-BaZi-${reportId}-${revisionId.slice(0,12)}-${rendition}.pdf"`,'Cache-Control':'private, no-store','X-PHIOS-Output-Digest':await hash(b),'X-PHIOS-Publication-Revision':revisionId}});
}
export async function listBaziPublicationRevisions(context,reportId){
 const {state}=await source(context,reportId),ids=await state.inspectState('BZR_PUBLICATION_REVISION_INDEX')||[],out=[];
 for(const id of ids){const m=await openBaziPublicationRevision(context,reportId,id);out.push({revisionId:id,predecessorArtifactDigest:m.record.predecessorArtifactDigest,scope:m.record.scope,sourceSHA256:m.record.raw.sha256,optimizedSHA256:m.record.optimized.sha256});}return out;
}
