import {deepFreeze, sha256Stable, stableStringify} from '../../interpretation-runtime/mir7-utils.js';
import {normalizeRelationshipIntent, RELATIONSHIP_INTENT_SCHEMA} from './relationship-intent.js';
import {RELATIONSHIP_PARTICIPANT_READING_SET_SCHEMA} from './relationship-participant-reading-set.js';
import {
  REL_W5_ADMITTED_CLAIM_SNAPSHOT_SCHEMA,
  RELATIONSHIP_CURRENT_REALITY_IR_SCHEMA,
  RELATIONSHIP_REALITY_COMPARISON_SCHEMA
} from './relationship-current-reality.js';
import {CROSS_METHOD_RELATIONSHIP_IR_SCHEMA, REL_W6_GROUPS} from './relationship-cross-evidence-synthesis.js';
import {NARRATIVE_BRIEF_SCHEMA} from '../narrative/narrative-brief-compiler.js';
import {PROFILE_SIGNAL_SCHEMA, PROFILE_SOURCE_CLASSES} from '../../profile/profile-foundation-runtime.js';

export const RELATIONSHIP_NARRATIVE_BRIEF_SCHEMA='PHI-OS-RELATIONSHIP-NARRATIVE-BRIEF-v1.0.0';
export const GENERIC_NARRATIVE_BRIEF_CONTRACT_SCHEMA='PHI-OS-NARRATIVE-BRIEF-CONTRACT-v1.0.0';

const ACCEPTED_READING_SCHEMA='PHI-OS-ACCEPTED-METHOD-READING-ENVELOPE-v1.0.0';
const REL_CLAIM_SCHEMA='PHI-OS-METHOD-RELATIONSHIP-CLAIM-v1.0.0';
const METHOD_SET=new Set(['AST','BZR','ZWR','NUM','ECR','HD']);
const PROFILE_SOURCE_SET=new Set(PROFILE_SOURCE_CLASSES);
const REL_GROUP_SET=new Set(REL_W6_GROUPS);
const RAW_OR_PROVIDER_KEYS=new Set([
  'rawPlanets','rawPillars','rawPalaces','rawNumbers','rawEcrStructures','rawHumanDesign',
  'rawAssessmentAnswers','rawExternalProfileLabels','methodRegistries','semanticCorpora','providerSecrets','modelConfig'
]);
const PROHIBITED_INPUT_KEYS=new Set([
  'compatibilityScore','compatibilityPercentage','matchPercentage','relationshipVerdict','soulmate','destinedVerdict',
  'partnerHiddenState','partnerHiddenFeeling','stayLeaveDirective','diagnosis','methodVote','truthConfidencePercentage'
]);
const STYLE_KEYS=new Set(['tone','depth','phiOsLens','explanationFirst','customerReadable','governanceJargonDefault']);
const DEFAULT_STYLE=Object.freeze({tone:'WARM_PROFESSIONAL',depth:'PROFESSIONAL',phiOsLens:'SPARING',explanationFirst:true,customerReadable:true,governanceJargonDefault:false});
const DEFAULT_FREEDOM=Object.freeze({
  mayVary:['chapter architecture','paragraph order','transitions','metaphor','narrative flow','customer-readable phrasing','PHI OS Lens placement'],
  mustPreserve:['participant distinction','source facts','source classes','relationship claim classes','precision boundaries','uncertainty','counter-evidence','non-convergence','Current Reality customer-control','prohibited claim boundary'],
  mayRecalculateFacts:false,
  mayInventRelationshipEvents:false,
  mayInventCurrentReality:false,
  mayDiagnose:false,
  mayGuaranteeFuture:false,
  mayInferPartnerHiddenState:false,
  mayCreateCompatibilityScore:false,
  mayCreateSoulmateOrDestinyVerdict:false,
  mayCreateScientificValidationFromCrossSourceAlignment:false,
  mayTurnTimingIntoPermanentIdentity:false
});
const PARTNER_MIND_STATE_FORBIDDEN=Object.freeze([
  'HIDDEN_FEELINGS','PRIVATE_INTENTIONS','UNSTATED_MOTIVES','UNREPORTED_MENTAL_STATE','UNREPORTED_LOVE_STATE','UNREPORTED_COMMITMENT_STATE'
]);
const BASE_PROHIBITED=Object.freeze([
  'DIAGNOSIS','PARTNER_DIAGNOSIS','GUARANTEED_FUTURE_EVENT','GUARANTEED_RELATIONSHIP_OUTCOME',
  'PARTNER_HIDDEN_STATE_INFERENCE','COMPATIBILITY_PERCENTAGE','DESTINY_OR_SOULMATE_VERDICT','STAY_LEAVE_DIRECTIVE',
  'SCIENTIFIC_VALIDATION_TRANSFER','NEW_LIFE_EVENT_WITHOUT_SOURCE','OBJECTIVE_RELATIONSHIP_FACT_WITHOUT_SOURCE',
  'OBJECTIVE_PROFILE_IDENTITY_FROM_SELF_REPORT','METHOD_PROOF_FROM_CURRENT_REALITY','METHOD_DISPROOF_FROM_CURRENT_REALITY',
  'IQ_OR_PERCENTILE_WITHOUT_NORMING_AUTHORITY'
]);

