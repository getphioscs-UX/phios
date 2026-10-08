import {sha256Stable,stableStringify} from '../interpretation-runtime/mir7-utils.js';
import {createCustomerDeliverySnapshot} from '../personal-reading/narrative/report-section-snapshot.js';
import {buildZwrVfrPagePlan,validateZwrVfrPagePlan,ZWR_VFR_PAGE_PLAN_VERSION} from '../personal-reading/visual-first/ziwei-vfr-page-plan.js';
export const fail=(code,status=409)=>Object.assign(new Error(code),{code,status});
const required=(value,code)=>{if(typeof value!=='string'||!value.trim())throw fail(code);return value;};
const hash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/i.test(value);
export function requireVfrAdmission(profile){
 const a=profile?.admission;
 if(profile?.methodId!=='ZWR'||a?.state!=='ACCEPTED'||a.rendererWired!==true||!hash(a.sourceAcceptanceDigest)||!hash(a.rendererAcceptanceDigest)||!hash(a.sourceResultDigest)||!hash(a.publicationIrDigest)||!hash(a.pagePlanDigest))throw fail('SHARED_E2E_VFR_ADMISSION_BLOCKED',503);
 // Shared delivery evidence never grants production activation.
}
export async function verifyVfrMaterial(opened,identity,profile,digest){
 const {candidate:c,row:r,html}=opened||{},s=c?.snapshot,v=s?.semanticContent,ir=v?.visualReportIr;
 if(c?.customerId!==identity.userId||r?.owner_account_id!==identity.userId)throw fail('SHARED_E2E_OWNER_MISMATCH',403);
 required(c.personId,'SHARED_E2E_CANONICAL_PERSON_REQUIRED');required(c.purchaseId,'SHARED_E2E_PURCHASE_REQUIRED');required(c.birthSourceRef,'SHARED_E2E_CANONICAL_SOURCE_REQUIRED');
 if(r.person_id!==c.personId||r.method_code!==profile.methodId||r.locale!==c.locale||!profile.locales.includes(c.locale)||c.scope!=='CONTROLLED_QA_ONLY')throw fail('SHARED_E2E_ACCOUNT_BINDING_MISMATCH');
 required(r.report_id,'SHARED_E2E_RELEASE_REQUIRED');required(r.released_at,'SHARED_E2E_RELEASE_REQUIRED');required(r.object_key,'SHARED_E2E_PRIVATE_MATERIAL_REQUIRED');
 if(c.schemaVersion!==profile.candidateSchemaVersion||c.generationSuccessor!==profile.compositionVersion||s?.methodId!==profile.methodId||s.locale!==c.locale||s.compositionVersion!==profile.compositionVersion||ir?.schemaVersion!==profile.publicationIrVersion||profile.pagePlanVersion!==ZWR_VFR_PAGE_PLAN_VERSION)throw fail('SHARED_E2E_VERSION_MISMATCH');
 if(s.immutable!==true||s.providerRegenerationOnReopen!==false||(await createCustomerDeliverySnapshot(s)).semanticSnapshotId!==s.semanticSnapshotId||r.snapshot_id!==s.semanticSnapshotId)throw fail('SHARED_E2E_SNAPSHOT_DIGEST_MISMATCH');
 const {publicationIrDigest,...seed}=ir;
 if(!hash(publicationIrDigest)||await sha256Stable(seed)!==publicationIrDigest||!hash(v.vfrDeepManuscriptDigest)||v.vfrDeepManuscriptDigest!==ir.sourceResultDigest||!hash(v.vfrCompactAuthoringPackDigest)||v.vfrCompactAuthoringPackDigest!==ir.authorityDigest)throw fail('SHARED_E2E_SOURCE_DIGEST_MISMATCH');
 if(ir.methodId!=='ZWR'||!Array.isArray(ir.sections)||ir.sections.length!==10||new Set(ir.sections.map(x=>x.sectionId)).size!==10||ir.sections.some((x,i)=>x.sectionId!==`S${String(i+2).padStart(2,'0')}`||!x.zhHans?.manuscript||!x.en?.manuscript||!Array.isArray(x.authorityRefs)||!x.authorityRefs.length))throw fail('SHARED_E2E_MANUSCRIPT_INCOMPLETE');
 if(profile.admission.sourceResultDigest!==ir.sourceResultDigest||profile.admission.publicationIrDigest!==publicationIrDigest)throw fail('SHARED_E2E_ACCEPTED_SOURCE_BINDING_MISMATCH');
 const pages=buildZwrVfrPagePlan({sections:ir.sections}),check=validateZwrVfrPagePlan({pages,sections:ir.sections,diagramIds:v.vfrDiagramData?.diagrams?.map(x=>x.id)||[]});
 if(!check.accepted||stableStringify(pages)!==stableStringify(v.vfrPagePlan)||c.physicalPageCount!==pages.length)throw fail('SHARED_E2E_PAGE_PLAN_MISMATCH');
 if(profile.admission.pagePlanDigest!==await sha256Stable(pages))throw fail('SHARED_E2E_ACCEPTED_PAGE_PLAN_MISMATCH');
 let receipt;try{receipt=JSON.parse(r.verifier_receipt)}catch{throw fail('SHARED_E2E_RENDER_RECEIPT_REQUIRED');}
 const outputDigest=await digest(html);
 if(typeof html!=='string'||!html.length||!hash(r.output_digest)||r.output_digest!==outputDigest||receipt?.passed!==true||receipt.semanticSnapshotId!==s.semanticSnapshotId||receipt.compositionVersion!==profile.compositionVersion||receipt.publicationIrDigest!==publicationIrDigest||receipt.sourceResultDigest!==ir.sourceResultDigest||receipt.pagePlanDigest!==await sha256Stable(pages)||receipt.pageCount!==pages.length||receipt.outputDigest!==outputDigest||receipt.brokenImages!==0||receipt.overflowCount!==0||receipt.errorCount!==0)throw fail('SHARED_E2E_RENDER_OR_OUTPUT_MISMATCH');
 return {reportId:r.report_id,methodId:s.methodId,compositionVersion:s.compositionVersion,semanticSnapshotId:s.semanticSnapshotId,publicationIrDigest,sourceResultDigest:ir.sourceResultDigest,pagePlanDigest:await sha256Stable(pages),pageCount:pages.length,outputDigest,personIdHash:await digest(c.personId),purchaseIdHash:await digest(c.purchaseId),canonicalSourceHash:await digest(c.birthSourceRef)};
}
// Dependencies are server-owned. No generator, renderer or provider dependency exists here.
export function createSharedReportE2eProofV2({contract,authenticate,requireSameOrigin,digest,open,list}){
 return async context=>{
  try{
   if(context.request.method!=='POST')throw fail('METHOD_NOT_ALLOWED',405);
   requireSameOrigin(context.request);
   const identity=await authenticate(context);if(!identity?.userId)throw fail('ACCOUNT_REQUIRED',401);
   if(context.env?.PHIOS_ENVIRONMENT!=='qa')throw fail('SHARED_E2E_QA_ONLY',403);
   required(identity.sessionId,'SHARED_E2E_AUTHENTICATED_SESSION_REQUIRED');
   const b=await context.request.json();
   if(!b||!['open-released','reopen'].includes(b.action)||typeof b.reportId!=='string'||!b.reportId||Object.keys(b).some(k=>!['action','reportId'].includes(k)))throw fail('SHARED_E2E_ACTION_INVALID',400);
   const profile=contract.profiles['ZWR:ZIWEI-VFR-R1-AUTO-DEEP-GENERATION-v3'];requireVfrAdmission(profile);
   const storage=context.env.PRIVATE_REPORTS;if(!storage?.get||!storage?.put)throw fail('SHARED_E2E_PRIVATE_STORAGE_REQUIRED',503);
   const owner=await digest(identity.userId),session=await digest(identity.sessionId),key=`qa/shared-report-e2e-v2/${owner}/${b.reportId}.json`;
   let first;
   if(b.action==='reopen'){
    const object=await storage.get(key);if(!object)throw fail('SHARED_E2E_FIRST_OPEN_REQUIRED',404);
    first=await object.json();const {proofDigest,...seed}=first;
    if(first.schemaVersion!=='PHI-OS-SHARED-REPORT-E2E-PROOF-v2'||first.state!=='FIRST_OPEN'||first.accountIdHash!==owner||first.reportId!==b.reportId||first.profileDigest!==await sha256Stable(profile)||proofDigest!==await sha256Stable(seed))throw fail('SHARED_E2E_FIRST_PROOF_INVALID');
    if(!hash(first.sessionHash)||first.sessionHash===session)throw fail('SHARED_E2E_NEW_LOGIN_SESSION_REQUIRED');
   }
   // These existing account functions revalidate entitlement, canonical consent,
   // active release, private candidate bytes and private HTML on every read.
   const material=await verifyVfrMaterial(await open(context,b.reportId),identity,profile,digest);
   if(material.reportId!==b.reportId)throw fail('SHARED_E2E_REPORT_ID_MISMATCH');
   if(!(await list(context)).some(x=>x.reportId===b.reportId&&x.status==='RELEASED'))throw fail('SHARED_E2E_LIBRARY_RELEASE_REQUIRED');
   if(first&&stableStringify(first.material)!==stableStringify(material))throw fail('SHARED_E2E_REOPEN_IMMUTABILITY_MISMATCH');
   const proof={schemaVersion:'PHI-OS-SHARED-REPORT-E2E-PROOF-v2',state:first?'TWO_SESSION_READ_PASS':'FIRST_OPEN',reportId:b.reportId,accountIdHash:owner,sessionHash:session,profileDigest:await sha256Stable(profile),material,providerCalls:0,productionAdmissionGranted:false,sharedDeliveryAuthorityEligible:false};
   proof.proofDigest=await sha256Stable(proof);
   await storage.put(key,JSON.stringify(proof),{httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});
   return Response.json({ok:true,proof:{state:proof.state,proofDigest:proof.proofDigest,providerCalls:0,sharedDeliveryAuthorityEligible:false,productionActivated:false}});
  }catch(e){return Response.json({ok:false,code:e.code||'SHARED_E2E_EVIDENCE_INVALID'},{status:e.status||409});}
 };
}
