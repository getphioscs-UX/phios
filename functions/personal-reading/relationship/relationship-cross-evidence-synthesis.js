import { normalizeRelationshipIntent, RELATIONSHIP_INTENT_SCHEMA } from './relationship-intent.js';
import {
  REL_W5_ADMITTED_CLAIM_SNAPSHOT_SCHEMA,
  RELATIONSHIP_CURRENT_REALITY_IR_SCHEMA,
  RELATIONSHIP_REALITY_COMPARISON_SCHEMA
} from './relationship-current-reality.js';
import { PROFILE_PRODUCTION_AUTHORITY } from '../../profile/profile-production-authority.js';

export const CROSS_METHOD_RELATIONSHIP_IR_SCHEMA='PHI-OS-CROSS-METHOD-RELATIONSHIP-IR-v1.0.0';
export const CROSS_EVIDENCE_RELATIONSHIP_ITEM_SCHEMA='PHI-OS-CROSS-EVIDENCE-RELATIONSHIP-ITEM-v1.0.0';
export const REL_W6_RULE_REGISTRY_SCHEMA='PHI-OS-REL-W6-CROSS-EVIDENCE-RULE-REGISTRY-v1.0.0';
export const PROFILE_SIGNAL_SCHEMA='PHI-OS-PROFILE-SIGNAL-ENVELOPE-v1';
export const RELATIONSHIP_PROFILE_EVIDENCE_SCHEMA='PHI-OS-RELATIONSHIP-PROFILE-EVIDENCE-IR-v1';

export const REL_W6_GROUPS=Object.freeze([
  'COMMON_EMPHASIS','COMPLEMENTARY_VIEW','TENSION','NON_CONVERGENCE',
  'PROFILE_ALIGNMENT','PROFILE_DIFFERENCE','SOURCE_TENSION',
  'REALITY_SUPPORTED','REALITY_CONTRADICTED','OPEN'
]);
export const REL_W6_LANES=Object.freeze(['SYMBOLIC_METHOD_LANE','PROFILE_ASSESSMENT_LANE','CURRENT_REALITY_LANE']);
export const REL_W6_CUSTOMER_LABELS_ZH_HANS=Object.freeze({
  COMMON_EMPHASIS:'共同强调',COMPLEMENTARY_VIEW:'补充视角',TENSION:'张力',NON_CONVERGENCE:'不一致',
  PROFILE_ALIGNMENT:'自评 / 外部资料的共同点',PROFILE_DIFFERENCE:'自评 / 外部资料的差异',SOURCE_TENSION:'不同来源之间的张力',
  REALITY_SUPPORTED:'现实支持',REALITY_CONTRADICTED:'现实反证',OPEN:'仍开放'
});

