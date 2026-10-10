import {CURRENT_REALITY_DOMAINS,CURRENT_REALITY_SENSITIVE_DOMAINS,CURRENT_REALITY_PURPOSE,REALITY_COMPARISON_STATES,normalizePersonalCurrentRealityInput,canonicalizeCurrentRealityObservations,confirmGuidedReality} from '../current-reality/personal-current-reality-runtime.js';
import {MEMORY_EVIDENCE_CLASSES} from '../runtime/memory/runtime-memory-contract.js';
import {sha256Stable,deepFreeze} from '../interpretation-runtime/mir7-utils.js';
export const REPORT_MODES=Object.freeze(['CANONICAL_READING','CONTEXTUAL_READING']);
export const REPORT_CONTEXT_VERSION='PHI-OS-REPORT-CONTEXT-R1';
export const REPORT_MODE_LABELS=Object.freeze({CANONICAL_READING:{en:'Read the method itself','zh-Hans':'只读取方法本身'},CONTEXTUAL_READING:{en:'Read it with my current situation','zh-Hans':'结合我现在的生活'}});
export const fail=(code,status=422)=>{throw Object.assign(new Error(code),{code,status});};
const text=(x,max=600)=>{if(typeof x!=='string'||!x.trim()||x.length>max)fail('REPORT_CONTEXT_TEXT_INVALID');return x.trim();};
const domains=new Set([...CURRENT_REALITY_DOMAINS,...CURRENT_REALITY_SENSITIVE_DOMAINS]);
// Domain identifiers belong to Current Reality; sections belong to the Zi Wei
// semantic canon. This is a consumption map, not a second domain registry.
export const ZWR_CONTEXT_SECTION_DOMAINS=Object.freeze({S02:['CURRENT_STATE','DECISION','EXECUTION'],S03:['RECOVERY','CURRENT_STATE','INPUT_SENSITIVITY'],S04:['CURRENT_STATE','DECISION','EXECUTION','ENVIRONMENT','LOAD','DRIFT'],S05:['RESOURCES','FINANCIAL','DECISION'],S06:['RELATIONSHIP','RELATIONSHIP_SENSITIVE','DECISION'],S07:['RELATIONSHIP','ENVIRONMENT','RESOURCES','LOAD'],S08:['LOAD','RECOVERY','HEALTH','BODY_CARRIER','INPUT_SENSITIVITY','TRAUMA'],S09:['DRIFT','DECISION','CURRENT_STATE'],S10:['CURRENT_STATE','DECISION','DRIFT'],S11:['OPEN_LOOPS','DECISION','EXECUTION']});
export function reportMode(value,{newUi=false}={}){if(value==null&&!newUi)return 'CANONICAL_READING';if(!REPORT_MODES.includes(value))fail('REPORT_MODE_REQUIRED');return value;}
export function createReportContextIntent({ownerAccountId,personId,reportProductId,methodId,reportMode:mode,primaryQuestion,requestedDomains,sourceChannel='REPORT_GENERATION_UI',createdAt=new Date().toISOString(),contextIntentId=crypto.randomUUID()}={}){
 if(!['REPORT_GENERATION_UI','ASK_PHIOS_EXPLICIT_HANDOFF'].includes(sourceChannel))fail('REPORT_CONTEXT_SOURCE_INVALID');
 if(!['ZWR','BZR','AST','NUM','HD','ECR','PROFILE','CROSS'].includes(methodId))fail('REPORT_CONTEXT_METHOD_INVALID');
 if(!Array.isArray(requestedDomains)||requestedDomains.some(d=>!domains.has(d))||requestedDomains.length>4)fail('REPORT_CONTEXT_DOMAIN_INVALID');
 return deepFreeze({schemaVersion:'PHI-OS-REPORT-CONTEXT-INTENT-v1',contextIntentId,ownerAccountId:text(ownerAccountId,120),personId:text(personId,120),reportProductId:text(reportProductId,120),methodId,reportMode:reportMode(mode,{newUi:true}),primaryQuestion:text(primaryQuestion),requestedDomains:[...new Set(requestedDomains)],sourceChannel,createdAt,evidence:false});
}
export function evaluateRealityAdmission({intent,observations=[],explicitCustomerOptIn=false,customerConfirmed=false,sensitiveConsent=false,sectionId,corroboration=[]}={}){
 const selected=reportMode(intent?.reportMode),allowed=intent?.methodId==='ZWR'?ZWR_CONTEXT_SECTION_DOMAINS[sectionId]||[]:intent?.requestedDomains||[];
 const candidates=observations.map(o=>{
  const reasons=[];const relevant=intent.requestedDomains.includes(o.domain)&&allowed.includes(o.domain);
  // Specificity is deliberately conservative and deterministic. A short/vague
  // item triggers another question; it never receives semantic fabrication.
  const specific=String(o.statement||'').trim().length>=16&&/个月|周|昨天|最近|目前|正在|工作|职责|伴侣|收入|计划|week|month|currently|work|partner|decision|since|when|during|yesterday|started|changed|project/i.test(o.statement)&&!/^(最近不太好|我不知道|还不确定|something is wrong|not sure|i don.t know)[。.! ]*$/i.test(o.statement);
  if(selected!=='CONTEXTUAL_READING')reasons.push('CANONICAL_NO_BINDING');
  if(!explicitCustomerOptIn)reasons.push('OPT_IN_REQUIRED');
  if(!intent.primaryQuestion)reasons.push('INTERPRETIVE_INTENT_REQUIRED');
  if(!relevant)reasons.push('NOT_REPORT_RELEVANT');if(!specific)reasons.push('INSUFFICIENT_SPECIFICITY');
  if(!customerConfirmed)reasons.push('CUSTOMER_CONFIRMATION_REQUIRED');if(o.sensitive&&!sensitiveConsent)reasons.push('SENSITIVE_CONSENT_REQUIRED');
  const stronger=corroboration.filter(r=>r.ownerAccountId===intent.ownerAccountId&&r.personId===intent.personId&&r.observationId===o.observationId&&r.domain===o.domain&&r.admissionState==='ADMITTED'&&r.sourceAuthorityRef&&r.sourceRef&&MEMORY_EVIDENCE_CLASSES.includes(r.evidenceClass)&&['observed_evidence','verified_record','professional_record'].includes(r.evidenceClass));
  return {...o,candidateId:o.observationId,reportMethodId:intent.methodId,reportProductId:intent.reportProductId,relevanceState:relevant?'RELEVANT':'NOT_RELEVANT',specificityState:specific?'SUFFICIENT':'INSUFFICIENT',confirmationState:customerConfirmed?'ACCURATE':'UNCONFIRMED',admissionState:reasons.length?'R1_CONTEXT_AVAILABLE':stronger.length?'R3_REALITY_CORROBORATED':'R2_REALITY_REFERENCED',admissionReasons:reasons,corroborationRefs:stronger.map(r=>({sourceRef:r.sourceRef,evidenceClass:r.evidenceClass,sourceAuthorityRef:r.sourceAuthorityRef})),sectionId};
 });
 const admitted=candidates.filter(x=>!x.admissionReasons.length);
 return deepFreeze({candidates,admitted,admissionState:selected==='CANONICAL_READING'?'R0_NO_BINDING':admitted.some(x=>x.admissionState==='R3_REALITY_CORROBORATED')?'R3_REALITY_CORROBORATED':admitted.length?'R2_REALITY_REFERENCED':observations.length?'R1_CONTEXT_AVAILABLE':'R0_NO_BINDING'});
}
export async function createReportRealityBrief({intent,mode='QUICK',answers,locale='en',confirmedSummary,confirmation,domain,sectionId,explicitOptIn=false,sensitiveConsent=false,comparisonState='OPEN',corroboration=[],asOf=new Date().toISOString(),realityBriefId=crypto.randomUUID()}={}){
 if(intent?.reportMode!=='CONTEXTUAL_READING')fail('REALITY_BRIEF_NOT_ADMITTED');if(!explicitOptIn)fail('CONTEXTUAL_REALITY_OPT_IN_REQUIRED',403);
 if(!REALITY_COMPARISON_STATES.includes(comparisonState))fail('REPORT_COMPARISON_INVALID');
 confirmGuidedReality({mode,answers,locale,confirmation,confirmedSummary});
 if(answers.intent?.trim()!==intent.primaryQuestion)fail('REALITY_CONTEXT_INTENT_MISMATCH');
 // Intent and desired outcome are not evidence. Only happening is consumed;
 // additional answers remain intake, never silently promoted to observations.
 const sensitive=CURRENT_REALITY_SENSITIVE_DOMAINS.includes(domain),raw={domain,promptId:'ACTIVE_NOW',text:answers.happening||''};
 if(!sensitive&&/诊断|病史|创伤|自杀|负债|收入金额|薪资|账户余额|diagnos|trauma|suicid|account balance|salary|debt amount/i.test(raw.text))fail('REALITY_SENSITIVE_DOMAIN_SELECTION_REQUIRED',403);
 const canonical=canonicalizeCurrentRealityObservations(normalizePersonalCurrentRealityInput({optIn:true,purposeCode:CURRENT_REALITY_PURPOSE,observations:sensitive?[]:[raw],sensitiveObservations:sensitive&&sensitiveConsent?[raw]:[],sensitiveConsent},locale));
 const obs=canonical.observations.map(o=>({...o,observationId:intent.contextIntentId+':'+o.observationId,sourceRef:intent.contextIntentId+':happening',evidenceClass:'reported_experience'}));
 const admission=evaluateRealityAdmission({intent,observations:obs,explicitCustomerOptIn:explicitOptIn,customerConfirmed:confirmation==='ACCURATE',sensitiveConsent,sectionId,corroboration});
 if(!admission.admitted.length)fail(sensitive&&!sensitiveConsent?'REALITY_SENSITIVE_CONSENT_REQUIRED':admission.candidates.some(o=>o.specificityState==='INSUFFICIENT')?'REALITY_CONTEXT_INSUFFICIENTLY_SPECIFIC':admission.candidates.some(o=>o.relevanceState==='NOT_RELEVANT')?'REALITY_CONTEXT_NOT_REPORT_RELEVANT':'REALITY_BRIEF_NOT_ADMITTED');
 const seed={schemaVersion:'PHI-OS-REPORT-REALITY-BRIEF-v1',realityBriefId,ownerAccountId:intent.ownerAccountId,personId:intent.personId,reportProductId:intent.reportProductId,methodId:intent.methodId,reportMode:intent.reportMode,primaryQuestion:intent.primaryQuestion,contextIntentId:intent.contextIntentId,asOf,admissionState:admission.admissionState,observations:admission.admitted.map(o=>({...o,comparisonState})),decisionContext:{activeDecision:domain==='DECISION'?answers.happening:null,desiredUnderstanding:answers.outcome||null},knownBoundary:{unverifiedItems:admission.admitted.map(o=>o.observationId),unknownItems:[],excludedItems:admission.candidates.filter(o=>o.admissionReasons.length).map(o=>({candidateId:o.candidateId,reasons:o.admissionReasons}))},governance:{customerConfirmed:true,confirmationTimestamp:asOf,explicitOptIn:true,purposeCode:CURRENT_REALITY_PURPOSE,automaticPersistence:false,mayProveMethod:false,mayRewriteMethod:false,mayBecomeObjectiveFact:false}};
 return deepFreeze({...seed,realityBriefDigest:await sha256Stable(seed)});
}
export async function assertReportRealityBrief(brief,{ownerAccountId,personId,reportProductId,methodId}={}){
 if(!brief)fail('CONTEXTUAL_REALITY_BRIEF_REQUIRED');
 if(brief.ownerAccountId!==ownerAccountId)fail('REALITY_BRIEF_OWNER_MISMATCH',403);if(brief.personId!==personId)fail('REALITY_BRIEF_PERSON_MISMATCH',403);
 if(brief.reportProductId!==reportProductId||brief.methodId!==methodId||brief.reportMode!=='CONTEXTUAL_READING'||!['R2_REALITY_REFERENCED','R3_REALITY_CORROBORATED'].includes(brief.admissionState)||!brief.governance.customerConfirmed||!brief.governance.explicitOptIn)fail('REALITY_BRIEF_NOT_ADMITTED');
 const {realityBriefDigest,...seed}=brief;if(await sha256Stable(seed)!==realityBriefDigest)fail('REALITY_BRIEF_DIGEST_MISMATCH',409);
 if(brief.governance.automaticPersistence!==false||brief.governance.mayProveMethod!==false||brief.governance.mayRewriteMethod!==false||brief.governance.mayBecomeObjectiveFact!==false||brief.governance.purposeCode!==CURRENT_REALITY_PURPOSE||!brief.observations.length||brief.observations.some(o=>o.source!=='CUSTOMER'||o.confidence!=='SELF_REPORTED'||o.objectiveFact!==false||o.admissionReasons?.length||!o.sourceRef||!ZWR_CONTEXT_SECTION_DOMAINS[o.sectionId]?.includes(o.domain)))fail('REALITY_BRIEF_NOT_ADMITTED');return brief;
}
