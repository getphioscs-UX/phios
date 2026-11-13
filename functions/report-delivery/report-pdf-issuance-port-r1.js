import {finalizeNewReportPdf} from './report-pdf-finalization-r1.js';
import {resolveZiweiIssuanceSourceMappingR1,assertZiweiIssuanceSourceMappingR1} from './ziwei-issuance-source-mapping-r1.js';
import {assertPaidReportWorkerFence} from './paid-report-worker-fence.js';
import {paidReportStateStore} from './paid-report-state-store.js';
import {verifyCustomerReportArtifact} from './customer-report-artifact.js';
import {loadCanonicalPersonSubject} from '../account/canonical-person-store.js';
import {executeAndProjectMcd5CurrentRequest} from '../method-client-delivery/canonical-projection-runtime-current.js';
import {reportBirthInputFingerprint} from '../canonical-presentation-runtime/report-cover-subject.js';
import {buildCustomerNativeBaziInputs} from './bazi-customer-native-inputs.js';
import {commerceEnvironment} from '../commerce/commerce-environment.js';
import {sha256Stable,deepFreeze} from '../interpretation-runtime/mir7-utils.js';
import {digest as baziDigest} from '../personal-reading/deep-manuscript/bazi-deep-manuscript-contract.js';

const held=new WeakMap(),fail=code=>{throw Object.assign(Error(code),{code,status:409});};
const same=async(a,b)=>await sha256Stable(a)===await sha256Stable(b);
const validHash=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const byteHash=async b=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),v=>v.toString(16).padStart(2,'0')).join('');
const identityKeys=['environment','ownerAccountId','orderId','purchaseId','productId','reportId'];
export const REPORT_PDF_RENDITION_VERSIONS=Object.freeze({BZR:'BZR-PRIVATE-PDF-OPT-R1',ZWR:'ZWR-R13-PRIVATE-PDF-OPT-R1'});
function baziCalculationFacts(snapshot){
 const x=structuredClone(snapshot),at=x?.execution?.executedAt;
 if(typeof at!=='string'||!Number.isFinite(Date.parse(at))||new Date(at).toISOString()!==at)fail('BZR_ISSUANCE_EXECUTION_TIME_REQUIRED');
 // The native projection producer stamps this field on every invocation. It
 // is not an observation-time authority or chart fact. No other key is removed.
 delete x.execution.executedAt;return x;
}

