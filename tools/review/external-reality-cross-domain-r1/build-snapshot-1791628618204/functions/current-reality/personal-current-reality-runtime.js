const INPUT_SCHEMA='PHI-OS-PERSONAL-CURRENT-REALITY-INPUT-v2';
const OBSERVATION_SCHEMA='PHI-OS-CURRENT-REALITY-OBSERVATION-v1';
const COMPARISON_SCHEMA='PHI-OS-REALITY-COMPARISON-v1';
const CORRELATION_SCHEMA='PHI-OS-METHOD-CURRENT-REALITY-CORRELATION-v1';

export const CURRENT_REALITY_DOMAINS=Object.freeze([
  'CURRENT_STATE','LOAD','DRIFT','DECISION','EXECUTION','RELATIONSHIP','ENVIRONMENT','RESOURCES','RECOVERY','OPEN_LOOPS','BODY_CARRIER','INPUT_SENSITIVITY'
]);
export const CURRENT_REALITY_SENSITIVE_DOMAINS=Object.freeze(['HEALTH','TRAUMA','FINANCIAL','RELATIONSHIP_SENSITIVE']);
export const REALITY_COMPARISON_STATES=Object.freeze(['CURRENTLY_RESONANT','PARTIALLY_RESONANT','CURRENTLY_NOT_RESONANT','OPEN']);
export const CURRENT_REALITY_PURPOSE='PERSONAL_READING_REALITY_COMPARISON';
const METHOD_IDS=new Set(['AST','BZR','NUM','ZWR','ECR']);
const GENERAL=new Set(CURRENT_REALITY_DOMAINS);
const SENSITIVE=new Set(CURRENT_REALITY_SENSITIVE_DOMAINS);
const STATES=new Set(REALITY_COMPARISON_STATES);
const PROMPTS=new Set(['ACTIVE_NOW','HEAVY_NOW','UNCERTAIN_NOW','DECISION_STUCK','ENERGY_COST','SUPPORTIVE_NOW','REPEATING_NOW','UNDERSTAND_NOW','DOMAIN_DETAIL','SENSITIVE_DETAIL','CARRIER_CONDITIONS','CARRIER_ENVIRONMENT','EXPERIENCE_SELECTION','EXPERIENCE_STABILIZATION','EXPERIENCE_PERSPECTIVE','EXPERIENCE_MOTIVATION','CONTEXT_COUNTER_EVIDENCE']);
const clean=v=>String(v??'').trim();
const list=v=>Array.isArray(v)?v:[];
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};
function fail(code,status=422){const e=new Error(code);e.code=code;e.status=status;throw e}
function clipped(v,max){const s=clean(v);if(s.length>max)fail('CURRENT_REALITY_TEXT_TOO_LONG');return s}
function bounded(v,max){const s=clean(v);return s.length>max?`${s.slice(0,Math.max(0,max-1))}…`:s}
function normalizeObservation(raw,index,{sensitive=false}={}){
  const domain=clean(raw?.domain).toUpperCase();
  const allowed=sensitive?SENSITIVE:GENERAL;
  if(!allowed.has(domain))fail(sensitive?'CURRENT_REALITY_SENSITIVE_DOMAIN_INVALID':'CURRENT_REALITY_DOMAIN_INVALID');
  const text=clipped(raw?.text,600);if(!text)fail('CURRENT_REALITY_OBSERVATION_TEXT_REQUIRED');
  const promptId=clean(raw?.promptId||'DOMAIN_DETAIL').toUpperCase();if(!PROMPTS.has(promptId))fail('CURRENT_REALITY_PROMPT_INVALID');
  return freeze({inputObservationId:`CR-IN-${String(index+1).padStart(2,'0')}`,domain,promptId,text,sensitive});
}
export function normalizePersonalCurrentRealityInput(raw={},locale='en'){
  const observations=list(raw?.observations),sensitiveObservations=list(raw?.sensitiveObservations);
  const anyInput=observations.length>0||sensitiveObservations.length>0;
  if(anyInput&&raw?.optIn!==true)fail('CURRENT_REALITY_EXPLICIT_OPT_IN_REQUIRED',403);
  const purposeCode=clean(raw?.purposeCode);if(anyInput&&purposeCode!==CURRENT_REALITY_PURPOSE)fail('CURRENT_REALITY_EXPLICIT_PURPOSE_REQUIRED');
  if(observations.length>8)fail('CURRENT_REALITY_CORE_OBSERVATION_LIMIT_EXCEEDED');
  if(sensitiveObservations.length>4)fail('CURRENT_REALITY_SENSITIVE_OBSERVATION_LIMIT_EXCEEDED');
  if(sensitiveObservations.length&&raw?.sensitiveConsent!==true)fail('CURRENT_REALITY_SENSITIVE_CONSENT_REQUIRED',403);
  const normalized=observations.map((x,i)=>normalizeObservation(x,i));
  const sensitive=sensitiveObservations.map((x,i)=>normalizeObservation(x,normalized.length+i,{sensitive:true}));
  return freeze({
    schemaVersion:INPUT_SCHEMA,
    locale:locale==='zh-Hans'?'zh-Hans':'en',
    optIn:anyInput,
    purposeCode:anyInput?CURRENT_REALITY_PURPOSE:null,
    collectionMode:'PROGRESSIVE_MINIMAL',
    observations:freeze([...normalized,...sensitive]),
    sensitiveConsent:sensitive.length>0,
    governance:freeze({explicitOptInRequired:true,explicitPurposeRequired:true,minimalCollection:true,automaticPersistence:false,customerInputPromotedToObjectiveFact:false})
  });
}
export function canonicalizeCurrentRealityObservations(input){
  if(input?.schemaVersion!==INPUT_SCHEMA)fail('CURRENT_REALITY_INPUT_V2_REQUIRED');
  const observations=list(input.observations).map((item,index)=>freeze({
    observationId:`CR-OBS-${String(index+1).padStart(2,'0')}`,
    domain:item.domain,
    promptId:item.promptId,
    statement:item.text,
    source:'CUSTOMER',
    confidence:'SELF_REPORTED',
    sensitive:item.sensitive===true,
    objectiveFact:false,
    diagnosis:false,
    professionalEvidence:false
  }));
  return freeze({
    schemaVersion:OBSERVATION_SCHEMA,
    observations:freeze(observations),
    governance:freeze({sourceAlwaysCustomer:true,confidenceAlwaysSelfReported:true,selfReportMayBecomeDiagnosis:false,selfReportMayBecomeMethodProof:false,automaticPersistence:false})
  });
}
function candidateFromInsight(method,item,index){
  const methodId=clean(method?.methodId).toUpperCase();
  const claimRef=clean(item?.claimId||item?.insightId||item?.readingUnitId||item?.findingId||`${methodId}:INSIGHT:${index+1}`);
  const title=bounded(item?.title||method?.methodLabel||methodId,180);
  const summary=bounded(item?.plainLanguageExplanation||item?.summary||item?.body||method?.summary||'',700);
  return freeze({candidateId:`CRC-${methodId}-${index+1}`,methodId,claimRef,title,summary,candidateClass:'ACCEPTED_METHOD_INSIGHT'});
}
export function buildRealityComparisonCandidates(readingMethods=[]){
  const out=[];
  for(const method of list(readingMethods)){
    const methodId=clean(method?.methodId).toUpperCase();
    if(!METHOD_IDS.has(methodId)||method?.state!=='READY_TO_READ')continue;
    const insights=list(method?.insights).slice(0,2);
    if(insights.length){for(let i=0;i<insights.length;i++)out.push(candidateFromInsight(method,insights[i],i));continue;}
    const projectionId=clean(method?.technical?.projectionId);
    out.push(freeze({candidateId:`CRC-${methodId}-1`,methodId,claimRef:`${methodId}:READING:${projectionId||'ACTIVE'}`,title:bounded(method?.methodLabel||methodId,180),summary:bounded(method?.summary||'',700),candidateClass:'ACCEPTED_METHOD_READING_SUMMARY'}));
  }
  return freeze(out.slice(0,10));
}
function normalizeCandidate(raw){
  const methodId=clean(raw?.methodId).toUpperCase();if(!METHOD_IDS.has(methodId))fail('CURRENT_REALITY_COMPARISON_METHOD_INVALID');
  const claimRef=clipped(raw?.claimRef,220);if(!claimRef)fail('CURRENT_REALITY_COMPARISON_CLAIM_REF_REQUIRED');
  const candidateId=clipped(raw?.candidateId,120);if(!candidateId)fail('CURRENT_REALITY_COMPARISON_CANDIDATE_ID_REQUIRED');
  return freeze({candidateId,methodId,claimRef});
}
export function buildRealityComparisons({candidates=[],responses=[],observationIr=null}={}){
  const normalizedCandidates=list(candidates).map(normalizeCandidate);
  const byId=new Map(normalizedCandidates.map(x=>[x.candidateId,x]));
  const observationIds=new Set(list(observationIr?.observations).map(x=>x.observationId));
  const responseMap=new Map();
  for(const raw of list(responses)){
    const candidateId=clean(raw?.candidateId);const candidate=byId.get(candidateId);if(!candidate)fail('CURRENT_REALITY_COMPARISON_CANDIDATE_UNKNOWN');
    const state=clean(raw?.state).toUpperCase();if(!STATES.has(state))fail('CURRENT_REALITY_COMPARISON_STATE_INVALID');
    const refs=[...new Set(list(raw?.observationRefs).map(clean).filter(Boolean))];for(const ref of refs)if(!observationIds.has(ref))fail('CURRENT_REALITY_COMPARISON_OBSERVATION_REF_UNKNOWN');
    responseMap.set(candidateId,freeze({state,observationRefs:refs,note:clipped(raw?.note,400)}));
  }
  const comparisons=normalizedCandidates.map((candidate,index)=>{const response=responseMap.get(candidate.candidateId)||{state:'OPEN',observationRefs:[],note:''};return freeze({
    comparisonId:`RC-${String(index+1).padStart(2,'0')}`,
    candidateId:candidate.candidateId,
    methodId:candidate.methodId,
    methodClaimRef:candidate.claimRef,
    responseState:response.state,
    observationRefs:freeze(response.observationRefs),
    customerNote:response.note||null,
    source:'CUSTOMER',
    customerControlled:true,
    methodProvenTrue:false,
    methodProvenFalse:false
  })});
  return freeze({schemaVersion:COMPARISON_SCHEMA,comparisons:freeze(comparisons),governance:freeze({agreementIsProof:false,disagreementInvalidatesMethod:false,customerControlsResponse:true,unansweredRemainsOpen:true})});
}
export function buildMethodCurrentRealityCorrelation({comparisons=null}={}){
  if(comparisons?.schemaVersion!==COMPARISON_SCHEMA)fail('REALITY_COMPARISON_V1_REQUIRED');
  const correlations=list(comparisons.comparisons).map(item=>freeze({
    correlationId:`MCR-${item.comparisonId}`,
    methodId:item.methodId,
    methodClaimRef:item.methodClaimRef,
    state:item.responseState,
    observationRefs:item.observationRefs,
    basis:'EXPLICIT_CUSTOMER_COMPARISON',
    truthConversion:false
  }));
  return freeze({schemaVersion:CORRELATION_SCHEMA,correlations:freeze(correlations),allowedStates:REALITY_COMPARISON_STATES,governance:freeze({automaticSemanticMatching:false,agreementMayProveMethod:false,currentRealityMayRewriteMethod:false,openPreserved:true})});
}
export function buildProgressiveCurrentRealityIntake(locale='en'){
  const zh=locale==='zh-Hans';const q=(promptId,en,zhHans)=>freeze({promptId,label:zh?zhHans:en});
  return freeze({schemaVersion:'PHI-OS-PROGRESSIVE-CURRENT-REALITY-INTAKE-v1.0.0',level1:freeze([
    q('ACTIVE_NOW','What feels most active right now?','现在最活跃的是什么？'),q('HEAVY_NOW','What currently feels heavy?','现在什么最让你觉得沉重？'),q('UNCERTAIN_NOW','What feels uncertain?','什么让你觉得不确定？'),q('DECISION_STUCK','Where are decisions stuck?','哪个决定卡住了？'),q('ENERGY_COST','What is taking the most energy?','什么最消耗你的精力？'),q('SUPPORTIVE_NOW','What feels supportive?','什么正在支持你？'),q('REPEATING_NOW','What keeps repeating?','什么正在反复出现？'),q('UNDERSTAND_NOW','What are you trying to understand?','你现在最想弄明白什么？')
  ]),level2Domains:CURRENT_REALITY_DOMAINS,level3SensitiveDomains:CURRENT_REALITY_SENSITIVE_DOMAINS,governance:freeze({longQuestionnaire:false,progressive:true,sensitiveConsentSeparate:true})});
}
export const PERSONAL_CURRENT_REALITY_SCHEMAS=Object.freeze({input:INPUT_SCHEMA,observation:OBSERVATION_SCHEMA,comparison:COMPARISON_SCHEMA,correlation:CORRELATION_SCHEMA});

