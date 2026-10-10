param([ValidateSet('Apply','Deploy')][string]$Action='Deploy')
$ErrorActionPreference='Stop'
Set-Location $PSScriptRoot
if (!(Test-Path package.json) -or !(Test-Path wrangler.jsonc)) { throw 'Save this script in C:\phios and run there.' }
function Checked([string]$Program,[string[]]$Arguments) {
  & $Program @Arguments
  if ($LASTEXITCODE -ne 0) { throw "$Program failed: $LASTEXITCODE" }
}
function Hash-Text([string]$Text) {
  $sha=[Security.Cryptography.SHA256]::Create()
  try { return ([BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($Text)))).Replace('-','').ToLowerInvariant() } finally { $sha.Dispose() }
}
$payloads=@()
$payloads += @{ Path='functions/report-delivery/zwr-native-renderer-acceptance.js'; Before='5a02e65acc63aa1e30d9f4dff9888b277081ea912a0de0b420d14e6b57053127'; After='6028c0f96d68f0f9b8d554152eae81205319834ec35c231b475035f8d60748cc'; Text=@'
import {digest} from '../account/oidc-auth.js';
import {assertMethodGeneration,assertMethodRenderReceipt} from './method-render-contract.js';
import {ZWR_VFR_METHOD_PROFILE as profile} from './ziwei-vfr-profile-policy.js';
const sourceAcceptanceDigest='81e31ab108602135616965c0c92d838085ddb0f5561c02c02ceb09f8958dc611';
const root='qa/method-delivery/ZWR/';
const fail=(code,status=409,details)=>Object.assign(new Error(code),{code,status,details});
export async function runZwrNativeRendererAcceptance(env,step=null){
 if(env.PHIOS_ENVIRONMENT!=='qa')throw fail('QA_ONLY',403);
 const manifestObject=await env.PRIVATE_REPORTS?.get(root+'renderer-manifest.json');
 const manifest=manifestObject?await manifestObject.json():null;
 if(manifest?.schemaVersion!=='ZWR_NATIVE_RENDERER_QA_MANIFEST_V1'||manifest.authorized!==true||manifest.scope!=='DEPLOYED_PRIVATE_BROWSER'||manifest.sourceAcceptanceDigest!==sourceAcceptanceDigest||manifest.candidateKey!==root+'accepted-renderer-candidate.json')throw fail('NATIVE_RENDERER_MANIFEST_REQUIRED',403);
 const object=await env.PRIVATE_REPORTS.get(manifest.candidateKey);if(!object)throw fail('NATIVE_RENDERER_CANDIDATE_REQUIRED');
 const text=await object.text();if(await digest(text)!==manifest.candidateDigest)throw fail('NATIVE_RENDERER_CANDIDATE_TAMPERED');
 const candidate=JSON.parse(text),contract=await assertMethodGeneration(candidate);
 if(candidate.schemaVersion!=='ZWR-VFR-R1-ACCEPTED-RENDERER-FIXTURE-v1'||candidate.scope!=='CONTROLLED_QA_ONLY'||contract.methodCode!=='ZWR'||contract.rendererVersion!==profile.rendererVersion||candidate.snapshot.semanticSnapshotId!==manifest.semanticSnapshotId)throw fail('NATIVE_RENDERER_CANDIDATE_MISMATCH');
 if(!env.METHOD_REPORT_RENDERER?.fetch)throw fail('REPORT_BROWSER_VERIFIER_NOT_CONFIGURED',503);
 if(step&&step.candidateDigest!==manifest.candidateDigest)throw fail('NATIVE_RENDERER_CAMPAIGN_SOURCE_CHANGED');
 const measurements=step?[...step.measurements]:[];
 const firstSequence=measurements.length+1,lastSequence=step?firstSequence:8;
 for(let sequence=firstSequence;sequence<=lastSequence;sequence++){
  const groupSize=sequence<=3?3:5,index=sequence<=3?sequence:sequence-3;
  const response=await env.METHOD_REPORT_RENDERER.fetch(new Request('https://method-report-renderer.internal/verify',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({candidate,method:'ZWR',compositionVersion:contract.compositionVersion})}));
  const output=await response.json();
  if(!response.ok)throw fail('NATIVE_RENDERER_RUN_FAILED',422,{sequence:measurements.length+1,stage:output.stage,reason:output.reason||output.code});
  const receipt=output.verification;assertMethodRenderReceipt(candidate,receipt);
  if(receipt.schemaVersion!=='METHOD_BROWSER_VERIFICATION_V1'||receipt.verifier!=='CLOUDFLARE_BROWSER_QA'||receipt.outputDigest!==await digest(output.html)||!receipt.timings||!Number.isFinite(receipt.timings.totalRequestMs)||receipt.publicationIrDigest!==candidate.snapshot.semanticContent.visualReportIr.publicationIrDigest||receipt.sourceResultDigest!==candidate.snapshot.semanticContent.vfrDeepManuscriptDigest)throw fail('NATIVE_RENDERER_RECEIPT_INVALID');
  measurements.push({groupSize,index,sequence:measurements.length+1,passed:true,pageCount:receipt.pageCount,expectedPageCount:contract.expectedPageCount,imageCount:receipt.imageCount,htmlBytes:receipt.htmlBytes,timings:receipt.timings,outputDigest:receipt.outputDigest,browserLaunchFailures:0,timeouts:0,overflowFailures:0,brokenImageFailures:0,pageDriftFailures:0,rendererErrors:0});
 }
 if(measurements.length<8)return {ok:true,status:'IN_PROGRESS',sequentialRuns:measurements.length,providerCalls:0,measurements};
 const receipt={schemaVersion:'ZWR_NATIVE_RENDERER_STABILITY_RECEIPT_V1',scope:'DEPLOYED_PRIVATE_BROWSER',status:'PASS',methodCode:'ZWR',sourceAcceptanceDigest,candidateDigest:manifest.candidateDigest,rendererVersion:contract.rendererVersion,compositionVersion:contract.compositionVersion,semanticSnapshotId:candidate.snapshot.semanticSnapshotId,sequential:true,measurements,providerCalls:0,recordedAt:new Date().toISOString()};
 const receiptText=JSON.stringify(receipt),rendererAcceptanceDigest=await digest(receiptText);
 await env.PRIVATE_REPORTS.put(root+'renderer-stability/'+rendererAcceptanceDigest+'.json',receiptText,{httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});
 // Commit admission last: a partial or failed campaign cannot create admission.
 await env.PRIVATE_REPORTS.put(root+'generation-admission.json',JSON.stringify({schemaVersion:'METHOD_GENERATION_ADMISSION_V1',methodCode:'ZWR',state:'ACCEPTED',scope:'DEPLOYED_PRIVATE_BROWSER',profileVersion:profile.profileVersion,rendererVersion:profile.rendererVersion,sourceAcceptanceDigest,rendererAcceptanceDigest,rendererReceiptKey:root+'renderer-stability/'+rendererAcceptanceDigest+'.json',semanticSnapshotId:candidate.snapshot.semanticSnapshotId,recordedAt:receipt.recordedAt}),{httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});
 return {ok:true,status:'PASS',sequentialRuns:8,providerCalls:0,rendererAcceptanceDigest,sharedDeliveryAuthorityEligible:false,productionAdmissionGranted:false,...(step?{measurements}:{})};
}
'@
}
$payloads += @{ Path='functions/report-delivery/zwr-native-renderer-campaign.js'; Before='8ba67e071c63f7d25531b9f46b3bc58d3b38bf376f23374e01dacf5871f913c5'; After='ed7567d7bdecd26589794fff855c28ed185aa80edd2220fd1f1948fb81a52a86'; Text=@'
import {runZwrNativeRendererAcceptance} from './zwr-native-renderer-acceptance.js';
const root='qa/method-delivery/ZWR/';
const fail=(code,status=409)=>Object.assign(new Error(code),{code,status});
const metadata={httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}};
export async function advanceNativeRendererCampaign(env,ownerAccountId,input){
 if(env.PHIOS_ENVIRONMENT!=='qa')throw fail('QA_ONLY',403);
 if(!ownerAccountId)throw fail('ACCOUNT_REQUIRED',401);
 if(input.action==='START'){
  const manifestObject=await env.PRIVATE_REPORTS?.get(root+'renderer-manifest.json');
  const manifest=manifestObject?await manifestObject.json():null;
  if(manifest?.schemaVersion!=='ZWR_NATIVE_RENDERER_QA_MANIFEST_V1'||manifest.authorized!==true||manifest.scope!=='DEPLOYED_PRIVATE_BROWSER'||manifest.candidateKey!==root+'accepted-renderer-candidate.json'||!/^[a-f0-9]{64}$/i.test(manifest.candidateDigest))throw fail('NATIVE_RENDERER_MANIFEST_REQUIRED',403);
  const campaignId=crypto.randomUUID();
  const state={schemaVersion:'ZWR_NATIVE_RENDERER_CAMPAIGN_V1',campaignId,ownerAccountId,candidateDigest:manifest.candidateDigest,status:'READY',measurements:[],createdAt:Date.now()};
  await env.PRIVATE_REPORTS.put(root+'renderer-campaigns/'+campaignId+'.json',JSON.stringify(state),metadata);
  return {ok:true,status:'READY',campaignId,sequentialRuns:0,providerCalls:0};
 }
 if(input.action!=='NEXT'||!/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(input.campaignId||''))throw fail('NATIVE_RENDERER_CAMPAIGN_REQUEST_INVALID',400);
 const key=root+'renderer-campaigns/'+input.campaignId+'.json',object=await env.PRIVATE_REPORTS.get(key);
 if(!object)throw fail('NATIVE_RENDERER_CAMPAIGN_NOT_FOUND',404);
 const state=await object.json();
 if(state.ownerAccountId!==ownerAccountId)throw fail('NATIVE_RENDERER_CAMPAIGN_OWNER_DENIED',403);
 if(state.status!=='READY')throw fail('NATIVE_RENDERER_CAMPAIGN_'+state.status);
 if(Date.now()-state.createdAt>30*60*1000)throw fail('NATIVE_RENDERER_CAMPAIGN_EXPIRED');
 if(input.sequence!==state.measurements.length+1||input.sequence>8)throw fail('NATIVE_RENDERER_CAMPAIGN_SEQUENCE_INVALID');
 const locked=await env.PRIVATE_REPORTS.put(key,JSON.stringify({...state,status:'RUNNING'}),{...metadata,onlyIf:{etagMatches:object.etag}});
 if(!locked)throw fail('NATIVE_RENDERER_CAMPAIGN_BUSY');
 try{
  const result=await runZwrNativeRendererAcceptance(env,{candidateDigest:state.candidateDigest,measurements:state.measurements});
  const complete=result.status==='PASS';
  await env.PRIVATE_REPORTS.put(key,JSON.stringify({...state,status:complete?'PASS':'READY',measurements:result.measurements,completedAt:Date.now(),result:complete?result:null}),metadata);
  const {measurements,...publicResult}=result;
  return {...publicResult,campaignId:state.campaignId};
 }catch(error){
  await env.PRIVATE_REPORTS.put(key,JSON.stringify({...state,status:'FAILED',failedSequence:input.sequence,errorCode:error.code||error.message}),metadata);
  throw error;
 }
}
'@
}
$payloads += @{ Path='functions/api/zwr-native-renderer-acceptance.js'; Before='be0d56092d6fc1b16f4d2bbba1fbca80c0d842dae1a786b5a4d97ce81bc46066'; After='a22c83b2e816b43912bd10505434f4cc6f41299108e59f51b51a561d407171be'; Text=@'
import {authenticate,requireSameOrigin} from '../account/oidc-auth.js';
import {advanceNativeRendererCampaign} from '../report-delivery/zwr-native-renderer-campaign.js';
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
export async function onRequest(context){
 try{
  if(context.request.method!=='POST')return Response.json({ok:false,code:'METHOD_NOT_ALLOWED'},{status:405,headers});
  requireSameOrigin(context.request);
  const identity=await authenticate(context);
  if(!identity)return Response.json({ok:false,code:'ACCOUNT_REQUIRED'},{status:401,headers});
  if(Number(context.request.headers.get('content-length')||0)>2048)throw Object.assign(new Error('REQUEST_TOO_LARGE'),{status:413});
  const body=await context.request.text();
  if(body.length>2048)throw Object.assign(new Error('REQUEST_TOO_LARGE'),{status:413});
  let input;try{input=JSON.parse(body);}catch{throw Object.assign(new Error('CAMPAIGN_ACTION_REQUIRED'),{code:'CAMPAIGN_ACTION_REQUIRED',status:400});}
  return Response.json(await advanceNativeRendererCampaign(context.env,identity.userId,input),{headers});
 }catch(error){return Response.json({ok:false,code:error.code||'NATIVE_RENDERER_ACCEPTANCE_FAILED',details:error.details||null},{status:error.status||409,headers});}
}
'@
}
$payloads += @{ Path='scripts/check-zwr-native-renderer-qa.mjs'; Before='602b47fdc4c9ff8530c38eb1be2a4fa31f6acc811d8336df899bf53972ec2d94'; After='da2b26d5fc976fd7fd6a96974ccba1d0850ccd00c88e4241be24fe72c063c01c'; Text=@'
// Offline transport tests. These receipts are never written to remote storage.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {buildAcceptedZwrRendererCandidate,sourceAcceptanceDigest} from './lib/zwr-native-renderer-candidate.mjs';
import {runZwrNativeRendererAcceptance} from '../functions/report-delivery/zwr-native-renderer-acceptance.js';
import {assertMethodGeneration} from '../functions/report-delivery/method-render-contract.js';
const hash=s=>createHash('sha256').update(s).digest('hex'),candidate=await buildAcceptedZwrRendererCandidate(),text=JSON.stringify(candidate),contract=await assertMethodGeneration(candidate),root='qa/method-delivery/ZWR/';
globalThis.fetch=async()=>{throw Error('PROVIDER_OR_NETWORK_FORBIDDEN');};
export function fixture({badRun=0,tamper=false}={}){
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
$payloads += @{ Path='scripts/check-zwr-native-renderer-campaign.mjs'; Before='4e99050888156801ce66422c610dba35d6d1bc3313b1823dae90dde7b34dcc4e'; After='4e99050888156801ce66422c610dba35d6d1bc3313b1823dae90dde7b34dcc4e'; Text=@'
import assert from 'node:assert/strict';
import {fixture} from './check-zwr-native-renderer-qa.mjs';
import {advanceNativeRendererCampaign as advance} from '../functions/report-delivery/zwr-native-renderer-campaign.js';
const admissionKey='qa/method-delivery/ZWR/generation-admission.json';
function campaignFixture(options){
 const f=fixture(options),store=f.env.PRIVATE_REPORTS,versions=new Map();
 const get=store.get.bind(store),put=store.put.bind(store);
 store.get=async key=>{const object=await get(key);return object?{...object,etag:String(versions.get(key)||0)}:null;};
 store.put=async(key,value,options)=>{
  if(options?.onlyIf?.etagMatches!==undefined&&options.onlyIf.etagMatches!==String(versions.get(key)||0))return null;
  versions.set(key,(versions.get(key)||0)+1);await put(key,value);return {etag:String(versions.get(key))};
 };
 return f;
}
const success=campaignFixture(),start=await advance(success.env,'account-a',{action:'START'});
assert.equal(success.calls,0);assert.equal(success.objects.has(admissionKey),false);
await assert.rejects(()=>advance(success.env,'account-b',{action:'NEXT',campaignId:start.campaignId,sequence:1}),{code:'NATIVE_RENDERER_CAMPAIGN_OWNER_DENIED'});
await assert.rejects(()=>advance(success.env,'account-a',{action:'NEXT',campaignId:start.campaignId,sequence:2}),{code:'NATIVE_RENDERER_CAMPAIGN_SEQUENCE_INVALID'});
let result;
for(let sequence=1;sequence<=8;sequence++){
 const before=success.calls;
 result=await advance(success.env,'account-a',{action:'NEXT',campaignId:start.campaignId,sequence});
 assert.equal(success.calls,before+1);assert.equal(result.sequentialRuns,sequence);
 assert.equal(success.objects.has(admissionKey),sequence===8);
 if(sequence<8)await assert.rejects(()=>advance(success.env,'account-a',{action:'NEXT',campaignId:start.campaignId,sequence}),{code:'NATIVE_RENDERER_CAMPAIGN_SEQUENCE_INVALID'});
}
assert.equal(result.status,'PASS');assert.equal(result.productionAdmissionGranted,false);
for(const badRun of [1,4,8]){
 const f=campaignFixture({badRun}),s=await advance(f.env,'account-a',{action:'START'});
 for(let sequence=1;sequence<badRun;sequence++)await advance(f.env,'account-a',{action:'NEXT',campaignId:s.campaignId,sequence});
 await assert.rejects(()=>advance(f.env,'account-a',{action:'NEXT',campaignId:s.campaignId,sequence:badRun}),{code:'NATIVE_RENDERER_RUN_FAILED'});
 assert.equal(f.objects.has(admissionKey),false);
 await assert.rejects(()=>advance(f.env,'account-a',{action:'NEXT',campaignId:s.campaignId,sequence:badRun}),{code:'NATIVE_RENDERER_CAMPAIGN_FAILED'});
}
const concurrent=campaignFixture(),s=await advance(concurrent.env,'account-a',{action:'START'});
const attempts=await Promise.allSettled([1,2].map(()=>advance(concurrent.env,'account-a',{action:'NEXT',campaignId:s.campaignId,sequence:1})));
assert.equal(attempts.filter(x=>x.status==='fulfilled').length,1);assert.equal(concurrent.calls,1);
const changed=campaignFixture(),c=await advance(changed.env,'account-a',{action:'START'});
const key='qa/method-delivery/ZWR/renderer-manifest.json',manifest=JSON.parse(changed.objects.get(key));manifest.candidateDigest='f'.repeat(64);changed.objects.set(key,JSON.stringify(manifest));
await assert.rejects(()=>advance(changed.env,'account-a',{action:'NEXT',campaignId:c.campaignId,sequence:1}));assert.equal(changed.calls,0);
console.log('PASS OFFLINE resumable campaign: one render/request; eight ordered runs; owner/sequence/CAS lock; failures 1/4/8 never admit; source drift denied. Live proof NOT_RUN.');
'@
}

# Preflight every file before modifying anything; preserve concurrent edits.
foreach ($entry in $payloads) {
  $entry.Text=$entry.Text.Replace("`r`n","`n").TrimEnd("`r","`n")+"`n"
  if ((Hash-Text $entry.Text) -ne $entry.After) { throw "Payload corrupted: $($entry.Path)" }
  if (Test-Path -LiteralPath $entry.Path) {
    $current=[IO.File]::ReadAllText((Join-Path $PWD $entry.Path)).Replace("`r`n","`n")
    $hash=Hash-Text $current
    if ($hash -ne $entry.Before -and $hash -ne $entry.After) { throw "Concurrent edit requires review: $($entry.Path)" }
  }
}
$backup=Join-Path $env:TEMP ('phios-renderer-1102-'+[DateTime]::UtcNow.ToString('yyyyMMdd-HHmmss-fff'))
foreach ($entry in $payloads) {
  if (Test-Path -LiteralPath $entry.Path) {
    $saved=Join-Path $backup $entry.Path
    [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($saved)) | Out-Null
    Copy-Item -LiteralPath $entry.Path -Destination $saved
  }
  $destination=Join-Path $PWD $entry.Path
  [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($destination)) | Out-Null
  [IO.File]::WriteAllText($destination,$entry.Text,(New-Object Text.UTF8Encoding($false)))
  Checked 'node' @('--check',$entry.Path)
}
Checked 'node' @('scripts/check-zwr-native-renderer-campaign.mjs')
Checked 'npm.cmd' @('run','check:cloudflare-function-import-compat')
Write-Host "PATCH PASS. Original files backed up outside repository: $backup"
if ($Action -eq 'Apply') { return }
@'
const fs=require('fs');const c=JSON.parse(fs.readFileSync('wrangler.jsonc','utf8').trim());const p=c.env?.preview;if(p?.vars?.PHIOS_ENVIRONMENT!=='qa'||!p?.r2_buckets?.some(x=>x.binding==='PRIVATE_REPORTS'&&x.bucket_name==='phios-private-reports-sandbox')||!p?.services?.some(x=>x.binding==='METHOD_REPORT_RENDERER'&&x.service==='phios-method-report-renderer-qa'))throw Error('QA binding configuration mismatch');console.log('QA bindings PASS');
'@ | node -
if ($LASTEXITCODE -ne 0) { throw 'QA binding guard failed' }
Checked 'npm.cmd' @('run','build:pages')
Checked 'npx.cmd' @('--no-install','wrangler','pages','deploy','.pages-output','--project-name','phios-github','--branch','qa','--commit-dirty=true')
Write-Host 'QA Pages deployed. Renderer and frozen fixture reused. Admission remains ungranted until eight real runs PASS. No commit/push/provider call.'
Write-Host 'Reload the QA account page, then run the browser console code supplied with this repair once.'
