import {authenticate,digest,requireSameOrigin} from '../account/oidc-auth.js';
import {generateAndReleaseAccountZiwei,openAccountZiweiMaterial,listAccountZiweiMaterials} from '../account/ziwei-account-delivery.js';

const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow, noarchive'};
const NATURAL=new Set(['S02','S03','S04','S05','S06','S07','S08','S09','S10','S11']);
const fail=(code,status=409,details={})=>Object.assign(new Error(code),{code,status,details});
function proofKey(reportId){return 'qa/shared-report-e2e/'+reportId+'.json';}
function parseReceipt(row){try{return JSON.parse(row?.verifier_receipt||'null')}catch{return null}}
function assertR5(candidate){
 const s=candidate?.snapshot;
 if(s?.compositionVersion!=='ZIWEI-PROFESSIONAL-SYNTHESIS-R5')throw fail('SHARED_E2E_R5_SNAPSHOT_REQUIRED');
 const rows=(s.semanticContent?.sections||[]).filter(x=>NATURAL.has(x.sectionId));
 if(rows.length!==10)throw fail('SHARED_E2E_R5_SECTION_SET_INCOMPLETE');
 const bad=rows.filter(x=>x.professionalSynthesis?.status!=='PASS'
  ||x.professionalSynthesis?.composerStatus!=='PASS'
  ||x.professionalSynthesis?.referenceGoverned!==true
  ||x.professionalSynthesis?.referenceId!=='ZIWEI-PROFESSIONAL-SYNTHESIS-R5'
  ||x.professionalSynthesis?.composerOwner!=='REPORT-PRO-COMPOSER-R1'
  ||x.professionalSynthesis?.providerCalled!==true
  ||x.professionalSynthesis?.verificationAccepted!==true
  ||x.professionalSynthesis?.editorialQuality?.accepted!==true
  ||x.professionalSynthesis?.actualTier!=='T3_GOVERNED_DEEP_COMPOSITION'
  ||x.professionalSynthesis?.model!=='gpt-5.6-sol'
  ||!(x.professionalSynthesis?.semanticReviewCalls>0)
  ||!(x.professionalSynthesis?.transportCalls>1)
  ||!x.professionalSynthesis?.compositionDigest);
 if(bad.length)throw fail('SHARED_E2E_REFERENCE_GOVERNED_COMPOSITION_NOT_PROVEN',409,{sections:bad.map(x=>x.sectionId)});
 return rows;
}
async function phase1(context,body){
 const identity=await authenticate(context);if(!identity)throw fail('ACCOUNT_REQUIRED',401);
 if(context.env?.PHIOS_ENVIRONMENT!=='qa')throw fail('SHARED_E2E_QA_ONLY',403);
 if(!context.env?.PRIVATE_REPORTS?.put||!context.env?.PRIVATE_REPORTS?.get)throw fail('SHARED_E2E_STORAGE_REQUIRED',503);
 const sessionId=identity.sessionId;
 const released=await generateAndReleaseAccountZiwei(context,{personId:body.personId,locale:body.locale,targetContext:body.targetContext});
 const opened=await openAccountZiweiMaterial(context,released.reportId);
 const candidate=opened.candidate,rows=assertR5(candidate),receipt=parseReceipt(opened.row);
 if(!receipt?.passed||receipt.semanticSnapshotId!==candidate.snapshot.semanticSnapshotId||receipt.pageCount!==39||opened.row.snapshot_id!==candidate.snapshot.semanticSnapshotId)throw fail('SHARED_E2E_RENDER_OR_SNAPSHOT_PROOF_FAILED');
 const library=await listAccountZiweiMaterials(context);
 if(!library.some(x=>x.reportId===released.reportId&&x.status==='RELEASED'))throw fail('SHARED_E2E_ACCOUNT_LIBRARY_MISSING_RELEASE');
 const seed={
  schemaVersion:'PHI-OS-SHARED-REPORT-DELIVERY-E2E-PROOF-v1.0.0',
  state:'PHASE1_RELEASED_AND_OPENED',
  sourceMethod:'ZWR',
  composerId:'REPORT-PRO-COMPOSER-R1',
  referenceId:'ZIWEI-PROFESSIONAL-SYNTHESIS-R5',
  accountIdHash:await digest(identity.userId),
  reportId:released.reportId,
  purchaseId:candidate.purchaseId,
  locale:candidate.locale,
  personIdHash:await digest(candidate.personId),
  semanticSnapshotId:candidate.snapshot.semanticSnapshotId,
  outputDigest:opened.row.output_digest,
  compositionVersion:candidate.snapshot.compositionVersion,
  model:'gpt-5.6-sol',
  sectionCount:rows.length,
  verifierAccepted:rows.every(x=>x.professionalSynthesis.verificationAccepted===true),
  referenceGoverned:rows.every(x=>x.professionalSynthesis.referenceGoverned===true),
  rendererPassed:receipt.passed===true,
  rendererPageCount:receipt.pageCount,
  releasedMaterial:true,
  accountLibraryVisible:true,
  firstAuthenticatedSessionId:sessionId,
  firstOpenedAt:new Date().toISOString(),
  requiresDifferentAuthenticatedSessionForFinalProof:true
 };
 await context.env.PRIVATE_REPORTS.put(proofKey(released.reportId),JSON.stringify(seed),{httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});
 return {...seed,nextAction:'LOGOUT_LOGIN_THEN_POST_REOPEN',proofKey:proofKey(released.reportId)};
}
async function phase2(context,body){
 const identity=await authenticate(context);if(!identity)throw fail('ACCOUNT_REQUIRED',401);
 if(context.env?.PHIOS_ENVIRONMENT!=='qa')throw fail('SHARED_E2E_QA_ONLY',403);
 const object=await context.env?.PRIVATE_REPORTS?.get?.(proofKey(body.reportId));if(!object)throw fail('SHARED_E2E_PHASE1_PROOF_REQUIRED',404);
 const phase1=await object.json();
 if(phase1.accountIdHash!==await digest(identity.userId))throw fail('SHARED_E2E_ACCOUNT_MISMATCH',403);
 const secondSessionId=identity.sessionId;
 if(!phase1.firstAuthenticatedSessionId||phase1.firstAuthenticatedSessionId===secondSessionId)throw fail('SHARED_E2E_NEW_LOGIN_SESSION_REQUIRED',409);
 const opened=await openAccountZiweiMaterial(context,body.reportId),candidate=opened.candidate,rows=assertR5(candidate),receipt=parseReceipt(opened.row);
 const library=await listAccountZiweiMaterials(context);
 if(!library.some(x=>x.reportId===body.reportId&&x.status==='RELEASED'))throw fail('SHARED_E2E_REOPEN_LIBRARY_MISSING');
 if(candidate.snapshot.semanticSnapshotId!==phase1.semanticSnapshotId||opened.row.output_digest!==phase1.outputDigest||opened.row.snapshot_id!==phase1.semanticSnapshotId)throw fail('SHARED_E2E_IMMUTABILITY_MISMATCH');
 const final={
  ...phase1,
  state:'PASS',
  sharedDeliveryAuthorityEligible:true,
  reopenedAfterDifferentAuthenticatedSession:true,
  secondAuthenticatedSessionId:secondSessionId,
  reopenedSemanticSnapshotId:candidate.snapshot.semanticSnapshotId,
  reopenedOutputDigest:opened.row.output_digest,
  reopenedAt:new Date().toISOString(),
  sameImmutableSnapshot:true,
  sameImmutableRenderedMaterial:true,
  noProviderRegenerationOnReopen:true,
  sectionCount:rows.length,
  verifierAccepted:rows.every(x=>x.professionalSynthesis.verificationAccepted===true),
  rendererPassed:receipt?.passed===true,
  accountLibraryVisible:true
 };
 const privateProofDigest=await digest(JSON.stringify(final));
 const admissionReceipt={
  schemaVersion:'PHI-OS-SHARED-REPORT-DELIVERY-E2E-ADMISSION-RECEIPT-v1.0.0',
  state:'PASS',
  sourceMethod:'ZWR',
  composerId:'REPORT-PRO-COMPOSER-R1',
  referenceId:'ZIWEI-PROFESSIONAL-SYNTHESIS-R5',
  compositionVersion:'ZIWEI-PROFESSIONAL-SYNTHESIS-R5',
  model:'gpt-5.6-sol',
  verifierAccepted:final.verifierAccepted===true,
  rendererPassed:final.rendererPassed===true,
  rendererPageCount:39,
  releasedMaterial:true,
  accountLibraryVisible:true,
  reopenedAfterDifferentAuthenticatedSession:true,
  sameImmutableSnapshot:true,
  sameImmutableRenderedMaterial:true,
  noProviderRegenerationOnReopen:true,
  sharedDeliveryAuthorityEligible:true,
  privateProofDigest,
  admittedAt:final.reopenedAt
 };
 await context.env.PRIVATE_REPORTS.put(proofKey(body.reportId),JSON.stringify({...final,privateProofDigest,admissionReceipt}),{httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});
 return {state:'PASS',sharedDeliveryAuthorityEligible:true,admissionReceipt,proofKey:proofKey(body.reportId)};
}
export async function onRequest(context){
 try{
  if(context.request.method!=='POST')return Response.json({ok:false,code:'METHOD_NOT_ALLOWED'},{status:405,headers});
  requireSameOrigin(context.request);
  const body=await context.request.json();
  if(!body||!['generate-release-open','reopen'].includes(body.action))throw fail('SHARED_E2E_ACTION_INVALID',400);
  if(body.action==='generate-release-open'&&(typeof body.personId!=='string'||!['en','zh-Hans'].includes(body.locale)))throw fail('SHARED_E2E_SELECTION_INVALID',400);
  if(body.action==='reopen'&&typeof body.reportId!=='string')throw fail('SHARED_E2E_REPORT_ID_REQUIRED',400);
  const proof=body.action==='generate-release-open'?await phase1(context,body):await phase2(context,body);
  return Response.json({ok:true,proof},{status:200,headers});
 }catch(error){
  return Response.json({ok:false,code:error.code||'SHARED_REPORT_E2E_PROOF_FAILED',details:error.details||null},{status:error.status||409,headers});
 }
}
