import {RELATIONSHIP_REALITY_SCOPES} from './relationship-current-reality.js';
export const RELATIONSHIP_TYPES=Object.freeze(['PARTNER','MARRIAGE','PARENT_CHILD','FAMILY','BUSINESS_PARTNERSHIP','WORKING_RELATIONSHIP']);
export const RELATIONSHIP_SECTIONS=Object.freeze([
 ['overview','关系概览','Relationship Overview'],['sharedStructure','共同结构','Shared Structure'],['interactionPatterns','互动方式','Interaction Dynamics'],['complementarities','互补线索','Complementarity'],['frictions','摩擦线索','Friction'],['decisionDynamics','决策方式','Decision Dynamics'],['communicationPatterns','沟通','Communication'],['resourceFlows','资源与责任','Resource / Responsibility Flow'],['currentPressures','当前压力','Current Pressures'],['timeline','时间背景','Timing Context'],['known','已知信息','What Is Known'],['openQuestions','待了解问题','What Is Open'],['navigation','下一步观察','Navigation'],['methodPerspectives','使用的视角','Perspectives Used']]);
const sharedAuthorities=new Set(['DECLARED','DOCUMENTED','SHARED_FINANCIAL_FACT','CURRENT_REALITY_OBSERVATION','EXPLICIT_PARTICIPANT_INPUT']);
const methodIds=new Set(['AST','NUM','BZR','ZWR','ECR','HD']);
const fields=['sharedHistory','sharedEnvironment','sharedResources','sharedResponsibilities','sharedGoals','currentPressures','interactionPatterns','decisionDynamics','communicationPatterns','resourceFlows','frictions','complementarities','openQuestions','observations','methodPerspectives','evidence','timeline','unknowns'];
const clone=x=>structuredClone(x);
const fail=code=>{throw Object.assign(new Error(code),{code})};
function required(x,code){if(typeof x!=='string'||!x.trim())fail(code);return x.trim()}
export function projectRelationshipMethodClaims({methodId,claims,sourceAuthority,humanAdmissionRef}){
 if(!methodIds.has(methodId))fail('REL_METHOD_INVALID');required(sourceAuthority,'REL_SOURCE_AUTHORITY_REQUIRED');required(humanAdmissionRef,'REL_EXISTING_ADMISSION_REQUIRED');
 return claims.map(c=>{required(c.claimId,'REL_CLAIM_ID_REQUIRED');if(c.methodId&&c.methodId!==methodId)fail('REL_METHOD_ID_MISMATCH');
  const allowed=['Structure','Interaction','Decision','Friction','Complementarity','Pressure','Timing'];
  const domains=(c.projectionDomains??['Structure']).filter(d=>allowed.includes(d));if(!domains.length)fail('REL_NATIVE_PROJECTION_DOMAIN_REQUIRED');
  return {kind:'METHOD_RELATIONSHIP_PERSPECTIVE',methodId,claimId:c.claimId,sourceAuthority,humanAdmissionRef,confidence:c.confidence??'UNKNOWN',limitations:clone(c.limitations??c.precisionBoundaryRefs??[]),nativeClaim:clone(c),domains,observationalAuthority:false};});
}
// Consume the existing REL-W5 admitted snapshot without re-running its semantics.
export function projectAdmittedRelationshipSnapshot(snapshot){
 if(snapshot?.schemaVersion!=='PHI-OS-REL-W5-ADMITTED-RELATIONSHIP-CLAIM-SNAPSHOT-v1.0.0'||snapshot?.governance?.onlyHumanAdmittedRelationshipClaims!==true)fail('REL_EXISTING_ADMITTED_SNAPSHOT_REQUIRED');
 return snapshot.claimEntries.flatMap(e=>{if(e.admissionState!=='HUMAN_ADMITTED')fail('REL_NATIVE_CLAIM_NOT_ADMITTED');return projectRelationshipMethodClaims({methodId:e.methodId,sourceAuthority:e.sourceClass,humanAdmissionRef:e.admissionRef,claims:[{...e.sourceClaim,claimId:e.relationshipClaimId}]}).map(p=>({...p,nativeClaim:clone(e.sourceClaim)}));});
}
export function createSharedReality({relationshipId,relationshipType,entries=[]}){
 required(relationshipId,'REL_ID_REQUIRED');if(!RELATIONSHIP_TYPES.includes(relationshipType))fail('REL_TYPE_INVALID');
 const ids=new Set();return {kind:'SharedReality',relationshipId,relationshipType,entries:entries.map(x=>{
  required(x.entryId,'REL_ENTRY_ID_REQUIRED');if(ids.has(x.entryId))fail('REL_DUPLICATE_ENTRY');ids.add(x.entryId);
  if(!sharedAuthorities.has(x.sourceAuthority))fail('REL_SHARED_METHOD_INFERENCE_FORBIDDEN');required(x.sourceRef,'REL_SOURCE_REF_REQUIRED');required(x.declaredBy,'REL_DECLARER_REQUIRED');
  if(x.confirmedByOtherParticipant===true&&!x.otherParticipantConfirmationRef)fail('REL_OTHER_CONFIRMATION_REQUIRED');
  return {...clone(x),confirmedByOtherParticipant:x.confirmedByOtherParticipant===true};}),automaticPersistence:false};
}
export function createRelationshipReality(input){
 const relationshipId=required(input.relationshipId,'REL_ID_REQUIRED');required(input.accountId,'REL_ACCOUNT_REQUIRED');
 for(const p of ['participantA','participantB']){required(input[p]?.personId,'REL_PERSON_REQUIRED');if(input[p].accountId!==input.accountId)fail('REL_ACCOUNT_PERSON_BINDING_REQUIRED');}
 if(input.participantA.personId===input.participantB.personId)fail('REL_DISTINCT_PARTICIPANTS_REQUIRED');
 const sharedReality=createSharedReality({relationshipId,relationshipType:input.relationshipType,entries:input.sharedReality?.entries??[]});
 const out={kind:'CanonicalRelationshipReality',relationshipId,accountId:input.accountId,participantA:clone(input.participantA),participantB:clone(input.participantB),relationshipType:input.relationshipType,sharedReality,revision:1,productionActivated:false};
 for(const f of fields)out[f]=clone(input[f]??[]);
 for(const o of out.observations){if(!RELATIONSHIP_REALITY_SCOPES.includes(o.scope))fail('REL_SCOPE_INVALID');if(o.scope==='OTHER_AS_OBSERVED')o.partnerInnerStateFact=false;if(o.sourceClass!=='CURRENT_REALITY_OBSERVATION')fail('REL_EXISTING_OBSERVATION_REQUIRED');}
 for(const t of out.timeline){if(!['T0','T1','T2'].includes(t.window))fail('REL_TIMELINE_INVALID');if(t.window==='T2'){if(t.prediction===true)fail('REL_FUTURE_PREDICTION_FORBIDDEN');t.role='WATCH_FUTURE_OBSERVATION';t.prediction=false;}}
 out.unknowns=[...out.unknowns,...(!sharedReality.entries.length?['Shared context has not been supplied.']:[])];return out;
}
export function composeRelationshipReality(reality){
 const shared=reality.sharedReality.entries;
 return {kind:'RelationshipCompositionV2',relationshipId:reality.relationshipId,humanDecision:'PENDING',sections:RELATIONSHIP_SECTIONS.map(([key,zh,en])=>({key,title:{zh,en},state:'UNKNOWN',records:key==='overview'?[{relationshipType:reality.relationshipType}]:key==='sharedStructure'?shared:key==='known'?shared.filter(x=>['DOCUMENTED','SHARED_FINANCIAL_FACT'].includes(x.sourceAuthority)):key==='navigation'?reality.timeline.filter(x=>x.window==='T2'):key==='openQuestions'?[...reality.openQuestions,...reality.unknowns]:clone(reality[key]??[])})).map(s=>({...s,state:s.records.length?'RECORDED':'UNKNOWN'})),authorityBoundary:'Method perspectives remain separate from shared facts and observations.',automaticPersistence:false};
}
// This adapter deliberately accepts the existing account store as a dependency.
// It exposes no production route; generation and composition never call it.
export async function persistSelectedRelationship({actorAccountId,reality,selectedEntryIds,consent,store}){
 if(actorAccountId!==reality.accountId)fail('REL_OWNER_FORBIDDEN');
 if(consent?.explicitAction!=='SAVE_TO_MY_REALITY'||consent?.granted!==true||!consent?.consentId||consent?.accountId!==actorAccountId)fail('REL_EXPLICIT_SAVE_CONSENT_REQUIRED');
 if(!Array.isArray(selectedEntryIds)||!selectedEntryIds.length)fail('REL_EXPLICIT_SELECTION_REQUIRED');
 const selection=[...new Set(selectedEntryIds)];const chosen=selection.map(id=>{const e=reality.sharedReality.entries.find(x=>x.entryId===id);if(!e)fail('REL_UNKNOWN_SELECTION');return e});
 const participants=[reality.participantA.personId,reality.participantB.personId];
 for(const e of chosen){if(!participants.includes(e.declaredBy))fail('REL_DECLARER_NOT_PARTICIPANT');if(e.privateToParticipant&&e.privateToParticipant!==consent.actingPersonId)fail('REL_PARTICIPANT_PRIVATE_FORBIDDEN');}
 if(!participants.includes(consent.actingPersonId))fail('REL_ACTING_PERSON_REQUIRED');
 const key=`pc-r1/relationship/${actorAccountId}/${reality.relationshipId}/${consent.consentId}`;
 const record={accountId:actorAccountId,personA:participants[0],personB:participants[1],relationshipId:reality.relationshipId,sharedReality:{...reality.sharedReality,entries:clone(chosen)},consent:clone(consent),productionActivated:false};
 const existing=await store.get(key);if(existing){if(JSON.stringify(existing)!==JSON.stringify(record))fail('REL_CONSENT_ID_REBIND_FORBIDDEN');return existing;}
 await store.put(key,record);return record;
}
const escape=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderRelationshipWorkspace({caseId,reality}){
 const composed=composeRelationshipReality(reality);
 const reviewPayload=JSON.stringify(reality).replaceAll('<','\u003c');
 const labels={PARTNER:'伴侣 / Partners',MARRIAGE:'婚姻 / Marriage',PARENT_CHILD:'亲子 / Parent and child',FAMILY:'家庭 / Family',BUSINESS_PARTNERSHIP:'商业合作 / Business partners',WORKING_RELATIONSHIP:'工作关系 / Working relationship'};
 return `<!doctype html><html lang="zh-Hans"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>关系现实 / Relationship Reality</title><style>body{margin:0;background:#f5f3ec;color:#18312d;font:17px/1.6 system-ui}main{max-width:1040px;margin:auto;padding:24px}section{background:white;padding:22px;margin:18px 0;border:1px solid #c8d3ca;border-radius:12px;break-inside:avoid}h1{font-size:30px}h2{font-size:21px}p,pre{overflow-wrap:anywhere;white-space:pre-wrap}button,select,input{font:inherit;max-width:100%;padding:9px}label{display:block;margin:12px 0}.en{color:#526963}footer{padding:20px;border-top:1px solid #bbb}@media(max-width:420px){main{padding:14px}section{padding:15px}h1{font-size:25px}}@media print{@page{size:A4;margin:16mm}body{background:white;font-size:11pt}button{display:none}main{padding:0}section{box-shadow:none}}</style><main><h1>关系现实 <span class="en">Relationship Reality</span></h1><p>本地审核候选 · 尚未上线<br>Local review candidate · Human review pending</p><label>选择本人 / Select person A <select><option>${escape(reality.participantA.displayName??'本人 / Me')}</option></select></label><label>选择另一参与者 / Select person B <select><option>${escape(reality.participantB.displayName??'另一参与者 / Other participant')}</option></select></label><p>${escape(labels[reality.relationshipType])}</p>${composed.sections.map(s=>`<section data-section="${s.key}"><h2>${s.title.zh}<br><span class="en">${s.title.en}</span></h2>${s.records.length?s.records.map(r=>`<p>${escape(typeof r==='string'?r:(r.statement??r.summary??r.nativeClaim?.summary??(r.relationshipType?labels[r.relationshipType]:r.text??'已记录信息 / Recorded information')))}</p>`).join(''):'<p>尚未提供信息 / Information not supplied</p>'}</section>`).join('')}<section><h2>保留与提问 / Keep and ask</h2><p>请选择信息并明确同意，再保存到我的现实。<br>Select information and give explicit consent before saving to My Reality.</p>${reality.sharedReality.entries.map(e=>`<label><input type="checkbox" data-entry="${escape(e.entryId)}">${escape(e.statement??e.entryId)}</label>`).join('')}<label><input type="checkbox" id="consent">我同意保存所选信息 / I consent to saving selected information</label><button id="save">保存到我的现实 / Save to My Reality</button> <button id="ask">询问此关系 / Ask about this relationship</button><p id="feedback" role="status"></p><p>下次复查 / Review later: 观察变化并保留旧记录。<br>Observe changes and retain previous records.</p></section><footer>视角不等于事实；缺失信息仍然未知。<br>A perspective is not a fact; missing information remains unknown.</footer></main><script type="application/json" id="pc-review-subject">${reviewPayload}</script><script>document.getElementById('save').onclick=()=>{const n=document.querySelectorAll('[data-entry]:checked').length;document.getElementById('feedback').textContent=n&&document.getElementById('consent').checked?'已准备所选信息；等待正式存储接入 / Selected information prepared; production storage is not activated':'请先选择信息并明确同意 / Select information and provide explicit consent first'};document.getElementById('ask').onclick=()=>document.getElementById('feedback').textContent='关系提问背景已准备；尚未发送 / Relationship question context prepared; nothing sent';</script></html>`;
}
