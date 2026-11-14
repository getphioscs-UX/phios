import {assertPaidReportWorkerFence} from './paid-report-worker-fence.js';
import {paidReportStateStore} from './paid-report-state-store.js';
import {evaluateZiweiNativePaidInputs} from './paid-report-ziwei-adapter.js';
import {assertZiweiReferenceJobAuthority} from './ziwei-reference-authority-compatibility.js';
import {buildZwrVfrCompactAuthoringPack} from '../personal-reading/visual-first/ziwei-vfr-authoring-pack.js';
import {verifyCustomerReportArtifact} from './customer-report-artifact.js';
import {createCustomerDeliverySnapshot} from '../personal-reading/narrative/report-section-snapshot.js';
import {resolveZiweiLiveTargetContext} from '../zi-wei-full-production/ziwei-live-target-context-runtime.js';
import {sha256Stable,deepFreeze} from '../interpretation-runtime/mir7-utils.js';
import {commerceEnvironment} from '../commerce/commerce-environment.js';

export const ZWR_ISSUANCE_SOURCE_MAPPING_VERSION='ZWR-JOB-ARTIFACT-SOURCE-MAPPING-1';
const witnesses=new WeakMap();
const fail=code=>{throw Object.assign(Error(code),{code,status:409});};
const equal=async(a,b)=>await sha256Stable(a)===await sha256Stable(b);
const hash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);

