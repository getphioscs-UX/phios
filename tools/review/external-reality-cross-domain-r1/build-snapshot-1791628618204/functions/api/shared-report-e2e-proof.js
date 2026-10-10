import {loadCanonicalPersonSubject} from '../account/canonical-person-store.js';
import {authenticate,digest,requireSameOrigin} from '../account/oidc-auth.js';
import {resolveMethodDeliveryAdapter} from '../account/method-report-delivery.js';
import {assertMethodRenderReceipt,resolveMethodDeliveryDelta,assertMethodGeneration} from '../report-delivery/method-render-contract.js';
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow, noarchive'};
const fail=(code,status=409)=>Object.assign(new Error(code),{code,status});
const proofKey=id=>'qa/shared-report-e2e/v2/'+id+'.json';
const parseReceipt=row=>{try{return JSON.parse(row.verifier_receipt)}catch{return null}};
async function proofSeal(env,proof){
 const {integritySeal,...payload}=proof;
 if(!env.AUTH_SESSION_SECRET)throw fail('SHARED_E2E_PROOF_SEAL_REQUIRED');
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.AUTH_SESSION_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return [...new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(JSON.stringify(payload))))].map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function save(env,key,proof){await env.PRIVATE_REPORTS.put(key,JSON.stringify({...proof,integritySeal:await proofSeal(env,proof)}),{httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});}
async function materialProof(opened){
 const identity=parseReceipt(opened.row)?.materialIdentity;
 return {semanticSnapshotId:opened.candidate.snapshot.semanticSnapshotId,outputDigest:opened.row.output_digest,materialIdentityDigest:await digest(JSON.stringify(identity)),manuscriptDigest:identity.manuscriptDigest,publicationIrDigest:identity.publicationIrDigest,pagePlanDigest:identity.pagePlanDigest,personIdHash:await digest(opened.candidate.personId)};
}
async function verifyMaterialProof(proof,opened){
 const actual=await materialProof(opened);
 for(const [key,value] of Object.entries(actual))if(proof[key]!==value)throw fail('SHARED_E2E_IMMUTABILITY_MISMATCH');
 if(proof.reportId!==opened.row.report_id||proof.generationVersion!==opened.candidate.snapshot.compositionVersion||proof.rendererVersion!==parseReceipt(opened.row)?.rendererVersion)throw fail('SHARED_E2E_IMMUTABILITY_MISMATCH');
}
const TARGET_METHODS=Object.freeze(['ZWR','AST','NUM','PROFILE','ECR','HD','FINANCIAL','WILL','CROSS']);
export async function requireMethodWave(env){
 const object=await env.PRIVATE_REPORTS.get('qa/shared-report-e2e/v2/method-deltas.json');
 if(!object)throw fail('SHARED_E2E_ALL_TARGET_METHOD_DELTAS_REQUIRED');
 const manifest=await object.json();
 if(manifest.schemaVersion!=='METHOD_DELIVERY_WAVE_PRIVATE_ADMISSION_V1'||!TARGET_METHODS.every(code=>manifest.methods?.filter(m=>m.methodCode===code&&m.status==='PASS'&&m.profileResolved===true&&m.deployedProofDigest).length===1))throw fail('SHARED_E2E_ALL_TARGET_METHOD_DELTAS_REQUIRED');
 return manifest;
}
// Partial phases are never shared authority. The final offline admission gate also
// requires all method deltas, an actual renderer campaign, and global regression.
export async function onRequest(context){
 try{
  if(context.request.method!=='POST')return Response.json({ok:false,code:'METHOD_NOT_ALLOWED'},{status:405,headers});
  requireSameOrigin(context.request);
  const identity=await authenticate(context);if(!identity)throw fail('ACCOUNT_REQUIRED',401);
  if(context.env.PHIOS_ENVIRONMENT!=='qa')throw fail('SHARED_E2E_QA_ONLY',403);
  if(!context.env.PRIVATE_REPORTS?.put||!context.env.PRIVATE_REPORTS?.get)throw fail('SHARED_E2E_STORAGE_REQUIRED',503);
  const body=await context.request.json();
  if(!body||!['generate-release-open','open-released','reopen','account-isolation','finalize'].includes(body.action))throw fail('SHARED_E2E_ACTION_INVALID',400);
  if(body.action==='generate-release-open'){
   if(context.env.SHARED_REPORT_E2E_LIVE_ALLOWED!=='true')throw fail('SHARED_E2E_LIVE_NOT_AUTHORIZED',403);
   // A native generation phase is independent of shared final admission.
   // The generator checks its deployed method admission before any paid call.
   if(typeof body.personId!=='string'||!['en','zh-Hans'].includes(body.locale))throw fail('SHARED_E2E_SELECTION_INVALID',400);
   const methodCode=body.methodCode||'ZWR',adapter=resolveMethodDeliveryAdapter(methodCode);
   const released=await adapter.generate(context,{personId:body.personId,locale:body.locale,targetContext:body.targetContext});
   const opened=await adapter.open(context,released.reportId),candidate=opened.candidate,receipt=parseReceipt(opened.row);
   await assertMethodGeneration(candidate);
   const delta=resolveMethodDeliveryDelta(candidate);assertMethodRenderReceipt(candidate,receipt);
   if(!(await adapter.list(context)).some(x=>x.reportId===released.reportId&&x.status==='RELEASED'))throw fail('SHARED_E2E_ACCOUNT_LIBRARY_MISSING_RELEASE');
   const proof={schemaVersion:'PHI-OS-SHARED-REPORT-E2E-PROOF-v2',state:'PHASE1_RELEASED_AND_OPENED',sharedDeliveryAuthorityEligible:false,methodCode,generationVersion:delta.compositionVersion,publicationVersion:delta.publicationVersion,rendererVersion:delta.rendererVersion,reportId:released.reportId,semanticSnapshotId:candidate.snapshot.semanticSnapshotId,outputDigest:opened.row.output_digest,accountIdHash:await digest(identity.userId),...(await materialProof(opened)),generationReleaseProven:true,releasedMaterialProven:true,reopenProven:false,firstAuthenticatedSessionHash:identity.sessionId,firstOpenedAt:new Date().toISOString(),actualAccountGenerateReleasePass:true,libraryPass:true,rendererPassed:true,rendererPageCount:receipt.pageCount};
   await save(context.env,proofKey(released.reportId),proof);
   return Response.json({ok:true,proof:{state:proof.state,reportId:proof.reportId,sharedDeliveryAuthorityEligible:false,nextAction:'LOGOUT_LOGIN_THEN_POST_REOPEN'}},{headers});
  }
  if(typeof body.reportId!=='string'||!/^[a-z0-9-]+$/i.test(body.reportId))throw fail('SHARED_E2E_REPORT_ID_REQUIRED',400);
  if(body.action==='open-released'){
   const adapter=resolveMethodDeliveryAdapter(body.methodCode||'ZWR'),opened=await adapter.open(context,body.reportId);
   await assertMethodGeneration(opened.candidate);const receipt=parseReceipt(opened.row),delta=assertMethodRenderReceipt(opened.candidate,receipt);
   if(!(await adapter.list(context)).some(x=>x.reportId===body.reportId&&x.status==='RELEASED'))throw fail('SHARED_E2E_ACCOUNT_LIBRARY_MISSING_RELEASE');
   const prior=await context.env.PRIVATE_REPORTS.get(proofKey(body.reportId));let proof;
   if(prior){proof=await prior.json();if(proof.integritySeal!==await proofSeal(context.env,proof)||proof.accountIdHash!==await digest(identity.userId))throw fail('SHARED_E2E_PROOF_TAMPERED');await verifyMaterialProof(proof,opened);}
   else proof={schemaVersion:'PHI-OS-SHARED-REPORT-E2E-PROOF-v2',methodCode:delta.methodCode,generationVersion:delta.compositionVersion,publicationVersion:delta.publicationVersion,rendererVersion:delta.rendererVersion,reportId:body.reportId,accountIdHash:await digest(identity.userId),firstAuthenticatedSessionHash:identity.sessionId,...(await materialProof(opened)),generationReleaseProven:false,actualAccountGenerateReleasePass:false,reopenProven:false};
   await save(context.env,proofKey(body.reportId),{...proof,state:'RELEASED_MATERIAL_PROVEN',releasedMaterialProven:true,libraryPass:true,sharedDeliveryAuthorityEligible:false});
   return Response.json({ok:true,proof:{state:'RELEASED_MATERIAL_PROVEN',generationReleaseProven:proof.generationReleaseProven===true,releasedMaterialProven:true,sharedDeliveryAuthorityEligible:false}},{headers});
  }
  const object=await context.env.PRIVATE_REPORTS.get(proofKey(body.reportId));if(!object)throw fail('SHARED_E2E_PHASE1_PROOF_REQUIRED',404);
  const proof=await object.json();if(proof.integritySeal!==await proofSeal(context.env,proof)||proof.reportId!==body.reportId)throw fail('SHARED_E2E_PROOF_TAMPERED');
  const adapter=resolveMethodDeliveryAdapter(proof.methodCode);
  const accountHash=await digest(identity.userId);
  if(body.action==='reopen'){
   if(proof.accountIdHash!==accountHash)throw fail('SHARED_E2E_ACCOUNT_MISMATCH',403);
   const sessionHash=identity.sessionId;
   if(!proof.firstAuthenticatedSessionHash||proof.firstAuthenticatedSessionHash===sessionHash)throw fail('SHARED_E2E_NEW_LOGIN_SESSION_REQUIRED');
   const previousSession=await context.env.RUNTIME_DB.prepare('SELECT revoked_at FROM account_verified_sessions WHERE session_hash=? AND user_id=?').bind(proof.firstAuthenticatedSessionHash,identity.userId).first();
   if(previousSession?.revoked_at==null)throw fail('SHARED_E2E_LOGOUT_REQUIRED');
   const opened=await adapter.open(context,body.reportId);assertMethodRenderReceipt(opened.candidate,parseReceipt(opened.row));
   await verifyMaterialProof(proof,opened);
   if(opened.candidate.snapshot.semanticSnapshotId!==proof.semanticSnapshotId||opened.row.snapshot_id!==proof.semanticSnapshotId||opened.row.output_digest!==proof.outputDigest)throw fail('SHARED_E2E_IMMUTABILITY_MISMATCH');
   if(!(await adapter.list(context)).some(x=>x.reportId===body.reportId))throw fail('SHARED_E2E_REOPEN_LIBRARY_MISSING');
   const updated={...proof,state:'REOPEN_PROVEN_PENDING_ISOLATION_AND_STABILITY',secondAuthenticatedSessionHash:sessionHash,differentSessionReopenPass:true,reopenProven:true,logoutVerified:true,sameImmutableSnapshot:true,sameImmutableRenderedMaterial:true,noProviderRegenerationOnReopen:true,noRendererRegenerationOnReopen:true,reopenedAt:new Date().toISOString(),sharedDeliveryAuthorityEligible:false};
   await save(context.env,proofKey(body.reportId),updated);
   return Response.json({ok:true,proof:{state:updated.state,sharedDeliveryAuthorityEligible:false}},{headers});
  }
  if(body.action==='finalize'){
   if(accountHash!==proof.accountIdHash)throw fail('SHARED_E2E_ACCOUNT_MISMATCH',403);
   await verifyMaterialProof(proof,await adapter.open(context,body.reportId));
   await requireMethodWave(context.env);
   if(!proof.generationReleaseProven||!proof.releasedMaterialProven||!proof.reopenProven||!proof.actualAccountGenerateReleasePass||!proof.libraryPass||!proof.differentSessionReopenPass||!proof.logoutVerified||!proof.sameImmutableSnapshot||!proof.sameImmutableRenderedMaterial||!proof.noProviderRegenerationOnReopen||!proof.noRendererRegenerationOnReopen||!proof.secondAccountIsolationPass)throw fail('SHARED_E2E_REQUIRED_LIVE_PHASES_INCOMPLETE');
   const stabilityObject=await context.env.PRIVATE_REPORTS.get('qa/shared-report-e2e/v2/renderer-stability/'+proof.rendererVersion+'.json');
   if(!stabilityObject)throw fail('SHARED_E2E_RENDERER_STABILITY_REQUIRED');
   const stability=await stabilityObject.json();
   if(stability.schemaVersion!=='SHARED_RENDERER_STABILITY_RECEIPT_V1'||stability.rendererVersion!==proof.rendererVersion||stability.semanticSnapshotId!==proof.semanticSnapshotId||stability.scope!=='DEPLOYED_PRIVATE_BROWSER'||stability.status!=='PASS'||stability.sequential!==true||!Array.isArray(stability.measurements)||stability.measurements.length!==8||!stability.measurements.every((m,i)=>m.sequence===i+1&&m.groupSize===(i<3?3:5)&&m.pageCount===m.expectedPageCount&&m.passed===true&&m.pageCount>0&&m.browserLaunchFailures===0&&m.timeouts===0&&m.overflowFailures===0&&m.brokenImageFailures===0&&m.pageDriftFailures===0&&m.rendererErrors===0))throw fail('SHARED_E2E_RENDERER_STABILITY_REQUIRED');
   const globalObject=await context.env.PRIVATE_REPORTS.get('qa/shared-report-e2e/v2/global-regression.json');
   const global=globalObject?await globalObject.json():null;
   if(global?.status!=='PASS'||global.scope!=='POST_LIVE_GLOBAL_REGRESSION'||global.privateProofDigest!==await digest(JSON.stringify(proof)))throw fail('SHARED_E2E_POST_LIVE_GLOBAL_REGRESSION_REQUIRED');
   const admissionReceipt={schemaVersion:'PHI-OS-SHARED-REPORT-E2E-REFERENCE-v2',finalSharedAuthorityState:'PASS',sharedDeliveryAuthorityEligible:true,referenceMethod:proof.methodCode,referenceGenerationVersion:proof.generationVersion,referencePublicationVersion:proof.publicationVersion,referenceRendererVersion:proof.rendererVersion,rendererStabilityPass:true,generationReleaseProven:true,releasedMaterialProven:true,reopenProven:true,actualAccountGenerateReleasePass:true,libraryPass:true,differentSessionReopenPass:true,logoutVerified:true,sameImmutableSnapshot:true,sameImmutableRenderedMaterial:true,noProviderRegenerationOnReopen:true,noRendererRegenerationOnReopen:true,secondAccountIsolationPass:true,privateProofDigest:await digest(JSON.stringify(proof)),rendererStabilityDigest:await digest(JSON.stringify(stability)),admittedAt:new Date().toISOString()};
   await save(context.env,proofKey(body.reportId),{...proof,state:'PASS',admissionReceipt});
   return Response.json({ok:true,proof:{state:'PASS',admissionReceipt}},{headers});
  }
  if(accountHash===proof.accountIdHash)throw fail('SHARED_E2E_SECOND_ACCOUNT_REQUIRED');
  // Only expected authorization denials count. Infrastructure errors cannot prove isolation.
  let denied=false;
  try{await adapter.open(context,body.reportId)}catch(error){denied=error.status===404||error.message==='REPORT_UNAVAILABLE';if(!denied)throw error;}
  if(!denied)throw fail('SHARED_E2E_CROSS_ACCOUNT_OPEN_LEAK');
  if((await adapter.list(context)).some(x=>x.reportId===body.reportId))throw fail('SHARED_E2E_CROSS_ACCOUNT_LIBRARY_LEAK');
  let subjectDenied=false;
  const subjectRow=await context.env.RUNTIME_DB.prepare('SELECT person_id FROM account_method_report_materials WHERE owner_account_id=? AND report_id=?').bind((await context.env.RUNTIME_DB.prepare('SELECT owner_account_id FROM account_method_report_materials WHERE report_id=?').bind(body.reportId).first())?.owner_account_id,body.reportId).first();
  if(!subjectRow||await digest(subjectRow.person_id)!==proof.personIdHash)throw fail('SHARED_E2E_PROOF_TAMPERED');
  try{await loadCanonicalPersonSubject(context.env,identity.userId,subjectRow.person_id)}catch(error){subjectDenied=error.code==='PERSON_NOT_FOUND'&&error.status===404;if(!subjectDenied)throw error;}
  if(!subjectDenied)throw fail('SHARED_E2E_CROSS_ACCOUNT_SUBJECT_LEAK');
  const updated={...proof,state:'ISOLATION_PROVEN_PENDING_RENDERER_STABILITY',crossAccountOpen:'DENIED',crossAccountLibraryLeak:0,crossAccountSubjectLeak:0,crossAccountMaterialLeak:0,releaseMetadataSurface:'AUTHORIZED_MATERIAL_OPEN_ADAPTER',secondAccountIsolationPass:true,secondAccountHash:accountHash,sharedDeliveryAuthorityEligible:false};
  await save(context.env,proofKey(body.reportId),updated);
  return Response.json({ok:true,proof:{state:updated.state,sharedDeliveryAuthorityEligible:false}},{headers});
 }catch(error){return Response.json({ok:false,code:error.code||'SHARED_REPORT_E2E_PROOF_FAILED'},{status:error.status||409,headers});}
}
