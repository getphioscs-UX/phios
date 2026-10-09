import {NAV_BATCH_04_CONTRACT} from './nav-accepted-batch-04-contract.js';
import {evaluateNavigationContracts} from './nav-accepted-batch-01-runtime.js';
import {evaluateAcceptedNavigationThrough15,projectAcceptedNavigationThrough15,projectAcceptedNavigationAcademyThrough15} from './nav-accepted-batch-03-runtime.js';
const states={
 'NAV-16':['RETURN_IMPROVING','RETURN_PROPORTIONATE','RETURN_DIMINISHING','RETURN_FLAT','NEGATIVE_RETURN','RETURN_PATTERN_UNKNOWN'],
 'NAV-17':['PARAMETER_ADJUSTMENT_STILL_QUALIFIED','STRUCTURAL_ALTERNATIVE_NOT_YET_ADMITTED','STRUCTURAL_ALTERNATIVE_ADMISSION_SUPPORTED','MULTIPLE_STRUCTURAL_ALTERNATIVES_ADMITTED','STRUCTURAL_REVIEW_REQUIRED','STRUCTURAL_EVIDENCE_INSUFFICIENT'],
 'NAV-18':['WAITING_QUALIFIED','WAITING_QUALIFIED_WITH_REVIEW','WAITING_VALUE_DECLINING','WAITING_COST_RISING','WAITING_NO_LONGER_DEFAULT','WAITING_NOT_CURRENTLY_QUALIFIED','WAITING_COST_UNKNOWN'],
 'NAV-19':['MUST_PRESERVE','PREFER_TO_PRESERVE','PRESERVE_IF_FEASIBLE','VALUE_UNCERTAIN'],
 'NAV-20':['GOAL_VALUE_ALIGNED','GOAL_PARTIALLY_ALIGNED','GOAL_VALUE_CONFLICT','GOAL_IS_ONLY_ONE_CARRIER','GOAL_NO_LONGER_SERVES_VALUE','VALUE_UNCONFIRMED']
};
const realSources=new Set(['USER_REPORTED','DIRECTLY_OBSERVED','VERIFIED_ACCOUNT_DATA','FINANCIAL_RECORD','OPERATIONAL_RECORD','PROFESSIONAL_INPUT','CURRENT_EXTERNAL_EVIDENCE','USER_STATED_GOAL','USER_STATED_VALUE','MATERIAL_DEPENDENCY','RESPONSIBILITY','OBSERVED_BEHAVIOR']);
export function describeIncrementalReturn(series=[]){
 if(!Array.isArray(series)||series.length<2)return {state:'RETURN_PATTERN_UNKNOWN',increments:[]};
 const increments=[];for(let i=1;i<series.length;i++){const a=series[i-1],b=series[i];if(!a||!b||!Number.isFinite(a.input)||!Number.isFinite(b.input)||!Number.isFinite(a.outcome)||!Number.isFinite(b.outcome)||!a.inputUnit||a.inputUnit!==b.inputUnit||!a.outcomeUnit||a.outcomeUnit!==b.outcomeUnit||!(b.input>a.input)||!(Date.parse(b.asOf)>Date.parse(a.asOf)))return {state:'RETURN_PATTERN_UNKNOWN',increments:[]};increments.push({additionalInput:b.input-a.input,additionalOutcome:b.outcome-a.outcome,inputUnit:b.inputUnit,outcomeUnit:b.outcomeUnit,descriptiveRatio:(b.outcome-a.outcome)/(b.input-a.input),fromSourceRef:a.sourceRef,toSourceRef:b.sourceRef});}
 return {state:'OBSERVED_INCREMENTAL_COMPARISON_NOT_CAUSAL_OR_VALUE_JUDGMENT',increments};
}
function humanConfirmed(v,s){const owners=s.assessments?.['NAV-08']?.model?.decisionOwners||[];return v.explicitConfirmation===true&&v.decisionVersion===s.decisionVersion&&v.confirmationRef&&Array.isArray(v.confirmedBy)&&v.confirmedBy.length>0&&v.confirmedBy.every(id=>owners.includes(id))&&(v.authority!=='SHARED_CONFIRMED'||owners.every(id=>v.confirmedBy.includes(id)));}
function validate(id,a,s){const r=[],m=a.model;if(!m||!states[id].includes(m.type))return ['MODULE_MODEL_UNDEFINED'];const items=Array.isArray(a.items)?a.items:[];
 if(!Array.isArray(m.sourceRefs)||!m.sourceRefs.length)r.push('MODEL_SOURCE_REQUIRED');for(const ref of m.sourceRefs||[])if(!items.some(x=>x?.sourceRef===ref&&realSources.has(x.sourceClass)&&x.role!=='FUTURE_ASSUMPTION'))r.push('MODEL_NOT_SUPPORTED_BY_REALITY_OR_EXPLICIT_HUMAN_INPUT');
 if(id==='NAV-16'){
  const comparison=describeIncrementalReturn(m.inputOutcomeSeries);if(comparison.state==='RETURN_PATTERN_UNKNOWN')r.push('INPUT_OUTCOME_BASELINES_UNKNOWN');
  for(const point of m.inputOutcomeSeries||[])if(!point.sourceRef||!m.sourceRefs.includes(point.sourceRef)||!point.sourceVersion)r.push('BASELINE_SOURCE_VERSION_REQUIRED');
  if(!['ATTRIBUTION_SUPPORTED','ATTRIBUTION_PARTIAL','ATTRIBUTION_UNCERTAIN'].includes(m.attributionState))r.push('ATTRIBUTION_STATE_REQUIRED');
  if(m.attributionState==='ATTRIBUTION_SUPPORTED'&&!m.causalEvidenceRef)r.push('AFTER_INPUT_NOT_CAUSAL_PROOF');
  if(!Array.isArray(m.lagConsiderations)||!Array.isArray(m.preservationReturn)||!Array.isArray(m.capabilityBuildingReturn))r.push('LAG_PRESERVATION_CAPABILITY_MUST_REMAIN_VISIBLE');
  if(m.lagPending===true&&['RETURN_FLAT','NEGATIVE_RETURN'].includes(m.type))r.push('DO_NOT_PREMATURELY_DECLARE_NO_RETURN');
  if(m.stopAutomatically===true||m.lowReturnMeansLowValue===true||m.sunkCostGrantsNextInput===true)r.push('RETURN_NOT_VALUE_OR_AUTOMATIC_STOP');
 }
 if(id==='NAV-17'){
  if(!m.currentStructure||!Array.isArray(m.adjustmentsTried))r.push('STRUCTURE_AND_ACTUAL_ADJUSTMENT_HISTORY_REQUIRED');
  if(!Array.isArray(m.alternatives))r.push('ALTERNATIVE_INVENTORY_REQUIRED');
  for(const alt of m.alternatives||[]){if(alt.kind==='MATURE_CANDIDATE'&&(!alt.problemAddressed||!alt.conditionsChanged?.length||!Array.isArray(alt.requirements)||!Array.isArray(alt.transitionCosts)||!Array.isArray(alt.unknowns)||!alt.feasibilitySourceRef||!m.sourceRefs.includes(alt.feasibilitySourceRef)))r.push('CONCEPT_NOT_MATURE_STRUCTURAL_CANDIDATE');}
  if(m.execute===true||m.structureAutomaticallyPreferred===true)r.push('ADMISSION_NOT_EXECUTION_OR_PREFERENCE');
  if(m.lowerImpactAdjustmentResponsive===true&&m.lowerImpactPathVisible!==true)r.push('RESPONSIVE_SMALLER_ADJUSTMENT_MUST_REMAIN_VISIBLE');
 }
 if(id==='NAV-18'){
  if(!Array.isArray(m.waitingFor)||!m.waitingFor.length||!Array.isArray(m.waitingValue)||!Array.isArray(m.waitingCosts))r.push('WAITING_PURPOSE_VALUE_COST_REQUIRED');
  if(!m.waitingUntil&&!m.reviewTriggers?.length)r.push('WAITING_REVIEW_BOUNDARY_REQUIRED');
  if(m.qualifiedBecauseProfessionalOrConsentRequired===true&&m.requiredAuthorityResolved!==true&&m.type==='WAITING_NOT_CURRENTLY_QUALIFIED')r.push('REQUIRED_WAITING_NOT_AUTOMATICALLY_UNREASONABLE');
  if(m.actNowAutomatically===true||m.waitAutomaticallySafer===true)r.push('WAITING_NOT_AUTOMATIC_ACTION_OR_SAFETY');
  if(m.costLinearityAssumed===true&&m.knownNonlinearBoundary===true)r.push('NONLINEAR_WAITING_COST_NOT_FLAT_ESTIMATE');
 }
 if(id==='NAV-19'){
  if(!Array.isArray(m.values)||!m.values.length||!Array.isArray(m.materialRequirements)||!Array.isArray(m.responsibilityRequirements))r.push('PRESERVATION_REQUIREMENTS_SEPARATE_AND_REQUIRED');
  for(const v of m.values||[]){if(!states[id].includes(v.state)||!v.description||!v.currentCarrier||!Array.isArray(v.alternativeCarriers))r.push('VALUE_CARRIER_AND_UNKNOWN_MUST_BE_SEPARATE');
   if(v.state==='MUST_PRESERVE'&&!['BASIC_SAFETY','LEGAL_OBLIGATION','DEPENDANT_WELFARE','CRITICAL_CONTINUITY_REQUIREMENT','EXPLICIT_USER_NON_NEGOTIABLE'].includes(v.requirementBasis))r.push('PREFERENCE_NOT_MUST_PRESERVE');
   if(v.requirementBasis==='EXPLICIT_USER_NON_NEGOTIABLE'&&!humanConfirmed(v,s))r.push('HUMAN_NON_NEGOTIABLE_CONFIRMATION_REQUIRED');
   if(v.currentCarrierIsValue===true)r.push('VALUE_NOT_CURRENT_CARRIER');}
  if(m.autoResolvedValueConflict===true||m.singlePreservationScore!==undefined)r.push('PRESERVATION_CONFLICT_NOT_AUTOMATIC_SCORE');
 }
 if(id==='NAV-20'){
  if(!Array.isArray(m.goals)||!m.goals.length||!Array.isArray(m.values)||!Array.isArray(m.goalValueLinks)||!Array.isArray(m.responsibilityRequirements)||!Array.isArray(m.materialRequirements))r.push('GOAL_VALUE_REQUIREMENT_SEPARATION_REQUIRED');
  for(const v of m.values||[])if(['USER_CONFIRMED','SHARED_CONFIRMED'].includes(v.authority)&&!humanConfirmed(v,s))r.push('VALUE_NOT_CONFIRMED_BY_LEGITIMATE_HUMANS');
  if(m.type!=='VALUE_UNCONFIRMED'&&!m.values?.some(v=>['USER_CONFIRMED','SHARED_CONFIRMED'].includes(v.authority)&&humanConfirmed(v,s)))r.push('ALIGNMENT_REQUIRES_CONFIRMED_VALUE');
  for(const link of m.goalValueLinks||[])if(!m.goals.some(g=>g.goalId===link.goalId)||!m.values.some(v=>v.valueId===link.valueId))r.push('GOAL_VALUE_LINK_INVALID');
  if(m.hiddenValueAsserted===true||m.goalAutoDeleted===true||m.goalCompletionEqualsValueDelivered===true||m.singleAlignmentScore!==undefined)r.push('NO_HIDDEN_VALUES_AUTOMATIC_GOAL_REMOVAL_OR_SCORE');
 }
 return r;
}
export function evaluateAcceptedNavigationThrough20(snapshot,options={}){const prior=evaluateAcceptedNavigationThrough15(snapshot,options),modules=evaluateNavigationContracts(snapshot,options,NAV_BATCH_04_CONTRACT,prior.modules,validate);for(const m of modules.slice(15)){const model=snapshot?.assessments?.[m.moduleId]?.model;m.assessmentState=m.canContinue?model?.type:null;m.incrementalComparison=m.canContinue&&m.moduleId==='NAV-16'?describeIncrementalReturn(model.inputOutcomeSeries):null;}return {...prior,schemaVersion:'NAV-ACCEPTED-THROUGH-20-v1',modules,acceptedThrough:'NAV-20',nextModule:'NAV-21',nextModuleState:'WAITING_OWNER_AUTHORING',actionAdvancementAllowed:false,finalAction:null,decisionSufficiency:null};}
export function projectAcceptedNavigationThrough20(runtime,{locale='zh'}={}){const prior=projectAcceptedNavigationThrough15({...runtime,modules:runtime.modules.slice(0,15)},{locale}),zh=locale.startsWith('zh');const titles=zh?['新增投入还带来什么改善','调整参数还是比较另一种结构','等待在增加什么、消耗什么','改变时需要保留什么','目标在服务哪些由你确认的价值']:NAV_BATCH_04_CONTRACT.map(c=>c.titleEn);return {...prior,sections:[...prior.sections,...runtime.modules.slice(15).map((m,i)=>({title:titles[i],needsReview:!m.canContinue,items:m.items.map(x=>({description:x.description||x.claim||'',value:x.value??null,evidenceState:x.evidenceState,asOf:x.asOf})),actions:zh?['核对','修正','确认目标与价值','补充现实资料']:['Review','Correct','Confirm goals and values','Add reality evidence']}))]};}
export function projectAcceptedNavigationAcademyThrough20(){const prior=projectAcceptedNavigationAcademyThrough15();return {...prior,modules:[...prior.modules,...NAV_BATCH_04_CONTRACT.map(c=>({moduleId:c.moduleId,titleZh:c.titleZh,titleEn:c.titleEn,contractVersion:c.version}))],lessons:[...prior.lessons,...['新增投入需要独立理由，低回报不等于低价值。','结构替代进入比较，不等于执行。','等待需要目的、成本与重新检查的边界。','价值不等于当前承载它的结构。','目标说明想得到什么，价值须由有决定权的人确认。'].map((theme,i)=>({moduleId:`NAV-${i+16}`,theme}))]};}
