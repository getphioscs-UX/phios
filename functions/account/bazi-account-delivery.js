import {personIdentity,loadCanonicalPersonSubject} from './canonical-person-store.js';
import {prepareAccountBaziCandidate} from '../report-delivery/bazi-account-candidate.js';
import {generatePaidBaziManuscript} from '../personal-reading/deep-manuscript/bazi-paid-generation.js';
import {compileBaziDeepPublication} from '../personal-reading/deep-manuscript/bazi-deep-manuscript-publication.js';
import {createReportGenerationStore} from '../personal-reading/report-generation-store.js';
import {commerceEnvironment} from '../commerce/commerce-environment.js';
import {ownedReportPresentation} from '../commerce/book-commerce-store.js';
import {digest} from './oidc-auth.js';
import {grantDeliveredReportFollowups} from './report-followup-store.js';
import {closeReleasedReportBudget} from '../personal-reading/report-delivery-budget.js';
import {requirePurchasedReportPresentation} from '../pws/commercial/report-successor-contract.js';
const fail=(code,status=409)=>{throw Object.assign(Error(code),{code,status});};
function gate(context){personIdentity(context);if(!['local','qa','preview'].includes(context.env?.PHIOS_ENVIRONMENT))fail('BAZI_ACCOUNT_DELIVERY_NOT_ADMITTED',403);}
async function seal(env,value){if(!env.AUTH_SESSION_SECRET)fail('BAZI_MATERIAL_SEAL_REQUIRED',503);const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.AUTH_SESSION_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);return [...new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(JSON.stringify(value))))].map(x=>x.toString(16).padStart(2,'0')).join('');}
// Only a server-owned, sealed input object can supply governed method authority.
// Never substitute a repository reference chart for a customer's calculation.
async function loadInputs(context,prepared){
 const key=`bazi-inputs/${prepared.customerId}/${prepared.personId}/${prepared.personVersion}/${prepared.calculationDigest}.json`,object=await context.env.PRIVATE_REPORTS?.get(key);
 if(!object)fail('BAZI_SUBJECT_GOVERNED_INPUT_NOT_READY');const {integritySeal,...body}=JSON.parse(await object.text());
 if(integritySeal!==await seal(context.env,body)||body.canonicalBirthInputFingerprint!==prepared.canonicalBirthInputFingerprint||body.calculationDigest!==prepared.calculationDigest||body.pack?.subject?.subjectId!==prepared.personId)fail('BAZI_SUBJECT_AUTHORITY_MISMATCH');
 return body;
}
// This is orchestration inside existing Commerce, person, generation and material
// owners. There is no public input-registration route or production activation.
export async function generateAndReleaseAccountBazi(context,selection,{resolveInputs=loadInputs,produce=generatePaidBaziManuscript}={}){
 gate(context);if(!selection||Object.keys(selection).some(k=>!['personId','locale'].includes(k))||!['en','zh-Hans','bilingual'].includes(selection.locale))fail('BAZI_SELECTION_INVALID',400);
 const prepared=await prepareAccountBaziCandidate(context,{personId:selection.personId});if(prepared.state!=='RELEASE_PENDING')fail('BAZI_CALCULATION_INCOMPLETE');
 const right=await ownedReportPresentation(context.env,prepared.customerId,'COM-REPORT-BAZI-FULL');
 requirePurchasedReportPresentation(right,{reportLocale:selection.locale,reportLanguageMode:selection.locale==='bilingual'?'BILINGUAL':'SINGLE'});
 const inputs=await resolveInputs(context,prepared),owner=prepared.customerId;
 if(inputs.pack?.subject?.subjectId!==prepared.personId||inputs.calculationDigest!==prepared.calculationDigest||inputs.canonicalBirthInputFingerprint!==prepared.canonicalBirthInputFingerprint)fail('BAZI_SUBJECT_AUTHORITY_MISMATCH');
 if(inputs.approval?.statement!=='HUMAN ACCEPT BAZI DEEP MANUSCRIPT R2'||inputs.approval.productionFrozen!==true)fail('BAZI_GOVERNED_PRODUCER_ADMISSION_REQUIRED');
 const order=await context.env.RUNTIME_DB.prepare('SELECT o.checkout_attempt_id AS orderId FROM commerce_checkout_attempts o JOIN commerce_purchases p ON p.checkout_attempt_id=o.checkout_attempt_id WHERE p.purchase_id=? AND p.customer_id=? AND o.customer_id=? AND o.environment=? AND p.purchase_state=\'purchased\' AND o.order_state=\'FULFILLED\' AND o.review_required=0').bind(prepared.purchaseId,owner,owner,commerceEnvironment(context.env)).first();if(!order)fail('BAZI_PAID_ORDER_REQUIRED',403);
 const reportId=await digest(`${owner}\0${order.orderId}\0${prepared.personId}\0${prepared.personVersion}\0${selection.locale}`),binding={environment:commerceEnvironment(context.env),ownerAccountId:owner,purchaseId:prepared.purchaseId,orderId:order.orderId,reportId,productId:'COM-REPORT-BAZI-FULL',authorityDigest:inputs.pack.digest};
 const store=await createReportGenerationStore(context.env,binding,{scope:'delivery'});
 return store.withLock('release',async()=>{
  const prior=await store.get('release');if(prior){await openAccountBaziMaterial(context,prior.reportId);return {reportId:prior.reportId,cacheHit:true,providerCalls:0};}
  if(!context.env.METHOD_REPORT_RENDERER?.fetch)fail('REPORT_BROWSER_VERIFIER_NOT_CONFIGURED',503);
  const result=await produce({env:context.env,binding,pack:inputs.pack,model:inputs.model,policy:inputs.policy,approval:inputs.approval,order:{...order,paymentConfirmed:true,requiredInputsValid:true,authorityReady:true,subjectId:prepared.personId,authorityDigest:inputs.pack.digest},candidateId:reportId,subjectId:prepared.personId,validateProviderOutput:body=>{if(body.authorityDigest&&body.authorityDigest!==inputs.pack.digest)fail('BAZI_GENERATED_AUTHORITY_MISMATCH');}});
  if(!result.snapshot)fail('BAZI_MANUSCRIPT_INCOMPLETE');
  const ir=await compileBaziDeepPublication({snapshot:result.snapshot,pack:inputs.pack,productionFrozen:true,presentationMode:selection.locale==='en'?'EN':selection.locale==='zh-Hans'?'ZH_HANS':'BILINGUAL'});
  if(!ir.customerPublishable||ir.fixture||ir.reviewOnly)fail('BAZI_REFERENCE_NOT_CUSTOMER_MATERIAL');
  const response=await context.env.METHOD_REPORT_RENDERER.fetch(new Request('https://method-report-renderer.internal/verify',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({method:'BZR',publication:ir,compositionVersion:result.snapshot.versions})}));
  if(!response.ok)fail('BAZI_RENDER_FAILED');const {html,verification}=await response.json();
  if(typeof html!=='string'||html.length>8000000||verification?.passed!==true||verification.outputDigest!==await digest(html)||verification.manuscriptDigest!==result.snapshot.digest||verification.publicationDigest!==ir.digest||verification.browserReady!==true||verification.pdfReady!==true||verification.printReady!==true||verification.pageCount!==48||verification.diagramCount!==15)fail('BAZI_RENDER_RECEIPT_REQUIRED');
  const candidate={customerId:owner,personId:prepared.personId,purchaseId:prepared.purchaseId,locale:selection.locale,paidReportBinding:binding,snapshot:{methodId:'BZR',semanticSnapshotId:result.snapshot.digest,compositionVersion:result.snapshot.versions,semanticContent:{authorityDigest:inputs.pack.digest,visualReportIr:{sections:result.snapshot.sections.map(s=>({sectionId:s.sectionId,authorityRefs:[`BAZI:${inputs.pack.digest}:${s.sectionId}`],zhHans:{manuscript:s.zhHansManuscript},en:{manuscript:s.enManuscript}}))}}}};
  const body={schemaVersion:'BAZI_ACCOUNT_MATERIAL_V1',candidate,personVersion:prepared.personVersion,canonicalBirthInputFingerprint:prepared.canonicalBirthInputFingerprint,verification},receipt={...body,integritySeal:await seal(context.env,body)},objectKey=`released-method/${reportId}/${verification.outputDigest}.html`,now=new Date().toISOString();
  await context.env.PRIVATE_REPORTS.put(objectKey,html,{httpMetadata:{contentType:'text/html; charset=utf-8',cacheControl:'private, no-store'}});
  await context.env.RUNTIME_DB.prepare('INSERT INTO account_method_report_materials VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(report_id) DO NOTHING').bind(reportId,owner,prepared.personId,'BZR',selection.locale,result.snapshot.digest,objectKey,verification.outputDigest,now,JSON.stringify(receipt)).run();
  await closeReleasedReportBudget(context,{candidate,release:{reportId},receipt:verification});await grantDeliveredReportFollowups(context.env,{reportId,ownerAccountId:owner,purchaseId:prepared.purchaseId,methodCode:'BZR'});await store.put('release',{reportId});return {reportId,cacheHit:false,providerCalls:result.providerCalls};
 });
}
export async function openAccountBaziMaterial(context,reportId){
 gate(context);const owner=personIdentity(context).userId,row=await context.env.RUNTIME_DB.prepare('SELECT rowid AS report_version,* FROM account_method_report_materials WHERE report_id=? AND owner_account_id=? AND method_code=\'BZR\'').bind(reportId,owner).first();if(!row)fail('REPORT_UNAVAILABLE',404);
 const {integritySeal,...body}=JSON.parse(row.verifier_receipt);if(body.schemaVersion!=='BAZI_ACCOUNT_MATERIAL_V1'||integritySeal!==await seal(context.env,body))fail('REPORT_UNAVAILABLE',404);
 const candidate=body.candidate;if(candidate.customerId!==owner||candidate.personId!==row.person_id||candidate.snapshot.semanticSnapshotId!==row.snapshot_id||body.verification.outputDigest!==row.output_digest)fail('REPORT_UNAVAILABLE',404);
 await loadCanonicalPersonSubject(context.env,owner,row.person_id);if(!await ownedReportPresentation(context.env,owner,'COM-REPORT-BAZI-FULL'))fail('REPORT_UNAVAILABLE',404);
 const object=await context.env.PRIVATE_REPORTS.get(row.object_key);if(!object)fail('REPORT_UNAVAILABLE',404);const html=await object.text();if(await digest(html)!==row.output_digest)fail('REPORT_UNAVAILABLE',404);return {row,candidate,html};
}
export async function listAccountBaziMaterials(context){gate(context);const rows=(await context.env.RUNTIME_DB.prepare('SELECT report_id FROM account_method_report_materials WHERE owner_account_id=? AND method_code=\'BZR\' ORDER BY released_at DESC LIMIT 100').bind(personIdentity(context).userId).all()).results||[],out=[];for(const r of rows){const {row}=await openAccountBaziMaterial(context,r.report_id);out.push({reportId:row.report_id,method:'BZR',locale:row.locale,releasedAt:row.released_at,version:row.report_version,status:'RELEASED'});}return out;}
