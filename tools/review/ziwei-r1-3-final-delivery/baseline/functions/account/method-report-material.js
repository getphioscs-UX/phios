import {assertMethodGeneration,methodMaterialIdentity} from '../report-delivery/method-render-contract.js';
import {digest} from './oidc-auth.js';
import {grantDeliveredReportFollowups} from './report-followup-store.js';
import {closeReleasedReportBudget} from '../personal-reading/report-delivery-budget.js';
const fail=()=>{throw Object.assign(new Error('REPORT_UNAVAILABLE'),{code:'REPORT_UNAVAILABLE',status:404});};
// Existing SQL and private object owners remain canonical. Adapters must perform
// method entitlement, subject consent and release admission on every read.
export async function readMethodReportMaterial(context,reportId,{ownerAccountId,openReleasedCandidate,loadReleaseReceipt}={}){
 if(!ownerAccountId||typeof openReleasedCandidate!=='function')fail();
 const row=await context.env.RUNTIME_DB.prepare('SELECT rowid AS report_version,* FROM account_method_report_materials WHERE owner_account_id=? AND report_id=?').bind(ownerAccountId,reportId).first();
 if(!row)fail();
 const candidate=await openReleasedCandidate(row);
 if(candidate.customerId!==ownerAccountId||candidate.personId!==row.person_id||candidate.snapshot.methodId!==row.method_code||candidate.snapshot.semanticSnapshotId!==row.snapshot_id||candidate.locale!==row.locale)fail();
 const contract=await assertMethodGeneration(candidate);
 let receipt;try{receipt=JSON.parse(row.verifier_receipt)}catch{fail();}
 if(typeof loadReleaseReceipt!=='function')fail();
 const releaseReceipt=await loadReleaseReceipt(row),{materialIdentity,...renderReceipt}=receipt;
 if(JSON.stringify(releaseReceipt)!==JSON.stringify(renderReceipt))fail();
 const expected=await methodMaterialIdentity(candidate,receipt);
 if((contract.requiresBoundMaterialIdentity||receipt.materialIdentity)&&JSON.stringify(expected)!==JSON.stringify(receipt.materialIdentity))fail();
 if(receipt.outputDigest!==row.output_digest)fail();
 const object=await context.env.PRIVATE_REPORTS.get(row.object_key);if(!object)fail();
 const html=await object.text();if(await digest(html)!==row.output_digest)fail();
 return {row,candidate,html};
}
export async function persistMethodReportMaterial(context,{release,candidate,html,receipt,identity}){
 if(receipt.outputDigest!==await digest(html))fail();
 const objectKey=`released-method/${release.reportId}/${receipt.outputDigest}.html`,now=new Date().toISOString();
 const enriched={...receipt,materialIdentity:identity};
 // Content addressed object; never replace the first report material identity.
 const prior=await context.env.RUNTIME_DB.prepare('SELECT * FROM account_method_report_materials WHERE owner_account_id=? AND report_id=?').bind(candidate.customerId,release.reportId).first();
 const grantFollowups=async()=>{
  await closeReleasedReportBudget(context,{candidate,release,receipt});
  if(context.env.PHIOS_REPORT_FOLLOWUP_QA_ENABLED==='true'&&['local','qa','preview'].includes(context.env.PHIOS_ENVIRONMENT))await grantDeliveredReportFollowups(context.env,{reportId:release.reportId,ownerAccountId:candidate.customerId,purchaseId:candidate.purchaseId,methodCode:candidate.snapshot.methodId});
 };
 if(prior){if(prior.snapshot_id!==candidate.snapshot.semanticSnapshotId)fail();await grantFollowups();return {reportId:release.reportId};}
 await context.env.PRIVATE_REPORTS.put(objectKey,html,{httpMetadata:{contentType:'text/html; charset=utf-8',cacheControl:'private, no-store'}});
 await context.env.RUNTIME_DB.prepare('INSERT INTO account_method_report_materials(report_id,owner_account_id,person_id,method_code,locale,snapshot_id,object_key,output_digest,released_at,verifier_receipt) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(report_id) DO NOTHING').bind(release.reportId,candidate.customerId,candidate.personId,candidate.snapshot.methodId,candidate.locale,candidate.snapshot.semanticSnapshotId,objectKey,receipt.outputDigest,now,JSON.stringify(enriched)).run();
 await grantFollowups();return {reportId:release.reportId};
}