const GROUP_SET=new Set(REL_W6_GROUPS);
const METHOD_SET=new Set(['AST','BZR','ZWR','NUM','ECR','HD']);
const PROFILE_SOURCE_CLASSES=new Set(['MEASURED_TASK_PERFORMANCE','STANDARDIZED_SELF_REPORT','CUSTOMER_SELF_REPORT','EXTERNAL_PROFILE_RESULT']);
const PROHIBITED_KEYS=new Set(['compatibilityScore','compatibilityPercentage','matchPercentage','relationshipVerdict','soulmate','destinedVerdict','partnerHiddenState','partnerHiddenFeeling','stayLeaveDirective','diagnosis','truthConfidencePercentage','methodVote']);
const clean=v=>String(v??'').trim();
const list=v=>Array.isArray(v)?v:[];
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};
function fail(code,status=422,details=null){const e=new Error(code);e.code=code;e.status=status;if(details!==null)e.details=details;throw e}
function text(v,code,max=900,{optional=false}={}){const s=clean(v);if(!s&&optional)return null;if(!s)fail(code,400);if(s.length>max)fail(`${code}_TOO_LONG`,400);return s}
function uniqStrings(v,code,max=220){return [...new Set(list(v).map(x=>text(x,code,max)))];}
function scan(v,path='$'){if(!v||typeof v!=='object')return;for(const [k,x] of Object.entries(v)){if(PROHIBITED_KEYS.has(k))fail(`REL_W6_PROHIBITED_FIELD:${path}.${k}`,409);scan(x,`${path}.${k}`)}}
function stable(value){if(value===null||typeof value!=='object')return JSON.stringify(value);if(Array.isArray(value))return `[${value.map(stable).join(',')}]`;return `{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${stable(value[k])}`).join(',')}}`;}
async function sha256(value){const bytes=new TextEncoder().encode(stable(value));const d=await globalThis.crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('');}

function assertRuleRegistry(registry){
  if(registry?.schemaVersion!==REL_W6_RULE_REGISTRY_SCHEMA)fail('REL_W6_RULE_REGISTRY_REQUIRED',400);
  if(registry.status!=='REL_W6_EXPLICIT_SYNTHESIS_RULES_ADMITTED_MACHINE_CURRENT')fail('REL_W6_RULE_REGISTRY_NOT_CURRENT',409);
  return registry;
}
function ruleById(registry,ruleId,kind){
  const rule=list(registry.rules).find(x=>x.ruleId===ruleId&&x.kind===kind);
  if(!rule)fail('REL_W6_RULE_NOT_FOUND',404,{ruleId,kind});
  if(rule.status!=='ADMITTED_FOR_REL_W6_EXPLICIT_SYNTHESIS')fail('REL_W6_RULE_NOT_ADMITTED',409,{ruleId});
  return rule;
}
function assertProfileAuthority(){
  const a=PROFILE_PRODUCTION_AUTHORITY;
  if(a.status!=='PRODUCTION_ADMITTED_CUTOVER_ELIGIBLE'||a.customerPublicationAllowed!==true)fail('REL_W6_PRF_W12_PRODUCTION_ADMISSION_REQUIRED',409);
  if(a.humanAcceptance?.accepted!==24||a.humanAcceptance?.pending!==0||a.freezePromotion?.active!==8)fail('REL_W6_PRF_W12_HUMAN_FREEZE_REQUIRED',409);
  return a;
}
function claimEntryMap(snapshot){
  if(snapshot?.schemaVersion!==REL_W5_ADMITTED_CLAIM_SNAPSHOT_SCHEMA)fail('REL_W6_REL_W5_ADMITTED_CLAIM_SNAPSHOT_REQUIRED',400);
  const byId=new Map();
  for(const entry of list(snapshot.claimEntries)){
    const id=text(entry?.relationshipClaimId,'REL_W6_CLAIM_ID_REQUIRED',180);
    if(byId.has(id))fail('REL_W6_CLAIM_ID_UNIQUE_REQUIRED',409);
    if(!METHOD_SET.has(entry.methodId)||entry.admissionState!=='HUMAN_ADMITTED'||entry.customerPublishable!==true)fail('REL_W6_CLAIM_NOT_HUMAN_ADMITTED_PUBLISHABLE',409,{id});
    byId.set(id,entry);
  }
  return byId;
}
function normalizeProfileSignals(profileSignals){
  const byId=new Map();
  for(const signal of list(profileSignals)){
    if(signal?.schemaVersion!==PROFILE_SIGNAL_SCHEMA)fail('REL_W6_PROFILE_SIGNAL_ENVELOPE_REQUIRED',400);
    const id=text(signal.profileSignalId,'REL_W6_PROFILE_SIGNAL_ID_REQUIRED',180);if(byId.has(id))fail('REL_W6_PROFILE_SIGNAL_ID_UNIQUE_REQUIRED',409);
    if(!PROFILE_SOURCE_CLASSES.has(signal.sourceClass))fail('REL_W6_PROFILE_SOURCE_CLASS_NOT_RELATIONSHIP_EVIDENCE',409,{sourceClass:signal.sourceClass});
    byId.set(id,signal);
  }
  return byId;
}
function normalizeProfileEvidence(ir,signalById,relationshipIntentId){
  const byId=new Map();
  if(ir===null||ir===undefined)return byId;
  assertProfileAuthority();
  if(ir?.schemaVersion!==RELATIONSHIP_PROFILE_EVIDENCE_SCHEMA)fail('REL_W6_RELATIONSHIP_PROFILE_EVIDENCE_IR_REQUIRED',400);
  if(ir.relationshipIntentId!==relationshipIntentId)fail('REL_W6_PROFILE_EVIDENCE_INTENT_MISMATCH',409);
  for(const item of list(ir.evidence)){
    const id=text(item.relationshipProfileEvidenceId,'REL_W6_PROFILE_EVIDENCE_ID_REQUIRED',180);if(byId.has(id))fail('REL_W6_PROFILE_EVIDENCE_ID_UNIQUE_REQUIRED',409);
    if(!PROFILE_SOURCE_CLASSES.has(item.sourceClass))fail('REL_W6_PROFILE_EVIDENCE_SOURCE_CLASS_INVALID',409);
    const aRef=item.participants?.A?.signalRef,bRef=item.participants?.B?.signalRef;
    if(!signalById.has(aRef)||!signalById.has(bRef))fail('REL_W6_PROFILE_EVIDENCE_SIGNAL_REF_UNKNOWN',404,{id});
    if(signalById.get(aRef).sourceClass!==item.sourceClass||signalById.get(bRef).sourceClass!==item.sourceClass)fail('REL_W6_PROFILE_EVIDENCE_SOURCE_CLASS_DRIFT',409,{id});
    byId.set(id,item);
  }
  return byId;
}
function normalizeReality(currentRealityIr,comparisons,relationshipIntentId,claimById){
  if(currentRealityIr?.schemaVersion!==RELATIONSHIP_CURRENT_REALITY_IR_SCHEMA)fail('REL_W6_REL_W5_CURRENT_REALITY_IR_REQUIRED',400);
  if(currentRealityIr.relationshipIntentId!==relationshipIntentId)fail('REL_W6_CURRENT_REALITY_INTENT_MISMATCH',409);
  const observationIds=new Set(list(currentRealityIr.observations).map(x=>x.relationshipObservationId));
  const byId=new Map();
  for(const c of list(comparisons)){
    if(c?.schemaVersion!==RELATIONSHIP_REALITY_COMPARISON_SCHEMA)fail('REL_W6_REL_W5_REALITY_COMPARISON_REQUIRED',400);
    if(c.relationshipIntentId!==relationshipIntentId)fail('REL_W6_REALITY_COMPARISON_INTENT_MISMATCH',409);
    if(!claimById.has(c.relationshipClaimId))fail('REL_W6_REALITY_COMPARISON_CLAIM_NOT_ADMITTED',409,{claim:c.relationshipClaimId});
    if(byId.has(c.comparisonId))fail('REL_W6_REALITY_COMPARISON_ID_UNIQUE_REQUIRED',409);
    for(const ref of list(c.observationRefs))if(!observationIds.has(ref))fail('REL_W6_REALITY_OBSERVATION_REF_UNKNOWN',404,{ref});
    byId.set(c.comparisonId,c);
  }
  return {observationIds,comparisonById:byId};
}
function groupAllowed(rule,group){if(!GROUP_SET.has(group)||!list(rule.allowedGroups).includes(group))fail('REL_W6_GROUP_NOT_ALLOWED_BY_RULE',409,{group,ruleId:rule.ruleId})}
function normalizeMethodContext(methodContext=[]){
  const states=new Set(['AVAILABLE','UNAVAILABLE','PARTIAL','UNKNOWN']);const out=[];const seen=new Set();
  for(const raw of list(methodContext)){const methodId=text(raw?.methodId,'REL_W6_METHOD_CONTEXT_METHOD_REQUIRED',40).toUpperCase();if(!METHOD_SET.has(methodId)||seen.has(methodId))fail('REL_W6_METHOD_CONTEXT_INVALID',409);seen.add(methodId);const state=text(raw?.state,'REL_W6_METHOD_CONTEXT_STATE_REQUIRED',40).toUpperCase();if(!states.has(state))fail('REL_W6_METHOD_CONTEXT_STATE_INVALID',400);out.push(freeze({methodId,state,reasonRefs:freeze(uniqStrings(raw?.reasonRefs,'REL_W6_METHOD_CONTEXT_REASON_INVALID',180)),precisionBoundaryRefs:freeze(uniqStrings(raw?.precisionBoundaryRefs,'REL_W6_METHOD_CONTEXT_PRECISION_INVALID',180))}));}
  return freeze(out);
}
async function makeItem({group,topicId,statement,ruleId,laneRefs,methods,sourceClasses,qualifier=null,governance={}}){
  const core={group,topicId,statement,ruleId,laneRefs,methods:[...methods].sort(),sourceClasses:[...sourceClasses].sort(),qualifier};const d=await sha256(core);
  return freeze({schemaVersion:CROSS_EVIDENCE_RELATIONSHIP_ITEM_SCHEMA,synthesisItemId:`REL-XE-${d.slice(0,24).toUpperCase()}`,group,customerLabelZhHans:REL_W6_CUSTOMER_LABELS_ZH_HANS[group],topicId,statement,ruleId,laneRefs:freeze(laneRefs),methods:freeze([...methods].sort()),sourceClasses:freeze([...sourceClasses].sort()),qualifier,governance:freeze({explicitSynthesis:true,sourceClassesPreserved:true,methodVoting:false,truthConversion:false,scientificValidationTransfer:false,partnerHiddenStateInferred:false,compatibilityScoreCreated:false,...governance}),semanticDigest:d});
}

export async function buildCrossEvidenceRelationshipSynthesis({
  relationshipIntent,claimSnapshot,profileSignals=[],relationshipProfileEvidenceIr=null,relationshipCurrentRealityIr,relationshipRealityComparisons=[],
  symbolicRequests=[],profileRequests=[],mixedSourceRequests=[],methodContext=[],ruleRegistry
}={}){
  scan({symbolicRequests,profileRequests,mixedSourceRequests,methodContext});
  const intent=normalizeRelationshipIntent(relationshipIntent||{});if(intent?.schemaVersion!==RELATIONSHIP_INTENT_SCHEMA)fail('REL_W6_RELATIONSHIP_INTENT_REQUIRED',400);
  const registry=assertRuleRegistry(ruleRegistry);const claimById=claimEntryMap(claimSnapshot);
  const signalById=normalizeProfileSignals(profileSignals);const profileEvidenceById=normalizeProfileEvidence(relationshipProfileEvidenceIr,signalById,intent.relationshipIntentId);
  const {comparisonById}=normalizeReality(relationshipCurrentRealityIr,relationshipRealityComparisons,intent.relationshipIntentId,claimById);
  const methodCtx=normalizeMethodContext(methodContext);
  for(const ctx of methodCtx){if(ctx.state==='UNAVAILABLE'&&[...claimById.values()].some(x=>x.methodId===ctx.methodId))fail('REL_W6_UNAVAILABLE_METHOD_HAS_CLAIMS',409,{methodId:ctx.methodId});}
  const items=[];
  // SYMBOLIC_METHOD_LANE: at least two distinct admitted methods; no semantic matching is performed here.
  for(const raw of list(symbolicRequests)){
    const ruleId=text(raw?.ruleId,'REL_W6_SYMBOLIC_RULE_REQUIRED',180);const rule=ruleById(registry,ruleId,'SYMBOLIC_METHOD');const group=text(raw?.group,'REL_W6_SYMBOLIC_GROUP_REQUIRED',80).toUpperCase();groupAllowed(rule,group);
    const claimRefs=uniqStrings(raw?.claimRefs,'REL_W6_SYMBOLIC_CLAIM_REF_INVALID',180);if(claimRefs.length<(rule.minimumClaims||2))fail('REL_W6_SYMBOLIC_MINIMUM_CLAIMS_NOT_MET',409);
    const claims=claimRefs.map(ref=>{const x=claimById.get(ref);if(!x)fail('REL_W6_SYMBOLIC_CLAIM_REF_UNKNOWN',404,{ref});return x});const methods=new Set(claims.map(x=>x.methodId));if(methods.size<(rule.minimumDistinctMethods||2))fail('REL_W6_SYMBOLIC_MINIMUM_DISTINCT_METHODS_NOT_MET',409,{methods:[...methods]});
    const topicId=text(raw?.topicId,'REL_W6_TOPIC_REQUIRED',180);const statement=text(raw?.statement,'REL_W6_STATEMENT_REQUIRED',900);
    items.push(await makeItem({group,topicId,statement,ruleId,laneRefs:{symbolicClaimRefs:claimRefs,profileEvidenceRefs:[],realityComparisonRefs:[]},methods,sourceClasses:new Set(['SYMBOLIC_INTERPRETATION']),governance:{automaticSemanticMatching:false,minimumTwoCustomerPublishableMethodRefs:true,sharedThemeDoesNotProveAnyMethod:true,trueDisagreementMayRemainNonConvergence:true}}));
  }
  // PROFILE_ASSESSMENT_LANE: consumes PRF-W9 pair evidence only after PRF-W12 production admission.
  for(const raw of list(profileRequests)){
    const ruleId=text(raw?.ruleId,'REL_W6_PROFILE_RULE_REQUIRED',180);const rule=ruleById(registry,ruleId,'PROFILE_EVIDENCE');const group=text(raw?.group,'REL_W6_PROFILE_GROUP_REQUIRED',80).toUpperCase();groupAllowed(rule,group);
    const refs=uniqStrings(raw?.profileEvidenceRefs,'REL_W6_PROFILE_EVIDENCE_REF_INVALID',180);if(refs.length<(rule.minimumEvidence||1))fail('REL_W6_PROFILE_MINIMUM_EVIDENCE_NOT_MET',409);const evidence=refs.map(ref=>{const x=profileEvidenceById.get(ref);if(!x)fail('REL_W6_PROFILE_EVIDENCE_REF_UNKNOWN',404,{ref});return x});
    const sourceClasses=new Set(evidence.map(x=>x.sourceClass));const topicId=text(raw?.topicId,'REL_W6_TOPIC_REQUIRED',180);const statement=text(raw?.statement,'REL_W6_STATEMENT_REQUIRED',900);
    items.push(await makeItem({group,topicId,statement,ruleId,laneRefs:{symbolicClaimRefs:[],profileEvidenceRefs:refs,realityComparisonRefs:[]},methods:new Set(),sourceClasses,governance:{profileOnlyThemeRemainsProfileEvidence:true,profileEvidenceUpgradedIntoSymbolicConvergence:false,prfW12ProductionAdmissionRequired:true}}));
  }
  // Mixed source synthesis may expose tension/open questions only; it never creates consensus truth.
  for(const raw of list(mixedSourceRequests)){
    const ruleId=text(raw?.ruleId,'REL_W6_MIXED_RULE_REQUIRED',180);const rule=ruleById(registry,ruleId,'MIXED_SOURCE');const group=text(raw?.group,'REL_W6_MIXED_GROUP_REQUIRED',80).toUpperCase();groupAllowed(rule,group);
    const claimRefs=uniqStrings(raw?.claimRefs,'REL_W6_MIXED_CLAIM_REF_INVALID',180);const profileRefs=uniqStrings(raw?.profileEvidenceRefs,'REL_W6_MIXED_PROFILE_REF_INVALID',180);if(!claimRefs.length||!profileRefs.length)fail('REL_W6_MIXED_SOURCE_BOTH_LANES_REQUIRED',409);
    const claims=claimRefs.map(ref=>{const x=claimById.get(ref);if(!x)fail('REL_W6_MIXED_CLAIM_REF_UNKNOWN',404,{ref});return x});const evidence=profileRefs.map(ref=>{const x=profileEvidenceById.get(ref);if(!x)fail('REL_W6_MIXED_PROFILE_REF_UNKNOWN',404,{ref});return x});const methods=new Set(claims.map(x=>x.methodId));const sourceClasses=new Set(['SYMBOLIC_INTERPRETATION',...evidence.map(x=>x.sourceClass)]);if(sourceClasses.size<2)fail('REL_W6_MIXED_DISTINCT_SOURCE_CLASSES_REQUIRED',409);
    const topicId=text(raw?.topicId,'REL_W6_TOPIC_REQUIRED',180);const statement=text(raw?.statement,'REL_W6_STATEMENT_REQUIRED',900);
    items.push(await makeItem({group,topicId,statement,ruleId,laneRefs:{symbolicClaimRefs:claimRefs,profileEvidenceRefs:profileRefs,realityComparisonRefs:[]},methods,sourceClasses,governance:{mixedSourceRuleExplicit:true,sourceConvergenceIsTruth:false,symbolicScientificValidationCreated:false,profileScientificValidationOfSymbolicMethod:false}}));
  }
  // CURRENT_REALITY_LANE: state translation is mechanical and customer-controlled, not a method proof operation.
  const realityRule=ruleById(registry,'REL-W6-XR-CURRENT-REALITY-v1','CURRENT_REALITY');
  for(const c of comparisonById.values()){
    const entry=claimById.get(c.relationshipClaimId);let group='OPEN',qualifier=null,verb='leaves open';
    if(c.responseState==='CURRENTLY_RESONANT'){group='REALITY_SUPPORTED';verb='currently supports';qualifier='CURRENTLY_RESONANT';}
    else if(c.responseState==='PARTIALLY_RESONANT'){group='REALITY_SUPPORTED';verb='partially supports';qualifier='PARTIALLY_RESONANT';}
    else if(c.responseState==='CURRENTLY_NOT_RESONANT'){group='REALITY_CONTRADICTED';verb='currently contradicts';qualifier='CURRENTLY_NOT_RESONANT';}
    groupAllowed(realityRule,group);const topicId=`METHOD:${entry.methodId}:${entry.semanticOwnerId}`;const statement=`Customer Current Reality ${verb} the referenced ${entry.methodId} relationship claim at this time; this does not prove or disprove the method.`;
    items.push(await makeItem({group,topicId,statement,ruleId:realityRule.ruleId,laneRefs:{symbolicClaimRefs:[entry.relationshipClaimId],profileEvidenceRefs:[],realityComparisonRefs:[c.comparisonId]},methods:new Set([entry.methodId]),sourceClasses:new Set(['SYMBOLIC_INTERPRETATION','CURRENT_REALITY_OBSERVATION']),qualifier,governance:{customerControlledReality:true,realitySupportsMethodProof:false,realityContradictionDisprovesMethod:false,currentRealityRewritesMethod:false}}));
  }
  const groupIndex=Object.fromEntries(REL_W6_GROUPS.map(group=>[group,items.filter(x=>x.group===group).map(x=>x.synthesisItemId)]));
  const methodsRepresented=[...new Set([...claimById.values()].map(x=>x.methodId))].sort();const profileSourceClasses=[...new Set([...profileEvidenceById.values()].map(x=>x.sourceClass))].sort();
  const laneInventory=freeze({
    SYMBOLIC_METHOD_LANE:freeze({methods:freeze(methodsRepresented),claimRefs:freeze([...claimById.keys()]),sourceClasses:freeze(['SYMBOLIC_INTERPRETATION'])}),
    PROFILE_ASSESSMENT_LANE:freeze({enabled:profileEvidenceById.size>0,signalRefs:freeze([...signalById.keys()]),profileEvidenceRefs:freeze([...profileEvidenceById.keys()]),sourceClasses:freeze(profileSourceClasses),prfW12ProductionAdmitted:profileEvidenceById.size>0?true:null}),
    CURRENT_REALITY_LANE:freeze({observationRefs:freeze(list(relationshipCurrentRealityIr.observations).map(x=>x.relationshipObservationId)),comparisonRefs:freeze([...comparisonById.keys()]),sourceClasses:freeze(['CURRENT_REALITY_OBSERVATION'])})
  });
  const core={relationshipIntentId:intent.relationshipIntentId,laneInventory,items:items.map(x=>x.semanticDigest),methodContext:methodCtx};const semanticDigest=await sha256(core);
  return freeze({schemaVersion:CROSS_METHOD_RELATIONSHIP_IR_SCHEMA,relationshipIntentId:intent.relationshipIntentId,lanes:laneInventory,items:freeze(items),groupIndex:freeze(groupIndex),methodContext:methodCtx,governance:freeze({threeLanesPreserved:true,noLaneSilentlyValidatesAnother:true,sharedSymbolicThemeRequiresTwoMethods:true,profileOnlyThemeRemainsProfileEvidence:true,mixedSourceSynthesisPreservesSourceClasses:true,trueDisagreementRemainsNonConvergence:true,automaticSemanticMatching:false,methodVoting:false,compatibilityScoreCreated:false,partnerHiddenStateInferred:false,relationshipOutcomeGuaranteed:false,currentRealityMayContextualize:true,currentRealityMayContradict:true,currentRealityProvesSymbolicMethod:false,customerPublicationAllowed:false,relW7NarrativeBriefRequiredBeforeNarrativeUse:true,relW8RequiredForPaidRelationshipPublication:true}),semanticDigest});
}

export default Object.freeze({buildCrossEvidenceRelationshipSynthesis});
