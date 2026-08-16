import { runKapGroundingPipeline } from './knowledge-answer-grounding.js';
import { composeKapAnswerProjection, normalizeAnswerDepth, projectKapSources } from './knowledge-answer-composition.js';

const REQUEST_SCHEMA='PHI-OS-KAP-GUIDED-READING-REQUEST-v1.0.0';
const CONTEXT_SCHEMA='PHI-OS-GUIDED-ANSWER-CONTEXT-v1.0.0';
const RESPONSE_SCHEMA='PHI-OS-KAP-GUIDED-READING-RESPONSE-v1.0.0';
const CANONICAL_METHOD_SCHEMA='PHI-OS-CANONICAL-METHOD-PROJECTION-v1.0.0';
const MCD_HANDOFF_PATH='content/professional/method-client-delivery/registries/mcd-8-guided-reading-consumption-handoff-v1.json';
const MCD_ACCEPTANCE_PATH='content/professional/method-client-delivery/acceptance/mcd-8-production-acceptance-v1.json';
const MAX_QUESTIONS=3;
const MAX_CONTEXT_TEXT=800;
const REQUIRED_VERSION_KEYS=Object.freeze(['methodRegistryVersion','runtimeVersion','adapterVersion','inputContractVersion','projectionContractVersion']);
const RAW_LEAK_KEYS=new Set(['raw','rawResult','rawResults','coreResults','stack','stackTrace','internalServerPath','serverPath','modulePath','secret','secrets','providerPrompt','modelPrompt','pluginCode','methodCode']);

const clean=value=>String(value??'').normalize('NFKC').trim().replace(/\s+/g,' ');
const unique=values=>[...new Set(values.map(clean).filter(Boolean))];
const clamp=value=>clean(value).slice(0,MAX_CONTEXT_TEXT);
function stableHash(value){let hash=0x811c9dc5;for(const char of String(value)){hash^=char.codePointAt(0);hash=Math.imul(hash,0x01000193)>>>0;}return hash.toString(16).padStart(8,'0');}
function copy(locale){return locale==='zh-Hans'?Object.freeze({
  guided:'少量与你有关的情境，可能会改变这次回答中哪些机制最值得继续观察。',
  choose:'以下哪一个机制最接近你实际观察到的情况？',
  observe:'你有什么具体、可观察的事实支持或反驳这个选择？',
  complexity:'以下哪些情况属实：持续存在、多个因素互相影响、必须依赖详细个案背景，还是都不是？',
  sufficient:'现有受治理知识加上你提供的有限情境，已经足以形成这次 Guided Reading。',
  more:'还需要少量会改变答案的情境；不需要完整 Reality Intake。',
  reality:'当前问题已经需要持续、多因素、个案化的 Reality Model 才能可靠继续。',
  inferencePrefix:'根据你明确提供的情境，以下机制更值得优先检查：',
  inferenceBoundary:'这是 Reading inference，不是 Reality fact、诊断或人生结论。'
}):Object.freeze({
  guided:'A small amount of client context could change which mechanisms are most relevant to examine.',
  choose:'Which mechanism is closest to what you actually observe?',
  observe:'What concrete, observable fact supports or contradicts that choice?',
  complexity:'Which are true: persistent over time, multiple interacting factors, dependent on detailed case history, or none?',
  sufficient:'Governed knowledge plus the limited context you provided is sufficient for this Guided Reading.',
  more:'A small amount of answer-changing context is still needed; a full Reality Intake is not required.',
  reality:'This question now requires a persistent, multi-factor, case-specific Reality Model to continue reliably.',
  inferencePrefix:'Based on the context you explicitly provided, this mechanism is more relevant to examine:',
  inferenceBoundary:'This is a Reading inference, not a Reality fact, diagnosis, or life conclusion.'
});}

