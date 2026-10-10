import {NAV_BATCH_06_CONTRACT as contracts} from './nav-accepted-batch-06-contract.js';
import {evaluateNavigationContracts} from './nav-accepted-batch-01-runtime.js';
import {evaluateAcceptedNavigationThrough25,projectAcceptedNavigationThrough25,projectAcceptedNavigationAcademyThrough25} from './nav-accepted-batch-05-runtime.js';
const suff=['INSUFFICIENT','PARTIALLY_SUFFICIENT','SUFFICIENT_FOR_INFORMATION_GATHERING','SUFFICIENT_FOR_REVERSIBLE_ACTION','SUFFICIENT_FOR_BOUNDED_ACTION','SUFFICIENT_FOR_HIGH_IMPACT_REVIEW','DECISION_SUFFICIENT','SUFFICIENCY_BLOCKED_BY_AUTHORITY','SUFFICIENCY_BLOCKED_BY_CRITICAL_UNKNOWN'];
const thresholds=['T1_LOW','T2_MODERATE','T3_HIGH','T4_VERY_HIGH','T5_FORMAL_OR_PROFESSIONAL_GATE'];
const authority=['SOLE_AUTHORITY','SHARED_AUTHORITY','CONSENT_REQUIRED','CONSULTATION_REQUIRED','AFFECTED_BUT_NOT_DECISION_OWNER','REPRESENTATIVE_AUTHORITY','PROFESSIONAL_AUTHORITY','INSTITUTIONAL_AUTHORITY','AUTHORITY_UNRESOLVED'];
const actions=['ACTION_NOT_READY','ACTION_READY','ACTION_ACTIVE','ACTION_ACTIVE_WITH_MONITORING','ACTION_PAUSED','ACTION_ADJUSTMENT_REQUIRED','ACTION_SCALE_REDUCTION_REQUIRED','EXIT_TRIGGER_REACHED','ACTION_COMPLETED','ACTION_OUTCOME_PENDING_REVIEW'];
const outcomes=['OUTCOME_NOT_YET_CAPTURED','OUTCOME_CAPTURED','MIXED_OUTCOME','ASSUMPTION_INVALIDATED','CURRENT_POSITION_UPDATED','CONTINUATION_REQUALIFIED','ACTION_ADJUSTMENT_REQUIRED','EXIT_RECOVERY_REQUIRED','DECISION_REOPEN_REQUIRED','NEW_DECISION_OBJECT_REQUIRED','CYCLE_READY'];
const material=x=>x&&x.role!=='FUTURE_ASSUMPTION'&&!['SYMBOLIC_READING','REPORT_INTERPRETATION','PROFILE_EVIDENCE'].includes(x.sourceClass);
function validate(id,a,s){const m=a.model,r=[];if(!m||m.decisionObjectId!==s.decision.id)return ['MODEL_DECISION_SCOPE_REQUIRED'];const refs=m.sourceRefs;if(!Array.isArray(refs)||!refs.length||refs.some(ref=>!a.items?.some(x=>x.sourceRef===ref&&material(x))))r.push('REALITY_SOURCE_REQUIRED');
 const source=x=>x?.sourceRef&&refs?.includes(x.sourceRef),human=x=>x?.explicitConfirmation===true&&x.confirmedBy===s.ownerId&&x.decisionVersion===s.decisionVersion&&x.confirmationRef;
 for(const k of ['automaticExecution','automaticExpansion','symbolicExecution','confidenceClosesUnknown','majorityOverridesRights','hiddenThirdPartyPreference','outcomeGuarantee'])if(m[k]===true)r.push('NO_AUTOMATIC_AUTHORITY_OR_CERTAINTY');
 if(id==='NAV-26'){
  if(!suff.includes(m.state))r.push('SUFFICIENCY_STATE_UNDEFINED');
  for(const k of ['knowns','materialUnknowns','criticalUnknowns','nonBlockingUnknowns','remainingRequirements'])if(!Array.isArray(m[k]))r.push('SUFFICIENCY_KNOWNS_UNKNOWNS_SEPARATE');
  for(const k of ['minimumStateStatus','reversibilityStatus','scenarioStatus','exitRecoveryStatus','authorityStatus','permittedActionScale'])if(!m[k])r.push('SUFFICIENCY_DIMENSION_REQUIRED');
  if(['INSUFFICIENT','PARTIALLY_SUFFICIENT','SUFFICIENCY_BLOCKED_BY_AUTHORITY','SUFFICIENCY_BLOCKED_BY_CRITICAL_UNKNOWN'].includes(m.state)||m.criticalUnknowns?.length||m.remainingRequirements?.length)r.push('SUFFICIENCY_NOT_ACTION_ADMITTED');
  if(m.authorityStatus!=='RESOLVED'||m.minimumStateStatus!=='PROTECTED'||m.scenarioStatus!=='DOWNSIDE_TESTED')r.push('AUTHORITY_MINIMUM_DOWNSIDE_UNRESOLVED');
  if(m.highImpact===true&&m.exitRecoveryStatus!=='READY')r.push('HIGH_IMPACT_RECOVERY_REQUIRED');
  if(m.fromDataVolume===true||m.fromMethodAgreement===true||m.urgencyLowersStandard===true)r.push('NO_DATA_VOLUME_METHOD_AGREEMENT_OR_URGENCY_SUFFICIENCY');
 }
 if(id==='NAV-27'){
  if(!thresholds.includes(m.requiredThreshold)||!m.actionId||!m.actionScale||!m.drivers)r.push('ACTION_THRESHOLD_DRIVERS_REQUIRED');
  for(const k of ['impactMagnitude','reversibility','minimumStateExposure','recoveryDifficulty','timeHorizon','capacityConsumption','authorityRequirement'])if(!m.drivers?.[k])r.push('IMPACT_DIMENSION_REQUIRED');
  if(!Array.isArray(m.drivers?.affectedParties)||m.thresholdMet!==true||m.remainingRequirements?.length)r.push('THRESHOLD_NOT_MET');
  if(m.currentSufficiencyState!==s.assessments['NAV-26'].model.state||m.singleScore!==undefined||m.riskPreferenceLowersAuthority===true||m.reversibleMeansLowImpact===true)r.push('THRESHOLD_NOT_SCORE_CONFIDENCE_OR_RISK_PREFERENCE');
  if(!Array.isArray(m.remainingRequirements))r.push('REMAINING_REQUIREMENTS_REQUIRED');
 }
 if(id==='NAV-28'){
  if(!Array.isArray(m.components)||!m.components.length||!Array.isArray(m.authorityConflicts)||!Array.isArray(m.unresolvedConsent))r.push('SHARED_COMPONENTS_AND_CONFLICTS_REQUIRED');
  if(m.authorityConflicts?.length||m.unresolvedConsent?.length)r.push('SHARED_AUTHORITY_UNRESOLVED');
  for(const c of m.components||[]){if(!c.componentId||!c.description||!authority.includes(c.authorityState)||!Array.isArray(c.decisionOwners)||c.decisionOwners.includes('AI')||!c.authoritySources?.length||c.authoritySources.some(ref=>!refs.includes(ref)))r.push('COMPONENT_AUTHORITY_SOURCE_REQUIRED');
   if(c.authorityState==='AUTHORITY_UNRESOLVED')r.push('COMPONENT_AUTHORITY_UNRESOLVED');
   for(const who of c.consentRequiredFrom||[])if(!c.consents?.some(x=>x.personId===who&&x.explicitConfirmation===true&&x.confirmedBy===who&&x.decisionVersion===s.decisionVersion&&x.componentId===c.componentId&&x.revoked!==true&&source(x)))r.push('THIRD_PARTY_CONSENT_NOT_USER_ASSERTION');
   if(c.authorityState==='REPRESENTATIVE_AUTHORITY'&&!c.representativeAuthorityRef)r.push('REPRESENTATIVE_AUTHORITY_UNVERIFIED');
   if(c.authorityState==='AFFECTED_BUT_NOT_DECISION_OWNER'&&c.decisionOwners.length)r.push('AFFECTED_NOT_AUTOMATIC_OWNER');
  }
 }
 if(id==='NAV-29'){
  if(!actions.includes(m.state)||m.state==='ACTION_NOT_READY'||!m.actionId||m.actionId!==s.assessments['NAV-27'].model.actionId||!m.actionDescription||!m.actionScale||!human(m))r.push('ACTION_SCOPE_HUMAN_CONFIRMATION_REQUIRED');
  if(m.actionScale!==s.assessments['NAV-26'].model.permittedActionScale||m.actionScale!==s.assessments['NAV-27'].model.actionScale)r.push('ACTION_SCALE_EXCEEDS_ADMISSION');
  for(const k of ['scope','resourceLimits','authorityRequirements','observationSet','reviewPoints','continueTriggers','adjustTriggers','pauseTriggers','exitTriggers','outcomes'])if(!Array.isArray(m[k]))r.push('ACTION_BOUNDARIES_CAPTURE_REQUIRED');
  if(!m.scope?.length||!m.resourceLimits?.length||!m.observationSet?.length||!m.reviewPoints?.length||!m.exitTriggers?.length)r.push('ACTION_UNBOUNDED_OR_CAPTURE_UNDEFINED');
  if(m.changedOriginalThreshold===true||m.earlySuccessCancelsExit===true)r.push('ORIGINAL_THRESHOLD_AND_EXIT_PRESERVED');
 }
 if(id==='NAV-30'){
  if(!outcomes.includes(m.state)||m.state==='OUTCOME_NOT_YET_CAPTURED'||m.actionRuntimeId!==s.assessments['NAV-29'].model.actionRuntimeId)r.push('ACTUAL_ACTION_OUTCOME_REQUIRED');
  for(const k of ['observedOutcomes','expectedVsActual','newResources','newConstraints','newResponsibilities','newCosts','newOptionSpace','newUnknowns','invalidatedAssumptions','supportedAssumptions','minimumStateEffects','nextCurrentPositionChanges','reopenTriggers'])if(!Array.isArray(m[k]))r.push('OUTCOME_DIMENSIONS_SEPARATE_REQUIRED');
  if(!m.observedOutcomes?.length||!m.minimumStateEffects?.length)r.push('ACTUAL_OUTCOME_MINIMUM_EFFECT_REQUIRED');
  for(const o of m.observedOutcomes||[])if(!source(o)||!o.observedAt||!Number.isFinite(Date.parse(o.observedAt))||!s.assessments['NAV-29'].model.outcomes.some(x=>x.outcomeId===o.outcomeId&&x.sourceRef===o.sourceRef))r.push('OUTCOME_NOT_CAPTURED_IN_ACTION');
  if(m.attributionCertain===true&&!m.attributionEvidenceRef||m.hindsightRewritesOriginal===true||m.simpleSuccessFailure===true)r.push('NO_UNSUPPORTED_ATTRIBUTION_HINDSIGHT_OR_BINARY_OUTCOME');
 }return r;
}
export function evaluateAcceptedNavigationThrough30(snapshot,options={}){const prior=evaluateAcceptedNavigationThrough25(snapshot,options),modules=evaluateNavigationContracts(snapshot,options,contracts,prior.modules,validate);return {...prior,schemaVersion:'NAV-ACCEPTED-THROUGH-30-v1',modules,acceptedThrough:'NAV-30',nextModule:null,nextModuleState:null,canonicalModulesPending:false,actionAdvancementAllowed:false,finalAction:null,decisionSufficiency:modules[25]?.canContinue?snapshot.assessments['NAV-26'].model.state:null,cycleReady:modules.every(m=>m.canContinue)&&snapshot.assessments['NAV-30'].model.state==='CYCLE_READY',persisted:false};}
export function projectAcceptedNavigationThrough30(runtime,{locale='zh'}={}){const prior=projectAcceptedNavigationThrough25({...runtime,modules:runtime.modules.slice(0,25)},{locale});return {...prior,remainingModulesPending:false,sections:[...prior.sections,...runtime.modules.slice(25).map((m,i)=>({title:locale.startsWith('zh')?contracts[i].titleZh:contracts[i].titleEn,needsReview:!m.canContinue,items:m.items.map(x=>({description:x.description||x.claim||'',value:x.value??null,evidenceState:x.evidenceState,asOf:x.asOf})),actions:locale.startsWith('zh')?['核对现实与权限','确认行动范围','记录真实结果']:['Review reality and authority','Confirm action scope','Record actual outcomes']}))]};}
export function projectAcceptedNavigationAcademyThrough30(){const prior=projectAcceptedNavigationAcademyThrough25();return {...prior,modules:[...prior.modules,...contracts.map(c=>({moduleId:c.moduleId,titleZh:c.titleZh,titleEn:c.titleEn,contractVersion:c.version}))],lessons:[...prior.lessons,...['充分不等于确定，下一步范围必须明确。','影响与可逆性共同约束门槛。','共享权威需要逐项来源和同意。','确认的行动保留范围、停止与复查条件。','实际结果成为下一轮条件，不能伪造历史。'].map((theme,i)=>({moduleId:`NAV-${i+26}`,theme}))]};}