// A source identity bridge, NOT publication/commerce admission. No input/output
// digest is rewritten and no proof supplied by Account request JSON is trusted.
async function inspect(context,{legacyBinding:b,candidate:candidate,artifact,verification,sourceReceipt,mode}){
 const env=context.env,f=await assertPaidReportWorkerFence(env);
 if(!f||!b||f.ownerAccountId!==b.ownerAccountId)fail('ZWR_MAPPING_ACTIVE_JOB_REQUIRED');
 const job=await paidReportStateStore(env,f.clock).job(f.jobId,f.ownerAccountId);
 if(!job||job.claimedBy!==f.claimToken||job.leaseExpiresAt<=f.clock()||['DELIVERED','REFUNDED'].includes(job.state))fail('ZWR_MAPPING_JOB_LEASE_MISMATCH');
 if(job.methodCode!=='ZWR'||job.productId!=='COM-REPORT-ZIWEI-FULL'||job.environment!==commerceEnvironment(env))fail('ZWR_MAPPING_METHOD_MISMATCH');
 for(const key of ['environment','ownerAccountId','orderId','purchaseId','productId','reportId'])if(!b[key]||b[key]!==job[key])fail('ZWR_MAPPING_JOB_IDENTITY_MISMATCH');
 if(b.jobId!==undefined&&b.jobId!==job.jobId)fail('ZWR_MAPPING_JOB_IDENTITY_MISMATCH');
 const candidateContent=candidate?.snapshot?.semanticContent;
 if(!candidateContent||candidate.customerId!==job.ownerAccountId||candidate.personId!==job.personId||candidate.personVersion!==job.personVersion||candidate.purchaseId!==job.purchaseId||candidate.snapshot.methodId!=='ZWR'||candidate.productionAdmissionGranted!==false)fail('ZWR_MAPPING_CANDIDATE_IDENTITY_MISMATCH');
 if(job.presentation?.reportLocale!=='bilingual'&&candidate.locale!==job.presentation?.reportLocale||!['en','zh-Hans'].includes(candidate.locale))fail('ZWR_MAPPING_LOCALE_MISMATCH');
 const reference=mode==='LOCAL_FROZEN_REFERENCE';
 if(reference){
  if(env.PHIOS_ENVIRONMENT!=='local'||env.REPORT_ZERO_COST_REPLAY!=='true'||candidate.schemaVersion!=='ZWR-VFR-R1-ACCEPTED-RENDERER-FIXTURE-v1')fail('ZWR_MAPPING_REFERENCE_SCOPE_REQUIRED');
 }else if(mode!=='CURRENT_NATIVE_SOURCE'||candidate.schemaVersion!=='ZWR-VFR-R1-AUTO-DEEP-CANDIDATE-v3')fail('ZWR_MAPPING_MODE_UNSUPPORTED');
 const targetContext=resolveZiweiLiveTargetContext(job.methodInputs?.targetContext);
 if(!job.methodInputs?.targetContext||!candidateContent.evidence?.targetContext)fail('ZWR_MAPPING_OBSERVATION_CONTEXT_REQUIRED');
 const sourceContext=resolveZiweiLiveTargetContext(candidateContent.evidence.targetContext);
 if(!await equal(sourceContext,targetContext))fail('ZWR_MAPPING_OBSERVATION_CONTEXT_MISMATCH');
 // This calls the actual native producer, including canonical Subject/Consent
 // loader. It performs calculation only; no readiness(), Provider or renderer.
 let sources;
 const fresh=await evaluateZiweiNativePaidInputs(context,job,{inspectSources:value=>{sources=value;}});
 if(!sources||fresh.personVersion!==job.personVersion||fresh.inputDigest!==job.inputDigest||fresh.authorityDigest!==job.authorityDigest)fail('ZWR_MAPPING_JOB_SOURCE_MISMATCH');
 const {subject,evidence,pack}=sources;
 const expectedNativeInput=reference?subject.canonicalBirthInput:{...subject.canonicalBirthInput,locale:candidate.locale};
 if(!await equal(expectedNativeInput,candidateContent.vfrInputSnapshot)||candidateContent.subject?.displayName!==subject.person.displayName||!reference&&candidate.canonicalInputDigest!==await sha256Stable(expectedNativeInput))fail('ZWR_MAPPING_PROFILE_SNAPSHOT_MISMATCH');
 if(candidateContent.evidence.subjectId!==job.personId||evidence.subjectId!==job.personId||candidate.snapshot.inputFingerprint!==candidateContent.evidence.inputFingerprint||candidate.snapshot.inputFingerprint!==evidence.inputFingerprint)fail('ZWR_MAPPING_NATIVE_FINGERPRINT_MISMATCH');
 if(!hash(job.inputDigest)||!hash(evidence.inputFingerprint)||!hash(job.authorityDigest)||!hash(candidateContent.vfrCompactAuthoringPackDigest))fail('ZWR_MAPPING_DIGEST_REQUIRED');
 // Recreate immutable snapshot identity; metadata labels alone are not proof.
 if((await createCustomerDeliverySnapshot(candidate.snapshot)).semanticSnapshotId!==candidate.snapshot.semanticSnapshotId)fail('ZWR_MAPPING_SNAPSHOT_INTEGRITY_MISMATCH');
 let compatibility=null;
 if(reference){
  compatibility=await assertZiweiReferenceJobAuthority(context,job,candidate);
  if(compatibility.referenceAuthorityDigest!==candidateContent.vfrCompactAuthoringPackDigest||compatibility.currentAuthorityDigest!==job.authorityDigest||compatibility.currentEvidenceDigest!==await sha256Stable(evidence)||compatibility.referenceEvidenceDigest!==await sha256Stable(candidateContent.evidence))fail('ZWR_MAPPING_REFERENCE_AUTHORITY_MISMATCH');
 }else if(pack.authorityDigest!==candidateContent.vfrCompactAuthoringPackDigest||!await equal(evidence,candidateContent.evidence))fail('ZWR_MAPPING_NATIVE_AUTHORITY_MISMATCH');
 const ir=candidateContent.visualReportIr;
 if(!ir||ir.authorityDigest!==candidateContent.vfrCompactAuthoringPackDigest||ir.sourceResultDigest!==candidateContent.vfrDeepManuscriptDigest||!hash(ir.publicationIrDigest)||!hash(candidateContent.vfrDeepManuscriptDigest))fail('ZWR_MAPPING_PUBLICATION_LINEAGE_MISMATCH');
 const {publicationIrDigest,...irBody}=ir,sourcePack=reference?await buildZwrVfrCompactAuthoringPack({evidence:candidateContent.evidence}):pack;
 if(await sha256Stable(irBody)!==publicationIrDigest||!await equal(ir.subjectBinding,sourcePack.subjectBinding))fail('ZWR_MAPPING_PUBLICATION_INTEGRITY_MISMATCH');
 await verifyCustomerReportArtifact(artifact,{customerId:job.ownerAccountId,reportArtifactId:b.reportId});
 if(artifact.methodCode!=='ZWR'||artifact.productCode!==job.productId||artifact.personId!==job.personId||artifact.personVersion!==undefined&&artifact.personVersion!==job.personVersion||artifact.inputDigest!==candidate.snapshot.inputFingerprint||artifact.authorityPackVersion!==candidateContent.vfrCompactAuthoringPackDigest||artifact.reportContentVersion!==candidateContent.vfrDeepManuscriptDigest||artifact.publicationIR.digest!==ir.publicationIrDigest)fail('ZWR_MAPPING_ARTIFACT_IDENTITY_MISMATCH');
 if(!await equal(artifact.inputSnapshot,candidateContent.vfrInputSnapshot)||!await equal(artifact.calculationSnapshot,candidateContent.evidence)||!await equal(artifact.generatedSections,ir.sections)||!await equal(artifact.generatedCopy,ir.sections)||!await equal(artifact.publicationIR,{...ir,digest:ir.publicationIrDigest}))fail('ZWR_MAPPING_ARTIFACT_CONTENT_MISMATCH');
 const rendererPublicationDigest=reference?verification?.publicationDigest:verification?.publicationIrDigest;
 if(!verification||!hash(verification.outputDigest)||artifact.htmlSnapshotOrRenderState?.outputDigest!==verification.outputDigest||rendererPublicationDigest!==ir.publicationIrDigest||!sourceReceipt||sourceReceipt.sourceHtmlDigest!==verification.outputDigest||sourceReceipt.publicationIRDigest!==ir.publicationIrDigest||sourceReceipt.nativeSnapshotId!==candidate.snapshot.semanticSnapshotId||sourceReceipt.inputFingerprint!==candidate.snapshot.inputFingerprint||!hash(sourceReceipt.outputSHA256)||!sourceReceipt.version||!Number.isSafeInteger(sourceReceipt.bytes)||sourceReceipt.bytes<1000)fail('ZWR_MAPPING_SOURCE_RECEIPT_MISMATCH');
 for(const [key,expected] of Object.entries({ownerAccountId:job.ownerAccountId,subjectId:job.personId,orderId:job.orderId,purchaseId:job.purchaseId,productId:job.productId,entitlementId:artifact.entitlementId}))if(sourceReceipt[key]!==expected)fail('ZWR_MAPPING_SOURCE_RECEIPT_IDENTITY_MISMATCH');
 // Same existing Commerce/Entitlement authorities. A fixture label grants no
 // rights: this read must still find the active, fulfilled purchase.
 const right=await env.RUNTIME_DB.prepare("SELECT e.entitlement_id FROM commerce_purchases p JOIN commerce_checkout_attempts o ON o.checkout_attempt_id=p.checkout_attempt_id JOIN digital_entitlements e ON e.purchase_id=p.purchase_id WHERE p.purchase_id=? AND p.customer_id=? AND p.product_id=? AND p.purchase_state='purchased' AND o.checkout_attempt_id=? AND o.customer_id=p.customer_id AND o.environment=? AND o.order_state='FULFILLED' AND o.review_required=0 AND e.customer_id=p.customer_id AND e.product_id=p.product_id AND e.entitlement_status='active' AND (e.expires_at IS NULL OR e.expires_at>?)").bind(job.purchaseId,job.ownerAccountId,job.productId,job.orderId,job.environment,new Date(f.clock()).toISOString()).first();
 if(!right||right.entitlement_id!==artifact.entitlementId)fail('ZWR_MAPPING_ENTITLEMENT_REQUIRED');
 const finalFence=await assertPaidReportWorkerFence(env),finalJob=await paidReportStateStore(env,f.clock).job(f.jobId,f.ownerAccountId);
 if(!finalFence||finalFence.jobId!==job.jobId||finalFence.ownerAccountId!==job.ownerAccountId||finalFence.claimToken!==f.claimToken||!finalJob||finalJob.claimedBy!==f.claimToken||finalJob.version!==job.version||!await equal(finalJob,job))fail('ZWR_MAPPING_JOB_CHANGED_DURING_VALIDATION');
 return {value:deepFreeze({schemaVersion:ZWR_ISSUANCE_SOURCE_MAPPING_VERSION,scope:reference?'LOCAL_SAME_SUBJECT_FROZEN_REFERENCE_ONLY':'CURRENT_NATIVE_SOURCE_IDENTITY_ONLY',jobId:job.jobId,ownerAccountId:job.ownerAccountId,environment:job.environment,orderId:job.orderId,purchaseId:job.purchaseId,productId:job.productId,reportId:b.reportId,subjectId:job.personId,personVersion:job.personVersion,entitlementId:artifact.entitlementId,jobInputDigest:job.inputDigest,nativeInputFingerprint:evidence.inputFingerprint,currentAuthorityDigest:job.authorityDigest,sourceAuthorityDigest:candidateContent.vfrCompactAuthoringPackDigest,jobTargetContext:structuredClone(job.methodInputs.targetContext),sourceTargetContext:structuredClone(candidateContent.evidence.targetContext),resolvedTargetContext:targetContext,jobTargetContextDigest:await sha256Stable(job.methodInputs.targetContext),sourceTargetContextDigest:await sha256Stable(candidateContent.evidence.targetContext),resolvedTargetContextDigest:await sha256Stable(targetContext),currentEvidenceDigest:await sha256Stable(evidence),sourceEvidenceDigest:await sha256Stable(candidateContent.evidence),currentPackDigest:await sha256Stable(pack),compatibility,methodConsentDigest:await sha256Stable(subject.methodConsent),reportConsentDigest:await sha256Stable(subject.reportConsent),candidateSnapshotId:candidate.snapshot.semanticSnapshotId,candidateDigest:await sha256Stable(candidate),artifactDigest:artifact.artifactDigest,publicationDigest:ir.publicationIrDigest,manuscriptDigest:candidateContent.vfrDeepManuscriptDigest,sourceHtmlDigest:verification.outputDigest,sourcePdfSHA256:sourceReceipt.outputSHA256,sourcePdfVersion:sourceReceipt.version,sourceReceiptDigest:await sha256Stable(sourceReceipt),formalPublicationAccepted:false,commercialAdmission:false,newCustomerAdmission:false}),claimToken:f.claimToken};
}

export async function resolveZiweiIssuanceSourceMappingR1(context,inputs){
 const owned=structuredClone(inputs),result=await inspect(context,owned);
 // Branding stays invocation-local. JSON copies are evidence, never authority.
 witnesses.set(result.value,{context,inputs:owned,claimToken:result.claimToken,digest:await sha256Stable(result.value)});
 return result.value;
}
export async function assertZiweiIssuanceSourceMappingR1(witness){
 const held=witnesses.get(witness);if(!held)fail('ZWR_MAPPING_SERVER_WITNESS_REQUIRED');
 const result=await inspect(held.context,held.inputs);
 if(result.claimToken!==held.claimToken||await sha256Stable(result.value)!==held.digest)fail('ZWR_MAPPING_WITNESS_STALE');
 return witness;
}
