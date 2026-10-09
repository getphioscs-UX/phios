import {NAV_BATCH_05_CONTRACT as contracts} from './nav-accepted-batch-05-contract.js';
import {evaluateNavigationContracts} from './nav-accepted-batch-01-runtime.js';
import {evaluateAcceptedNavigationThrough20,projectAcceptedNavigationThrough20,projectAcceptedNavigationAcademyThrough20} from './nav-accepted-batch-04-runtime.js';
const types=[['TRADEABLE','TRADEABLE_WITH_LIMIT','THRESHOLD_BOUND','NON_EXCHANGEABLE','NON_EXCHANGEABILITY_UNCONFIRMED','CONDITION_NOT_APPLICABLE'],['HARD_MINIMUM','FUNCTIONAL_MINIMUM','TEMPORARY_MINIMUM','RECOVERY_MINIMUM','PREFERRED_MINIMUM','MINIMUM_UNCONFIRMED'],['PLAUSIBLE_SCENARIO','STRESS_SCENARIO','OPPORTUNITY_SCENARIO','RECOVERY_SCENARIO','CONTINUATION_SCENARIO'],['ABOVE_MINIMUM','NEAR_MINIMUM','BELOW_MINIMUM','UNKNOWN'],['EXIT_ROUTE_READY','EXIT_ROUTE_AVAILABLE_WITH_COST','EXIT_ROUTE_CONDITIONALLY_AVAILABLE','EXIT_ROUTE_UNKNOWN','RECOVERY_ROUTE_READY','RECOVERY_ROUTE_PARTIAL','RECOVERY_ROUTE_UNDEFINED','RECOVERY_CAPACITY_INSUFFICIENT']];
const authorities=['USER_CONFIRMED_NON_NEGOTIABLE','MATERIAL_REQUIREMENT','LEGAL_REQUIREMENT','RESPONSIBILITY_REQUIREMENT','CONSENT_REQUIREMENT','PROFESSIONAL_REQUIREMENT','SHARED_DECISION_REQUIREMENT'];
function validate(id,a,s){const m=a.model,r=[],index=Number(id.slice(4))-21;if(!m||!types[index].includes(m.type))return ['MODULE_MODEL_UNDEFINED'];
 const refs=m.sourceRefs;if(!Array.isArray(refs)||!refs.length||refs.some(ref=>!a.items?.some(x=>x.sourceRef===ref&&x.role!=='FUTURE_ASSUMPTION'&&!['SYMBOLIC_READING','REPORT_INTERPRETATION','PROFILE_EVIDENCE'].includes(x.sourceClass))))r.push('CURRENT_REALITY_SOURCE_REQUIRED');
 const confirmed=v=>{const owners=s.assessments?.['NAV-08']?.model?.decisionOwners||[];return v.explicitConfirmation===true&&v.confirmationRef&&v.decisionVersion===s.decisionVersion&&Array.isArray(v.confirmedBy)&&v.confirmedBy.length>0&&v.confirmedBy.every(o=>owners.includes(o))&&(v.authority!=='SHARED_DECISION_REQUIREMENT'||owners.every(o=>v.confirmedBy.includes(o)));};
 const sourced=v=>v.sourceRef&&refs?.includes(v.sourceRef);
 if(m.execute===true||m.automaticExit===true||m.weightedCompensation===true)r.push('NO_AUTOMATIC_ACTION_OR_HARD_CONDITION_COMPENSATION');
 if(id==='NAV-21'||id==='NAV-22'){
  if(!Array.isArray(m.conditions)||!m.conditions.length)r.push('SCOPED_CONDITIONS_REQUIRED');
  for(const c of m.conditions||[]){if(!c.description||!c.scope||c.scope.decisionId!==s.decision.id||c.scope.personId!==s.personId||!c.scope.timeHorizon||!sourced(c))r.push('CONDITION_SCOPE_SOURCE_REQUIRED');
   if(['NON_EXCHANGEABLE','THRESHOLD_BOUND','HARD_MINIMUM'].includes(c.state)&&!authorities.includes(c.authority))r.push('HARD_CONDITION_AUTHORITY_REQUIRED');
   if(['USER_CONFIRMED_NON_NEGOTIABLE','SHARED_DECISION_REQUIREMENT'].includes(c.authority)&&!confirmed(c))r.push('LEGITIMATE_HUMAN_CONFIRMATION_REQUIRED');
   if(c.threshold!==null&&c.threshold!==undefined&&(!Number.isFinite(c.threshold.value)||!c.threshold.unit||!c.threshold.sourceRef||!refs.includes(c.threshold.sourceRef)))r.push('THRESHOLD_NOT_INVENTED');
   if(c.state==='TEMPORARY_MINIMUM'&&(!c.duration||!c.recoveryTarget||!c.reviewTriggers?.length))r.push('TEMPORARY_MINIMUM_NEEDS_DURATION_RECOVERY_REVIEW');
  }if(m.idealEqualsMinimum===true||m.currentEqualsMinimum===true||m.responsibilityDeletedByPreference===true)r.push('MINIMUM_AND_RESPONSIBILITY_NOT_PREFERENCE');
 }
 if(id==='NAV-23'||id==='NAV-24'){
  if(m.isForecast===true||m.probability!==undefined||m.upsideStacking===true||m.catastrophicFantasy===true)r.push('SCENARIOS_NOT_UNSUPPORTED_FORECASTS');
  if(!Array.isArray(m.scenarios)||!m.scenarios.length||m.minimumApplied!==true||m.continuationIncluded!==true||(m.waitingRelevant===true&&m.waitingIncluded!==true))r.push('FAIR_SCENARIO_SPACE_AND_MINIMUM_REQUIRED');
  for(const c of m.scenarios||[])if(!c.optionId||!c.timeHorizon||!Array.isArray(c.assumptions)||!Array.isArray(c.unknowns)||!c.minimumState)r.push('SCENARIO_ASSUMPTIONS_UNKNOWN_FLOOR_REQUIRED');
  if(id==='NAV-24'){if(!sourced(m.baseline||{})||!['BASELINE','UPSIDE','DOWNSIDE'].every(k=>m.scenarios?.some(c=>c.kind===k)))r.push('THREE_SOURCED_COMPARISON_CASES_REQUIRED');
   const first=m.scenarios?.[0];if(m.scenarios?.some(c=>c.optionId!==first.optionId||c.timeHorizon!==first.timeHorizon||JSON.stringify(c.variableIds)!==JSON.stringify(first.variableIds)))r.push('ASYMMETRIC_SCENARIO_COMPARISON');}
 }
 if(id==='NAV-25'){
  if(!Array.isArray(m.triggers)||!m.triggers.length||!Array.isArray(m.exitRoutes)||!Array.isArray(m.recoveryRoutes)||!m.minimumStateRef)r.push('EXIT_RECOVERY_AND_MINIMUM_SEPARATE_REQUIRED');
  for(const t of m.triggers||[])if(!['DATE','STATE','THRESHOLD','EVENT','AUTHORITY','MINIMUM_STATE'].includes(t.kind)||!sourced(t)||!confirmed(t)||t.scenarioIsActual===true)r.push('OBSERVABLE_CONFIRMED_TRIGGER_REQUIRED');
  for(const route of [...(m.exitRoutes||[]),...(m.recoveryRoutes||[])])if(!sourced(route)||!Array.isArray(route.dependencies)||route.dependencies.some(d=>!sourced(d)||d.thirdParty===true&&d.explicitConsent!==true))r.push('ROUTE_DEPENDENCIES_SOURCE_CONSENT_REQUIRED');
  if(m.type==='RECOVERY_ROUTE_READY'&&(!m.remainingCapacityRef||!refs.includes(m.remainingCapacityRef)||!m.recoveryRoutes?.length))r.push('POST_FAILURE_RECOVERY_CAPACITY_REQUIRED');
  if(m.exitMeansRestored===true||m.assumedLegalExit===true||m.sunkCostCancelsTrigger===true)r.push('EXIT_NOT_RESTORATION_OR_AUTOMATIC_PERMISSION');
 }return r;
}
export function evaluateAcceptedNavigationThrough25(snapshot,options={}){const prior=evaluateAcceptedNavigationThrough20(snapshot,options),modules=evaluateNavigationContracts(snapshot,options,contracts,prior.modules,validate);return {...prior,schemaVersion:'NAV-ACCEPTED-THROUGH-25-v1',modules,acceptedThrough:'NAV-25',nextModule:'NAV-26',nextModuleState:'WAITING_OWNER_AUTHORING',actionAdvancementAllowed:false,finalAction:null,decisionSufficiency:null};}
export function projectAcceptedNavigationThrough25(runtime,{locale='zh'}={}){const prior=projectAcceptedNavigationThrough20({...runtime,modules:runtime.modules.slice(0,20)},{locale});return {...prior,sections:[...prior.sections,...runtime.modules.slice(20).map((m,i)=>({title:locale.startsWith('zh')?contracts[i].titleZh:contracts[i].titleEn,needsReview:!m.canContinue,items:m.items.map(x=>({description:x.description||x.claim||'',value:x.value??null,evidenceState:x.evidenceState,asOf:x.asOf})),actions:locale.startsWith('zh')?['核对条件','补充现实资料']:['Review conditions','Add reality evidence']}))]};}
export function projectAcceptedNavigationAcademyThrough25(){const prior=projectAcceptedNavigationAcademyThrough20();return {...prior,modules:[...prior.modules,...contracts.map(c=>({moduleId:c.moduleId,titleZh:c.titleZh,titleEn:c.titleEn,contractVersion:c.version}))],lessons:[...prior.lessons,...['不可交换条件需要合法来源和适用范围。','最低状态不同于理想状态。','情景是受控假设，不是预测。','同一选项按相同变量与期限比较。','退出与恢复分别需要真实条件和资源。'].map((theme,i)=>({moduleId:`NAV-${i+21}`,theme}))]};}
