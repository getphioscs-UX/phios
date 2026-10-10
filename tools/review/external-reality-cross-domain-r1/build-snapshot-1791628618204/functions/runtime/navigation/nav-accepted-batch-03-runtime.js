import {NAV_BATCH_03_CONTRACT} from './nav-accepted-batch-03-contract.js';
import {evaluateNavigationContracts} from './nav-accepted-batch-01-runtime.js';
import {evaluateAcceptedNavigationThrough10,projectAcceptedNavigationThrough10,projectAcceptedNavigationAcademyThrough10} from './nav-accepted-batch-02-runtime.js';
const states={
 'NAV-11':['CONTINUATION_QUALIFIED','CONTINUATION_QUALIFIED_WITH_MONITORING','CONTINUATION_QUESTIONED','CONTINUATION_REQUIRES_REASSESSMENT','CONTINUATION_NOT_QUALIFIED_BY_CURRENT_EVIDENCE','CONTINUATION_BASIS_UNKNOWN'],
 'NAV-12':['CURRENT_COST_STATE','COST_INCREASE','TEMPORARY_CAPACITY_INVESTMENT','COMPENSATORY_MAINTENANCE','HIDDEN_SUBSIDY_ACTIVE','FUTURE_SUBSIDY','MAINTENANCE_COST_UNKNOWN'],
 'NAV-13':['DEFAULT_DIRECTION_RETAINED','DEFAULT_DIRECTION_RETAINED_WITH_REVIEW','DEFAULT_DIRECTION_QUESTIONED','DEFAULT_DIRECTION_LOST','DEFAULT_DIRECTION_BASIS_UNKNOWN'],
 'NAV-14':['NO_PROPAGATION_ESTABLISHED','LOCAL_SPILLOVER','MULTI_DOMAIN_PROPAGATION','SYSTEMIC_PROPAGATION','PROPAGATION_UNCONFIRMED','PROPAGATION_RELATION_UNKNOWN'],
 'NAV-15':['CAPACITY_SUFFICIENT','CAPACITY_SUFFICIENT_WITH_BUFFER','CAPACITY_TIGHT','CAPACITY_CONSTRAINED','CAPACITY_DEFICIT','CAPACITY_UNKNOWN']
};
const realClasses=new Set(['USER_REPORTED','DIRECTLY_OBSERVED','VERIFIED_ACCOUNT_DATA','FINANCIAL_RECORD','PROFESSIONAL_INPUT','CURRENT_EXTERNAL_EVIDENCE']);
const dimensions=['financial','time','attention','operational','recovery','relational','responsibility','skill','institutional'];
const range=x=>Number.isFinite(x)&&x>=0?{min:x,max:x}:x&&Number.isFinite(x.min)&&Number.isFinite(x.max)&&x.min>=0&&x.max>=x.min?{min:x.min,max:x.max}:null;
export function compareNavigationCapacity(entries=[]){
 return entries.map(e=>{const required=range(e.required),available=range(e.available);return {dimension:e.dimension,unit:e.unit,required,available,sourceRef:e.sourceRef,state:!required||!available?'UNKNOWN':available.max<required.min?'DEFICIT':available.min>=required.max?'COVERED':'RANGE_OVERLAP_UNCERTAIN',postActionBuffer:required&&available?{min:available.min-required.max,max:available.max-required.min}:null};});
}
function validate(id,a,s){const r=[],m=a.model;if(!m||!states[id].includes(m.type))return ['MODULE_MODEL_UNDEFINED'];
 if(!Array.isArray(m.sourceRefs)||!m.sourceRefs.length)r.push('MODEL_REALITY_SOURCE_REQUIRED');
 const items=Array.isArray(a.items)?a.items:[];for(const ref of m.sourceRefs||[]){if(!items.some(x=>x?.sourceRef===ref&&realClasses.has(x.sourceClass)&&x.role!=='FUTURE_ASSUMPTION'&&x.currentness==='CURRENT'))r.push('MODEL_NOT_SUPPORTED_BY_CURRENT_REALITY');}
 if(id==='NAV-11'){
  if(!m.originalBasisRef||!Array.isArray(m.intendedValue)||!m.intendedValue.length)r.push('CONTINUATION_BASIS_UNKNOWN');
  for(const k of ['value','cost','capacity','responsibility','futureOptions','timeFit','realityFit'])if(!m.dimensions?.[k])r.push(`CONTINUATION_DIMENSION_UNASSESSED:${k}`);
  if(m.type.startsWith('CONTINUATION_QUALIFIED')&&Object.values(m.dimensions||{}).some(v=>v!=='CURRENT_SUPPORT'))r.push('FUNCTION_ALONE_NOT_QUALIFICATION');
  if(m.type==='CONTINUATION_QUALIFIED_WITH_MONITORING'&&(!m.reviewAt||!m.monitoringSignals?.length))r.push('CONTINUATION_MONITORING_REQUIRED');
 }
 if(id==='NAV-12'){
  if(!Array.isArray(m.costs)||!m.costs.length)r.push('MAINTENANCE_COST_UNKNOWN');
  for(const c of m.costs||[])if(!c.costBearer||!c.sourceRef||!m.sourceRefs.includes(c.sourceRef))r.push('COST_BEARER_OR_SOURCE_REQUIRED');
  if(m.claimsIncrease===true&&(!m.priorBaselineRef||!m.baselineSourceVersion))r.push('COST_INCREASE_REQUIRES_PRIOR_BASELINE');
  if(m.knownHiddenSubsidy===true&&!m.hiddenSubsidies?.length)r.push('HIDDEN_SUBSIDY_MUST_BE_VISIBLE');
  if(m.type==='TEMPORARY_CAPACITY_INVESTMENT'&&(!m.endsAt||!m.reviewAt||!m.capacityBuildingPath))r.push('TEMPORARY_INVESTMENT_NOT_BOUNDED');
  if(m.totalCostScore!==undefined)r.push('DISTINCT_COSTS_NOT_SINGLE_SCORE');
 }
 if(id==='NAV-13'){
  if(!m.originalBasisRef)r.push('ORIGINAL_DIRECTION_BASIS_UNKNOWN');
  if(m.type.startsWith('DEFAULT_DIRECTION_RETAINED')&&(!m.currentSupportRefs?.length||m.supportOnlyHistorical===true))r.push('INERTIA_NOT_CURRENT_SUPPORT');
  if(m.type==='DEFAULT_DIRECTION_LOST'&&(m.forceExit===true||m.permanentLoss===true))r.push('DEFAULT_LOSS_NOT_AUTOMATIC_OR_PERMANENT_EXIT');
  if(m.consciousRechoice===true&&m.userConfirmation?.ownerId!==s.ownerId)r.push('CONSCIOUS_RECHOICE_REQUIRES_USER_CONFIRMATION');
 }
 if(id==='NAV-14'){
  const lineage=new Set();for(const link of m.links||[]){if(!link.sourceRef||!m.sourceRefs.includes(link.sourceRef)||!link.from||!link.to)r.push('PROPAGATION_LINK_SOURCE_REQUIRED');
   if(link.relation==='CAUSES'&&link.evidenceBasis==='CO_OCCURRENCE')r.push('CO_OCCURRENCE_NOT_CAUSATION');
   if(link.costLineageId){if(lineage.has(link.costLineageId))r.push('CROSS_DOMAIN_COST_DOUBLE_COUNT');lineage.add(link.costLineageId);}}
  if(['MULTI_DOMAIN_PROPAGATION','SYSTEMIC_PROPAGATION'].includes(m.type)&&(!m.links?.length||!m.affectedDomains||new Set(m.affectedDomains).size<2))r.push('PROPAGATION_SCOPE_UNSUPPORTED');
  if(m.multipleSeparateDecisions===true)r.push('RETURN_NAV_01_SPLIT_REQUIRED');
  if(m.forceStructuralChange===true)r.push('PROPAGATION_NOT_STRUCTURAL_COMMAND');
 }
 if(id==='NAV-15'){
  if(!Array.isArray(m.capacityEntries)||!m.capacityEntries.length)r.push('CAPACITY_UNKNOWN');
  for(const e of m.capacityEntries||[]){if(!dimensions.includes(e.dimension)||!e.unit||!e.sourceRef||!m.sourceRefs.includes(e.sourceRef)||e.usable!==true)r.push('USABLE_DIMENSION_SOURCE_REQUIRED');
   if(e.capacityBasis&&e.capacityBasis!=='OWN_CAPACITY'&&(e.explicitConsent!==true||e.cost===undefined||!e.reliability||!e.duration))r.push('BORROWED_CAPACITY_CONDITIONS_UNCONFIRMED');}
  const compared=compareNavigationCapacity(m.capacityEntries||[]);
  if(m.type.startsWith('CAPACITY_SUFFICIENT')&&compared.some(x=>x.state!=='COVERED'))r.push('CAPACITY_SUFFICIENCY_NOT_SUPPORTED');
  if(m.type==='CAPACITY_SUFFICIENT_WITH_BUFFER'&&compared.some(x=>!(x.postActionBuffer?.min>0)))r.push('MEANINGFUL_BUFFER_NOT_ESTABLISHED');
  if(m.totalCapacityScore!==undefined)r.push('CAPACITY_DIMENSIONS_NOT_INTERCHANGEABLE');
  if(m.permanentRejection===true)r.push('CAPACITY_DEFICIT_NOT_PERMANENT_IMPOSSIBILITY');
 }
 return r;
}
export function evaluateAcceptedNavigationThrough15(snapshot,options={}){
 const prior=evaluateAcceptedNavigationThrough10(snapshot,options),modules=evaluateNavigationContracts(snapshot,options,NAV_BATCH_03_CONTRACT,prior.modules,validate);
 for(const m of modules.slice(10)){const model=snapshot?.assessments?.[m.moduleId]?.model;m.assessmentState=m.canContinue?model?.type:null;
  m.defaultPathPriority=m.canContinue&&m.moduleId==='NAV-13'?(model.type==='DEFAULT_DIRECTION_LOST'?'ONE_OPTION_AMONG_OTHERS':'REVIEWABLE_CURRENT_SUPPORT'):null;
  m.capacityComparison=m.canContinue&&m.moduleId==='NAV-15'?compareNavigationCapacity(model.capacityEntries):[];
  m.currentExecutionEligible=m.canContinue&&m.moduleId==='NAV-15'&&model.type.startsWith('CAPACITY_SUFFICIENT');
 }
 return {...prior,schemaVersion:'NAV-ACCEPTED-THROUGH-15-v1',modules,acceptedThrough:'NAV-15',nextModule:'NAV-16',nextModuleState:'WAITING_OWNER_AUTHORING',actionAdvancementAllowed:false,finalAction:null};
}
export function projectAcceptedNavigationThrough15(runtime,{locale='zh'}={}){
 const prior=projectAcceptedNavigationThrough10({...runtime,modules:runtime.modules.slice(0,10)},{locale}),zh=locale.startsWith('zh');const titles=zh?['还在运行，是否仍值得继续','谁在支付维持当前结果的成本','原方向是否仍应默认继续','影响是否扩展到其他领域','现实能否承载这个选项']:NAV_BATCH_03_CONTRACT.map(c=>c.titleEn);
 return {...prior,sections:[...prior.sections,...runtime.modules.slice(10).map((m,i)=>({title:titles[i],needsReview:!m.canContinue,items:m.items.map(x=>({description:x.description||x.claim||'',value:x.value??null,evidenceState:x.evidenceState,asOf:x.asOf})),capacityComparison:(m.capacityComparison||[]).map(c=>({dimension:zh?({financial:'财务',time:'时间',attention:'注意力',operational:'运行',recovery:'恢复',relational:'关系协作',responsibility:'责任',skill:'技能',institutional:'制度资源'}[c.dimension]||'待核对容量'):c.dimension,unit:c.unit,required:c.required,available:c.available,remainingBuffer:c.postActionBuffer,assessment:zh?({COVERED:'当前范围覆盖所需量',DEFICIT:'当前范围不足，选项仍可保留',RANGE_OVERLAP_UNCERTAIN:'区间重叠，需要核对',UNKNOWN:'尚未建立可用量'}[c.state]):c.state})),actions:zh?['核对','修正','补充现实资料']:['Review','Correct','Add reality evidence']}))]};
}
export function projectAcceptedNavigationAcademyThrough15(){const prior=projectAcceptedNavigationAcademyThrough10();return {...prior,modules:[...prior.modules,...NAV_BATCH_03_CONTRACT.map(c=>({moduleId:c.moduleId,titleZh:c.titleZh,titleEn:c.titleEn,contractVersion:c.version}))],lessons:[...prior.lessons,...['还在运行只能证明功能，不自动证明方向。','结果不变，维持成本也可能改变决定。','旧路径不自动续期默认资格。','同时出现不等于传播或因果。','有价值不等于当前可执行；容量不足不是永远不可能。'].map((theme,i)=>({moduleId:`NAV-${i+11}`,theme}))]};}
