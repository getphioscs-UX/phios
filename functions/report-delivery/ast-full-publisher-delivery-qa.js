import {createNativeQaDeliveryAdapter,authorizeNativeQaJob} from './paid-report-native-qa-adapter.js';
import {requireNativeQa} from './native-qa-publication.js';
import {createCustomerReportArtifact} from './customer-report-artifact.js';
import {createCustomerArtifactStore} from './customer-artifact-store.js';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
export const AST_FULL_QA_VERSION='AST-FULL-PUBLISHER-LOCAL-QA-1';
export const AST_FULL_QA_SCOPE='LOCAL_AST_FULL_PUBLISHER_QA_NOT_CUSTOMER_RELEASE';
const fail=code=>{throw Object.assign(Error(code),{code,status:409});};
const fields=['ownerAccountId','personId','personVersion','orderId','purchaseId','jobId','reportId','methodCode','productId','inputDigest','authorityDigest'];
const chapters=Array.from({length:10},(_,i)=>'SEC-'+String(i+1).padStart(2,'0'));
const figures=['AST-D01','AST-D02','AST-D04','AST-D05','AST-D06','AST-D07','AST-D08','AST-D09','AST-D10','AST-D11','AST-D12','AST-D14','AST-D15'];
const jsonHash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)))),b=>b.toString(16).padStart(2,'0')).join('');
const textHash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
export function requireAstFullPublisherQa(c){requireNativeQa(c);if(c.env.PHIOS_LOCAL_AST_FULL_PUBLISHER_QA!=='true')fail('AST_FULL_PUBLISHER_LOCAL_QA_OPT_IN_REQUIRED');}
export async function verifyAstFullQaPublication(p,j){
 const {digest,...body}=p||{};
 if(await sha256Stable(body)!==digest||p.version!==AST_FULL_QA_VERSION||p.scope!==AST_FULL_QA_SCOPE||p.customerPublishable!==false||p.composerFixture!==true)fail('AST_FULL_QA_PUBLICATION_INTEGRITY');
 for(const k of fields)if(p[k]!==j[k])fail('AST_FULL_QA_JOB_BINDING');
 if(j.methodCode!=='AST'||j.productId!=='COM-REPORT-ASTROLOGY-FULL'||p.locale!=='bilingual'||j.presentation.reportLocale!=='bilingual')fail('AST_FULL_QA_METHOD_OR_LANGUAGE');
 const r=p.publisherReceipt,m=p.manuscript;
 if(r?.version!=='AST-R1R5-R21-SUBJECT-BINDING-R33-1'||r.scope!=='ISOLATED_QA_FULL_PUBLISHER'||r.customerManuscriptReady!==false||r.publicationAccepted!==false||r.providerCalls!==0||r.originalPaginatorRetained!==true||r.fixedAssetsRetained!==true||r.referencePersonalBlocksReplaced!==true)fail('AST_FULL_QA_ORIGINAL_PUBLISHER_REQUIRED');
 if(r.subject?.personId!==j.personId||r.subject.inputDigest!==j.inputDigest||r.subject.calculationDigest!==p.calculationDigest||r.newHtmlSHA256!==p.htmlDigest||m?.personId!==j.personId||m.inputDigest!==j.inputDigest||m.calculationDigest!==p.calculationDigest||m.scope!=='ISOLATED_QA_FULL_PUBLISHER'||m.timingAuthority!==null||await jsonHash(m)!==r.manuscriptDigest)fail('AST_FULL_QA_SOURCE_BINDING');
 if(JSON.stringify(p.sections)!==JSON.stringify(m.sections))fail('AST_FULL_QA_SECTION_COPY_MISMATCH');
 if(JSON.stringify(r.chapterIds)!==JSON.stringify(chapters)||JSON.stringify(m.sections?.map(s=>s.sectionId))!==JSON.stringify(chapters)||JSON.stringify(r.figureLedger?.map(f=>f.diagramId).sort())!==JSON.stringify([...figures].sort()))fail('AST_FULL_QA_CHAPTER_OR_FIGURE_BINDING');
 for(const s of m.sections){for(const k of ['personId','inputDigest','calculationDigest'])if(s.sourceBinding?.[k]!==r.subject[k])fail('AST_FULL_QA_CHAPTER_SUBJECT');for(const l of ['zhHans','en'])if(!s.localeBlocks?.[l]?.length||s.localeBlocks[l].some(b=>!b.paragraphs?.length||!b.sourceRefs?.length))fail('AST_FULL_QA_BILINGUAL_SOURCE');}
 return p;
}
export async function openAstFullQaArtifact(c,j){
 requireAstFullPublisherQa(c);const rights=await authorizeNativeQaJob(c,j),store=await createCustomerArtifactStore(c.env,j),{artifact}=await store.open();
 if(artifact.reportContentVersion!==AST_FULL_QA_VERSION||artifact.personId!==j.personId||artifact.productCode!==j.productId||artifact.inputDigest!==j.inputDigest||artifact.authorityPackVersion!==j.authorityDigest||artifact.entitlementId!==rights.entitlementId)fail('AST_FULL_QA_ARTIFACT_BINDING');
 await verifyAstFullQaPublication(artifact.publicationIR,j);if(JSON.stringify(artifact.generatedCopy)!==JSON.stringify(artifact.publicationIR.sections))fail('AST_FULL_QA_ARTIFACT_SECTIONS_MISMATCH');if(await sha256Stable(artifact.calculationSnapshot)!==j.authorityDigest||await jsonHash(artifact.calculationSnapshot.calculation)!==artifact.publicationIR.calculationDigest)fail('AST_FULL_QA_NATIVE_ARTIFACT_MISMATCH');return {store,artifact};
}
// An AST adapter port over the existing shared Job, native owner and private
// artifact store. It is never registered in production PAID_REPORT_METHODS.
export function createAstFullPublisherDeliveryQa({loadNative,buildPublication,renderer,onEvent=()=>{}}){
 if(typeof buildPublication!=='function'||typeof renderer!=='function')fail('AST_FULL_QA_OWNER_DEPENDENCIES');
 const base=createNativeQaDeliveryAdapter({methodCode:'AST',loadNative,renderer:()=>{throw Error('AST_FULL_QA_GENERIC_RENDER_FORBIDDEN');},onEvent});
 const local=async(c,j)=>{requireAstFullPublisherQa(c);await authorizeNativeQaJob(c,j);};
 return Object.freeze({...base,version:AST_FULL_QA_VERSION,admissionScope:'LOCAL_EXISTING_FULL_PUBLISHER_QA_ONLY_NOT_REGISTRY',
 async readiness(c,r){requireAstFullPublisherQa(c);return base.readiness(c,r);},
 async prepare(c,j){await local(c,j);return base.prepare.call(this,c,j);},
 async generate(c,j){await local(c,j);return base.generate(c,j);},
 async validate(c,j,o){await local(c,j);return base.validate(c,j,o);},
 async compile(c,j,o){
  await this.validate(c,j,o);const nativeObject=await c.env.PRIVATE_REPORTS.get('native-qa-r3/'+j.jobId+'/native');if(!nativeObject)fail('AST_FULL_QA_NATIVE_CHECKPOINT_REQUIRED');
  const native=await nativeObject.json();if(await sha256Stable(native)!==j.authorityDigest)fail('AST_FULL_QA_NATIVE_CHANGED');
  const built=await buildPublication({context:c,job:j,native}),html=built.html,receipt=built.receipt,manuscript=built.manuscript,calculationDigest=await jsonHash(native.calculation);
  if(typeof html!=='string'||!html.includes('ISOLATED QA')||await textHash(html)!==receipt?.newHtmlSHA256)fail('AST_FULL_QA_HTML_BINDING');
  const body={...Object.fromEntries(fields.map(k=>[k,j[k]])),version:AST_FULL_QA_VERSION,scope:AST_FULL_QA_SCOPE,locale:j.presentation.reportLocale,calculationDigest,htmlDigest:receipt.newHtmlSHA256,publisherReceipt:receipt,manuscript,sections:manuscript.sections,customerPublishable:false,composerFixture:true};
  const publication={...body,digest:await sha256Stable(body)};await verifyAstFullQaPublication(publication,j);
  const htmlKey='ast-full-publisher-qa/'+j.jobId+'/html';await c.env.PRIVATE_REPORTS.put(htmlKey,html,{httpMetadata:{contentType:'text/html'}});
  const rights=await authorizeNativeQaJob(c,j),artifact=await createCustomerReportArtifact({reportArtifactId:j.reportId,customerId:j.ownerAccountId,personId:j.personId,methodCode:j.methodCode,productCode:j.productId,entitlementId:rights.entitlementId,inputDigest:j.inputDigest,authorityPackVersion:j.authorityDigest,reportContentVersion:AST_FULL_QA_VERSION,rendererVersion:receipt.version,inputSnapshot:rights.subject.canonicalBirthInput,calculationSnapshot:native,publicationIR:publication,generatedSections:publication.sections,htmlSnapshotOrRenderState:{objectKey:htmlKey,outputDigest:receipt.newHtmlSHA256},pdfPolicy:'PERSISTED_PRIVATE_PDF_REQUIRED',createdAt:new Date(j.createdAt).toISOString()});
  await(await createCustomerArtifactStore(c.env,j)).save(artifact);onEvent('EXISTING_FULL_PUBLISHER_BOUND',j);return o;
 },
 async render(c,j,o){
  const {store,artifact}=await openAstFullQaArtifact(c,j),p=artifact.publicationIR;
  const pdf=await store.pdfDerivative({artifact,version:AST_FULL_QA_VERSION,authorize:()=>local(c,j),allowCreate:true,render:async()=>{const html=await(await c.env.PRIVATE_REPORTS.get(artifact.htmlSnapshotOrRenderState.objectKey)).text();if(await textHash(html)!==p.htmlDigest)fail('AST_FULL_QA_HTML_CHANGED');return renderer({html,publication:p,job:j});}});
  onEvent(pdf.cacheHit?'PDF_REUSED':'PDF_RENDERED',j);return {...o,outputDigest:pdf.outputDigest};
 },
 async release(c,j,o){
  const {store,artifact}=await openAstFullQaArtifact(c,j),pdf=await store.pdfDerivative({artifact,version:AST_FULL_QA_VERSION,authorize:()=>local(c,j)}),ref='customer-artifacts/'+j.reportId+'/'+artifact.artifactDigest+'/'+AST_FULL_QA_VERSION+'.pdf';
  const receipt={scope:AST_FULL_QA_SCOPE,publicationVersion:AST_FULL_QA_VERSION,artifactDigest:artifact.artifactDigest,purchaseId:j.purchaseId,orderId:j.orderId,entitlementId:artifact.entitlementId};
  await c.env.RUNTIME_DB.prepare('INSERT OR IGNORE INTO account_method_report_materials(report_id,owner_account_id,person_id,method_code,locale,snapshot_id,object_key,output_digest,released_at,verifier_receipt) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(j.reportId,j.ownerAccountId,j.personId,j.methodCode,j.presentation.reportLocale,j.authorityDigest,ref,pdf.outputDigest,new Date(j.createdAt).toISOString(),JSON.stringify(receipt)).run();
  const row=await c.env.RUNTIME_DB.prepare('SELECT * FROM account_method_report_materials WHERE report_id=? AND owner_account_id=?').bind(j.reportId,j.ownerAccountId).first();
  if(row?.object_key!==ref||row.output_digest!==pdf.outputDigest||row.verifier_receipt!==JSON.stringify(receipt))fail('AST_FULL_QA_IMMUTABLE_ROW_CONFLICT');
  return {reportId:j.reportId,artifactRef:ref,snapshotDigest:j.authorityDigest,outputDigest:pdf.outputDigest};
 },
 async reconcile(c,j){await local(c,j);const row=await c.env.RUNTIME_DB.prepare('SELECT * FROM account_method_report_materials WHERE report_id=? AND owner_account_id=?').bind(j.reportId,j.ownerAccountId).first();if(!row)return null;const {store,artifact}=await openAstFullQaArtifact(c,j),pdf=await store.pdfDerivative({artifact,version:AST_FULL_QA_VERSION,authorize:()=>local(c,j)});const receipt=JSON.parse(row.verifier_receipt);if(row.object_key!=='customer-artifacts/'+j.reportId+'/'+artifact.artifactDigest+'/'+AST_FULL_QA_VERSION+'.pdf'||row.person_id!==j.personId||row.method_code!==j.methodCode||row.snapshot_id!==j.authorityDigest||row.locale!==j.presentation.reportLocale||receipt.orderId!==j.orderId||receipt.purchaseId!==j.purchaseId||receipt.entitlementId!==artifact.entitlementId||row.output_digest!==pdf.outputDigest||receipt.artifactDigest!==artifact.artifactDigest||receipt.publicationVersion!==AST_FULL_QA_VERSION||receipt.scope!==AST_FULL_QA_SCOPE)fail('AST_FULL_QA_DELIVERY_CHANGED');return {reportId:j.reportId,artifactRef:row.object_key,snapshotDigest:j.authorityDigest,outputDigest:pdf.outputDigest};},
 async verifyDelivered(c,j,o){if(JSON.stringify(await this.reconcile(c,j))!==JSON.stringify(o))fail('AST_FULL_QA_DELIVERY_MISMATCH');return true;}
 });
}
