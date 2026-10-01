import {generateAccountZiweiCandidate} from '../report-delivery/ziwei-canonical-person-binding.js';
import {controlledZiweiIdentity} from '../report-delivery/ziwei-production-generation-v1.js';
import {loadCanonicalPersonSubject} from './canonical-person-store.js';
import {releaseControlledZiweiReport,openControlledZiweiReport} from './ziwei-controlled-report-material.js';
import {digest} from './oidc-auth.js';
const fail=(code,status=409)=>Object.assign(new Error(code),{code,status});
const loader=env=>(owner,id)=>loadCanonicalPersonSubject(env,owner,id);
async function bounded(response,max){const reader=response.body?.getReader();if(!reader)throw fail('REPORT_RENDER_FAILED');let bytes=0,text='';const decoder=new TextDecoder();for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>max){await reader.cancel();throw fail('REPORT_RENDER_TOO_LARGE');}text+=decoder.decode(value,{stream:true});}return text+decoder.decode();}
export async function generateAndReleaseAccountZiwei(context,selection){
 controlledZiweiIdentity(context);
 const candidate=await generateAccountZiweiCandidate(context,selection);
 // An actual private server browser verifier must be configured. Customer claims
 // and local test receipts cannot cross this boundary.
 if(!context.env.METHOD_REPORT_RENDERER?.fetch)throw fail('REPORT_BROWSER_VERIFIER_NOT_CONFIGURED',503);
 const response=await context.env.METHOD_REPORT_RENDERER.fetch(new Request('https://method-report-renderer.internal/verify',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({candidate,method:'ZWR',compositionVersion:'ZIWEI-PRODUCTION-COMPOSER-V1'})}));
 if(!response.ok)throw fail('REPORT_RENDER_FAILED');
 const output=JSON.parse(await bounded(response,8000000)),receipt=output.verification;
 if(typeof output.html!=='string'||receipt?.semanticSnapshotId!==candidate.snapshot.semanticSnapshotId||receipt?.passed!==true||receipt?.pageCount!==33||receipt?.brokenImages!==0||receipt?.overflowCount!==0||receipt?.errorCount!==0||receipt?.outputDigest!==await digest(output.html))throw fail('REPORT_RENDER_VERIFICATION_REQUIRED');
 const release=await releaseControlledZiweiReport(context,candidate,{loadSubject:loader(context.env),renderVerification:receipt});
 const objectKey=`released-method/${release.reportId}/${receipt.outputDigest}.html`,now=new Date().toISOString();
 await context.env.PRIVATE_REPORTS.put(objectKey,output.html,{httpMetadata:{contentType:'text/html; charset=utf-8',cacheControl:'private, no-store'}});
 await context.env.RUNTIME_DB.prepare('INSERT INTO account_method_report_materials(report_id,owner_account_id,person_id,method_code,locale,snapshot_id,object_key,output_digest,released_at,verifier_receipt) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(report_id) DO NOTHING').bind(release.reportId,candidate.customerId,candidate.personId,'ZWR',candidate.locale,candidate.snapshot.semanticSnapshotId,objectKey,receipt.outputDigest,now,JSON.stringify(receipt)).run();
 return {reportId:release.reportId};
}
export async function openAccountZiweiMaterial(context,reportId){
 const owner=controlledZiweiIdentity(context).userId;
 const row=await context.env.RUNTIME_DB.prepare('SELECT rowid AS report_version,* FROM account_method_report_materials WHERE owner_account_id=? AND report_id=?').bind(owner,reportId).first();
 if(!row)throw fail('REPORT_UNAVAILABLE',404);
 // Reads and integrity/admission checks only. Never generate or render on open.
 const candidate=await openControlledZiweiReport(context,{reportId,personId:row.person_id},{loadSubject:loader(context.env)});
 if(candidate.snapshot.semanticSnapshotId!==row.snapshot_id||candidate.locale!==row.locale)throw fail('REPORT_UNAVAILABLE',404);
 const object=await context.env.PRIVATE_REPORTS.get(row.object_key);if(!object)throw fail('REPORT_UNAVAILABLE',404);
 const html=await object.text();if(await digest(html)!==row.output_digest)throw fail('REPORT_UNAVAILABLE',404);
 return {row,candidate,html};
}
export async function listAccountZiweiMaterials(context){
 const owner=controlledZiweiIdentity(context).userId;
 const rows=(await context.env.RUNTIME_DB.prepare('SELECT report_id FROM account_method_report_materials WHERE owner_account_id=? ORDER BY released_at DESC LIMIT 100').bind(owner).all()).results;
 const reports=[];
 for(const row of rows){try{const {row:r,candidate}=await openAccountZiweiMaterial(context,row.report_id);reports.push({reportId:r.report_id,method:'ZWR',subjectName:candidate.snapshot.semanticContent.subject.displayName,locale:r.locale,releasedAt:r.released_at,version:r.report_version,status:'RELEASED'});}catch(e){if(e.status===503)throw e;}}
 return reports;
}
