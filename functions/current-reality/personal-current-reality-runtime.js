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
const PROMPTS=new Set(['ACTIVE_NOW','HEAVY_NOW','UNCERTAIN_NOW','DECISION_STUCK','ENERGY_COST','SUPPORTIVE_NOW','REPEATING_NOW','UNDERSTAND_NOW','DOMAIN_DETAIL','SENSITIVE_DETAIL']);
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
