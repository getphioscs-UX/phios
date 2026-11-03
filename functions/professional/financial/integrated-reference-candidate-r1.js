// Thin version/permission adapter over the existing encrypted Report Context owner.
import {authorizeR3,R3_PURPOSE} from '../../profile/subject-bft-authority-candidate-r3.js';
import {authorizeSubject} from '../../profile/subject-context-r1.js';
import {saveContextRecord,loadContextRecord} from '../../report-context/report-context-store.js';
import {familyPlanning} from './financial-transformation-integration-candidate-r1.js';
const need=(v,c)=>{if(!v)throw Error(c);};
export async function checkIntegratedReference(o,identity,current){
 const {family,sourceVersionRefs}=current.data;
 need(familyPlanning(family,{at:new Date().toISOString()}).status==='CONSENTED_SYNTHETIC_SUMMARY','SHARED_CONSENT_REQUIRED');
 const grant=await authorizeR3(o.deps,family.subjectId,identity,'continuity:reopen');
 // A current reader grant does not replace another adult's current sharing grant.
 const sharingGrants=[];for(const member of family.members){
  const base=await authorizeSubject(o.registry,family.subjectId,member.accountId),relations=await o.registry.relationshipStore.listForObject(family.subjectId),now=Date.now();let sharing=null;
  for(const r of relations){const a=r.attributes||{};if(r.target_object_id!==family.subjectId||r.relationship_type!=='SUBJECT_BFT_CANDIDATE_ACCESS'||r.status!=='active'||Date.parse(r.valid_from)>now||!r.valid_to||Date.parse(r.valid_to)<=now||a.purpose!==R3_PURPOSE||a.subjectVersion!==base.object.metadata.version||!a.scopes?.includes('reading:probe'))continue;
   const account=await o.registry.query.getObject(r.source_object_id);if(account?.status!=='active'||account.owner_module!=='ACCOUNT'||account.metadata.canonicalAccountId!==member.accountId)continue;
   const c=await o.workflow.read(a.caseId,member.accountId);if(c.members.some(m=>m.id===a.membershipId&&m.accountId===member.accountId&&m.state==='ACTIVE')){sharing={grantId:r.relationship_id,subjectVersion:a.subjectVersion};break;}}
  need(sharing,'SHARED_MEMBER_CURRENT_GRANT_REQUIRED');sharingGrants.push(sharing);
 }
 const sources=[];for(const ref of sourceVersionRefs){await authorizeR3(o.deps,ref.subjectId,identity,'reading:probe');const source=await o.intakes.read(ref.intakeRef,identity);need(source.sourceVersion===ref.sourceVersion&&source.record.dataQuality==='RECONCILED','INTEGRATED_SOURCE_VERSION_CONFLICT');sources.push({referenceId:ref.intakeRef,sourceVersion:source.sourceVersion,reviewVersion:source.version});}
 for(const key of ['reportSha256','datasetSha256'])need(/^[a-f0-9]{64}$/.test(current[key]),'INTEGRATED_DIGEST_REQUIRED');
 return{subjectId:family.subjectId,grantVersion:grant.grantVersion,sharingGrants,sources,consentRefs:family.members.map(m=>m.consent.reference),reportSha256:current.reportSha256,datasetSha256:current.datasetSha256,version:current.data.version};
}
export async function saveIntegratedReference(o,identity,current){
 await authorizeR3(o.deps,current.data.family.subjectId,identity,'continuity:save');const binding=await checkIntegratedReference(o,identity,current);
 const recordId=await saveContextRecord(o.ownerContext(identity),'NAVIGATION',{ownerAccountId:identity.userId,personId:null,purpose:'LOCAL_SYNTHETIC_INTEGRATED_REVIEW',binding,expiresAt:new Date(Date.now()+86400000).toISOString(),productionArtifactAllowed:false});return{recordId,binding};
}
export async function reopenIntegratedReference(o,identity,id,current){
 const p=await loadContextRecord(o.ownerContext(identity),id,'NAVIGATION'),binding=await checkIntegratedReference(o,identity,current);
 need(p.purpose==='LOCAL_SYNTHETIC_INTEGRATED_REVIEW'&&Date.parse(p.expiresAt)>Date.now()&&JSON.stringify(p.binding)===JSON.stringify(binding),'INTEGRATED_VERSION_OR_PERMISSION_CONFLICT');
 return{...p,permissionRechecked:true,sourceVersionRechecked:true,reviewPerformed:false};
}