const clean=v=>String(v??'').trim();
const list=v=>Array.isArray(v)?v:[];
const uniq=v=>[...new Set(list(v).filter(x=>x!==null&&x!==undefined&&clean(x)).map(x=>clean(x)))];
const clip=(v,n=900)=>{const s=clean(v).replace(/\s+/g,' ');return s.length<=n?s:`${s.slice(0,n-1)}…`};
const freeze=deepFreeze;
function fail(code,status=422,details=null){const e=new Error(code);e.code=code;e.status=status;if(details!==null)e.details=details;throw e}
function scan(v,path='$'){
  if(!v||typeof v!=='object')return;
  for(const [k,x] of Object.entries(v)){
    if(RAW_OR_PROVIDER_KEYS.has(k))fail(`REL_W7_RAW_OR_PROVIDER_INPUT_FORBIDDEN:${path}.${k}`,409);
    if(PROHIBITED_INPUT_KEYS.has(k)&&x!==false&&x!==null&&x!==undefined)fail(`REL_W7_PROHIBITED_FIELD:${path}.${k}`,409);
    scan(x,`${path}.${k}`);
  }
}
function assertDigest(v,code){const s=clean(v);if(!/^[a-f0-9]{64}$/.test(s))fail(code,400);return s}
function stylePolicy(input){
  if(input==null)return {...DEFAULT_STYLE};
  if(typeof input!=='object'||Array.isArray(input))fail('REL_W7_STYLE_INTENT_INVALID',400);
  for(const key of Object.keys(input))if(!STYLE_KEYS.has(key))fail('REL_W7_STYLE_INTENT_KEY_NOT_ALLOWED',400,{key});
  const out={...DEFAULT_STYLE,...input};
  for(const key of ['tone','depth','phiOsLens'])out[key]=clip(out[key],80);
  for(const key of ['explanationFirst','customerReadable','governanceJargonDefault'])if(typeof out[key]!=='boolean')fail('REL_W7_STYLE_INTENT_BOOLEAN_REQUIRED',400,{key});
  return out;
}
function customerContextPolicy(input){
  if(input==null)return null;
  const text=typeof input==='string'?clip(input,1600):clip(input?.text??input?.statement??'',1600);
  if(!text)fail('REL_W7_CUSTOMER_CONTEXT_TEXT_REQUIRED',400);
  return freeze({
    sourceClass:'CUSTOMER_SUPPLIED_CONTEXT',
    text,
    factualAuthority:false,
    mayNarrateAsCustomerReportedContext:true,
    hiddenStateMayBecomeObjectivePartnerFact:false,
    automaticPersistence:false
  });
}
function assertGenericContract(contract){
  if(contract?.schemaVersion!==GENERIC_NARRATIVE_BRIEF_CONTRACT_SCHEMA||contract?.outputSchema!==NARRATIVE_BRIEF_SCHEMA)fail('REL_W7_GENERIC_NARRATIVE_BRIEF_CONTRACT_REQUIRED',409);
  if(contract?.rules?.writerMayRecalculateFacts!==false||contract?.rules?.writerMayCreateNewMeaningAuthority!==false||contract?.rules?.relationshipHiddenStateInferenceAllowed!==false)fail('REL_W7_GENERIC_BRIEF_BOUNDARY_DRIFT',409);
  return contract;
}
function assertParticipantSet(set,intent){
  if(set?.schemaVersion!==RELATIONSHIP_PARTICIPANT_READING_SET_SCHEMA)fail('REL_W7_PARTICIPANT_READING_SET_REQUIRED',400);
  if(set.relationshipIntentId!==intent.relationshipIntentId)fail('REL_W7_PARTICIPANT_SET_INTENT_MISMATCH',409);
  if(set?.participants?.A?.participantRef!==intent.participantARef)fail('REL_W7_PARTICIPANT_A_INTENT_MISMATCH',409);
  const hasB=Boolean(set?.participants?.B);
  if(intent.mode==='SPECIFIC_PERSON_RELATIONSHIP'&&!hasB)fail('REL_W7_PARTICIPANT_B_REQUIRED',409);
  if(intent.mode==='SELF_RELATIONSHIP_PATTERN'&&hasB)fail('REL_W7_SELF_PATTERN_MUST_NOT_INVENT_PARTICIPANT_B',409);
  if(hasB&&set.participants.B.participantRef===set.participants.A.participantRef)fail('REL_W7_DISTINCT_PARTICIPANTS_REQUIRED',409);
  for(const side of ['A','B'])for(const env of list(set?.participants?.[side]?.methodReadings)){
    if(env?.schemaVersion!==ACCEPTED_READING_SCHEMA||!METHOD_SET.has(env.methodId)||env?.boundary?.acceptedAuthorityOnly!==true)fail(`REL_W7_${side}_ACCEPTED_METHOD_READING_REQUIRED`,409,{methodId:env?.methodId});
  }
  return set;
}
function claimEntries(snapshot){
  if(snapshot==null)return [];
  if(snapshot?.schemaVersion!==REL_W5_ADMITTED_CLAIM_SNAPSHOT_SCHEMA)fail('REL_W7_REL_W5_ADMITTED_CLAIM_SNAPSHOT_REQUIRED',400);
  const out=[];
  for(const entry of list(snapshot.claimEntries)){
    const claim=entry?.sourceClaim;
    if(entry?.admissionState!=='HUMAN_ADMITTED'||entry?.customerPublishable!==true||claim?.schemaVersion!==REL_CLAIM_SCHEMA)fail('REL_W7_RELATIONSHIP_CLAIM_NOT_HUMAN_ADMITTED',409,{relationshipClaimId:entry?.relationshipClaimId});
    if(entry.relationshipClaimId!==claim.relationshipClaimId||entry.methodId!==claim.methodId||!METHOD_SET.has(entry.methodId))fail('REL_W7_RELATIONSHIP_CLAIM_IDENTITY_MISMATCH',409);
    out.push(entry);
  }
  return out;
}
function assertCrossIr(ir,intent,claims,profileSignals){
  if(ir==null)return null;
  if(ir?.schemaVersion!==CROSS_METHOD_RELATIONSHIP_IR_SCHEMA||ir.relationshipIntentId!==intent.relationshipIntentId)fail('REL_W7_REL_W6_CROSS_RELATIONSHIP_IR_REQUIRED',409);
  if(ir?.governance?.methodVoting!==false||ir?.governance?.compatibilityScoreCreated!==false||ir?.governance?.partnerHiddenStateInferred!==false||ir?.governance?.relW7NarrativeBriefRequiredBeforeNarrativeUse!==true)fail('REL_W7_REL_W6_GOVERNANCE_DRIFT',409);
  const claimIds=new Set(claims.map(x=>x.relationshipClaimId));
  const profileIds=new Set(profileSignals.map(x=>x.profileSignalId));
  for(const item of list(ir.items)){
    if(!REL_GROUP_SET.has(item?.group))fail('REL_W7_REL_W6_GROUP_INVALID',409);
    for(const ref of list(item?.laneRefs?.symbolicClaimRefs))if(!claimIds.has(ref))fail('REL_W7_REL_W6_SYMBOLIC_REF_NOT_IN_ADMITTED_SNAPSHOT',409,{ref});
  }
  for(const ref of list(ir?.lanes?.PROFILE_ASSESSMENT_LANE?.signalRefs))if(!profileIds.has(ref))fail('REL_W7_REL_W6_PROFILE_SIGNAL_REF_MISSING',409,{ref});
  return ir;
}
function assertCurrentReality(ir,comparisons,intent,claims){
  if(ir?.schemaVersion!==RELATIONSHIP_CURRENT_REALITY_IR_SCHEMA||ir.relationshipIntentId!==intent.relationshipIntentId)fail('REL_W7_REL_W5_CURRENT_REALITY_IR_REQUIRED',409);
  if(ir?.governance?.customerResonanceIsMethodProof!==false||ir?.governance?.otherAsObservedNeverBecomesObjectivePartnerInnerState!==true)fail('REL_W7_REL_W5_REALITY_GOVERNANCE_DRIFT',409);
  const obsIds=new Set(list(ir.observations).map(x=>x.relationshipObservationId));
  const claimIds=new Set(claims.map(x=>x.relationshipClaimId));
  for(const c of list(comparisons)){
    if(c?.schemaVersion!==RELATIONSHIP_REALITY_COMPARISON_SCHEMA||c.relationshipIntentId!==intent.relationshipIntentId||c.customerControlled!==true)fail('REL_W7_RELATIONSHIP_REALITY_COMPARISON_INVALID',409);
    if(!claimIds.has(c.relationshipClaimId))fail('REL_W7_REALITY_COMPARISON_CLAIM_NOT_ADMITTED',409,{relationshipClaimId:c.relationshipClaimId});
    for(const ref of list(c.observationRefs))if(!obsIds.has(ref))fail('REL_W7_REALITY_COMPARISON_OBSERVATION_UNKNOWN',409,{ref});
  }
  return ir;
}
function normalizeProfileSignals(signals,set,intent){
  const a=set.participants.A.participantRef,b=set.participants.B?.participantRef??null,out=[];
  for(const signal of list(signals)){
    if(signal?.schemaVersion!==PROFILE_SIGNAL_SCHEMA||!PROFILE_SOURCE_SET.has(signal.sourceClass)||!clean(signal.profileSignalId)||!clean(signal.semanticDigest))fail('REL_W7_PROFILE_SIGNAL_ENVELOPE_REQUIRED',409);
    if(signal.participantRef!==a&&signal.participantRef!==b)fail('REL_W7_PROFILE_SIGNAL_PARTICIPANT_NOT_IN_RELATIONSHIP',409,{participantRef:signal.participantRef});
    if(intent.mode==='SELF_RELATIONSHIP_PATTERN'&&signal.participantRef!==a)fail('REL_W7_SELF_PATTERN_PROFILE_B_FORBIDDEN',409);
    out.push(signal);
  }
  return out;
}
function acceptedUnitText(unit){return clip(unit?.summary??unit?.plainLanguageExplanation??unit?.title??'',700)}
function participantBaseline(participant,side){
  if(!participant)return null;
  const themes=[];const refs=[];const boundary=[];
  for(const reading of list(participant.methodReadings)){
    refs.push(reading.readingAuthorityRef);
    const priority=new Set(list(reading.priorityRefs));
    const units=[...list(reading.acceptedUnits)].sort((a,b)=>Number(priority.has(b?.interpretationUnitId))-Number(priority.has(a?.interpretationUnitId)));
    for(const unit of units){const statement=acceptedUnitText(unit);if(!statement)continue;themes.push({signalId:`${side}:${reading.methodId}:${unit.interpretationUnitId||themes.length+1}`,kind:'PARTICIPANT_BASELINE_THEME',statement,refs:uniq([reading.readingAuthorityRef,unit.interpretationUnitId]),methods:[reading.methodId],sourceClasses:['SYMBOLIC_INTERPRETATION']});if(themes.length>=12)break;}
    for(const x of list(reading.boundaryFlags))boundary.push(`${reading.methodId}:${x}`);
    for(const unit of list(reading.acceptedUnits))if(clean(unit?.confidenceBoundary))boundary.push(`${reading.methodId}:${clip(unit.confidenceBoundary,300)}`);
    if(themes.length>=12)break;
  }
  return {participantRef:participant.participantRef,baselineThemes:freeze(themes.slice(0,12)),relevantMethodRefs:freeze(uniq(refs)),...(side==='B'?{precisionBoundary:freeze(uniq(boundary).slice(0,24))}:{})};
}
function profileSignalView(signal){
  const value=typeof signal.value==='string'||typeof signal.value==='number'||typeof signal.value==='boolean'?String(signal.value):stableStringify(signal.value??null);
  const domain=[clean(signal.domainId),clean(signal.facetId)].filter(Boolean).join(' / ');
  return freeze({
    signalId:signal.profileSignalId,
    kind:'PROFILE_SIGNAL',
    statement:clip(`${domain}: ${value}`,700),
    refs:freeze(uniq([signal.profileSignalId,signal.sourceRef])),
    sourceClasses:freeze([signal.sourceClass]),
    precisionBoundary:freeze(uniq(signal.precisionBoundary).slice(0,12))
  });
}
function relClaimSignal(entry,kind=null){
  const claim=entry.sourceClaim;
  return freeze({
    signalId:claim.relationshipClaimId,
    kind:kind||claim.claimClass,
    statement:clip(claim.summary||claim.headline,900),
    refs:freeze(uniq([claim.relationshipClaimId,claim.semanticOwnerId,claim.compositionRuleId,...list(claim.supportRefs),...list(claim.conditionRefs)])),
    methods:freeze([claim.methodId]),
    sourceClasses:freeze(['SYMBOLIC_INTERPRETATION']),
    qualifier:claim.claimClass
  });
}
function crossSignal(item,kind=null){
  return freeze({
    signalId:item.synthesisItemId,
    kind:kind||item.group,
    statement:clip(item.statement,900),
    refs:freeze(uniq([item.synthesisItemId,...list(item?.laneRefs?.symbolicClaimRefs),...list(item?.laneRefs?.profileEvidenceRefs),...list(item?.laneRefs?.realityComparisonRefs)])),
    methods:freeze(uniq(item.methods)),
    sourceClasses:freeze(uniq(item.sourceClasses)),
    qualifier:item.qualifier??null
  });
}
function realitySignal(obs){
  return freeze({signalId:obs.relationshipObservationId,kind:`CURRENT_REALITY_${obs.scope}`,statement:clip(obs.statement,800),refs:freeze([obs.relationshipObservationId]),methods:freeze([]),sourceClasses:freeze(['CURRENT_REALITY_OBSERVATION']),qualifier:obs.observableVsInterpretive});
}
function compact(values,max=24){const seen=new Set();const out=[];for(const x of values.filter(Boolean)){const key=`${x.kind}|${x.statement}|${list(x.refs).join('|')}`;if(seen.has(key))continue;seen.add(key);out.push(x);if(out.length>=max)break;}return freeze(out)}
function byClass(entries,classes){const wanted=new Set(classes);return entries.filter(x=>wanted.has(x.claimClass)).map(x=>relClaimSignal(x))}
function byGroup(ir,groups){if(!ir)return [];const wanted=new Set(groups);return list(ir.items).filter(x=>wanted.has(x.group)).map(x=>crossSignal(x))}
function explicitTopic(ir,terms){if(!ir)return [];const rx=new RegExp(terms.join('|'),'i');return list(ir.items).filter(x=>rx.test(clean(x.topicId))).map(x=>crossSignal(x,'EXPLICIT_TOPIC_THEME'))}
function profileLocks(signals){return freeze(signals.map(x=>({participantRef:x.participantRef,profileSignalRef:x.profileSignalId,sourceClass:x.sourceClass,semanticDigest:x.semanticDigest,mayBecomeOtherSourceClass:false})).sort((a,b)=>`${a.participantRef}|${a.profileSignalRef}`.localeCompare(`${b.participantRef}|${b.profileSignalRef}`)))}
function sourceClassLocks(claims,profiles,reality){
  const rows=[];
  for(const e of claims)rows.push({sourceClass:'SYMBOLIC_INTERPRETATION',sourceRef:e.relationshipClaimId,semanticDigest:null,mayBecomeOtherSourceClass:false});
  for(const p of profiles)rows.push({sourceClass:p.sourceClass,sourceRef:p.profileSignalId,semanticDigest:p.semanticDigest,mayBecomeOtherSourceClass:false});
  for(const o of list(reality?.observations))rows.push({sourceClass:'CURRENT_REALITY_OBSERVATION',sourceRef:o.relationshipObservationId,semanticDigest:o.semanticDigest??null,mayBecomeOtherSourceClass:false});
  const seen=new Set();return freeze(rows.filter(x=>{const k=`${x.sourceClass}|${x.sourceRef}`;if(seen.has(k))return false;seen.add(k);return true;}));
}
function precisionBoundary(set,cross){
  const out=[];
  if(set?.participants?.B)out.push(clean(set?.participantPrecision?.B));
  for(const s of list(set?.suppressedCapabilities))for(const r of list(s.reasonCodes))out.push(`${s.methodId}:${r}`);
  for(const c of list(cross?.methodContext))for(const r of list(c.precisionBoundaryRefs))out.push(`${c.methodId}:${r}`);
  return freeze(uniq(out).slice(0,32));
}
function factsUnknown(intent,set,profiles,reality,cross){
  const out=['RELATIONSHIP_OUTCOME_NOT_KNOWN','FUTURE_DURATION_NOT_KNOWN','SOULMATE_OR_DESTINY_STATUS_NOT_KNOWN','SYMBOLIC_METHOD_TRUTH_NOT_ESTABLISHED_BY_RELATIONSHIP_READING'];
  if(intent.mode==='SPECIFIC_PERSON_RELATIONSHIP')out.push('PARTNER_HIDDEN_FEELINGS_NOT_KNOWN','PARTNER_PRIVATE_INTENTIONS_NOT_KNOWN','PARTNER_UNREPORTED_MENTAL_STATE_NOT_KNOWN');else out.push('NO_PARTICIPANT_B_IN_SELF_RELATIONSHIP_PATTERN');
  if(!list(reality?.observations).length)out.push('CURRENT_REALITY_NOT_PROVIDED');
  if(!profiles.some(x=>x.participantRef===set.participants.A.participantRef))out.push('PROFILE_A_NOT_PROVIDED');
  if(set.participants.B&&!profiles.some(x=>x.participantRef===set.participants.B.participantRef))out.push('PROFILE_B_NOT_PROVIDED');
  for(const ctx of list(cross?.methodContext))if(ctx.state==='UNAVAILABLE')out.push(`METHOD_UNAVAILABLE:${ctx.methodId}:${uniq(ctx.reasonRefs).join('+')||'UNSPECIFIED'}`);
  return freeze(uniq(out).slice(0,48));
}
function factLocks(intent,set,claims,profiles,cross,reality,comparisons,sourceSemanticDigest){
  const out=[
    {lockType:'RELATIONSHIP_INTENT',value:`${intent.relationshipIntentId}:${intent.mode}:${intent.relationshipType}:${intent.focusAreas.join('+')}`},
    {lockType:'RELATIONSHIP_SOURCE_SEMANTIC_DIGEST',value:sourceSemanticDigest},
    {lockType:'PARTICIPANT_A',value:`${set.participants.A.participantRef}:${set.participants.A.inputDigest}`}
  ];
  if(set.participants.B)out.push({lockType:'PARTICIPANT_B',value:`${set.participants.B.participantRef}:${set.participants.B.inputDigest}`});
  for(const side of ['A','B'])for(const r of list(set?.participants?.[side]?.methodReadings))out.push({lockType:`PARTICIPANT_${side}_METHOD_READING`,value:`${r.methodId}:${r.readingAuthorityRef}:${clean(r.semanticDigest)}`});
  for(const e of claims)out.push({lockType:'HUMAN_ADMITTED_RELATIONSHIP_CLAIM',value:`${e.relationshipClaimId}:${e.methodId}:${e.claimClass}:${e.semanticOwnerId}`});
  for(const p of profiles)out.push({lockType:'PROFILE_SIGNAL',value:`${p.participantRef}:${p.profileSignalId}:${p.sourceClass}:${p.semanticDigest}`});
  for(const i of list(cross?.items))out.push({lockType:'REL_W6_CROSS_EVIDENCE_ITEM',value:`${i.synthesisItemId}:${i.group}:${i.semanticDigest}`});
  for(const o of list(reality?.observations))out.push({lockType:'CURRENT_REALITY_OBSERVATION',value:`${o.relationshipObservationId}:${o.observableVsInterpretive}:${clip(o.statement,700)}`});
  for(const c of comparisons)out.push({lockType:'RELATIONSHIP_REALITY_COMPARISON',value:`${c.comparisonId}:${c.relationshipClaimId}:${c.responseState}`});
  const seen=new Set();return freeze(out.filter(x=>{const k=`${x.lockType}|${x.value}`;if(seen.has(k))return false;seen.add(k);return true;}).slice(0,160));
}
function sensitiveBoundaries(reality){
  const out=['EXPLICIT_RELATIONSHIP_PURPOSE_AND_CONSENT_REQUIRED','PERSON_B_PRIVATE_STATE_IS_NOT_OBJECTIVE_FACT','CURRENT_REALITY_REMAINS_CUSTOMER_CONTROLLED','NO_SILENT_THIRD_PARTY_PERSISTENCE'];
  for(const o of list(reality?.observations))if(o.sensitive===true)out.push(`SENSITIVE_REALITY_CONSENT:${o.consentRef}`);
  return freeze(uniq(out).slice(0,32));
}
function lensTargets({intent,cross,reality,profiles,timing,nonConvergence}){
  const out=['PARTICIPANTS_REMAIN_DISTINCT','INTERACTION_NOT_COMPATIBILITY_SCORE','UNCERTAINTY_REMAINS_OPEN'];
  if(list(reality?.observations).length)out.push('CURRENT_REALITY_CONTEXTUALIZES_STRUCTURE');
  if(profiles.length)out.push('SOURCE_CLASS_SEPARATION');
  if(nonConvergence.length)out.push('NON_CONVERGENCE_PRESERVED');
  if(timing.length)out.push('TIMING_CONTEXT_NOT_PERMANENT_IDENTITY');
  if(intent.mode==='SELF_RELATIONSHIP_PATTERN')out.push('SELF_PATTERN_WITHOUT_INVENTED_PARTNER');
  else out.push('DIRECTED_A_B_INTERACTION');
  if(cross?.lanes?.PROFILE_ASSESSMENT_LANE?.enabled)out.push('PROFILE_EVIDENCE_REMAINS_PROFILE_EVIDENCE');
  return freeze(uniq(out).slice(0,12));
}
function openingSeed(locale,intent,core,connection,tension){
  const anchor=core[0]?.statement||connection[0]?.statement||tension[0]?.statement||intent.customerQuestion||intent.focusAreas[0]||'the relationship pattern';
  if(locale==='zh-Hans')return clip(intent.mode==='SELF_RELATIONSHIP_PATTERN'?`这份关系阅读从你反复出现的关系模式开始：${anchor}`:`这份关系阅读先从两个人相遇后最值得理解的互动结构开始：${anchor}`,900);
  return clip(intent.mode==='SELF_RELATIONSHIP_PATTERN'?`This relationship reading begins with the pattern that keeps returning for you: ${anchor}`:`This relationship reading begins with the interaction that becomes most worth understanding when these two people meet: ${anchor}`,900);
}
function curiosityQuestions(locale,intent,core,tension,reality,nonConvergence){
  const a=core[0]?.statement||intent.focusAreas[0]||'this central pattern';
  const b=tension[0]?.statement||nonConvergence[0]?.statement||'the main difference or tension';
  const c=reality[0]?.statement||'what is actually happening between you now';
  return freeze(locale==='zh-Hans'?[`你现在最清楚在哪里看见「${clip(a,240)}」？`,`当「${clip(b,240)}」出现时，你们的沟通、决定或距离感会怎样变化？`,`接下来什么现实观察，最能帮助你判断「${clip(c,240)}」正在维持、改变，还是仍然未知？`]:[`Where do you see “${clip(a,240)}” most clearly right now?`,`When “${clip(b,240)}” appears, what changes in communication, decisions, or distance between you?`,`What could you observe next to tell whether “${clip(c,240)}” is stable, changing, or still unknown?`]);
}

