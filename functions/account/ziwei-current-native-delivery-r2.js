import {cachedMethodDelivery,methodCacheIdentity} from '../report-delivery/method-delivery-cache.js';
import {readMethodPdfMultipart} from '../report-delivery/method-pdf-transfer.js';
import {assertMethodGeneration,assertMethodRenderReceipt,methodMaterialIdentity} from '../report-delivery/method-render-contract.js';
import {assertPaidReportWorkerFence} from '../report-delivery/paid-report-worker-fence.js';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
import {digest} from './oidc-auth.js';
import {assertZiweiPdfScope,persistAccountZiweiPdf} from './ziwei-pdf-delivery.js';
import {releaseControlledZiweiReport} from './ziwei-controlled-report-material.js';
import {persistMethodReportMaterial} from './method-report-material.js';
const fail=code=>{throw Object.assign(Error(code),{code,status:409});};
const byteHash=async b=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),v=>v.toString(16).padStart(2,'0')).join('');
// Versioned source-PDF checkpoint over existing private storage/cache. No model,
// new registry, entitlement, identity or commercial admission lives here.
export async function deliverCurrentAccountZiweiR2(context,candidate,{loadSubject}){
 const env=context.env;if(env.PHIOS_ENVIRONMENT!=='local'||env.STRIPE_ENVIRONMENT!=='QA'||env.PHIOS_LOCAL_ZWR_CURRENT_NATIVE_QA!=='true')fail('ZWR_CURRENT_NATIVE_LOCAL_QA_ONLY');
 assertZiweiPdfScope(context,candidate);if(!await assertPaidReportWorkerFence(env))fail('ZWR_CURRENT_NATIVE_ACTIVE_JOB_REQUIRED');
 const contract=await assertMethodGeneration(candidate),key=await methodCacheIdentity({schema:'ZWR_CURRENT_NATIVE_RENDER_CHECKPOINT_R2',candidateDigest:await sha256Stable(candidate),rendererVersion:contract.rendererVersion,compositionVersion:contract.compositionVersion});
 const validate=async value=>{assertMethodRenderReceipt(candidate,value.verification);if(await digest(value.html)!==value.verification.outputDigest)fail('ZWR_CURRENT_HTML_DIGEST_MISMATCH');const ref=await env.PRIVATE_REPORTS.get(value.pdfObjectKey);if(!ref)fail('ZWR_CURRENT_SOURCE_PDF_MISSING');const bytes=new Uint8Array(await ref.arrayBuffer()),d=value.verification.pdfDerivative;if(!d||bytes.length!==d.bytes||await byteHash(bytes)!==d.outputDigest||new TextDecoder().decode(bytes.subarray(0,5))!=='%PDF-')fail('ZWR_CURRENT_SOURCE_PDF_CORRUPT');};
 const cached=await cachedMethodDelivery(env,{ownerAccountId:candidate.customerId,kind:'PUBLICATION',key,validate,produce:async()=>{
  const response=await env.METHOD_REPORT_RENDERER.fetch(new Request('https://method-report-renderer.internal/verify',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({candidate,method:'ZWR',compositionVersion:candidate.snapshot.compositionVersion,includePdf:true})}));
  const output=await readMethodPdfMultipart(response);assertMethodRenderReceipt(candidate,output.verification);const d=output.verification.pdfDerivative;if(await byteHash(output.pdfBytes)!==d?.outputDigest)fail('ZWR_CURRENT_SOURCE_PDF_DIGEST_MISMATCH');
  const pdfObjectKey='zwr-current-render/'+key+'/'+d.outputDigest+'.pdf';await env.PRIVATE_REPORTS.put(pdfObjectKey,output.pdfBytes,{onlyIf:{etagDoesNotMatch:'*'},httpMetadata:{contentType:'application/pdf',cacheControl:'private, no-store'}});return {html:output.html,verification:output.verification,pdfObjectKey};
 }});
 const output=cached.value,source=await env.PRIVATE_REPORTS.get(output.pdfObjectKey);if(!source)fail('ZWR_CURRENT_SOURCE_PDF_MISSING');const pdfBytes=new Uint8Array(await source.arrayBuffer()),identity=await methodMaterialIdentity(candidate,output.verification),reportId=candidate.paidReportBinding.reportId;
 // Issue bytes before publishing release metadata. Recovery reuses the exact
 // checkpoint and cannot produce a second PDF or freeze an orphan receipt.
 await persistAccountZiweiPdf(context,{candidate,reportId,html:output.html,verification:output.verification,pdfBytes});
 const release=await releaseControlledZiweiReport(context,candidate,{loadSubject,renderVerification:output.verification});if(release.reportId!==reportId)fail('ZWR_CURRENT_REPORT_ID_MISMATCH');
 await persistMethodReportMaterial(context,{release,candidate,html:output.html,receipt:output.verification,identity});return {reportId,cacheHit:cached.cacheHit,scope:'LOCAL_CURRENT_NATIVE_QA_NOT_CUSTOMER_RELEASE'};
}