async function readAssetJson(env,path){if(!env?.ASSETS?.fetch)return null;const response=await env.ASSETS.fetch(new Request(`https://assets.local/${path}`));if(!response.ok)return null;return response.json();}
function assertNoRawLeak(value,path='$'){if(!value||typeof value!=='object')return;if(Array.isArray(value)){value.forEach((item,index)=>assertNoRawLeak(item,`${path}[${index}]`));return;}for(const [key,child] of Object.entries(value)){if(RAW_LEAK_KEYS.has(key))throw Object.assign(new Error(`KAP_GUIDED_RAW_METHOD_SCHEMA_FORBIDDEN:${path}.${key}`),{code:'KAP_GUIDED_RAW_METHOD_SCHEMA_FORBIDDEN'});assertNoRawLeak(child,`${path}.${key}`);}}
function canonicalMethodTerms(text,locale){const v=clean(text).toLocaleLowerCase();if(locale==='zh-Hans')return /占星|八字|数字学|出生资料|出生时间|个人运行投射/.test(v);return /\bastrolog|\bbazi\b|\bnumerolog|birth data|birth time|personal runtime projection/.test(v);}
function normalizeMode(value){const mode=clean(value||'KNOWLEDGE_ONLY').toUpperCase();return ['KNOWLEDGE_ONLY','METHOD_AWARE','METHOD_REQUIRED'].includes(mode)?mode:'KNOWLEDGE_ONLY';}
function mechanismObjects(answer){return (answer?.content?.mechanism||[]).slice(0,4).map((text,index)=>Object.freeze({mechanismCode:`GM-${String(index+1).padStart(2,'0')}`,text:clean(text),authorityClass:'GENERIC_KNOWLEDGE_MECHANISM'}));}

export function evaluateGuidedReadingEligibility({bundle,coverageDecision,answer}){
  const personal=Boolean(bundle?.normalization?.hints?.containsPersonalContextHint);
  const mechanismCount=answer?.content?.mechanism?.length||0;
  const coverageEligible=coverageDecision?.answerCompositionEligible===true;
  const eligible=personal&&coverageEligible&&mechanismCount>0;
  const reasonCodes=[];
  if(!coverageEligible)reasonCodes.push('KNOWLEDGE_COVERAGE_NOT_ELIGIBLE');
  else if(!personal)reasonCodes.push('GENERIC_KNOWLEDGE_ANSWER_SUFFICIENT');
  else if(!mechanismCount)reasonCodes.push('NO_CANDIDATE_MECHANISM_TO_DISCRIMINATE');
  else reasonCodes.push('LIMITED_CLIENT_CONTEXT_CAN_CHANGE_MECHANISM_RELEVANCE');
  return Object.freeze({schemaVersion:'PHI-OS-KAP-W18-GUIDED-READING-ELIGIBILITY-v1.0.0',status:eligible?'GUIDED_READING_ELIGIBLE':'ASK_PHIOS_SUFFICIENT',eligible,reasonCodes,requiresFullRealityIntake:false,createsPersistentCase:false,methodExecutionRequired:false});
}

export function evaluateOptionalMethodContext({question='',locale='zh-Hans',selectedReadingMode='KNOWLEDGE_ONLY',explicitMethodInterest=false,methodProjectionCount=0}={}){
  const mode=normalizeMode(selectedReadingMode);
  let status='NOT_RELEVANT';
  if(mode==='METHOD_REQUIRED')status='REQUIRED_BY_SELECTED_READING_MODE';
  else if(mode==='METHOD_AWARE'||methodProjectionCount>0)status='USEFUL_IF_AVAILABLE';
  else if(explicitMethodInterest===true||canonicalMethodTerms(question,locale))status='OPTIONAL';
  return Object.freeze({schemaVersion:'PHI-OS-KAP-W18A-METHOD-CONTEXT-ELIGIBILITY-v1.0.0',status,mostKnowledgeQuestionsDefault:'NOT_RELEVANT',methodExecutionAuthorized:false});
}

