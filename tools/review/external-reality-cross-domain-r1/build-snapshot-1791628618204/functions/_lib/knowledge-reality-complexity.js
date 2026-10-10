const REQUEST_SCHEMA='PHI-OS-KAP-REALITY-COMPLEXITY-REQUEST-v1.0.0';
const RESPONSE_SCHEMA='PHI-OS-KAP-REALITY-COMPLEXITY-RESPONSE-v1.0.0';
export const KAP_COMPLEXITY_SIGNAL_CODES=Object.freeze([
'MULTIPLE_PEOPLE','MULTIPLE_ROLES','MULTIPLE_ORGANIZATIONS','MULTIPLE_RELATIONSHIPS','MULTIPLE_GOALS','MULTIPLE_CONSTRAINTS','GOAL_CONFLICT','LONG_TIMELINE','REPEAT_PATTERN','FEEDBACK_LOOPS','UNCLEAR_CAUSAL_STRUCTURE','MULTIPLE_INTERVENTIONS','HIGH_CONSEQUENCE_DECISIONS','PERSISTENT_UNRESOLVED_STATE']);
export const KAP_COMPLEXITY_DIMENSIONS=Object.freeze(['entityCount','relationshipCount','constraintCount','timeDepth','goalConflict','uncertainty','dependency','repetition','decisionConsequence','feedbackLoopPresence']);
const clean=v=>String(v??'').normalize('NFKC').trim().replace(/\s+/g,' ');
const a=v=>Array.isArray(v)?v:[];
const n=v=>Number.isFinite(Number(v))?Math.max(0,Math.trunc(Number(v))):0;
const uniq=v=>[...new Set(a(v).map(clean).filter(Boolean))];
const count=(o,k,ak)=>n(o?.[k])||uniq(o?.[ak]).length;
const has=(t,re1,re2)=>re1.test(t)||re2.test(t);
function corpus({question='',guidedContext={},structuredContext={}}={}){return [question,guidedContext?.originalQuestion,...a(guidedContext?.temporaryObservations),...a(guidedContext?.clarifyingAnswers).map(x=>x?.response),...a(structuredContext?.notes)].map(clean).filter(Boolean).join(' ');}
function rec(code,detected,basis){return Object.freeze({code,detected,basis:Object.freeze([...new Set(basis)]),authorityClass:'ROUTING_SIGNAL_NOT_REALITY_TRUTH'});}
export function detectComplexitySignals({question='',guidedContext={},structuredContext={}}={}){
 const s=structuredContext||{},g=guidedContext?.escalationSignals||{},t=corpus({question,guidedContext,structuredContext:s});
 const c={people:count(s,'peopleCount','people'),roles:count(s,'roleCount','roles'),organizations:count(s,'organizationCount','organizations'),relationships:count(s,'relationshipCount','relationships'),goals:count(s,'goalCount','goals'),constraints:count(s,'constraintCount','constraints'),interventions:count(s,'interventionCount','interventions')};
 const tx={
  people:has(t,/(多人|多个人|夫妻|家庭成员|团队成员)/i,/\b(multiple people|several people|family members|team members|spouse)\b/i),
  roles:has(t,/(多个角色|角色冲突)/i,/\b(multiple roles|role conflict)\b/i),
  orgs:has(t,/(多家公司|多个组织|组织之间)/i,/\b(multiple organizations|several companies|across organizations)\b/i),
  rels:has(t,/(多个关系|多段关系|关系之间)/i,/\b(multiple relationships|relationship network)\b/i),
  goals:has(t,/(多个目标|几个目标|同时想要)/i,/\b(multiple goals|several goals|competing goals)\b/i),
  constraints:has(t,/(多个限制|多个约束|很多限制)/i,/\b(multiple constraints|several constraints)\b/i),
  conflict:has(t,/(目标冲突|两难)/i,/\b(goal conflict|conflicting goals|dilemma|trade[- ]?off)\b/i),
  timeline:has(t,/(长期|多年|几个月以来|一直以来)/i,/\b(long[- ]term|for years|for months|over time)\b/i),
  repeat:has(t,/(反复|重复发生|一再发生)/i,/\b(repeat(?:ing)? pattern|recurring|keeps happening)\b/i),
  loop:has(t,/(反馈循环|恶性循环)/i,/\b(feedback loop|vicious cycle|reinforcing loop)\b/i),
  causal:has(t,/(原因不清|因果不清|不知道原因)/i,/\b(unclear cause|causal structure unclear|don't know why)\b/i),
  interventions:has(t,/(多个方案|多种干预|试过很多方法)/i,/\b(multiple interventions|tried many things|multiple actions)\b/i),
  consequence:has(t,/(重大决定|高风险|严重后果|离婚|辞职|重大投资)/i,/\b(high consequence|high stakes|major decision|divorce|quit my job|major investment)\b/i),
  persistent:has(t,/(长期未解决|持续未解决|一直解决不了)/i,/\b(persistent unresolved|still unresolved|unresolved for)\b/i)
 };
 const f={
  MULTIPLE_PEOPLE:c.people>1||s.multiplePeople===true||tx.people,
  MULTIPLE_ROLES:c.roles>1||s.multipleRoles===true||tx.roles,
  MULTIPLE_ORGANIZATIONS:c.organizations>1||s.multipleOrganizations===true||tx.orgs,
  MULTIPLE_RELATIONSHIPS:c.relationships>1||s.multipleRelationships===true||tx.rels,
  MULTIPLE_GOALS:c.goals>1||s.multipleGoals===true||tx.goals,
  MULTIPLE_CONSTRAINTS:c.constraints>1||s.multipleConstraints===true||tx.constraints,
  GOAL_CONFLICT:s.goalConflict===true||tx.conflict,
  LONG_TIMELINE:s.longTimeline===true||g.persistent===true||tx.timeline,
  REPEAT_PATTERN:s.repeatPattern===true||tx.repeat,
  FEEDBACK_LOOPS:s.feedbackLoopPresence===true||s.feedbackLoops===true||tx.loop,
  UNCLEAR_CAUSAL_STRUCTURE:s.unclearCausalStructure===true||(g.multiFactor===true&&g.caseSpecific===true)||tx.causal,
  MULTIPLE_INTERVENTIONS:c.interventions>1||s.multipleInterventions===true||tx.interventions,
  HIGH_CONSEQUENCE_DECISIONS:s.highConsequenceDecision===true||s.highConsequenceDecisions===true||tx.consequence,
  PERSISTENT_UNRESOLVED_STATE:s.persistentUnresolvedState===true||(g.persistent===true&&g.caseSpecific===true)||tx.persistent
 };
 const records=KAP_COMPLEXITY_SIGNAL_CODES.map(code=>rec(code,f[code]===true,[f[code]===true?'EXPLICIT_OR_CONSERVATIVE_OBSERVATION':'NO_SIGNAL']));
 return Object.freeze({schemaVersion:'PHI-OS-KAP-W23-COMPLEXITY-SIGNALS-v1.0.0',status:'EVALUATED',signals:Object.freeze(f),records:Object.freeze(records),activeSignalCodes:Object.freeze(records.filter(x=>x.detected).map(x=>x.code)),activeSignalCount:records.filter(x=>x.detected).length,observedCounts:Object.freeze(c),governance:Object.freeze({routingSignalOnly:true,realityTruthCreated:false,canonicalCaseCreated:false,persistenceCreated:false,diagnosisCreated:false})});
}
const scoreCount=x=>x<=1?0:x===2?1:x<=4?2:3;
const l3=x=>Math.max(0,Math.min(3,n(x)));
export function calculateComplexityScore({signalEvaluation,structuredContext={},guidedContext={}}={}){
 const s=signalEvaluation?.signals||{},c=signalEvaluation?.observedCounts||{},unknown=a(guidedContext?.unknownMechanisms).length;
 const d={entityCount:Math.max(scoreCount((c.people||0)+(c.organizations||0)),scoreCount(c.roles||0)),relationshipCount:scoreCount(c.relationships||0),constraintCount:scoreCount(c.constraints||0),timeDepth:s.LONG_TIMELINE?3:(s.PERSISTENT_UNRESOLVED_STATE||s.REPEAT_PATTERN?2:l3(structuredContext.timeDepth)),goalConflict:s.GOAL_CONFLICT?3:(s.MULTIPLE_GOALS?1:0),uncertainty:s.UNCLEAR_CAUSAL_STRUCTURE?3:Math.max(l3(structuredContext.uncertainty),unknown>=3?2:unknown?1:0),dependency:Math.max(l3(structuredContext.dependency),s.MULTIPLE_RELATIONSHIPS||s.MULTIPLE_ORGANIZATIONS?2:s.MULTIPLE_PEOPLE?1:0),repetition:s.REPEAT_PATTERN?3:(s.PERSISTENT_UNRESOLVED_STATE?2:l3(structuredContext.repetition)),decisionConsequence:s.HIGH_CONSEQUENCE_DECISIONS?3:l3(structuredContext.decisionConsequence),feedbackLoopPresence:s.FEEDBACK_LOOPS?3:0};
 const total=Object.values(d).reduce((x,y)=>x+y,0),classification=total<=8?'LOW':total<=17?'MEDIUM':'HIGH';
 return Object.freeze({schemaVersion:'PHI-OS-KAP-W25-COMPLEXITY-SCORE-v1.0.0',status:'SCORED',classification,totalScore:total,maximumScore:30,dimensions:Object.freeze(d),thresholds:Object.freeze({LOW:[0,8],MEDIUM:[9,17],HIGH:[18,30]}),governance:Object.freeze({routingAidOnly:true,realityTruth:false,scoreAloneMayRequireRealityModel:false,scoreAloneMayActivateRealityJourney:false})});
}
export function testRealityModelRequirement({signalEvaluation,complexityScore,w22StopCondition=null}={}){
 const s=signalEvaluation?.signals||{};
 const continuity=!!(s.PERSISTENT_UNRESOLVED_STATE||s.LONG_TIMELINE||s.REPEAT_PATTERN||s.FEEDBACK_LOOPS);
 const relational=!!(s.MULTIPLE_PEOPLE||s.MULTIPLE_ROLES||s.MULTIPLE_ORGANIZATIONS||s.MULTIPLE_RELATIONSHIPS);
 const coordination=!!(s.MULTIPLE_GOALS||s.MULTIPLE_CONSTRAINTS||s.GOAL_CONFLICT||s.MULTIPLE_INTERVENTIONS);
 const causal=!!(s.UNCLEAR_CAUSAL_STRUCTURE||s.FEEDBACK_LOOPS),consequence=!!s.HIGH_CONSEQUENCE_DECISIONS;
 const yes=continuity&&causal&&((relational&&coordination)||(relational&&consequence)||(coordination&&consequence))&&(signalEvaluation?.activeSignalCount||0)>=4;
 const requirement=yes?'YES':'NO';
 const reasonCodes=[continuity?'CONTINUITY_TRACKING_NEEDED':null,relational?'RELATIONAL_STATE_INTERDEPENDENCE':null,coordination?'COORDINATION_STRUCTURE_PRESENT':null,causal?'CAUSAL_OR_FEEDBACK_TRACKING_NEEDED':null,consequence?'HIGH_CONSEQUENCE_CONTEXT':null,yes?'PERSISTENT_REALITY_MODEL_REQUIRED_FOR_RELIABLE_HANDLING':'PERSISTENT_REALITY_MODEL_NOT_REQUIRED_BY_CURRENT_STRUCTURE',w22StopCondition?.status==='REALITY_MODEL_REQUIRED'?'W22_CANDIDATE_REQUIRES_W24_CONFIRMATION':null].filter(Boolean);
 return Object.freeze({schemaVersion:'PHI-OS-KAP-W24-REALITY-MODEL-REQUIREMENT-v1.0.0',status:'EVALUATED',requirement,route:yes?'REALITY_JOURNEY_CANDIDATE':'KEEP_ASK_OR_GUIDED_READING',reasonCodes:Object.freeze(reasonCodes),structuralTests:Object.freeze({continuity,relational,coordination,causal,consequence}),scoreContext:Object.freeze({classification:complexityScore?.classification||'LOW',totalScore:complexityScore?.totalScore||0,decisive:false}),w22Candidate:Object.freeze({status:w22StopCondition?.status||null,authoritativeFinalRoute:false}),handoff:Object.freeze({realityJourneyEligible:yes,automaticRealityJourney:false,requiresExplicitEscalationConsent:yes}),governance:Object.freeze({routingDecisionOnly:true,realityModelCreated:false,persistentCaseCreated:false,scoreIsNotRealityTruth:true})});
}
export function evaluateRealityComplexityGate({question='',guidedContext={},structuredContext={},w22StopCondition=null}={}){
 const complexitySignals=detectComplexitySignals({question,guidedContext,structuredContext});
 const complexityScore=calculateComplexityScore({signalEvaluation:complexitySignals,structuredContext,guidedContext});
 const realityModelRequirement=testRealityModelRequirement({signalEvaluation:complexitySignals,complexityScore,w22StopCondition});
 return Object.freeze({schemaVersion:RESPONSE_SCHEMA,capability:'REALITY_COMPLEXITY_GATE',status:'EVALUATED',complexitySignals,complexityScore,realityModelRequirement,route:realityModelRequirement.route,governance:Object.freeze({scoreRoutingAidOnly:true,scoreCreatesRealityTruth:false,automaticRealityJourney:false,realityJourneyRequiresRequirementYes:true,explicitEscalationConsentRequired:realityModelRequirement.requirement==='YES',guidedReadingMayContinueWhenRequirementNo:true})});
}
export function normalizeRealityComplexityRequest(body={}){
 if(body?.schemaVersion&&body.schemaVersion!==REQUEST_SCHEMA)throw Object.assign(new Error('KAP_COMPLEXITY_REQUEST_SCHEMA_INVALID'),{code:'KAP_COMPLEXITY_REQUEST_SCHEMA_INVALID'});
 const question=clean(body.question).slice(0,500),guidedContext=body?.guidedContext&&typeof body.guidedContext==='object'&&!Array.isArray(body.guidedContext)?body.guidedContext:{},structuredContext=body?.structuredContext&&typeof body.structuredContext==='object'&&!Array.isArray(body.structuredContext)?body.structuredContext:{},w22StopCondition=body?.w22StopCondition&&typeof body.w22StopCondition==='object'&&!Array.isArray(body.w22StopCondition)?body.w22StopCondition:null;
 if(!question&&!Object.keys(guidedContext).length&&!Object.keys(structuredContext).length)throw Object.assign(new Error('KAP_COMPLEXITY_INPUT_REQUIRED'),{code:'KAP_COMPLEXITY_INPUT_REQUIRED'});
 return Object.freeze({schemaVersion:REQUEST_SCHEMA,question,guidedContext,structuredContext,w22StopCondition});
}
export const KAP_REALITY_COMPLEXITY_CONSTANTS=Object.freeze({requestSchema:REQUEST_SCHEMA,responseSchema:RESPONSE_SCHEMA,signalCodes:KAP_COMPLEXITY_SIGNAL_CODES,dimensions:KAP_COMPLEXITY_DIMENSIONS});
