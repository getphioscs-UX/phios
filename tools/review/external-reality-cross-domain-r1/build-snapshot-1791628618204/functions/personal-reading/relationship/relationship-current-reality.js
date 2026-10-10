import { normalizeRelationshipIntent, RELATIONSHIP_INTENT_SCHEMA } from './relationship-intent.js';

export const RELATIONSHIP_CURRENT_REALITY_INPUT_SCHEMA='PHI-OS-RELATIONSHIP-CURRENT-REALITY-INPUT-v1.0.0';
export const RELATIONSHIP_CURRENT_REALITY_OBSERVATION_SCHEMA='PHI-OS-RELATIONSHIP-CURRENT-REALITY-OBSERVATION-v1.0.0';
export const RELATIONSHIP_CURRENT_REALITY_IR_SCHEMA='PHI-OS-RELATIONSHIP-CURRENT-REALITY-IR-v1.0.0';
export const RELATIONSHIP_REALITY_CANDIDATE_SCHEMA='PHI-OS-RELATIONSHIP-REALITY-COMPARISON-CANDIDATE-v1.0.0';
export const RELATIONSHIP_REALITY_COMPARISON_SCHEMA='PHI-OS-RELATIONSHIP-REALITY-COMPARISON-v1.0.0';
export const RELATIONSHIP_REALITY_COMPARISON_SET_SCHEMA='PHI-OS-RELATIONSHIP-REALITY-COMPARISON-SET-v1.0.0';
export const REL_W5_ADMITTED_CLAIM_SNAPSHOT_SCHEMA='PHI-OS-REL-W5-ADMITTED-RELATIONSHIP-CLAIM-SNAPSHOT-v1.0.0';
export const RELATIONSHIP_CURRENT_REALITY_PURPOSE='RELATIONSHIP_READING_REALITY_COMPARISON';

export const RELATIONSHIP_REALITY_SCOPES=Object.freeze(['ME','OTHER_AS_OBSERVED','US','CONTEXT']);
export const RELATIONSHIP_REALITY_OBSERVATION_TYPES=Object.freeze(['OBSERVABLE','CUSTOMER_INTERPRETATION']);
export const RELATIONSHIP_REALITY_CONFIDENCE=Object.freeze(['HIGH','MEDIUM','LOW','UNSURE']);
export const RELATIONSHIP_REALITY_COMPARISON_STATES=Object.freeze(['CURRENTLY_RESONANT','PARTIALLY_RESONANT','CURRENTLY_NOT_RESONANT','OPEN']);
export const RELATIONSHIP_REALITY_DOMAINS=Object.freeze([
  'CURRENT_STATE','REPEATING_PATTERN','ATTRACTION_CONNECTION','COMMUNICATION','UNDERSTANDING','INTIMACY_DISTANCE','DECISION_MAKING','SHARED_LIFE','FAMILY_HOME','RESOURCES_MONEY','WORK_COLLABORATION','CONFLICT_REPAIR','CURRENT_PHASE','TIMING','SPECIFIC_DECISION','PRACTICAL_PRESSURE','OPEN_QUESTION'
]);

const SCOPE_SET=new Set(RELATIONSHIP_REALITY_SCOPES);
const TYPE_SET=new Set(RELATIONSHIP_REALITY_OBSERVATION_TYPES);
const CONFIDENCE_SET=new Set(RELATIONSHIP_REALITY_CONFIDENCE);
const STATE_SET=new Set(RELATIONSHIP_REALITY_COMPARISON_STATES);
const DOMAIN_SET=new Set(RELATIONSHIP_REALITY_DOMAINS);
const METHOD_SET=new Set(['AST','BZR','ZWR','NUM','ECR','HD']);
const AST_NUM_ADMISSION_SCHEMA='PHI-OS-REL-W4-HUMAN-ADMISSION-v1.0.0';
const METHOD_COMPOSITION_SET_SCHEMA='PHI-OS-METHOD-RELATIONSHIP-COMPOSITION-SET-v1.0.0';
const ADMITTED_METHOD_COMPOSITION_SCHEMA='PHI-OS-ADMITTED-METHOD-RELATIONSHIP-COMPOSITION-v1.0.0';
const HD_COMPOSITION_SCHEMA='PHI-OS-HD-REL-R1-RELATIONSHIP-COMPOSITION-v1.0.0';
const HD_W8_ADMISSION_SCHEMA='PHI-OS-HD-REL-R1-W8-PRODUCTION-ADMISSION-v1.0.0';
const CLAIM_SCHEMA='PHI-OS-METHOD-RELATIONSHIP-CLAIM-v1.0.0';
const SOURCE_CLASS='CURRENT_REALITY_OBSERVATION';
const PROHIBITED_KEYS=new Set(['compatibilityScore','compatibilityPercentage','matchPercentage','relationshipVerdict','soulmate','destinedVerdict','partnerHiddenState','partnerHiddenFeeling','stayLeaveDirective','diagnosis']);

