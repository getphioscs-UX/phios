# PHI OS R4: independent ZWR native renderer QA preflight.
# No commit/push, no writing-provider request, no production activation.
[CmdletBinding()]
param([ValidateSet('Apply','Deploy')][string]$Action='Deploy',[string]$Repo=(Get-Location).Path)
$ErrorActionPreference='Stop'
function Run-Checked([string]$Program,[string[]]$Arguments) {
  & $Program @Arguments
  if ($LASTEXITCODE -ne 0) { throw "Stopped: $Program exited $LASTEXITCODE" }
}
function Get-Sha256([byte[]]$Bytes) {
  $hash=[Security.Cryptography.SHA256]::Create()
  try { return ([BitConverter]::ToString($hash.ComputeHash($Bytes))).Replace('-','').ToLowerInvariant() }
  finally { $hash.Dispose() }
}
$Repo=(Resolve-Path $Repo).Path
if (!(Test-Path (Join-Path $Repo 'package.json'))) { throw 'Run from the phios repository.' }
$utf8=New-Object Text.UTF8Encoding($false)
$payload=@(
  @{ Path='functions/api/zwr-native-renderer-acceptance.js'; Sha256='be0d56092d6fc1b16f4d2bbba1fbca80c0d842dae1a786b5a4d97ce81bc46066'; Text=@'
import {authenticate,requireSameOrigin} from '../account/oidc-auth.js';
import {runZwrNativeRendererAcceptance} from '../report-delivery/zwr-native-renderer-acceptance.js';
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
export async function onRequest(context){
 try{
  if(context.request.method!=='POST')return Response.json({ok:false,code:'METHOD_NOT_ALLOWED'},{status:405,headers});
  requireSameOrigin(context.request);
  if(!await authenticate(context))return Response.json({ok:false,code:'ACCOUNT_REQUIRED'},{status:401,headers});
  return Response.json(await runZwrNativeRendererAcceptance(context.env),{headers});
 }catch(error){return Response.json({ok:false,code:error.code||'NATIVE_RENDERER_ACCEPTANCE_FAILED',details:error.details||null},{status:error.status||409,headers});}
}
'@
  },
  @{ Path='functions/report-delivery/zwr-native-renderer-acceptance.js'; Sha256='5a02e65acc63aa1e30d9f4dff9888b277081ea912a0de0b420d14e6b57053127'; Text=@'
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
'@
  },
  @{ Path='scripts/lib/zwr-native-renderer-candidate.mjs'; Sha256='490e5043bb4ff6474a8b613ff754485401b453a6ea4139967d9d0f4504473d45'; Text=@'
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createCustomerDeliverySnapshot} from '../../functions/personal-reading/narrative/report-section-snapshot.js';
import {sha256Stable} from '../../functions/interpretation-runtime/mir7-utils.js';
import {buildZwrVfrDiagramData} from '../../functions/personal-reading/visual-first/ziwei-vfr-diagram-data.js';
import {buildZwrVfrDeepPublicationIr} from '../../functions/personal-reading/visual-first/ziwei-vfr-deep-publication.js';
import {buildZwrVfrPagePlan,validateZwrVfrPagePlan} from '../../functions/personal-reading/visual-first/ziwei-vfr-page-plan.js';
import {assertMethodGeneration} from '../../functions/report-delivery/method-render-contract.js';
import {ZWR_VFR_METHOD_PROFILE as profile} from '../../functions/report-delivery/ziwei-vfr-profile-policy.js';
export const sourceAcceptanceDigest='81e31ab108602135616965c0c92d838085ddb0f5561c02c02ceb09f8958dc611';
export async function buildAcceptedZwrRendererCandidate(){
 const root='docs/reports/ziwei/vfr-r1/',raw=p=>fs.readFileSync(root+p,'utf8'),read=p=>JSON.parse(raw(p)),hash=s=>createHash('sha256').update(s).digest('hex');
 assert.equal(hash(raw('HUMAN-DECISION.json')),sourceAcceptanceDigest,'Accepted source changed; review required');
 const decision=read('HUMAN-DECISION.json');assert.equal(decision.decision,'ACCEPT');
 assert.equal(hash(raw('five-call-experiment/REPAIRED-RESULT.json')),decision.repairedResultSha256);
 assert.equal(hash(raw('DEEP-PUBLICATION-IR.json')),decision.publicationIrSha256);
 const pack=read('COMPACT-AUTHORING-PACK.json'),repaired=read('five-call-experiment/REPAIRED-RESULT.json');
 const rebuilt=await buildZwrVfrDeepPublicationIr({pack,repairedResult:repaired}),ir=read('DEEP-PUBLICATION-IR.json');
 // The accepted reference predates the increased planner safety limit. Retain
 // its original bytes and compare every semantic field before native rendering.
 const {publicationIrDigest:_new,maxPhysicalPages:_newLimit,...newContent}=rebuilt;
 const {publicationIrDigest:_accepted,maxPhysicalPages:_acceptedLimit,...acceptedContent}=ir;
 assert.deepEqual(newContent,acceptedContent);
 const evidence=JSON.parse(fs.readFileSync('docs/reports/ziwei/production-admission/zpa-v1/ZPA-CONTROLLED-02-en.json','utf8')).evidence;
 const diagrams=await buildZwrVfrDiagramData({evidence});assert.deepEqual(diagrams,read('DIAGRAM-DATA.json'));
 const pages=buildZwrVfrPagePlan({sections:ir.sections}),check=validateZwrVfrPagePlan({diagramIds:diagrams.diagrams.map(d=>d.id),pages,sections:ir.sections});assert.equal(check.accepted,true);
 const snapshot=await createCustomerDeliverySnapshot({methodId:'ZWR',locale:'en',subjectFingerprint:await sha256Stable(pack.subjectBinding),inputFingerprint:pack.subjectBinding.inputFingerprint,compositionVersion:profile.compositionVersion,authorityVersion:'ZIWEI_PRO_R2_AUTHORITY_V2',claimIrVersion:profile.publicationIrVersion,verifierVersion:profile.rendererContractVersion,semanticContent:{evidence,visualReportIr:ir,vfrCompactAuthoringPackDigest:pack.authorityDigest,vfrDeepManuscriptDigest:repaired.resultDigest,vfrDiagramData:diagrams,vfrPagePlan:pages,vfrPublicationFit:check.fitProfile,vfrLineage:{profileVersion:profile.profileVersion,rendererContractVersion:profile.rendererContractVersion,pagePlanDigest:await sha256Stable(pages)}}});
 const candidate={schemaVersion:'ZWR-VFR-R1-ACCEPTED-RENDERER-FIXTURE-v1',scope:'CONTROLLED_QA_ONLY',personId:pack.subjectBinding.subjectId,locale:'en',snapshot,generationSuccessor:profile.generationVersion,naturalCompositionSummary:{providerCalls:0,semanticReviewCalls:0,completenessStatus:'PASS'},productionAdmissionGranted:false};
 await assertMethodGeneration(candidate);return candidate;
}
'@
  },
  @{ Path='scripts/prepare-zwr-native-renderer-qa.mjs'; Sha256='2452d3bd52fc1c4671033904dc21357c0886e8476f7ca3bfc07e23f78c470008'; Text=@'
// Offline preparation only. Neither a renderer receipt nor generation admission.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {buildAcceptedZwrRendererCandidate,sourceAcceptanceDigest} from './lib/zwr-native-renderer-candidate.mjs';
const output=process.argv[2];if(!output)throw Error('PRIVATE_OUTPUT_DIRECTORY_REQUIRED');
const candidate=await buildAcceptedZwrRendererCandidate(),text=JSON.stringify(candidate);
fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(path.join(output,'candidate.json'),text);
fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify({schemaVersion:'ZWR_NATIVE_RENDERER_QA_MANIFEST_V1',authorized:true,scope:'DEPLOYED_PRIVATE_BROWSER',sourceAcceptanceDigest,candidateKey:'qa/method-delivery/ZWR/accepted-renderer-candidate.json',candidateDigest:createHash('sha256').update(text).digest('hex'),semanticSnapshotId:candidate.snapshot.semanticSnapshotId},null,2)+'\n');
console.log('PASS: accepted native fixture prepared; provider calls=0; no admission created.');
'@
  },
  @{ Path='scripts/check-zwr-native-renderer-qa.mjs'; Sha256='602b47fdc4c9ff8530c38eb1be2a4fa31f6acc811d8336df899bf53972ec2d94'; Text=@'
// Offline transport tests. These receipts are never written to remote storage.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {buildAcceptedZwrRendererCandidate,sourceAcceptanceDigest} from './lib/zwr-native-renderer-candidate.mjs';
import {runZwrNativeRendererAcceptance} from '../functions/report-delivery/zwr-native-renderer-acceptance.js';
import {assertMethodGeneration} from '../functions/report-delivery/method-render-contract.js';
const hash=s=>createHash('sha256').update(s).digest('hex'),candidate=await buildAcceptedZwrRendererCandidate(),text=JSON.stringify(candidate),contract=await assertMethodGeneration(candidate),root='qa/method-delivery/ZWR/';
globalThis.fetch=async()=>{throw Error('PROVIDER_OR_NETWORK_FORBIDDEN');};
function fixture({badRun=0,tamper=false}={}){
 const objects=new Map([[root+'renderer-manifest.json',JSON.stringify({schemaVersion:'ZWR_NATIVE_RENDERER_QA_MANIFEST_V1',authorized:true,scope:'DEPLOYED_PRIVATE_BROWSER',sourceAcceptanceDigest,candidateKey:root+'accepted-renderer-candidate.json',candidateDigest:hash(text),semanticSnapshotId:candidate.snapshot.semanticSnapshotId})],[root+'accepted-renderer-candidate.json',tamper?text+' ':text]]),writes=[];let calls=0,inFlight=0;
 const env={PHIOS_ENVIRONMENT:'qa',PRIVATE_REPORTS:{async get(k){const value=objects.get(k);return value===undefined?null:{json:async()=>JSON.parse(value),text:async()=>value};},async put(k,v){writes.push(k);objects.set(k,v);}},METHOD_REPORT_RENDERER:{async fetch(){assert.equal(inFlight++,0);await Promise.resolve();const run=++calls;inFlight--;if(run===badRun)return Response.json({stage:'VERIFY',reason:'RENDER_VERIFICATION_FAILED'},{status:422});const html=contract.renderFunction();return Response.json({html,verification:{schemaVersion:'METHOD_BROWSER_VERIFICATION_V1',verifier:'CLOUDFLARE_BROWSER_QA',passed:true,semanticSnapshotId:candidate.snapshot.semanticSnapshotId,snapshotId:candidate.snapshot.semanticSnapshotId,pagePlanDigest:candidate.snapshot.semanticContent.vfrLineage.pagePlanDigest,publicationIrDigest:candidate.snapshot.semanticContent.visualReportIr.publicationIrDigest,sourceResultDigest:candidate.snapshot.semanticContent.vfrDeepManuscriptDigest,rendererVersion:contract.rendererVersion,compositionVersion:contract.compositionVersion,verificationMode:contract.verificationMode,pageSequenceValid:true,hiddenOrZeroGeometryCount:0,hiddenRequiredContentCount:0,expectedPageCount:contract.expectedPageCount,actualPageCount:contract.expectedPageCount,pageCount:contract.expectedPageCount,diagramRegistryValid:true,undefinedText:false,brokenImages:0,overflowCount:0,errorCount:0,outputDigest:hash(html),timings:{totalRequestMs:1},htmlBytes:Buffer.byteLength(html),imageCount:15}});}}};
 return {env,objects,writes,get calls(){return calls;}};
}
const success=fixture();const result=await runZwrNativeRendererAcceptance(success.env);assert.equal(result.sequentialRuns,8);assert.equal(result.productionAdmissionGranted,false);assert.equal(success.calls,8);assert.equal(success.writes.at(-1),root+'generation-admission.json');
const admission=JSON.parse(success.objects.get(root+'generation-admission.json')),receiptText=success.objects.get(admission.rendererReceiptKey);assert.equal(hash(receiptText),admission.rendererAcceptanceDigest);assert.deepEqual(JSON.parse(receiptText).measurements.map(x=>x.groupSize),[3,3,3,5,5,5,5,5]);
for(const badRun of [1,4,8]){const f=fixture({badRun});await assert.rejects(()=>runZwrNativeRendererAcceptance(f.env),{code:'NATIVE_RENDERER_RUN_FAILED'});assert.equal(f.writes.length,0);assert.equal(f.calls,badRun);}
const tampered=fixture({tamper:true});await assert.rejects(()=>runZwrNativeRendererAcceptance(tampered.env),{code:'NATIVE_RENDERER_CANDIDATE_TAMPERED'});assert.equal(tampered.calls,0);
const prod=fixture();prod.env.PHIOS_ENVIRONMENT='production';await assert.rejects(()=>runZwrNativeRendererAcceptance(prod.env),{code:'QA_ONLY'});assert.equal(prod.calls,0);
const missing=fixture();missing.objects.delete(root+'renderer-manifest.json');await assert.rejects(()=>runZwrNativeRendererAcceptance(missing.env),{code:'NATIVE_RENDERER_MANIFEST_REQUIRED'});assert.equal(missing.calls,0);
const {onRequest}=await import('../functions/api/zwr-native-renderer-acceptance.js');
const origin='https://qa.phios-github.pages.dev';
assert.equal((await onRequest({request:new Request(origin+'/api/zwr-native-renderer-acceptance'),env:{}})).status,405);
assert.equal((await onRequest({request:new Request(origin+'/api/zwr-native-renderer-acceptance',{method:'POST',headers:{origin:'https://wrong.example'}}),env:{}})).status,403);
assert.equal((await onRequest({request:new Request(origin+'/api/zwr-native-renderer-acceptance',{method:'POST',headers:{origin}}),env:{}})).status,401);
console.log('PASS: OFFLINE native preflight; frozen accepted source; sequential 3+5; tamper/non-QA/missing authority denied; runs 1/4/8 failures write no admission; no provider calls. Deployed browser proof NOT_RUN.');
'@
  }
 )
