/** Acceptance fix: typed, read-only views over frozen FCR output. No projection engine. */
import {subtract,unknown,exact} from '../calculation-runtime/range-arithmetic.js';
import {allocationAudit} from '../calculation-runtime/publication-paths-r3-2.js';
const missing=()=>unknown('NOT_AVAILABLE_IN_FROZEN_FCR');
export const modelNames={RETIREMENT_NEEDS:['退休支出','Retirement spending'],RETIREMENT_FUNDING:['退休资金','Retirement funding'],EDUCATION_COST:['教育费用','Education costs'],EDUCATION_FUNDING:['教育资金','Education funding'],PROTECTION_EVENT:['保障事件','Protection events'],ESTATE_CONTINUITY:['家庭文件','Estate records'],LIFE_COURSE_EVENTS:['生活事件','Life-course events']};
export const naturalLabels={SELF:['本人','Self'],CHILD_A:['子女 A','Child A'],CHILD_B:['子女 B','Child B'],DEATH:['身故','Death'],MEDICAL:['医疗','Medical'],TPD:['完全永久伤残','Total permanent disability'],DECLARED:['客户声明','Client declared'],UNKNOWN:['尚未提供','Not provided'],PLANNED:['已计划','Planned'],UNVERIFIED:['待核实','To verify'],COMPLETED:['有完成凭证','Completion evidenced'],WILL:['遗嘱资料','Will record'],NOMINATION:['保单提名','Policy nomination'],EXECUTOR:['执行人资料','Executor record'],RETIREMENT:['退休','Retirement'],EDUCATION:['教育','Education'],ESTATE:['家庭文件','Estate'],GROSS_RETURN:['情景年回报率','Scenario gross annual return'],ANNUAL_FEE:['情景年费率','Scenario annual fee'],INFLATION:['支出通胀率','Spending inflation'],STAGE_A:['教育阶段 A','Education stage A'],STAGE_B:['教育阶段 B','Education stage B']};
export function readable(code){return naturalLabels[code]||modelNames[code]||(/^STAGE_\d+$/.test(code)?['教育阶段 '+code.slice(6),'Education stage '+code.slice(6)]:['资料引用','Source reference']);}
export function typedModelView(m,envelope){
 const input=envelope.sourceSnapshot?.input||{},ctx=envelope.sourceSnapshot?.context||{};
 const common={currency:m.currency,provenance:{modelId:m.modelId,sourceDigest:m.sourceDigest,sourceRefs:m.inputSourceRefs,asOfDate:m.asOfDate},assumptionRefs:m.assumptions?.map(a=>a.ref)||[]};
 const modelType=m.modelId==='RETIREMENT_NEEDS'?'RETIREMENT_SPENDING':m.modelId;
 const audit=allocationAudit(ctx,input.assets||[],input.allocations||[]);
 const funding=['RETIREMENT_FUNDING','EDUCATION_FUNDING'].includes(modelType);
 if(funding&&(!audit.eligible||!ctx.currentConsent||ctx.sourceDigest!==m.sourceDigest))return {modelType,eligible:false,rows:[],issues:audit.issues,...common};
 const rows=(m.rows||[]).map(r=>{
  if(modelType==='RETIREMENT_SPENDING')return {...common,year:r.year,baseYear:Number(m.asOfDate.slice(0,4)),baseYearSpending:m.spendingBasis==='AS_OF_YEAR'?m.annualSpending:missing(),inflationRate:m.assumptions?.[0]?.value||missing(),nominalSpending:r.nominal,baseYearRealSpending:r.real};
  if(modelType==='EDUCATION_COST')return {...common,year:r.year,subjectRef:r.subject,stageRef:r.stage,tuitionCost:r.tuition,livingCost:r.living,otherCost:r.other,totalAnnualCost:r.nominal,costSourceYear:r.feeYear,inflationAssumption:m.assumptions?.find(a=>a.name===r.stage+':INFLATION')?.value||missing()};
  if(funding){
   // FCR release includes initial immediately available designations. They are
   // opening resources, not restricted assets becoming accessible that year.
   const start=m.rows[0]?.year,baseYear=Number(ctx.asOfDate?.slice(0,4));
   const releasedAssets=(m.allocations||[]).map(a=>input.assets?.find(s=>s.ref===a.assetRef)).filter(a=>a&&(r.year===start?a.availableYear<=r.year:a.availableYear===r.year));
   const initial=releasedAssets.some(a=>a.availableYear<=baseYear),restricted=releasedAssets.some(a=>a.availableYear>baseYear);
   const mixed=initial&&restricted;
   return {...common,year:r.year,openingAvailable:mixed?missing():initial?r.opening:subtract(r.opening,r.release),openingIncludingRelease:r.opening,openingRestricted:missing(),releasedRestricted:mixed?missing():initial?exact(0):r.release,initialAvailableDesignation:mixed?missing():initial?r.release:exact(0),totalAllocationInflow:r.release,releaseClassification:mixed?'MIXED_NOT_SEPARATELY_AVAILABLE':initial?'INITIAL_AVAILABLE_DESIGNATION':'RESTRICTED_OR_NO_RELEASE',priorRestrictedGrowth:r.priorRestrictedGrowth,contributions:r.contributions,periodGrowth:r.investmentGrowth,feeAmount:missing(),yearCost:r.need,tuitionAndOtherNeeds:r.need,closingAvailable:r.closing,closingRestricted:missing(),unfundedNeed:r.gap,cumulativeUnfunded:r.unmetToDate,scenarioRef:envelope.scenarioDigest,goalRef:modelType==='RETIREMENT_FUNDING'?'RETIREMENT':'EDUCATION',ownershipAndAllocationRefs:m.allocations||[]};
  }
  return {...r,...common};
 });
 return {modelType,eligible:m.eligible,rows,...common,issues:[],allocations:m.allocations||[],assumptions:m.assumptions||[],formula:m.formula};
}