const clean=v=>String(v??'').trim();
const list=v=>Array.isArray(v)?v:[];
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};
function fail(code,status=422,details=null){const e=new Error(code);e.code=code;e.status=status;if(details!==null)e.details=details;throw e}
function text(v,code,max=900,{optional=false}={}){const s=clean(v);if(!s&&optional)return null;if(!s)fail(code,400);if(s.length>max)fail(`${code}_TOO_LONG`,400);return s}
function scan(v,path='$'){if(!v||typeof v!=='object')return;for(const [k,x] of Object.entries(v)){if(PROHIBITED_KEYS.has(k))fail(`REL_W5_PROHIBITED_FIELD:${path}.${k}`,409);scan(x,`${path}.${k}`)}}
function uniqStrings(v,code,max=220){return [...new Set(list(v).map(x=>text(x,code,max)))];}
function stable(value){if(value===null||typeof value!=='object')return JSON.stringify(value);if(Array.isArray(value))return `[${value.map(stable).join(',')}]`;return `{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${stable(value[k])}`).join(',')}}`;}
async function sha256(value){const bytes=new TextEncoder().encode(stable(value));const d=await globalThis.crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('');}

function normalizeObservation(raw,index,intent,input){
  scan(raw);
  const scope=text(raw?.scope,'REL_W5_SCOPE_REQUIRED',80).toUpperCase();if(!SCOPE_SET.has(scope))fail('REL_W5_SCOPE_INVALID',400);
  const domain=text(raw?.domain,'REL_W5_DOMAIN_REQUIRED',100).toUpperCase();if(!DOMAIN_SET.has(domain))fail('REL_W5_DOMAIN_INVALID',400);
  const statement=text(raw?.statement,'REL_W5_STATEMENT_REQUIRED',800);
  const source=text(raw?.source||'CUSTOMER','REL_W5_SOURCE_REQUIRED',80).toUpperCase();if(source!=='CUSTOMER')fail('REL_W5_SOURCE_MUST_BE_CUSTOMER',403);
  const confidence=text(raw?.confidence||'UNSURE','REL_W5_CONFIDENCE_REQUIRED',80).toUpperCase();if(!CONFIDENCE_SET.has(confidence))fail('REL_W5_CONFIDENCE_INVALID',400);
  const observableVsInterpretive=text(raw?.observableVsInterpretive,'REL_W5_OBSERVABLE_INTERPRETIVE_REQUIRED',80).toUpperCase();if(!TYPE_SET.has(observableVsInterpretive))fail('REL_W5_OBSERVABLE_INTERPRETIVE_INVALID',400);
  const sensitive=raw?.sensitive===true;
  const consentRef=text(raw?.consentRef||intent.consent?.consentRecordId,'REL_W5_CONSENT_REF_REQUIRED',180);
  if(sensitive){if(input?.sensitiveConsent!==true)fail('REL_W5_SENSITIVE_EXPLICIT_CONSENT_REQUIRED',403);const sensitiveConsentRef=text(input?.sensitiveConsentRef,'REL_W5_SENSITIVE_CONSENT_REF_REQUIRED',180);if(consentRef!==sensitiveConsentRef)fail('REL_W5_SENSITIVE_CONSENT_REF_MISMATCH',403);}
  return freeze({
    relationshipObservationId:text(raw?.relationshipObservationId||`REL-CR-IN-${String(index+1).padStart(2,'0')}`,'REL_W5_OBSERVATION_ID_REQUIRED',180),
    relationshipIntentId:intent.relationshipIntentId,scope,domain,statement,source,confidence,observableVsInterpretive,sensitive,consentRef,
    sourceClass:SOURCE_CLASS,
    governance:freeze({
      customerControlled:true,
      objectiveFact:false,
      professionalEvidence:false,
      methodProof:false,
      diagnosis:false,
      otherAsObservedIsPartnerInnerStateFact:false,
      customerInterpretationMayBecomePartnerFact:false,
      automaticPersistence:false,
      explicitSensitiveConsentRequired:sensitive
    })
  });
}

export function normalizeRelationshipCurrentRealityInput(raw={},relationshipIntent=null){
  scan(raw);
  const intent=normalizeRelationshipIntent(relationshipIntent||raw?.relationshipIntent||{});
  if(intent?.schemaVersion!==RELATIONSHIP_INTENT_SCHEMA)fail('REL_W5_RELATIONSHIP_INTENT_V1_REQUIRED',400);
  const observations=list(raw?.observations);const anyInput=observations.length>0;
  if(anyInput&&raw?.optIn!==true)fail('REL_W5_EXPLICIT_OPT_IN_REQUIRED',403);
  const purposeCode=clean(raw?.purposeCode);if(anyInput&&purposeCode!==RELATIONSHIP_CURRENT_REALITY_PURPOSE)fail('REL_W5_EXPLICIT_PURPOSE_REQUIRED',403);
  if(observations.length>12)fail('REL_W5_OBSERVATION_LIMIT_EXCEEDED',400);
  const normalized=observations.map((x,i)=>normalizeObservation(x,i,intent,raw));
  const ids=new Set();for(const x of normalized){if(ids.has(x.relationshipObservationId))fail('REL_W5_OBSERVATION_ID_UNIQUE_REQUIRED',409);ids.add(x.relationshipObservationId);}
  return freeze({
    schemaVersion:RELATIONSHIP_CURRENT_REALITY_INPUT_SCHEMA,
    relationshipIntentId:intent.relationshipIntentId,
    locale:intent.locale,
    optIn:anyInput,
    purposeCode:anyInput?RELATIONSHIP_CURRENT_REALITY_PURPOSE:null,
    collectionMode:'PROGRESSIVE_MINIMAL',
    observations:freeze(normalized),
    sensitiveConsent:normalized.some(x=>x.sensitive),
    governance:freeze({
      sharedRealityOwner:'PPR_CURRENT_SHARED_RUNTIME',
      createsSecondRealityAuthority:false,
      explicitOptInRequired:true,
      explicitPurposeRequired:true,
      minimalCollection:true,
      automaticPersistence:false,
      relationshipCurrentRealityIsCustomerControlled:true,
      partnerHiddenStateInferenceAllowed:false,
      compatibilityScoreAllowed:false
    })
  });
}

export async function buildRelationshipCurrentRealityIR(input){
  if(input?.schemaVersion!==RELATIONSHIP_CURRENT_REALITY_INPUT_SCHEMA)fail('REL_W5_INPUT_V1_REQUIRED',400);
  const observations=[];
  for(const item of list(input.observations)){
    const core={relationshipIntentId:input.relationshipIntentId,scope:item.scope,domain:item.domain,statement:item.statement,source:item.source,confidence:item.confidence,observableVsInterpretive:item.observableVsInterpretive,sensitive:item.sensitive,consentRef:item.consentRef};
    const digest=await sha256(core);
    observations.push(freeze({schemaVersion:RELATIONSHIP_CURRENT_REALITY_OBSERVATION_SCHEMA,...item,relationshipObservationId:`REL-CR-OBS-${digest.slice(0,24).toUpperCase()}`,semanticDigest:digest}));
  }
  const semanticDigest=await sha256(observations.map(x=>({relationshipObservationId:x.relationshipObservationId,semanticDigest:x.semanticDigest})));
  return freeze({
    schemaVersion:RELATIONSHIP_CURRENT_REALITY_IR_SCHEMA,
    relationshipIntentId:input.relationshipIntentId,
    sourceClass:SOURCE_CLASS,
    observations:freeze(observations),
    observationCount:observations.length,
    governance:freeze({
      owner:'PPR_CURRENT_SHARED_RUNTIME',
      separateRealityAuthorityCreated:false,
      sourceAlwaysCustomer:true,
      observableAndInterpretiveKeptDistinct:true,
      otherAsObservedNeverBecomesObjectivePartnerInnerState:true,
      sensitiveRequiresExplicitPurposeAndConsent:true,
      automaticPersistence:false,
      customerResonanceIsMethodProof:false
    }),
    semanticDigest
  });
}

function assertClaimShape(claim){
  if(claim?.schemaVersion!==CLAIM_SCHEMA)fail('REL_W5_METHOD_RELATIONSHIP_CLAIM_V1_REQUIRED',400);
  const methodId=clean(claim.methodId).toUpperCase();if(!METHOD_SET.has(methodId))fail('REL_W5_METHOD_INVALID',400);
  if(!clean(claim.relationshipClaimId)||!clean(claim.semanticOwnerId))fail('REL_W5_CLAIM_ID_AND_OWNER_REQUIRED',400);
  scan(claim);return methodId;
}

export async function buildRelW5AdmittedClaimSnapshot({methodCompositionSet=null,relW4HumanAdmission=null,admittedSuccessorCompositions=[],hdComposition=null,hdProductionAdmission=null}={}){
  const entries=[];const seen=new Set();
  if(methodCompositionSet!==null){
    if(methodCompositionSet?.schemaVersion!==METHOD_COMPOSITION_SET_SCHEMA)fail('REL_W5_REL_W4_COMPOSITION_SET_REQUIRED',400);
    if(relW4HumanAdmission?.schemaVersion!==AST_NUM_ADMISSION_SCHEMA||relW4HumanAdmission.status!=='HUMAN_ADMITTED_AST_NUM'||relW4HumanAdmission.accepted!==48||relW4HumanAdmission.pending!==0)fail('REL_W5_AST_NUM_HUMAN_ADMISSION_REQUIRED',409);
    for(const claim of list(methodCompositionSet.claims)){
      const methodId=assertClaimShape(claim);if(!['AST','NUM'].includes(methodId))continue;
      entries.push(freeze({relationshipClaimId:claim.relationshipClaimId,methodId,semanticOwnerId:claim.semanticOwnerId,claimClass:claim.claimClass,headline:claim.headline,summary:claim.summary,sourceClaim:claim,admissionState:'HUMAN_ADMITTED',admissionRef:'content/personal-reading/relationship/acceptance/rel-w4-human-admission-v1.json',sourceClass:'SYMBOLIC_INTERPRETATION',customerPublishable:true}));
    }
  }
  for(const composition of list(admittedSuccessorCompositions)){
    if(composition?.schemaVersion!==ADMITTED_METHOD_COMPOSITION_SCHEMA||composition.state!=='HUMAN_ADMITTED_REL_W4_METHOD_COMPOSITION')fail('REL_W5_ADMITTED_SUCCESSOR_COMPOSITION_REQUIRED',409);
    if(!['BZR','ZWR','ECR'].includes(composition.methodId))fail('REL_W5_SUCCESSOR_METHOD_INVALID',400);
    for(const claim of list(composition.claims)){
      const methodId=assertClaimShape(claim);if(methodId!==composition.methodId||claim.customerPublishable!==true||claim.governance?.humanAdmissionState!=='HUMAN_ADMITTED')fail('REL_W5_SUCCESSOR_CLAIM_NOT_HUMAN_ADMITTED',409);
      entries.push(freeze({relationshipClaimId:claim.relationshipClaimId,methodId,semanticOwnerId:claim.semanticOwnerId,claimClass:claim.claimClass,headline:claim.headline,summary:claim.summary,sourceClaim:claim,admissionState:'HUMAN_ADMITTED',admissionRef:composition.humanAdmissionRef,sourceClass:'SYMBOLIC_INTERPRETATION',customerPublishable:true}));
    }
  }
  if(hdComposition!==null||hdProductionAdmission!==null){
    if(hdComposition?.schemaVersion!==HD_COMPOSITION_SCHEMA)fail('REL_W5_HD_COMPOSITION_REQUIRED',400);
    if(hdProductionAdmission?.schemaVersion!==HD_W8_ADMISSION_SCHEMA)fail('REL_W5_HD_W8_ADMISSION_REQUIRED',400);
    const human=hdProductionAdmission.human||{},effect=hdProductionAdmission.authorityEffect||{};
    if(effect.relW4HdProductionAdmitted!==true||human.pending!==0||human.accepted!==human.requiredCases)fail('REL_W5_HD_NOT_PRODUCTION_ADMITTED',409);
    for(const claim of list(hdComposition.claims)){
      const methodId=assertClaimShape(claim);if(methodId!=='HD')fail('REL_W5_HD_CLAIM_METHOD_MISMATCH',409);
      entries.push(freeze({relationshipClaimId:claim.relationshipClaimId,methodId:'HD',semanticOwnerId:claim.semanticOwnerId,claimClass:claim.claimClass,headline:claim.headline,summary:claim.summary,sourceClaim:claim,admissionState:'HUMAN_ADMITTED',admissionRef:'content/personal-reading/relationship/hd-r1/acceptance/HD-REL-R1-W8-production-admission-v1.json',sourceClass:'SYMBOLIC_INTERPRETATION',customerPublishable:true}));
    }
  }
  for(const e of entries){if(seen.has(e.relationshipClaimId))fail('REL_W5_DUPLICATE_RELATIONSHIP_CLAIM_ID',409);seen.add(e.relationshipClaimId);}
  const methods=[...new Set(entries.map(x=>x.methodId))].sort();const semanticDigest=await sha256(entries.map(x=>({id:x.relationshipClaimId,methodId:x.methodId,owner:x.semanticOwnerId,admissionRef:x.admissionRef})));
  return freeze({
    schemaVersion:REL_W5_ADMITTED_CLAIM_SNAPSHOT_SCHEMA,
    methods:freeze(methods),
    claimEntries:freeze(entries),
    claimCount:entries.length,
    governance:freeze({
      onlyHumanAdmittedRelationshipClaims:true,
      hdRequiresW8ProductionAdmission:true,allSixMethodsAuthorityEligibleAtCurrentBaseline:true,
      claimMeaningRewritten:false,
      crossMethodMeaningCreated:false,
      compatibilityScoreCreated:false,
      currentRealityMayProveMethod:false
    }),
    semanticDigest
  });
}

export async function buildRelationshipRealityComparisonCandidates({claimSnapshot,selectedClaimRefs=[]}={}){
  if(claimSnapshot?.schemaVersion!==REL_W5_ADMITTED_CLAIM_SNAPSHOT_SCHEMA)fail('REL_W5_ADMITTED_CLAIM_SNAPSHOT_REQUIRED',400);
  const selected=uniqStrings(selectedClaimRefs,'REL_W5_SELECTED_CLAIM_REF_INVALID',180);if(selected.length>12)fail('REL_W5_SELECTED_CLAIM_LIMIT_EXCEEDED',400);
  const byId=new Map(list(claimSnapshot.claimEntries).map(x=>[x.relationshipClaimId,x]));
  const candidates=[];
  for(const ref of selected){const entry=byId.get(ref);if(!entry)fail('REL_W5_SELECTED_CLAIM_REF_UNKNOWN',404,{ref});const core={relationshipClaimId:entry.relationshipClaimId,methodId:entry.methodId,semanticOwnerId:entry.semanticOwnerId,claimClass:entry.claimClass,headline:entry.headline,summary:entry.summary};const d=await sha256(core);candidates.push(freeze({schemaVersion:RELATIONSHIP_REALITY_CANDIDATE_SCHEMA,candidateId:`REL-RC-CAND-${d.slice(0,20).toUpperCase()}`,...core,sourceClass:'SYMBOLIC_INTERPRETATION',admissionRef:entry.admissionRef,governance:freeze({explicitSelection:true,automaticImportanceInference:false,methodMeaningRewritten:false,currentRealityTruthCreated:false})}));}
  return freeze(candidates);
}

export async function buildRelationshipRealityComparisons({relationshipIntentId,candidates=[],responses=[],relationshipCurrentRealityIr}={}){
  const intentId=text(relationshipIntentId,'REL_W5_RELATIONSHIP_INTENT_ID_REQUIRED',180);
  if(relationshipCurrentRealityIr?.schemaVersion!==RELATIONSHIP_CURRENT_REALITY_IR_SCHEMA)fail('REL_W5_CURRENT_REALITY_IR_REQUIRED',400);
  if(relationshipCurrentRealityIr.relationshipIntentId!==intentId)fail('REL_W5_CURRENT_REALITY_INTENT_MISMATCH',409);
  const candidateById=new Map();for(const c of list(candidates)){if(c?.schemaVersion!==RELATIONSHIP_REALITY_CANDIDATE_SCHEMA)fail('REL_W5_REALITY_CANDIDATE_V1_REQUIRED',400);if(candidateById.has(c.candidateId))fail('REL_W5_CANDIDATE_ID_UNIQUE_REQUIRED',409);candidateById.set(c.candidateId,c);}
  const observationIds=new Set(list(relationshipCurrentRealityIr.observations).map(x=>x.relationshipObservationId));
  const responseByCandidate=new Map();
  for(const raw of list(responses)){
    scan(raw);const candidateId=text(raw?.candidateId,'REL_W5_RESPONSE_CANDIDATE_ID_REQUIRED',180);const candidate=candidateById.get(candidateId);if(!candidate)fail('REL_W5_RESPONSE_CANDIDATE_UNKNOWN',404);
    if(responseByCandidate.has(candidateId))fail('REL_W5_ONE_RESPONSE_PER_CANDIDATE_REQUIRED',409);
    const state=text(raw?.state,'REL_W5_RESPONSE_STATE_REQUIRED',80).toUpperCase();if(!STATE_SET.has(state))fail('REL_W5_RESPONSE_STATE_INVALID',400);
    const observationRefs=uniqStrings(raw?.observationRefs,'REL_W5_RESPONSE_OBSERVATION_REF_INVALID',180);for(const ref of observationRefs)if(!observationIds.has(ref))fail('REL_W5_RESPONSE_OBSERVATION_REF_UNKNOWN',404,{ref});
    responseByCandidate.set(candidateId,{state,observationRefs,customerNote:text(raw?.customerNote,'REL_W5_CUSTOMER_NOTE_INVALID',500,{optional:true})});
  }
  const comparisons=[];
  for(const candidate of candidateById.values()){
    const response=responseByCandidate.get(candidate.candidateId)||{state:'OPEN',observationRefs:[],customerNote:null};const core={relationshipIntentId:intentId,relationshipClaimId:candidate.relationshipClaimId,methodId:candidate.methodId,semanticOwnerId:candidate.semanticOwnerId,responseState:response.state,observationRefs:response.observationRefs,customerNote:response.customerNote};const d=await sha256(core);
    comparisons.push(freeze({schemaVersion:RELATIONSHIP_REALITY_COMPARISON_SCHEMA,comparisonId:`REL-RC-${d.slice(0,24).toUpperCase()}`,candidateId:candidate.candidateId,relationshipIntentId:intentId,relationshipClaimId:candidate.relationshipClaimId,methodId:candidate.methodId,semanticOwnerId:candidate.semanticOwnerId,responseState:response.state,observationRefs:freeze([...response.observationRefs]),customerNote:response.customerNote,basis:'EXPLICIT_CUSTOMER_COMPARISON',source:'CUSTOMER',sourceClass:SOURCE_CLASS,customerControlled:true,governance:freeze({customerResonanceIsMethodProof:false,customerNonResonanceDisprovesMethod:false,currentRealityRewritesMethod:false,partnerHiddenStateInferred:false,unansweredRemainsOpen:true})}));
  }
  const semanticDigest=await sha256(comparisons.map(x=>({comparisonId:x.comparisonId,claim:x.relationshipClaimId,state:x.responseState,observationRefs:x.observationRefs})));
  return freeze({schemaVersion:RELATIONSHIP_REALITY_COMPARISON_SET_SCHEMA,relationshipIntentId:intentId,allowedStates:RELATIONSHIP_REALITY_COMPARISON_STATES,comparisons:freeze(comparisons),governance:freeze({sharedStateVocabularyWithPprW46:true,automaticSemanticMatching:false,explicitCustomerComparisonOnly:true,agreementIsProof:false,disagreementInvalidatesMethod:false,unansweredRemainsOpen:true,crossMethodVoting:false}),semanticDigest});
}

export function buildRelationshipProgressiveCurrentRealityIntake(locale='en'){
  const zh=locale==='zh-Hans';const q=(promptId,en,zhHans,domain)=>freeze({promptId,label:zh?zhHans:en,suggestedDomain:domain});
  return freeze({schemaVersion:'PHI-OS-RELATIONSHIP-PROGRESSIVE-CURRENT-REALITY-INTAKE-v1.0.0',prompts:freeze([
    q('ACTIVE_NOW','What feels most active between you right now?','你们之间现在最活跃的是什么？','CURRENT_STATE'),
    q('REPEATING_NOW','What keeps repeating between you?','你们之间什么正在反复出现？','REPEATING_PATTERN'),
    q('COMMUNICATION_STUCK','Where does communication get stuck?','沟通通常卡在哪里？','COMMUNICATION'),
    q('CLOSE_OR_DISTANT','Where do you feel close or distant?','你们在哪些地方感觉靠近，哪些地方感觉疏远？','INTIMACY_DISTANCE'),
    q('SHARED_DECISION','What shared decision is active?','目前有什么共同决定正在进行？','DECISION_MAKING'),
    q('PRACTICAL_PRESSURE','What practical pressure affects the relationship?','目前有什么现实压力正在影响这段关系？','PRACTICAL_PRESSURE'),
    q('UNDERSTAND_NOW','What are you trying to understand now?','你现在最想弄明白这段关系的什么？','OPEN_QUESTION')
  ]),scopes:RELATIONSHIP_REALITY_SCOPES,domains:RELATIONSHIP_REALITY_DOMAINS,observationTypes:RELATIONSHIP_REALITY_OBSERVATION_TYPES,comparisonStates:freeze({CURRENTLY_RESONANT:'符合',PARTIALLY_RESONANT:'部分符合',CURRENTLY_NOT_RESONANT:'目前不符合',OPEN:'不确定'}),governance:freeze({progressive:true,longQuestionnaire:false,sensitiveConsentSeparate:true,otherAsObservedIsNotPartnerInnerStateFact:true})});
}

export async function buildRelationshipCurrentRealityBundle({relationshipIntent,input={},claimSnapshot,selectedClaimRefs=[],responses=[]}={}){
  const normalized=normalizeRelationshipCurrentRealityInput(input,relationshipIntent);const currentRealityIr=await buildRelationshipCurrentRealityIR(normalized);const candidates=await buildRelationshipRealityComparisonCandidates({claimSnapshot,selectedClaimRefs});const comparisonSet=await buildRelationshipRealityComparisons({relationshipIntentId:normalized.relationshipIntentId,candidates,responses,relationshipCurrentRealityIr:currentRealityIr});const semanticDigest=await sha256({currentRealityIr:currentRealityIr.semanticDigest,comparisonSet:comparisonSet.semanticDigest});
  return freeze({schemaVersion:'PHI-OS-REL-W5-RELATIONSHIP-CURRENT-REALITY-BUNDLE-v1.0.0',relationshipIntentId:normalized.relationshipIntentId,currentRealityIr,candidates,relationshipRealityComparisons:comparisonSet.comparisons,comparisonSet,customerPublicationAllowed:false,governance:{relW5MachineLayerOnly:true,relW6RequiredForCrossEvidenceSynthesis:true,relW8RequiredForRelationshipCustomerPublication:true},semanticDigest});
}

export default Object.freeze({normalizeRelationshipCurrentRealityInput,buildRelationshipCurrentRealityIR,buildRelW5AdmittedClaimSnapshot,buildRelationshipRealityComparisonCandidates,buildRelationshipRealityComparisons,buildRelationshipProgressiveCurrentRealityIntake,buildRelationshipCurrentRealityBundle});
