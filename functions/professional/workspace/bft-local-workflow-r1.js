// Controlled local workflow adapter over PWS versions/relationships, native
// household consent and professional task/assignment contracts. No new store.
import {createHash} from 'node:crypto';
import {createHouseholdParticipantConsent,authorizeHouseholdFinancialAccess} from '../consent/joint-household-consent.js';
import {createProfessionalTask,transitionProfessionalTask} from './professional-task-contract.js';
import {createProfessionalAssignment} from '../access/professional-assignment-contract.js';
import {diagnoseOwnerLiquidity,calculateKpiVariance,calculateInstitutionBudget} from '../financial/bft-liquidity-candidate-r1.js';
const sha=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const need=(v,c,s=403)=>{if(!v)throw Object.assign(Error(c),{code:c,status:s});};
const permission={OWNER:['read','invite','revoke','role','prepare','submit','propose','review','approve','execute'],CONTRIBUTOR:['read','submit','propose'],FINANCE:['read','submit','propose'],APPROVER:['read','review','approve','propose'],REVIEWER:['read'],CONSULTANT:['read','prepare','propose']};
export const BFT_MEMBER_STATES=Object.freeze(['INVITED','ACCEPTED','ACTIVE','SUSPENDED','REVOKED','EXPIRED','DECLINED']);
export const BFT_REPORT_SECTIONS=Object.freeze(['Executive Summary','Subject & Business Structure','Current Financial Position','Profitability & Liquidity','Owner / Family Financial Connection','Business Process Performance','Risk & Protection','Constraints & Missing Evidence','Scenario Comparison','Recommendations for Professional Review','Action & Implementation Plan','Continuity & Review Schedule']);
export function createBftLocalWorkflow({registry,mode,clock=()=>new Date().toISOString()}){
 need(mode==='ISOLATED_SYNTHETIC_ONLY','BFT_FORMAL_OWNER_NOT_ADMITTED',503);
 const queue=new Map();
 async function get(id){const obj=await registry.query.getObject(id);need(obj?.status==='active'&&obj.owner_module==='PROFESSIONAL_WORKSPACE'&&obj.metadata?.syntheticOnly===true,'NOT_FOUND',404);need(!(await registry.restrictionStore.list(id,true)).length,'PWS_RESTRICTION_REVIEW_REQUIRED');const row=(await registry.versionStore.list(id))[0];need(row&&row.schema_version==='BFT-R1-LOCAL-CASE-v1','NOT_FOUND',404);need(sha(row.payload)===row.checksum,'PWS_VERSION_INTEGRITY_FAILED',409);return row;}
 function member(data,actor,operation){const m=data.members.find(x=>x.accountId===actor&&x.state==='ACTIVE'&&Date.parse(x.expiresAt)>Date.parse(clock()));need(m&&permission[m.role]?.includes(operation),'BFT_RESOURCE_DENIED');return m;}
 async function persist(id,data,actor){return registry.versionStore.append({object_id:id,schema_version:'BFT-R1-LOCAL-CASE-v1',payload:data,checksum:sha(data),created_by:actor});}
 async function create({id,subjectId,type,title,ownerId,packet=null,projectId=null}){
  need(['OWNER_LIQUIDITY','FAMILY_ENTERPRISE_CONTINUITY','BUSINESS_PROCESS_EXCELLENCE','ERP_DATA_READINESS','INSTITUTIONAL_PERFORMANCE'].includes(type),'BFT_CASE_TYPE_INVALID',422);
  need(!packet||packet.synthetic===true,'REAL_FINANCIAL_SOURCE_NOT_ADMITTED',503);
  if(!await registry.query.getObject(id))await registry.registerObject({object_id:id,object_code:id,object_type:'PROFESSIONAL_CASE_REFERENCE',canonical_name:title,owner_module:'PROFESSIONAL_WORKSPACE',metadata:{subjectId,type,syntheticOnly:true,productionAuthority:false}},{actor_id:ownerId,correlation_id:'BFT-R1-LOCAL-SEED'});
  if(!await registry.query.getObject(subjectId))await registry.registerObject({object_id:subjectId,object_code:subjectId,object_type:'CANDIDATE_SUBJECT_CONTEXT_REFERENCE',canonical_name:'Synthetic '+title,owner_module:'PROFILE',metadata:{syntheticOnly:true,formalAdmission:false}},{actor_id:ownerId,correlation_id:'BFT-R1-LOCAL-SEED'});
  if(!(await registry.relationshipStore.listForObject(id)).some(r=>r.relationship_type==='CASE_SUBJECT_CONTEXT_CANDIDATE'))await registry.relationshipStore.create({source_object_id:id,target_object_id:subjectId,relationship_type:'CASE_SUBJECT_CONTEXT_CANDIDATE',attributes:{syntheticOnly:true,confersPrivateSubjectAuthority:false},created_by:ownerId});
  if((await registry.versionStore.list(id)).length)return;
  const data={id,subjectId,type,title,projectId,synthetic:true,formalOwnerAdmission:false,engagement:'INITIAL_ENQUIRY',paid:false,clientAcceptedAdvice:false,packet,members:[{id:'owner:'+id,accountId:ownerId,role:'OWNER',dataScopes:['SHARED_CASE','FINANCIAL_SUMMARY'],state:'ACTIVE',expiresAt:'2030-01-01T00:00:00Z',purpose:'BFT_LOCAL_CASE',resourceId:id}],invitations:[],shared:[],goals:[],kpis:[],actions:[],requests:[],approvals:[],history:[],processed:[],retention:'LOCAL_SYNTHETIC_QA_ONLY_FORMAL_POLICY_NOT_ADMITTED'};
  await persist(id,data,ownerId);
 }
 async function read(id,actor){
  const row=await get(id),data=structuredClone(row.payload);member(data,actor,'read');
  data.shared=data.shared.filter(x=>{const m=data.members.find(m=>m.id===x.membershipId&&m.accountId===x.accountId&&m.state==='ACTIVE'&&Date.parse(m.expiresAt)>Date.parse(clock()));if(!m||m.consent?.granted_at!==x.consentGrantedAt)return false;try{authorizeHouseholdFinancialAccess([m.consent],{data_subject_id:x.accountId,scope:'expenses'});return true;}catch{return false;}});
  delete data.processed;
  if(data.packet)data.diagnosis=diagnoseOwnerLiquidity(data.packet);
  // Shared members get the shared view, never the underlying Personal packet.
  if(!data.members.find(m=>m.accountId===actor&&m.state==='ACTIVE').dataScopes?.includes('FINANCIAL_SUMMARY')){delete data.packet;delete data.diagnosis;if(data.report)data.report={version:data.report.version,preparedBy:data.report.preparedBy,reviewedBy:data.report.reviewedBy,approvalScope:data.report.approvalScope,sections:data.report.sections.map(s=>({section:s.section,title:s.title,analysis:'FINANCIAL_SCOPE_NOT_GRANTED'}))};}
  for(const m of data.members)if(m.state==='ACTIVE'&&Date.parse(m.expiresAt)<=Date.parse(clock()))m.state='EXPIRED';
  return {...data,version:row.version_number,sourceVersion:row.checksum,persistence:'LOCAL_PWS_VERSION_OWNER_NOT_FORMAL_CONTINUITY',production:false};
 }
 async function discover(actor){const rows=await registry.query.findObjects({object_type:'PROFESSIONAL_CASE_REFERENCE',limit:100});const items=[];for(const x of rows)try{const c=await read(x.object_id,actor);items.push({id:c.id,title:c.title,type:c.type,subjectId:c.subjectId});}catch(e){if(!['BFT_RESOURCE_DENIED','NOT_FOUND'].includes(e.code))throw e;}return items;}
 async function invitation(id,actor){const row=await get(id);return row.payload.invitations.filter(x=>x.targetAccountId===actor).map(x=>({id:x.id,caseId:id,state:x.state,role:x.role,dataScopes:x.dataScopes,purpose:'BFT_LOCAL_CASE',expiresAt:x.expiresAt}));}
 async function mutate(id,actor,input){
  const prior=queue.get(id)||Promise.resolve();let unlock;const current=new Promise(r=>unlock=r);queue.set(id,current);await prior;
  try{
   const row=await get(id),data=structuredClone(row.payload),requestHash=sha(input);
   need(typeof input.requestId==='string'&&input.requestId.length>0&&input.requestId.length<=100,'REQUEST_ID_REQUIRED',422);
   const old=data.processed.find(x=>x.id===input.requestId);if(old){need(old.actor===actor&&old.hash===requestHash,'REQUEST_CONFLICT',409);member(data,actor,'read');return{replayed:true,version:row.version_number};}
   need(input.expectedVersion===row.version_number,'VERSION_CONFLICT',409);
   const op=input.operation,at=clock();
   if(['accept','decline'].includes(op)){
    const i=data.invitations.find(x=>x.id===input.invitationId);need(i&&i.targetAccountId===actor&&i.state==='INVITED','INVITATION_DENIED');need(Date.parse(i.expiresAt)>Date.parse(at),'INVITATION_EXPIRED');need(input.explicitConsent===true,'EXPLICIT_PARTICIPANT_DECISION_REQUIRED');
    i.state=op==='decline'?'DECLINED':'ACCEPTED';
    if(op==='accept'){
     need(input.isAdult===true,'GUARDIAN_OWNER_NOT_ADMITTED');need(!data.members.some(m=>m.accountId===actor&&m.state==='ACTIVE'),'MEMBERSHIP_ALREADY_ACTIVE',409);
     need(!i.dataScopes?.includes('FINANCIAL_SUMMARY')||input.acceptDataScopes===true,'INDEPENDENT_DATA_SCOPE_CONSENT_REQUIRED');
     const m={id:crypto.randomUUID(),accountId:actor,role:i.role,dataScopes:i.dataScopes||['SHARED_CASE'],state:'ACTIVE',expiresAt:i.expiresAt,purpose:'BFT_LOCAL_CASE',resourceId:id,acceptedInvitationId:i.id};
     data.members.push(m);
    }
   }else{
    const policy={invite:'invite',revoke:'revoke',role:'role',suspend:'role',resume:'role',share:'submit',goal:'propose',kpi:'submit',kpiDefine:'prepare',kpiTarget:'prepare',action:'propose',actionSubmit:'submit',actionApprove:'approve',reopen:'propose',budgetSubmit:'submit',budgetRevise:'submit',budgetApprove:'approve',budgetExecute:'execute',prepare:'prepare',review:'review',clientDecision:'submit',engage:'prepare'};
    need(policy[op],'BFT_OPERATION_UNSUPPORTED',422);const self=member(data,actor,policy[op]);
    if(op==='invite'){
     need(permission[input.role]&&input.role!=='OWNER'&&typeof input.targetAccountId==='string','INVITATION_SCOPE_INVALID',422);need(Date.parse(input.expiresAt)>Date.parse(at),'INVITATION_EXPIRY_REQUIRED',422);
     need(input.isAdult===true,'GUARDIAN_OWNER_NOT_ADMITTED');
     const account=await registry.query.getObject('bft-account:'+input.targetAccountId);need(account?.object_type==='ACCOUNT_REFERENCE','VERIFIED_ACCOUNT_REFERENCE_REQUIRED');
     const dataScopes=input.dataScopes||['SHARED_CASE'];need(Array.isArray(dataScopes)&&dataScopes.length&&dataScopes.every(s=>['SHARED_CASE','FINANCIAL_SUMMARY'].includes(s)),'DATA_SCOPE_NOT_ALLOWED');
     need(!dataScopes.includes('FINANCIAL_SUMMARY')||data.type==='OWNER_LIQUIDITY','MEMBER_PRIVATE_FINANCIAL_SCOPE_NOT_SHARED');
     data.invitations.push({id:input.invitationId||crypto.randomUUID(),targetAccountId:input.targetAccountId,role:input.role,dataScopes,state:'INVITED',expiresAt:input.expiresAt,invitedBy:actor});
    }else if(['revoke','role','suspend','resume'].includes(op)){
     const m=data.members.find(x=>x.accountId===input.accountId&&x.state===(op==='resume'?'SUSPENDED':'ACTIVE'));need(m&&m.role!=='OWNER'&&m.accountId!==actor,'MEMBERSHIP_CHANGE_DENIED');
     if(op==='revoke'){m.state='REVOKED';if(m.consent)m.consent={...m.consent,revoked:true,status:'revoked'};}
     else if(op==='suspend'){m.state='SUSPENDED';}
     else if(op==='resume'){need(Date.parse(m.expiresAt)>Date.parse(at),'MEMBERSHIP_EXPIRED');m.state='ACTIVE';}
     else{need(permission[input.role]&&input.role!=='OWNER','ROLE_NOT_ALLOWED');m.role=input.role;}
    }else if(op==='share'){
     need(data.type==='FAMILY_ENTERPRISE_CONTINUITY','HOUSEHOLD_SCOPE_REQUIRED');
     if(!self.consent){need(input.explicitConsent===true&&input.isAdult===true,'INDEPENDENT_ADULT_CONSENT_REQUIRED');self.consent=createHouseholdParticipantConsent({participant_id:self.id,data_subject_id:actor,role:self.role==='OWNER'?'main_client':'joint_client',is_adult:true,financial_data_scopes:['expenses'],explicit_action:true},{now:at});}
     authorizeHouseholdFinancialAccess([self.consent],{data_subject_id:actor,scope:'expenses'});
     need(input.dataSubjectId===actor&&Number.isSafeInteger(input.contributionMinor)&&input.contributionMinor>=0&&input.sourceRef,'SHARED_EXPENSE_SOURCE_REQUIRED',422);
     data.shared.push({id:crypto.randomUUID(),accountId:actor,membershipId:self.id,consentGrantedAt:self.consent.granted_at,contributionMinor:input.contributionMinor,sourceRef:input.sourceRef,scope:'expenses',at});
    }else if(op==='goal'){
     need(typeof input.statement==='string'&&input.statement.trim()&&input.statement.length<=1000,'GOAL_REQUIRED',422);data.goals.push({statement:input.statement,proposedBy:actor,at,sharedDecision:false});
    }else if(op==='kpiDefine'){
     need(input.definition?.approvalStatus==='APPROVED'&&input.definition.approvalRef&&input.target?.sourceRef,'APPROVED_KPI_POLICY_REQUIRED',422);need(!data.kpis.some(k=>k.definition.id===input.definition.id),'KPI_ALREADY_DEFINED',409);
     data.kpis.push({definition:input.definition,target:input.target,targets:[input.target],measurements:[]});
    }else if(op==='kpiTarget'){
     const k=data.kpis.find(x=>x.definition.id===input.kpiId);need(k&&input.target?.approvalRef&&input.target?.sourceRef&&input.target.unit===k.definition.unit&&Number.isFinite(input.target.value)&&input.target.period,'APPROVED_PERIOD_TARGET_REQUIRED',422);need(!(k.targets||[k.target]).some(t=>t.period===input.target.period),'TARGET_PERIOD_ALREADY_APPROVED',409);k.targets=[...(k.targets||[k.target]),input.target];
    }else if(op==='kpi'){
     const k=data.kpis.find(x=>x.definition.id===input.kpiId);need(k,'KPI_NOT_FOUND',404);need(!k.measurements.some(x=>x.actual.period===input.actual?.period)||input.correctionReason,'SOURCE_CORRECTION_REASON_REQUIRED',409);
     const target=(k.targets||[k.target]).find(t=>t.period===input.actual?.period);const result=calculateKpiVariance({definition:k.definition,target,actual:input.actual});need(result.state==='CALCULATED','KPI_SOURCE_UNAVAILABLE',422);
     k.measurements.push({actual:input.actual,result,submittedBy:actor,at,correctionReason:input.correctionReason||null});
    }else if(op==='action'){
     need(input.actionOwner&&data.members.some(m=>m.accountId===input.actionOwner&&m.state==='ACTIVE'),'ACTION_OWNER_NOT_ACTIVE');need(input.proposedAction&&input.evidenceRef&&input.dueDate,'ACTION_SCOPE_REQUIRED',422);
     const task=createProfessionalTask({task_id:crypto.randomUUID(),workspace_id:id,client_id:data.subjectId,service_id:'BFT-LOCAL-CANDIDATE',task_type:'follow_up_due',status:'pending',due_at:input.dueDate,assigned_professional_id:input.actionOwner,consent_status:'local_candidate_only',boundary_flags:['SYNTHETIC','NO_PRODUCTION_AUTHORITY']},{now:at});
     data.actions.push({id:task.task_id,subjectId:data.subjectId,caseId:id,problemReference:input.evidenceRef,proposedAction:input.proposedAction,expectedOutcome:input.expectedOutcome||null,actionOwner:input.actionOwner,preparedBy:actor,approver:null,task:transitionProfessionalTask(transitionProfessionalTask(task,'assigned'),'in_progress'),completionEvidence:null,actualOutcome:null,remainingRisk:'REVIEW_REQUIRED'});
    }else if(op==='actionSubmit'){
     const action=data.actions.find(x=>x.id===input.actionId);need(action?.actionOwner===actor&&action.task.status==='in_progress','ACTIVE_ACTION_OWNER_REQUIRED');need(input.evidenceRef,'COMPLETION_EVIDENCE_REQUIRED',422);action.completionEvidence=input.evidenceRef;action.actualOutcome=input.actualOutcome||null;action.status='AWAITING_INDEPENDENT_REVIEW';
    }else if(op==='actionApprove'){
     const action=data.actions.find(x=>x.id===input.actionId);need(action?.completionEvidence&&action.actionOwner!==actor&&action.preparedBy!==actor,'INDEPENDENT_ACTION_REVIEW_REQUIRED');action.task=transitionProfessionalTask(action.task,'completed');action.approver=actor;action.status='COMPLETED_LOCAL_DATA_REVIEW';
    }else if(op==='reopen'){
     const action=data.actions.find(x=>x.id===input.actionId);need(action?.task.status==='completed'&&input.reason,'REOPEN_REASON_REQUIRED');
     // Native completed tasks remain immutable: reopen creates a native follow-up.
     const follow=createProfessionalTask({task_id:crypto.randomUUID(),workspace_id:id,client_id:data.subjectId,service_id:'BFT-LOCAL-CANDIDATE',task_type:'follow_up_due',due_at:input.dueDate,assigned_professional_id:action.actionOwner,boundary_flags:['REOPEN_FOLLOW_UP_NOT_HISTORY_REWRITE']},{now:at});data.actions.push({id:follow.task_id,task:follow,predecessorActionId:action.id,reopenReason:input.reason,caseId:id,subjectId:data.subjectId,actionOwner:action.actionOwner});
    }else if(op==='budgetSubmit'){
     need(input.projectId===data.projectId,'CROSS_PROJECT_DENIED');const calc=calculateInstitutionBudget(input.budget);need(calc.state==='CALCULATED'&&calc.projectId===data.projectId,'BUDGET_SOURCE_INVALID',422);
     data.requests.push({id:crypto.randomUUID(),projectId:data.projectId,preparedBy:actor,budget:input.budget,calculation:calc,state:'SUBMITTED',version:1});
    }else if(op==='budgetRevise'){
     const req=data.requests.find(x=>x.id===input.budgetRequestId);need(req&&req.state!=='EXECUTED_LOCAL_EVIDENCE_ONLY'&&(req.preparedBy===actor||self.role==='OWNER')&&input.reason,'BUDGET_REVISION_AUTHORITY_REQUIRED');
     const calc=calculateInstitutionBudget(input.budget);need(calc.state==='CALCULATED'&&calc.projectId===data.projectId,'BUDGET_SOURCE_INVALID',422);
     req.budget=input.budget;req.calculation=calc;req.version++;req.state='SUBMITTED';delete req.approvedVersion;delete req.approvedBy;delete req.approvedSpendMinor;
    }else if(op==='budgetApprove'){
     const req=data.requests.find(x=>x.id===input.budgetRequestId);need(req&&req.preparedBy!==actor&&req.projectId===data.projectId&&req.state==='SUBMITTED','INDEPENDENT_BUDGET_APPROVAL_REQUIRED');
     need(Number.isSafeInteger(input.spendMinor)&&input.spendMinor>=0,'SPEND_AMOUNT_REQUIRED',422);
     const available=req.calculation.unrestrictedUncommittedMinor;
     const reserved=data.requests.filter(x=>x.id!==req.id&&['APPROVED_LOCAL','EXECUTED_LOCAL_EVIDENCE_ONLY'].includes(x.state)).reduce((n,x)=>n+x.approvedSpendMinor,0);
     need(!data.requests.some(x=>x.id!==req.id&&['APPROVED_LOCAL','EXECUTED_LOCAL_EVIDENCE_ONLY'].includes(x.state)&&JSON.stringify(x.budget)!==JSON.stringify(req.budget)),'BUDGET_BASELINE_RECONCILIATION_REQUIRED');
     need(input.spendMinor<=available-reserved,'RESTRICTED_OR_UNAVAILABLE_FUNDS');req.state='APPROVED_LOCAL';req.approvedBy=actor;req.approvedSpendMinor=input.spendMinor;req.approvedVersion=req.version;
    }else if(op==='budgetExecute'){
     const req=data.requests.find(x=>x.id===input.budgetRequestId);need(req?.state==='APPROVED_LOCAL'&&req.approvedVersion===req.version&&input.evidenceRef,'APPROVED_BUDGET_VERSION_AND_EVIDENCE_REQUIRED');req.state='EXECUTED_LOCAL_EVIDENCE_ONLY';req.executionEvidence=input.evidenceRef;req.executedBy=actor;
    }else if(op==='engage'){
     need(self.role==='OWNER','CLIENT_OWNER_DECISION_REQUIRED');
     const states=['INITIAL_ENQUIRY','SERVICE_SCOPE','CLIENT_AUTHORIZATION','ENGAGEMENT_ACCEPTED','DATA_COLLECTION','DIAGNOSIS','PROFESSIONAL_REVIEW','CLIENT_PRESENTATION','ACTION_PLAN','IMPLEMENTATION','REVIEW','CLOSURE'];
     need(states.indexOf(input.nextState)===states.indexOf(data.engagement)+1,'ENGAGEMENT_TRANSITION_INVALID',409);need(input.scopeRef&&input.explicitClientDecision===true,'CLIENT_SCOPE_DECISION_REQUIRED');data.engagement=input.nextState;
    }else if(op==='clientDecision'){
     need(self.role==='OWNER'&&data.report?.reviewedBy&&input.explicitClientDecision===true&&input.sourceRef,'CLIENT_REVIEW_ACKNOWLEDGMENT_REQUIRED');
     need(['ACKNOWLEDGE_FOR_PLANNING','DECLINE','REQUEST_CHANGES'].includes(input.decision),'CLIENT_DECISION_INVALID',422);
     data.clientAcknowledgment={actorId:actor,reportVersion:data.report.version,decision:input.decision,sourceRef:input.sourceRef,at,scope:'DATA_AND_OPTIONS_ONLY',regulatedAdviceAccepted:false};
    }else if(op==='prepare'){
     need(!data.packet||self.dataScopes?.includes('FINANCIAL_SUMMARY'),'FINANCIAL_SCOPE_NOT_GRANTED');
     const assignment=createProfessionalAssignment({assignment_id:crypto.randomUUID(),professional_id:actor,client_id:data.subjectId,service_id:'BFT-LOCAL-CANDIDATE',purpose:'BFT_LOCAL_SYNTHETIC_REVIEW',journey_ids:[id],resource_scopes:['reading'],required_capability_codes:['FORMAL_BFT_CAPABILITY_NOT_ADMITTED'],starts_at:at},{now:at});
     const diagnosis=data.packet?diagnoseOwnerLiquidity(data.packet):null;
     data.report={version:(data.report?.version||0)+1,assignment,preparedBy:actor,reviewedBy:null,approvedBy:null,approvalScope:'NONE',regulatedAdviceApproved:false,sections:BFT_REPORT_SECTIONS.map((title,i)=>({section:i+1,title,inputEvidence:diagnosis?.metrics.flatMap(x=>x.sourceRefs)||[],analysis:i===3?diagnosis:null,findings:diagnosis?.findings||[],constraints:['Missing / conflicting inputs remain explicit','Independent review and client decision required'],options:i===8?diagnosis?.scenarios||[]:[],requiredDecision:'HUMAN_REVIEW_REQUIRED',nextStep:'Confirm authorized sources; no automatic implementation',applicability:data.type==='INSTITUTIONAL_PERFORMANCE'&&[3,4,5].includes(i)?'NOT_APPLICABLE':'CANDIDATE'}))};
    }else if(op==='review'){
     need(!data.packet||self.dataScopes?.includes('FINANCIAL_SUMMARY'),'FINANCIAL_SCOPE_NOT_GRANTED');
     need(data.report&&data.report.preparedBy!==actor&&input.reason,'INDEPENDENT_REPORT_REVIEW_REQUIRED');data.report.reviewedBy=actor;data.report.reviewReason=input.reason;data.report.approvalScope='DATA_AND_STRUCTURE_ONLY';data.report.regulatedAdviceApproved=false;
    }
   }
   data.history.push({id:crypto.randomUUID(),operation:op,actorId:actor,at,priorVersion:row.version_number,reason:input.reason||input.correctionReason||null});data.processed.push({id:input.requestId,actor,hash:requestHash});data.processed=data.processed.slice(-256);
   const next=await persist(id,data,actor);return{ok:true,version:next.version_number,scope:'LOCAL_PWS_OWNER_ONLY_NOT_FORMAL_CONTINUITY'};
  }finally{unlock();if(queue.get(id)===current)queue.delete(id);}
 }
 return{create,read,discover,invitation,mutate};
}