// Explicit BaZi domains: Artifact carries authority schema, Job carries full
// pack.digest, Publication carries pack.authorityDigest. Never alias these.
async function inspectBazi(context,b,artifact,expectedClaim){
 const env=context.env,f=await assertPaidReportWorkerFence(env);
 if(!f||f.ownerAccountId!==b.ownerAccountId||f.claimToken!==expectedClaim)fail('BZR_ISSUANCE_ACTIVE_JOB_REQUIRED');
 const job=await paidReportStateStore(env,f.clock).job(f.jobId,f.ownerAccountId);
 if(!job||job.methodCode!=='BZR'||job.productId!=='COM-REPORT-BAZI-FULL'||job.environment!==commerceEnvironment(env)||job.claimedBy!==f.claimToken||job.leaseExpiresAt<=f.clock()||['DELIVERED','REFUNDED'].includes(job.state))fail('BZR_ISSUANCE_JOB_MISMATCH');
 for(const key of identityKeys.filter(k=>k!=='reportId'))if(!b[key]||b[key]!==job[key])fail('BZR_ISSUANCE_PURCHASE_MISMATCH');
 const nativeReport=await byteHash(new TextEncoder().encode(job.ownerAccountId+'\0'+job.orderId+'\0'+job.purchaseId+'\0BAZI'));
 if(b.reportId!==nativeReport||b.jobId!==undefined&&b.jobId!==job.jobId)fail('BZR_ISSUANCE_REPORT_MISMATCH');
 await verifyCustomerReportArtifact(artifact,{customerId:job.ownerAccountId,reportArtifactId:nativeReport});
 const s=await loadCanonicalPersonSubject(env,job.ownerAccountId,job.personId),fingerprint=await reportBirthInputFingerprint(s.canonicalBirthInput);
 if(s.personVersion!==job.personVersion||artifact.personVersion!==job.personVersion||artifact.personId!==job.personId||artifact.methodCode!=='BZR'||artifact.productCode!==job.productId||artifact.inputDigest!==job.inputDigest||fingerprint!==job.inputDigest||b.authorityDigest!==job.authorityDigest)fail('BZR_ISSUANCE_SUBJECT_MISMATCH');
 const execution=await executeAndProjectMcd5CurrentRequest({schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',methodCode:'BAZI',methodVersion:'0.1.0',capability:'CALCULATION',purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',canonicalInput:s.canonicalBirthInput,executionParameters:{traditionalCalculationSex:s.calculationSex},consentRecordId:s.methodConsent.consentId,requestId:`BAZI-CANDIDATE:${s.person.personId}:v${s.personVersion}`});
 if(execution.canonicalProjection?.calculation?.status!=='COMPLETE')fail('BZR_ISSUANCE_CALCULATION_INCOMPLETE');
 const native=await buildCustomerNativeBaziInputs(context,{customerId:job.ownerAccountId,personId:job.personId,personVersion:job.personVersion,canonicalBirthInputFingerprint:fingerprint,calculationDigest:await sha256Stable(execution.canonicalProjection),execution});
 const ir=artifact.publicationIR;
 const calculationFactsDigest=await baziDigest(baziCalculationFacts(native.calculationSnapshot)),sourceCalculationDigest=await baziDigest(artifact.calculationSnapshot);
 const sourceChecks={fullPack:native.pack.digest===job.authorityDigest,schema:artifact.authorityPackVersion===native.pack.schemaVersion,publicationAuthority:ir.authority?.digest===native.pack.authorityDigest,timing:ir.authority?.timingDigest===native.pack.timingDigest,reality:ir.authority?.realityDigest===native.pack.realityDigest,input:await baziDigest(artifact.inputSnapshot)===await baziDigest(native.inputSnapshot),calculation:await baziDigest(baziCalculationFacts(artifact.calculationSnapshot))===calculationFactsDigest,manuscript:await baziDigest(artifact.generatedSections)===await baziDigest(ir.manuscript?.sections)};
 const mismatched=Object.keys(sourceChecks).filter(key=>!sourceChecks[key]);if(mismatched.length)throw Object.assign(Error('BZR_ISSUANCE_NATIVE_SOURCE_MISMATCH'),{code:'BZR_ISSUANCE_NATIVE_SOURCE_MISMATCH',status:409,details:{mismatched}});
 const {digest,...irBody}=ir;if(await baziDigest(irBody)!==digest)fail('BZR_ISSUANCE_PUBLICATION_DIGEST_MISMATCH');
 const rights=await env.RUNTIME_DB.prepare("SELECT e.entitlement_id FROM commerce_purchases p JOIN commerce_checkout_attempts o ON o.checkout_attempt_id=p.checkout_attempt_id JOIN digital_entitlements e ON e.purchase_id=p.purchase_id WHERE p.purchase_id=? AND p.customer_id=? AND p.product_id=? AND p.purchase_state='purchased' AND o.checkout_attempt_id=? AND o.customer_id=p.customer_id AND o.environment=? AND o.order_state='FULFILLED' AND o.review_required=0 AND e.customer_id=p.customer_id AND e.product_id=p.product_id AND e.entitlement_status='active' AND (e.expires_at IS NULL OR e.expires_at>?)").bind(job.purchaseId,job.ownerAccountId,job.productId,job.orderId,job.environment,new Date(f.clock()).toISOString()).first();
 if(rights?.entitlement_id!==artifact.entitlementId)fail('BZR_ISSUANCE_ENTITLEMENT_REQUIRED');
 const end=await assertPaidReportWorkerFence(env),endJob=await paidReportStateStore(env,f.clock).job(f.jobId,f.ownerAccountId);if(end.claimToken!==f.claimToken||end.jobId!==job.jobId||!await same(endJob,job))fail('BZR_ISSUANCE_FENCE_CHANGED');
 return deepFreeze({schemaVersion:'BZR-JOB-ARTIFACT-SOURCE-MAPPING-1',methodCode:'BZR',jobId:job.jobId,subjectId:job.personId,personVersion:job.personVersion,jobInputDigest:job.inputDigest,currentAuthorityDigest:job.authorityDigest,sourceAuthorityDigest:native.pack.authorityDigest,sourceAuthoritySchema:native.pack.schemaVersion,artifactDigest:artifact.artifactDigest,sourceCalculationDigest,calculationFactsDigest,calculationComparisonRule:'BZR_CALCULATION_FACTS_EXCLUDING_EXECUTION_TIMESTAMP_1',methodConsentDigest:await sha256Stable(s.methodConsent),reportConsentDigest:await sha256Stable(s.reportConsent),newCustomerAdmission:false});
}

