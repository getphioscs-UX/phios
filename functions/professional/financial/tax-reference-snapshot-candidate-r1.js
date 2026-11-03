import {authorizeR3} from '../../profile/subject-bft-authority-candidate-r3.js';
import {saveContextRecord,loadContextRecord} from '../../report-context/report-context-store.js';
export async function saveTaxReference(o,identity,{subjectId,intakeRef,sourceVersion,reviewVersion,ruleVersion,reportVersion,reportSha256,datasetSha256}){
 const grant=await authorizeR3(o.deps,subjectId,identity,'continuity:save'),source=await o.intakes.read(intakeRef,identity);
 if(source.sourceVersion!==sourceVersion||String(source.version)!==reviewVersion||!['REVIEWED','RECONCILED'].includes(source.record.dataQuality)||source.record.context.subjectId!==subjectId)throw Error('TAX_SNAPSHOT_SOURCE_VERSION_CONFLICT');
 if(!/^[a-f0-9]{64}$/.test(reportSha256)||!/^[a-f0-9]{64}$/.test(datasetSha256))throw Error('TAX_SNAPSHOT_DIGEST_REQUIRED');
 const payload={version:'TAX-R1-REFERENCE-1',ownerAccountId:identity.userId,personId:null,subjectId,intakeRef,sourceVersion,reviewVersion,grantVersion:grant.grantVersion,ruleVersion,reportVersion,reportSha256,datasetSha256,savedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+86400000).toISOString(),dataNature:'LOCAL_SYNTHETIC_ONLY',artifactStatus:'BUSINESS_ARTIFACT_ADMISSION_BLOCKED'};
 const recordId=await saveContextRecord(o.ownerContext(identity),'NAVIGATION',payload);return{recordId,subjectId,reportSha256};
}
export async function reopenTaxReference(o,identity,recordId,{reportSha256,datasetSha256}){
 const p=await loadContextRecord(o.ownerContext(identity),recordId,'NAVIGATION');const grant=await authorizeR3(o.deps,p.subjectId,identity,'continuity:reopen'),source=await o.intakes.read(p.intakeRef,identity);
 if(p.version!=='TAX-R1-REFERENCE-1'||p.ownerAccountId!==identity.userId||p.grantVersion!==grant.grantVersion||p.sourceVersion!==source.sourceVersion||p.reviewVersion!==String(source.version)||p.reportSha256!==reportSha256||p.datasetSha256!==datasetSha256||Date.parse(p.expiresAt)<=Date.now())throw Error('TAX_SNAPSHOT_VERSION_OR_INTEGRITY_CONFLICT');
 return{...p,permissionRechecked:true,sourceVersionRechecked:true,businessDownloadAllowed:false};
}