// Guided collection is an entry adapter to this owner, not another evidence store.
export function guidedRealityQuestions(mode='GUIDED',locale='en'){
 const rows=[['intent','UNDERSTAND_NOW','What would you like to understand?','你想弄清什么？'],['happening','ACTIVE_NOW','What is actually happening?','实际正在发生什么？'],['outcome','DECISION_STUCK','What would be useful to leave with?','你希望带走什么帮助？'],['duration','REPEATING_NOW','How long has this been happening?','这种情况持续多久了？'],['observations','DOMAIN_DETAIL','What have you directly observed?','你直接观察到了什么？'],['counterEvidence','CONTEXT_COUNTER_EVIDENCE','What does not fit this account?','哪些情况不符合这个描述？'],['support','SUPPORTIVE_NOW','What supports you?','什么正在支持你？'],['uncertainty','UNCERTAIN_NOW','What is still uncertain?','还有什么不确定？']];
 if(!['QUICK','GUIDED','DEEP','DISCOVERY'].includes(mode))fail('GUIDED_REALITY_MODE_INVALID');
 const selected=mode==='DISCOVERY'?[['recentChange','ACTIVE_NOW','What changed recently?','最近有什么变化？'],['whereObvious','DOMAIN_DETAIL','Where is it most noticeable?','在哪方面最明显？']]:rows.slice(0,mode==='QUICK'?3:mode==='GUIDED'?6:8);
 return freeze(selected.map(([id,promptId,en,zh])=>({id,promptId,label:locale==='zh-Hans'?zh:en,maxLength:600,required:false})));
}
export function summarizeGuidedReality({mode='GUIDED',answers={},locale='en'}={}){
 const questions=guidedRealityQuestions(mode,locale), allowed=new Set(questions.map(q=>q.id));
 if(!answers||typeof answers!=='object'||Array.isArray(answers)||Object.keys(answers).some(k=>!allowed.has(k)))fail('GUIDED_REALITY_ANSWER_INVALID');
 const items=questions.filter(q=>clean(answers[q.id])).map(q=>({id:q.id,promptId:q.promptId,label:q.label,text:clipped(answers[q.id],600)}));
 return freeze({mode,locale,items,confirmationRequired:true,evidencePromoted:false,source:'CUSTOMER_VERBATIM',automaticPersistence:false});
}
export function confirmGuidedReality({mode,answers,locale='en',confirmation,confirmedSummary}={}){
 const summary=summarizeGuidedReality({mode,answers,locale});
 if(confirmation!=='ACCURATE'||confirmedSummary!==JSON.stringify(summary.items)||!summary.items.length)fail('GUIDED_REALITY_SUMMARY_CONFIRMATION_REQUIRED',403);
 return normalizePersonalCurrentRealityInput({optIn:true,purposeCode:CURRENT_REALITY_PURPOSE,observations:summary.items.map(x=>({promptId:x.promptId,domain:'CURRENT_STATE',text:x.text}))},locale);
}
export function methodRealityProbes(methodId,locale='en'){
 const ids={BZR:['REPEATING_NOW','DECISION_STUCK','SUPPORTIVE_NOW'],AST:['ACTIVE_NOW','REPEATING_NOW','UNCERTAIN_NOW'],ZWR:['ACTIVE_NOW','DECISION_STUCK','SUPPORTIVE_NOW'],NUM:['REPEATING_NOW','UNDERSTAND_NOW'],PROFILE:['REPEATING_NOW','SUPPORTIVE_NOW'],HD:['ENERGY_COST','DECISION_STUCK','SUPPORTIVE_NOW'],CROSS:['REPEATING_NOW','UNCERTAIN_NOW']}[methodId];
 if(methodId==='ECR')return buildEcrContextEvidenceIntake(locale).filter(x=>['CARRIER_CONDITIONS','CARRIER_ENVIRONMENT','CONTEXT_COUNTER_EVIDENCE'].includes(x.promptId));
 if(!ids)fail('GUIDED_REALITY_METHOD_INVALID');
 return buildProgressiveCurrentRealityIntake(locale).level1.filter(x=>ids.includes(x.promptId));
}