export async function compileRelationshipNarrativeBrief(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input))fail('REL_W7_INPUT_OBJECT_REQUIRED',400);
  scan(input);
  const genericContract=assertGenericContract(input.genericNarrativeBriefContract);
  const intent=normalizeRelationshipIntent(input.relationshipIntent||{});
  const set=assertParticipantSet(input.participantReadingSet,intent);
  const claims=claimEntries(input.claimSnapshot);
  if(intent.mode==='SELF_RELATIONSHIP_PATTERN'&&claims.length)fail('REL_W7_SELF_PATTERN_CROSS_PERSON_CLAIMS_FORBIDDEN',409);
  const profiles=normalizeProfileSignals(input.profileSignals||[],set,intent);
  const cross=assertCrossIr(input.crossMethodRelationshipIr??null,intent,claims,profiles);
  if(intent.mode==='SPECIFIC_PERSON_RELATIONSHIP'&&claims.length&&cross==null)fail('REL_W7_SPECIFIC_RELATIONSHIP_WITH_CLAIMS_REQUIRES_REL_W6',409);
  if(intent.mode==='SELF_RELATIONSHIP_PATTERN'&&cross!=null)fail('REL_W7_SELF_PATTERN_REL_W6_CROSS_PERSON_IR_FORBIDDEN',409);
  const reality=assertCurrentReality(input.relationshipCurrentRealityIr,input.relationshipRealityComparisons||[],intent,claims);
  const comparisons=list(input.relationshipRealityComparisons);
  const locale=intent.locale==='zh-Hans'?'zh-Hans':'en';
  const participantA=freeze(participantBaseline(set.participants.A,'A'));
  const participantBRaw=participantBaseline(set.participants.B,'B');
  const participantB=participantBRaw?freeze({...participantBRaw,precisionBoundary:precisionBoundary(set,cross)}):null;
  const profileA=compact(profiles.filter(x=>x.participantRef===set.participants.A.participantRef).map(profileSignalView),16);
  const profileB=set.participants.B?compact(profiles.filter(x=>x.participantRef===set.participants.B.participantRef).map(profileSignalView),16):freeze([]);
  const connectionDynamics=compact([...byClass(claims,['CONNECTION']),...byGroup(cross,['COMMON_EMPHASIS'])],24);
  const complementaryDynamics=compact([...byClass(claims,['COMPLEMENT']),...byGroup(cross,['COMPLEMENTARY_VIEW'])],24);
  const tensionSignals=compact([...byClass(claims,['TENSION']),...byGroup(cross,['TENSION','SOURCE_TENSION'])],24);
  const asymmetries=compact(byClass(claims,['ASYMMETRY']),16);
  const misreadRisks=compact(byClass(claims,['MISREAD_RISK']),16);
  const resourceThemes=compact([...byClass(claims,['RESOURCE_DYNAMIC']),...explicitTopic(cross,['RESOURCE','MONEY'])],16);
  const decisionThemes=compact([...byClass(claims,['DECISION_DYNAMIC']),...explicitTopic(cross,['DECISION'])],16);
  const sharedLifeThemes=compact(explicitTopic(cross,['SHARED_LIFE','FAMILY','HOME','WORK_COLLABORATION','COLLABORATION']),16);
  const relationshipCoreThemes=compact([...byGroup(cross,['COMMON_EMPHASIS']),...connectionDynamics.slice(0,4),...complementaryDynamics.slice(0,2)],12);
  const realitySignals=compact([...list(reality.observations).map(realitySignal),...byGroup(cross,['REALITY_SUPPORTED','REALITY_CONTRADICTED','OPEN'])],24);
  const timingContext=uniq([...claims.flatMap(x=>list(x.sourceClaim?.timingRefs)),...byClass(claims,['TIMING_CONTEXT']).map(x=>x.statement),...explicitTopic(cross,['TIMING','CURRENT_PHASE']).map(x=>x.statement)]).slice(0,32);
  const counterEvidence=uniq([...claims.flatMap(x=>list(x.sourceClaim?.counterRefs)),...byGroup(cross,['REALITY_CONTRADICTED']).map(x=>x.statement),...comparisons.filter(x=>x.responseState==='CURRENTLY_NOT_RESONANT').map(x=>`CURRENTLY_NOT_RESONANT:${x.relationshipClaimId}`)]).slice(0,32);
  const nonConvergence=compact(byGroup(cross,['NON_CONVERGENCE']),16);
  const openQuestions=uniq([intent.customerQuestion,...byGroup(cross,['OPEN']).map(x=>x.statement),...byClass(claims,['OPEN']).map(x=>x.statement)]).slice(0,16);
  const sourceSemanticDigest=await sha256Stable({
    genericNarrativeBriefSchema:genericContract.outputSchema,
    relationshipIntent:intent,
    participantReadingSet:set.semanticDigest,
    claimSnapshot:input.claimSnapshot?.semanticDigest??null,
    profileSignals:profiles.map(x=>({id:x.profileSignalId,digest:x.semanticDigest,sourceClass:x.sourceClass,participantRef:x.participantRef})).sort((a,b)=>a.id.localeCompare(b.id)),
    crossMethodRelationshipIr:cross?.semanticDigest??null,
    relationshipCurrentRealityIr:reality.semanticDigest,
    relationshipRealityComparisons:comparisons.map(x=>({id:x.comparisonId,claim:x.relationshipClaimId,state:x.responseState,observationRefs:list(x.observationRefs).slice().sort()})).sort((a,b)=>a.id.localeCompare(b.id))
  });
  const factsAiMustNotAlter=factLocks(intent,set,claims,profiles,cross,reality,comparisons,sourceSemanticDigest);
  const factsAiDoesNotKnow=factsUnknown(intent,set,profiles,reality,cross);
  const partnerMindStateForbidden=intent.mode==='SPECIFIC_PERSON_RELATIONSHIP'?freeze([...PARTNER_MIND_STATE_FORBIDDEN]):freeze([]);
  const sourceLocks=sourceClassLocks(claims,profiles,reality);
  const profileSourceClassLocks=profileLocks(profiles);
  const sensitive=sensitiveBoundaries(reality);
  const prohibited=freeze(uniq([...BASE_PROHIBITED,...partnerMindStateForbidden.map(x=>`PARTNER_${x}`)]).sort());
  const phiOsLensTargets=lensTargets({intent,cross,reality,profiles,timing:timingContext,nonConvergence});
  const relationshipOpeningSeed=openingSeed(locale,intent,relationshipCoreThemes,connectionDynamics,tensionSignals);
  const dynamicCuriosityQuestions=curiosityQuestions(locale,intent,relationshipCoreThemes,tensionSignals,realitySignals,nonConvergence);
  const seed={
    schemaVersion:RELATIONSHIP_NARRATIVE_BRIEF_SCHEMA,
    briefType:'RELATIONSHIP',
    genericNarrativeBriefSchemaRef:NARRATIVE_BRIEF_SCHEMA,
    genericNarrativeBriefContractRef:'content/personal-reading/narrative/contracts/narrative-brief-contract-v1.json',
    relationshipIntent:freeze({relationshipIntentId:intent.relationshipIntentId,mode:intent.mode,relationshipType:intent.relationshipType,focusAreas:freeze([...intent.focusAreas]),customerQuestion:intent.customerQuestion,locale:intent.locale,purpose:intent.purpose}),
    participantA,
    participantB,
    profileSignals:freeze({A:profileA,B:profileB}),
    profileSourceClassLocks,
    sourceClassLocks:sourceLocks,
    relationshipCoreThemes,
    connectionDynamics,
    complementaryDynamics,
    tensions:tensionSignals,
    asymmetries,
    misreadRisks,
    sharedLifeThemes,
    resourceThemes,
    decisionThemes,
    currentReality:realitySignals,
    timingContext:freeze(timingContext),
    counterEvidence:freeze(counterEvidence),
    nonConvergence,
    openQuestions:freeze(openQuestions),
    factsAiMustNotAlter,
    factsAiDoesNotKnow,
    partnerMindStateForbidden,
    sensitiveBoundaries:sensitive,
    prohibitedClaimClasses:prohibited,
    phiOsLensTargets,
    relationshipOpeningSeed,
    dynamicCuriosityQuestions,
    styleIntent:freeze(stylePolicy(input.styleIntent)),
    customerContext:customerContextPolicy(input.customerContext),
    narrativeFreedom:freeze({...DEFAULT_FREEDOM}),
    sourceSemanticDigest,
    governance:freeze({
      extendsGenericNarrativeBrief:true,
      secondWriterContractCreated:false,
      secondProviderContractCreated:false,
      writerAuthorityActivated:false,
      paidNarrativeGenerated:false,
      participantIdentityMerged:false,
      crossPersonMeaningCreatedHere:false,
      onlyHumanAdmittedRelationshipClaimsConsumed:true,
      relW6SynthesisReinterpreted:false,
      profileSourceClassesPreserved:true,
      profileEvidenceUpgradedIntoSymbolicConvergence:false,
      currentRealityCustomerControlled:true,
      currentRealityProvesMethod:false,
      currentRealityDisprovesMethod:false,
      timingConvertedIntoPermanentIdentity:false,
      compatibilityScoreCreated:false,
      partnerHiddenStateInferred:false,
      soulmateOrDestinyVerdictCreated:false,
      stayLeaveDirectiveCreated:false,
      relationshipOutcomeGuaranteed:false,
      relW8RequiredForPaidRelationshipPublication:true
    })
  };
  const briefSemanticDigest=await sha256Stable(seed);
  return freeze({...seed,briefId:`REL-NBR-${sourceSemanticDigest.slice(0,24).toUpperCase()}`,briefSemanticDigest});
}

export default Object.freeze({compileRelationshipNarrativeBrief});