export function evaluateMethodConsentGate({methodEligibility,methodConsent}={}){
  const status=methodEligibility?.status||'NOT_RELEVANT';
  if(status==='NOT_RELEVANT')return Object.freeze({status:'NOT_APPLICABLE',consentSatisfied:true,autoExecutionAllowed:false,savedBirthDataMayTriggerExecution:false});
  const optedIn=methodConsent?.optedIn===true;
  const requested=unique(methodConsent?.publicMethodCodes||[]);
  return Object.freeze({status:optedIn&&requested.length?'CONSENT_GRANTED':'CONSENT_REQUIRED',consentSatisfied:optedIn&&requested.length>0,requestedPublicMethodCodes:Object.freeze(requested),autoExecutionAllowed:false,savedBirthDataMayTriggerExecution:false});
}

export async function loadMcdGuidedHandoff(env={}){
  const [handoff,acceptance]=await Promise.all([readAssetJson(env,MCD_HANDOFF_PATH),readAssetJson(env,MCD_ACCEPTANCE_PATH)]);
  if(!handoff||!acceptance)return Object.freeze({available:false,reasonCode:'MCD8_GUIDED_HANDOFF_UNAVAILABLE'});
  if(handoff.status!=='ACTIVE_AFTER_MCD8_ACCEPTANCE'||acceptance.status!=='ACCEPTED_MCD_PRODUCTION_GUIDED_READING_HANDOFF_OPEN')return Object.freeze({available:false,reasonCode:'MCD8_GUIDED_HANDOFF_NOT_ACCEPTED'});
  return Object.freeze({available:true,handoff,acceptance});
}

export function validateGuidedMethodProjection(canonical,{handoff,consentCodes=[]}={}){
  if(canonical?.schemaVersion!==CANONICAL_METHOD_SCHEMA)throw Object.assign(new Error('KAP_GUIDED_CANONICAL_METHOD_PROJECTION_REQUIRED'),{code:'KAP_GUIDED_CANONICAL_METHOD_PROJECTION_REQUIRED'});
  assertNoRawLeak(canonical);
  const methodCode=clean(canonical?.method?.publicMethodCode);
  if(methodCode==='PERSONAL_RUNTIME_PROJECTION'||(handoff?.blockedPublicMethodCodes||[]).includes(methodCode))throw Object.assign(new Error('KAP_GUIDED_RESTRICTED_PROJECTION_FORBIDDEN'),{code:'KAP_GUIDED_RESTRICTED_PROJECTION_FORBIDDEN'});
  if(!(handoff?.allowedPublicMethodCodesAfterAcceptance||[]).includes(methodCode))throw Object.assign(new Error('KAP_GUIDED_METHOD_NOT_ACCEPTED_BY_MCD8'),{code:'KAP_GUIDED_METHOD_NOT_ACCEPTED_BY_MCD8'});
  if(!consentCodes.includes(methodCode))throw Object.assign(new Error('KAP_GUIDED_METHOD_CONSENT_SCOPE_MISMATCH'),{code:'KAP_GUIDED_METHOD_CONSENT_SCOPE_MISMATCH'});
  if(canonical?.execution?.mpaDecision?.authorityOwner!=='MPA'||canonical?.execution?.mpaDecision?.dispatchAllowed!==true)throw Object.assign(new Error('KAP_GUIDED_MPA_DISPATCH_EVIDENCE_REQUIRED'),{code:'KAP_GUIDED_MPA_DISPATCH_EVIDENCE_REQUIRED'});
  if(canonical?.projection?.productionResult!==true||canonical?.projection?.clientRenderable!==true)throw Object.assign(new Error('KAP_GUIDED_PRODUCTION_METHOD_PROJECTION_REQUIRED'),{code:'KAP_GUIDED_PRODUCTION_METHOD_PROJECTION_REQUIRED'});
  if(canonical?.interpretation?.included!==false)throw Object.assign(new Error('KAP_GUIDED_METHOD_INTERPRETATION_FORBIDDEN'),{code:'KAP_GUIDED_METHOD_INTERPRETATION_FORBIDDEN'});
  if(!Array.isArray(canonical?.unknown)||!Array.isArray(canonical?.evidence))throw Object.assign(new Error('KAP_GUIDED_METHOD_LINEAGE_REQUIRED'),{code:'KAP_GUIDED_METHOD_LINEAGE_REQUIRED'});
  for(const key of REQUIRED_VERSION_KEYS)if(!clean(canonical?.version?.[key]))throw Object.assign(new Error(`KAP_GUIDED_METHOD_VERSION_REQUIRED:${key}`),{code:'KAP_GUIDED_METHOD_VERSION_REQUIRED'});
  if(/FIXTURE/i.test(clean(canonical?.execution?.requestId))||canonical?.validationFixture===true)throw Object.assign(new Error('KAP_GUIDED_VALIDATION_FIXTURE_FORBIDDEN'),{code:'KAP_GUIDED_VALIDATION_FIXTURE_FORBIDDEN'});
  return canonical;
}