// Optional R1A intake consumes the same consent, purpose, length, count and
// self-report schema as every other Personal Reality observation. No score.
export function buildEcrContextEvidenceIntake(locale='en'){
 const zh=locale==='zh-Hans';
 return freeze([
  ['CARRIER_CONDITIONS','BODY_CARRIER','What carrying conditions, available capacity or recovery space do you currently notice?','你目前观察到怎样的承载条件、可用空间或恢复余地？'],
  ['CARRIER_ENVIRONMENT','ENVIRONMENT','What in your environment supports or constrains how you operate?','当前环境中，什么支持或限制了你的运行？'],
  ['EXPERIENCE_SELECTION','CURRENT_STATE','What are you repeatedly paying attention to or selecting now?','你目前反复注意或选择的是什么？'],
  ['EXPERIENCE_STABILIZATION','CURRENT_STATE','Which experiences persist across situations, and which do not?','哪些经验会跨情境持续，哪些不会？'],
  ['EXPERIENCE_PERSPECTIVE','CURRENT_STATE','From what standpoint are you observing this situation?','你正从怎样的立场观察这件事？'],
  ['EXPERIENCE_MOTIVATION','CURRENT_STATE','What makes this situation matter to you now?','这个处境目前为何对你重要？'],
  ['CONTEXT_COUNTER_EVIDENCE','CURRENT_STATE','What observations do not fit this account? (optional)','哪些观察不符合上述描述？（可选）']
 ].map(([promptId,domain,en,cn])=>({promptId,domain,label:zh?cn:en,required:false,source:'CUSTOMER',confidence:'SELF_REPORTED',maxLength:600})));
}
