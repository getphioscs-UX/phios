import {digest} from '../account/oidc-auth.js';
import {assertMethodGeneration,assertMethodRenderReceipt} from './method-render-contract.js';
import {ZWR_VFR_METHOD_PROFILE as profile} from './ziwei-vfr-profile-policy.js';
const sourceAcceptanceDigest='81e31ab108602135616965c0c92d838085ddb0f5561c02c02ceb09f8958dc611';
const root='qa/method-delivery/ZWR/';
const fail=(code,status=409,details)=>Object.assign(new Error(code),{code,status,details});
export async function runZwrNativeRendererAcceptance(env){
 if(env.PHIOS_ENVIRONMENT!=='qa')throw fail('QA_ONLY',403);
 const manifestObject=await env.PRIVATE_REPORTS?.get(root+'renderer-manifest.json');
 const manifest=manifestObject?await manifestObject.json():null;
 if(manifest?.schemaVersion!=='ZWR_NATIVE_RENDERER_QA_MANIFEST_V1'||manifest.authorized!==true||manifest.scope!=='DEPLOYED_PRIVATE_BROWSER'||manifest.sourceAcceptanceDigest!==sourceAcceptanceDigest||manifest.candidateKey!==root+'accepted-renderer-candidate.json')throw fail('NATIVE_RENDERER_MANIFEST_REQUIRED',403);
 const object=await env.PRIVATE_REPORTS.get(manifest.candidateKey);if(!object)throw fail('NATIVE_RENDERER_CANDIDATE_REQUIRED');
 const text=await object.text();if(await digest(text)!==manifest.candidateDigest)throw fail('NATIVE_RENDERER_CANDIDATE_TAMPERED');
 const candidate=JSON.parse(text),contract=await assertMethodGeneration(candidate);
 if(candidate.schemaVersion!=='ZWR-VFR-R1-ACCEPTED-RENDERER-FIXTURE-v1'||candidate.scope!=='CONTROLLED_QA_ONLY'||contract.methodCode!=='ZWR'||contract.rendererVersion!==profile.rendererVersion||candidate.snapshot.semanticSnapshotId!==manifest.semanticSnapshotId)throw fail('NATIVE_RENDERER_CANDIDATE_MISMATCH');
 if(!env.METHOD_REPORT_RENDERER?.fetch)throw fail('REPORT_BROWSER_VERIFIER_NOT_CONFIGURED',503);
 const measurements=[];
 for(const groupSize of [3,5])for(let index=1;index<=groupSize;index++){
  const response=await env.METHOD_REPORT_RENDERER.fetch(new Request('https://method-report-renderer.internal/verify',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({candidate,method:'ZWR',compositionVersion:contract.compositionVersion})}));
  const output=await response.json();
  if(!response.ok)throw fail('NATIVE_RENDERER_RUN_FAILED',422,{sequence:measurements.length+1,stage:output.stage,reason:output.reason||output.code});
  const receipt=output.verification;assertMethodRenderReceipt(candidate,receipt);
  if(receipt.schemaVersion!=='METHOD_BROWSER_VERIFICATION_V1'||receipt.verifier!=='CLOUDFLARE_BROWSER_QA'||receipt.outputDigest!==await digest(output.html)||!receipt.timings||!Number.isFinite(receipt.timings.totalRequestMs)||receipt.publicationIrDigest!==candidate.snapshot.semanticContent.visualReportIr.publicationIrDigest||receipt.sourceResultDigest!==candidate.snapshot.semanticContent.vfrDeepManuscriptDigest)throw fail('NATIVE_RENDERER_RECEIPT_INVALID');
  measurements.push({groupSize,index,sequence:measurements.length+1,passed:true,pageCount:receipt.pageCount,expectedPageCount:contract.expectedPageCount,imageCount:receipt.imageCount,htmlBytes:receipt.htmlBytes,timings:receipt.timings,outputDigest:receipt.outputDigest,browserLaunchFailures:0,timeouts:0,overflowFailures:0,brokenImageFailures:0,pageDriftFailures:0,rendererErrors:0});
 }
 const receipt={schemaVersion:'ZWR_NATIVE_RENDERER_STABILITY_RECEIPT_V1',scope:'DEPLOYED_PRIVATE_BROWSER',status:'PASS',methodCode:'ZWR',sourceAcceptanceDigest,candidateDigest:manifest.candidateDigest,rendererVersion:contract.rendererVersion,compositionVersion:contract.compositionVersion,semanticSnapshotId:candidate.snapshot.semanticSnapshotId,sequential:true,measurements,providerCalls:0,recordedAt:new Date().toISOString()};
 const receiptText=JSON.stringify(receipt),rendererAcceptanceDigest=await digest(receiptText);
 await env.PRIVATE_REPORTS.put(root+'renderer-stability/'+rendererAcceptanceDigest+'.json',receiptText,{httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});
 // Commit admission last: a partial or failed campaign cannot create admission.
 await env.PRIVATE_REPORTS.put(root+'generation-admission.json',JSON.stringify({schemaVersion:'METHOD_GENERATION_ADMISSION_V1',methodCode:'ZWR',state:'ACCEPTED',scope:'DEPLOYED_PRIVATE_BROWSER',profileVersion:profile.profileVersion,rendererVersion:profile.rendererVersion,sourceAcceptanceDigest,rendererAcceptanceDigest,rendererReceiptKey:root+'renderer-stability/'+rendererAcceptanceDigest+'.json',semanticSnapshotId:candidate.snapshot.semanticSnapshotId,recordedAt:receipt.recordedAt}),{httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});
 return {ok:true,status:'PASS',sequentialRuns:8,providerCalls:0,rendererAcceptanceDigest,sharedDeliveryAuthorityEligible:false,productionAdmissionGranted:false};
}