function checkSource(b,a,r,version){
 if(version!==REPORT_PDF_RENDITION_VERSIONS[a.methodCode]||!r?.version||version===r.version)fail('ISSUANCE_DISTINCT_VERSION_REQUIRED');
 for(const [key,val] of Object.entries({methodCode:a.methodCode,ownerAccountId:b.ownerAccountId,subjectId:a.personId,orderId:b.orderId,purchaseId:b.purchaseId,productId:b.productId}))if(r[key]!==val)fail('ISSUANCE_SOURCE_IDENTITY_MISMATCH');
 if(!validHash(r.outputSHA256)||!Number.isSafeInteger(r.bytes)||r.bytes<1000||!Number.isSafeInteger(r.pageCount)||r.pageCount<1||r.publicationIRDigest!==a.publicationIR.digest||r.sourceHtmlDigest!==a.htmlSnapshotOrRenderState.outputDigest)fail('ISSUANCE_SOURCE_RECEIPT_REQUIRED');
}
async function plan(inputs,check){
 const {binding,artifact,sourceReceipt,version}=inputs;checkSource(binding,artifact,sourceReceipt,version);
 const mapping=await check(),sourceMappingDigest=await sha256Stable(mapping);
 const finalizationBinding=deepFreeze({...binding,methodCode:artifact.methodCode,jobId:mapping.jobId,subjectId:artifact.personId,personVersion:mapping.personVersion,jobInputDigest:mapping.jobInputDigest,currentAuthorityDigest:mapping.currentAuthorityDigest,sourceAuthorityDigest:mapping.sourceAuthorityDigest,sourceMappingDigest,publicationDigest:artifact.publicationIR.digest,publicationVersion:artifact.reportContentVersion,artifactDigest:artifact.artifactDigest});
 const port=Object.freeze({schemaVersion:'REPORT_PDF_ISSUANCE_PORT_R1'});
 held.set(port,{inputs,check,mappingDigest:sourceMappingDigest,finalizationBinding});return port;
}
export async function prepareBaziPdfIssuanceR1(context,inputs){
 const owned=structuredClone(inputs),f=await assertPaidReportWorkerFence(context.env);if(!f)fail('BZR_ISSUANCE_ACTIVE_JOB_REQUIRED');const claim=f.claimToken;return plan(owned,()=>inspectBazi(context,owned.binding,owned.artifact,claim));
}
export async function prepareZiweiPdfIssuanceR1(context,{binding,candidate,artifact,verification,sourceReceipt,version}){
 const owned=structuredClone({binding,artifact,sourceReceipt,version});
 const witness=await resolveZiweiIssuanceSourceMappingR1(context,{legacyBinding:binding,candidate,artifact,verification,sourceReceipt,mode:'LOCAL_FROZEN_REFERENCE'});
 return plan(owned,async()=>{await assertZiweiIssuanceSourceMappingR1(witness);return witness;});
}
export async function assertReportPdfIssuanceR1(port,{binding,artifact,version}){
 const p=held.get(port);if(!p)fail('ISSUANCE_SERVER_PORT_REQUIRED');
 if(p.inputs.version!==version||p.inputs.artifact.artifactDigest!==artifact.artifactDigest||identityKeys.some(k=>binding[k]!==p.inputs.binding[k]))fail('ISSUANCE_PORT_IDENTITY_MISMATCH');
 if(await sha256Stable(await p.check())!==p.mappingDigest)fail('ISSUANCE_SOURCE_CHANGED');
 return p.finalizationBinding;
}
export async function finalizeReportPdfIssuanceR1(port,{binding,artifact,version,bytes,finalizer}){
 const finalizationBinding=await assertReportPdfIssuanceR1(port,{binding,artifact,version}),p=held.get(port),source=p.inputs.sourceReceipt;
 if(bytes?.length!==source.bytes||await byteHash(bytes)!==source.outputSHA256)fail('ISSUANCE_SOURCE_BYTES_MISMATCH');
 const finalized=await finalizeNewReportPdf({bytes,binding:finalizationBinding,finalizer});
 await assertReportPdfIssuanceR1(port,{binding,artifact,version});
 const receipt=deepFreeze({schemaVersion:'REPORT_PDF_RENDITION_RECEIPT_R3',version,methodCode:artifact.methodCode,reportId:binding.reportId,jobId:finalizationBinding.jobId,subjectId:artifact.personId,ownerAccountId:binding.ownerAccountId,orderId:binding.orderId,purchaseId:binding.purchaseId,productId:binding.productId,environment:binding.environment,artifactDigest:artifact.artifactDigest,publicationDigest:artifact.publicationIR.digest,publicationVersion:artifact.reportContentVersion,sourceVersion:source.version,sourceSHA256:source.outputSHA256,sourceBytes:source.bytes,sourceReceiptDigest:await sha256Stable(source),sourceMappingDigest:p.mappingDigest,outputSHA256:finalized.outputSHA256,bytes:finalized.bytes.length,pageCount:source.pageCount,finalizationReceiptDigest:await sha256Stable(finalized.receipt),finalizationBindingDigest:await sha256Stable(finalizationBinding),profile:finalized.receipt.profile,ownerPublicationAccepted:false,commercialAdmission:false});
 return {...finalized,issuanceProof:deepFreeze({schemaVersion:'REPORT_PDF_RENDITION_PROOF_R1',receipt,sourceReceipt:source,finalizationBinding})};
}
// Cold reads verify immutable lineage, never require a currently running Job.
export async function verifyStoredPdfRenditionR1({proof,optimizationReceipt,artifact,binding,version,bytes}){
 const r=proof?.receipt,s=proof?.sourceReceipt,b=proof?.finalizationBinding;
 if(proof?.schemaVersion!=='REPORT_PDF_RENDITION_PROOF_R1'||r?.schemaVersion!=='REPORT_PDF_RENDITION_RECEIPT_R3'||!b)fail('PDF_RENDITION_PROOF_REQUIRED');
 checkSource(binding,artifact,s,version);
 for(const [key,val] of Object.entries({version,methodCode:artifact.methodCode,reportId:binding.reportId,subjectId:artifact.personId,ownerAccountId:binding.ownerAccountId,orderId:binding.orderId,purchaseId:binding.purchaseId,productId:binding.productId,environment:binding.environment,artifactDigest:artifact.artifactDigest,publicationDigest:artifact.publicationIR.digest,publicationVersion:artifact.reportContentVersion,sourceVersion:s.version,sourceSHA256:s.outputSHA256,sourceBytes:s.bytes,sourceReceiptDigest:await sha256Stable(s),sourceMappingDigest:b.sourceMappingDigest,outputSHA256:await byteHash(bytes),bytes:bytes.length,pageCount:s.pageCount,finalizationReceiptDigest:await sha256Stable(optimizationReceipt),finalizationBindingDigest:await sha256Stable(b),profile:optimizationReceipt?.profile,ownerPublicationAccepted:false,commercialAdmission:false}))if(r[key]!==val)fail('PDF_RENDITION_LINEAGE_MISMATCH');
 for(const key of identityKeys)if(b[key]!==binding[key])fail('PDF_RENDITION_BINDING_MISMATCH');
 if(!r.jobId||b.jobId!==r.jobId||b.artifactDigest!==artifact.artifactDigest||b.methodCode!==artifact.methodCode||b.subjectId!==artifact.personId||b.publicationDigest!==artifact.publicationIR.digest||b.publicationVersion!==artifact.reportContentVersion||!validHash(b.sourceMappingDigest)||optimizationReceipt?.version!=='REPORT-PDF-FINALIZATION-R1'||optimizationReceipt.bindingDigest!==r.finalizationBindingDigest||optimizationReceipt.inputSHA256!==r.sourceSHA256||optimizationReceipt.outputSHA256!==r.outputSHA256||optimizationReceipt.originalBytes!==s.bytes||optimizationReceipt.optimizedBytes!==bytes.length||bytes.length>s.bytes)fail('PDF_RENDITION_ENCODING_MISMATCH');
 for(const key of ['pageCount','pageBoundaries','dynamicContentStreamsExact','extractedTextExactPerPage','fontPayloadSetUnchanged','fontNamesUnchanged','originalIdentityMetadataRetained','originalUnmodified','bookmarksExact','linksExact','protectedImagesUnchanged'])if(optimizationReceipt.checks?.[key]!==true)fail('PDF_RENDITION_PARITY_MISSING');
 if(!['BACKGROUND_JPEG_Q87_444_NO_RESIZE','BACKGROUND_JPEG_Q83_444_NO_RESIZE'].includes(r.profile)||optimizationReceipt.providerCalls!==0||optimizationReceipt.commercialAdmissionGranted!==false||optimizationReceipt.downsampled!==false||optimizationReceipt.transparencyPreserved!==true||optimizationReceipt.criticalCalculationImagesPreserved!==true)fail('PDF_RENDITION_POLICY_MISMATCH');
 return {renditionReceipt:r,sourceReceipt:s,optimizationReceipt};
}
