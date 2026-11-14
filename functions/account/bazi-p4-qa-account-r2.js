import {personIdentity} from './canonical-person-store.js';
import {paidReportStateStore} from '../report-delivery/paid-report-state-store.js';
import {BZR_P4_QA_SCOPE,BZR_P4_QA_VERSION,requireBaziP4Qa,authorizeBaziP4QaJob,openBaziP4QaArtifact,baziP4ReportId} from '../report-delivery/bazi-p4-qa-issuance-adapter-r2.js';
import {REPORT_PDF_RENDITION_VERSIONS} from '../report-delivery/report-pdf-issuance-port-r1.js';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
const fail=()=>{throw Object.assign(Error('REPORT_UNAVAILABLE'),{code:'REPORT_UNAVAILABLE',status:404});};
export function isBaziP4QaRow(row){try{return JSON.parse(row?.verifier_receipt||'{}').scope===BZR_P4_QA_SCOPE;}catch{return false;}}
export async function openAccountBaziP4Qa(c,id){
 requireBaziP4Qa(c);const owner=personIdentity(c).userId,row=await c.env.RUNTIME_DB.prepare('SELECT * FROM account_method_report_materials WHERE report_id=? AND owner_account_id=?').bind(id,owner).first();if(!isBaziP4QaRow(row))fail();const r=JSON.parse(row.verifier_receipt),job=await paidReportStateStore(c.env).job(r.jobId,owner);
 if(!job||job.state!=='DELIVERED'||job.reportId!==id||await baziP4ReportId(job)!==id||job.output?.outputDigest!==row.output_digest||job.output?.artifactRef!==row.object_key||job.personId!==row.person_id||job.methodCode!==row.method_code||job.authorityDigest!==row.snapshot_id||job.presentation.reportLocale!==row.locale||r.version!==BZR_P4_QA_VERSION||r.purchaseId!==job.purchaseId||r.orderId!==job.orderId||r.derivativeVersion!==REPORT_PDF_RENDITION_VERSIONS.BZR)fail();
 const {store,artifact,binding}=await openBaziP4QaArtifact(c,job);if(r.artifactDigest!==artifact.artifactDigest||r.entitlementId!==artifact.entitlementId||row.object_key!=='customer-artifacts/'+id+'/'+artifact.artifactDigest+'/'+r.derivativeVersion+'.pdf')fail();
 const pdf=await store.pdfDerivative({artifact,version:r.derivativeVersion,authorize:()=>authorizeBaziP4QaJob(c,job)});if(pdf.outputDigest!==row.output_digest||r.renditionReceiptDigest!==await sha256Stable(pdf.renditionReceipt)||r.sourceReceiptDigest!==await sha256Stable(pdf.sourceReceipt)||r.pageCount!==pdf.renditionReceipt.pageCount)fail();
 return {row,job,artifact,binding,pdf,material:{publicationVersion:BZR_P4_QA_VERSION},localQaAdapter:{downloadPdf:downloadAccountBaziP4QaPdf}};
}
export async function downloadAccountBaziP4QaPdf(c,id){const m=await openAccountBaziP4Qa(c,id);return new Response(m.pdf.bytes,{headers:{'Content-Type':'application/pdf','Content-Length':String(m.pdf.bytes.length),'Content-Disposition':'attachment; filename="PHIOS-BZR-P4-SYNTHETIC-QA.pdf"','Cache-Control':'private, no-store','X-PHIOS-Output-Digest':m.pdf.outputDigest,'X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer'}});}
