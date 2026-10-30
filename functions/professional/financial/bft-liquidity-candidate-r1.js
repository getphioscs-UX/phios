// Additive professional-local compositions over the existing FCR arithmetic.
// No ledger, permission decision, production activation or product recommendation.
import {exact,unknown,add,subtract,divide,scale,isUnknown} from '../../financial/calculation-runtime/range-arithmetic.js';
export const BFT_FORMULA_VERSION='BFT-R1-LOCAL-COMPOSITIONS-v1';
const validDate=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));
export function financialFact(f,context,{average=false,assumption=false}={}){
 if(!f)return unknown('MISSING_INPUT');
 if(!context?.subjectId||!/^[A-Z]{3}$/.test(context.currency||'')||!context.reportingPeriod||!['ACCRUAL','CASH'].includes(context.accountingBasis))return unknown('REPORTING_CONTEXT_REQUIRED');
 if(Array.isArray(f.sourceValues)&&new Set(f.sourceValues).size>1||f.reviewStatus==='SOURCE_CONFLICT')return unknown('SOURCE_CONFLICT');
 if(!f.subjectId||f.subjectId!==context.subjectId||f.ownerAttribution!==context.subjectId)return unknown('ATTRIBUTION_MISMATCH');
 if(f.currency!==context.currency||f.reportingPeriod!==context.reportingPeriod||f.accountingBasis!==context.accountingBasis)return unknown('CURRENCY_PERIOD_OR_BASIS_MISMATCH');
 if(!f.sourceRef||!validDate(f.sourceDate)||!f.formulaVersion||f.unit!=='CURRENCY_MINOR'||!Number.isSafeInteger(f.value)||Math.abs(f.value)>1e12)return unknown('INPUT_UNVERIFIED');
 if(!['SOURCE_VERIFIED','SYNTHETIC_VERIFIED',...(assumption?['ASSUMPTION_ONLY']:[])].includes(f.reviewStatus))return unknown('INPUT_UNVERIFIED');
 if(average&&f.balanceBasis!=='PERIOD_AVERAGE')return unknown('AVERAGE_BALANCE_REQUIRED');
 return exact(f.value,{sourceRefs:[f.sourceRef],synthetic:f.reviewStatus==='SYNTHETIC_VERIFIED',reviewStatus:f.reviewStatus});
}
const known=v=>!isUnknown(v),val=v=>known(v)?v.value:null;
const refs=fs=>[...new Set(fs.filter(Boolean).map(f=>f.sourceRef).filter(Boolean))];
function metric(id,value,formula,facts,context,unit='CURRENCY_MINOR'){
 return {id,value:val(value),state:known(value)?'CALCULATED':'UNAVAILABLE',missingDataStatus:known(value)?null:value.reason,subjectId:context.subjectId,ownerAttribution:context.subjectId,currency:context.currency,reportingPeriod:context.reportingPeriod,accountingBasis:context.accountingBasis,unit,formula,formulaVersion:BFT_FORMULA_VERSION,sourceRefs:refs(facts),sourceDates:facts.filter(Boolean).map(f=>f.sourceDate),reviewStatus:'PROFESSIONAL_REVIEW_REQUIRED'};
}
export const BFT_DIAGNOSIS_CATEGORIES=Object.freeze(['PROFITABILITY_GAP','CASH_COLLECTION_GAP','INVENTORY_WORKING_CAPITAL_GAP','DEBT_SERVICE_PRESSURE','OWNER_DISTRIBUTION_CONSTRAINT','FAMILY_SPENDING_PRESSURE','INSURANCE_RISK_PROTECTION_GAP','BUSINESS_CONTINUITY_RISK','OPERATIONAL_INEFFICIENCY','INSUFFICIENT_EVIDENCE']);
export function diagnoseOwnerLiquidity(packet){
 const {business,owner,family}=packet;
 if(!business?.subjectId||!owner?.subjectId||!family?.subjectId||new Set([business.subjectId,owner.subjectId,family.subjectId]).size!==3)throw Error('SEPARATE_SUBJECT_CONTEXTS_REQUIRED');
 if([owner,family].some(c=>c.currency!==business.currency||c.reportingPeriod!==business.reportingPeriod)||owner.accountingBasis!==family.accountingBasis)throw Error('CROSS_SUBJECT_CONTEXT_MISMATCH');
 if(!packet.relationship?.sourceRef||packet.relationship.ownerSubjectId!==owner.subjectId||packet.relationship.businessSubjectId!==business.subjectId||packet.relationship.familySubjectId!==family.subjectId)throw Error('AUTHORIZED_RELATIONSHIP_REQUIRED');
 const f=business.facts||{},get=(id,options)=>financialFact(f[id],business,options),gross=subtract(get('revenue'),get('costOfSales')),op=subtract(gross,get('operatingExpenses'));
 const wc=subtract(get('currentAssets'),get('currentLiabilities')),margin=divide(gross,get('revenue'));
 const days=Number.isInteger(business.periodDays)&&business.periodDays>0&&business.periodDays<=366?business.periodDays:null;
 const cycle=(balance,denominator)=>days===null?unknown('PERIOD_DAYS_REQUIRED'):scale(divide(get(balance,{average:true}),get(denominator)),days);
 const dio=cycle('averageInventory','costOfSales'),dso=cycle('averageReceivables','creditSales'),dpo=cycle('averagePayables','creditPurchases'),ccc=subtract(add(dio,dso),dpo);
 const cashAfter=business.cashFlowDefinition==='OPERATING_BEFORE_FINANCING_AND_INVESTING'&&business.debtRepaymentBasis==='PRINCIPAL_ONLY'?subtract(subtract(get('operatingCashFlow'),get('loanPrincipalPayments')),get('capitalExpenditure')):unknown('CASH_FLOW_CLASSIFICATION_REQUIRED');
 const businessCash=subtract(subtract(get('closingCash'),get('restrictedCash')),get('minimumOperatingReserve'));
 const transfers=packet.ownerReceipts||[];
 const paid=transfers.map(t=>{
  if(t.businessSubjectId!==business.subjectId||t.ownerSubjectId!==owner.subjectId||t.settled!==true||!t.authorizationRef)return unknown('OWNER_TRANSFER_UNVERIFIED');
  if(business.legalForm==='SOLE_PROPRIETORSHIP'&&t.kind!=='DRAWINGS'||business.legalForm==='LIMITED_COMPANY'&&!['SALARY','DIVIDEND'].includes(t.kind)||!['SOLE_PROPRIETORSHIP','LIMITED_COMPANY'].includes(business.legalForm))return unknown('LEGAL_FORM_REVIEW_REQUIRED');
  if(t.kind==='DIVIDEND'&&!t.distributionApprovalRef)return unknown('DISTRIBUTION_APPROVAL_REQUIRED');
  return financialFact(t.fact,owner);
 });
 const receipts=paid.length?add(...paid):unknown('OWNER_RECEIPTS_NOT_SUPPLIED');
 const own=owner.facts||{},fam=family.facts||{};
 let requirements=add(financialFact(own.personalDebtPayments,owner),financialFact(own.recurringCommitments,owner),financialFact(fam.householdExpenses,family));
 if(packet.requirementsBoundary!=='NON_OVERLAPPING_EXCLUDING_DUPLICATE_DEBT')requirements=unknown('REQUIREMENTS_OVERLAP_UNVERIFIED');
 const income=add(receipts,financialFact(own.otherIncome,owner)),gap=subtract(income,requirements);
 const metrics=[metric('grossProfit',gross,'Revenue - Cost of Sales',[f.revenue,f.costOfSales],business),metric('grossMargin',margin,'Gross Profit / Revenue',[f.revenue,f.costOfSales],business,'RATIO'),metric('operatingProfit',op,'Gross Profit - Operating Expenses',[f.revenue,f.costOfSales,f.operatingExpenses],business),metric('netProfit',get('netProfit'),'Reported source value; not inferred distributable profit',[f.netProfit],business),metric('workingCapital',wc,'Current Assets - Current Liabilities',[f.currentAssets,f.currentLiabilities],business),metric('cashChange',subtract(get('closingCash'),get('openingCash')),'Closing Cash - Opening Cash; not Operating Cash Flow',[f.closingCash,f.openingCash],business),metric('operatingCashFlow',get('operatingCashFlow'),'Reported operating-only source value',[f.operatingCashFlow],business),metric('cashAfterDebtAndCapex',cashAfter,'Operating Cash Flow - loan principal - CAPEX, only with explicit cash-flow classification',[f.operatingCashFlow,f.loanPrincipalPayments,f.capitalExpenditure],business),metric('businessCashAboveDeclaredReserve',businessCash,'Closing Cash - Restricted Cash - Declared Operating Reserve; not withdrawable owner cash',[f.closingCash,f.restrictedCash,f.minimumOperatingReserve],business),metric('DIO',dio,'Average Inventory / Cost of Sales × period days',[f.averageInventory,f.costOfSales],business,'DAYS'),metric('DSO',dso,'Average Trade Receivables / Credit Sales × period days',[f.averageReceivables,f.creditSales],business,'DAYS'),metric('DPO',dpo,'Average Trade Payables / Credit Purchases × period days',[f.averagePayables,f.creditPurchases],business,'DAYS'),metric('cashConversionCycle',ccc,'DIO + DSO - DPO; common period, currency and basis',[f.averageInventory,f.costOfSales,f.averageReceivables,f.creditSales,f.averagePayables,f.creditPurchases],business,'DAYS'),metric('ownerReceivedCash',receipts,'Settled, source-bound permitted receipts; never Net Profit × shareholding',transfers.map(t=>t.fact),owner),metric('ownerFamilyLiquidityGap',gap,'Settled owner receipts + other income - non-overlapping personal debt, commitments and authorized household requirements',[...transfers.map(t=>t.fact),own.otherIncome,own.personalDebtPayments,own.recurringCommitments,fam.householdExpenses],owner)];
 const byId=Object.fromEntries(metrics.map(m=>[m.id,m])),findings=[];
 const finding=(category,observed,missing=[])=>findings.push({category,observedFact:observed,source:observed.flatMap(id=>byId[id]?.sourceRefs||[]),calculation:observed.map(id=>byId[id]),relevantConstraint:'Source, period, attribution and operating boundary must be confirmed',interpretation:'SOURCE_BOUND_INVESTIGATION_NOT_PERSONAL_JUDGMENT',alternativeExplanations:['Timing or classification differences','Temporary operating requirements','Incomplete source evidence'],missingEvidence:missing,recommendedInvestigation:'Reconcile source statements and obtain independent professional review',reviewStatus:'PROFESSIONAL_REVIEW_REQUIRED'});
 if(val(gross)<0&&known(gross)||val(op)<0&&known(op))finding('PROFITABILITY_GAP',['grossProfit','operatingProfit']);
 if(known(op)&&known(get('operatingCashFlow'))&&get('operatingCashFlow').value<op.value)finding('CASH_COLLECTION_GAP',['operatingProfit','operatingCashFlow','DSO']);
 if(known(get('averageInventory'))&&get('averageInventory').value>0)finding('INVENTORY_WORKING_CAPITAL_GAP',['workingCapital','DIO'],['Verify whether inventory is required or avoidable; no industry target assumed']);
 if(known(cashAfter)&&cashAfter.value<0)finding('DEBT_SERVICE_PRESSURE',['cashAfterDebtAndCapex']);
 if(known(gap)&&gap.value<0){finding('OWNER_DISTRIBUTION_CONSTRAINT',['ownerReceivedCash','ownerFamilyLiquidityGap']);finding('FAMILY_SPENDING_PRESSURE',['ownerFamilyLiquidityGap']);}
 if(packet.risk?.coverageNeedVerified===true&&packet.risk.coverageSubjectId===owner.subjectId&&packet.risk.currency===owner.currency&&packet.risk.reportingPeriod===owner.reportingPeriod&&Number.isSafeInteger(packet.risk.coverageNeedMinor)&&Number.isSafeInteger(packet.risk.coverageMinor)&&packet.risk.coverageNeedMinor>packet.risk.coverageMinor&&packet.risk.sourceRef)finding('INSURANCE_RISK_PROTECTION_GAP',[],['LICENSED_ADVISOR_REVIEW_REQUIRED; no amount or product is recommended']);
 if(packet.risk?.keyPersonExposure===true&&packet.risk.sourceRef)finding('BUSINESS_CONTINUITY_RISK',[],['Verify dependency and succession authority']);
 if(packet.processEvidence?.approvedVarianceRef)finding('OPERATIONAL_INEFFICIENCY',[],['Investigate root causes; variance is not proof of employee fault']);
 const missing=metrics.filter(m=>m.state==='UNAVAILABLE');if(missing.length)finding('INSUFFICIENT_EVIDENCE',missing.map(m=>m.id),missing.map(m=>m.missingDataStatus));
 const scenarios=[{id:'A',title:'Maintain current structure',state:'BASELINE',cashImpactMinor:0,assumptions:[],guaranteed:false}];
 for(const s of packet.scenarios||[]){
  if(!['B','C','D','E','F','G'].includes(s.id))throw Error('SCENARIO_TYPE_INVALID');
  const applicable=s.id==='B'?known(dso):s.id==='C'?known(dio):s.id==='D'?known(op):s.id==='E'?known(cashAfter):s.id==='F'?known(receipts):Boolean(packet.risk?.sourceRef);
  if(!applicable)continue;
  const legalReview=['E','F','G'].includes(s.id),complete=Number.isSafeInteger(s.assumedCashChangeMinor)&&Math.abs(s.assumedCashChangeMinor)<=1e12&&Number.isSafeInteger(s.implementationCostMinor)&&s.implementationCostMinor>=0&&s.implementationCostMinor<=1e12&&s.timing&&s.responsibleParty&&s.sourceRef&&Array.isArray(s.risks)&&s.risks.length;
  scenarios.push({...s,requiredChanges:s.requiredChanges||'REVIEW_REQUIRED',timing:s.timing||'UNVERIFIED',responsibleParty:s.responsibleParty||'NOT_ASSIGNED',implementationCostMinor:complete?s.implementationCostMinor:null,risks:s.risks||['INDEPENDENT_REVIEW_REQUIRED'],dataConfidence:'ASSUMPTION_ONLY_NOT_A_PROMISE',state:legalReview?'PROFESSIONAL_REVIEW_REQUIRED':complete?'ASSUMPTION_ONLY':'UNAVAILABLE',cashImpactMinor:!legalReview&&complete?subtract(exact(s.assumedCashChangeMinor),exact(s.implementationCostMinor)).value:null,inputAssumptions:complete?[{changeMinor:s.assumedCashChangeMinor,costMinor:s.implementationCostMinor,sourceRef:s.sourceRef}]:[],guaranteed:false,factsMutated:false});
 }
 return {schemaVersion:'BFT-R1-LOCAL-DIAGNOSIS-v1',synthetic:packet.synthetic===true,businessSubjectId:business.subjectId,ownerSubjectId:owner.subjectId,familySubjectId:family.subjectId,reportingPeriod:business.reportingPeriod,currency:business.currency,legalForm:business.legalForm,businessIsSeparateLegalPerson:business.legalForm==='SOLE_PROPRIETORSHIP'?false:null,metrics,findings,scenarios,risk:{directLiabilities:packet.risk?.directLiabilities||[],contingentGuarantees:packet.risk?.guarantees||[],guaranteesCountedAsDirectDebt:false,productRecommendation:null,insuranceReview:'LICENSED_ADVISOR_REVIEW_REQUIRED'},professionalReview:'REQUIRED',productionAdmission:false};
}
export function calculateKpiVariance({definition,target,actual}){
 if(!definition?.id||!definition.definition||!definition.formula||!definition.unit||!definition.sourceRef||!definition.owner||definition.approvalStatus!=='APPROVED')return {state:'UNAVAILABLE',reason:'APPROVED_KPI_DEFINITION_REQUIRED'};
 if(!target||!actual||!target.sourceRef||!actual.sourceRef||target.period!==actual.period||target.unit!==definition.unit||actual.unit!==definition.unit||!Number.isFinite(target.value)||!Number.isFinite(actual.value))return {state:'UNAVAILABLE',reason:'COMPARABLE_SOURCE_VALUES_REQUIRED'};
 return {state:'CALCULATED',kpiId:definition.id,target:target.value,actual:actual.value,variance:subtract(exact(actual.value),exact(target.value)).value,unit:definition.unit,period:actual.period,sourceRefs:[target.sourceRef,actual.sourceRef],formulaVersion:BFT_FORMULA_VERSION,score:null,scoreStatus:'APPROVED_WEIGHTS_AND_SCORE_RULES_REQUIRED',rootCause:'INVESTIGATION_REQUIRED',sourceMutated:false};
}
export function calculateInstitutionBudget(input){
 const values=['budgetMinor','spentMinor','commitmentsMinor','restrictedMinor'];
 if(!input.projectId||!input.sourceRef||!/^[A-Z]{3}$/.test(input.currency||'')||!input.reportingPeriod||!validDate(input.sourceDate)||input.restrictedBasis!=='REMAINING_UNCOMMITTED_RESTRICTION'||values.some(k=>!Number.isSafeInteger(input[k])||input[k]<0||input[k]>1e12))return{state:'UNAVAILABLE',reason:'PROJECT_BUDGET_EVIDENCE_REQUIRED'};
 return {state:'CALCULATED',projectId:input.projectId,currency:input.currency,reportingPeriod:input.reportingPeriod,sourceDate:input.sourceDate,unit:'CURRENCY_MINOR',remainingBudgetMinor:subtract(subtract(exact(input.budgetMinor),exact(input.spentMinor)),exact(input.commitmentsMinor)).value,unrestrictedUncommittedMinor:subtract(subtract(subtract(exact(input.budgetMinor),exact(input.restrictedMinor)),exact(input.spentMinor)),exact(input.commitmentsMinor)).value,sourceRef:input.sourceRef,formulaVersion:BFT_FORMULA_VERSION,restrictionPolicy:input.restrictionPolicy||'UNVERIFIED_RESTRICTED_USE_FORBIDDEN',productRecommendation:null};
}
