import {personIdentity,loadCanonicalPersonSubject} from '../account/canonical-person-store.js';
import {reportBirthInputFingerprint} from '../canonical-presentation-runtime/report-cover-subject.js';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
import {digest as baziDigest} from '../personal-reading/deep-manuscript/bazi-deep-manuscript-contract.js';
import {loadNativeQaMethod} from './bazi-only-native-qa-loader-r2.js';
import {requireNativeQa,composeNativeQaPublication,verifyNativeQaPublication,renderNativeQaHtml} from './native-qa-publication.js';
import {createCustomerReportArtifact} from './customer-report-artifact.js';
import {createCustomerArtifactStore} from './customer-artifact-store.js';
import {prepareBaziPdfIssuanceR1,REPORT_PDF_RENDITION_VERSIONS} from './report-pdf-issuance-port-r1.js';
import {assertPaidReportWorkerFence,workerFenceSql} from './paid-report-worker-fence.js';
import {reportEconomics} from '../pws/commercial/commerce-economics-policy.js';

export const BZR_P4_QA_VERSION='BZR-P4-NATIVE-ISSUANCE-QA-R1';
export const BZR_P4_QA_SCOPE='LOCAL_BZR_P4_ISSUANCE_QA_NOT_CUSTOMER_PUBLICATION';
export const BZR_P4_SOURCE_VERSION='BZR-P4-SYNTHETIC-SOURCE-R1';
const productId='COM-REPORT-BAZI-FULL',fail=code=>{throw Object.assign(Error(code),{code,status:409});};
const json=x=>JSON.parse(JSON.stringify(x)),prefix=j=>'native-qa-r3/'+j.jobId+'/p4-issuance/';
const get=async(c,j,key)=>{const o=await c.env.PRIVATE_REPORTS.get(prefix(j)+key);if(!o)fail('BZR_P4_CHECKPOINT_MISSING');return o;};
export function requireBaziP4Qa(c){requireNativeQa(c);if(c.env.REPORT_ZERO_COST_REPLAY!=='true')fail('BZR_P4_ZERO_COST_OPT_IN_REQUIRED');}
export const baziP4ReportId=j=>crypto.subtle.digest('SHA-256',new TextEncoder().encode(j.ownerAccountId+'\0'+j.orderId+'\0'+j.purchaseId+'\0BAZI')).then(x=>Array.from(new Uint8Array(x),b=>b.toString(16).padStart(2,'0')).join(''));
export async function authorizeBaziP4QaJob(c,j){
 requireBaziP4Qa(c);if(personIdentity(c).userId!==j.ownerAccountId||j.environment!=='QA'||j.methodCode!=='BZR'||j.productId!==productId)fail('BZR_P4_OWNER_OR_METHOD_MISMATCH');
 const subject=await loadCanonicalPersonSubject(c.env,j.ownerAccountId,j.personId);
 if(subject.personVersion!==j.personVersion||await reportBirthInputFingerprint(subject.canonicalBirthInput)!==j.inputDigest)fail('BZR_P4_SUBJECT_CHANGED');
 const right=await c.env.RUNTIME_DB.prepare("SELECT e.entitlement_id,o.context_json FROM commerce_purchases p JOIN commerce_checkout_attempts o ON o.checkout_attempt_id=p.checkout_attempt_id JOIN digital_entitlements e ON e.purchase_id=p.purchase_id WHERE p.purchase_id=? AND p.customer_id=? AND p.product_id=? AND p.purchase_state='purchased' AND o.checkout_attempt_id=? AND o.customer_id=p.customer_id AND o.product_id=p.product_id AND o.environment='QA' AND o.order_state='FULFILLED' AND o.review_required=0 AND e.customer_id=p.customer_id AND e.product_id=p.product_id AND e.entitlement_status='active' AND (e.expires_at IS NULL OR e.expires_at>?)").bind(j.purchaseId,j.ownerAccountId,j.productId,j.orderId,new Date().toISOString()).first();
 if(!right||JSON.parse(right.context_json||'{}').syntheticQaPurpose!==BZR_P4_QA_SCOPE)fail('BZR_P4_SYNTHETIC_PURCHASE_REQUIRED');
 return {subject,entitlementId:right.entitlement_id};
}
async function putCheckpoint(c,j,key,value){
 await authorizeBaziP4QaJob(c,j);if(!await assertPaidReportWorkerFence(c.env))fail('BZR_P4_ACTIVE_JOB_REQUIRED');
 const text=JSON.stringify(value),name=prefix(j)+key;
 await c.env.PRIVATE_REPORTS.put(name,text,{onlyIf:new Headers({'If-None-Match':'*'}),httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});
 if(await(await get(c,j,key)).text()!==text)fail('BZR_P4_IMMUTABLE_CHECKPOINT_CONFLICT');
}
export async function openBaziP4QaArtifact(c,j){
 const rights=await authorizeBaziP4QaJob(c,j),reportId=await baziP4ReportId(j),binding={environment:j.environment,ownerAccountId:j.ownerAccountId,orderId:j.orderId,purchaseId:j.purchaseId,productId:j.productId,reportId,authorityDigest:j.authorityDigest},store=await createCustomerArtifactStore(c.env,binding),{artifact}=await store.open();
 if(artifact.reportContentVersion!==BZR_P4_QA_VERSION||artifact.entitlementId!==rights.entitlementId||artifact.personId!==j.personId||artifact.personVersion!==j.personVersion||artifact.inputDigest!==j.inputDigest||artifact.publicationIR.scope!=='LOCAL_NATIVE_COMPOSER_FIXTURE_NOT_CUSTOMER_PUBLICATION'||artifact.publicationIR.issuanceEntryVersion!==BZR_P4_QA_VERSION||artifact.publicationIR.customerPublishable!==false)fail('BZR_P4_ARTIFACT_BINDING');
 await verifyNativeQaPublication(artifact.publicationIR,{...j,reportId});return {binding,store,artifact};
}

