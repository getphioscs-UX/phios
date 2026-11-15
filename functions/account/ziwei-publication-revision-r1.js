import {openAccountZiweiMaterial} from './ziwei-account-delivery.js';
import {personIdentity} from './canonical-person-store.js';
import {requireZiweiEntitlement} from '../report-delivery/ziwei-production-generation-v1.js';
import {commerceEnvironment} from '../commerce/commerce-environment.js';
import {createCustomerReportArtifact,verifyCustomerReportArtifact} from '../report-delivery/customer-report-artifact.js';
import {createReportGenerationStore} from '../personal-reading/report-generation-store.js';
import {paidReportStateStore} from '../report-delivery/paid-report-state-store.js';
import {finalizeNewReportPdf} from '../report-delivery/report-pdf-finalization-r1.js';
import {assertMethodGeneration,assertMethodRenderReceipt} from '../report-delivery/method-render-contract.js';
import {createCustomerDeliverySnapshot} from '../personal-reading/narrative/report-section-snapshot.js';
import {sha256Stable as digest} from '../interpretation-runtime/mir7-utils.js';
const fail=code=>{throw Object.assign(Error(code),{code,status:409});};
const hash=async b=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),v=>v.toString(16).padStart(2,'0')).join('');
const prefix='ZWR_PUBLICATION_REVISION:';
const labels=[['With a旺 Tai Yang','With a prosperous Tai Yang'],['in a陷 state','in a weakened state'],['旺 Tian Liang',' prosperous Tian Liang'],['旺 Tai Yin',' prosperous Tai Yin']];
export const ziweiPublicationRevisionEnabled=c=>c.env.PHIOS_ENVIRONMENT==='local'&&c.env.STRIPE_ENVIRONMENT==='QA'&&c.env.PHIOS_LOCAL_ZWR_CURRENT_NATIVE_QA==='true'&&c.env.PHIOS_LOCAL_ZWR_PUBLICATION_REVISION_QA==='true';
async function source(context,reportId){
 if(!ziweiPublicationRevisionEnabled(context))fail('ZWR_REVISION_LOCAL_REVIEW_ONLY');
 const original=await openAccountZiweiMaterial(context,reportId),candidate=original.candidate,b=candidate.paidReportBinding;
 if(!b||b.ownerAccountId!==personIdentity(context).userId||b.reportId!==reportId||b.productId!=='COM-REPORT-ZIWEI-FULL'||b.purchaseId!==candidate.purchaseId)fail('ZWR_REVISION_ORIGINAL_REQUIRED');
 const right=await requireZiweiEntitlement(context,candidate.locale,{purchaseId:b.purchaseId});
 const order=await context.env.RUNTIME_DB.prepare("SELECT checkout_attempt_id FROM commerce_purchases WHERE purchase_id=? AND customer_id=? AND purchase_state='purchased'").bind(b.purchaseId,b.ownerAccountId).first();
 if(!order||order.checkout_attempt_id!==b.orderId)fail('ZWR_REVISION_ORDER_MISMATCH');
 const binding={...b,environment:commerceEnvironment(context.env)},state=await createReportGenerationStore(context.env,binding,{scope:'delivery'}),ref=await state.inspectState('customer-artifact');
 if(!ref)fail('ZWR_REVISION_ORIGINAL_ARTIFACT_REQUIRED');const object=await context.env.PRIVATE_REPORTS.get(ref.objectKey);if(!object)fail('ZWR_REVISION_ORIGINAL_ARTIFACT_MISSING');const artifact=await verifyCustomerReportArtifact(JSON.parse(await object.text()),{customerId:binding.ownerAccountId,reportArtifactId:reportId});if(artifact.artifactDigest!==ref.artifactDigest)fail('ZWR_REVISION_ORIGINAL_ARTIFACT_MISMATCH');
 if(artifact.entitlementId!==right.entitlement_id||artifact.customerId!==b.ownerAccountId||artifact.personId!==candidate.personId||artifact.reportContentVersion!==candidate.snapshot.semanticContent.vfrDeepManuscriptDigest)fail('ZWR_REVISION_ORIGINAL_ARTIFACT_MISMATCH');
 return {original,candidate,artifact,binding,state};
}
async function checkOnlyAcceptedLabels(old,next){
 await assertMethodGeneration(next);
 const before=old.snapshot.semanticContent,after=next.snapshot.semanticContent,restored=structuredClone(after.visualReportIr),s=restored.sections.find(x=>x.sectionId==='S04');
 if(!s)fail('ZWR_REVISION_SECTION_REQUIRED');
 for(const [a,b]of labels){if(s.en.manuscript.split(b).length!==2)fail('ZWR_REVISION_EXACT_LABEL_DELTA_REQUIRED');s.en.manuscript=s.en.manuscript.replace(b,a);let hits=0;s.en.paragraphs=s.en.paragraphs.map(p=>{if(p.includes(b)){hits++;return p.replace(b,a);}return p;});if(hits!==1)fail('ZWR_REVISION_PARAGRAPH_DELTA_REQUIRED');}
 const {publicationIrDigest,...ir}=after.visualReportIr;
 if(await digest(ir)!==publicationIrDigest||after.vfrDeepManuscriptDigest!==ir.sourceResultDigest||after.vfrDeepManuscriptDigest===before.vfrDeepManuscriptDigest)fail('ZWR_REVISION_PUBLICATION_DIGEST');
 restored.publicationIrDigest=before.visualReportIr.publicationIrDigest;restored.sourceResultDigest=before.visualReportIr.sourceResultDigest;
 if(await digest(restored)!==await digest(before.visualReportIr))fail('ZWR_REVISION_UNACCEPTED_BODY_CHANGE');
 const c=structuredClone(after);c.visualReportIr=before.visualReportIr;c.vfrPublicationFit=before.vfrPublicationFit;c.vfrDeepManuscriptDigest=before.vfrDeepManuscriptDigest;c.vfrLineage.semanticCacheKey=before.vfrLineage.semanticCacheKey;
 if(await digest(c)!==await digest(before))fail('ZWR_REVISION_SOURCE_OR_CHART_CHANGED');
 const expected=await createCustomerDeliverySnapshot({...old.snapshot,semanticContent:after});
 if(await digest(expected)!==await digest(next.snapshot))fail('ZWR_REVISION_SNAPSHOT_MISMATCH');
 const a={...old},b={...next};delete a.snapshot;delete b.snapshot;if(await digest(a)!==await digest(b))fail('ZWR_REVISION_IDENTITY_CHANGED');
}
async function immutable(context,key,b){const expected=await hash(b);if(!await context.env.PRIVATE_REPORTS.get(key))await context.env.PRIVATE_REPORTS.put(key,b,{onlyIf:new Headers({'If-None-Match':'*'}),httpMetadata:{cacheControl:'private, no-store'}});const stored=await context.env.PRIVATE_REPORTS.get(key);if(!stored||await hash(await stored.arrayBuffer())!==expected)fail('ZWR_REVISION_IMMUTABLE_OBJECT_CONFLICT');return {objectKey:key,sha256:expected,bytes:b.length};}
async function read(context,ref){const o=await context.env.PRIVATE_REPORTS.get(ref.objectKey);if(!o)fail('ZWR_REVISION_FILE_MISSING');const b=new Uint8Array(await o.arrayBuffer());if(b.length!==ref.bytes||await hash(b)!==ref.sha256)fail('ZWR_REVISION_FILE_INTEGRITY');return b;}
// Server-only local review registration. Same original order, SQL namespace and
// private bucket; no new Job/order/entitlement, model call or issuance bypass.
export async function registerZiweiPublicationRevision(context,{reportId,jobId,candidate,html,pdfBytes,verification}){
 const {candidate:old,artifact:prior,binding,state}=await source(context,reportId),job=await paidReportStateStore(context.env).job(jobId,binding.ownerAccountId);
 if(!job||job.state!=='DELIVERED'||job.reportId!==reportId||job.methodCode!=='ZWR'||job.personId!==old.personId||job.personVersion!==old.personVersion||job.authorityDigest!==binding.authorityDigest||['ownerAccountId','orderId','purchaseId','productId'].some(k=>job[k]!==binding[k]))fail('ZWR_REVISION_DELIVERED_JOB_REQUIRED');
 await checkOnlyAcceptedLabels(old,candidate);assertMethodRenderReceipt(candidate,verification);
 const d=verification.pdfDerivative,c=candidate.snapshot.semanticContent;
 if(verification.outputDigest!==await hash(new TextEncoder().encode(html))||!d||d.bytes!==pdfBytes?.length||d.outputDigest!==await hash(pdfBytes)||d.semanticSnapshotId!==candidate.snapshot.semanticSnapshotId||d.publicationDigest!==c.visualReportIr.publicationIrDigest||d.sourceHtmlDigest!==verification.outputDigest||d.pages!==65||verification.pageCount!==65)fail('ZWR_REVISION_VERIFIED_PDF_REQUIRED');
 const revisionId=await digest({version:'ZWR-S04-EN-LABEL-REVISION-1',predecessorArtifactDigest:prior.artifactDigest,snapshotId:candidate.snapshot.semanticSnapshotId,publicationDigest:c.visualReportIr.publicationIrDigest}),key=prefix+revisionId;
 return state.withLock(key,async()=>{
  const indexKey='ZWR_PUBLICATION_REVISION_INDEX',ids=await state.get(indexKey)||[],index=async()=>{if(!ids.includes(revisionId))await state.put(indexKey,[...ids,revisionId]);};
  const existing=await state.get(key);if(existing){await openZiweiPublicationRevision(context,reportId,revisionId);if(existing.verification.outputDigest!==verification.outputDigest||existing.raw.sha256!==await hash(pdfBytes))fail('ZWR_REVISION_ID_CONTENT_CONFLICT');await index();return {revisionId,cacheHit:true,providerCalls:0,rendererCalls:0};}
  const base=`customer-artifacts/${reportId}/publication-revisions/${revisionId}`,artifact=await createCustomerReportArtifact({...prior,reportContentVersion:c.vfrDeepManuscriptDigest,generatedSections:c.visualReportIr.sections,publicationIR:{...c.visualReportIr,digest:c.visualReportIr.publicationIrDigest},htmlSnapshotOrRenderState:{objectKey:`released-method/${reportId}/revisions/${revisionId}.html`,outputDigest:verification.outputDigest},publicationRevision:{revisionId,predecessorArtifactDigest:prior.artifactDigest,scope:'LOCAL_QA_NOT_CUSTOMER_ACCEPTED'}});
  const htmlRef=await immutable(context,artifact.htmlSnapshotOrRenderState.objectKey,new TextEncoder().encode(html)),raw=await immutable(context,base+'/source.pdf',pdfBytes),stageKey=key+':OPTIMIZED';let stage=await state.get(stageKey);
  if(!stage){const finalized=await finalizeNewReportPdf({bytes:pdfBytes,binding:{...binding,methodCode:'ZWR',jobId,subjectId:artifact.personId,publicationDigest:c.visualReportIr.publicationIrDigest,publicationVersion:artifact.reportContentVersion,artifactDigest:artifact.artifactDigest},finalizer:context.env.REPORT_PDF_FINALIZER});stage={optimized:await immutable(context,base+'/optimized.pdf',finalized.bytes),optimizationReceipt:finalized.receipt};await state.putIfAbsent(stageKey,stage);}else await read(context,stage.optimized);
  const artifactRef=await immutable(context,base+'/artifact.json',new TextEncoder().encode(JSON.stringify(artifact))),candidateRef=await immutable(context,base+'/candidate.json',new TextEncoder().encode(JSON.stringify(candidate)));
  const record={schemaVersion:'ZWR_LOCAL_PUBLICATION_REVISION_1',revisionId,reportId,jobId,binding,personId:old.personId,predecessorArtifactDigest:prior.artifactDigest,artifactRef,candidateRef,htmlRef,raw,optimized:stage.optimized,optimizationReceipt:stage.optimizationReceipt,verification,scope:'LOCAL_QA_NOT_CUSTOMER_ACCEPTED'};
  await source(context,reportId);await state.putIfAbsent(key,{...record,recordDigest:await digest(record)});await index();return {revisionId,cacheHit:false,providerCalls:0,rendererCalls:0};
 });
}
export async function openZiweiPublicationRevision(context,reportId,revisionId){
 if(!/^[a-f0-9]{64}$/.test(revisionId))fail('ZWR_REVISION_ID_REQUIRED');const {candidate:old,artifact:prior,binding,state}=await source(context,reportId),r=await state.inspectState(prefix+revisionId);if(!r)fail('ZWR_REVISION_NOT_FOUND');
 const {recordDigest,...record}=r;if(await digest(record)!==recordDigest||r.reportId!==reportId||r.revisionId!==revisionId||await digest(r.binding)!==await digest(binding)||r.predecessorArtifactDigest!==prior.artifactDigest||r.personId!==old.personId)fail('ZWR_REVISION_IDENTITY_MISMATCH');
 const artifact=await verifyCustomerReportArtifact(JSON.parse(new TextDecoder().decode(await read(context,r.artifactRef))),{customerId:binding.ownerAccountId,reportArtifactId:reportId}),candidate=JSON.parse(new TextDecoder().decode(await read(context,r.candidateRef)));await checkOnlyAcceptedLabels(old,candidate);
 const expected=await digest({version:'ZWR-S04-EN-LABEL-REVISION-1',predecessorArtifactDigest:prior.artifactDigest,snapshotId:candidate.snapshot.semanticSnapshotId,publicationDigest:candidate.snapshot.semanticContent.visualReportIr.publicationIrDigest});
 if(expected!==revisionId||artifact.publicationIR.digest!==candidate.snapshot.semanticContent.visualReportIr.publicationIrDigest||artifact.publicationRevision?.predecessorArtifactDigest!==prior.artifactDigest||artifact.htmlSnapshotOrRenderState.outputDigest!==r.verification.outputDigest)fail('ZWR_REVISION_ARTIFACT_MISMATCH');
 const html=new TextDecoder().decode(await read(context,r.htmlRef));if(await hash(new TextEncoder().encode(html))!==r.verification.outputDigest)fail('ZWR_REVISION_HTML_MISMATCH');return {record:r,artifact,candidate,html};
}
export async function downloadZiweiPublicationRevision(context,reportId,revisionId,rendition='optimized'){
 if(!['source','optimized'].includes(rendition))fail('ZWR_REVISION_RENDITION_REQUIRED');const {record:r}=await openZiweiPublicationRevision(context,reportId,revisionId),b=await read(context,rendition==='source'?r.raw:r.optimized);
 return new Response(b,{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="PHI-OS-Zi-Wei-${reportId}-${revisionId.slice(0,12)}-${rendition}.pdf"`,'Cache-Control':'private, no-store','X-PHIOS-Output-Digest':await hash(b),'X-PHIOS-Publication-Revision':revisionId}});
}
export async function listZiweiPublicationRevisions(context,reportId){const {state}=await source(context,reportId),out=[];for(const id of await state.inspectState('ZWR_PUBLICATION_REVISION_INDEX')||[]){const m=await openZiweiPublicationRevision(context,reportId,id);out.push({revisionId:id,predecessorArtifactDigest:m.record.predecessorArtifactDigest,scope:m.record.scope,sourceSHA256:m.record.raw.sha256,optimizedSHA256:m.record.optimized.sha256});}return out;}
