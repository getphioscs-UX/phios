import {methodPdfSHA} from './method-pdf-transfer.js';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
import {assertMethodGeneration,assertMethodRenderReceipt} from './method-render-contract.js';
import frozenReferencePlan from '../../docs/reports/ziwei/vfr-r1/PAGE-PLAN.json';
import {ziweiPhysicalPageMap} from './ziwei-r2-publication-binding.js';
export const ZWR_FINAL_ARTIFACT_CONTRACT='ZWR-FINAL-ARTIFACT-HANDOFF-1';
const fail=()=>{throw Object.assign(Error('ZWR_FINAL_ARTIFACT_BINDING_MISMATCH'),{status:409});};
// The trusted publication owner supplies this receipt. It is never accepted
// from the Account request JSON and does not claim a Cloud/browser render PASS.
export async function assertZiweiFinalArtifact({candidate,verification,pdfBytes,receipt,binding,entitlementId}){
 const c=candidate.snapshot.semanticContent,contract=await assertMethodGeneration(candidate);
 assertMethodRenderReceipt(candidate,verification);
 if(!receipt||receipt.schemaVersion!==ZWR_FINAL_ARTIFACT_CONTRACT||receipt.methodCode!=='ZWR'||receipt.scope!=='LOCAL_SYNTHETIC_FINAL_FILE_QA'||receipt.humanDecision!=='LOCAL_VISUAL_ACCEPT_CANDIDATE'||receipt.ownerSigned!==false||receipt.commercialRelease!==false||receipt.watermarkHumanApproval!=='PENDING')fail();
 if(!/^[A-Z0-9-]{1,100}$/.test(receipt.version)||!['REFERENCE_Q87','PERSONALIZED_WATERMARK_CANDIDATE'].includes(receipt.kind))fail();
 const expected={ownerAccountId:candidate.customerId,subjectId:candidate.personId,purchaseId:candidate.purchaseId,nativeSnapshotId:candidate.snapshot.semanticSnapshotId,inputFingerprint:candidate.snapshot.inputFingerprint,publicationIRDigest:c.visualReportIr.publicationIrDigest,diagramDigest:c.vfrDiagramData.diagramDataDigest,r2BindingDigest:await sha256Stable(c.vfrR2PublicationBinding),observationContextDigest:await sha256Stable(c.evidence.targetContext),subjectPresentationDigest:await sha256Stable(c.subject),sourceHtmlDigest:verification.outputDigest,nativeSourcePageCount:contract.expectedPageCount};
 const mismatched=Object.keys(expected).filter(key=>receipt[key]!==expected[key]);if(mismatched.length)throw Object.assign(Error('ZWR_FINAL_ARTIFACT_BINDING_MISMATCH'),{status:409,details:{mismatched}});
 if(binding&&(receipt.ownerAccountId!==binding.ownerAccountId||receipt.orderId!==binding.orderId||receipt.purchaseId!==binding.purchaseId||receipt.productId!==binding.productId))fail();
 if(entitlementId&&receipt.entitlementId!==entitlementId)fail();
 const frozenPhysicalMap=ziweiPhysicalPageMap(frozenReferencePlan);
 if(receipt.finalPaginationVersion!=='ZWR-R13-FROZEN-Q87-EDITION-1'||receipt.pageCount!==frozenPhysicalMap.length||receipt.finalPageMapDigest!==await sha256Stable(frozenPhysicalMap))fail();
 if(receipt.sourceQ87SHA256!=='2dd6e0b3a4c6fba2a5ab7305afdb1cd2a1d4e9c72b56c63f8ca3677275d578b4'||receipt.sourceQ87Bytes!==9807509)fail();
 if(receipt.kind==='REFERENCE_Q87'&&(receipt.outputSHA256!==receipt.sourceQ87SHA256||receipt.bytes!==receipt.sourceQ87Bytes||receipt.coverProjection!=='REFERENCE_UNFILLED'))fail();
 if(receipt.kind==='PERSONALIZED_WATERMARK_CANDIDATE'&&(receipt.outputSHA256===receipt.sourceQ87SHA256||receipt.coverProjection!=='SAME_NATIVE_SUBJECT_ONLY'||!receipt.watermarkPolicyId))fail();
 if(receipt.checks?.sourceTextPreserved!==true||receipt.checks?.nativeDiagramsUnchanged!==true||receipt.checks?.imagePayloadsUnchanged!==true||receipt.checks?.bookmarksRetained!==true||receipt.checks?.pageBoundariesUnchanged!==true)fail();
 if(pdfBytes&&(receipt.bytes!==pdfBytes.length||receipt.outputSHA256!==await methodPdfSHA(pdfBytes)||new TextDecoder().decode(pdfBytes.subarray(0,5))!=='%PDF-'))fail();
 return {bytes:receipt.bytes,outputDigest:receipt.outputSHA256,pages:receipt.pageCount,sourceHtmlDigest:receipt.sourceHtmlDigest,publicationDigest:receipt.publicationIRDigest,semanticSnapshotId:receipt.nativeSnapshotId};
}
