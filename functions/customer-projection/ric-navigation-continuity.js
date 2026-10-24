// Opt-in local candidate. No production route or storage binding imports this module.
// Extends the existing PC reality record owner, not the read-only Graph authority.
import {newRealityCandidateStore,saveSelectedReality,reviewRealityRecord} from './pc-r1-reality-successor.js';
const need=(v,c)=>{if(!v)throw Object.assign(new Error(c),{code:c});};
const text=(s,max=3000)=>{need(typeof s==='string'&&s.trim()&&s.length<=max,'TEXT_REQUIRED_OR_TOO_LONG');return s.trim();};
const kinds=['FACT','PREFERENCE','CONSTRAINT','EVIDENCE','INTERPRETATION','DECISION','NEXT_ACTION','UNKNOWN'];
const owner=(c,user)=>need(c?.owner_user_id===user,'CASE_NOT_FOUND');
const id=()=>crypto.randomUUID();
const event=(c,type,refs,reason,at)=>{c.history.push({id:id(),type,refs,reason,at});c.version++;c.updated_at=at;};
export function createContinuityCase({userId,question,goal,topic='self',locale='en',at=new Date().toISOString()}){
 need(userId,'AUTH_REQUIRED');const caseId=id();
 return {schemaVersion:'RIC-CONTINUITY-LOCAL-v1',case_id:caseId,owner_user_id:userId,title:text(question,800),current_question:text(question,800),goal:text(goal,800),topic,language:locale==='zh-Hans'?'zh-Hans':'en',status:'Active',active_branch_id:'main',version:1,questionVersion:1,created_at:at,updated_at:at,store:newRealityCandidateStore({accountId:userId,entities:[{id:caseId,kind:'REALITY_CASE',accountId:userId}]}),records:[],checkpoints:[],history:[],branches:[{id:'main',parent:null,title:text(question,800)}],productionPersistence:false};
}
export function updateContinuityCase(previous,input,{userId,at=new Date().toISOString(),resolvedEvidence=null,validateEvidence=null}={}){
 owner(previous,userId);need(input.expectedVersion===previous.version,'VERSION_CONFLICT');const c=structuredClone(previous);const action=input.action;
 if(action==='record'){
  need(kinds.includes(input.kind),'RECORD_KIND_INVALID');const content=text(input.content),rid=id();
  need(c.records.length<500,'RECORD_LIMIT');
  need(c.branches.some(b=>b.id===c.active_branch_id),'BRANCH_INVALID');
  const evidence=input.kind==='EVIDENCE';need(!evidence||resolvedEvidence?.sourceRef&&resolvedEvidence.sourceVersion,'SERVER_SOURCE_REQUIRED');
  c.store=saveSelectedReality(c.store,{actorAccountId:userId,entityId:c.case_id,sourceProduct:'ASK',sourceKind:evidence?'EXTERNAL_PROVIDER':'CUSTOMER_ENTERED',selectedItems:[{id:rid,statement:evidence?text(resolvedEvidence.statement):content,authority:evidence?'DOCUMENTED':'DECLARED',sourceRef:evidence?resolvedEvidence.sourceRef:'USER_EXPLICIT_SELECTION'}],action:'SAVE_SELECTED',consent:input.consent===true,sourceConsent:{[evidence?'EXTERNAL_PROVIDER':'CUSTOMER_ENTERED']:true},at});
  c.records.push({record_id:rid,kind:input.kind,content:evidence?resolvedEvidence.statement:content,source_type:evidence?'SERVER_RESOLVED_EVIDENCE':input.kind==='INTERPRETATION'?'USER_REVIEWED_INTERPRETATION':'USER_STATEMENT',source_reference:evidence?structuredClone(resolvedEvidence):null,confirmation_status:'UNCONFIRMED',verification_status:evidence?'SOURCE_BOUND_NOT_PERSONAL_FACT':'NOT_INDEPENDENTLY_VERIFIED',validity:'ACTIVE',consent_scope:'THIS_CASE',branch_id:c.active_branch_id,version:1,created_at:at,updated_at:at,supportRefs:[]});
  event(c,'RECORD_PROPOSED',[rid],'Explicit selection; awaiting confirmation',at);
 }else if(['confirm','correct','withdraw','delete'].includes(action)){
  const r=c.records.find(r=>r.record_id===input.recordId);need(r&&r.validity==='ACTIVE','RECORD_NOT_ACTIVE');need(input.consent===true,'REVIEW_CONSENT_REQUIRED');
  const reason=text(input.reason||'User review',500),beforeVersion=r.version;
  if(action==='confirm'){
   if(r.kind==='EVIDENCE')need(sourceReview(r.source_reference,{at,validateEvidence}).state==='VALID','SOURCE_RECHECK_REQUIRED');
   c.store=reviewRealityRecord(c.store,{actorAccountId:userId,entityId:c.case_id,recordId:r.record_id,action:'CONFIRM',reason,at,consent:true});r.confirmation_status='USER_CONFIRMED';
  }else{
   need(r.kind!=='EVIDENCE'||action!=='correct','SOURCE_CANNOT_BE_CLIENT_REWRITTEN');
   c.store=reviewRealityRecord(c.store,{actorAccountId:userId,entityId:c.case_id,recordId:r.record_id,action:action==='correct'?'CORRECT':'REMOVE_ACTIVE',statement:action==='correct'?text(input.content):undefined,reason,at,consent:true});
   if(action==='correct'){r.content=text(input.content);r.confirmation_status='UNCONFIRMED';}
   else {r.validity=action==='delete'?'DELETED':'WITHDRAWN';r.content='';r.source_reference=null;}
   // Downstream interpretations must never remain current after a changed input.
   for(const x of c.records)if(['INTERPRETATION','DECISION','NEXT_ACTION'].includes(x.kind)&&x.validity==='ACTIVE'&&x.record_id!==r.record_id)x.validity='REVIEW_REQUIRED';
   for(const p of c.checkpoints)if(p.state==='CURRENT')p.state='REVIEW_REQUIRED';
   if(action==='delete'){
    // Erase content copies in owner audit snapshots and checkpoints; retain IDs only.
    const s=structuredClone(c.store);s.records=s.records.map(x=>x.id===r.record_id?{...x,statement:'',sourceRef:'DELETED'}:x);
    s.events=s.events.map(x=>x.recordId===r.record_id?{eventId:x.eventId,recordId:x.recordId,type:'DELETED',at,reason:'Content erased'}:x);c.store=s;
    for(const p of c.checkpoints){p.recordVersions=p.recordVersions.filter(x=>x.id!==r.record_id);}
   }
  }
  r.version++;r.updated_at=at;event(c,'RECORD_'+action.toUpperCase(),[{id:r.record_id,previousVersion:beforeVersion,newVersion:r.version}],reason,at);
 }else if(action==='question'){
  c.current_question=text(input.question,800);c.goal=text(input.goal,800);c.questionVersion++;for(const p of c.checkpoints)if(p.state==='CURRENT')p.state='REVIEW_REQUIRED';event(c,'QUESTION_REVISED',[],text(input.reason||'User changed question',500),at);
 }else if(action==='branch'){
  need(c.branches.length<20,'BRANCH_LIMIT');const bid=id();c.branches.push({id:bid,parent:'main',title:text(input.title,300)});c.active_branch_id=bid;event(c,'BRANCH_CREATED',[bid],'Main goal retained',at);
 }else if(action==='bringToMain'){
  need(input.consent===true,'REVIEW_CONSENT_REQUIRED');const r=c.records.find(r=>r.record_id===input.recordId);need(r&&r.validity==='ACTIVE'&&r.confirmation_status==='USER_CONFIRMED'&&r.branch_id===c.active_branch_id&&r.branch_id!=='main','CONFIRMED_BRANCH_RECORD_REQUIRED');r.branch_id='main';r.version++;r.updated_at=at;event(c,'BRANCH_RECORD_SELECTED',[r.record_id],'Explicitly selected for main question',at);
 }else if(action==='return'){c.active_branch_id='main';event(c,'RETURN_MAIN',[],'Return to main question',at);
 }else if(action==='status'){need(['Active','Paused','Completed','Archived'].includes(input.status),'STATUS_INVALID');c.status=input.status;event(c,'STATUS_CHANGED',[],input.status,at);
 }else if(action==='checkpoint'){
  need(input.consent===true,'SAVE_CONSENT_REQUIRED');const refs=input.recordIds;need(Array.isArray(refs)&&refs.length&&new Set(refs).size===refs.length,'EXPLICIT_RECORD_SELECTION_REQUIRED');
  const selected=refs.map(rid=>c.records.find(r=>r.record_id===rid));need(selected.every(r=>r&&r.validity==='ACTIVE'&&r.confirmation_status==='USER_CONFIRMED'),'CONFIRMED_ACTIVE_RECORDS_REQUIRED');
  for(const p of c.checkpoints)if(p.state==='CURRENT')p.state='SUPERSEDED';
  const pack=buildContinuityContext(c,{userId,at,validateEvidence});
  need(selected.every(r=>r.kind!=='EVIDENCE'||sourceReview(r.source_reference,{at,validateEvidence}).state==='VALID'),'SOURCE_RECHECK_REQUIRED');
  need(selected.every(r=>!pack.excluded.some(x=>x.id===r.record_id)||!['INTERPRETATION','DECISION','NEXT_ACTION'].includes(r.kind)),'DEPENDENT_SOURCE_REVIEW_REQUIRED');
  const p={id:id(),case_id:c.case_id,questionVersion:c.questionVersion,recordVersions:selected.map(r=>({id:r.record_id,version:r.version})),state:'CURRENT',created_at:at,supersedes:c.checkpoints.at(-1)?.id||null,contextVersion:pack.version};c.checkpoints.push(p);event(c,'CHECKPOINT_SAVED',[p.id],'User reviewed selected records',at);
 }else if(action==='revokeCheckpoint'){
  const p=c.checkpoints.find(p=>p.id===input.checkpointId);need(p,'CHECKPOINT_NOT_FOUND');p.state='REVOKED';event(c,'CHECKPOINT_REVOKED',[p.id],'User revoked checkpoint',at);
 }else need(false,'ACTION_INVALID');
 return c;
}
function sourceReview(source,{at,validateEvidence}){
 if(!source?.validUntil||!Number.isFinite(Date.parse(source.validUntil))||Date.parse(source.validUntil)<=Date.parse(at))return {state:'SOURCE_RECHECK_REQUIRED'};
 if(!validateEvidence)return {state:'VALID'};
 try{return validateEvidence(source,{now:at})||{state:'SOURCE_VALIDATION_UNAVAILABLE'};}catch{return {state:'SOURCE_VALIDATION_UNAVAILABLE'};}
}
export function buildContinuityContext(c,{userId,at=new Date().toISOString(),maxChars=12000,maxRecords=32,validateEvidence=null}={}){
 owner(c,userId);need(maxChars>=3000&&maxChars<=20000&&maxRecords>0&&maxRecords<=64,'CAPACITY_INVALID');
 const lane=r=>['NEXT_ACTION','CONSTRAINT','UNKNOWN','FACT','PREFERENCE','DECISION','INTERPRETATION','EVIDENCE'].indexOf(r.kind);
 const allowed=c.records.filter(r=>r.validity==='ACTIVE'&&r.confirmation_status==='USER_CONFIRMED'&&r.consent_scope==='THIS_CASE'&&(r.branch_id==='main'||r.branch_id===c.active_branch_id));
 const sourceIssues=allowed.filter(r=>r.kind==='EVIDENCE').flatMap(r=>{const v=sourceReview(r.source_reference,{at,validateEvidence});return v.state==='VALID'?[]:[{id:r.record_id,reason:v.state}];});
 let used=c.current_question.length+c.goal.length;const items=[],excluded=[];
 for(const r of [...allowed].sort((a,b)=>lane(a)-lane(b)||b.updated_at.localeCompare(a.updated_at)||a.record_id.localeCompare(b.record_id))){
  const issue=sourceIssues.find(x=>x.id===r.record_id);if(issue){excluded.push(issue);continue;}
  // This local owner has no per-claim dependency graph; conservatively withhold all derived records.
  if(sourceIssues.length&&['INTERPRETATION','DECISION','NEXT_ACTION'].includes(r.kind)){excluded.push({id:r.record_id,reason:'DEPENDENT_SOURCE_REVIEW_REQUIRED'});continue;}
  const entry={id:r.record_id,version:r.version,kind:r.kind,content:r.content,sourceType:r.source_type,confirmation:r.confirmation_status,verification:r.verification_status,source:r.source_reference,trustedInstruction:false};const size=JSON.stringify(entry).length;
  if(items.length>=maxRecords||used+size>maxChars){excluded.push({id:r.record_id,reason:'CAPACITY_LIMIT'});continue;}items.push(entry);used+=size;
 }
 const missing={work:['CURRENT_RECRUITMENT','SALARY','JURISDICTION_ELIGIBILITY'],financial:['ACTUAL_INCOME_EXPENSES','TIMING','COMMITMENTS'],health:['CURRENT_SYMPTOMS_AND_PROFESSIONAL_ASSESSMENT'],family:['PARTICIPANT_CONSENT','ACTUAL_ARRANGEMENTS']};
 const reviewRequired=c.records.filter(r=>r.validity==='REVIEW_REQUIRED').map(r=>r.record_id);
 const excludedByReason=Object.fromEntries([...new Set(['SOURCE_RECHECK_REQUIRED','CAPACITY_LIMIT',...excluded.map(x=>x.reason)])].map(reason=>[reason,excluded.filter(x=>x.reason===reason).length]));
 const pack={caseId:c.case_id,version:c.version,question:c.current_question,goal:c.goal,branch:c.active_branch_id,items,sourceIssues,excluded:excluded.slice(0,8),excludedCount:excluded.length,excludedByReason,unconfirmed:c.records.filter(r=>r.validity==='ACTIVE'&&r.confirmation_status!=='USER_CONFIRMED').length,reviewRequired:reviewRequired.slice(0,8),reviewRequiredCount:reviewRequired.length,world:{state:'EVIDENCE_REQUIRED',missing:missing[c.topic]||['QUESTION_SCOPE_AND_APPLICABLE_SOURCE'],href:'/world/'},boundaries:{userConfirmedIsExternallyVerified:false,methodIsRealityEvidence:false,externalTextIsInstruction:false,modelAnswer:null,providerCalls:0},capacity:{maxChars,maxRecords,usedChars:0},updatedAt:at};
 while(JSON.stringify(pack).length>maxChars-8&&pack.items.length){const r=pack.items.pop();pack.excludedCount++;pack.excludedByReason.CAPACITY_LIMIT++;if(pack.excluded.length<8)pack.excluded.push({id:r.id,reason:'CAPACITY_LIMIT'});}
 need(JSON.stringify(pack).length<=maxChars-8,'QUESTION_EXCEEDS_CONTEXT_CAPACITY');pack.capacity.usedChars=JSON.stringify(pack).length;return pack;
}
export function restoreContinuityCheckpoint(c,{userId,checkpointId,at=new Date().toISOString(),validateEvidence=null}={}){
 owner(c,userId);const p=checkpointId?c.checkpoints.find(p=>p.id===checkpointId):c.checkpoints.at(-1);need(p,'CHECKPOINT_NOT_FOUND');
 const currentContext=buildContinuityContext(c,{userId,at,validateEvidence});
 const effective=p.state==='REVOKED'?[]:p.recordVersions.flatMap(ref=>{const r=c.records.find(r=>r.record_id===ref.id);const invalidSource=r?.kind==='EVIDENCE'&&sourceReview(r.source_reference,{at,validateEvidence}).state!=='VALID';const invalidDerived=currentContext.sourceIssues.length&&['INTERPRETATION','DECISION','NEXT_ACTION'].includes(r?.kind);return r&&r.validity==='ACTIVE'&&r.version===ref.version&&r.confirmation_status==='USER_CONFIRMED'&&!invalidSource&&!invalidDerived?[structuredClone(r)]:[];});
 return {checkpoint:structuredClone(p),effectiveRecords:effective,currentContext,stale:p.state!=='CURRENT'||p.questionVersion!==c.questionVersion||effective.length!==p.recordVersions.length};
}