# Preflight all destinations before writing. Preserve all unrelated edits.
foreach ($entry in $payload) {
  $destination=Join-Path $Repo $entry.Path
  if (Test-Path $destination) {
    if ((Get-Sha256 ([IO.File]::ReadAllBytes($destination))) -ne $entry.Sha256) { throw "Existing file differs; review required: $($entry.Path)" }
  }
}
foreach ($entry in $payload) {
  $destination=Join-Path $Repo $entry.Path
  if (!(Test-Path $destination)) {
    [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($destination)) | Out-Null
    # A single LF is part of the reviewed payload digest.
    $text=$entry.Text.Replace("`r`n","`n").TrimEnd("`r","`n")+"`n"
    [IO.File]::WriteAllText($destination,$text,$utf8)
  }
  if ((Get-Sha256 ([IO.File]::ReadAllBytes($destination))) -ne $entry.Sha256) { throw "Installed payload digest mismatch: $($entry.Path)" }
}
Push-Location $Repo
try {
  foreach ($entry in $payload) { Run-Checked 'node' @('--check',$entry.Path) }
  Run-Checked 'node' @('scripts/check-zwr-native-renderer-qa.mjs')
  Run-Checked 'npm.cmd' @('run','check:cloudflare-function-import-compat')
  $output=Join-Path ([IO.Path]::GetTempPath()) ('phios-zwr-native-qa-'+[Guid]::NewGuid().ToString('N'))
  Run-Checked 'node' @('scripts/prepare-zwr-native-renderer-qa.mjs',$output)
  Write-Host 'PATCH AND OFFLINE PREPARATION PASS. No generation admission exists from this preparation.'
  if ($Action -eq 'Deploy') {
    $configuration=Get-Content -LiteralPath 'wrangler.jsonc' -Raw | ConvertFrom-Json
    $preview=$configuration.env.preview
    if ($preview.vars.PHIOS_ENVIRONMENT -ne 'qa' -or $preview.d1_databases[0].database_id -ne 'c2c6e313-9bc8-4fd4-89b1-36f3d764dad8') { throw 'QA sandbox target mismatch' }
    if (!($preview.services | Where-Object { $_.binding -eq 'METHOD_REPORT_RENDERER' -and $_.service -eq 'phios-method-report-renderer-qa' })) { throw 'Private QA renderer binding mismatch' }
    if (!($preview.r2_buckets | Where-Object { $_.binding -eq 'PRIVATE_REPORTS' -and $_.bucket_name -eq 'phios-private-reports-sandbox' })) { throw 'Private QA reports bucket mismatch' }
    Run-Checked 'npx.cmd' @('--no-install','wrangler','whoami')
    Run-Checked 'npm.cmd' @('run','check:shared-report-e2e:readiness-v2')
    Run-Checked 'npm.cmd' @('run','build:pages')
    Run-Checked 'npx.cmd' @('--no-install','wrangler','pages','deploy','.pages-output','--project-name','phios-github','--branch','qa','--commit-dirty=true')
    Run-Checked 'npx.cmd' @('--no-install','wrangler','r2','object','put','phios-private-reports-sandbox/qa/method-delivery/ZWR/accepted-renderer-candidate.json','--remote','--file',(Join-Path $output 'candidate.json'),'--content-type','application/json')
    # Explicit private QA manifest is uploaded last. It allows rendering only.
    Run-Checked 'npx.cmd' @('--no-install','wrangler','r2','object','put','phios-private-reports-sandbox/qa/method-delivery/ZWR/renderer-manifest.json','--remote','--file',(Join-Path $output 'manifest.json'),'--content-type','application/json')
    Write-Host 'NATIVE QA ENTRY DEPLOYED AND FROZEN FIXTURE UPLOADED. Real renderer campaign still NOT_RUN.'
    Write-Host 'Sign in at https://qa.phios-github.pages.dev/account/ and run this in the browser console once:'
    Write-Host "fetch('/api/zwr-native-renderer-acceptance',{method:'POST',credentials:'same-origin'}).then(async r=>console.log(r.status,await r.json()))"
  }
} finally { Pop-Location }