function safeMethodRef(canonical){return Object.freeze({projectionId:canonical.projectionId,publicMethodCode:canonical.method.publicMethodCode,publicLabel:canonical.method.publicLabel||canonical.method.publicLabels?.en||canonical.method.publicMethodCode,calculationStatus:canonical.calculation?.status||'UNKNOWN',projectionStatus:canonical.projection?.status||'UNKNOWN',unknownCodes:Object.freeze((canonical.unknown||[]).map(x=>x.code).filter(Boolean)),version:Object.freeze({...canonical.version}),evidenceCount:(canonical.evidence||[]).length,mpaDispatchAllowed:true});}
function safeMethodResult(canonical){return Object.freeze({projectionId:canonical.projectionId,publicMethodCode:canonical.method.publicMethodCode,label:canonical.method.publicLabel||canonical.method.publicMethodCode,deterministicValues:Object.freeze((canonical.calculation?.values||[]).slice(0,24).map(item=>Object.freeze({code:item.code,value:item.value}))),structureCodes:Object.freeze((canonical.calculation?.structures||[]).map(item=>item.code).filter(Boolean)),cycleCodes:Object.freeze((canonical.calculation?.cycles||[]).map(item=>item.code).filter(Boolean)),positionCodes:Object.freeze((canonical.calculation?.positions||[]).map(item=>item.code).filter(Boolean)),unknown:Object.freeze((canonical.unknown||[]).map(item=>Object.freeze({code:item.code,category:item.category,scope:item.scope,reasonCodes:Object.freeze(item.reasonCodes||[])})))});}

export function createMinimalClarifyingQuestions({answer,bundle,locale='zh-Hans'}={}){
  const c=copy(locale);const mechanisms=mechanismObjects(answer);const questions=[];
  if(mechanisms.length>1)questions.push(Object.freeze({questionId:'KAP-GR-Q1-MECHANISM',kind:'MECHANISM_DISCRIMINATION',prompt:c.choose,required:true,options:Object.freeze(mechanisms.map(item=>Object.freeze({code:item.mechanismCode,label:item.text})))}));
  questions.push(Object.freeze({questionId:'KAP-GR-Q2-OBSERVATION',kind:'TEMPORARY_OBSERVATION',prompt:c.observe,required:true,options:Object.freeze([])}));
  if(bundle?.normalization?.hints?.timeScope==='LONG_TERM'||mechanisms.length>=3)questions.push(Object.freeze({questionId:'KAP-GR-Q3-COMPLEXITY',kind:'ESCALATION_DISCRIMINATION',prompt:c.complexity,required:false,options:Object.freeze([{code:'PERSISTENT',label:locale==='zh-Hans'?'持续存在':'Persistent over time'},{code:'MULTI_FACTOR',label:locale==='zh-Hans'?'多个因素互相影响':'Multiple interacting factors'},{code:'CASE_SPECIFIC',label:locale==='zh-Hans'?'依赖详细个案背景':'Depends on detailed case history'},{code:'NONE',label:locale==='zh-Hans'?'都不是':'None of these'}])}));
  return Object.freeze(questions.slice(0,MAX_QUESTIONS));
}

