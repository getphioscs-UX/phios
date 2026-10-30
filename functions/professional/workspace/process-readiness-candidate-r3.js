import {authorizeR3,requireR3} from '../../profile/subject-bft-authority-candidate-r3.js';
import {digest} from '../../account/oidc-auth.js';
export const ERP_COMPONENTS=Object.freeze(['asIs','toBe','dataDictionary','masterDataInventory','costDataMapping','departmentResponsibility','raci','kpiDictionary','gaps','dataQuality','uatScenarios','uatIssues','goLiveReadiness','postGoLiveReview']);
const processFields=['id','version','department','sourceRef','rootCause',...ERP_COMPONENTS,'score','notAnERPReplacement','productionAdmission'];
const processProjection=p=>Object.fromEntries(Object.entries(p).filter(([k])=>processFields.includes(k)));
export function validateProcessReadiness(input){
 requireR3(input&&typeof input.id==='string'&&/^[a-z0-9-]{1,60}$/.test(input.id)&&input.department&&input.sourceRef&&Number.isInteger(input.version)&&input.version>0,'PROCESS_ID_SOURCE_VERSION_REQUIRED',422);
 for(const phase of ['asIs','toBe']){const p=input[phase];requireR3(p?.name&&p.owner&&p.trigger&&p.input&&p.activity&&p.output&&p.handoff&&p.controlPoint&&p.evidenceRef,'PROCESS_FLOW_INCOMPLETE',422);}
 for(const field of ERP_COMPONENTS.filter(x=>!['asIs','toBe','goLiveReadiness','postGoLiveReview'].includes(x)))requireR3(Array.isArray(input[field]),'ERP_COMPONENT_MISSING:'+field,422);
 requireR3(input.dataDictionary.every(r=>r.field&&r.unit&&r.sourceOwner&&r.definition)&&new Set(input.dataDictionary.map(r=>r.field)).size===input.dataDictionary.length,'DATA_DICTIONARY_INVALID',422);
 requireR3(input.raci.every(r=>r.taskRef&&Array.isArray(r.accountable)&&r.accountable.length===1&&r.responsible?.length),'RACI_ACCOUNTABILITY_REQUIRED',422);
 requireR3(input.rootCause?.hypothesis&&input.rootCause.evidenceRef&&input.rootCause.alternativeExplanation,'ROOT_CAUSE_EVIDENCE_REQUIRED',422);
 const blocked=input.uatIssues.some(i=>i.blocking===true&&i.state!=='RESOLVED')||input.uatScenarios.some(s=>s.actual!=='PASS'||!s.evidenceRef);
 return{...structuredClone(processProjection(input)),rootCause:{...input.rootCause,status:'HYPOTHESIS_NOT_EMPLOYEE_FAULT'},score:null,goLiveReadiness:{state:blocked?'BLOCKED':'LOCAL_REVIEW_READY_NOT_ERP_DEPLOYMENT',blockingIssues:input.uatIssues.filter(i=>i.blocking&&i.state!=='RESOLVED').length},postGoLiveReview:{state:'NOT_RUN'},notAnERPReplacement:true,productionAdmission:false};
}
export function createProcessReadinessCandidate(deps){const {registry,workflow}=deps;
 async function save(subjectId,identity,input){const auth=await authorizeR3(deps,subjectId,identity,'process:write');requireR3(['BUSINESS','TEAM','INSTITUTION'].includes(auth.subject.metadata.subjectType),'PROCESS_SUBJECT_NOT_APPLICABLE');const p=validateProcessReadiness(input),id=auth.caseId+':process:'+p.id,old=await registry.query.getObject(id);const c=await workflow.read(auth.caseId,identity.userId);const active=new Set(c.members.filter(m=>m.state==='ACTIVE').map(m=>m.accountId));requireR3(p.raci.every(r=>[...r.accountable,...r.responsible].every(a=>active.has(a))),'RACI_MEMBER_NOT_AUTHORIZED');
  if(!old)await registry.registerObject({object_id:id,object_code:id,object_type:'PROFESSIONAL_PROCESS_REFERENCE',canonical_name:p.asIs.name,owner_module:'PROFESSIONAL_WORKSPACE',metadata:{subjectId,caseId:auth.caseId,syntheticOnly:true}},{actor_id:identity.userId,correlation_id:'SUBJECT-BFT-R3'});
  const versions=await registry.versionStore.list(id);requireR3(p.version===versions.length+1,'PROCESS_VERSION_CONFLICT',409);const v=await registry.versionStore.append({object_id:id,schema_version:'PROCESS-READINESS-CANDIDATE-R3',payload:p,checksum:await digest(JSON.stringify(p)),created_by:identity.userId});return{referenceId:id,version:v.version_number,sourceVersion:v.checksum,readiness:p.goLiveReadiness};}
 async function read(subjectId,identity,id){const auth=await authorizeR3(deps,subjectId,identity,'reading:probe'),obj=await registry.query.getObject(id);requireR3(obj?.metadata.subjectId===subjectId&&obj.metadata.caseId===auth.caseId,'PROCESS_NOT_FOUND',404);const v=(await registry.versionStore.list(id))[0];requireR3(v&&await digest(JSON.stringify(v.payload))===v.checksum,'PROCESS_INTEGRITY_FAILURE',409);return{referenceId:id,...processProjection(v.payload),sourceVersion:v.checksum};}
 return{save,read};
}
