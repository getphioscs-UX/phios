import {authenticate,digest,requireSameOrigin} from '../account/oidc-auth.js';
import {assertMethodGeneration,assertMethodRenderReceipt} from '../report-delivery/method-render-contract.js';
import {requireMethodWave} from './shared-report-e2e-proof.js';
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
const fail=(code,status=409)=>Object.assign(new Error(code),{code,status});
// Explicit live-only API. Frozen candidate comes from a private trusted manifest,
// never client JSON. It invokes the renderer sequentially and never the writer.
export async function onRequest(context){
 try{
  if(context.request.method!=='POST')throw fail('METHOD_NOT_ALLOWED',405);
  requireSameOrigin(context.request);
  if(!await authenticate(context))throw fail('ACCOUNT_REQUIRED',401);
  if(context.env.PHIOS_ENVIRONMENT!=='qa'||context.env.SHARED_REPORT_E2E_LIVE_ALLOWED!=='true')throw fail('SHARED_E2E_LIVE_NOT_AUTHORIZED',403);
  const manifest=await requireMethodWave(context.env);
  if(!manifest.frozenRendererCandidateKey||!manifest.frozenRendererSnapshotId)throw fail('SHARED_RENDERER_FROZEN_CANDIDATE_REQUIRED');
  const object=await context.env.PRIVATE_REPORTS.get(manifest.frozenRendererCandidateKey);
  if(!object)throw fail('SHARED_RENDERER_FROZEN_CANDIDATE_REQUIRED');
  const candidate=await object.json(),contract=await assertMethodGeneration(candidate);
  if(candidate.scope!=='CONTROLLED_QA_ONLY'||candidate.snapshot.semanticSnapshotId!==manifest.frozenRendererSnapshotId)throw fail('SHARED_RENDERER_FROZEN_CANDIDATE_REQUIRED');
  if(!context.env.METHOD_REPORT_RENDERER?.fetch)throw fail('REPORT_BROWSER_VERIFIER_NOT_CONFIGURED',503);
  const measurements=[];
  for(const groupSize of [3,5])for(let index=0;index<groupSize;index++){
   const response=await context.env.METHOD_REPORT_RENDERER.fetch(new Request('https://method-report-renderer.internal/verify',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({candidate,method:contract.methodCode,compositionVersion:contract.compositionVersion})}));
   if(!response.ok)throw fail('SHARED_RENDERER_CAMPAIGN_FAILED');
   const output=await response.json(),receipt=output.verification;assertMethodRenderReceipt(candidate,receipt);
   if(receipt.verifier!=='CLOUDFLARE_BROWSER_QA'||!receipt.timings||receipt.outputDigest!==await digest(output.html))throw fail('SHARED_RENDERER_CAMPAIGN_RECEIPT_REQUIRED');
   measurements.push({groupSize,index:index+1,sequence:measurements.length+1,passed:true,pageCount:receipt.pageCount,expectedPageCount:contract.expectedPageCount,imageCount:receipt.imageCount,htmlBytes:receipt.htmlBytes,timings:receipt.timings,outputDigest:receipt.outputDigest,browserLaunchFailures:0,timeouts:0,overflowFailures:0,brokenImageFailures:0,pageDriftFailures:0,rendererErrors:0});
  }
  const receipt={schemaVersion:'SHARED_RENDERER_STABILITY_RECEIPT_V1',scope:'DEPLOYED_PRIVATE_BROWSER',status:'PASS',methodCode:contract.methodCode,rendererVersion:contract.rendererVersion,compositionVersion:contract.compositionVersion,semanticSnapshotId:candidate.snapshot.semanticSnapshotId,sequential:true,measurements,providerCalls:0,recordedAt:new Date().toISOString()};
  await context.env.PRIVATE_REPORTS.put('qa/shared-report-e2e/v2/renderer-stability/'+contract.rendererVersion+'.json',JSON.stringify(receipt),{httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});
  return Response.json({ok:true,status:'PASS',sequentialRuns:measurements.length,providerCalls:0,sharedDeliveryAuthorityEligible:false},{headers});
 }catch(error){return Response.json({ok:false,code:error.code||'SHARED_RENDERER_CAMPAIGN_FAILED'},{status:error.status||409,headers});}
}