function normalizeClarifyingAnswers(items=[]){return Object.freeze(items.slice(0,MAX_QUESTIONS).map(item=>Object.freeze({questionId:clean(item?.questionId),response:clamp(item?.response),selectedOptionCodes:Object.freeze(unique(item?.selectedOptionCodes||[])),excludedMechanismCodes:Object.freeze(unique(item?.excludedMechanismCodes||[]))})).filter(item=>item.questionId));}
function deriveMechanismState(candidates,answers){const codes=new Set(candidates.map(x=>x.mechanismCode));const confirmed=new Set();const excluded=new Set();for(const answer of answers){for(const code of answer.selectedOptionCodes)if(codes.has(code))confirmed.add(code);for(const code of answer.excludedMechanismCodes)if(codes.has(code))excluded.add(code);}for(const code of confirmed)excluded.delete(code);const unknown=[...codes].filter(code=>!confirmed.has(code)&&!excluded.has(code));return {confirmed:[...confirmed],excluded:[...excluded],unknown};}
function complexitySignals(answers,explicit={}){const selected=new Set(answers.flatMap(x=>x.selectedOptionCodes));return Object.freeze({persistent:explicit?.persistent===true||selected.has('PERSISTENT'),multiFactor:explicit?.multiFactor===true||selected.has('MULTI_FACTOR'),caseSpecific:explicit?.caseSpecific===true||selected.has('CASE_SPECIFIC'),explicitRealityModelRequest:explicit?.explicitRealityModelRequest===true});}

export function buildGuidedAnswerContext({question,locale,answer,bundle,clarifyingAnswers=[],temporaryObservations=[],methodRefs=[],escalationSignals={}}={}){
  const candidates=mechanismObjects(answer);const answers=normalizeClarifyingAnswers(clarifyingAnswers);const state=deriveMechanismState(candidates,answers);
  const observationAnswers=answers.filter(x=>x.questionId==='KAP-GR-Q2-OBSERVATION'&&x.response).map(x=>x.response);
  const observations=unique([...(temporaryObservations||[]).map(clamp),...observationAnswers]).slice(0,6);
  const contextId=`GAC-v1-${stableHash(`${clean(question)}|${answers.map(x=>`${x.questionId}:${x.response}:${x.selectedOptionCodes.join(',')}`).join('|')}|${methodRefs.map(x=>x.projectionId).join('|')}`)}`;
  return Object.freeze({schemaVersion:CONTEXT_SCHEMA,objectType:'GuidedAnswerContext',contextId,authorityClass:'TEMPORARY_NON_CANONICAL_GUIDED_CONTEXT',originalQuestion:clean(question),locale,clarifyingAnswers:answers,temporaryObservations:Object.freeze(observations),candidateMechanisms:Object.freeze(candidates),confirmedRelevantMechanisms:Object.freeze(state.confirmed),excludedMechanisms:Object.freeze(state.excluded),unknownMechanisms:Object.freeze(state.unknown),optionalMethodProjectionRefs:Object.freeze(methodRefs),escalationSignals:complexitySignals(answers,escalationSignals),governance:Object.freeze({canonicalCaseCreated:false,persistentCaseCreated:false,realityEvidenceCreated:false,methodExecutionTriggered:false,clientStatementsRemainClientStatements:true})});
}

