import {personIdentity} from './canonical-person-store.js';
import {authorizeNativeQaJob} from '../report-delivery/paid-report-native-qa-adapter.js';
import {AST_FULL_QA_VERSION,AST_FULL_QA_SCOPE,requireAstFullPublisherQa,openAstFullQaArtifact} from '../report-delivery/ast-full-publisher-delivery-qa.js';
const fail=()=>{throw Object.assign(Error('REPORT_UNAVAILABLE'),{status:404});};
export function isAstFullPublisherQaRow(row){try{return JSON.parse(row?.verifier_receipt||'{}').scope===AST_FULL_QA_SCOPE;}catch{return false;}}
export async function openAccountAstFullPublisherQa(c,id){
 requireAstFullPublisherQa(c);const owner=personIdentity(c).userId,row=await c.env.RUNTIME_DB.prepare('SELECT * FROM account_method_report_materials WHERE report_id=? AND owner_account_id=?').bind(id,owner).first();if(!row||!isAstFullPublisherQaRow(row))fail();
 const saved=await c.env.RUNTIME_DB.prepare('SELECT record_json FROM paid_report_jobs WHERE report_id=? AND owner_account_id=?').bind(id,owner).first();if(!saved)fail();const j=JSON.parse(saved.record_json),r=JSON.parse(row.verifier_receipt);
 if(j.environment!=='QA'||j.state!=='DELIVERED'||j.reportId!==id||j.jobId!==id||j.personId!==row.person_id||j.methodCode!=='AST'||row.method_code!=='AST'||j.productId!=='COM-REPORT-ASTROLOGY-FULL'||j.output?.artifactRef!==row.object_key||j.output.outputDigest!==row.output_digest||j.authorityDigest!==row.snapshot_id||j.presentation.reportLocale!==row.locale||r.publicationVersion!==AST_FULL_QA_VERSION||r.purchaseId!==j.purchaseId||r.orderId!==j.orderId)fail();
 const {store,artifact}=await openAstFullQaArtifact(c,j);if(r.artifactDigest!==artifact.artifactDigest||r.entitlementId!==artifact.entitlementId||row.object_key!=='customer-artifacts/'+id+'/'+artifact.artifactDigest+'/'+AST_FULL_QA_VERSION+'.pdf')fail();
 return {row,job:j,artifact,store,material:{publicationVersion:AST_FULL_QA_VERSION},localQaAdapter:{downloadPdf:downloadAccountAstFullPublisherQa}};
}
export async function downloadAccountAstFullPublisherQa(c,id){
 const m=await openAccountAstFullPublisherQa(c,id),p=await m.store.pdfDerivative({artifact:m.artifact,version:AST_FULL_QA_VERSION,authorize:()=>authorizeNativeQaJob(c,m.job)});if(p.outputDigest!==m.row.output_digest)fail();await openAccountAstFullPublisherQa(c,id);
 return new Response(p.bytes,{headers:{'Content-Type':'application/pdf','Content-Length':String(p.bytes.length),'Content-Disposition':'attachment; filename="PHIOS-AST-FULL-SYNTHETIC-QA.pdf"','Cache-Control':'private, no-store','X-PHIOS-Output-Digest':p.outputDigest,'X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer'}});
}
