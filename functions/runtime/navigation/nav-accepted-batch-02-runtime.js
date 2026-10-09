import {NAV_BATCH_02_CONTRACT} from './nav-accepted-batch-02-contract.js';
import {evaluateAcceptedNavigationBatch,evaluateNavigationContracts,projectAcceptedNavigationBatch,projectAcceptedNavigationAcademy} from './nav-accepted-batch-01-runtime.js';
const classes={
 'NAV-06':['HIGHLY_REVERSIBLE','REVERSIBLE_WITH_COST','PARTIALLY_REVERSIBLE','LOW_REVERSIBILITY','EFFECTIVELY_IRREVERSIBLE','REVERSIBILITY_UNKNOWN'],
 'NAV-07':['IMMEDIATE','NEAR_TERM','MEDIUM_TERM','LONG_TERM','INTERGENERATIONAL_OR_LEGACY','HORIZON_UNDEFINED'],
 'NAV-08':['USER_DECISION_OWNER','SHARED_DECISION','PROFESSIONAL_ADVISORY','PROFESSIONAL_REQUIRED','REPRESENTATIVE_DECISION','INSTITUTIONAL_AUTHORITY','CONSENT_REQUIRED','NAVIGATION_SUPPORT_ONLY','AUTHORITY_UNKNOWN'],
 'NAV-09':['NO_MATERIAL_CHANGE','LOCAL_CHANGE','PERSISTENT_CHANGE','CROSS_DOMAIN_CHANGE','FOUNDATIONAL_CHANGE','CHANGE_SIGNIFICANCE_UNKNOWN'],
 'NAV-10':['R0_OBSERVE','R1_MONITOR','R2_PREPARE','R3_LOCAL_ADJUST','R4_STRUCTURAL_CHANGE_CANDIDATE','R5_IMMEDIATE_ESCALATION']
};
function validate(id,assessment,snapshot){const reasons=[];const model=assessment.model;
 if(!model||!classes[id].includes(model.type))return ['MODULE_MODEL_UNDEFINED'];
 if(id==='NAV-06'){
  for(const field of ['legal','financial','operational','relational','temporal','identityOrReputationResidue','optionSpace'])if(!model.dimensions?.[field])reasons.push(`REVERSIBILITY_DIMENSION_UNKNOWN:${field}`);
  for(const field of ['exitRoutes','exitCosts','residualEffects','recoveryConditions','unknowns'])if(!Array.isArray(model[field]))reasons.push(`REVERSIBILITY_FIELD_MISSING:${field}`);
  if(['LOW_REVERSIBILITY','EFFECTIVELY_IRREVERSIBLE'].includes(model.type)&&model.highImpact===true&&model.materialUnknown===true)reasons.push('ESCALATION_REQUIRED');
  if(model.type==='REVERSIBILITY_UNKNOWN')reasons.push('EXIT_AND_RECOVERY_REQUIRE_VERIFICATION');
 }
 if(id==='NAV-07'){
  if(model.horizonConfirmedBy!==snapshot.ownerId||model.type==='HORIZON_UNDEFINED')reasons.push('HORIZON_REQUIRES_USER_CONFIRMATION');
  if(model.weights&&model.weightsConfirmedBy!==snapshot.ownerId)reasons.push('NO_SILENT_HORIZON_WEIGHTS');
  if(model.futureCertainty===true)reasons.push('LONG_HORIZON_PRESERVES_UNCERTAINTY');
 }
 if(id==='NAV-08'){
  if(!Array.isArray(model.decisionOwners)||!model.decisionOwners.length||model.decisionOwners.includes('AI'))reasons.push('LEGITIMATE_DECISION_OWNER_REQUIRED');
  if(model.type==='AUTHORITY_UNKNOWN')reasons.push('AUTHORITY_STOP_POINT');
  for(const field of ['consentRequirements','professionalRequirements','institutionalRequirements']){
   if(!Array.isArray(model[field]))reasons.push(`AUTHORITY_REQUIREMENTS_UNASSESSED:${field}`);
   for(const req of model[field]||[])if(req.satisfied!==true||!req.sourceRef||!req.scope||req.decisionObjectId!==snapshot.decision.id||req.revoked===true)reasons.push(`UNRESOLVED:${field}`);
  }
  if(model.systemRole!=='NAVIGATION_SUPPORT_ONLY')reasons.push('SYSTEM_CANNOT_OWN_DECISION');
 }
 if(id==='NAV-09'){
  if(!model.previousDecisionBasisRef||!Array.isArray(model.affectedDecisionBasis))reasons.push('PREVIOUS_BASIS_REQUIRED');
  if(model.type==='CHANGE_SIGNIFICANCE_UNKNOWN')reasons.push('CHANGE_SIGNIFICANCE_UNKNOWN');
  if(model.type==='FOUNDATIONAL_CHANGE'||model.conditionsChanged===true)reasons.push('DECISION_REOPEN_NOT_NEW_ANSWER');
 }
 if(id==='NAV-10'){
  if(model.type==='R1_MONITOR'&&(!model.monitoringSignals?.length||!model.reviewAt||!model.escalationTriggers?.length))reasons.push('MONITORING_BOUNDARY_REQUIRED');
  if(model.type==='R2_PREPARE'&&(!model.preparationTarget||!model.resourceTarget||!model.informationTarget||!model.reviewAt))reasons.push('CONCRETE_PREPARATION_REQUIRED');
  if(model.type==='R3_LOCAL_ADJUST'&&(!model.scope||!model.duration||!model.expectedEffect||!model.reviewTrigger))reasons.push('BOUNDED_LOCAL_ADJUSTMENT_REQUIRED');
  if(model.type==='R4_STRUCTURAL_CHANGE_CANDIDATE'&&model.execute===true)reasons.push('CANDIDATE_NOT_EXECUTION');
  if(model.type==='R5_IMMEDIATE_ESCALATION')reasons.push('HANDOFF_ACTION_ADVANCEMENT_PAUSED');
  if(model.execute===true)reasons.push('NO_AUTOMATIC_ACTION_EXECUTION');
 }
 return reasons;
}
export function evaluateAcceptedNavigationThrough10(snapshot,options={}){
 const prior=evaluateAcceptedNavigationBatch(snapshot,options);const modules=evaluateNavigationContracts(snapshot,options,NAV_BATCH_02_CONTRACT,prior.modules,validate);
 return {...prior,schemaVersion:'NAV-ACCEPTED-THROUGH-10-v1',modules,acceptedThrough:'NAV-10',nextModule:'NAV-11',nextModuleState:'WAITING_OWNER_AUTHORING',finalAction:null,decisionSufficiency:null,actionAdvancementAllowed:false,systemRole:'NAVIGATION_SUPPORT_ONLY'};
}
export function projectAcceptedNavigationThrough10(runtime,{locale='zh'}={}){
 const prior=projectAcceptedNavigationBatch({...runtime,modules:runtime.modules.slice(0,5)},{locale});const zh=locale.startsWith('zh');
 const titles=zh?['如果判断错了，怎样退出与恢复','这个决定影响哪些未来','谁拥有决定权，哪里需要同意或专业支持','哪些变化需要重新检查原判断','回应可以有多大，也可以降级']:NAV_BATCH_02_CONTRACT.map(c=>c.titleEn);
 return {...prior,sections:[...prior.sections,...runtime.modules.slice(5).map((m,i)=>({title:titles[i],needsReview:!m.canContinue,actions:zh?['核对','修正','寻求合适的人类支持']:['Review','Correct','Seek appropriate human support']}))],actionAdvancementAllowed:false};
}
export function projectAcceptedNavigationAcademyThrough10(){const prior=projectAcceptedNavigationAcademy();return {...prior,modules:[...prior.modules,...NAV_BATCH_02_CONTRACT.map(c=>({moduleId:c.moduleId,titleZh:c.titleZh,titleEn:c.titleEn,contractVersion:c.version}))],lessons:[...prior.lessons,...['先问判断错了还能怎样回来。','分开现在、接下来与更远的未来。','知道得更多不产生替别人决定的权利。','变化可以重开决定，但不预先决定答案。','问题值得回应，不代表值得最大回应。'].map((theme,i)=>({moduleId:`NAV-${String(i+6).padStart(2,'0')}`,theme}))]};}