// Thin isolated successor over the original Native QA publisher, Core and Store.
// The opt-in registry is passed by the local test only, never installed globally.
export function createBaziP4QaIssuanceAdapter({renderer,onEvent=()=>{}}){
 if(typeof renderer!=='function')fail('BZR_P4_ACTUAL_RENDERER_REQUIRED');const prepared=new Map();
 const nativeFor=async(c,j)=>{requireBaziP4Qa(c);const key=[j.ownerAccountId,j.personId,j.personVersion].join(':');if(!prepared.has(key))prepared.set(key,json(await loadNativeQaMethod(c,j)));return prepared.get(key);};
 return Object.freeze({methodCode:'BZR',productId,version:BZR_P4_QA_VERSION,p8Admitted:true,admissionScope:BZR_P4_QA_SCOPE,supportedPresentations:['bilingual'],reportClass:'DETERMINISTIC',costPolicy:reportEconomics(productId),generationPolicy:{normalCalls:0,technicalRecoveryCalls:0},recoveryPolicy:{maximumAttempts:2,rescue:false},
 async readiness(c,r){requireBaziP4Qa(c);const s=await loadCanonicalPersonSubject(c.env,personIdentity(c).userId,r.personId),n=await nativeFor(c,{...r,methodCode:'BZR',ownerAccountId:personIdentity(c).userId,personVersion:s.personVersion});return {inputValid:true,calculationReady:true,authorityReady:true,publicationPreflightReady:true,rendererReady:true,productionConfigReady:true,commercialProductReady:true,personVersion:s.personVersion,inputDigest:await reportBirthInputFingerprint(s.canonicalBirthInput),authorityDigest:n.pack.digest};},
 async prepare(c,j){await authorizeBaziP4QaJob(c,j);const fresh=await this.readiness(c,j);if(fresh.inputDigest!==j.inputDigest||fresh.authorityDigest!==j.authorityDigest)fail('BZR_P4_NATIVE_AUTHORITY_MISMATCH');return {personId:j.personId};},
 async generate(c,j){await authorizeBaziP4QaJob(c,j);const prior=await c.env.PRIVATE_REPORTS.get(prefix(j)+'native'),n=prior?await prior.json():await nativeFor(c,j);if(n.pack.digest!==j.authorityDigest)fail('BZR_P4_NATIVE_AUTHORITY_MISMATCH');if(!prior)await putCheckpoint(c,j,'native',n);onEvent('NATIVE_SOURCE_PERSISTED',j);return {reportId:await baziP4ReportId(j),snapshotDigest:j.authorityDigest};},
 async validate(c,j,o){await authorizeBaziP4QaJob(c,j);if(o.reportId!==await baziP4ReportId(j)||(await(await get(c,j,'native')).json()).pack.digest!==j.authorityDigest)fail('BZR_P4_NATIVE_OUTPUT_MISMATCH');return o;},
 async compile(c,j,o){
  await this.validate(c,j,o);const n=await(await get(c,j,'native')).json(),bound={...j,reportId:o.reportId},old=await c.env.PRIVATE_REPORTS.get(prefix(j)+'publication');let p;
  if(old)p=await old.json();else{p=await composeNativeQaPublication({job:bound,native:n});delete p.digest;p.issuanceEntryVersion=BZR_P4_QA_VERSION;p.authority={digest:n.pack.authorityDigest,timingDigest:n.pack.timingDigest,realityDigest:n.pack.realityDigest};p.manuscript={sections:p.sections};p.digest=await baziDigest(p);await putCheckpoint(c,j,'publication',p);}
  await verifyNativeQaPublication(p,bound);const html=renderNativeQaHtml(p),htmlDigest=await sha256Stable(html),key=prefix(j)+'html';
  await c.env.PRIVATE_REPORTS.put(key,html,{onlyIf:new Headers({'If-None-Match':'*'}),httpMetadata:{contentType:'text/html',cacheControl:'private, no-store'}});if(await(await c.env.PRIVATE_REPORTS.get(key)).text()!==html)fail('BZR_P4_HTML_CONFLICT');
  const right=await authorizeBaziP4QaJob(c,j),a=await createCustomerReportArtifact({reportArtifactId:o.reportId,customerId:j.ownerAccountId,personId:j.personId,personVersion:j.personVersion,methodCode:'BZR',productCode:productId,entitlementId:right.entitlementId,inputDigest:j.inputDigest,authorityPackVersion:n.pack.schemaVersion,reportContentVersion:BZR_P4_QA_VERSION,rendererVersion:BZR_P4_QA_VERSION,inputSnapshot:right.subject.canonicalBirthInput,calculationSnapshot:n.calculation,publicationIR:p,generatedSections:p.sections,htmlSnapshotOrRenderState:{objectKey:key,outputDigest:htmlDigest},pdfPolicy:'PERSISTED_PRIVATE_PDF_REQUIRED',createdAt:new Date(j.createdAt).toISOString()});
  const binding={...bound,authorityDigest:j.authorityDigest};await(await createCustomerArtifactStore(c.env,binding)).save(a);return o;
 },
 async render(c,j,o){
  const {store,artifact,binding}=await openBaziP4QaArtifact(c,j),version=REPORT_PDF_RENDITION_VERSIONS.BZR;
  const hit=await store.hasPdfDerivative({artifact,version});
  if(!hit&&!await c.env.PRIVATE_REPORTS.get(prefix(j)+'source-receipt')){
   const html=await(await c.env.PRIVATE_REPORTS.get(artifact.htmlSnapshotOrRenderState.objectKey)).text();if(await sha256Stable(html)!==artifact.htmlSnapshotOrRenderState.outputDigest)fail('BZR_P4_HTML_CHANGED');
   const rendered=await renderer({html,publication:artifact.publicationIR,job:j});if(!(rendered.bytes instanceof Uint8Array)||!Number.isSafeInteger(rendered.pageCount)||rendered.pageCount<1)fail('BZR_P4_RENDERER_RECEIPT_REQUIRED');
   const outputSHA256=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',rendered.bytes)),v=>v.toString(16).padStart(2,'0')).join('');
   const receipt={schemaVersion:'BZR-P4-ACTUAL-RENDER-SOURCE-R1',version:BZR_P4_SOURCE_VERSION,methodCode:'BZR',ownerAccountId:j.ownerAccountId,subjectId:j.personId,orderId:j.orderId,purchaseId:j.purchaseId,productId,entitlementId:artifact.entitlementId,outputSHA256,bytes:rendered.bytes.length,pageCount:rendered.pageCount,publicationIRDigest:artifact.publicationIR.digest,sourceHtmlDigest:artifact.htmlSnapshotOrRenderState.outputDigest,scope:BZR_P4_QA_SCOPE};
   await c.env.PRIVATE_REPORTS.put(prefix(j)+'source.pdf',rendered.bytes,{onlyIf:new Headers({'If-None-Match':'*'}),httpMetadata:{contentType:'application/pdf',cacheControl:'private, no-store'}});await putCheckpoint(c,j,'source-receipt',receipt);onEvent('ACTUAL_PDF_RENDERED',j);
  }
  const pdf=await store.pdfDerivative({artifact,version,authorize:()=>authorizeBaziP4QaJob(c,j),allowCreate:true,prepareIssuance:async()=>prepareBaziPdfIssuanceR1(c,{binding,artifact,version,sourceReceipt:await(await get(c,j,'source-receipt')).json()}),render:async()=>new Uint8Array(await(await get(c,j,'source.pdf')).arrayBuffer())});
  onEvent(pdf.cacheHit?'FINAL_PDF_REUSED':'FINAL_PDF_COMMITTED',j);return {...o,outputDigest:pdf.outputDigest};
 },
 async release(c,j,o){
  const {store,artifact,binding}=await openBaziP4QaArtifact(c,j),version=REPORT_PDF_RENDITION_VERSIONS.BZR,pdf=await store.pdfDerivative({artifact,version,authorize:()=>authorizeBaziP4QaJob(c,j)}),source=await(await get(c,j,'source-receipt')).json();
  if(pdf.renditionReceipt?.sourceReceiptDigest!==await sha256Stable(source))fail('BZR_P4_RENDITION_SOURCE_MISMATCH');
  const ref='customer-artifacts/'+binding.reportId+'/'+artifact.artifactDigest+'/'+version+'.pdf',receipt={scope:BZR_P4_QA_SCOPE,version:BZR_P4_QA_VERSION,jobId:j.jobId,artifactDigest:artifact.artifactDigest,purchaseId:j.purchaseId,orderId:j.orderId,entitlementId:artifact.entitlementId,derivativeVersion:version,sourceReceiptDigest:await sha256Stable(source),renditionReceiptDigest:await sha256Stable(pdf.renditionReceipt),pageCount:source.pageCount};
  if(!await assertPaidReportWorkerFence(c.env))fail('BZR_P4_ACTIVE_JOB_REQUIRED');const f=workerFenceSql(c.env);
  await c.env.RUNTIME_DB.prepare('INSERT OR IGNORE INTO account_method_report_materials(report_id,owner_account_id,person_id,method_code,locale,snapshot_id,object_key,output_digest,released_at,verifier_receipt) SELECT ?,?,?,?,?,?,?,?,?,? WHERE '+f.sql).bind(binding.reportId,j.ownerAccountId,j.personId,'BZR',j.presentation.reportLocale,j.authorityDigest,ref,pdf.outputDigest,new Date(j.createdAt).toISOString(),JSON.stringify(receipt),...f.bindings).run();
  const row=await c.env.RUNTIME_DB.prepare('SELECT * FROM account_method_report_materials WHERE report_id=? AND owner_account_id=?').bind(binding.reportId,j.ownerAccountId).first();if(row?.output_digest!==pdf.outputDigest||row.object_key!==ref||row.verifier_receipt!==JSON.stringify(receipt))fail('BZR_P4_IMMUTABLE_MATERIAL_CONFLICT');
  return {reportId:binding.reportId,artifactRef:ref,snapshotDigest:j.authorityDigest,outputDigest:pdf.outputDigest};
 },
 async reconcile(c,j){const row=await c.env.RUNTIME_DB.prepare('SELECT * FROM account_method_report_materials WHERE report_id=? AND owner_account_id=?').bind(await baziP4ReportId(j),j.ownerAccountId).first();if(!row)return null;const {store,artifact}=await openBaziP4QaArtifact(c,j),p=await store.pdfDerivative({artifact,version:REPORT_PDF_RENDITION_VERSIONS.BZR,authorize:()=>authorizeBaziP4QaJob(c,j)});if(row.output_digest!==p.outputDigest||JSON.parse(row.verifier_receipt).scope!==BZR_P4_QA_SCOPE)fail('BZR_P4_MATERIAL_CHANGED');return {reportId:row.report_id,artifactRef:row.object_key,snapshotDigest:j.authorityDigest,outputDigest:p.outputDigest};},
 async verifyDelivered(c,j,o){if(JSON.stringify(await this.reconcile(c,j))!==JSON.stringify(o))fail('BZR_P4_DELIVERY_IDENTITY_MISMATCH');return true;}
 });
}