export function evaluateGuidedStopCondition(context,{questionCount=0}={}){
  const signals=context?.escalationSignals||{};
  const realModelSignals=signals.persistent===true&&signals.multiFactor===true&&signals.caseSpecific===true;
  if(realModelSignals&&(signals.explicitRealityModelRequest===true||context.confirmedRelevantMechanisms.length>1))return Object.freeze({status:'REALITY_MODEL_REQUIRED',reasonCodes:Object.freeze(['PERSISTENT_MULTI_FACTOR_CASE_SPECIFIC_CONTEXT']),automaticEscalation:false,requiresExplicitEscalationConsent:true});
  if((context?.temporaryObservations?.length||0)>0&&((context?.confirmedRelevantMechanisms?.length||0)>0||(context?.candidateMechanisms?.length||0)===1))return Object.freeze({status:'ANSWER_SUFFICIENT',reasonCodes:Object.freeze(['LIMITED_CONTEXT_DISCRIMINATED_RELEVANT_MECHANISM']),automaticEscalation:false,requiresExplicitEscalationConsent:false});
  if((context?.clarifyingAnswers?.length||0)>=Math.max(1,questionCount)&&context?.temporaryObservations?.length>0)return Object.freeze({status:'ANSWER_SUFFICIENT',reasonCodes:Object.freeze(['LIMITED_CONTEXT_EXHAUSTED_WITH_DECLARED_UNKNOWN']),automaticEscalation:false,requiresExplicitEscalationConsent:false});
  return Object.freeze({status:'MORE_CONTEXT_NEEDED',reasonCodes:Object.freeze(['ANSWER_CHANGING_CONTEXT_STILL_MISSING']),automaticEscalation:false,requiresExplicitEscalationConsent:false});
}

function clientStatements(context){return context.clarifyingAnswers.filter(x=>x.response).map(x=>Object.freeze({statementType:'CLIENT_STATEMENT',questionId:x.questionId,text:x.response,canonicalAuthority:false,realityEvidence:false}));}
function readingInferences(context,locale){const c=copy(locale);return context.confirmedRelevantMechanisms.map(code=>{const mechanism=context.candidateMechanisms.find(x=>x.mechanismCode===code);return Object.freeze({inferenceCode:`RI-${code}`,inferenceType:'READING_INFERENCE',text:`${c.inferencePrefix} ${mechanism?.text||code}`,basis:Object.freeze(['CLIENT_EXPLICIT_MECHANISM_SELECTION','GOVERNED_GENERIC_MECHANISM']),canonicalAuthority:false,realityFact:false,boundary:c.inferenceBoundary});});}

export function composeGuidedReading({initialProjection,bundle,coverageDecision,context,validatedMethodProjections=[],questions=[]}={}){
  const locale=context.locale||'zh-Hans';const c=copy(locale);const stop=evaluateGuidedStopCondition(context,{questionCount:questions.length});
  const genericMechanisms=context.candidateMechanisms.map(x=>Object.freeze({...x,statementType:'GENERIC_MECHANISM'}));
  const methodResults=validatedMethodProjections.map(safeMethodResult);
  const inferences=readingInferences(context,locale);
  const remainingQuestions=questions.filter(q=>!context.clarifyingAnswers.some(a=>a.questionId===q.questionId));
  return Object.freeze({schemaVersion:RESPONSE_SCHEMA,capability:'GUIDED_READING',status:'COMPOSED',guidedContext:context,answer:Object.freeze({schemaVersion:'PHI-OS-GUIDED-READING-ANSWER-v1.0.0',answerMode:'GUIDED_READING',authorityClass:'TEMPORARY_CONTEXTUAL_READING_PROJECTION',originalAnswerId:initialProjection.answer.answerId,content:Object.freeze({directAnswer:initialProjection.answer.content.directAnswer,genericMechanisms:Object.freeze(genericMechanisms),clientStatements:Object.freeze(clientStatements(context)),methodResults:Object.freeze(methodResults),readingInferences:Object.freeze(inferences),confirmedRelevantMechanisms:context.confirmedRelevantMechanisms,excludedMechanisms:context.excludedMechanisms,unknownMechanisms:context.unknownMechanisms,boundaries:Object.freeze(unique([...(initialProjection.answer.content.boundaries||[]),c.inferenceBoundary]))})}),sources:Object.freeze(projectKapSources(bundle,initialProjection.answerDepth)),coverage:coverageDecision,stopCondition:stop,nextQuestions:Object.freeze(stop.status==='MORE_CONTEXT_NEEDED'?remainingQuestions.slice(0,MAX_QUESTIONS):[]),ai:Object.freeze({defaultTier:'TIER_0_DETERMINISTIC',providerInvoked:false,generativeModelUsed:false,aiRequired:false}),handoff:Object.freeze({realityJourneyEligible:stop.status==='REALITY_MODEL_REQUIRED',automaticRealityJourney:false,requiresExplicitEscalationConsent:stop.status==='REALITY_MODEL_REQUIRED'}),governance:Object.freeze({knowledgeAuthorityUnchanged:true,publicationAuthorityUnchanged:true,methodAuthorityUnchanged:true,methodExecutionTriggered:false,rawMethodResultConsumed:false,canonicalMethodProjectionOnly:true,realityFactCreated:false,canonicalCaseCreated:false,persistentCaseCreated:false})});
}

