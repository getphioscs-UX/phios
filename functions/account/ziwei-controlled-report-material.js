import {controlledZiweiIdentity,requireZiweiEntitlement} from '../report-delivery/ziwei-controlled-generation.js';
import {admitPersonUse} from './person-use-policy.js';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
import {createCustomerDeliverySnapshot} from '../personal-reading/narrative/report-section-snapshot.js';
import {assertReportSubjectBinding} from '../canonical-presentation-runtime/report-cover-subject.js';
const TYPE='ZWR_CONTROLLED_RELEASE_MATERIAL_V1';
const deny=()=>{throw Error('REPORT_UNAVAILABLE');};
function storage(context){if(!context.env?.RUNTIME_DB?.prepare||!context.env.PRIVATE_REPORTS?.put||!context.env.PRIVATE_REPORTS?.get)throw Error('PRIVATE_REPORT_STORAGE_UNAVAILABLE');return context.env.RUNTIME_DB;}
async function personAccess(userId,personId,loadSubject){
 if(typeof loadSubject!=='function')throw Error('CANONICAL_SUBJECT_OWNER_NOT_BOUND');
 const r=await loadSubject(userId,personId);if(r?.person?.personId!==personId)deny();
 admitPersonUse({userId,person:r.person,consent:r.reportConsent,purpose:'REPORT'});
}
async function intact(candidate){
 if(candidate?.scope!=='CONTROLLED_QA_ONLY'||candidate.snapshot?.methodId!=='ZWR')deny();
 const s=candidate.snapshot,c=s.semanticContent;
 if((await createCustomerDeliverySnapshot(s)).semanticSnapshotId!==s.semanticSnapshotId)deny();
 if(c.evidence.subjectId!==candidate.personId||c.subject.subjectReference!==candidate.personId||s.locale!==candidate.locale||s.subjectFingerprint!==c.subject.subjectFingerprint||s.inputFingerprint!==c.evidence.inputFingerprint)deny();
 if(c.sections.some(x=>x.claims.some(k=>k.subjectId!==candidate.personId||k.inputFingerprint!==c.evidence.inputFingerprint)))deny();
 if(c.report.intro[0].subject.subjectFingerprint!==c.subject.subjectFingerprint)deny();
 await assertReportSubjectBinding({presentation:c.subject,expectedBinding:c.subjectBinding});
}
export async function releaseControlledZiweiReport(context,candidate,{loadSubject,renderVerification}={}){
 const identity=controlledZiweiIdentity(context);if(candidate.customerId!==identity.userId)deny();
 const owned=await requireZiweiEntitlement(context,candidate.locale);if(owned.purchase_id!==candidate.purchaseId)deny();
 await personAccess(identity.userId,candidate.personId,loadSubject);await intact(candidate);
 // Receipt is supplied by the server render verifier, never a customer route.
 if(renderVerification?.semanticSnapshotId!==candidate.snapshot.semanticSnapshotId||renderVerification.passed!==true||renderVerification.pageCount!==33)throw Error('REPORT_RENDER_VERIFICATION_REQUIRED');
 const db=storage(context),digest=await sha256Stable(candidate),id='zwr-'+digest,key='controlled-ziwei/'+digest+'.json',now=new Date().toISOString();
 const metadata={scope:'CONTROLLED_QA_ONLY',customerId:identity.userId,personId:candidate.personId,locale:candidate.locale,purchaseId:candidate.purchaseId,snapshotId:candidate.snapshot.semanticSnapshotId,key,digest,releaseStatus:'ACTIVE',releasedAt:now,renderVerification};
 await context.env.PRIVATE_REPORTS.put(key,JSON.stringify(candidate),{httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});
 await db.batch([
  db.prepare("INSERT INTO runtime_users(user_id,status,created_at,updated_at) VALUES(?,'active',?,?) ON CONFLICT(user_id) DO NOTHING").bind(identity.userId,now,now),
  db.prepare("INSERT INTO runtimes(runtime_id,user_id,status,current_stage,schema_version,state,created_at,updated_at) VALUES(?,?,'active','released_report',?,'{}',?,?) ON CONFLICT(runtime_id) DO NOTHING").bind(id,identity.userId,TYPE,now,now),
  db.prepare('INSERT INTO runtime_artifacts(artifact_id,runtime_id,artifact_type,stage,payload,schema_version,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(artifact_id) DO NOTHING').bind(id,id,TYPE,'released_report',JSON.stringify(metadata),TYPE,now,now)
 ]);
 return {reportId:id,semanticSnapshotId:candidate.snapshot.semanticSnapshotId,releaseStatus:'ACTIVE',scope:'CONTROLLED_QA_ONLY'};
}
export async function openControlledZiweiReport(context,{reportId,personId},{loadSubject}={}){
 const identity=controlledZiweiIdentity(context),db=storage(context);
 const row=await db.prepare('SELECT a.payload FROM runtime_artifacts a JOIN runtimes r ON r.runtime_id=a.runtime_id WHERE a.artifact_id=? AND r.user_id=? AND a.artifact_type=? AND r.status=?').bind(reportId,identity.userId,TYPE,'active').first();
 if(!row)deny();const m=JSON.parse(row.payload);
 if(m.customerId!==identity.userId||m.personId!==personId||m.releaseStatus!=='ACTIVE')deny();
 await requireZiweiEntitlement(context,m.locale);await personAccess(identity.userId,personId,loadSubject);
 const object=await context.env.PRIVATE_REPORTS.get(m.key);if(!object)deny();
 const candidate=JSON.parse(await object.text());if(await sha256Stable(candidate)!==m.digest)deny();
 if(candidate.personId!==personId||candidate.customerId!==identity.userId||candidate.snapshot.semanticSnapshotId!==m.snapshotId)deny();
 await intact(candidate);return candidate;
}
export async function listControlledZiweiReports(context,{loadSubject}={}){
 const identity=controlledZiweiIdentity(context),db=storage(context);
 const rows=(await db.prepare('SELECT a.artifact_id,a.payload FROM runtime_artifacts a JOIN runtimes r ON r.runtime_id=a.runtime_id WHERE r.user_id=? AND a.artifact_type=? AND r.status=?').bind(identity.userId,TYPE,'active').all()).results||[];
 const reports=[];for(const row of rows){const m=JSON.parse(row.payload);try{await openControlledZiweiReport(context,{reportId:row.artifact_id,personId:m.personId},{loadSubject});reports.push({reportId:row.artifact_id,personId:m.personId,locale:m.locale,releaseStatus:m.releaseStatus,semanticSnapshotId:m.snapshotId});}catch{}}
 return reports;
}
