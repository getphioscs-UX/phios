import {NAV_BATCH_01_CONTRACT} from './nav-accepted-batch-01-contract.js';
const interpretive=new Set(['PROFILE_EVIDENCE','REPORT_INTERPRETATION','SYMBOLIC_READING']);
const material=new Set(['USER_REPORTED','DIRECTLY_OBSERVED','VERIFIED_ACCOUNT_DATA','FINANCIAL_RECORD','LEGAL_OR_CONTRACTUAL_RECORD','CURRENT_EXTERNAL_EVIDENCE','PROFESSIONAL_INPUT','VERIFIED_DATE','CONTRACTUAL_DATE','FINANCIAL_DATE']);
const conditionStates=new Set(['CLOSED','OPEN','CONDITIONALLY_OPEN','NOT_YET_OPEN','OPENNESS_UNKNOWN']);
const timeTypes=new Set(['FIXED_DEADLINE','OPEN_WINDOW','CLOSING_WINDOW','PREPARATION_PERIOD','WAITING_PERIOD','RECOVERY_PERIOD','TIME_SENSITIVE_UNKNOWN','NO_MATERIAL_TIME_EFFECT']);
const consequenceTypes=new Set(['KNOWN_CONSEQUENCE','PROJECTED_CONSEQUENCE','POSSIBLE_CONSEQUENCE','UNKNOWN']);
const present=v=>v!==undefined&&v!==null&&v!=='';
// Internal normalized owner-scoped assessments only. No HTTP/client payload admission here.
export function evaluateNavigationContracts(snapshot, {ownerId,personId}={}, contracts=NAV_BATCH_01_CONTRACT, upstream=[], validate=()=>[]) {
 const results=[...upstream];const decision=snapshot?.decision;
 const bindingOK=!!ownerId&&!!personId&&snapshot?.ownerId===ownerId&&snapshot?.personId===personId&&present(snapshot?.decisionVersion)&&present(snapshot?.positionVersion);
 for(const contract of contracts){const assessment=snapshot?.assessments?.[contract.moduleId];const reasons=[];
  if(!bindingOK)reasons.push('OWNER_PERSON_OR_VERSION_NOT_BOUND');
  if(results.some(r=>!r.canContinue))reasons.push('UPSTREAM_NOT_READY');
  if(!assessment||assessment.decisionVersion!==snapshot.decisionVersion||assessment.positionVersion!==snapshot.positionVersion)reasons.push('ASSESSMENT_STALE_OR_MISSING');
  for(const flag of contract.failClosedConditions){if(assessment?.checks?.[flag]!==false)reasons.push(flag);}
  for(const key of contract.requiredInputs){if(!present(assessment?.inputs?.[key]))reasons.push(`MISSING:${key}`);}
  if(!decision||decision.confirmation!=='USER_CONFIRMED'||decision.confirmedBy!==ownerId||!present(decision.id)||!present(decision.text))reasons.push('DECISION_REQUIRES_EXPLICIT_HUMAN_CONFIRMATION');
  const items=assessment?.items||[];if(!Array.isArray(items)){reasons.push('INVALID_ITEMS');}
  for(const item of Array.isArray(items)?items:[]){
   if(!item||typeof item!=='object'){reasons.push('INVALID_SOURCE_ITEM');continue;}
   if(item.ownerId!==ownerId||item.personId!==personId||item.decisionObjectId!==decision?.id||item.relevant!==true)reasons.push('SOURCE_SCOPE_MISMATCH');
   if(!present(item.sourceRef)||!present(item.sourceVersion)||!present(item.asOf)||!present(item.evidenceState)||item.currentness!=='CURRENT')reasons.push('SOURCE_TRACE_OR_CURRENTNESS_MISSING');
   if(!material.has(item.sourceClass)&&!interpretive.has(item.sourceClass)&&!(contract.moduleId==='NAV-16'&&item.sourceClass==='OPERATIONAL_RECORD')&&!(['NAV-19','NAV-20'].includes(contract.moduleId)&&['USER_STATED_GOAL','USER_STATED_VALUE','MATERIAL_DEPENDENCY','RESPONSIBILITY','OBSERVED_BEHAVIOR'].includes(item.sourceClass)))reasons.push('SOURCE_AUTHORITY_UNKNOWN');
   if(item.sourceClass==='PROFESSIONAL_INPUT'&&item.explicitConsent!==true)reasons.push('PROFESSIONAL_CONSENT_REQUIRED');
   if(interpretive.has(item.sourceClass)&&item.role!=='INTERPRETIVE_CONTEXT')reasons.push('INTERPRETATION_CANNOT_ESTABLISH_REALITY');
   if(item.futureAssumption===true&&item.role!=='FUTURE_ASSUMPTION')reasons.push('FUTURE_ASSUMPTION_NOT_CURRENT_RESOURCE');
   if(item.evidenceState==='UNKNOWN'&&item.value!==null)reasons.push('UNKNOWN_MUST_REMAIN_NULL');
   if(item.evidenceState==='RANGE'&&(!Number.isFinite(item.value?.min)||!Number.isFinite(item.value?.max)||item.value.min>item.value.max))reasons.push('INVALID_RANGE');
   if(contract.moduleId==='NAV-03'&&item.role!=='INTERPRETIVE_CONTEXT'){
    if(!conditionStates.has(item.state))reasons.push('OPENNESS_UNKNOWN');
    if(item.state==='CLOSED'&&item.candidateOption===true)reasons.push('CLOSED_NOT_CANDIDATE');
    if(item.state==='CONDITIONALLY_OPEN'&&(!Array.isArray(item.requiredConditions)||!item.requiredConditions.length))reasons.push('CONDITIONAL_PREREQUISITES_MISSING');
    if(item.state==='OPEN'&&(item.notProhibited!==true||item.pathToFeasibility!==true))reasons.push('THEORETICAL_NOT_AVAILABLE');
   }
   if(contract.moduleId==='NAV-04'&&item.role!=='INTERPRETIVE_CONTEXT'&&!timeTypes.has(item.type))reasons.push('TIME_RELEVANCE_UNKNOWN');
   if(contract.moduleId==='NAV-05'&&item.role!=='INTERPRETIVE_CONTEXT'&&!consequenceTypes.has(item.consequenceAuthority))reasons.push('CONSEQUENCE_AUTHORITY_UNKNOWN');
  }
  try{reasons.push(...validate(contract.moduleId,assessment||{},snapshot||{}));}catch{reasons.push('MALFORMED_MODULE_MODEL');}
  const events=Array.isArray(snapshot?.revisionEvents)?snapshot.revisionEvents:[];if(events.some(e=>contract.revisionTriggers.includes(e)))reasons.push('REOPEN_REQUIRED');
  results.push({moduleId:contract.moduleId,contractVersion:contract.version,sourceSHA256:contract.sourceSHA256,state:reasons.length?'NEEDS_REVIEW':'READY_FOR_NEXT_ACCEPTED_MODULE',canContinue:reasons.length===0,reasons:[...new Set(reasons)],items:structuredClone(reasons.length?[]:(Array.isArray(items)?items:[])),decisionEffects:contract.decisionEffects,thresholdValue:null});
 }
 return results;
}
export function evaluateAcceptedNavigationBatch(snapshot, options={}) {const results=evaluateNavigationContracts(snapshot,options);const decision=snapshot?.decision;
 return {schemaVersion:'NAV-ACCEPTED-BATCH-01-v1',decisionObjectId:decision?.id||null,decisionVersion:snapshot?.decisionVersion||null,positionVersion:snapshot?.positionVersion||null,modules:results,acceptedThrough:'NAV-05',nextModule:'NAV-06',nextModuleState:'WAITING_OWNER_AUTHORING',finalAction:null,decisionSufficiency:null,providerCalls:0,persisted:false};
}
export function projectAcceptedNavigationBatch(runtime,{locale='zh'}={}){
 const zh=locale.startsWith('zh');const titles=zh?['正在决定什么','你现在站在哪里','哪些条件仍可改变','时间正在改变什么','如果暂不改变，会怎样继续']:NAV_BATCH_01_CONTRACT.map(c=>c.titleEn);
 return {sections:runtime.modules.map((m,i)=>({title:titles[i],needsReview:!m.canContinue,items:m.items.map(x=>({description:x.description||x.claim||'',value:x.value??null,evidenceState:x.evidenceState,sourceRef:x.sourceRef,asOf:x.asOf,interpretiveContext:interpretive.has(x.sourceClass),state:x.state||x.type||x.consequenceAuthority||null})),actions:m.canContinue?(zh?['确认','修正','补充资料']:['Confirm','Correct','Add information']):(zh?['修正','补充资料']:['Correct','Add information'])})),finalDecisionBelongsToUser:true,finalAction:null,remainingModulesPending:true};
}
export function projectAcceptedNavigationAcademy(){return {direction:'PRIVATE_DOCTRINE_TO_RUNTIME_TO_ACADEMY',modules:NAV_BATCH_01_CONTRACT.map(c=>({moduleId:c.moduleId,titleZh:c.titleZh,titleEn:c.titleEn,contractVersion:c.version})),lessons:[{moduleId:'NAV-01',theme:'先定义问题，再寻找答案。'},{moduleId:'NAV-02',theme:'先看位置，再谈方向。'},{moduleId:'NAV-03',theme:'已经关闭，不等于只是困难；仍然开放，也不等于现在立刻做得到。'},{moduleId:'NAV-04',theme:'相同动作，在不同时间进入现实，就可能成为不同决定。'},{moduleId:'NAV-05',theme:'不采取新动作，也是在让一条路径继续；它不是天然错误。'}],learningCompletionChangesNavigationState:false,fullDoctrineIncluded:false,purchaseAllowed:false};}