async function prepareBase({question,locale='zh-Hans',depth='STANDARD',request,env,retrievalOptions={}}){
  const normalizedDepth=normalizeAnswerDepth(depth);const grounding=await runKapGroundingPipeline({input:{question,locale,surfaceContext:{surfaceType:'GUIDED_READING'}},request,env,retrievalOptions,scopeDisposition:'KNOWLEDGE_QUERY'});const initialProjection=composeKapAnswerProjection({bundle:grounding.groundingBundle,coverageDecision:grounding.coverageDecision,depth:normalizedDepth,now:new Date()});return {grounding,initialProjection,normalizedDepth};
}

export async function runGuidedReadingEligibility({question,locale='zh-Hans',depth='STANDARD',request,env={},retrievalOptions={},selectedReadingMode='KNOWLEDGE_ONLY',explicitMethodInterest=false}={}){
  const base=await prepareBase({question,locale,depth,request,env,retrievalOptions});const eligibility=evaluateGuidedReadingEligibility({bundle:base.grounding.groundingBundle,coverageDecision:base.grounding.coverageDecision,answer:base.initialProjection.answer});const methodContext=evaluateOptionalMethodContext({question,locale,selectedReadingMode,explicitMethodInterest,methodProjectionCount:0});const questions=eligibility.eligible?createMinimalClarifyingQuestions({answer:base.initialProjection.answer,bundle:base.grounding.groundingBundle,locale}):[];
  return Object.freeze({schemaVersion:RESPONSE_SCHEMA,capability:'GUIDED_READING',status:'ELIGIBILITY_EVALUATED',eligibility,methodContext,questions,askPhiosBoundary:Object.freeze({askPhiosAnswerId:base.initialProjection.answer.answerId,askPhiosRemainsIndependentlyDeliverable:true,fullRealityIntakeRequired:false}),governance:Object.freeze({persistentCaseCreated:false,methodExecutionTriggered:false,realityJourneyActivated:false})});
}

