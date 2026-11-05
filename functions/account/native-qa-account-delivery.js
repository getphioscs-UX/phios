import {personIdentity} from './canonical-person-store.js';
import {openNativeQaJobArtifact,authorizeNativeQaJob} from '../report-delivery/paid-report-native-qa-adapter.js';
import {requireNativeQa,NATIVE_QA_VERSION,NATIVE_QA_SCOPE,NATIVE_QA_METHODS} from '../report-delivery/native-qa-publication.js';
const fail=()=>{throw Object.assign(Error('REPORT_UNAVAILABLE'),{code:'REPORT_UNAVAILABLE',status:404});};
export function nativeQaAccountEnabled(c){return c.env?.PHIOS_ENVIRONMENT==='local'&&c.env.STRIPE_ENVIRONMENT==='QA'&&c.env.PHIOS_LOCAL_NATIVE_DELIVERY_QA==='true';}
export function isNativeQaRow(row){try{return JSON.parse(row?.verifier_receipt||'{}').scope===NATIVE_QA_SCOPE;}catch{return false;}}
export async function openAccountNativeQaMaterial(c,id){
 requireNativeQa(c);const owner=personIdentity(c).userId,row=await c.env.RUNTIME_DB.prepare('SELECT * FROM account_method_report_materials WHERE report_id=? AND owner_account_id=?').bind(id,owner).first();if(!row||!isNativeQaRow(row))fail();
 const saved=await c.env.RUNTIME_DB.prepare('SELECT record_json FROM paid_report_jobs WHERE report_id=? AND owner_account_id=?').bind(id,owner).first();if(!saved)fail();const j=JSON.parse(saved.record_json),r=JSON.parse(row.verifier_receipt);
 if(j.environment!=='QA'||j.state!=='DELIVERED'||j.reportId!==id||j.reportId!==j.jobId||j.personId!==row.person_id||j.methodCode!==row.method_code||j.productId!==NATIVE_QA_METHODS[j.methodCode]?.product||j.output?.artifactRef!==row.object_key||j.output?.outputDigest!==row.output_digest||j.authorityDigest!==row.snapshot_id||j.presentation.reportLocale!==row.locale||r.publicationVersion!==NATIVE_QA_VERSION||r.purchaseId!==j.purchaseId||r.orderId!==j.orderId)fail();
 const {store,artifact}=await openNativeQaJobArtifact(c,j);if(r.artifactDigest!==artifact.artifactDigest||r.entitlementId!==artifact.entitlementId)fail();
 const expected='customer-artifacts/'+id+'/'+artifact.artifactDigest+'/'+NATIVE_QA_VERSION+'.pdf';if(row.object_key!==expected)fail();
 return {row,job:j,artifact,store,material:{publicationVersion:NATIVE_QA_VERSION},localQaAdapter:{downloadPdf:downloadAccountNativeQaPdf}};
}
export async function downloadAccountNativeQaPdf(c,id){const m=await openAccountNativeQaMaterial(c,id),p=await m.store.pdfDerivative({artifact:m.artifact,version:NATIVE_QA_VERSION,authorize:()=>authorizeNativeQaJob(c,m.job)});if(p.outputDigest!==m.row.output_digest)fail();await openAccountNativeQaMaterial(c,id);return new Response(p.bytes,{headers:{'Content-Type':'application/pdf','Content-Length':String(p.bytes.length),'Content-Disposition':'attachment; filename="PHIOS-'+m.job.methodCode+'-SYNTHETIC-QA.pdf"','Cache-Control':'private, no-store','X-PHIOS-Output-Digest':p.outputDigest,'X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer'}});}
