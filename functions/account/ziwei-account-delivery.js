import {readMethodPdfMultipart} from '../report-delivery/method-pdf-transfer.js';
import {assertZiweiPdfScope,persistAccountZiweiPdf,assertAccountZiweiFinalArtifact,accountZiweiPdfLink} from './ziwei-pdf-delivery.js';
import {cachedMethodDelivery,methodCacheIdentity} from '../report-delivery/method-delivery-cache.js';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
import {assertMethodRenderReceipt,methodMaterialIdentity,assertMethodGeneration} from '../report-delivery/method-render-contract.js';
import {readMethodReportMaterial,persistMethodReportMaterial} from './method-report-material.js';
import {generateAccountZiweiCandidate} from '../report-delivery/ziwei-canonical-person-binding.js';
import {controlledZiweiIdentity} from '../report-delivery/ziwei-production-generation-v1.js';
import {loadCanonicalPersonSubject} from './canonical-person-store.js';
import {releaseControlledZiweiReport,openControlledZiweiReport} from './ziwei-controlled-report-material.js';
import {digest} from './oidc-auth.js';
import {generateContextualAccountZiweiCandidate} from '../report-delivery/ziwei-contextual-person-binding-r1.js';
import {assertZiweiFinalArtifact} from '../report-delivery/ziwei-final-artifact-contract.js';
const fail=(code,status=409)=>Object.assign(new Error(code),{code,status});
const loader=env=>(owner,id)=>loadCanonicalPersonSubject(env,owner,id);
async function bounded(response,max){const reader=response.body?.getReader();if(!reader)throw fail('REPORT_RENDER_FAILED');let bytes=0,text='';const decoder=new TextDecoder();for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>max){await reader.cancel();throw fail('REPORT_RENDER_TOO_LARGE');}text+=decoder.decode(value,{stream:true});}return text+decoder.decode();}
// Existing publication owner -> existing release/material/private artifact owners.
// Server-only final-file handoff: no renderer, Provider, new API or regeneration.
export async function handoffFinalAccountZiwei(context,{candidate,html,verification,pdfBytes,finalPublicationReceipt}){
 controlledZiweiIdentity(context);assertZiweiPdfScope(context,candidate);
 await assertZiweiFinalArtifact({candidate,verification,pdfBytes,receipt:finalPublicationReceipt});
 if(await digest(html)!==verification.outputDigest)throw fail('ZWR_FINAL_HTML_SOURCE_MISMATCH');
 const subject=await loadCanonicalPersonSubject(context.env,candidate.customerId,candidate.personId),s=candidate.snapshot.semanticContent;
 if(subject.person.displayName!==s.subject.displayName||await sha256Stable(subject.canonicalBirthInput)!==await sha256Stable(s.vfrInputSnapshot))throw fail('ZWR_FINAL_PROFILE_SNAPSHOT_MISMATCH');
 const finalCandidate={...candidate,finalPublicationReceiptDigest:await sha256Stable(finalPublicationReceipt)};
 const reportId='zwr-'+await sha256Stable(finalCandidate);
 await assertAccountZiweiFinalArtifact(context,{candidate:finalCandidate,reportId,verification,pdfBytes,finalPublicationReceipt});
 const finalVersion=await cachedMethodDelivery(context.env,{ownerAccountId:candidate.customerId,kind:'PUBLICATION',key:await methodCacheIdentity({contract:'ZWR_FINAL_FILE_VERSION_1',subjectId:candidate.personId,purchaseId:candidate.purchaseId,snapshotId:candidate.snapshot.semanticSnapshotId,version:finalPublicationReceipt.version}),produce:async()=>({finalPublicationReceiptDigest:finalCandidate.finalPublicationReceiptDigest,finalPublicationReceipt}),validate:async value=>{if(value.finalPublicationReceiptDigest!==finalCandidate.finalPublicationReceiptDigest||await sha256Stable(value.finalPublicationReceipt)!==finalCandidate.finalPublicationReceiptDigest)throw fail('ZWR_FINAL_VERSION_IMMUTABLE');}});
 if(finalVersion.value.finalPublicationReceiptDigest!==finalCandidate.finalPublicationReceiptDigest)throw fail('ZWR_FINAL_VERSION_IMMUTABLE');
 const prior=await context.env.RUNTIME_DB.prepare('SELECT report_id FROM account_method_report_materials WHERE report_id=? AND owner_account_id=?').bind(reportId,candidate.customerId).first();
 if(prior){const {downloadAccountZiweiPdf}=await import('./ziwei-pdf-delivery.js');await downloadAccountZiweiPdf(context,reportId);return {reportId,cacheHit:true,rendererCalls:0,providerCalls:0};}
 const identity=await methodMaterialIdentity(finalCandidate,verification),release=await releaseControlledZiweiReport(context,finalCandidate,{loadSubject:loader(context.env),renderVerification:verification});
 await persistAccountZiweiPdf(context,{candidate:finalCandidate,reportId:release.reportId,html,verification,pdfBytes,finalPublicationReceipt});
 await persistMethodReportMaterial(context,{release,candidate:finalCandidate,html,receipt:verification,identity});
 return {reportId:release.reportId,cacheHit:false,rendererCalls:0,providerCalls:0,scope:'LOCAL_SYNTHETIC_FINAL_FILE_QA'};
}
export async function generateAndReleaseAccountZiwei(context,selection,{generateCandidate=generateAccountZiweiCandidate}={}){
 controlledZiweiIdentity(context);
 if(!context.env.METHOD_REPORT_RENDERER?.fetch)throw fail('REPORT_BROWSER_VERIFIER_NOT_CONFIGURED',503);
 const candidate=selection?.reportMode!=null||selection?.realityBriefId!=null?await generateContextualAccountZiweiCandidate(context,selection):await generateCandidate(context,selection);
 // An actual private server browser verifier must be configured. Customer claims
 // and local test receipts cannot cross this boundary.
 await assertMethodGeneration(candidate);
 if(!context.env.METHOD_REPORT_RENDERER?.fetch)throw fail('REPORT_BROWSER_VERIFIER_NOT_CONFIGURED',503);
 if(context.env.ZWR_PDF_DELIVERY_CANDIDATE==='true'){
  assertZiweiPdfScope(context,candidate);
  const prior=await context.env.RUNTIME_DB.prepare("SELECT report_id FROM account_method_report_materials WHERE owner_account_id=? AND snapshot_id=? AND method_code='ZWR'").bind(candidate.customerId,candidate.snapshot.semanticSnapshotId).first();
  if(prior){const {downloadAccountZiweiPdf}=await import('./ziwei-pdf-delivery.js');await downloadAccountZiweiPdf(context,prior.report_id);return {reportId:prior.report_id,cacheHit:true,providerCalls:0,scope:'LOCAL_SYNTHETIC_REFERENCE_ONLY'};}
  const response=await context.env.METHOD_REPORT_RENDERER.fetch(new Request('https://method-report-renderer.internal/verify',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({candidate,method:'ZWR',compositionVersion:candidate.snapshot.compositionVersion,includePdf:true})}));
  const output=await readMethodPdfMultipart(response),receipt=output.verification;assertMethodRenderReceipt(candidate,receipt);
  const identity=await methodMaterialIdentity(candidate,receipt),release=await releaseControlledZiweiReport(context,candidate,{loadSubject:loader(context.env),renderVerification:receipt});
  await persistAccountZiweiPdf(context,{candidate,reportId:release.reportId,...output});
  await persistMethodReportMaterial(context,{release,candidate,html:output.html,receipt,identity});
  return {reportId:release.reportId,scope:'LOCAL_SYNTHETIC_REFERENCE_ONLY'};
 }
 const publicationKey=await methodCacheIdentity({schemaVersion:'METHOD_PUBLICATION_CACHE_KEY_V1',snapshotId:candidate.snapshot.semanticSnapshotId,semanticDigest:await sha256Stable(candidate.snapshot.semanticContent),profileVersion:candidate.snapshot.semanticContent.vfrLineage?.profileVersion||null,compositionVersion:candidate.snapshot.compositionVersion,rendererContract:await assertMethodGeneration(candidate).then(({renderFunction,...contract})=>contract)});
 const publication=await cachedMethodDelivery(context.env,{ownerAccountId:candidate.customerId,kind:'PUBLICATION',key:publicationKey,
  validate:async output=>{assertMethodRenderReceipt(candidate,output.verification);if(typeof output.html!=='string'||output.verification.outputDigest!==await digest(output.html))throw fail('REPORT_RENDER_VERIFICATION_REQUIRED');},
  produce:async()=>{
   const response=await context.env.METHOD_REPORT_RENDERER.fetch(new Request('https://method-report-renderer.internal/verify',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({candidate,method:'ZWR',compositionVersion:candidate.snapshot.compositionVersion})}));
   if(!response.ok)throw fail('REPORT_RENDER_FAILED');
   return JSON.parse(await bounded(response,8000000));
  }
 });
 const output=publication.value,receipt=output.verification;
 const identity=await methodMaterialIdentity(candidate,receipt);
 const release=await releaseControlledZiweiReport(context,candidate,{loadSubject:loader(context.env),renderVerification:receipt});
 await persistMethodReportMaterial(context,{release,candidate,html:output.html,receipt,identity});
 return {reportId:release.reportId};
}
export async function openAccountZiweiMaterial(context,reportId){
 const owner=controlledZiweiIdentity(context).userId;
 return readMethodReportMaterial(context,reportId,{ownerAccountId:owner,loadReleaseReceipt:async()=>{const row=await context.env.RUNTIME_DB.prepare('SELECT a.payload FROM runtime_artifacts a JOIN runtimes r ON r.runtime_id=a.runtime_id WHERE a.artifact_id=? AND r.user_id=?').bind(reportId,owner).first();return row?JSON.parse(row.payload).renderVerification:null;},openReleasedCandidate:row=>openControlledZiweiReport(context,{reportId,personId:row.person_id},{loadSubject:loader(context.env)})});
}
export async function listAccountZiweiMaterials(context){
 const owner=controlledZiweiIdentity(context).userId;
 const rows=(await context.env.RUNTIME_DB.prepare("SELECT report_id FROM account_method_report_materials WHERE owner_account_id=? AND method_code='ZWR' ORDER BY released_at DESC LIMIT 100").bind(owner).all()).results;
 const reports=[];
 for(const row of rows){try{const material=await openAccountZiweiMaterial(context,row.report_id),{row:r,candidate}=material;reports.push({reportId:r.report_id,method:'ZWR',subjectName:candidate.snapshot.semanticContent.subject.displayName,locale:r.locale,releasedAt:r.released_at,version:r.report_version,compositionVersion:candidate.snapshot.compositionVersion,presentationMode:candidate.visualFirst?'BILINGUAL':r.locale,status:'RELEASED',...await accountZiweiPdfLink(context,material)});}catch(e){if(e.status===503)throw e;}}
 return reports;
}