export async function runGuidedReadingRecomposition({question,locale='zh-Hans',depth='STANDARD',request,env={},retrievalOptions={},clarifyingAnswers=[],temporaryObservations=[],selectedReadingMode='KNOWLEDGE_ONLY',explicitMethodInterest=false,methodConsent={},methodProjections=[],escalationSignals={}}={}){
  const base=await prepareBase({question,locale,depth,request,env,retrievalOptions});const eligibility=evaluateGuidedReadingEligibility({bundle:base.grounding.groundingBundle,coverageDecision:base.grounding.coverageDecision,answer:base.initialProjection.answer});if(!eligibility.eligible)throw Object.assign(new Error('KAP_GUIDED_READING_NOT_ELIGIBLE'),{code:'KAP_GUIDED_READING_NOT_ELIGIBLE'});
  const methodEligibility=evaluateOptionalMethodContext({question,locale,selectedReadingMode,explicitMethodInterest,methodProjectionCount:methodProjections.length});const consent=evaluateMethodConsentGate({methodEligibility,methodConsent});let validated=[];
  if(methodProjections.length){if(!consent.consentSatisfied)throw Object.assign(new Error('KAP_GUIDED_METHOD_CONSENT_REQUIRED'),{code:'KAP_GUIDED_METHOD_CONSENT_REQUIRED'});const authority=await loadMcdGuidedHandoff(env);if(!authority.available)throw Object.assign(new Error(authority.reasonCode),{code:authority.reasonCode});validated=methodProjections.map(item=>validateGuidedMethodProjection(item,{handoff:authority.handoff,consentCodes:consent.requestedPublicMethodCodes}));}
  const methodRefs=validated.map(safeMethodRef);const questions=createMinimalClarifyingQuestions({answer:base.initialProjection.answer,bundle:base.grounding.groundingBundle,locale});const context=buildGuidedAnswerContext({question,locale,answer:base.initialProjection.answer,bundle:base.grounding.groundingBundle,clarifyingAnswers,temporaryObservations,methodRefs,escalationSignals});const response=composeGuidedReading({initialProjection:base.initialProjection,bundle:base.grounding.groundingBundle,coverageDecision:base.grounding.coverageDecision,context,validatedMethodProjections:validated,questions});
  return Object.freeze({...response,eligibility,methodContext:Object.freeze({eligibility:methodEligibility,consent,projectionCount:validated.length,projectionsConsumed:methodRefs})});
}

export function normalizeGuidedReadingRequest(body={}){
  if(body?.schemaVersion&&body.schemaVersion!==REQUEST_SCHEMA)throw Object.assign(new Error('KAP_GUIDED_REQUEST_SCHEMA_INVALID'),{code:'KAP_GUIDED_REQUEST_SCHEMA_INVALID'});const action=clean(body?.action||'ELIGIBILITY').toUpperCase();if(!['ELIGIBILITY','RECOMPOSE'].includes(action))throw Object.assign(new Error('KAP_GUIDED_ACTION_INVALID'),{code:'KAP_GUIDED_ACTION_INVALID'});const question=clean(body?.question);if(!question||question.length>500)throw Object.assign(new Error('KAP_QUESTION_INVALID'),{code:'KAP_QUESTION_INVALID'});const locale=body?.locale==='en'?'en':'zh-Hans';return Object.freeze({schemaVersion:REQUEST_SCHEMA,action,question,locale,depth:normalizeAnswerDepth(body?.depth||'STANDARD'),selectedReadingMode:normalizeMode(body?.selectedReadingMode),explicitMethodInterest:body?.explicitMethodInterest===true,clarifyingAnswers:Array.isArray(body?.clarifyingAnswers)?body.clarifyingAnswers:[],temporaryObservations:Array.isArray(body?.temporaryObservations)?body.temporaryObservations:[],methodConsent:body?.methodConsent&&typeof body.methodConsent==='object'?body.methodConsent:{},methodProjections:Array.isArray(body?.methodProjections)?body.methodProjections:[],escalationSignals:body?.escalationSignals&&typeof body.escalationSignals==='object'?body.escalationSignals:{}});
}

export const KAP_GUIDED_READING_CONSTANTS=Object.freeze({requestSchema:REQUEST_SCHEMA,contextSchema:CONTEXT_SCHEMA,responseSchema:RESPONSE_SCHEMA,maximumClarifyingQuestions:MAX_QUESTIONS,mcdHandoffPath:MCD_HANDOFF_PATH,mcdAcceptancePath:MCD_ACCEPTANCE_PATH});
