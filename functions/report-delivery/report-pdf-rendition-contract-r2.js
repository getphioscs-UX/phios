import {assertVerifiedIssuanceBindingR2} from './report-issuance-binding-r2.js';
const fail=code=>{throw Object.assign(Error(code),{code,status:409});};
const canonical=v=>v===null||typeof v!=='object'?JSON.stringify(v):Array.isArray(v)?'['+v.map(canonical).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
const digest=async v=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(v)))),x=>x.toString(16).padStart(2,'0')).join('');
// Encoding lineage is distinct from the immutable source publication receipt.
// Caller must first retain/assert the existing method-owned source receipt.
export async function buildReportPdfRenditionReceiptR2({binding,sourceReceipt,finalizationReceipt,derivativeVersion}){
 await assertVerifiedIssuanceBindingR2(binding);
 if(!/^[A-Z0-9-]{1,100}$/.test(derivativeVersion||'')||derivativeVersion===sourceReceipt?.version)fail('RENDITION_DISTINCT_VERSION_REQUIRED');
 for(const [key,value] of Object.entries({methodCode:binding.methodCode,ownerAccountId:binding.ownerAccountId,subjectId:binding.subjectId,orderId:binding.orderId,purchaseId:binding.purchaseId,productId:binding.productId}))if(sourceReceipt?.[key]!==value)fail('RENDITION_SOURCE_PURCHASE_MISMATCH');
 const sourceSHA256=sourceReceipt.outputSHA256||sourceReceipt.outputDigest,publication=sourceReceipt.publicationIRDigest||sourceReceipt.publicationDigest;
 if(!/^[a-f0-9]{64}$/.test(sourceSHA256||'')||publication!==binding.publicationDigest||!(sourceReceipt.bytes>=1000))fail('RENDITION_FROZEN_SOURCE_REQUIRED');
 const r=finalizationReceipt;
 if(r?.version!=='REPORT-PDF-FINALIZATION-R1'||r.methodCode!==binding.methodCode||r.bindingDigest!==await digest(binding)||r.inputSHA256!==sourceSHA256||r.originalBytes!==sourceReceipt.bytes||!/^[a-f0-9]{64}$/.test(r.outputSHA256||'')||r.optimizedBytes<1000||r.optimizedBytes>r.originalBytes||!['BACKGROUND_JPEG_Q87_444_NO_RESIZE','BACKGROUND_JPEG_Q83_444_NO_RESIZE'].includes(r.profile))fail('RENDITION_FINALIZATION_BINDING_MISMATCH');
 for(const k of ['pageCount','pageBoundaries','dynamicContentStreamsExact','extractedTextExactPerPage','fontPayloadSetUnchanged','fontNamesUnchanged','originalIdentityMetadataRetained','originalUnmodified','bookmarksExact','linksExact','protectedImagesUnchanged'])if(r.checks?.[k]!==true)fail('RENDITION_PARITY_REQUIRED');
 if(r.providerCalls!==0||r.commercialAdmissionGranted!==false||r.downsampled!==false||r.transparencyPreserved!==true||r.criticalCalculationImagesPreserved!==true)fail('RENDITION_POLICY_MISMATCH');
 return Object.freeze({schemaVersion:'REPORT_PDF_RENDITION_RECEIPT_R2',version:derivativeVersion,scope:'ENCODING_DERIVATIVE_NOT_PUBLICATION_ACCEPT',methodCode:binding.methodCode,reportId:binding.reportId,jobId:binding.jobId,subjectId:binding.subjectId,ownerAccountId:binding.ownerAccountId,orderId:binding.orderId,purchaseId:binding.purchaseId,productId:binding.productId,sourceVersion:sourceReceipt.version,sourceSHA256,sourceReceiptDigest:await digest(sourceReceipt),publicationDigest:binding.publicationDigest,publicationVersion:binding.publicationVersion,outputSHA256:r.outputSHA256,bytes:r.optimizedBytes,pageCount:sourceReceipt.pageCount||sourceReceipt.pages,finalizationReceiptDigest:await digest(r),profile:r.profile,sourceReceiptUnchanged:true,ownerPublicationAccepted:false,commercialAdmission:false});
}
